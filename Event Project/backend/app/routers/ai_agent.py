from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Product
from app.services.ai_service import ai_service
from app.schemas import (
    AiChatRequest,
    AiChatResponse,
    RecommendationsResponse,
    ProductSchema
)

router = APIRouter(prefix="/api/ai", tags=["AI Agent"])

@router.post("/chat", response_model=AiChatResponse)
def chat_with_agent(payload: AiChatRequest, db: Session = Depends(get_db)):
    history = [msg.model_dump() for msg in payload.history]
    return ai_service.answer_merchant_query(payload.message, history, db)

@router.get("/recommendations", response_model=RecommendationsResponse)
def get_recommendations(db: Session = Depends(get_db)):
    return ai_service.generate_growth_recommendations(db)

@router.get("/products", response_model=list[ProductSchema])
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return products
