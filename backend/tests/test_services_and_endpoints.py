import pytest
from app.database import SessionLocal, Base, engine
from app.seed_data import seed_database
from app.services.analytics_service import get_dashboard_metrics, get_grounded_business_context
from app.services.paypal_service import paypal_service
from app.services.ai_service import ai_service
from app.routers.health import get_health
from app.routers.metrics import get_metrics_summary, get_profile
from app.routers.transactions import list_transactions, get_transaction, refund_transaction
from app.routers.paypal import create_paypal_order, capture_paypal_order, cancel_paypal_order
from app.schemas import (
    PayPalCreateOrderRequest,
    PayPalCaptureOrderRequest,
    PayPalCancelOrderRequest,
    RefundRequest,
    OrderItemSchema
)
from fastapi import HTTPException

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db, force_reset=True)
    db.close()

def test_health_endpoint():
    res = get_health()
    assert res["status"] == "ok"
    assert "version" in res
    assert "demo_mode" in res

def test_metrics_service_and_endpoint():
    db = SessionLocal()
    try:
        metrics = get_metrics_summary(days=30, db=db)
        assert metrics.kpis.gross_sales > 0
        assert metrics.kpis.order_count > 0
        assert metrics.kpis.captured_payments > 0
        assert len(metrics.revenue_trends) > 0
        assert len(metrics.category_breakdown) > 0
        assert len(metrics.status_breakdown) > 0
    finally:
        db.close()

def test_merchant_profile_endpoint():
    db = SessionLocal()
    try:
        profile = get_profile(db=db)
        assert profile.business_name == "Artisan Coffee Roasters & Co."
        assert profile.currency == "USD"
    finally:
        db.close()

def test_transactions_listing_and_filter():
    db = SessionLocal()
    try:
        res = list_transactions(page=1, page_size=10, status=None, query=None, db=db)
        assert res.total >= 50
        assert len(res.transactions) == 10
        first_txn = res.transactions[0]
        detail = get_transaction(transaction_id=first_txn.transaction_id, db=db)
        assert detail.transaction_id == first_txn.transaction_id
        assert detail.amount > 0
    finally:
        db.close()

def test_growth_recommendations():
    db = SessionLocal()
    try:
        recs = ai_service.generate_growth_recommendations(db)
        assert recs.overall_health_score > 70
        assert len(recs.recommendations) >= 4
        assert any(r.category == "Basket Size & Upsell" for r in recs.recommendations)
    finally:
        db.close()

def test_paypal_order_create_and_capture():
    db = SessionLocal()
    try:
        # 1. Create Order via Router
        req = PayPalCreateOrderRequest(
            items=[
                OrderItemSchema(
                    sku="COF-ETH-01",
                    name="Ethiopia Yirgacheffe Single Origin",
                    qty=2,
                    unit_price=22.00,
                    category="Whole Bean"
                )
            ],
            currency="USD",
            customer_name="Hackathon Judge",
            customer_email="judge@paypal-hackathon.demo"
        )
        created = create_paypal_order(payload=req)
        assert created.order_id
        assert created.amount == 44.00

        # 2. Capture Order via Router
        cap_req = PayPalCaptureOrderRequest(
            order_id=created.order_id,
            customer_name="Hackathon Judge",
            customer_email="judge@paypal-hackathon.demo"
        )
        captured = capture_paypal_order(payload=cap_req, db=db)
        assert captured.success is True
        assert captured.status == "COMPLETED"
        assert captured.amount == 44.00
        assert captured.net < 44.00
        assert captured.transaction_id.startswith("TXN-")

        # 3. Verify recorded in DB
        txn = get_transaction(transaction_id=captured.transaction_id, db=db)
        assert txn.customer_name == "Hackathon Judge"
    finally:
        db.close()

def test_paypal_cancel_order():
    req = PayPalCancelOrderRequest(order_id="ORDER-TEST-CANCEL-123", reason="Buyer closed window")
    res = cancel_paypal_order(payload=req)
    assert res.success is True
    assert res.status == "CANCELLED"
    assert "ORDER-TEST-CANCEL-123" in res.message

def test_paypal_validation_empty_items():
    with pytest.raises(HTTPException) as exc:
        create_paypal_order(payload=PayPalCreateOrderRequest(items=[]))
    assert exc.value.status_code == 400

def test_grounded_ai_assistant():
    db = SessionLocal()
    try:
        response = ai_service.answer_merchant_query(
            query="Why did sales drop last Tuesday and what are my top products?",
            history=[],
            db=db
        )
        assert response.reply
        assert len(response.citations) > 0
        assert len(response.suggested_actions) > 0
        assert any(c.metric == "Gross Sales" for c in response.citations)
    finally:
        db.close()

def test_grounded_ai_assistant_hindi():
    db = SessionLocal()
    try:
        response = ai_service.answer_merchant_query(
            query="मेरा कुल रेवेन्यू कितना है?",
            history=[],
            db=db
        )
        assert response.reply
        assert "रेवेन्यू" in response.reply or "बिक्री" in response.reply
        assert len(response.citations) > 0
    finally:
        db.close()

def test_transaction_refund():
    db = SessionLocal()
    try:
        txns = list_transactions(page=1, page_size=5, status="COMPLETED", query=None, db=db)
        assert len(txns.transactions) > 0
        target = txns.transactions[0]

        res = refund_transaction(
            transaction_id=target.transaction_id,
            payload=RefundRequest(reason="Customer changed mind", amount=target.amount),
            db=db
        )
        assert res.status == "REFUNDED"
        assert res.refunded_amount == target.amount
    finally:
        db.close()
