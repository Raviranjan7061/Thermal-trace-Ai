from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import IndustrialFacility
from app.schemas.schemas import IndustrialFacilityResponse

router = APIRouter(prefix="/api/industrial-sites", tags=["Industrial Infrastructure"])

@router.get("", response_model=List[IndustrialFacilityResponse])
def list_industrial_sites(
    db: Session = Depends(get_db),
    facility_type: Optional[str] = None,
    state: Optional[str] = None,
    search: Optional[str] = None
):
    query = db.query(IndustrialFacility)

    if facility_type:
        query = query.filter(IndustrialFacility.facility_type == facility_type)
    if state:
        query = query.filter(IndustrialFacility.state.ilike(f"%{state}%"))
    if search:
        query = query.filter(IndustrialFacility.name.ilike(f"%{search}%"))

    return query.order_by(IndustrialFacility.name.asc()).all()

@router.get("/{facility_id}/profile")
def get_industrial_facility_profile(
    facility_id: str,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    from fastapi import HTTPException
    from datetime import datetime, timedelta, timezone
    from app.database.models import Hotspot, ClassificationResult, Alert
    from app.geospatial.distance import haversine_distance_km

    facility = db.query(IndustrialFacility).filter(IndustrialFacility.facility_id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Industrial facility not found.")

    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days)

    # Find nearby hotspots within 5 km
    all_cls = (
        db.query(ClassificationResult)
        .filter(ClassificationResult.nearest_facility_id == facility_id)
        .filter(ClassificationResult.distance_to_nearest_facility_km <= 5.0)
        .all()
    )

    hotspot_ids = [c.hotspot_id for c in all_cls]
    hotspots = (
        db.query(Hotspot)
        .filter(Hotspot.hotspot_id.in_(hotspot_ids))
        .filter(Hotspot.acquisition_datetime >= cutoff)
        .order_by(Hotspot.acquisition_datetime.desc())
        .all()
    ) if hotspot_ids else []

    frps = [h.frp for h in hotspots if h.frp and h.frp > 0]
    avg_frp = round(sum(frps) / len(frps), 1) if frps else 0.0
    max_frp = round(max(frps), 1) if frps else 0.0

    alerts_count = (
        db.query(Alert)
        .filter(Alert.hotspot_id.in_(hotspot_ids))
        .filter(Alert.status.in_(["NEW", "ACKNOWLEDGED", "INVESTIGATING"]))
        .count()
    ) if hotspot_ids else 0

    return {
        "facility_id": facility.facility_id,
        "name": facility.name,
        "facility_type": facility.facility_type,
        "latitude": facility.latitude,
        "longitude": facility.longitude,
        "state": facility.state or "India",
        "district": facility.district or "Unspecified",
        "operator_owner": facility.operator_owner or "Unspecified",
        "timeframe_days": days,
        "nearby_observations_count": len(hotspots),
        "avg_frp": avg_frp,
        "max_frp": max_frp,
        "active_alerts_count": alerts_count,
        "recent_observations": [
            {
                "hotspot_id": h.hotspot_id,
                "acquisition_datetime": h.acquisition_datetime.isoformat(),
                "frp": h.frp,
                "satellite": h.satellite,
                "brightness_ti4": h.brightness_ti4,
                "daynight": h.daynight
            }
            for h in hotspots[:10]
        ]
    }

