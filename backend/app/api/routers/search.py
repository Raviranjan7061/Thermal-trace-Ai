from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.session import get_db
from app.database.models import Hotspot, IndustrialFacility, Alert, ClassificationResult

router = APIRouter(prefix="/api/search", tags=["Global Search"])

@router.get("")
def global_search(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    term = f"%{q}%"

    # Search Hotspots
    hotspots = (
        db.query(Hotspot)
        .join(Hotspot.classification)
        .filter(
            or_(
                Hotspot.hotspot_id.ilike(term),
                Hotspot.satellite.ilike(term),
                ClassificationResult.probable_classification.ilike(term),
                ClassificationResult.nearest_facility_name.ilike(term)
            )
        )
        .limit(10)
        .all()
    )

    # Search Industrial Facilities
    facilities = (
        db.query(IndustrialFacility)
        .filter(
            or_(
                IndustrialFacility.name.ilike(term),
                IndustrialFacility.facility_type.ilike(term),
                IndustrialFacility.state.ilike(term),
                IndustrialFacility.district.ilike(term),
                IndustrialFacility.operator_owner.ilike(term)
            )
        )
        .limit(10)
        .all()
    )

    # Search Alerts
    alerts = (
        db.query(Alert)
        .filter(
            or_(
                Alert.title.ilike(term),
                Alert.alert_type.ilike(term),
                Alert.description.ilike(term)
            )
        )
        .limit(10)
        .all()
    )

    return {
        "query": q,
        "results": {
            "hotspots": [
                {
                    "hotspot_id": h.hotspot_id,
                    "latitude": h.latitude,
                    "longitude": h.longitude,
                    "satellite": h.satellite,
                    "frp": h.frp,
                    "classification": h.classification.probable_classification if h.classification else "Unknown"
                }
                for h in hotspots
            ],
            "facilities": [
                {
                    "facility_id": f.facility_id,
                    "name": f.name,
                    "facility_type": f.facility_type,
                    "latitude": f.latitude,
                    "longitude": f.longitude,
                    "state": f.state
                }
                for f in facilities
            ],
            "alerts": [
                {
                    "alert_id": a.alert_id,
                    "title": a.title,
                    "severity": a.severity,
                    "status": a.status
                }
                for a in alerts
            ]
        }
    }
