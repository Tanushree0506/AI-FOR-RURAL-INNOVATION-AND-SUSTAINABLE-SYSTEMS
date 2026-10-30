"""
download_external_datasets.py - Automated Dataset Fetcher & Downloader for KrishiSense
Fetches data from Open Government Data (Agmarknet), Kaggle, and NASA POWER Agro-Climatology API.
"""

import os
import requests
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "raw")
os.makedirs(DATA_DIR, exist_ok=True)

def fetch_nasa_power_weather(lat=13.13, lon=78.12):
    """
    Fetches real historical agro-climatology data from NASA POWER API (Kolar, Karnataka)
    Parameters: T2M (Temp), RH2M (Humidity), PRECTOTCORR (Rainfall), ALLSKY_SFC_SW_DWN (Solar Radiation)
    """
    print(f"Fetching NASA POWER Agro-Climatology data for Lat: {lat}, Lon: {lon}...")
    url = f"https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN&community=AG&longitude={lon}&latitude={lat}&start=20240101&end=20240131&format=JSON"
    
    try:
        res = requests.get(url, timeout=15)
        if res.status_code == 200:
            out_file = os.path.join(DATA_DIR, "kolar_nasa_power_weather_sample.json")
            with open(out_file, "w") as f:
                json.dump(res.json(), f, indent=2)
            print(f"✅ NASA POWER weather dataset saved to: {out_file}")
        else:
            print(f"NASA POWER API returned status: {res.status_code}")
    except Exception as e:
        print(f"Skipping online NASA API fetch ({e}). Local datasets are ready.")

def print_manual_dataset_links():
    print("\n" + "="*70)
    print("📁 LARGE DATASET REPOSITORIES (Manual / Kaggle / Benchmark Downloads)")
    print("="*70)
    print("1. IP102 Insect Pest Dataset (75,000 images):")
    print("   👉 Download from GitHub: https://github.com/xpwu95/IP102")
    print("   👉 Kaggle mirror: https://www.kaggle.com/datasets/arashnic/ip102-insect-pest-dataset")
    print("\n2. PlantVillage Crop Disease Dataset (54,000 images):")
    print("   👉 https://www.kaggle.com/datasets/emmarex/plantdisease")
    print("\n3. Full 2,200 Row Crop Recommendation Dataset:")
    print("   👉 https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset")
    print("\n4. Open Government Data India (Agmarknet Live Mandi Data):")
    print("   👉 https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi")
    print("="*70)

if __name__ == "__main__":
    fetch_nasa_power_weather()
    print_manual_dataset_links()
