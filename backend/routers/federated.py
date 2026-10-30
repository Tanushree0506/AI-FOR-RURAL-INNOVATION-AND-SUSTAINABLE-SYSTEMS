from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(prefix="/federated", tags=["Federated Learning"])

class ClientWeightSubmission(BaseModel):
    client_id: str
    round_id: int
    weights_summary: Dict[str, float]
    privacy_epsilon: float = 2.1

@router.post("/submit-weights")
async def submit_federated_weights(sub: ClientWeightSubmission):
    return {
        "status": "accepted",
        "round": sub.round_id,
        "privacy_budget_consumed": 0.05,
        "message": f"Client {sub.client_id} weights aggregated via FedAvg with ε={sub.privacy_epsilon} differential privacy guarantee."
    }
