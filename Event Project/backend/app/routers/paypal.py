from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.services.paypal_service import paypal_service
from app.schemas import (
    PayPalCreateOrderRequest,
    PayPalCreateOrderResponse,
    PayPalCaptureOrderRequest,
    PayPalCaptureOrderResponse,
    PayPalConfigResponse,
    PayPalCancelOrderRequest,
    PayPalCancelOrderResponse
)

router = APIRouter(prefix="/api/paypal", tags=["PayPal"])

@router.get("/config", response_model=PayPalConfigResponse)
def get_paypal_config():
    is_live = paypal_service.is_configured
    return PayPalConfigResponse(
        client_id_configured=is_live,
        client_id=settings.PAYPAL_CLIENT_ID if is_live else None,
        mode=settings.PAYPAL_MODE,
        currency="USD",
        is_simulator=not is_live
    )

@router.post("/create-order", response_model=PayPalCreateOrderResponse)
def create_paypal_order(payload: PayPalCreateOrderRequest):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cannot create order without line items")

    items_list = [item.model_dump() for item in payload.items]
    res = paypal_service.create_order(
        items=items_list,
        currency=payload.currency,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email
    )

    return PayPalCreateOrderResponse(
        order_id=res["order_id"],
        status=res["status"],
        approval_url=res.get("approval_url"),
        currency=res["currency"],
        amount=res["amount"]
    )

@router.post("/capture-order", response_model=PayPalCaptureOrderResponse)
def capture_paypal_order(payload: PayPalCaptureOrderRequest, db: Session = Depends(get_db)):
    if not payload.order_id:
        raise HTTPException(status_code=400, detail="Order ID is required for capture")

    items_list = [item.model_dump() for item in payload.items] if payload.items else None

    result = paypal_service.capture_order(
        order_id=payload.order_id,
        db=db,
        items=items_list,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email
    )

    if not result.get("success", False):
        raise HTTPException(status_code=400, detail=result.get("message", "Payment capture failed"))

    return PayPalCaptureOrderResponse(**result)

@router.post("/cancel-order", response_model=PayPalCancelOrderResponse)
def cancel_paypal_order(payload: PayPalCancelOrderRequest):
    if not payload.order_id:
        raise HTTPException(status_code=400, detail="Order ID is required to cancel")
    res = paypal_service.cancel_order(order_id=payload.order_id, reason=payload.reason)
    return PayPalCancelOrderResponse(**res)
