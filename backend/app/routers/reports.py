from datetime import date, datetime, time
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Repair, Sale, User

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/daily")
def daily_report(
    report_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    start = datetime.combine(report_date, time.min)
    end = datetime.combine(report_date, time.max)
    sales = db.scalars(select(Sale).where(Sale.sold_at >= start, Sale.sold_at <= end).order_by(Sale.sold_at.asc())).all()
    repairs = db.scalars(select(Repair).where(Repair.created_at >= start, Repair.created_at <= end).order_by(Repair.created_at.asc())).all()
    return {
        "date": report_date,
        "sales": [{"id": s.id, "item_name": s.item_name, "quantity": s.quantity, "unit_price": s.unit_price, "total_price": s.total_price, "sold_at": s.sold_at} for s in sales],
        "repairs": [{"id": r.id, "owner_name": r.owner_name, "phone_model": r.phone_model, "estimated_charge": r.estimated_charge, "advance_received": r.advance_received, "status": r.status, "created_at": r.created_at} for r in repairs],
        "summary": {
            "sales_count": len(sales),
            "units_sold": sum(s.quantity for s in sales),
            "sales_total": sum(s.total_price for s in sales),
            "repairs_received": len(repairs),
            "repair_estimated_total": sum(r.estimated_charge for r in repairs),
            "repair_advance_total": sum(r.advance_received for r in repairs),
        },
    }
