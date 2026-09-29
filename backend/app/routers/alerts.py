from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Alert
from app.schemas import AlertResponse

router = APIRouter()

@router.get("/", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    # Return alerts sorted by timestamp descending
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).limit(50).all()
    return alerts
