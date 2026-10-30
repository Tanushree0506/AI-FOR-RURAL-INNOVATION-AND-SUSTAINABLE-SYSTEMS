"""
crop.py - Gaussian Naive Bayes Crop Advisor for Kolar & South Indian Agro-Climatic Zones
"""

from fastapi import APIRouter
import math
from ..models import SoilTestData, CropRecommendationResponse, CropMatch
from ..database import db_manager

router = APIRouter(prefix="/crop", tags=["Crop Advisor"])

# Statistical parameters (means, standard deviations) for regional crops calibrated for Kolar
# Features: [N, P, K, temperature, humidity, ph, rainfall]
CROP_STATS = {
    "tomato": ([95.0, 54.0, 75.0, 25.5, 65.0, 6.4, 90.0], [12.0, 7.5, 9.0, 2.2, 5.0, 0.4, 15.0]),
    "chilli": ([100.0, 55.0, 60.0, 24.5, 68.0, 6.5, 85.0], [12.5, 8.0, 7.5, 2.0, 6.0, 0.45, 14.0]),
    "spinach": ([60.0, 40.0, 40.0, 18.5, 60.0, 6.8, 65.0], [10.0, 6.5, 6.0, 3.0, 7.0, 0.4, 12.0]),
    "ragi": ([45.0, 35.0, 40.0, 26.5, 62.0, 6.4, 75.0], [10.0, 6.0, 7.0, 2.5, 6.0, 0.45, 12.0]),
    "groundnut": ([25.0, 48.0, 35.0, 27.0, 58.0, 6.5, 85.0], [8.0, 6.5, 6.0, 2.0, 5.5, 0.4, 14.0]),
    "maize": ([80.0, 48.0, 38.0, 25.0, 64.0, 6.4, 95.0], [11.0, 7.0, 6.5, 2.4, 5.0, 0.4, 14.0]),
    "rice": ([79.89, 47.58, 39.87, 23.69, 82.27, 6.43, 236.18], [11.86, 7.87, 2.93, 2.02, 1.41, 0.76, 34.12]),
    "cotton": ([117.77, 46.24, 19.56, 23.99, 79.84, 6.91, 80.40], [11.57, 7.31, 3.15, 1.13, 3.04, 0.62, 11.18]),
    "chickpea": ([40.09, 67.79, 79.92, 18.87, 16.86, 7.34, 80.06], [12.09, 7.46, 3.25, 1.16, 1.70, 0.80, 7.90]),
    "watermelon": ([98.0, 22.0, 50.0, 28.0, 80.0, 6.5, 60.0], [11.5, 6.0, 6.5, 1.5, 4.0, 0.35, 10.0]),
    "mango": ([22.0, 28.0, 32.0, 30.0, 52.0, 6.0, 90.0], [10.0, 6.5, 6.0, 2.5, 6.0, 0.6, 12.0]),
    "banana": ([100.23, 82.01, 50.05, 27.38, 80.36, 5.98, 104.63], [11.05, 7.65, 3.37, 1.42, 2.79, 0.27, 9.35])
}

ADVICE = {
    "tomato": "Flagship Kolar cash crop. Sensitive to water stagnation. Use drip fertigation with calcium and split potassium.",
    "chilli": "Key commercial spice crop in Kolar red soil. Prone to thrips and leaf curl virus. Apply neem spray and split nitrogen.",
    "spinach": "Rapid 35-45 day short-duration leafy green. Prefers rich organic manure and light regular watering for multiple cuttings.",
    "ragi": "Traditional Kolar dryland staple. Highly drought-tolerant; excels in red sandy loam with split N at 30 days.",
    "groundnut": "Thrives in well-drained red loam. Apply Gypsum @ 500 kg/ha at pegging (35–40 days) for optimal pod filling.",
    "maize": "High nitrogen feeder. Split N into basal, knee-high, and tasseling stages for 5+ t/ha yield.",
    "rice": "Submerged cultivation recommended. Check for early stem borer signs.",
    "cotton": "Ensure well-drained loam soil. Set pheromone traps for bollworm.",
    "chickpea": "Apply phosphorus solubilizing bacteria (PSB) bio-fertilizer in cool winter conditions.",
    "watermelon": "Lucrative summer catch crop. Reduce irrigation 10 days before harvest to concentrate sugars.",
    "mango": "Srinivaspur / Kolar mango belt specialty. Ensure post-harvest pruning and fruit fly traps.",
    "banana": "Provide mulch cover to conserve soil potassium and maintain moisture."
}

@router.post("/recommend", response_model=CropRecommendationResponse)
async def recommend_crop(soil: SoilTestData):
    values = [soil.nitrogen, soil.phosphorus, soil.potassium, soil.temperature, soil.humidity, soil.ph, soil.rainfall]
    scores = []

    for crop, (means, stds) in CROP_STATS.items():
        nll = 0.0
        for i in range(len(values)):
            var = max(stds[i] ** 2, 0.0001)
            nll += 0.5 * (math.log(2 * math.pi * var) + ((values[i] - means[i]) ** 2) / var)
        scores.append((crop, nll))

    scores.sort(key=lambda x: x[1])
    leading = scores[0][1]

    top_matches = []
    for rank, (crop, nll) in enumerate(scores[:3], 1):
        suitability = max(1, min(99, int(100 * math.exp(-(nll - leading) / 7.0))))
        top_matches.append(CropMatch(
            crop=crop,
            suitability=suitability,
            rank=rank,
            advice=ADVICE.get(crop, "Ensure balanced NPK soil dosage and timely weed eradication.")
        ))

    # Log to DB
    await db_manager.insert_record("soil_tests", {
        "inputs": soil.dict(),
        "top_crop": top_matches[0].crop,
        "suitability": top_matches[0].suitability
    })

    return CropRecommendationResponse(
        status="success",
        top_matches=top_matches,
        inference_type="Gaussian Naive Bayes (On-Device/Server Hybrid)"
    )
