from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.analytics_service import get_dashboard_metrics
from app.schemas import DashboardMetricsResponse, MerchantProfileSchema, MerchantProfileUpdate
from app.models import MerchantProfile
from app.seed_data import seed_database, clear_demo_transactions

router = APIRouter(prefix="/api/metrics", tags=["Metrics"])

@router.get("/summary", response_model=DashboardMetricsResponse)
def get_metrics_summary(days: int = Query(30, ge=1, le=90), db: Session = Depends(get_db)):
    return get_dashboard_metrics(db, days=days)

@router.get("/profile", response_model=MerchantProfileSchema)
def get_profile(db: Session = Depends(get_db)):
    profile = db.query(MerchantProfile).first()
    if not profile:
        profile = MerchantProfile()
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=MerchantProfileSchema)
def update_profile(payload: MerchantProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(MerchantProfile).first()
    if not profile:
        profile = MerchantProfile()
        db.add(profile)

    if payload.business_name is not None:
        profile.business_name = payload.business_name
    if payload.owner_name is not None:
        profile.owner_name = payload.owner_name
    if payload.category is not None:
        profile.category = payload.category
    if payload.currency is not None:
        profile.currency = payload.currency
    if payload.monthly_target is not None:
        profile.monthly_target = payload.monthly_target
    if payload.paypal_email is not None:
        profile.paypal_email = payload.paypal_email

    db.commit()
    db.refresh(profile)
    return profile

@router.post("/reset-demo")
def reset_demo_data(db: Session = Depends(get_db)):
    seed_database(db, force_reset=True)
    return {"message": "Demo data successfully reset to fresh sample state"}

@router.post("/clear-demo")
def clear_demo_data(db: Session = Depends(get_db)):
    deleted = clear_demo_transactions(db)
    return {"message": f"Purged {deleted} demo records. Database is now operating on real production data."}

