"""
Pydantic Schemas for KrishiSense (AI4RISS)
"""

from pydantic import BaseModel, Field
from typing import List, Optional

class SoilTestData(BaseModel):
    nitrogen: float = Field(..., ge=0, le=200, description="Nitrogen in kg/ha")
    phosphorus: float = Field(..., ge=0, le=200, description="Phosphorus in kg/ha")
    potassium: float = Field(..., ge=0, le=300, description="Potassium in kg/ha")
    temperature: float = Field(..., ge=-10, le=60, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative Humidity in percentage")
    ph: float = Field(..., ge=0, le=14, description="Soil pH value")
    rainfall: float = Field(..., ge=0, le=1000, description="Seasonal rainfall in mm")

class CropMatch(BaseModel):
    crop: str
    suitability: int
    rank: int
    advice: str

class CropRecommendationResponse(BaseModel):
    status: str
    top_matches: List[CropMatch]
    inference_type: str = "Gaussian Naive Bayes (On-Device/Server Hybrid)"

class SensorReading(BaseModel):
    zone_id: str = "Zone-1"
    moisture: float
    temperature: float
    humidity: float
    ph: float
    ndvi: float
    data_gap_pct: float
    timestamp: Optional[str] = None

class YieldPredictionRequest(BaseModel):
    crop: str = "Rice"
    moisture: float
    temperature: float
    ndvi: float
    historical_yield_baseline: float = 3.49

class YieldPredictionResponse(BaseModel):
    predicted_yield_t_ha: float
    improvement_vs_baseline_pct: float
    confidence_interval_low: float
    confidence_interval_high: float
    model: str = "LSTM-GRU Hybrid with Self-Attention"

class PestDetectionResult(BaseModel):
    detected_pest: str
    scientific_name: str
    severity: str
    confidence_pct: float
    instances_found: int
    organic_remedy: str
    model: str = "YOLOv8-nano Edge Diagnostic"

class CropStageLeafDiseaseRequest(BaseModel):
    crop: str = "Tomato"
    growth_stage: str = "Vegetative" # Seedling, Vegetative, Flowering & Fruit Set, Maturity / Harvest
    symptom_notes: Optional[str] = None

class CropStageLeafDiseaseResult(BaseModel):
    crop: str
    growth_stage: str
    disease_name: str
    scientific_name: str
    pathogen_type: str # Fungal, Bacterial, Viral, Pest Damage, Physiological Deficit
    severity_level: str # Mild (<15%), Moderate (15-40%), Severe (>40%)
    leaf_coverage_pct: float
    confidence_pct: float
    symptom_description: str
    organic_biocontrol: str
    chemical_intervention: str
    dosage_guide: str
    pre_harvest_interval_days: int
    iot_environmental_trigger: str
    edge_model: str = "MobileNetV3 + YOLOv8 Stage Leaf Classifier"

class IoTNodeTelemetry(BaseModel):
    node_id: str = "ESP32-KLR-NODE-01"
    gateway: str = "LoRaWAN-SX1278-868MHz"
    battery_level_pct: float = 94.5
    soil_moisture_pct: float
    soil_temperature_c: float
    nitrogen_mg_kg: float
    phosphorus_mg_kg: float
    potassium_mg_kg: float
    soil_ph: float
    drip_valve_state: str = "CLOSED" # OPEN, CLOSED, PULSING
    water_saved_pct: float = 48.0
    timestamp: Optional[str] = None


class MarketMatchRequest(BaseModel):
    crop: str = "Tomato"
    farmer_location: str = "Kolar"
    quantity_quintals: float = 10.0

class MandiDealer(BaseModel):
    dealer_id: str
    dealer_name: str
    mandi_name: str
    taluk: str = "Kolar"
    phone: str
    whatsapp: str
    apmc_license_no: str
    commodities: List[str]
    rating: float = 4.8
    verified: bool = True

class MandiDeal(BaseModel):
    dealer_id: Optional[str] = None
    mandi_name: str
    taluk: Optional[str] = "Kolar"
    crop: str
    modal_price_inr_q: float
    min_price_inr_q: Optional[float] = None
    max_price_inr_q: Optional[float] = None
    buyer_name: str
    buyer_phone: Optional[str] = None
    whatsapp_url: Optional[str] = None
    distance_km: float
    freight_cost_inr_t: float
    net_revenue_inr: float
    arrival_date: Optional[str] = "Today (Live APMC)"

class FarmerDealerConnectRequest(BaseModel):
    farmer_name: str = Field(..., description="Farmer full name")
    farmer_phone: str = Field(..., description="10-digit mobile number")
    farmer_village: str = Field(..., description="Village / Taluk in Kolar")
    crop: str = Field(..., description="Commodity to sell")
    quantity_quintals: float = Field(..., gt=0, description="Available quantity in quintals")
    dealer_id: Optional[str] = None
    mandi_name: Optional[str] = "APMC Market Yard, Kolar"
    dealer_name: Optional[str] = None
    expected_price_per_q: Optional[float] = None
    preferred_date: Optional[str] = None
    message: Optional[str] = None

class FarmerDealerConnectResponse(BaseModel):
    status: str = "connected"
    connection_id: str
    farmer_name: str
    crop: str
    quantity_quintals: float
    dealer_name: str
    dealer_phone: str
    mandi_name: str
    whatsapp_link: str
    call_link: str
    message: str

