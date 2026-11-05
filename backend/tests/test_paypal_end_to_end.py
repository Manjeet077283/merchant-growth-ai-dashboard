import pytest
from fastapi import HTTPException
from app.database import SessionLocal, Base, engine
from app.models import Transaction
from app.routers.paypal import create_paypal_order, capture_paypal_order, cancel_paypal_order, get_order_status
from app.schemas import (
    PayPalCreateOrderRequest,
    PayPalCaptureOrderRequest,
    PayPalCancelOrderRequest,
    OrderItemSchema
)
from app.config import settings

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)

def test_create_order_empty_cart_validation():
    req = PayPalCreateOrderRequest(items=[])
    with pytest.raises(HTTPException) as exc:
        create_paypal_order(payload=req)
    assert exc.value.status_code == 400
    assert "without line items" in exc.value.detail or "empty cart" in exc.value.detail

def test_create_order_with_valid_items():
    req = PayPalCreateOrderRequest(
        items=[
            OrderItemSchema(
                sku="COF-ETH-01",
                name="Ethiopia Yirgacheffe",
                qty=1,
                unit_price=22.0,
                category="Whole Bean Coffee"
            )
        ],
        currency="USD",
        customer_name="Sarah Jenkins",
        customer_email="sarah.jenkins@sandbox.demo"
    )
    res = create_paypal_order(payload=req)
    assert res.order_id
    assert res.amount == 22.0
    assert res.currency == "USD"
    assert res.status in ("CREATED", "COMPLETED")

def test_order_status_check():
    req = PayPalCreateOrderRequest(
        items=[
            OrderItemSchema(
                sku="ACC-MUG-01",
                name="Ceramic Mug",
                qty=2,
                unit_price=32.0,
                category="Brew Gear"
            )
        ],
        currency="USD"
    )
    created = create_paypal_order(payload=req)
    status_res = get_order_status(created.order_id)
    assert status_res["order_id"] == created.order_id
    assert "status" in status_res

def test_cancel_order_flow():
    req = PayPalCreateOrderRequest(
        items=[
            OrderItemSchema(
                sku="COF-COL-02",
                name="Colombia Huila",
                qty=1,
                unit_price=19.5,
                category="Beans"
            )
        ],
        currency="USD"
    )
    created = create_paypal_order(payload=req)
    cancel_res = cancel_paypal_order(
        payload=PayPalCancelOrderRequest(order_id=created.order_id, reason="Buyer abandoned cart")
    )
    assert cancel_res.status == "CANCELLED"
    assert cancel_res.order_id == created.order_id

    # Verify no transaction was recorded in the database
    db = SessionLocal()
    try:
        txn = db.query(Transaction).filter(Transaction.paypal_order_id == created.order_id).first()
        assert txn is None
    finally:
        db.close()

def test_duplicate_capture_prevention():
    db = SessionLocal()
    order_id = "ORDER-DUP-TEST-999"
    capture_id = "CAP-DUP-TEST-999"
    try:
        # Seed an existing captured transaction
        existing = Transaction(
            transaction_id="TXN-DUP-001",
            paypal_order_id=order_id,
            paypal_capture_id=capture_id,
            customer_name="Existing Buyer",
            customer_email="buyer@test.demo",
            amount=50.0,
            currency="USD",
            status="COMPLETED",
            fee=1.75,
            net_amount=48.25,
            payment_method="PAYPAL_SANDBOX",
            items_json='[]',
            is_demo=False
        )
        db.add(existing)
        db.commit()

        # Attempt to capture the same order again
        with pytest.raises(HTTPException) as exc:
            capture_paypal_order(
                payload=PayPalCaptureOrderRequest(order_id=order_id),
                db=db
            )
        assert exc.value.status_code == 400
        assert "already been captured" in exc.value.detail or "Duplicate" in exc.value.detail
    finally:
        db.query(Transaction).filter(Transaction.paypal_order_id == order_id).delete()
        db.commit()
        db.close()

def test_instant_sample_checkout_lifecycle():
    db = SessionLocal()
    try:
        items = [
            OrderItemSchema(
                sku="COF-SAMPLE-01",
                name="Specialty Sample Roast",
                qty=1,
                unit_price=25.0,
                category="Whole Bean Coffee"
            )
        ]
        # Create explicit sample order
        create_req = PayPalCreateOrderRequest(
            items=items,
            currency="USD",
            customer_name="Test Shopper",
            customer_email="shopper@test.demo",
            is_sample=True
        )
        created = create_paypal_order(payload=create_req)
        assert created.order_id.startswith("ORDER-SAMPLE-")
        assert created.amount == 25.0

        # Capture sample order
        capture_req = PayPalCaptureOrderRequest(
            order_id=created.order_id,
            items=items,
            customer_name="Test Shopper",
            customer_email="shopper@test.demo"
        )
        captured = capture_paypal_order(payload=capture_req, db=db)
        assert captured.success is True
        assert captured.status == "COMPLETED"
        assert captured.amount == 25.0
        expected_fee = round(25.0 * 0.029 + 0.30, 2)
        assert captured.fee == expected_fee
        assert captured.net == round(25.0 - expected_fee, 2)

        # Verify transaction persisted to SQLite database ledger
        saved_txn = db.query(Transaction).filter(Transaction.paypal_order_id == created.order_id).first()
        assert saved_txn is not None
        assert saved_txn.is_demo is False
        assert saved_txn.amount == 25.0
    finally:
        db.query(Transaction).filter(Transaction.customer_email == "shopper@test.demo").delete()
        db.commit()
        db.close()
