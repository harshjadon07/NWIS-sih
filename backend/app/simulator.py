import random
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
