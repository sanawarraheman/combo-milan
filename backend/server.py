from fastapi import FastAPI, APIRouter, HTTPException, Header, Request, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import time
from collections import defaultdict
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_PASSCODE = os.environ['ADMIN_PASSCODE']

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Security: server-side admin check + simple per-IP rate limiting
# ---------------------------------------------------------------------------
def verify_admin(x_admin_passcode: Optional[str] = Header(None)):
    if not x_admin_passcode or x_admin_passcode.strip() != ADMIN_PASSCODE:
        raise HTTPException(status_code=403, detail="Invalid admin passcode")


_rate_hits: dict = defaultdict(list)
RATE_LIMIT_PER_MIN = 60


def rate_limit(request: Request):
    # Prefer the real client IP: behind the K8s ingress, request.client.host is
    # the ingress controller pod IP (several of them), which would shard the
    # per-IP bucket and multiply the effective limit by the number of proxies.
    xff = request.headers.get("x-forwarded-for")
    ip = (xff.split(",")[0].strip() if xff else None) or (
        request.client.host if request.client else "unknown"
    )
    now = time.time()
    hits = [t for t in _rate_hits[ip] if now - t < 60]
    if len(hits) >= RATE_LIMIT_PER_MIN:
        raise HTTPException(status_code=429, detail="Too many requests, slow down")
    hits.append(now)
    _rate_hits[ip] = hits


# ---------------------------------------------------------------------------
# Static reference data
# ---------------------------------------------------------------------------
CATEGORIES = [
    {
        "id": "tempered-glass",
        "order": 1,
        "name_en": "Tempered Glass / Glass Guard",
        "name_hi": "टेम्पर्ड ग्लास / ग्लास गार्ड",
        "subCategories": [
            {"key": "curve-glass", "name_en": "Curve Glass", "name_hi": "कर्व ग्लास"}
        ],
    },
    {"id": "touch-oca", "order": 2, "name_en": "Touch / OCA Glass", "name_hi": "टच / OCA ग्लास", "subCategories": []},
    {"id": "folder-display-combo", "order": 3, "name_en": "Folder / Display / Combo", "name_hi": "फोल्डर / डिस्प्ले / कॉम्बो", "subCategories": []},
    {"id": "display-connector", "order": 4, "name_en": "Display Connector", "name_hi": "डिस्प्ले कनेक्टर", "subCategories": []},
    {"id": "frame", "order": 5, "name_en": "Frame / Middle Frame", "name_hi": "फ्रेम / मिडल फ्रेम", "subCategories": []},
    {"id": "back-cover", "order": 6, "name_en": "Back Cover", "name_hi": "बैक कवर", "subCategories": []},
    {"id": "battery", "order": 7, "name_en": "Battery", "name_hi": "बैटरी", "subCategories": []},
    {"id": "power-volume-flex", "order": 8, "name_en": "Power Volume Flex", "name_hi": "पावर वॉल्यूम फ्लेक्स", "subCategories": []},
    {"id": "charging-sub-board", "order": 9, "name_en": "Charging Sub Board", "name_hi": "चार्जिंग सब बोर्ड", "subCategories": []},
    {"id": "main-flex", "order": 10, "name_en": "Main Flex / Charging Flex", "name_hi": "मेन फ्लेक्स / चार्जिंग फ्लेक्स", "subCategories": []},
    {"id": "speaker-ringer", "order": 11, "name_en": "Speaker / Ringer", "name_hi": "स्पीकर / रिंगर", "subCategories": []},
    {"id": "camera-glass", "order": 12, "name_en": "Camera Glass", "name_hi": "कैमरा ग्लास", "subCategories": []},
    {"id": "back-panel", "order": 13, "name_en": "Back Panel", "name_hi": "बैक पैनल", "subCategories": []},
    {"id": "panel-button", "order": 14, "name_en": "Panel Button", "name_hi": "पैनल बटन", "subCategories": []},
    {"id": "sim-tray", "order": 15, "name_en": "SIM Tray", "name_hi": "सिम ट्रे", "subCategories": []},
]

BRAND_GROUPS = [
    "Redmi/Poco",
    "Vivo/iQoo",
    "Realme/Oppo/OnePlus",
    "Samsung",
    "Itel/Tecno/Infinix",
    "Lava/Micromax/Moto",
    "Apple",
    "Others",
]


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


class BrandModelCreate(BaseModel):
    name: str
    brand: str


class GroupCreate(BaseModel):
    categoryId: str
    subCategory: Optional[str] = None
    brandGroup: str
    models: List[str]
    source: Optional[str] = None
    status: str = "unconfirmed"  # "verified" | "unconfirmed"


class SubmissionCreate(BaseModel):
    modelName: str
    category: Optional[str] = None
    claimedCompatibleModels: str
    notes: Optional[str] = None


class PasscodeVerify(BaseModel):
    passcode: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Combo Milan API"}


@api_router.get("/meta")
async def get_meta():
    return {"categories": CATEGORIES, "brandGroups": BRAND_GROUPS}


@api_router.get("/groups")
async def get_groups():
    docs = await db.compat_groups.find(
        {"deleted_at": None}, {"_id": 0}
    ).sort("created_at", 1).to_list(5000)
    return docs


@api_router.post("/groups", dependencies=[Depends(verify_admin), Depends(rate_limit)])
async def create_group(payload: GroupCreate):
    models = [m.strip() for m in payload.models if m and m.strip()]
    if not models:
        raise HTTPException(status_code=400, detail="At least one model is required")
    doc = {
        "id": str(uuid.uuid4()),
        "categoryId": payload.categoryId,
        "subCategory": payload.subCategory or None,
        "brandGroup": payload.brandGroup,
        "models": models,
        "source": (payload.source or "").strip() or None,
        "status": payload.status if payload.status in ("verified", "unconfirmed") else "unconfirmed",
        "confirmCount": 0,
        "created_at": now_iso(),
        "deleted_at": None,
    }
    await db.compat_groups.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.post("/groups/{group_id}/confirm", dependencies=[Depends(rate_limit)])
async def confirm_group(group_id: str):
    result = await db.compat_groups.find_one_and_update(
        {"id": group_id, "deleted_at": None},
        {"$inc": {"confirmCount": 1}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Group not found")
    result.pop("_id", None)
    return result


@api_router.get("/models")
async def get_models():
    docs = await db.models.find({"deleted_at": None}, {"_id": 0}).sort("created_at", 1).to_list(5000)
    return docs


@api_router.post("/models", dependencies=[Depends(verify_admin), Depends(rate_limit)])
async def create_model(payload: BrandModelCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "brand": payload.brand.strip(),
        "created_at": now_iso(),
        "deleted_at": None,
    }
    await db.models.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/submissions")
async def get_submissions():
    docs = await db.pending_submissions.find({"deleted_at": None}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    return docs


@api_router.post("/submissions", dependencies=[Depends(rate_limit)])
async def create_submission(payload: SubmissionCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "modelName": payload.modelName.strip(),
        "category": (payload.category or "").strip() or None,
        "claimedCompatibleModels": payload.claimedCompatibleModels.strip(),
        "notes": (payload.notes or "").strip() or None,
        "status": "pending",
        "created_at": now_iso(),
        "deleted_at": None,
    }
    await db.pending_submissions.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.post("/admin/verify")
async def verify_passcode(payload: PasscodeVerify):
    return {"ok": payload.passcode.strip() == ADMIN_PASSCODE}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
