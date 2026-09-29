from sqlalchemy.orm import Session
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
