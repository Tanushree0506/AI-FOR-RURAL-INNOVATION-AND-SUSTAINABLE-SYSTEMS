from fastapi import APIRouter
from ..models import SensorReading
from ..database import db_manager
import random
import datetime

router = APIRouter(prefix="/sensors", tags=["Sensors Telemetry"])

@router.get("/current", response_model=SensorReading)
async def get_current_sensors():
    reading = SensorReading(
        zone_id="Zone-A",
        moisture=round(random.uniform(35.0, 55.0), 1),
        temperature=round(random.uniform(26.0, 33.0), 1),
        humidity=round(random.uniform(55.0, 80.0), 1),
        ph=round(random.uniform(6.2, 6.8), 2),
        ndvi=round(random.uniform(0.68, 0.82), 2),
        data_gap_pct=round(random.uniform(4.0, 12.0), 1),
        timestamp=datetime.datetime.utcnow().isoformat()
    )

    await db_manager.insert_record("sensor_logs", reading.dict())
    return reading
