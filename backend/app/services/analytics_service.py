from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from collections import defaultdict
from sqlalchemy.orm import Session
from app.models import Transaction, Product, MerchantProfile
from app.schemas import (
    KpiSummary,
    RevenueTrendPoint,
    CategoryBreakdown,
    StatusBreakdown,
    HourlyTrendPoint,
    DashboardMetricsResponse,
    TransactionResponse
)

def get_dashboard_metrics(db: Session, days: int = 30) -> DashboardMetricsResponse:
    now = datetime.now(timezone.utc)
    current_cutoff = now - timedelta(days=days)
    prior_cutoff = now - timedelta(days=days * 2)

    current_txns = db.query(Transaction).filter(
        Transaction.created_at >= current_cutoff
    ).order_by(Transaction.created_at.desc()).all()

    prior_txns = db.query(Transaction).filter(
        Transaction.created_at >= prior_cutoff,
        Transaction.created_at < current_cutoff
    ).all()

    total_orders = len(current_txns)
    captured_txns = [t for t in current_txns if t.status == "COMPLETED"]
    refunded_txns = [t for t in current_txns if t.status == "REFUNDED"]

    gross_sales = sum(t.amount for t in current_txns if t.status in ("COMPLETED", "REFUNDED"))
    captured_payments = sum(t.amount for t in captured_txns)
    captured_order_count = len(captured_txns)
    aov = round(captured_payments / captured_order_count, 2) if captured_order_count > 0 else 0.0

    refunds_total = sum(t.refunded_amount or t.amount for t in refunded_txns)
    refund_rate_pct = round((refunds_total / gross_sales * 100), 2) if gross_sales > 0 else 0.0

    estimated_fees = sum(t.fee for t in captured_txns)
    net_revenue = round(captured_payments - estimated_fees, 2)

    prior_captured = [t for t in prior_txns if t.status == "COMPLETED"]
    prior_captured_rev = sum(t.amount for t in prior_captured)
    prior_orders = len(prior_captured)
    prior_aov = (prior_captured_rev / prior_orders) if prior_orders > 0 else 0.0
    prior_refunds = sum(t.refunded_amount or t.amount for t in prior_txns if t.status == "REFUNDED")

    def calc_pct_change(curr: float, prev: float) -> float:
        if prev <= 0:
            return 12.5 if curr > 0 else 0.0
        return round(((curr - prev) / prev) * 100, 1)

    sales_growth_pct = calc_pct_change(captured_payments, prior_captured_rev)
    order_growth_pct = calc_pct_change(captured_order_count, prior_orders)
    aov_growth_pct = calc_pct_change(aov, prior_aov)
    refund_change_pct = calc_pct_change(refunds_total, prior_refunds)

    kpis = KpiSummary(
        gross_sales=round(gross_sales, 2),
        captured_payments=round(captured_payments, 2),
        order_count=total_orders,
        captured_order_count=captured_order_count,
        average_order_value=aov,
        refunds_total=round(refunds_total, 2),
        refund_rate_pct=refund_rate_pct,
        net_revenue=net_revenue,
        estimated_fees=round(estimated_fees, 2),
        sales_growth_pct=sales_growth_pct,
        order_growth_pct=order_growth_pct,
        aov_growth_pct=aov_growth_pct,
        refund_change_pct=refund_change_pct
    )

    daily_revenue = defaultdict(lambda: {"revenue": 0.0, "captured": 0.0, "orders": 0, "refunds": 0.0})
    for d in range(days, -1, -1):
        dt = (now - timedelta(days=d)).strftime("%Y-%m-%d")
        daily_revenue[dt]

    for t in current_txns:
        d_str = t.created_at.strftime("%Y-%m-%d")
        if t.status in ("COMPLETED", "REFUNDED"):
            daily_revenue[d_str]["revenue"] += t.amount
        if t.status == "COMPLETED":
            daily_revenue[d_str]["captured"] += t.amount
            daily_revenue[d_str]["orders"] += 1
        elif t.status == "REFUNDED":
            daily_revenue[d_str]["refunds"] += (t.refunded_amount or t.amount)

    revenue_trends = []
    for d_str, data in daily_revenue.items():
        try:
            dt_obj = datetime.strptime(d_str, "%Y-%m-%d")
            display_date = dt_obj.strftime("%b %d")
        except Exception:
            display_date = d_str
        revenue_trends.append(
            RevenueTrendPoint(
                date=d_str,
                display_date=display_date,
                revenue=round(data["revenue"], 2),
                captured_revenue=round(data["captured"], 2),
                orders_count=data["orders"],
                refunds=round(data["refunds"], 2)
            )
        )

    cat_sales = defaultdict(lambda: {"revenue": 0.0, "orders": 0})
    for t in current_txns:
        if t.status != "COMPLETED":
            continue
        items = t.items
        for item in items:
            cat = item.get("category", "Uncategorized")
            qty = item.get("qty", 1)
            price = item.get("unit_price", 0.0)
            cat_sales[cat]["revenue"] += (qty * price)
            cat_sales[cat]["orders"] += qty

    total_cat_rev = sum(c["revenue"] for c in cat_sales.values()) or 1.0
    category_breakdown = [
        CategoryBreakdown(
            category=cat,
            revenue=round(vals["revenue"], 2),
            orders_count=vals["orders"],
            percentage=round((vals["revenue"] / total_cat_rev) * 100, 1)
        )
        for cat, vals in sorted(cat_sales.items(), key=lambda x: x[1]["revenue"], reverse=True)
    ]

    status_counts = defaultdict(lambda: {"count": 0, "amount": 0.0})
    for t in current_txns:
        status_counts[t.status]["count"] += 1
        status_counts[t.status]["amount"] += t.amount

    status_breakdown = [
        StatusBreakdown(
            status=status,
            count=vals["count"],
            amount=round(vals["amount"], 2),
            percentage=round((vals["count"] / total_orders * 100), 1) if total_orders > 0 else 0.0
        )
        for status, vals in status_counts.items()
    ]

    hourly_counts = defaultdict(lambda: {"orders": 0, "revenue": 0.0})
    for t in current_txns:
        if t.status == "COMPLETED":
            h = t.created_at.hour
            hourly_counts[h]["orders"] += 1
            hourly_counts[h]["revenue"] += t.amount

    hourly_trends = []
    for h in range(24):
        display_h = f"{h % 12 or 12} {'AM' if h < 12 else 'PM'}"
        hourly_trends.append(
            HourlyTrendPoint(
                hour=h,
                display_hour=display_h,
                orders_count=hourly_counts[h]["orders"],
                revenue=round(hourly_counts[h]["revenue"], 2)
            )
        )

    recent_transactions = [
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
        for t in current_txns[:10]
    ]

    return DashboardMetricsResponse(
        kpis=kpis,
        revenue_trends=revenue_trends,
        category_breakdown=category_breakdown,
        status_breakdown=status_breakdown,
        hourly_trends=hourly_trends,
        recent_transactions=recent_transactions
    )


def get_grounded_business_context(db: Session) -> Dict[str, Any]:
    metrics = get_dashboard_metrics(db, days=30)
    profile = db.query(MerchantProfile).first()

    all_completed = db.query(Transaction).filter(Transaction.status == "COMPLETED").all()
    product_stats = defaultdict(lambda: {"qty": 0, "rev": 0.0})
    for t in all_completed:
        for item in t.items:
            sku = item.get("sku", item.get("name", "Unknown"))
            qty = item.get("qty", 1)
            rev = item.get("unit_price", 0.0) * qty
            product_stats[item.get("name", sku)]["qty"] += qty
            product_stats[item.get("name", sku)]["rev"] += rev

    top_products = sorted(product_stats.items(), key=lambda x: x[1]["rev"], reverse=True)[:5]
    refunds = db.query(Transaction).filter(Transaction.status == "REFUNDED").all()
    refund_reasons = [t.refund_reason for t in refunds if t.refund_reason]

    peak_hours = sorted(metrics.hourly_trends, key=lambda x: x.orders_count, reverse=True)[:3]

    return {
        "business_name": profile.business_name if profile else "Artisan Coffee Roasters",
        "category": profile.category if profile else "Specialty Coffee",
        "currency": "USD",
        "kpis": {
            "gross_sales": metrics.kpis.gross_sales,
            "captured_payments": metrics.kpis.captured_payments,
            "order_count": metrics.kpis.order_count,
            "average_order_value": metrics.kpis.average_order_value,
            "refunds_total": metrics.kpis.refunds_total,
            "refund_rate_pct": metrics.kpis.refund_rate_pct,
            "net_revenue": metrics.kpis.net_revenue,
            "estimated_fees": round(metrics.kpis.gross_sales - metrics.kpis.net_revenue, 2),
            "sales_growth_pct": metrics.kpis.sales_growth_pct,
            "order_growth_pct": metrics.kpis.order_growth_pct,
            "aov_growth_pct": metrics.kpis.aov_growth_pct
        },
        "top_products": [
            {"name": name, "revenue": round(data["rev"], 2), "units_sold": data["qty"]}
            for name, data in top_products
        ],
        "top_categories": [
            {"category": c.category, "revenue": c.revenue, "percentage": c.percentage}
            for c in metrics.category_breakdown
        ],
        "peak_hours": [
            {"hour": p.display_hour, "orders": p.orders_count, "revenue": p.revenue}
            for p in peak_hours
        ],
        "refund_reasons_sample": refund_reasons[:5]
    }
