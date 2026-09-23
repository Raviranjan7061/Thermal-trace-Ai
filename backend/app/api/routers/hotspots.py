from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc, or_
from app.database.session import get_db
from app.database.models import Hotspot, ClassificationResult, TemporalFeature, LandContext, IndustrialFacility, Alert, AnalystReview, AuditLog
from app.schemas.schemas import HotspotDetailResponse, HotspotResponse, HotspotReplayItem
from app.ml.evidence_quality import evaluate_evidence_quality
from app.ml.priority_engine import calculate_investigation_priority
from app.ml.why_no_alert import generate_why_no_alert_explanation

router = APIRouter(prefix="/api/hotspots", tags=["Hotspots & Geospatial Intelligence"])

@router.get("", response_model=List[HotspotDetailResponse])
def list_hotspots(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    satellite: Optional[str] = None,
    dataset: Optional[str] = None,
    classification: Optional[str] = None,
    confidence_level: Optional[str] = None,
    daynight: Optional[str] = None,
    min_frp: Optional[float] = None,
    max_frp: Optional[float] = None,
    max_industrial_dist_km: Optional[float] = None
):
    query = (
        db.query(Hotspot)
        .options(
            joinedload(Hotspot.land_context),
            joinedload(Hotspot.classification).joinedload(ClassificationResult.evidence)
        )
    )

    if satellite:
        query = query.filter(Hotspot.satellite.ilike(f"%{satellite}%"))
    if dataset:
        query = query.filter(Hotspot.source_dataset == dataset)
    if daynight:
        query = query.filter(Hotspot.daynight == daynight.upper())
    if min_frp is not None:
        query = query.filter(Hotspot.frp >= min_frp)
    if max_frp is not None:
        query = query.filter(Hotspot.frp <= max_frp)

    if classification or confidence_level or max_industrial_dist_km is not None:
        query = query.join(Hotspot.classification)
        if classification:
            query = query.filter(ClassificationResult.probable_classification.ilike(f"%{classification}%"))
        if confidence_level:
            query = query.filter(ClassificationResult.confidence_level.ilike(f"%{confidence_level}%"))
        if max_industrial_dist_km is not None:
            query = query.filter(ClassificationResult.distance_to_nearest_facility_km <= max_industrial_dist_km)

    query = query.order_by(desc(Hotspot.acquisition_datetime))
    hotspots = query.offset(skip).limit(limit).all()
    return hotspots

@router.get("/replay", response_model=List[HotspotReplayItem])
def get_replay_data(
    db: Session = Depends(get_db),
    limit: int = Query(500, ge=1, le=2000)
):
    """
    Returns real thermal observations ordered chronologically for Historical Map Replay.
    """
    hotspots = (
        db.query(Hotspot)
        .options(joinedload(Hotspot.classification))
        .order_by(asc(Hotspot.acquisition_datetime))
        .limit(limit)
        .all()
    )

    return [
        HotspotReplayItem(
            hotspot_id=h.hotspot_id,
            latitude=h.latitude,
            longitude=h.longitude,
            acquisition_datetime=h.acquisition_datetime,
            frp=h.frp,
            satellite=h.satellite,
            cluster_id=h.cluster_id,
            probable_classification=h.classification.probable_classification if h.classification else "Unknown"
        )
        for h in hotspots
    ]

@router.get("/compare")
def compare_hotspots(id1: str, id2: str, db: Session = Depends(get_db)):
    from app.geospatial.distance import haversine_distance_km

    h1 = db.query(Hotspot).options(joinedload(Hotspot.classification), joinedload(Hotspot.land_context)).filter(Hotspot.hotspot_id == id1).first()
    h2 = db.query(Hotspot).options(joinedload(Hotspot.classification), joinedload(Hotspot.land_context)).filter(Hotspot.hotspot_id == id2).first()

    if not h1 or not h2:
        raise HTTPException(status_code=404, detail="One or both hotspots not found for comparison.")

    dist_km = haversine_distance_km(h1.latitude, h1.longitude, h2.latitude, h2.longitude)
    t_diff = abs((h1.acquisition_datetime - h2.acquisition_datetime).total_seconds()) / 3600.0

    temp1 = db.query(TemporalFeature).filter(TemporalFeature.cluster_id == h1.cluster_id).first() if h1.cluster_id else None
    temp2 = db.query(TemporalFeature).filter(TemporalFeature.cluster_id == h2.cluster_id).first() if h2.cluster_id else None

    cls1 = h1.classification
    cls2 = h2.classification
    ev1 = cls1.evidence if cls1 else None
    ev2 = cls2.evidence if cls2 else None

    return {
        "spatial_separation_km": round(dist_km, 2),
        "temporal_difference_hours": round(t_diff, 2),
        "event_1": {
            "hotspot_id": h1.hotspot_id,
            "latitude": h1.latitude,
            "longitude": h1.longitude,
            "acquisition_datetime": h1.acquisition_datetime.isoformat(),
            "satellite": h1.satellite,
            "instrument": h1.instrument,
            "frp": h1.frp,
            "brightness_ti4": h1.brightness_ti4,
            "probable_classification": cls1.probable_classification if cls1 else "Unknown",
            "confidence_score": cls1.confidence_score if cls1 else 0.0,
            "confidence_level": cls1.confidence_level if cls1 else "N/A",
            "nearest_facility": cls1.nearest_facility_name if cls1 else "None",
            "distance_km": cls1.distance_to_nearest_facility_km if cls1 else None,
            "land_cover": h1.land_context.land_cover_class if h1.land_context else "Unknown",
            "persistence_score": temp1.persistence_score if temp1 else 0.0,
            "detection_count_30d": temp1.detection_count_30d if temp1 else 1,
            "supporting_evidence": ev1.supporting_evidence if ev1 else []
        },
        "event_2": {
            "hotspot_id": h2.hotspot_id,
            "latitude": h2.latitude,
            "longitude": h2.longitude,
            "acquisition_datetime": h2.acquisition_datetime.isoformat(),
            "satellite": h2.satellite,
            "instrument": h2.instrument,
            "frp": h2.frp,
            "brightness_ti4": h2.brightness_ti4,
            "probable_classification": cls2.probable_classification if cls2 else "Unknown",
            "confidence_score": cls2.confidence_score if cls2 else 0.0,
            "confidence_level": cls2.confidence_level if cls2 else "N/A",
            "nearest_facility": cls2.nearest_facility_name if cls2 else "None",
            "distance_km": cls2.distance_to_nearest_facility_km if cls2 else None,
            "land_cover": h2.land_context.land_cover_class if h2.land_context else "Unknown",
            "persistence_score": temp2.persistence_score if temp2 else 0.0,
            "detection_count_30d": temp2.detection_count_30d if temp2 else 1,
            "supporting_evidence": ev2.supporting_evidence if ev2 else []
        }
    }

@router.get("/{hotspot_id}", response_model=HotspotDetailResponse)
def get_hotspot_by_id(hotspot_id: str, db: Session = Depends(get_db)):
    hotspot = (
        db.query(Hotspot)
        .options(
            joinedload(Hotspot.land_context),
            joinedload(Hotspot.classification).joinedload(ClassificationResult.evidence)
        )
        .filter(Hotspot.hotspot_id == hotspot_id)
        .first()
    )

    if not hotspot:
        raise HTTPException(status_code=404, detail=f"Hotspot with ID '{hotspot_id}' not found.")
    return hotspot

@router.get("/{hotspot_id}/geojson")
def get_hotspot_geojson(hotspot_id: str, db: Session = Depends(get_db)):
    hotspot = db.query(Hotspot).options(joinedload(Hotspot.classification)).filter(Hotspot.hotspot_id == hotspot_id).first()
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found.")

    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [hotspot.longitude, hotspot.latitude]
        },
        "properties": {
            "hotspot_id": hotspot.hotspot_id,
            "source": hotspot.source,
            "source_dataset": hotspot.source_dataset,
            "acquisition_datetime": hotspot.acquisition_datetime.isoformat(),
            "satellite": hotspot.satellite,
            "instrument": hotspot.instrument,
            "frp": hotspot.frp,
            "brightness_ti4": hotspot.brightness_ti4,
            "confidence": hotspot.confidence,
            "daynight": hotspot.daynight,
            "probable_classification": hotspot.classification.probable_classification if hotspot.classification else "Unknown",
            "confidence_score": hotspot.classification.confidence_score if hotspot.classification else 0.0,
            "nearest_facility": hotspot.classification.nearest_facility_name if hotspot.classification else None,
            "distance_km": hotspot.classification.distance_to_nearest_facility_km if hotspot.classification else None
        }
    }

@router.get("/{hotspot_id}/timeline")
def get_hotspot_timeline(hotspot_id: str, db: Session = Depends(get_db)):
    hotspot = db.query(Hotspot).filter(Hotspot.hotspot_id == hotspot_id).first()
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found.")

    timeline = []

    # 1. Satellite observation timestamp
    timeline.append({
        "timestamp": hotspot.acquisition_datetime.isoformat(),
        "event_type": "observation_received",
        "title": f"NASA FIRMS Observation Received ({hotspot.satellite})",
        "description": f"Radiative measurement recorded at {hotspot.latitude:.4f}, {hotspot.longitude:.4f} with {hotspot.frp or 0.0:.1f} MW FRP."
    })

    # 2. Database ingestion timestamp
    timeline.append({
        "timestamp": hotspot.created_at.isoformat(),
        "event_type": "ingested",
        "title": "Ingested & Deduplicated",
        "description": f"Observation ingested with SHA-256 hash {hotspot.deduplication_hash[:12]}..."
    })

    # 3. Spatial Cluster assignment & temporal feature update
    if hotspot.cluster_id:
        temp_feat = db.query(TemporalFeature).filter(TemporalFeature.cluster_id == hotspot.cluster_id).first()
        timeline.append({
            "timestamp": temp_feat.updated_at.isoformat() if temp_feat else hotspot.created_at.isoformat(),
            "event_type": "cluster_updated",
            "title": f"Assigned to Spatial Cluster {hotspot.cluster_id}",
            "description": f"DBSCAN ~1.5 km grouping updated cluster historical baseline."
        })

    # 4. Classification
    cls = db.query(ClassificationResult).filter(ClassificationResult.hotspot_id == hotspot.hotspot_id).first()
    if cls:
        timeline.append({
            "timestamp": cls.created_at.isoformat(),
            "event_type": "classified",
            "title": f"Classification Generated ({cls.probable_classification})",
            "description": f"Evidence engine evaluated candidate with {cls.confidence_score*100:.0f}% confidence."
        })

    # 5. Alert
    alert = db.query(Alert).filter(Alert.hotspot_id == hotspot.hotspot_id).first()
    if alert:
        timeline.append({
            "timestamp": alert.created_at.isoformat(),
            "event_type": "alert_triggered",
            "title": f"Operational Alert Triggered [{alert.priority}]",
            "description": f"{alert.alert_type}: {alert.title}"
        })
        if alert.acknowledged_at:
            timeline.append({
                "timestamp": alert.acknowledged_at.isoformat(),
                "event_type": "alert_acknowledged",
                "title": "Alert Acknowledged by Analyst",
                "description": f"Status updated to {alert.status}."
            })
        if alert.resolved_at:
            timeline.append({
                "timestamp": alert.resolved_at.isoformat(),
                "event_type": "alert_resolved",
                "title": "Alert Resolved",
                "description": f"Resolved with status {alert.status}."
            })

    # 6. Analyst Reviews
    reviews = db.query(AnalystReview).filter(AnalystReview.hotspot_id == hotspot.hotspot_id).all()
    for r in reviews:
        timeline.append({
            "timestamp": r.created_at.isoformat(),
            "event_type": "analyst_review",
            "title": f"Analyst Review ({r.analyst_status})",
            "description": f"Reviewer {r.reviewer_email or 'Analyst'} updated classification to '{r.analyst_classification}'. Notes: {r.analyst_notes or 'None'}"
        })

    # Sort timeline chronologically
    timeline.sort(key=lambda x: x["timestamp"])
    return timeline

@router.get("/{hotspot_id}/history")
def get_hotspot_history(hotspot_id: str, db: Session = Depends(get_db)):
    hotspot = db.query(Hotspot).filter(Hotspot.hotspot_id == hotspot_id).first()
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found")

    if not hotspot.cluster_id:
        return {
            "cluster_id": None,
            "observations_count": 1,
            "history": [
                {
                    "hotspot_id": hotspot.hotspot_id,
                    "acquisition_datetime": hotspot.acquisition_datetime.isoformat(),
                    "frp": hotspot.frp,
                    "brightness_ti4": hotspot.brightness_ti4,
                    "satellite": hotspot.satellite,
                    "daynight": hotspot.daynight
                }
            ],
            "baseline": None
        }

    cluster_hotspots = (
        db.query(Hotspot)
        .filter(Hotspot.cluster_id == hotspot.cluster_id)
        .order_by(asc(Hotspot.acquisition_datetime))
        .all()
    )

    temp_feature = db.query(TemporalFeature).filter(TemporalFeature.cluster_id == hotspot.cluster_id).first()

    return {
        "cluster_id": hotspot.cluster_id,
        "observations_count": len(cluster_hotspots),
        "history": [
            {
                "hotspot_id": h.hotspot_id,
                "acquisition_datetime": h.acquisition_datetime.isoformat(),
                "frp": h.frp,
                "brightness_ti4": h.brightness_ti4,
                "satellite": h.satellite,
                "daynight": h.daynight
            }
            for h in cluster_hotspots
        ],
        "baseline": {
            "avg_frp": temp_feature.avg_frp if temp_feature else None,
            "median_frp": temp_feature.median_frp if temp_feature else None,
            "max_frp": temp_feature.max_frp if temp_feature else None,
            "baseline_frp": temp_feature.baseline_frp if temp_feature else None,
            "baseline_deviation": temp_feature.baseline_deviation if temp_feature else 0.0,
            "detection_count_30d": temp_feature.detection_count_30d if temp_feature else 1,
            "persistence_score": temp_feature.persistence_score if temp_feature else 0.0
        } if temp_feature else None
    }

@router.get("/{hotspot_id}/evidence")
def get_hotspot_evidence(hotspot_id: str, db: Session = Depends(get_db)):
    hotspot = (
        db.query(Hotspot)
        .options(joinedload(Hotspot.classification).joinedload(ClassificationResult.evidence))
        .filter(Hotspot.hotspot_id == hotspot_id)
        .first()
    )

    if not hotspot or not hotspot.classification:
        raise HTTPException(status_code=404, detail="Hotspot or classification evidence not found.")

    cls = hotspot.classification
    ev = cls.evidence

    return {
        "hotspot_id": hotspot.hotspot_id,
        "probable_classification": cls.probable_classification,
        "confidence_score": cls.confidence_score,
        "confidence_level": cls.confidence_level,
        "classification_mode": cls.classification_mode,
        "nearest_facility": {
            "name": cls.nearest_facility_name,
            "distance_km": cls.distance_to_nearest_facility_km,
            "type": cls.nearest_facility_type
        },
        "supporting_evidence": ev.supporting_evidence if ev else [],
        "contradictory_evidence": ev.contradictory_evidence if ev else [],
        "feature_contributions": ev.feature_contributions if ev else {}
    }

@router.get("/{hotspot_id}/imagery")
def get_hotspot_imagery(hotspot_id: str, db: Session = Depends(get_db)):
    hotspot = db.query(Hotspot).filter(Hotspot.hotspot_id == hotspot_id).first()
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found.")

    lat, lon = hotspot.latitude, hotspot.longitude
    acquisition_date = hotspot.acquisition_datetime.strftime("%Y-%m-%d")

    return {
        "hotspot_id": hotspot_id,
        "latitude": lat,
        "longitude": lon,
        "acquisition_date": acquisition_date,
        "satellite": hotspot.satellite,
        "status": "Available",
        "provider": "Esri World Imagery / NASA GIBS Tile Service",
        "attribution": "Esri, Maxar, Earthstar Geographics, NASA GIBS",
        "tile_url_template": f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/{lat}/{lon}",
        "viewbox": {
            "min_lat": lat - 0.05,
            "max_lat": lat + 0.05,
            "min_lon": lon - 0.05,
            "max_lon": lon + 0.05
        }
    }

@router.get("/{hotspot_id}/report")
def generate_investigation_report(hotspot_id: str, db: Session = Depends(get_db)):
    hotspot = (
        db.query(Hotspot)
        .options(
            joinedload(Hotspot.land_context),
            joinedload(Hotspot.classification).joinedload(ClassificationResult.evidence),
            joinedload(Hotspot.alerts),
            joinedload(Hotspot.reviews)
        )
        .filter(Hotspot.hotspot_id == hotspot_id)
        .first()
    )

    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found.")

    cls = hotspot.classification
    land = hotspot.land_context
    temp = db.query(TemporalFeature).filter(TemporalFeature.cluster_id == hotspot.cluster_id).first() if hotspot.cluster_id else None
    alert = hotspot.alerts[0] if hotspot.alerts else None

    quality, avail, missing = evaluate_evidence_quality(
        hotspot=hotspot,
        nearest_fac=None,
        dist_km=cls.distance_to_nearest_facility_km if cls else None,
        land_ctx=land,
        temp_feat=temp
    )

    priority, why_priority = calculate_investigation_priority(
        frp=hotspot.frp,
        baseline_deviation=temp.baseline_deviation if temp else 0.0,
        dist_km=cls.distance_to_nearest_facility_km if cls else None,
        persistence_score=temp.persistence_score if temp else 0.0,
        classification_name=cls.probable_classification if cls else None,
        confidence_score=cls.confidence_score if cls else 0.0,
        evidence_quality=quality
    )

    return {
        "report_title": "ThermalTrace AI — Event Investigation Briefing",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "event_summary": {
            "hotspot_id": hotspot.hotspot_id,
            "deduplication_hash": hotspot.deduplication_hash,
            "coordinates": f"{hotspot.latitude:.4f}° N, {hotspot.longitude:.4f}° E",
            "acquisition_datetime": hotspot.acquisition_datetime.isoformat(),
            "satellite": hotspot.satellite,
            "instrument": hotspot.instrument,
            "source_dataset": hotspot.source_dataset,
            "frp": f"{hotspot.frp:.1f} MW" if hotspot.frp else "Unavailable",
            "brightness_ti4": f"{hotspot.brightness_ti4:.1f} K" if hotspot.brightness_ti4 else "Unavailable",
            "daynight": hotspot.daynight or "Unavailable"
        },
        "investigation_priority": {
            "priority_level": priority,
            "reasons": why_priority
        },
        "evidence_quality": {
            "quality_level": quality,
            "available_evidence": avail,
            "missing_evidence": missing
        },
        "classification": {
            "probable_classification": cls.probable_classification if cls else "Unknown",
            "confidence_score": f"{cls.confidence_score*100:.0f}%" if cls else "0%",
            "confidence_level": cls.confidence_level if cls else "Insufficient evidence",
            "classification_mode": cls.classification_mode if cls else "N/A",
            "supporting_evidence": cls.evidence.supporting_evidence if cls and cls.evidence else [],
            "contradictory_evidence": cls.evidence.contradictory_evidence if cls and cls.evidence else []
        },
        "industrial_context": {
            "nearest_facility_name": cls.nearest_facility_name if cls and cls.nearest_facility_name else "None within 10 km",
            "facility_type": cls.nearest_facility_type if cls and cls.nearest_facility_type else "Unavailable",
            "distance_km": f"{cls.distance_to_nearest_facility_km:.2f} km" if cls and cls.distance_to_nearest_facility_km else "Unavailable",
            "facilities_within_1km": cls.facilities_within_1km if cls else 0,
            "facilities_within_5km": cls.facilities_within_5km if cls else 0
        },
        "land_cover_context": {
            "land_cover_class": land.land_cover_class if land else "Unknown / Unconfirmed",
            "source": land.source if land else "Copernicus Land Registry"
        },
        "historical_behavior": {
            "cluster_id": hotspot.cluster_id or "Unclustered",
            "detection_count_90d": temp.detection_count_90d if temp else 1,
            "avg_frp": f"{temp.avg_frp:.1f} MW" if temp and temp.avg_frp else "Unavailable",
            "max_frp": f"{temp.max_frp:.1f} MW" if temp and temp.max_frp else "Unavailable",
            "baseline_deviation": f"+{temp.baseline_deviation:.1f} Z-Score" if temp else "Insufficient History",
            "persistence_score": f"{temp.persistence_score:.2f}" if temp else "0.00"
        },
        "alert_history": {
            "alert_id": alert.alert_id if alert else None,
            "alert_type": alert.alert_type if alert else "No alert triggered",
            "status": alert.status if alert else "N/A",
            "created_at": alert.created_at.isoformat() if alert else None
        },
        "provenance": {
            "thermal_data_source": "NASA FIRMS API (Real Observation)",
            "geospatial_engine": "ThermalTrace Haversine & DBSCAN Cluster Engine v1.0",
            "classifier_version": cls.classification_mode if cls else "N/A"
        }
    }

@router.get("/{hotspot_id}/why-no-alert")
def get_why_no_alert_explanation(hotspot_id: str, db: Session = Depends(get_db)):
    hotspot = db.query(Hotspot).filter(Hotspot.hotspot_id == hotspot_id).first()
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found.")

    cls = db.query(ClassificationResult).filter(ClassificationResult.hotspot_id == hotspot_id).first()
    temp = db.query(TemporalFeature).filter(TemporalFeature.cluster_id == hotspot.cluster_id).first() if hotspot.cluster_id else None
    active_alert = db.query(Alert).filter(Alert.hotspot_id == hotspot_id).first()

    return generate_why_no_alert_explanation(hotspot, cls, temp, active_alert)

@router.get("/{hotspot_id}/multi-satellite")
def get_multi_satellite_correlation(hotspot_id: str, db: Session = Depends(get_db)):
    from app.geospatial.distance import haversine_distance_km
    from datetime import timedelta

    target = db.query(Hotspot).filter(Hotspot.hotspot_id == hotspot_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Hotspot not found.")

    time_min = target.acquisition_datetime - timedelta(hours=12)
    time_max = target.acquisition_datetime + timedelta(hours=12)

    candidates = (
        db.query(Hotspot)
        .filter(Hotspot.hotspot_id != target.hotspot_id)
        .filter(Hotspot.acquisition_datetime >= time_min)
        .filter(Hotspot.acquisition_datetime <= time_max)
        .all()
    )

    correlated = []
    has_diff_sat = False

    for c in candidates:
        dist = haversine_distance_km(target.latitude, target.longitude, c.latitude, c.longitude)
        if dist <= 5.0:
            if c.satellite.upper() != target.satellite.upper():
                has_diff_sat = True
            correlated.append({
                "hotspot_id": c.hotspot_id,
                "satellite": c.satellite,
                "instrument": c.instrument,
                "acquisition_datetime": c.acquisition_datetime.isoformat(),
                "frp": c.frp,
                "distance_km": round(dist, 2),
                "latitude": c.latitude,
                "longitude": c.longitude
            })

    if has_diff_sat and any(c["distance_km"] <= 2.5 for c in correlated):
        correlation_strength = "Strong"
        summary_wording = "Multiple satellite observations (NOAA-20 & NOAA-21) detected thermal activity in the same area/time window."
    elif len(correlated) > 0:
        correlation_strength = "Moderate"
        summary_wording = "Additional orbital pass detections recorded in the target spatial corridor."
    else:
        correlation_strength = "None"
        summary_wording = "No multi-satellite cross-track observations recorded in the 12-hour spatial window."

    return {
        "target_hotspot_id": target.hotspot_id,
        "target_satellite": target.satellite,
        "target_acq_datetime": target.acquisition_datetime.isoformat(),
        "target_frp": target.frp,
        "correlation_strength": correlation_strength,
        "summary_wording": summary_wording,
        "supporting_observations": len(correlated),
        "correlated_observations": correlated
    }

@router.get("/{hotspot_id}/similar")
def get_similar_historical_events(hotspot_id: str, db: Session = Depends(get_db)):
    from app.geospatial.distance import haversine_distance_km

    target = (
        db.query(Hotspot)
        .options(joinedload(Hotspot.classification), joinedload(Hotspot.land_context))
        .filter(Hotspot.hotspot_id == hotspot_id)
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Hotspot not found.")

    target_cls = target.classification.probable_classification if target.classification else None
    target_frp = target.frp or 0.0

    all_hotspots = (
        db.query(Hotspot)
        .options(joinedload(Hotspot.classification), joinedload(Hotspot.alerts))
        .filter(Hotspot.hotspot_id != target.hotspot_id)
        .limit(300)
        .all()
    )

    similar = []
    for h in all_hotspots:
        dist = haversine_distance_km(target.latitude, target.longitude, h.latitude, h.longitude)
        h_cls = h.classification.probable_classification if h.classification else "Unknown"
        h_frp = h.frp or 0.0

        frp_diff_pct = abs(h_frp - target_frp) / max(1.0, target_frp)

        # Rule-based similarity check
        is_similar = False
        reasons = []

        if dist <= 15.0:
            is_similar = True
            reasons.append(f"Located within {dist:.1f} km of target event")
        if h_cls == target_cls and target_cls != "Unknown":
            is_similar = True
            reasons.append(f"Shares identical preliminary classification ({h_cls})")
        if frp_diff_pct <= 0.4:
            is_similar = True
            reasons.append(f"Comparable thermal intensity ({h_frp:.1f} MW FRP)")

        if is_similar and len(reasons) >= 2:
            alert = h.alerts[0] if h.alerts else None
            similar.append({
                "hotspot_id": h.hotspot_id,
                "acquisition_datetime": h.acquisition_datetime.isoformat(),
                "latitude": h.latitude,
                "longitude": h.longitude,
                "distance_km": round(dist, 2),
                "frp": h_frp,
                "classification": h_cls,
                "priority": alert.priority if alert else "MODERATE",
                "final_status": alert.status if alert else "Unflagged",
                "similarity_explanation": f"Similar because it {' and '.join(reasons)}."
            })

    # Order by proximity and limit to top 5
    similar.sort(key=lambda x: x["distance_km"])
    return similar[:5]

