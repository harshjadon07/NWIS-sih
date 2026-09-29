from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Formation
from app.schemas import FormationResponse

router = APIRouter()

@router.get("", response_model=List[FormationResponse])
def get_formations(db: Session = Depends(get_db)):
    return db.query(Formation).all()

@router.get("/{formation_id}", response_model=FormationResponse)
def get_formation(formation_id: int, db: Session = Depends(get_db)):
    form = db.query(Formation).filter(Formation.id == formation_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Formation not found")
    return form
