from pydantic import BaseModel, ConfigDict
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
    formation_similarity: float = 0.0
    depth_similarity: float = 0.0

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

class DocumentChunkBase(BaseModel):
    chunk_text: str
    page_number: int
    embedding_id: int

class DocumentChunkResponse(DocumentChunkBase):
    id: int
    document_id: int
    model_config = ConfigDict(from_attributes=True)

class DocumentEntityBase(BaseModel):
    entity_type: str
    entity_value: str
    context: str

class DocumentEntityResponse(DocumentEntityBase):
    id: int
    document_id: int
    model_config = ConfigDict(from_attributes=True)

class DocumentBase(BaseModel):
    filename: str
    upload_date: datetime
    status: str
    well_id: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: int
    chunks: List[DocumentChunkResponse] = []
    entities: List[DocumentEntityResponse] = []
    model_config = ConfigDict(from_attributes=True)

class SearchResult(BaseModel):
    chunk: DocumentChunkResponse
    document: DocumentResponse
    entities: List[DocumentEntityResponse] = []
    score: float

class AlertBase(BaseModel):
    well_id: str
    depth: float
    risk_score: float
    severity: str
    reason: str
    evidence: str
    related_wells: str
    related_reports: str
    status: str
    distance_to_zone: Optional[float] = None
    historical_similarity: Optional[float] = None

class AlertResponse(AlertBase):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)
