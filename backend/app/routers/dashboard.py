from datetime import datetime, time
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models import InventoryItem, Repair, Sale, User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    start = datetime.combine(datetime.now().date(), time.min)
    end = datetime.combine(datetime.now().date(), time.max)
    total_products = db.scalar(select(func.count(InventoryItem.id))) or 0
    total_units = db.scalar(select(func.coalesce(func.sum(InventoryItem.quantity), 0))) or 0
    low_stock = db.scalar(select(func.count(InventoryItem.id)).where(InventoryItem.quantity > 0, InventoryItem.quantity <= InventoryItem.low_stock_threshold)) or 0
    out_of_stock = db.scalar(select(func.count(InventoryItem.id)).where(InventoryItem.quantity <= 0)) or 0
    today_sales = db.scalar(select(func.coalesce(func.sum(Sale.total_price), 0)).where(Sale.sold_at >= start, Sale.sold_at <= end)) or 0
    today_units = db.scalar(select(func.coalesce(func.sum(Sale.quantity), 0)).where(Sale.sold_at >= start, Sale.sold_at <= end)) or 0
    open_repairs = db.scalar(select(func.count(Repair.id)).where(Repair.status.notin_(["DELIVERED", "CANCELLED"]))) or 0
    warnings = db.scalars(select(InventoryItem).where(InventoryItem.quantity <= InventoryItem.low_stock_threshold).order_by(InventoryItem.quantity.asc()).limit(10)).all()
    return {
        "total_products": total_products,
        "total_units": total_units,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "today_sales": today_sales,
        "today_units": today_units,
        "open_repairs": open_repairs,
        "warnings": [{"id": x.id, "name": x.name, "brand": x.brand, "quantity": x.quantity, "threshold": x.low_stock_threshold} for x in warnings],
    }
