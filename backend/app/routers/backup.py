from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models import InventoryItem, Repair, Sale, User

router = APIRouter(prefix="/api/backup", tags=["backup"])


def serial(row):
    out = {}
    for c in row.__table__.columns:
        value = getattr(row, c.name)
        out[c.name] = value.isoformat() if isinstance(value, datetime) else value
    return out


@router.get("/export")
def export_backup(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return {
        "version": 1,
        "exported_at": datetime.utcnow().isoformat(),
        "inventory": [serial(x) for x in db.scalars(select(InventoryItem)).all()],
        "sales": [serial(x) for x in db.scalars(select(Sale)).all()],
        "repairs": [serial(x) for x in db.scalars(select(Repair)).all()],
    }


@router.post("/restore")
def restore_backup(payload: dict, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if payload.get("version") != 1:
        raise HTTPException(status_code=400, detail="Unsupported backup version")
    try:
        db.execute(delete(Sale)); db.execute(delete(Repair)); db.execute(delete(InventoryItem)); db.commit()
        for raw in payload.get("inventory", []):
            raw = dict(raw); raw.pop("id", None)
            for key in ("created_at", "updated_at"):
                if raw.get(key): raw[key] = datetime.fromisoformat(raw[key])
            db.add(InventoryItem(**raw))
        db.commit()
        name_to_id = {x.name: x.id for x in db.scalars(select(InventoryItem)).all()}
        for raw in payload.get("sales", []):
            raw = dict(raw); raw.pop("id", None); raw["inventory_item_id"] = name_to_id.get(raw.get("item_name")); raw["sold_by"] = None
            if raw.get("sold_at"): raw["sold_at"] = datetime.fromisoformat(raw["sold_at"])
            db.add(Sale(**raw))
        for raw in payload.get("repairs", []):
            raw = dict(raw); raw.pop("id", None)
            for key in ("created_at", "updated_at"):
                if raw.get(key): raw[key] = datetime.fromisoformat(raw[key])
            db.add(Repair(**raw))
        db.commit()
        return {"message": "Backup restored"}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Restore failed: {exc}")
