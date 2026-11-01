from fastapi import APIRouter
from app.config import settings
from app.services.paypal_service import paypal_service
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
def get_health():
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "demo_mode": settings.DEMO_MODE,
        "paypal_configured": paypal_service.is_configured,
        "paypal_mode": settings.PAYPAL_MODE,
        "gemini_configured": ai_service.is_gemini_configured,
        "gemini_model": settings.GEMINI_MODEL
    }
