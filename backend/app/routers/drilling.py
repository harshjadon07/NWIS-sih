from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.simulator import simulator
from app.database import get_db
from app.services.alert_engine import process_live_data

router = APIRouter()

@router.get("/live")
def get_live_drilling_data(db: Session = Depends(get_db)):
    data = simulator.get_live_data()
    # Process alerts asynchronously or synchronously
    process_live_data(db, data)
    return data

