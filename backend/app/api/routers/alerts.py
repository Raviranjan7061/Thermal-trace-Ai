from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func
from app.database.session import get_db
from app.api.deps import require_role
from app.database.models import Alert, AuditLog, User
from app.schemas.schemas import AlertResponse, AlertUpdate

router = APIRouter(prefix="/api/alerts", tags=["Operational Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    severity: Optional[str] = None
):
    query = db.query(Alert).options(joinedload(Alert.hotspot))
    if status:
        # Case insensitive match for NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED, DISMISSED
        query = query.filter(func.lower(Alert.status) == status.lower())
    if priority:
        query = query.filter(func.lower(Alert.priority) == priority.lower())
    if severity:
        query = query.filter(func.lower(Alert.severity) == severity.lower())

    return query.order_by(desc(Alert.created_at)).all()

@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: str,
    update_payload: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("analyst", "admin"))
):
    alert = db.query(Alert).options(joinedload(Alert.hotspot)).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert with ID '{alert_id}' not found.")

    prev_status = alert.status
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if update_payload.status:
        upper_status = update_payload.status.upper()
        valid_statuses = ["NEW", "ACKNOWLEDGED", "INVESTIGATING", "RESOLVED", "DISMISSED"]
        if upper_status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status '{update_payload.status}'. Allowed: {valid_statuses}")

        alert.status = upper_status
        if upper_status in ["ACKNOWLEDGED", "INVESTIGATING"] and not alert.acknowledged_at:
            alert.acknowledged_at = now
        if upper_status in ["RESOLVED", "DISMISSED"] and not alert.resolved_at:
            alert.resolved_at = now

    if update_payload.assigned_to is not None:
        alert.assigned_to = update_payload.assigned_to

    if update_payload.analyst_notes is not None:
        alert.analyst_notes = update_payload.analyst_notes

    alert.updated_at = now

    # Audit log
    audit = AuditLog(
        action="alert_updated",
        actor_email=update_payload.assigned_to or "analyst@thermaltrace.ai",
        entity_type="alert",
        entity_id=alert.alert_id,
        previous_state=prev_status,
        new_state=alert.status,
        details={
            "assigned_to": alert.assigned_to,
            "analyst_notes": alert.analyst_notes
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)
    return alert
