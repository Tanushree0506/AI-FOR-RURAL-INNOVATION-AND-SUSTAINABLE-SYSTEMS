"""
KrishiSense (AI4RISS) - FastAPI Backend Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import db_manager
from .routers import crop, yield_forecast, pest, sensors, market, federated, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db_manager.connect()
    yield
    await db_manager.close()

app = FastAPI(
    title="KrishiSense — AI for Rural Intelligence & Sustainable Systems (AI4RISS)",
    description="FastAPI Backend for Agricultural ML Decision Platform, IoT Telemetry, and Mandi Supply Chain Optimization.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for local and web frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Feature Routers
app.include_router(auth.router, prefix="/api")
app.include_router(crop.router, prefix="/api")
app.include_router(yield_forecast.router, prefix="/api")
app.include_router(pest.router, prefix="/api")
app.include_router(sensors.router, prefix="/api")
app.include_router(market.router, prefix="/api")
app.include_router(federated.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "platform": "KrishiSense (AI4RISS)",
        "version": "2.0.0",
        "status": "operational",
        "docs_url": "/docs",
        "models": {
            "crop_recommendation": "Gaussian Naive Bayes (On-Device & Server)",
            "yield_forecast": "LSTM-GRU Hybrid with Self-Attention",
            "pest_detection": "YOLOv8-nano Edge Diagnostic",
            "supply_chain": "Graph Convolutional Network (GCN) + Dijkstra Shortest Path",
            "resource_optimizer": "Multi-Agent PPO Policy (MARL)",
            "federated_learning": "FedAvg with Differential Privacy (ε=2.1)"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database_mode": "MongoDB" if not db_manager.use_memory else "In-Memory Fallback"}
