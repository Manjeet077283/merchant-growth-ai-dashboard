import pytest
from fastapi import HTTPException
from app.database import SessionLocal, Base, engine
from app.seed_data import seed_database
from app.routers.health import get_health
from app.routers.metrics import get_metrics_summary, get_profile, update_profile, clear_demo_data, reset_demo_data
from app.routers.transactions import list_transactions, get_transaction, refund_transaction
from app.routers.paypal import get_paypal_config, create_paypal_order, capture_paypal_order, cancel_paypal_order
from app.routers.ai_agent import chat_with_agent, get_recommendations
from app.schemas import (
    PayPalCreateOrderRequest,
    PayPalCaptureOrderRequest,
    PayPalCancelOrderRequest,
    RefundRequest,
    OrderItemSchema,
    AiChatRequest,
    MerchantProfileUpdate
)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db, force_reset=False)
    db.close()

def test_health_and_config():
    health = get_health()
    assert health["status"] == "ok"
    assert "version" in health
    assert "demo_mode" in health

    config = get_paypal_config()
    assert config.mode == "sandbox"
    assert config.currency == "USD"
    # Never expose client secret
    assert not hasattr(config, "client_secret")

def test_metrics_calculation_and_edge_cases():
    db = SessionLocal()
    try:
        # Test 7 days, 30 days, 90 days
        m7 = get_metrics_summary(days=7, db=db)
        m30 = get_metrics_summary(days=30, db=db)
        m90 = get_metrics_summary(days=90, db=db)

        assert m30.kpis.gross_sales > 0
        assert m30.kpis.captured_payments > 0
        assert m30.kpis.order_count > 0
        assert m90.kpis.gross_sales >= m30.kpis.gross_sales
        assert len(m30.revenue_trends) > 0
        assert len(m30.category_breakdown) > 0
    finally:
        db.close()

def test_transaction_search_and_pagination():
    db = SessionLocal()
    try:
        # Page 1
        p1 = list_transactions(page=1, page_size=5, status=None, query=None, db=db)
        assert p1.page == 1
        assert p1.page_size == 5
        assert len(p1.transactions) == 5
        assert p1.total > 5

        # Page 2
        p2 = list_transactions(page=2, page_size=5, status=None, query=None, db=db)
        assert p2.page == 2
        assert len(p2.transactions) == 5
        # Ensure pages return different records
        assert p1.transactions[0].transaction_id != p2.transactions[0].transaction_id

        # Search by customer name
        search_target = p1.transactions[0].customer_name.split()[0]
        search_res = list_transactions(page=1, page_size=10, status=None, query=search_target, db=db)
        assert len(search_res.transactions) > 0
        assert any(search_target.lower() in t.customer_name.lower() for t in search_res.transactions)

        # Status filter
        completed = list_transactions(page=1, page_size=10, status="COMPLETED", query=None, db=db)
        assert all(t.status == "COMPLETED" for t in completed.transactions)
    finally:
        db.close()

def test_transaction_not_found():
    db = SessionLocal()
    try:
        with pytest.raises(HTTPException) as exc:
            get_transaction(transaction_id="TXN-NON-EXISTENT-99999", db=db)
        assert exc.value.status_code == 404
    finally:
        db.close()

def test_invalid_refunds():
    db = SessionLocal()
    try:
        completed = list_transactions(page=1, page_size=1, status="COMPLETED", query=None, db=db)
        assert len(completed.transactions) > 0
        target = completed.transactions[0]

        # 1. Refund amount exceeding transaction amount
        with pytest.raises(HTTPException) as exc1:
            refund_transaction(
                transaction_id=target.transaction_id,
                payload=RefundRequest(reason="Excessive", amount=target.amount + 500.0),
                db=db
            )
        assert exc1.value.status_code == 400

        # 2. Refund on ghost transaction ID
        with pytest.raises(HTTPException) as exc2:
            refund_transaction(
                transaction_id="TXN-GHOST-ID-000",
                payload=RefundRequest(reason="Test", amount=10.0),
                db=db
            )
        assert exc2.value.status_code == 404
    finally:
        db.close()

def test_paypal_order_lifecycle():
    db = SessionLocal()
    try:
        # 1. Create Order with items
        req = PayPalCreateOrderRequest(
            items=[
                OrderItemSchema(
                    sku="TEST-SKU-99",
                    name="Audit Specialty Batch",
                    qty=2,
                    unit_price=24.50,
                    category="Beans"
                )
            ],
            currency="USD",
            customer_name="Pre-Deployment Tester",
            customer_email="tester@paypal-audit.demo"
        )
        created = create_paypal_order(payload=req)
        assert created.order_id
        assert created.amount == 49.00
        assert created.status in ("CREATED", "COMPLETED")

        # 2. Capture Order
        cap_req = PayPalCaptureOrderRequest(
            order_id=created.order_id,
            customer_name="Pre-Deployment Tester",
            customer_email="tester@paypal-audit.demo"
        )
        captured = capture_paypal_order(payload=cap_req, db=db)
        assert captured.success is True
        assert captured.status == "COMPLETED"
        assert captured.amount == 49.00
        assert captured.net < 49.00
        assert captured.transaction_id.startswith("TXN-")

        # 3. Verify in database
        saved_txn = get_transaction(transaction_id=captured.transaction_id, db=db)
        assert saved_txn.amount == 49.00
        assert saved_txn.customer_name == "Pre-Deployment Tester"
        assert saved_txn.status == "COMPLETED"

        # 4. Empty items validation
        with pytest.raises(HTTPException) as exc_empty:
            create_paypal_order(payload=PayPalCreateOrderRequest(items=[]))
        assert exc_empty.value.status_code == 400

        # 5. Cancellation
        cancelled = cancel_paypal_order(payload=PayPalCancelOrderRequest(order_id="ORDER-CANCEL-AUDIT"))
        assert cancelled.status == "CANCELLED"
    finally:
        db.close()

def test_grounded_ai_chat_all_five_questions():
    db = SessionLocal()
    try:
        questions = [
            ("What is my total revenue?", "Total Revenue Breakdown"),
            ("Why did my sales decrease?", "Root-Cause Analysis"),
            ("Which days had the highest sales?", "Peak Sales Days"),
            ("What are my top-performing products?", "Top Revenue Generators"),
            ("How can I increase repeat purchases?", "Repeat Purchase Strategy")
        ]
        for query, expected_snippet in questions:
            req = AiChatRequest(message=query, history=[])
            res = chat_with_agent(payload=req, db=db)
            assert res.reply
            assert expected_snippet in res.reply
            assert len(res.citations) > 0
            assert len(res.suggested_actions) > 0
            assert len(res.suggested_questions) == 5
    finally:
        db.close()

def test_grounded_ai_chat_hindi():
    db = SessionLocal()
    try:
        # Hindi question 1 (Devanagari)
        req_devanagari = AiChatRequest(message="मेरा कुल रेवेन्यू कितना है?", history=[])
        res1 = chat_with_agent(payload=req_devanagari, db=db)
        assert res1.reply
        assert "रेवेन्यू" in res1.reply or "बिक्री" in res1.reply

        # Hindi question 2 (Transliterated)
        req_translit = AiChatRequest(message="meri sales kyu kam hui?", history=[])
        res2 = chat_with_agent(payload=req_translit, db=db)
        assert res2.reply
        assert "बिक्री" in res2.reply or "गिरावट" in res2.reply
    finally:
        db.close()

def test_growth_recommendations_structure():
    db = SessionLocal()
    try:
        recs = get_recommendations(db=db)
        assert recs.overall_health_score >= 70
        assert len(recs.recommendations) >= 4
        assert len(recs.summary) > 20
        # Check categories
        categories = [r.category for r in recs.recommendations]
        assert "Basket Size & Upsell" in categories
        assert "Payment Conversion" in categories
    finally:
        db.close()

def test_merchant_profile_update():
    db = SessionLocal()
    try:
        updated = update_profile(
            payload=MerchantProfileUpdate(
                business_name="Green Bean Roastery",
                owner_name="Sarah Miller",
                monthly_target=35000.0
            ),
            db=db
        )
        assert updated.business_name == "Green Bean Roastery"
        assert updated.owner_name == "Sarah Miller"
        assert updated.monthly_target == 35000.0

        # Verify persistence
        fetched = get_profile(db=db)
        assert fetched.business_name == "Green Bean Roastery"
    finally:
        db.close()

def test_clear_demo_and_reset():
    db = SessionLocal()
    try:
        # Clear demo transactions
        clear_res = clear_demo_data(db=db)
        assert "Purged" in clear_res["message"]

        # Now re-populate demo transactions
        reset_res = reset_demo_data(db=db)
        assert "successfully reset" in reset_res["message"]
    finally:
        db.close()

