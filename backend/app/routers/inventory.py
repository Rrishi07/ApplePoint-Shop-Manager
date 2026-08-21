import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from ..config import settings
from ..database import get_db
from ..dependencies import get_current_user
from ..models import InventoryItem, Sale, User
from ..schemas import SellIn

router = APIRouter(prefix="/api/inventory", tags=["inventory"])
UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def item_dict(item: InventoryItem):
    return {
        "id": item.id,
        "category": item.category,
        "brand": item.brand,
        "quality": item.quality,
        "name": item.name,
        "quantity": item.quantity,
        "cost_price": item.cost_price,
        "selling_price": item.selling_price,
        "final_selling_price": item.final_selling_price,
        "low_stock_threshold": item.low_stock_threshold,
        "note": item.note,
        "photo_url": f"/uploads/{Path(item.photo_path).name}" if item.photo_path else None,
        "stock_status": "OUT" if item.quantity <= 0 else ("LOW" if item.quantity <= item.low_stock_threshold else "OK"),
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


async def save_photo(photo: UploadFile | None) -> str | None:
    if not photo or not photo.filename:
        return None
    ext = os.path.splitext(photo.filename)[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Photo must be JPG, PNG or WEBP")
    path = UPLOAD_DIR / f"{uuid.uuid4().hex}{ext}"
    content = await photo.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Photo must be 5 MB or smaller")
    path.write_bytes(content)
    return str(path)


@router.get("")
def list_items(q: str = "", db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    stmt = select(InventoryItem).order_by(InventoryItem.updated_at.desc())
    if q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(or_(InventoryItem.name.ilike(term), InventoryItem.brand.ilike(term), InventoryItem.category.ilike(term)))
    return [item_dict(x) for x in db.scalars(stmt).all()]


@router.post("")
async def create_item(
    category: str = Form(...),
    brand: str = Form(""),
    quality: str = Form("ORIGINAL"),
    name: str = Form(...),
    quantity: int = Form(0),
    cost_price: float = Form(0),
    selling_price: float = Form(0),
    final_selling_price: float = Form(0),
    low_stock_threshold: int = Form(settings.low_stock_default),
    note: str = Form(""),
    photo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if quantity < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative")
    photo_path = await save_photo(photo)
    item = InventoryItem(
        category=category.strip(), brand=brand.strip(), quality=quality.strip().upper(), name=name.strip(),
        quantity=quantity, cost_price=cost_price, selling_price=selling_price,
        final_selling_price=final_selling_price, low_stock_threshold=max(0, low_stock_threshold),
        note=note.strip() or None, photo_path=photo_path,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item_dict(item)


@router.put("/{item_id}")
async def update_item(
    item_id: int,
    category: str = Form(...),
    brand: str = Form(""),
    quality: str = Form("ORIGINAL"),
    name: str = Form(...),
    quantity: int = Form(0),
    cost_price: float = Form(0),
    selling_price: float = Form(0),
    final_selling_price: float = Form(0),
    low_stock_threshold: int = Form(settings.low_stock_default),
    note: str = Form(""),
    photo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if quantity < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative")
    item.category = category.strip(); item.brand = brand.strip(); item.quality = quality.strip().upper(); item.name = name.strip()
    item.quantity = quantity; item.cost_price = cost_price; item.selling_price = selling_price; item.final_selling_price = final_selling_price
    item.low_stock_threshold = max(0, low_stock_threshold); item.note = note.strip() or None
    new_photo = await save_photo(photo)
    if new_photo:
        item.photo_path = new_photo
    db.commit(); db.refresh(item)
    return item_dict(item)


@router.post("/{item_id}/sell")
def sell_item(item_id: int, data: SellIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.quantity < data.quantity:
        raise HTTPException(status_code=400, detail=f"Only {item.quantity} item(s) available")
    unit_price = data.unit_price if data.unit_price is not None else item.final_selling_price
    item.quantity -= data.quantity
    sale = Sale(
        inventory_item_id=item.id, item_name=item.name, quantity=data.quantity,
        unit_price=unit_price, total_price=unit_price * data.quantity, sold_by=user.id,
    )
    db.add(sale); db.commit(); db.refresh(item)
    return {"message": "Sale recorded", "item": item_dict(item), "sale_id": sale.id}


@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item); db.commit()
    return {"message": "Item deleted"}
