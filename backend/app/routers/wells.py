from fastapi import APIRouter, Depends, HTTPException
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
    
    target_formations = set()
    for wf in target.formations:
        target_formations.add(wf.formation_id)
    
    wells = db.query(Well).filter(Well.id != well_id).all()
    results = []
    
    lat_deg_km = 111.0
    lon_deg_km = 111.0 * math.cos(math.radians(target.latitude))
    
    for w in wells:
        d_lat = (w.latitude - target.latitude) * lat_deg_km
        d_lon = (w.longitude - target.longitude) * lon_deg_km
        dist = math.sqrt(d_lat**2 + d_lon**2)
        
        # Distance score: closer = higher (max 100)
        dist_score = max(0, 100 - dist * 5)
        
        # Depth similarity score
        depth_diff = abs(w.total_depth - target.total_depth)
        depth_score = max(0, 100 - (depth_diff / 30))
        
        # Formation similarity: Jaccard-like overlap
        w_formations = set(wf.formation_id for wf in w.formations)
        if target_formations and w_formations:
            form_score = (len(target_formations & w_formations) / len(target_formations | w_formations)) * 100
        else:
            form_score = 0.0
        
        relevance = (dist_score * 0.40) + (form_score * 0.35) + (depth_score * 0.25)
        relevance = min(relevance, 99.0)
        
        results.append(SimilarWellResponse(
            well=WellResponse.model_validate(w),
            relevance_score=round(relevance, 1),
            distance_km=round(dist, 2),
            formation_similarity=round(form_score, 1),
            depth_similarity=round(depth_score, 1)
        ))
        
    results.sort(key=lambda x: x.relevance_score, reverse=True)
    return results[:10]
