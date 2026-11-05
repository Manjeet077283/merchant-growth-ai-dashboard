from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.config import settings
from app.database import get_db
from app.models import Transaction
from app.schemas import (
    TransactionResponse,
    TransactionListResponse,
    RefundRequest
)

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=TransactionListResponse)
def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    status: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Transaction)
    if not settings.DEMO_MODE:
        q = q.filter(Transaction.is_demo == False)

    if status and status.upper() != "ALL":
        q = q.filter(Transaction.status == status.upper())

    if query and query.strip():
        term = f"%{query.strip()}%"
        q = q.filter(
            or_(
                Transaction.transaction_id.ilike(term),
                Transaction.paypal_order_id.ilike(term),
                Transaction.paypal_capture_id.ilike(term),
                Transaction.customer_name.ilike(term),
                Transaction.customer_email.ilike(term)
            )
        )

    total = q.count()
    txns = q.order_by(Transaction.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return TransactionListResponse(
        total=total,
        page=page,
        page_size=page_size,
        transactions=[
            TransactionResponse(
                id=t.id,
                transaction_id=t.transaction_id,
                paypal_order_id=t.paypal_order_id,
                paypal_capture_id=t.paypal_capture_id,
                customer_name=t.customer_name,
                customer_email=t.customer_email,
                amount=t.amount,
                currency=t.currency,
                status=t.status,
                fee=t.fee,
                net_amount=t.net_amount,
                payment_method=t.payment_method,
                items=t.items,
                refunded_amount=t.refunded_amount,
                refund_reason=t.refund_reason,
                is_demo=t.is_demo,
                created_at=t.created_at,
                updated_at=t.updated_at
            )
            for t in txns
        ]
    )


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(
        or_(Transaction.transaction_id == transaction_id, Transaction.id == int(transaction_id) if transaction_id.isdigit() else False)
    ).first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return TransactionResponse(
        id=txn.id,
        transaction_id=txn.transaction_id,
        paypal_order_id=txn.paypal_order_id,
        paypal_capture_id=txn.paypal_capture_id,
        customer_name=txn.customer_name,
        customer_email=txn.customer_email,
        amount=txn.amount,
        currency=txn.currency,
        status=txn.status,
        fee=txn.fee,
        net_amount=txn.net_amount,
        payment_method=txn.payment_method,
        items=txn.items,
        refunded_amount=txn.refunded_amount,
        refund_reason=txn.refund_reason,
        is_demo=txn.is_demo,
        created_at=txn.created_at,
        updated_at=txn.updated_at
    )


@router.post("/{transaction_id}/refund", response_model=TransactionResponse)
def refund_transaction(
    transaction_id: str,
    payload: RefundRequest,
    db: Session = Depends(get_db)
):
    txn = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if txn.status == "REFUNDED":
        raise HTTPException(status_code=400, detail="Transaction is already refunded")

    refund_val = payload.amount if payload.amount is not None else txn.amount
    if refund_val > txn.amount:
        raise HTTPException(status_code=400, detail="Refund amount cannot exceed transaction amount")

    txn.status = "REFUNDED"
    txn.refunded_amount = refund_val
    txn.refund_reason = payload.reason
    txn.net_amount = 0.0

    db.commit()
    db.refresh(txn)

    return TransactionResponse(
        id=txn.id,
        transaction_id=txn.transaction_id,
        paypal_order_id=txn.paypal_order_id,
        paypal_capture_id=txn.paypal_capture_id,
        customer_name=txn.customer_name,
        customer_email=txn.customer_email,
        amount=txn.amount,
        currency=txn.currency,
        status=txn.status,
        fee=txn.fee,
        net_amount=txn.net_amount,
        payment_method=txn.payment_method,
        items=txn.items,
        refunded_amount=txn.refunded_amount,
        refund_reason=txn.refund_reason,
        is_demo=txn.is_demo,
        created_at=txn.created_at,
        updated_at=txn.updated_at
    )
