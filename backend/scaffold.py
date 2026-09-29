import os

base_dir = r"c:\Users\harsh\Desktop\sih 26121\backend"

directories = [
    "app",
    "app/routers"
]

for d in directories:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

files = {}

files["requirements.txt"] = """fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.32
pydantic==2.9.0
python-dateutil==2.9.0
"""

files["run.py"] = """import uvicorn

if __name__ == '__main__':
    uvicorn.run('app.main:app', host='0.0.0.0', port=8000, reload=True)
"""

files["app/__init__.py"] = ""

files["app/config.py"] = """import os

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nwis_prototype.db")
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173"
    ]

settings = Settings()
"""

files["app/database.py"] = """from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
"""

files["app/models.py"] = """from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Well(Base):
    __tablename__ = "wells"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    total_depth = Column(Float)
    well_type = Column(String)
    status = Column(String)
    spud_date = Column(Date)
    completion_date = Column(Date, nullable=True)
    operator = Column(String, default="Synthetic Operator")
    field_name = Column(String)

    formations = relationship("WellFormation", back_populates="well")
    drilling_parameters = relationship("DrillingParameter", back_populates="well")
    historical_events = relationship("HistoricalEvent", back_populates="well")
    risk_predictions = relationship("RiskPrediction", back_populates="well")

class Formation(Base):
    __tablename__ = "formations"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, index=True)
    description = Column(String)
    lithology = Column(String)
    porosity = Column(Float)
    permeability = Column(Float)
    pressure_gradient = Column(Float)

    wells = relationship("WellFormation", back_populates="formation")

class WellFormation(Base):
    __tablename__ = "well_formations"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    well_id = Column(String, ForeignKey("wells.id"))
    formation_id = Column(Integer, ForeignKey("formations.id"))
    top_depth = Column(Float)
    bottom_depth = Column(Float)
    remarks = Column(String)

    well = relationship("Well", back_populates="formations")
    formation = relationship("Formation", back_populates="wells")

class DrillingParameter(Base):
    __tablename__ = "drilling_parameters"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    well_id = Column(String, ForeignKey("wells.id"))
    timestamp = Column(DateTime)
    depth = Column(Float)
    rop = Column(Float)
    wob = Column(Float)
    torque = Column(Float)
    rpm = Column(Float)
    pump_pressure = Column(Float)
    flow_rate = Column(Float)
    mud_density = Column(Float)
    standpipe_pressure = Column(Float)

    well = relationship("Well", back_populates="drilling_parameters")

class HistoricalEvent(Base):
    __tablename__ = "historical_events"
    id = Column(String, primary_key=True, index=True)
    well_id = Column(String, ForeignKey("wells.id"))
    depth = Column(Float)
    formation_name = Column(String)
    event_type = Column(String)
    severity = Column(String)
    description = Column(String)
    mitigation = Column(String)
    outcome = Column(String)
    date = Column(Date)
    duration_hours = Column(Float)
    npt_hours = Column(Float)

    well = relationship("Well", back_populates="historical_events")

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    well_id = Column(String, ForeignKey("wells.id"))
    depth = Column(Float)
    risk_level = Column(String)
    risk_score = Column(Float)
    mud_loss_score = Column(Float)
    stuck_pipe_score = Column(Float)
    kick_score = Column(Float)
    cementing_score = Column(Float)
    contributing_factors = Column(Text) # JSON string
    nearby_events_count = Column(Integer)

    well = relationship("Well", back_populates="risk_predictions")
"""

files["app/schemas.py"] = """from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date, datetime

class FormationBase(BaseModel):
    name: str
    description: str
    lithology: str
    porosity: float
    permeability: float
    pressure_gradient: float

class FormationResponse(FormationBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class WellFormationBase(BaseModel):
    top_depth: float
    bottom_depth: float
    remarks: Optional[str] = None

class WellFormationResponse(WellFormationBase):
    id: int
    formation: FormationResponse
    model_config = ConfigDict(from_attributes=True)

class WellBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    total_depth: float
    well_type: str
    status: str
    spud_date: date
    completion_date: Optional[date] = None
    operator: str
    field_name: str

class WellResponse(WellBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class WellDetailResponse(WellResponse):
    formations: List[WellFormationResponse] = []
    event_count: int = 0

class SimilarWellResponse(BaseModel):
    well: WellResponse
    relevance_score: float
    distance_km: float

class DrillingParameterResponse(BaseModel):
    id: int
    well_id: str
    timestamp: datetime
    depth: float
    rop: float
    wob: float
    torque: float
    rpm: float
    pump_pressure: float
    flow_rate: float
    mud_density: float
    standpipe_pressure: float
    model_config = ConfigDict(from_attributes=True)

class HistoricalEventBase(BaseModel):
    depth: float
    formation_name: str
    event_type: str
    severity: str
    description: str
    mitigation: str
    outcome: str
    date: date
    duration_hours: float
    npt_hours: float

class HistoricalEventResponse(HistoricalEventBase):
    id: str
    well_id: str
    model_config = ConfigDict(from_attributes=True)

class RiskPredictionBase(BaseModel):
    depth: float
    risk_level: str
    risk_score: float
    mud_loss_score: float
    stuck_pipe_score: float
    kick_score: float
    cementing_score: float
    contributing_factors: str
    nearby_events_count: int

class RiskPredictionResponse(RiskPredictionBase):
    id: int
    well_id: str
    model_config = ConfigDict(from_attributes=True)

class RiskSummaryResponse(BaseModel):
    well_id: str
    overall_risk_level: str
    overall_risk_score: float
    mud_loss_avg: float
    stuck_pipe_avg: float
    kick_avg: float
    cementing_avg: float
"""

files["app/seed_data.py"] = """from sqlalchemy.orm import Session
from datetime import date, timedelta
import random
import json
from app.models import Well, Formation, WellFormation, HistoricalEvent, RiskPrediction
from app.database import engine, Base

def seed_database(db: Session):
    # Check if data exists
    if db.query(Well).first():
        return

    # Formations
    formations_data = [
        {"name": "FORMATION-A", "description": "Tipam Sandstone", "lithology": "Sandstone", "porosity": 22.5, "permeability": 150.0, "pressure_gradient": 0.43},
        {"name": "FORMATION-B", "description": "Girujan Clay", "lithology": "Clay/Shale", "porosity": 15.0, "permeability": 10.0, "pressure_gradient": 0.46},
        {"name": "FORMATION-C", "description": "Barail Series", "lithology": "Sandstone/Shale", "porosity": 18.0, "permeability": 50.0, "pressure_gradient": 0.52},
        {"name": "FORMATION-D", "description": "Disang Shale", "lithology": "Shale", "porosity": 8.0, "permeability": 0.1, "pressure_gradient": 0.65},
        {"name": "FORMATION-X", "description": "Naga Thrust Zone", "lithology": "Fractured Shale/Siltstone", "porosity": 12.0, "permeability": 5.0, "pressure_gradient": 0.85},
    ]
    
    db_formations = []
    for f in formations_data:
        formation = Formation(**f)
        db.add(formation)
        db.commit()
        db.refresh(formation)
        db_formations.append(formation)

    # Wells (Assam region ~ 27.0N, 95.0E)
    wells_data = []
    wells_data.append(Well(
        id="WELL-A", name="A-Prototype (Live)", latitude=27.015, longitude=95.020,
        total_depth=3500.0, well_type="development", status="active",
        spud_date=date(2023, 8, 1), field_name="Assam-Synthetic"
    ))
    
    for i in range(1, 15):
        letter = chr(65 + i)
        w_id = f"WELL-{letter}"
        w_type = random.choice(["exploration", "development", "appraisal"])
        w_lat = 27.0 + random.uniform(-0.1, 0.1)
        w_lon = 95.0 + random.uniform(-0.1, 0.1)
        w_depth = random.uniform(1800.0, 3500.0)
        spud = date(2010 + random.randint(0, 12), random.randint(1, 12), random.randint(1, 28))
        comp = spud + timedelta(days=random.randint(45, 120))
        
        wells_data.append(Well(
            id=w_id, name=f"{letter}-Historical", latitude=w_lat, longitude=w_lon,
            total_depth=w_depth, well_type=w_type, status=random.choice(["completed", "suspended"]),
            spud_date=spud, completion_date=comp, field_name="Assam-Synthetic"
        ))
        
    db.add_all(wells_data)
    db.commit()

    # Well Formations
    for w in wells_data:
        w_formations = [
            WellFormation(well_id=w.id, formation_id=db_formations[0].id, top_depth=500.0, bottom_depth=1200.0),
            WellFormation(well_id=w.id, formation_id=db_formations[1].id, top_depth=1200.0, bottom_depth=1800.0),
            WellFormation(well_id=w.id, formation_id=db_formations[2].id, top_depth=1800.0, bottom_depth=2400.0),
            WellFormation(well_id=w.id, formation_id=db_formations[3].id, top_depth=2400.0, bottom_depth=2800.0),
            WellFormation(well_id=w.id, formation_id=db_formations[4].id, top_depth=2800.0, bottom_depth=3200.0)
        ]
        db.add_all(w_formations)
    db.commit()

    # Historical Events
    event_types = ["Mud Loss", "Stuck Pipe", "Kick", "High Torque", "Overpressure", "Lost Circulation", "Fishing", "Cementing Issue", "Casing Issue", "NPT"]
    severities = ["Low", "Medium", "High", "Severe", "Critical"]
    
    events = []
    for i in range(120):
        w = random.choice(wells_data[1:])
        depth = random.uniform(500, w.total_depth)
        
        if 500 <= depth < 1200: f_name = "FORMATION-A"
        elif 1200 <= depth < 1800: f_name = "FORMATION-B"
        elif 1800 <= depth < 2400: f_name = "FORMATION-C"
        elif 2400 <= depth < 2800: f_name = "FORMATION-D"
        else: f_name = "FORMATION-X"
        
        # Bias towards high risk
        if f_name in ["FORMATION-D", "FORMATION-X"]:
            e_type = random.choice(["Kick", "Stuck Pipe", "Mud Loss", "Overpressure", "High Torque"])
            sev = random.choice(["High", "Severe", "Critical"])
        else:
            e_type = random.choice(event_types)
            sev = random.choice(severities)
            
        events.append(HistoricalEvent(
            id=f"EVT-{i:03d}",
            well_id=w.id,
            depth=depth,
            formation_name=f_name,
            event_type=e_type,
            severity=sev,
            description=f"Encountered {e_type} at {depth:.1f}m in {f_name}.",
            mitigation=f"Applied standard operating procedures for {e_type}.",
            outcome="Resolved after NPT.",
            date=w.spud_date + timedelta(days=random.randint(10, 40)),
            duration_hours=random.uniform(2.0, 48.0),
            npt_hours=random.uniform(1.0, 24.0)
        ))
    db.add_all(events)
    db.commit()

    # Risk Predictions for WELL-A
    risks = []
    for d in range(500, 3250, 50):
        depth = float(d)
        if depth < 1800:
            rl = random.choice(["LOW", "MEDIUM"])
            rs = random.uniform(10, 40)
        elif 1800 <= depth < 2800:
            rl = random.choice(["MEDIUM", "HIGH"])
            rs = random.uniform(40, 75)
        else:
            rl = random.choice(["VERY HIGH", "CRITICAL"])
            rs = random.uniform(75, 95)
            
        factors = {"pressure": "high", "lithology_risk": True}
        
        risks.append(RiskPrediction(
            well_id="WELL-A",
            depth=depth,
            risk_level=rl,
            risk_score=rs,
            mud_loss_score=rs * random.uniform(0.7, 1.1),
            stuck_pipe_score=rs * random.uniform(0.8, 1.2),
            kick_score=rs * random.uniform(0.6, 1.4),
            cementing_score=rs * random.uniform(0.5, 0.9),
            contributing_factors=json.dumps(factors),
            nearby_events_count=random.randint(0, 5)
        ))
    db.add_all(risks)
    db.commit()
"""

files["app/simulator.py"] = """import random
from datetime import datetime
from pydantic import BaseModel

class LiveDrillingData(BaseModel):
    well_id: str
    timestamp: datetime
    depth: float
    rop: float
    wob: float
    torque: float
    rpm: float
    pump_pressure: float
    flow_rate: float
    mud_density: float
    standpipe_pressure: float

class DrillingSimulator:
    def __init__(self):
        self.well_id = "WELL-A"
        self.depth = 2430.0
        
    def get_live_data(self) -> LiveDrillingData:
        # Increment depth statefully
        self.depth += random.uniform(0.5, 2.0)
        
        # Base parameters
        rop = random.uniform(5.0, 25.0)
        wob = random.uniform(10.0, 25.0)
        torque = random.uniform(15.0, 30.0)
        rpm = random.uniform(80.0, 160.0)
        pump_pressure = random.uniform(2800.0, 3500.0)
        flow_rate = random.uniform(350.0, 500.0)
        mud_density = random.uniform(1.10, 1.25)
        standpipe_pressure = random.uniform(2500.0, 3200.0)
        
        # Occasional anomalies
        if random.random() < 0.05:
            torque += 20.0  # Spike
        if random.random() < 0.05:
            pump_pressure -= 500.0 # Drop
            
        return LiveDrillingData(
            well_id=self.well_id,
            timestamp=datetime.utcnow(),
            depth=self.depth,
            rop=rop,
            wob=wob,
            torque=torque,
            rpm=rpm,
            pump_pressure=pump_pressure,
            flow_rate=flow_rate,
            mud_density=mud_density,
            standpipe_pressure=standpipe_pressure
        )

simulator = DrillingSimulator()
"""

files["app/main.py"] = """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.config import settings
from app.seed_data import seed_database
from app.routers import wells, formations, events, drilling, risk

app = FastAPI(title="NWIS Prototype API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

app.include_router(wells.router, prefix="/api/wells", tags=["Wells"])
app.include_router(formations.router, prefix="/api/formations", tags=["Formations"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(drilling.router, prefix="/api/drilling", tags=["Drilling"])
app.include_router(risk.router, prefix="/api/risk", tags=["Risk"])
"""

files["app/routers/__init__.py"] = ""

files["app/routers/wells.py"] = """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import math
from app.database import get_db
from app.models import Well
from app.schemas import WellResponse, WellDetailResponse, SimilarWellResponse

router = APIRouter()

@router.get("", response_model=List[WellResponse])
def get_wells(status: Optional[str] = None, well_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Well)
    if status:
        query = query.filter(Well.status == status)
    if well_type:
        query = query.filter(Well.well_type == well_type)
    return query.all()

@router.get("/nearby", response_model=List[WellResponse])
def get_nearby_wells(lat: float, lon: float, radius_km: float, db: Session = Depends(get_db)):
    # Rough approximation for synthetic prototype
    lat_deg_km = 111.0
    lon_deg_km = 111.0 * math.cos(math.radians(lat))
    
    wells = db.query(Well).all()
    nearby = []
    for w in wells:
        d_lat = (w.latitude - lat) * lat_deg_km
        d_lon = (w.longitude - lon) * lon_deg_km
        dist = math.sqrt(d_lat**2 + d_lon**2)
        if dist <= radius_km:
            nearby.append(w)
    return nearby

@router.get("/{well_id}", response_model=WellDetailResponse)
def get_well(well_id: str, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
    
    event_count = len(well.historical_events)
    formations_res = [{"id": wf.id, "top_depth": wf.top_depth, "bottom_depth": wf.bottom_depth, "remarks": wf.remarks, "formation": wf.formation} for wf in well.formations]
    
    return WellDetailResponse(
        id=well.id, name=well.name, latitude=well.latitude, longitude=well.longitude,
        total_depth=well.total_depth, well_type=well.well_type, status=well.status,
        spud_date=well.spud_date, completion_date=well.completion_date,
        operator=well.operator, field_name=well.field_name,
        formations=formations_res,
        event_count=event_count
    )

@router.get("/{well_id}/similar", response_model=List[SimilarWellResponse])
def get_similar_wells(well_id: str, db: Session = Depends(get_db)):
    target = db.query(Well).filter(Well.id == well_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Well not found")
    
    wells = db.query(Well).filter(Well.id != well_id).all()
    results = []
    
    lat_deg_km = 111.0
    lon_deg_km = 111.0 * math.cos(math.radians(target.latitude))
    
    for w in wells:
        d_lat = (w.latitude - target.latitude) * lat_deg_km
        d_lon = (w.longitude - target.longitude) * lon_deg_km
        dist = math.sqrt(d_lat**2 + d_lon**2)
        
        dist_score = max(0, 100 - dist)
        depth_diff = abs(w.total_depth - target.total_depth)
        depth_score = max(0, 100 - (depth_diff / 50))
        form_score = 80.0
        
        relevance = (dist_score * 0.40) + (form_score * 0.35) + (depth_score * 0.25)
        results.append({
            "well": w,
            "relevance_score": relevance,
            "distance_km": dist
        })
        
    results.sort(key=lambda x: x["relevance_score"], reverse=True)
    return results[:10]
"""

files["app/routers/formations.py"] = """from fastapi import APIRouter, Depends, HTTPException
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
"""

files["app/routers/events.py"] = """from fastapi import APIRouter, Depends, HTTPException
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
"""

files["app/routers/drilling.py"] = """from fastapi import APIRouter
from app.simulator import simulator

router = APIRouter()

@router.get("/live")
def get_live_drilling_data():
    return simulator.get_live_data()
"""

files["app/routers/risk.py"] = """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import RiskPrediction
from app.schemas import RiskPredictionResponse, RiskSummaryResponse

router = APIRouter()

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
    risks = db.query(RiskPrediction).filter(RiskPrediction.well_id == well_id).order_by(RiskPrediction.depth).all()
    return risks
"""

for path, content in files.items():
    full_path = os.path.join(base_dir, path)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Project scaffolded successfully!")
