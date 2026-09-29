from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.services.copilot_engine import CopilotEngine

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    well_id: Optional[str] = "WELL-A"

class ToolCallInfo(BaseModel):
    tool: str
    args: Dict[str, Any]
    summary: str

class SourceCitation(BaseModel):
    title: str
    page: int
    excerpt: str
    well: str
    depth: str
    event: str

class ChatResponse(BaseModel):
    reply: str
    tools_called: List[ToolCallInfo] = []
    context: Dict[str, Any] = {}
    sources: List[SourceCitation] = []
    structured_data: Optional[Dict[str, Any]] = None

@router.get("/context")
def get_copilot_context(db: Session = Depends(get_db)):
    engine = CopilotEngine(db)
    current = engine.get_current_drilling_data()
    risk = engine.get_risk_prediction("WELL-A", current["depth"])
    nearby = engine.get_nearby_wells(radius_km=15)
    
    return {
        "active_well": "WELL-A",
        "current_depth": current["depth"],
        "formation": current["formation"],
        "risk_level": risk["risk_level"],
        "risk_score": risk["risk_score"],
        "nearby_wells": [w["id"] for w in nearby if w["id"] != "WELL-A"][:5],
        "live_telemetry": {
            "rop": current["rop"],
            "wob": current["wob"],
            "torque": current["torque"],
            "standpipe_pressure": current["standpipe_pressure"]
        }
    }

@router.post("/chat", response_model=ChatResponse)
def copilot_chat(req: ChatRequest, db: Session = Depends(get_db)):
    engine = CopilotEngine(db)
    result = engine.process_query(req.message)
    return result

@router.get("/tools")
def list_copilot_tools():
    return [
        {"name": "search_reports", "description": "Search archived PDF completion/drilling/mud reports with vector indexing"},
        {"name": "get_well", "description": "Retrieve comprehensive technical specifications and status for any well"},
        {"name": "get_nearby_wells", "description": "Find offset wells within a spatial radius using coordinates"},
        {"name": "get_historical_events", "description": "Query historical NPT, mud losses, stuck pipe, kicks, and casing issues"},
        {"name": "get_events_by_depth", "description": "Retrieve incidents occurring in nearby wells around target depth"},
        {"name": "get_events_by_formation", "description": "Aggregate historical event statistics by geological formation"},
        {"name": "get_current_drilling_data", "description": "Get real-time depth, ROP, WOB, torque, and pressure telemetry"},
        {"name": "get_risk_prediction", "description": "Fetch ML risk score layer and depth-wise hazard index"},
        {"name": "get_risk_factors", "description": "Synthesize contributing factors causing warning alerts"},
        {"name": "compare_wells", "description": "Compare well trajectories, shared formations, and event frequencies"}
    ]
