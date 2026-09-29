import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import RiskPrediction
from app.schemas import RiskPredictionResponse, RiskSummaryResponse
from app.services.risk_model import RiskMLPipeline

router = APIRouter()

@router.get("/current")
def get_current_risk(well_id: str = 'WELL-A', db: Session = Depends(get_db)):
    return RiskMLPipeline(db).predict_current_risk(well_id=well_id)

@router.get("/summary", response_model=RiskSummaryResponse)
def get_risk_summary(well_id: str, db: Session = Depends(get_db)):
    risks = db.query(RiskPrediction).filter(RiskPrediction.well_id == well_id).all()
    if not risks:
        raise HTTPException(status_code=404, detail="No risk data found for this well")

    avg_mud_loss = sum(r.mud_loss_score for r in risks) / len(risks)
    avg_stuck = sum(r.stuck_pipe_score for r in risks) / len(risks)
    avg_kick = sum(r.kick_score for r in risks) / len(risks)
    avg_cem = sum(r.cementing_score for r in risks) / len(risks)
    avg_overall = sum(r.risk_score for r in risks) / len(risks)

    level = "MEDIUM"
    if avg_overall > 75: level = "VERY HIGH"
    elif avg_overall > 50: level = "HIGH"
    elif avg_overall < 25: level = "LOW"

    return RiskSummaryResponse(
        well_id=well_id,
        overall_risk_level=level,
        overall_risk_score=avg_overall,
        mud_loss_avg=avg_mud_loss,
        stuck_pipe_avg=avg_stuck,
        kick_avg=avg_kick,
        cementing_avg=avg_cem
    )

@router.get("/depth", response_model=List[RiskPredictionResponse])
def get_risk_by_depth(well_id: str, db: Session = Depends(get_db)):
    curves = RiskMLPipeline(db).predict_risk_by_depth(well_id=well_id, start_depth=2400, end_depth=3000, step=50)
    return [{
        'id': int(point['depth']),
        'well_id': well_id,
        'depth': float(point['depth']),
        'risk_level': point['risk_level'],
        'risk_score': float(point['risk_score']),
        'mud_loss_score': float(point['scores']['Mud Loss']),
        'stuck_pipe_score': float(point['scores']['Stuck Pipe']),
        'kick_score': float(point['scores']['Kick']),
        'cementing_score': float(point['scores']['Cementing Issue']),
        'contributing_factors': json.dumps(point['scores'], sort_keys=True),
        'nearby_events_count': len(point['scores'])
    } for point in curves]

@router.get("/factors")
def get_risk_factors(well_id: str = 'WELL-A', risk_type: str = 'Mud Loss', db: Session = Depends(get_db)):
    return RiskMLPipeline(db).explain_risk(well_id=well_id, risk_type=risk_type)

@router.get("/fingerprint")
def get_risk_fingerprint(well_id: str = 'WELL-A', event_type: str = 'Mud Loss', db: Session = Depends(get_db)):
    return RiskMLPipeline(db).get_risk_fingerprint(well_id=well_id, event_type=event_type)

@router.get("/similar-events")
def get_similar_events(well_id: str = 'WELL-A', risk_type: str = 'Mud Loss', limit: int = Query(5, ge=1, le=10), db: Session = Depends(get_db)):
    return RiskMLPipeline(db).get_similar_events(well_id=well_id, risk_type=risk_type, limit=limit)
