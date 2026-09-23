from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.session import get_db
from app.database.models import SyncRun, Hotspot, IndustrialFacility
from app.core.config import settings
from app.ingestion.firms_client import FIRMSClient

router = APIRouter(prefix="/api", tags=["System & Health"])

@router.get("/health")
def get_health():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "subtitle": settings.PROJECT_SUBTITLE,
        "sih_id": settings.PROBLEM_STATEMENT_ID,
        "version": settings.VERSION
    }

@router.get("/system/health")
def get_system_health(db: Session = Depends(get_db)):
    # Check DB connection
    try:
        db.execute(text("SELECT 1"))
        db_status = "Connected"
    except Exception:
        db_status = "Disconnected"

    firms_client = FIRMSClient()
    firms_configured = firms_client.is_configured()

    last_sync = db.query(SyncRun).order_by(SyncRun.attempted_at.desc()).first()
    hotspot_count = db.query(Hotspot).count()
    facility_count = db.query(IndustrialFacility).count()

    return {
        "status": "Operational" if db_status == "Connected" else "Degraded",
        "backend_api": "Healthy",
        "database": {
            "status": db_status,
            "engine": settings.DATABASE_URL.split(":")[0],
            "hotspots_stored": hotspot_count,
            "facilities_stored": facility_count
        },
        "firms_integration": {
            "configured": firms_configured,
            "map_key_present": bool(settings.NASA_FIRMS_MAP_KEY),
            "last_attempted_sync": last_sync.attempted_at.isoformat() if last_sync else None,
            "last_sync_status": last_sync.status if last_sync else "Never Run",
            "last_observations_inserted": last_sync.observations_inserted if last_sync else 0
        }
    }

@router.get("/data-sources/status")
def get_data_sources_status(db: Session = Depends(get_db)):
    last_sync = db.query(SyncRun).order_by(SyncRun.attempted_at.desc()).first()
    hotspot_count = db.query(Hotspot).count()
    facility_count = db.query(IndustrialFacility).count()

    firms_client = FIRMSClient()

    return [
        {
            "name": "NASA FIRMS NRT (Near Real-Time)",
            "purpose": "Primary satellite thermal anomaly detection source (VIIRS NOAA-20 & NOAA-21)",
            "status": "Active" if firms_client.is_configured() else "Awaiting MAP_KEY",
            "last_sync": last_sync.attempted_at.isoformat() if last_sync else None,
            "records_loaded": hotspot_count,
            "attribution": "NASA Earthdata / FIRMS",
            "known_limitations": "Cloud cover attenuation; 3-hour satellite orbit revisit cycle."
        },
        {
            "name": "Indian Industrial Infrastructure Registry",
            "purpose": "Spatial proximity matching for refineries, power plants, LNG terminals, and steel plants",
            "status": "Active",
            "last_sync": "System Initialization",
            "records_loaded": facility_count,
            "attribution": "OpenStreetMap & Global Energy Infrastructure Registry",
            "known_limitations": "Facility boundaries represented via centroid coordinates."
        },
        {
            "name": "Copernicus & OSM Land-Cover Spatial Context",
            "purpose": "Geospatial land-use categorization (Industrial, Built-Up, Cropland, Forest)",
            "status": "Active",
            "last_sync": "Static Rule Engine",
            "records_loaded": hotspot_count,
            "attribution": "Copernicus Land Monitoring Service",
            "known_limitations": "Resolution subject to regional spatial mask grid."
        },
        {
            "name": "Satellite Imagery Tile Layer",
            "purpose": "Visual inspection tile provider",
            "status": "Available",
            "last_sync": "On-Demand Tile Query",
            "records_loaded": 0,
            "attribution": "Esri World Imagery / CartoDB / NASA GIBS",
            "known_limitations": "Imagery coverage dependent on satellite revisit schedule."
        }
    ]
