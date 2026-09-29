from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import HistoricalEvent
from app.schemas import HistoricalEventResponse

router = APIRouter()

@router.get("", response_model=List[HistoricalEventResponse])
def get_events(
    well_id: Optional[str] = None,
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    formation_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(HistoricalEvent)
    if well_id:
        query = query.filter(HistoricalEvent.well_id == well_id)
    if event_type:
        query = query.filter(HistoricalEvent.event_type == event_type)
    if severity:
        query = query.filter(HistoricalEvent.severity == severity)
    if formation_name:
        query = query.filter(HistoricalEvent.formation_name == formation_name)
    return query.all()

@router.get("/{event_id}", response_model=HistoricalEventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(HistoricalEvent).filter(HistoricalEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
