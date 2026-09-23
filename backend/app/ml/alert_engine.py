import logging
from typing import Optional, List, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database.models import (
    Hotspot, ClassificationResult, Alert, Watchlist, Notification, AuditLog, TemporalFeature
)
from app.ml.priority_engine import calculate_investigation_priority
from app.ml.evidence_quality import evaluate_evidence_quality
from app.ml.temporal_engine import calculate_cluster_frp_trend
from app.services.notification_delivery import attempt_external_alert_delivery

logger = logging.getLogger("thermaltrace.alert_engine")

def evaluate_and_trigger_alerts(
    db: Session,
    hotspot: Hotspot,
    cls_result: ClassificationResult,
    temp_feat: Optional[TemporalFeature],
    nearest_fac: Optional[Any],
    dist_km: Optional[float],
    land_ctx: Optional[Any]
) -> List[Alert]:
    """
    Evaluates real backend alert criteria across 5 categories, handles cluster-based
    duplicate prevention & escalation, and evaluates active Watchlists.
    """
    triggered_alerts: List[Alert] = []

    # 1. Calculate evidence quality & investigation priority
    quality, avail_factors, missing_factors = evaluate_evidence_quality(
        hotspot=hotspot,
        nearest_fac=nearest_fac,
        dist_km=dist_km,
        land_ctx=land_ctx,
        temp_feat=temp_feat,
        imagery_available=False
    )

    priority, why_priority = calculate_investigation_priority(
        frp=hotspot.frp,
        baseline_deviation=temp_feat.baseline_deviation if temp_feat else 0.0,
        dist_km=dist_km,
        persistence_score=temp_feat.persistence_score if temp_feat else 0.0,
        classification_name=cls_result.probable_classification,
        confidence_score=cls_result.confidence_score,
        evidence_quality=quality
    )

    # 2. Check FRP trend across recent cluster passes
    cluster_hotspots = []
    if hotspot.cluster_id:
        cluster_hotspots = (
            db.query(Hotspot)
            .filter(Hotspot.cluster_id == hotspot.cluster_id)
            .order_by(Hotspot.acquisition_datetime.asc())
            .all()
        )
    trend_label, frp_jump = calculate_cluster_frp_trend(cluster_hotspots)

    trigger_category: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    severity: str = "Moderate"

    facility_str = nearest_fac.name if (nearest_fac and dist_km is not None and dist_km <= 10.0) else "Exact industrial facility not identified"

    # Category A: New Industrial-Area Thermal Anomaly
    if dist_km is not None and dist_km <= 5.0 and (not temp_feat or temp_feat.persistence_score < 0.4 or temp_feat.detection_count_90d <= 3):
        if hotspot.frp and hotspot.frp >= 15.0:
            trigger_category = "New Industrial-Area Thermal Anomaly"
            title = f"Abnormal Thermal Activity near {facility_str}"
            description = (
                f"Satellite detected developing thermal anomaly ({hotspot.frp:.1f} MW FRP) at {dist_km:.2f} km "
                f"from {facility_str}. Location previously showed low historical thermal activity. Immediate investigation recommended."
            )
            severity = "Critical" if priority in ["CRITICAL", "HIGH"] else "High"

    # Category B: Thermal Baseline Deviation
    elif temp_feat and temp_feat.detection_count_90d >= 3 and temp_feat.baseline_deviation >= 2.0:
        trigger_category = "Thermal Baseline Deviation"
        title = f"Significant Baseline FRP Anomaly (+{temp_feat.baseline_deviation:.1f} Z-Score)"
        description = (
            f"Abnormal thermal output ({hotspot.frp:.1f} MW FRP) recorded at Cluster {hotspot.cluster_id}. "
            f"Output is +{temp_feat.baseline_deviation:.1f} standard deviations above historical 90-day baseline."
        )
        severity = "High" if temp_feat.baseline_deviation >= 3.0 else "Moderate"

    # Category C: Rapid FRP Escalation
    elif trend_label in ["RAPID ESCALATION", "RISING"] and hotspot.frp and hotspot.frp >= 20.0:
        trigger_category = "Rapid FRP Escalation"
        title = f"Rapid FRP Escalation at Cluster {hotspot.cluster_id}"
        description = (
            f"Radiative thermal output escalated rapidly to {hotspot.frp:.1f} MW FRP (+{frp_jump:.1f} MW increase across recent satellite passes)."
        )
        severity = "Critical" if trend_label == "RAPID ESCALATION" else "High"

    # Category D: New Source at Normally Inactive Location
    elif temp_feat and temp_feat.detection_count_90d >= 1 and temp_feat.detection_count_30d == 1:
        trigger_category = "New Source at Inactive Location"
        title = "Thermal Emergence at Previously Inactive Location"
        description = (
            f"Satellite detected new thermal emergence ({hotspot.frp:.1f} MW FRP) at location with no detections in past 30 days."
        )
        severity = "Moderate"

    # Category E: High Confidence Industrial Fire
    elif cls_result.probable_classification == "Industrial Fire" and cls_result.confidence_score >= 0.70:
        trigger_category = "Industrial Fire Anomaly"
        title = f"Possible Industrial Thermal Incident near {facility_str}"
        description = (
            f"ThermalTrace Evidence Engine identified possible industrial thermal incident ({cls_result.confidence_score*100:.0f}% confidence) "
            f"at {dist_km:.2f} km from {facility_str}. Immediate investigation recommended."
        )
        severity = "Critical"

    # 3. Duplicate Prevention & Cluster Escalation Logic
    if trigger_category and title and description:
        # Search for an active alert for the SAME cluster
        active_cluster_alert = None
        if hotspot.cluster_id:
            active_cluster_alert = (
                db.query(Alert)
                .join(Hotspot)
                .filter(Hotspot.cluster_id == hotspot.cluster_id)
                .filter(Alert.status.in_(["NEW", "ACKNOWLEDGED", "INVESTIGATING", "New", "Acknowledged", "Investigating"]))
                .first()
            )

        if active_cluster_alert:
            # ESCALATION CHECK: If new observation FRP > previous alert trigger FRP
            prev_frp = (active_cluster_alert.trigger_details or {}).get("frp", 0.0)
            if hotspot.frp and hotspot.frp > prev_frp + 5.0:
                active_cluster_alert.title = f"THERMAL ACTIVITY ESCALATING - {active_cluster_alert.title}"
                active_cluster_alert.description = (
                    f"Thermal intensity escalated to {hotspot.frp:.1f} MW FRP (+{hotspot.frp - prev_frp:.1f} MW jump). "
                    f"Prior trigger: {prev_frp:.1f} MW FRP."
                )
                if priority == "CRITICAL":
                    active_cluster_alert.priority = "CRITICAL"
                    active_cluster_alert.severity = "Critical"
                active_cluster_alert.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

                # Log Audit
                audit = AuditLog(
                    action="alert_escalated",
                    actor_email="system@thermaltrace.ai",
                    entity_type="alert",
                    entity_id=active_cluster_alert.alert_id,
                    previous_state="ACTIVE",
                    new_state="ESCALATED",
                    details={"new_frp": hotspot.frp, "prev_frp": prev_frp}
                )
                db.add(audit)

                # Notification
                notif = Notification(
                    notification_type="alert_escalated",
                    title=f"ESCALATION: {active_cluster_alert.title}",
                    message=active_cluster_alert.description,
                    severity="critical",
                    related_entity_type="alert",
                    related_entity_id=active_cluster_alert.alert_id
                )
                db.add(notif)
                db.commit()
                triggered_alerts.append(active_cluster_alert)
        else:
            # Check if alert already exists for this exact hotspot ID
            existing_alert = db.query(Alert).filter(Alert.hotspot_id == hotspot.hotspot_id).first()
            if not existing_alert:
                alert = Alert(
                    hotspot_id=hotspot.hotspot_id,
                    priority=priority,
                    severity=severity,
                    alert_type=trigger_category,
                    title=title,
                    description=description,
                    status="NEW",
                    trigger_details={
                        "trigger_category": trigger_category,
                        "frp": hotspot.frp,
                        "distance_km": dist_km,
                        "baseline_deviation": temp_feat.baseline_deviation if temp_feat else 0.0,
                        "available_evidence": avail_factors,
                        "missing_evidence": missing_factors,
                        "facility_context": facility_str
                    },
                    evidence_quality=quality,
                    why_priority=why_priority
                )
                db.add(alert)
                db.flush()

                # Create Notification
                notif = Notification(
                    notification_type="alert_triggered",
                    title=f"Alert [{priority}]: {title}",
                    message=description,
                    severity=severity.lower(),
                    related_entity_type="alert",
                    related_entity_id=alert.alert_id
                )
                db.add(notif)

                # Create AuditLog
                audit = AuditLog(
                    action="alert_created",
                    actor_email="system@thermaltrace.ai",
                    entity_type="alert",
                    entity_id=alert.alert_id,
                    previous_state=None,
                    new_state="NEW",
                    details={
                        "priority": priority,
                        "trigger_category": trigger_category,
                        "hotspot_id": hotspot.hotspot_id
                    }
                )
                db.add(audit)
                db.commit()
                db.refresh(alert)

                # Attempt external delivery if HIGH/CRITICAL
                if priority in ["HIGH", "CRITICAL"]:
                    attempt_external_alert_delivery(alert.alert_id, title, priority, description)

                triggered_alerts.append(alert)

    # 4. Evaluate active Watchlists
    check_watchlists(db, hotspot)

    return triggered_alerts

def check_watchlists(db: Session, hotspot: Hotspot):
    """
    Checks whether a new thermal observation falls within active Watchlists/AOIs.
    """
    from app.geospatial.distance import haversine_distance_km

    active_watchlists = db.query(Watchlist).filter(Watchlist.is_active == True).all()
    for w in active_watchlists:
        is_match = False

        if w.interest_type == "radius_point" and w.latitude and w.longitude:
            dist = haversine_distance_km(hotspot.latitude, hotspot.longitude, w.latitude, w.longitude)
            if dist <= w.radius_km:
                is_match = True
        elif w.interest_type == "bounding_box" and w.min_lat and w.max_lat and w.min_lon and w.max_lon:
            if w.min_lat <= hotspot.latitude <= w.max_lat and w.min_lon <= hotspot.longitude <= w.max_lon:
                is_match = True

        if is_match:
            notif = Notification(
                notification_type="watchlist_matched",
                title=f"Watchlist Alert: Observation in '{w.name}'",
                message=f"New thermal observation ({hotspot.frp:.1f} MW FRP) detected within active watch area '{w.name}'.",
                severity="warning",
                related_entity_type="hotspot",
                related_entity_id=hotspot.hotspot_id
            )
            db.add(notif)
            db.commit()
