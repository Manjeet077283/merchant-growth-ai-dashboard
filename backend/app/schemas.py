from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class OrderItemSchema(BaseModel):
    sku: str
    name: str
    qty: int = 1
    unit_price: float
    category: Optional[str] = "General"

class ProductSchema(BaseModel):
    id: int
    sku: str
    name: str
    category: str
    price: float
    cost: float
    inventory: int
    description: Optional[str] = None
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class TransactionBase(BaseModel):
    transaction_id: str
    customer_name: str
    customer_email: str
    amount: float
    currency: str = "USD"
    status: str = "COMPLETED"
    fee: float = 0.0
    net_amount: float = 0.0
    payment_method: str = "PAYPAL_SANDBOX"
    is_demo: bool = False

class TransactionCreate(TransactionBase):
    paypal_order_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    items: List[OrderItemSchema] = []
    refund_reason: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    paypal_order_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    items: List[Dict[str, Any]] = []
    refunded_amount: float = 0.0
    refund_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TransactionListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    transactions: List[TransactionResponse]

class RefundRequest(BaseModel):
    amount: Optional[float] = None
    reason: str = "Customer request"

class KpiSummary(BaseModel):
    gross_sales: float
    captured_payments: float
    order_count: int
    captured_order_count: int
    average_order_value: float
    refunds_total: float
    refund_rate_pct: float
    net_revenue: float
    estimated_fees: float
    sales_growth_pct: float
    order_growth_pct: float
    aov_growth_pct: float
    refund_change_pct: float

class RevenueTrendPoint(BaseModel):
    date: str
    display_date: str
    revenue: float
    captured_revenue: float
    orders_count: int
    refunds: float

class CategoryBreakdown(BaseModel):
    category: str
    revenue: float
    orders_count: int
    percentage: float

class StatusBreakdown(BaseModel):
    status: str
    count: int
    amount: float
    percentage: float

class HourlyTrendPoint(BaseModel):
    hour: int
    display_hour: str
    orders_count: int
    revenue: float

class DashboardMetricsResponse(BaseModel):
    kpis: KpiSummary
    revenue_trends: List[RevenueTrendPoint]
    category_breakdown: List[CategoryBreakdown]
    status_breakdown: List[StatusBreakdown]
    hourly_trends: List[HourlyTrendPoint]
    recent_transactions: List[TransactionResponse]

class PayPalCreateOrderRequest(BaseModel):
    items: List[OrderItemSchema]
    currency: str = "USD"
    customer_name: Optional[str] = "Demo Shopper"
    customer_email: Optional[str] = "shopper@sandbox.demo"
    is_sample: Optional[bool] = False

class PayPalCreateOrderResponse(BaseModel):
    order_id: str
    status: str
    approval_url: Optional[str] = None
    currency: str
    amount: float

class PayPalCaptureOrderRequest(BaseModel):
    order_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    items: Optional[List[OrderItemSchema]] = None

class PayPalCaptureOrderResponse(BaseModel):
    success: bool
    status: str
    transaction_id: str
    capture_id: str
    order_id: str
    amount: float
    fee: float
    net: float
    currency: str
    customer_name: str
    customer_email: str
    message: str

class PayPalConfigResponse(BaseModel):
    client_id_configured: bool
    client_id: Optional[str] = None
    mode: str
    currency: str = "USD"
    is_simulator: bool = False

class PayPalCancelOrderRequest(BaseModel):
    order_id: str
    reason: Optional[str] = "Buyer cancelled checkout"

class PayPalCancelOrderResponse(BaseModel):
    success: bool
    status: str
    order_id: str
    message: str

class ChatMessage(BaseModel):
    role: str
    content: str

class AiChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class GroundedCitation(BaseModel):
    metric: str
    value: str
    context: str

class ActionItem(BaseModel):
    title: str
    impact: str
    action: str

class AiChatResponse(BaseModel):
    reply: str
    model: str
    citations: List[GroundedCitation] = []
    suggested_actions: List[ActionItem] = []
    suggested_questions: List[str] = []

class RecommendationItem(BaseModel):
    id: str
    category: str
    title: str
    description: str
    impact_estimate: str
    impact_level: str
    effort_level: str
    confidence_score: int
    metric_evidence: str
    action_cta: str

class RecommendationsResponse(BaseModel):
    overall_health_score: int
    summary: str
    recommendations: List[RecommendationItem]

class MerchantProfileSchema(BaseModel):
    business_name: str
    owner_name: str
    category: str
    currency: str
    monthly_target: float
    paypal_email: str

    model_config = ConfigDict(from_attributes=True)

class MerchantProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    owner_name: Optional[str] = None
    category: Optional[str] = None
    currency: Optional[str] = None
    monthly_target: Optional[float] = None
    paypal_email: Optional[str] = None
