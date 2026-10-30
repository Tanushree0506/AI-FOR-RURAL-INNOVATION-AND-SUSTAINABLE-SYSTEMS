# 🚀 KrishiSense (AI4RISS) — Backend API Guide

This directory contains the Python FastAPI backend for **KrishiSense — AI for Rural Intelligence and Sustainable Systems (AI4RISS)**.

---

## 🛠️ Installation & Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **(Optional) Start MongoDB**:
   ```bash
   mongod --dbpath /data/db
   ```
   *Note: If MongoDB is not running, the application automatically switches to an in-memory storage fallback.*

3. **Run the FastAPI Development Server**:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

4. **Access Interactive Swagger Docs**:
   Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Model/Algorithm |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/crop/recommend` | NPK + Climate crop recommendations | Gaussian Naive Bayes |
| `POST` | `/api/yield/forecast` | Harvest volume projection | LSTM-GRU Hybrid + Attention |
| `POST` | `/api/pest/detect` | Leaf/pest image classification & remedy | YOLOv8-nano Vision |
| `GET` | `/api/sensors/current` | Real-time IoT soil/ambient telemetry | ST-GNN Imputation |
| `POST` | `/api/market/match` | Mandi buyer matchmaking & freight costs | GCN + Dijkstra Routing |
| `POST` | `/api/federated/submit-weights` | Edge weight submission | FedAvg ($\varepsilon = 2.1$) |
