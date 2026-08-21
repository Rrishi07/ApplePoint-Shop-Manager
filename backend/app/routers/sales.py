from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Sale, User

router = APIRouter(prefix="/api/sales", tags=["sales"])


@router.get("")
def list_sales(
    limit: int = Query(default=250, ge=1, le=1000),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = db.scalars(select(Sale).order_by(Sale.sold_at.desc()).limit(limit)).all()
    return [
        {
            "id": s.id,
            "inventory_item_id": s.inventory_item_id,
            "item_name": s.item_name,
            "quantity": s.quantity,
            "unit_price": s.unit_price,
            "total_price": s.total_price,
            "sold_at": s.sold_at,
        }
        for s in rows
    ]
