import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.simulator import simulator
from app.database import get_db
from app.services.alert_engine import process_live_data

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/live")
def get_live_drilling_data(db: Session = Depends(get_db)):
    data = simulator.get_live_data()
    try:
        process_live_data(db, data)
    except Exception:
        db.rollback()
        logger.exception("Failed to process alerts for live drilling data")
    return data

