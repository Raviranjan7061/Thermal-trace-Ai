from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database.session import get_db
from app.database.models import Hotspot, Alert, ClassificationResult, IndustrialFacility, AuditLog, User
from app.api.deps import require_role

router = APIRouter(prefix="/api/authority", tags=["Authority Monitoring"])

@router.get("/summary")
def get_authority_summary(db: Session = Depends(get_db)):
    """
    Returns read-only situational awareness summary metrics for Authority Oversight.
    Calculated dynamically from real database records.
    """
    total_alerts = db.query(Alert).count()
    critical_alerts = db.query(Alert).filter(Alert.priority == "CRITICAL").count()
    high_alerts = db.query(Alert).filter(Alert.priority == "HIGH").count()
    investigating_cases = db.query(Alert).filter(Alert.status.in_(["INVESTIGATING", "Acknowledged"])).count()
    resolved_cases = db.query(Alert).filter(Alert.status == "RESOLVED").count()

    # Priority Incidents List (HIGH and CRITICAL priority alerts only)
    recent_priority_alerts = (
        db.query(Alert)
        .filter(Alert.priority.in_(["HIGH", "CRITICAL"]))
        .order_by(desc(Alert.created_at))
        .limit(10)
        .all()
    )

    priority_incidents = []
    for a in recent_priority_alerts:
        h = db.query(Hotspot).filter(Hotspot.hotspot_id == a.hotspot_id).first()
        cls = db.query(ClassificationResult).filter(ClassificationResult.hotspot_id == a.hotspot_id).first() if h else None
        
        loc_str = cls.nearest_facility_name if (cls and cls.nearest_facility_name) else f"{h.latitude:.2f}° N, {h.longitude:.2f}° E" if h else "Unknown Location"
        
        priority_incidents.append({
            "alert_id": a.alert_id,
            "event_id": f"TT-{a.alert_id[:6].upper()}",
            "hotspot_id": a.hotspot_id,
            "title": a.title,
            "location": loc_str,
            "priority": a.priority,
            "status": a.status,
            "classification": cls.probable_classification if cls else "Unknown",
            "frp": f"{h.frp:.1f} MW" if h and h.frp else "N/A",
            "created_at": a.created_at.strftime("%d %b %Y, %H:%M IST") if a.created_at else "N/A"
        })

    # Audit Trail for Compliance
    recent_audit_logs = (
        db.query(AuditLog)
        .order_by(desc(AuditLog.timestamp))
        .limit(15)
        .all()
    )

    audit_trail = [
        {
            "audit_id": audit.audit_id,
            "action": audit.action,
            "actor_email": audit.actor_email or "System Analyst",
            "entity_type": audit.entity_type,
            "entity_id": audit.entity_id,
            "details": audit.details,
            "timestamp": audit.timestamp.strftime("%d %b %Y, %H:%M IST") if audit.timestamp else "N/A"
        }
        for audit in recent_audit_logs
    ]

    # Calculate last data update timestamp from latest Hotspot acquisition time
    latest_hotspot = db.query(Hotspot).order_by(desc(Hotspot.acquisition_datetime)).first()
    last_update_str = (
        latest_hotspot.acquisition_datetime.strftime("%d %b %Y, %H:%M IST")
        if (latest_hotspot and latest_hotspot.acquisition_datetime)
        else "N/A"
    )

    return {
        "title": "ThermalTrace AI — Authority Situational Awareness Overview",
        "total_alerts": total_alerts,
        "critical_priority": critical_alerts,
        "high_priority": high_alerts,
        "investigating_cases": investigating_cases,
        "resolved_cases": resolved_cases,
        "priority_incidents": priority_incidents,
        "audit_trail": audit_trail,
        "last_update": last_update_str
    }

@router.get("/audit-logs")
def get_authority_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("authority", "admin"))
):
    """
    Returns immutable audit logs for regulatory oversight compliance.
    """
    logs = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return [
        {
            "audit_id": l.audit_id,
            "action": l.action,
            "actor_email": l.actor_email or "System",
            "entity_type": l.entity_type,
            "entity_id": l.entity_id or "",
            "details": l.details or {},
            "timestamp": l.timestamp.isoformat() if l.timestamp else ""
        }
        for l in logs
    ]
