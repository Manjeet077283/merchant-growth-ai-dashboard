from datetime import datetime, timedelta, timezone
import random
import json
from sqlalchemy.orm import Session
from app.models import Transaction, Product, MerchantProfile

DEFAULT_PRODUCTS = [
    {
        "sku": "COF-ETH-01",
        "name": "Ethiopia Yirgacheffe Single Origin (12oz)",
        "category": "Whole Bean Coffee",
        "price": 22.00,
        "cost": 8.50,
        "inventory": 140,
        "description": "Floral notes with jasmine, bergamot, and sweet peach brightness. Light roast.",
        "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80"
    },
    {
        "sku": "COF-COL-02",
        "name": "Colombia Huila Supremo Medium Roast (12oz)",
        "category": "Whole Bean Coffee",
        "price": 19.50,
        "cost": 7.00,
        "inventory": 210,
        "description": "Balanced milk chocolate, brown sugar, and toasted hazelnut finish.",
        "image_url": "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=400&q=80"
    },
    {
        "sku": "COF-SUM-03",
        "name": "Sumatra Mandheling Dark Roast (12oz)",
        "category": "Whole Bean Coffee",
        "price": 20.00,
        "cost": 7.20,
        "inventory": 85,
        "description": "Earthy, full-bodied with cedar spice, baker's chocolate, and syrupy body.",
        "image_url": "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?auto=format&fit=crop&w=400&q=80"
    },
    {
        "sku": "ACC-MUG-01",
        "name": "Handmade Speckled Ceramic Coffee Mug (12oz)",
        "category": "Brew Gear & Merch",
        "price": 32.00,
        "cost": 12.00,
        "inventory": 65,
        "description": "Handcrafted stoneware clay with earthy satin glaze and ergonomic handle.",
        "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80"
    },
    {
        "sku": "ACC-DRIP-02",
        "name": "Stainless Precision Gooseneck Kettle (800ml)",
        "category": "Brew Gear & Merch",
        "price": 54.00,
        "cost": 22.00,
        "inventory": 40,
        "description": "Precision pour spout with built-in analog thermometer and heat-resistant grip.",
        "image_url": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80"
    },
    {
        "sku": "ACC-FLTR-03",
        "name": "Japanese Organic Cotton Coffee Filters (Pack of 100)",
        "category": "Brew Gear & Merch",
        "price": 14.50,
        "cost": 4.50,
        "inventory": 180,
        "description": "Unbleached natural cone paper filters ensuring clean sediment-free extraction.",
        "image_url": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=400&q=80"
    },
    {
        "sku": "SUB-BOX-01",
        "name": "Roaster's Choice Monthly Coffee Club (3-Month Prepaid)",
        "category": "Subscriptions",
        "price": 62.00,
        "cost": 24.00,
        "inventory": 999,
        "description": "Curated monthly delivery of seasonal micro-lot coffees with roaster tasting notes.",
        "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80"
    },
    {
        "sku": "EXP-WKSHP-01",
        "name": "Weekend Sensory Cupping & Latte Art Masterclass",
        "category": "Experiences",
        "price": 85.00,
        "cost": 15.00,
        "inventory": 24,
        "description": "2-hour hands-on barista workshop with green bean cupping and milk steaming secrets.",
        "image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80"
    }
]

SAMPLE_CUSTOMERS = [
    ("Jordan Lee", "jordan.lee@example.com"),
    ("Taylor Reed", "taylor.r@samplemail.org"),
    ("Morgan Chen", "mchen@techflow.io"),
    ("Samira Patel", "samira.patel@designstudio.co"),
    ("Marcus Brody", "mbrody@northcapital.com"),
    ("Elena Rostova", "elena.rostova@artisans.org"),
    ("Lucas Vance", "lvance88@gmail.com"),
    ("Chloe Bennett", "chloe.b@creativecollective.net"),
    ("David Kim", "dkim.seattle@outlook.com"),
    ("Aria Montgomery", "aria.m@moderncraft.com"),
    ("Noah Gallagher", "noah.g@summitlab.io"),
    ("Sophia Martinez", "smartinez@urbanroasters.org"),
    ("Liam O'Connor", "loconnor@dublincafe.net"),
    ("Maya Lin", "maya.lin.architect@gmail.com"),
    ("Oliver Hayes", "oliver.hayes@soundview.io")
]

def calculate_paypal_fee(amount: float) -> float:
    return round((amount * 0.029) + 0.30, 2)

def seed_database(db: Session, force_reset: bool = False):
    if force_reset:
        db.query(Transaction).delete()
        db.query(Product).delete()
        db.query(MerchantProfile).delete()
        db.commit()

    existing_profile = db.query(MerchantProfile).first()
    if not existing_profile:
        profile = MerchantProfile(
            business_name="Artisan Coffee Roasters & Co.",
            owner_name="Alex Mercer",
            category="Specialty Coffee & Gourmet Goods",
            currency="USD",
            monthly_target=22000.0,
            paypal_email="alex-merchant@artisanroasters.demo"
        )
        db.add(profile)
        db.commit()

    if db.query(Product).count() == 0:
        for p in DEFAULT_PRODUCTS:
            product = Product(
                sku=p["sku"],
                name=p["name"],
                category=p["category"],
                price=p["price"],
                cost=p["cost"],
                inventory=p["inventory"],
                description=p["description"],
                image_url=p["image_url"]
            )
            db.add(product)
        db.commit()

    from app.config import settings
    # Only populate synthetic demo transactions if DEMO_MODE is active or explicitly force-reset
    if (settings.DEMO_MODE or force_reset) and db.query(Transaction).count() == 0:
        now = datetime.now(timezone.utc)
        random.seed(42)

        transactions = []
        txn_counter = 1001

        for day_offset in range(30, -1, -1):
            date_base = now - timedelta(days=day_offset)
            is_weekend = date_base.weekday() in (5, 6)
            num_txns = random.randint(2, 5) if is_weekend else random.randint(1, 3)

            for _ in range(num_txns):
                hour = random.choice([8, 9, 10, 11, 13, 14, 16, 17, 19, 20])
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                txn_time = date_base.replace(hour=hour, minute=minute, second=second)

                customer_name, customer_email = random.choice(SAMPLE_CUSTOMERS)
                num_items = random.choices([1, 2, 3], weights=[0.60, 0.30, 0.10])[0]
                selected_products = random.sample(DEFAULT_PRODUCTS, num_items)

                order_items = []
                subtotal = 0.0

                for prod in selected_products:
                    qty = 1 if prod["price"] > 40 else random.choice([1, 2])
                    item_total = prod["price"] * qty
                    subtotal += item_total
                    order_items.append({
                        "sku": prod["sku"],
                        "name": prod["name"],
                        "qty": qty,
                        "unit_price": prod["price"],
                        "category": prod["category"]
                    })

                subtotal = round(subtotal, 2)
                fee = calculate_paypal_fee(subtotal)
                net = round(subtotal - fee, 2)

                status_roll = random.random()
                refunded_amount = 0.0
                refund_reason = None

                if status_roll < 0.05 and day_offset > 3:
                    status = "REFUNDED"
                    refunded_amount = subtotal
                    refund_reason = random.choice([
                        "Customer ordered coarse grind instead of espresso",
                        "Accidental duplicate checkout",
                        "Returned mug damaged in courier transit",
                        "Customer changed mind before shipping"
                    ])
                elif status_roll < 0.07:
                    status = "PENDING"
                elif status_roll < 0.08:
                    status = "FAILED"
                else:
                    status = "COMPLETED"

                payment_method = random.choices(
                    ["PAYPAL_SANDBOX", "PAYPAL_WALLET", "PAY_IN_4", "CREDIT_CARD"],
                    weights=[0.45, 0.30, 0.15, 0.10]
                )[0]

                txn = Transaction(
                    transaction_id=f"TXN-2026-{txn_counter}",
                    paypal_order_id=f"ORDER-{random.randint(10000000, 99999999)}",
                    paypal_capture_id=f"CAP-{random.randint(10000000, 99999999)}" if status != "FAILED" else None,
                    customer_name=customer_name,
                    customer_email=customer_email,
                    amount=subtotal,
                    currency="USD",
                    status=status,
                    fee=fee,
                    net_amount=net,
                    payment_method=payment_method,
                    items_json=json.dumps(order_items),
                    refunded_amount=refunded_amount,
                    refund_reason=refund_reason,
                    is_demo=True,
                    created_at=txn_time,
                    updated_at=txn_time
                )
                transactions.append(txn)
                txn_counter += 1

        db.add_all(transactions)
        db.commit()

def clear_demo_transactions(db: Session) -> int:
    """Purges all synthetic demo transactions, leaving genuine customer transactions intact."""
    deleted = db.query(Transaction).filter(Transaction.is_demo == True).delete()
    db.commit()
    return deleted

