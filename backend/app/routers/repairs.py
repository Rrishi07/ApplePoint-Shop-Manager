from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Repair, User
from ..schemas import RepairCreate, RepairUpdate

router = APIRouter(prefix="/api/repairs", tags=["repairs"])


def to_dict(x: Repair):
    return {c.name: getattr(x, c.name) for c in x.__table__.columns}


@router.get("")
def list_repairs(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return [to_dict(x) for x in db.scalars(select(Repair).order_by(Repair.created_at.desc())).all()]


@router.post("")
def create_repair(data: RepairCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    row = Repair(**data.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return to_dict(row)


@router.put("/{repair_id}")
def update_repair(repair_id: int, data: RepairUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    row = db.get(Repair, repair_id)
    if not row:
        raise HTTPException(status_code=404, detail="Repair not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit(); db.refresh(row)
    return to_dict(row)


@router.delete("/{repair_id}")
def delete_repair(repair_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    row = db.get(Repair, repair_id)
    if not row:
        raise HTTPException(status_code=404, detail="Repair not found")
    db.delete(row); db.commit()
    return {"message": "Repair deleted"}
