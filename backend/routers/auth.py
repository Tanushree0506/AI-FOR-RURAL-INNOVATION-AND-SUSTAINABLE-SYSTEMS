"""
auth.py - Multi-Method Authentication Router (OTP + Kisan ID) for KrishiSense
Supports:
1. Mobile Number + SMS OTP Authentication
2. Kisan ID (PM-KISAN / AgriStack / KCC ID) + PIN Authentication
3. Offline & In-Memory fallback user directory
"""

import random
import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory OTP storage: phone -> {"otp": str, "expires_at": float}
OTP_STORE: Dict[str, Dict[str, Any]] = {}

# Pre-registered Verified Farmer Directory (Kolar, Bangalore Rural, Punjab, Chikkaballapur)
FARMER_DIRECTORY = {
    "KA-KOL-8891": {
        "kisan_id": "KA-KOL-8891",
        "name": "Ramesh Gowda",
        "phone": "9845012345",
        "pin": "1234",
        "village": "Vokkaleri",
        "taluk": "Kolar",
        "district": "Kolar",
        "state": "Karnataka",
        "land_holding_acres": 3.5,
        "soil_type": "Red Sandy Loam",
        "primary_crops": ["Tomato", "Chilli", "Ragi"],
        "kcc_card_status": "Active (Limit ₹1,80,000)",
        "soil_health_card": "SHC-KA-2025-0982",
        "role": "Smallholder Farmer",
        "avatar_emoji": "👨‍🌾"
    },
    "KA-BLR-4421": {
        "kisan_id": "KA-BLR-4421",
        "name": "Sunita Devi",
        "phone": "9886098765",
        "pin": "4421",
        "village": "Hoskote",
        "taluk": "Hoskote",
        "district": "Bangalore Rural",
        "state": "Karnataka",
        "land_holding_acres": 2.0,
        "soil_type": "Clay Loam",
        "primary_crops": ["Tomato", "Capsicum", "Spinach"],
        "kcc_card_status": "Active (Limit ₹1,20,000)",
        "soil_health_card": "SHC-KA-2024-5512",
        "role": "Organic Horticulturist",
        "avatar_emoji": "👩‍🌾"
    },
    "PB-LDH-1092": {
        "kisan_id": "PB-LDH-1092",
        "name": "Harpreet Singh",
        "phone": "9814054321",
        "pin": "1092",
        "village": "Samrala",
        "taluk": "Ludhiana",
        "district": "Ludhiana",
        "state": "Punjab",
        "land_holding_acres": 7.5,
        "soil_type": "Alluvial Loam",
        "primary_crops": ["Wheat", "Paddy", "Maize"],
        "kcc_card_status": "Active (Limit ₹4,50,000)",
        "soil_health_card": "SHC-PB-2025-1109",
        "role": "Progressive Farmer",
        "avatar_emoji": "👳‍♂️"
    },
    "KA-CKB-7730": {
        "kisan_id": "KA-CKB-7730",
        "name": "Gopala Krishna",
        "phone": "9448077301",
        "pin": "7730",
        "village": "Sidlaghatta",
        "taluk": "Sidlaghatta",
        "district": "Chikkaballapur",
        "state": "Karnataka",
        "land_holding_acres": 4.0,
        "soil_type": "Red Loam",
        "primary_crops": ["Mulberry", "Ragi", "Groundnut"],
        "kcc_card_status": "Active (Limit ₹2,00,000)",
        "soil_health_card": "SHC-KA-2024-8831",
        "role": "Sericulture & FPO Member",
        "avatar_emoji": "👨‍🌾"
    }
}

# Lookup by phone
PHONE_INDEX = {farmer["phone"]: farmer for farmer in FARMER_DIRECTORY.values()}

# Request / Response Schemas
class SendOTPRequest(BaseModel):
    phone: str = Field(..., description="10-digit Indian Mobile Number without country code or with +91")

class VerifyOTPRequest(BaseModel):
    phone: str = Field(..., description="10-digit mobile number")
    otp: str = Field(..., min_length=4, max_length=6, description="Received OTP code")
    name: Optional[str] = None
    district: Optional[str] = "Kolar"

class KisanLoginRequest(BaseModel):
    kisan_id: str = Field(..., description="Government Kisan ID, AgriStack ID, or PM-KISAN ID")
    pin: str = Field(..., min_length=4, description="4-digit PIN or Passcode")

def normalize_phone(phone: str) -> str:
    cleaned = "".join(filter(str.isdigit, phone))
    if len(cleaned) == 12 and cleaned.startswith("91"):
        cleaned = cleaned[2:]
    return cleaned

@router.post("/otp/send")
async def send_otp(payload: SendOTPRequest):
    phone = normalize_phone(payload.phone)
    if len(phone) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid 10-digit mobile number."
        )

    # Generate a predictable or random 6-digit OTP
    # For common test numbers, use convenient codes, else random 6-digit
    if phone in ["9845012345", "9886098765", "9814054321", "9448077301"]:
        otp_code = "123456"
    else:
        otp_code = f"{random.randint(100000, 999999)}"

    # Store OTP valid for 5 minutes (300 seconds)
    OTP_STORE[phone] = {
        "otp": otp_code,
        "expires_at": time.time() + 300
    }

    # Find existing farmer profile name if known
    matched_farmer = PHONE_INDEX.get(phone)
    farmer_name = matched_farmer["name"] if matched_farmer else "Farmer"

    return {
        "success": True,
        "message": f"OTP successfully dispatched to +91 {phone[:5]} {phone[5:]}",
        "phone": phone,
        "expires_in_seconds": 300,
        "simulated_otp": otp_code,  # Provided for frictionless UI preview/testing & local development
        "is_registered": matched_farmer is not None,
        "farmer_name": farmer_name
    }

@router.post("/otp/verify")
async def verify_otp(payload: VerifyOTPRequest):
    phone = normalize_phone(payload.phone)
    stored = OTP_STORE.get(phone)

    # Allow universal fallback demo OTP '123456' or '999999' for instant testing
    is_valid_otp = (
        (stored and stored["otp"] == payload.otp and time.time() <= stored["expires_at"])
        or payload.otp in ["123456", "999999"]
    )

    if not is_valid_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code. Please re-check or request a new OTP."
        )

    # Clear used OTP
    if phone in OTP_STORE:
        del OTP_STORE[phone]

    # Retrieve or dynamically provision farmer account
    if phone in PHONE_INDEX:
        farmer = PHONE_INDEX[phone].copy()
    else:
        # Create new profile for first-time phone login
        farmer_id = f"KA-USR-{phone[-4:]}"
        farmer = {
            "kisan_id": farmer_id,
            "name": payload.name.strip() if payload.name else f"Farmer {phone[-4:]}",
            "phone": phone,
            "pin": "1234",
            "village": "Rural Taluk",
            "taluk": payload.district or "Kolar",
            "district": payload.district or "Kolar",
            "state": "Karnataka",
            "land_holding_acres": 2.5,
            "soil_type": "Red Loam",
            "primary_crops": ["Tomato", "Ragi"],
            "kcc_card_status": "Verified (AgriStack ID Linked)",
            "soil_health_card": f"SHC-KA-2026-{phone[-4:]}",
            "role": "Smallholder Farmer",
            "avatar_emoji": "🌾"
        }
        FARMER_DIRECTORY[farmer_id] = farmer
        PHONE_INDEX[phone] = farmer

    # Remove PIN from returned payload for security
    user_payload = {k: v for k, v in farmer.items() if k != "pin"}
    user_payload["auth_method"] = "otp"
    user_payload["auth_token"] = f"ks_otp_token_{phone}_{int(time.time())}"

    return {
        "success": True,
        "message": f"Welcome back, {farmer['name']}!",
        "user": user_payload
    }

@router.post("/kisan-login")
async def kisan_login(payload: KisanLoginRequest):
    kid = payload.kisan_id.strip().upper()
    pin = payload.pin.strip()

    farmer = FARMER_DIRECTORY.get(kid)
    if not farmer:
        # Check case-insensitive match or custom ID support
        for registered_id, data in FARMER_DIRECTORY.items():
            if registered_id.upper() == kid:
                farmer = data
                break

    if not farmer:
        # If unknown Kisan ID, allow creation if PIN is 4+ digits
        if len(kid) >= 6 and len(pin) >= 4:
            farmer = {
                "kisan_id": kid,
                "name": f"Kisan {kid.split('-')[-1]}",
                "phone": "98000" + "".join([str(ord(c) % 10) for c in kid[-5:]]),
                "pin": pin,
                "village": "Kolar Field",
                "taluk": "Kolar",
                "district": "Kolar",
                "state": "Karnataka",
                "land_holding_acres": 3.0,
                "soil_type": "Red Sandy Loam",
                "primary_crops": ["Tomato", "Chilli"],
                "kcc_card_status": "Verified",
                "soil_health_card": f"SHC-GEN-{kid}",
                "role": "Verified Farmer",
                "avatar_emoji": "🌾"
            }
            FARMER_DIRECTORY[kid] = farmer
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Kisan ID '{kid}' was not found. Please try a registered Kisan ID like KA-KOL-8891 or sign in with OTP."
            )

    # Verify PIN (or fallback 1234 or last 4 digits of ID)
    if farmer.get("pin") != pin and pin != "1234" and pin != kid[-4:]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Kisan PIN / Passcode. (Demo PIN: 1234 or matching card PIN)"
        )

    user_payload = {k: v for k, v in farmer.items() if k != "pin"}
    user_payload["auth_method"] = "kisan_id"
    user_payload["auth_token"] = f"ks_kisan_token_{kid}_{int(time.time())}"

    return {
        "success": True,
        "message": f"Kisan ID {kid} authenticated successfully! Welcome, {farmer['name']}.",
        "user": user_payload
    }

@router.get("/directory")
async def get_farmer_directory():
    """Returns directory of public test/demo farmers for 1-click preview login."""
    public_list = []
    for kid, farmer in FARMER_DIRECTORY.items():
        public_list.append({
            "kisan_id": farmer["kisan_id"],
            "name": farmer["name"],
            "phone": farmer["phone"],
            "location": f"{farmer['village']}, {farmer['district']}",
            "crops": ", ".join(farmer["primary_crops"]),
            "role": farmer["role"],
            "avatar_emoji": farmer["avatar_emoji"]
        })
    return {"farmers": public_list}
