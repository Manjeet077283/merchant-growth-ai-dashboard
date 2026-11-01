from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.analytics_service import get_dashboard_metrics
from app.schemas import DashboardMetricsResponse, MerchantProfileSchema
from app.models import MerchantProfile
from app.seed_data import seed_database

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

@router.post("/reset-demo")
def reset_demo_data(db: Session = Depends(get_db)):
    seed_database(db, force_reset=True)
    return {"message": "Demo data successfully reset to fresh sample state"}
