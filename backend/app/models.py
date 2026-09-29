from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
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


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String, index=True)
    upload_date = Column(DateTime)
    status = Column(String)
    well_id = Column(String, nullable=True)
    
    chunks = relationship("DocumentChunk", back_populates="document")
    entities = relationship("DocumentEntity", back_populates="document")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    chunk_text = Column(String)
    page_number = Column(Integer)
    embedding_id = Column(Integer, index=True)
    
    document = relationship("Document", back_populates="chunks")

class DocumentEntity(Base):
    __tablename__ = "document_entities"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    entity_type = Column(String, index=True)
    entity_value = Column(String, index=True)
    context = Column(String)
    
    document = relationship("Document", back_populates="entities")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime)
    well_id = Column(String, ForeignKey("wells.id"))
    depth = Column(Float)
    risk_score = Column(Float)
    severity = Column(String)
    reason = Column(String)
    evidence = Column(Text)
    related_wells = Column(Text)
    related_reports = Column(Text)
    status = Column(String)
    distance_to_zone = Column(Float, nullable=True)
    historical_similarity = Column(Float, nullable=True)
