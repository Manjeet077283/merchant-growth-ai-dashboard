from datetime import datetime, timezone
import json
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(64), unique=True, index=True, nullable=False)
    paypal_order_id = Column(String(64), index=True, nullable=True)
    paypal_capture_id = Column(String(64), index=True, nullable=True)
    customer_name = Column(String(128), nullable=False)
    customer_email = Column(String(128), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(8), default="USD", nullable=False)
    status = Column(String(32), default="COMPLETED", index=True, nullable=False)
    fee = Column(Float, default=0.0, nullable=False)
    net_amount = Column(Float, default=0.0, nullable=False)
    payment_method = Column(String(32), default="PAYPAL_SANDBOX", nullable=False)
    items_json = Column(Text, default="[]", nullable=False)
    refunded_amount = Column(Float, default=0.0, nullable=False)
    refund_reason = Column(String(256), nullable=True)
    is_demo = Column(Boolean, default=False, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def items(self):
        try:
            return json.loads(self.items_json) if self.items_json else []
        except Exception:
            return []

    @items.setter
    def items(self, value):
        self.items_json = json.dumps(value)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    price = Column(Float, nullable=False)
    cost = Column(Float, default=0.0, nullable=False)
    inventory = Column(Integer, default=100, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(512), nullable=True)


class MerchantProfile(Base):
    __tablename__ = "merchant_profile"

    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String(128), default="Artisan Coffee Roasters & Co.")
    owner_name = Column(String(128), default="Alex Mercer")
    category = Column(String(64), default="Specialty Coffee & Gourmet Goods")
    currency = Column(String(8), default="USD")
    monthly_target = Column(Float, default=25000.0)
    paypal_email = Column(String(128), default="merchant-facilitator@demo.paypal.com")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AiInteraction(Base):
    __tablename__ = "ai_interactions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(16), default="user")
    message = Column(Text, nullable=False)
    grounded_metrics = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
