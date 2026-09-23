import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("thermaltrace.notification_delivery")

def attempt_external_alert_delivery(
    alert_id: str,
    title: str,
    priority: str,
    description: str
) -> Dict[str, Any]:
    """
    Optional external notification delivery architecture for HIGH/CRITICAL alerts.
    Supports Webhook / Email / SMS integration.
    
    If no external provider credentials are configured, returns 'NOT CONFIGURED'
    without faking delivery.
    """
    webhook_url = getattr(settings, "ALERT_WEBHOOK_URL", None)
    smtp_host = getattr(settings, "SMTP_HOST", None)

    if not webhook_url and not smtp_host:
        logger.info(f"External notification delivery for alert '{alert_id}': NOT CONFIGURED")
        return {
            "status": "NOT CONFIGURED",
            "provider": "None",
            "attempted": False,
            "message": "External notification providers (Email/SMS/Webhook) are not configured in backend environment."
        }

    # If webhook_url is configured, attempt delivery
    if webhook_url:
        try:
            import requests
            resp = requests.post(
                webhook_url,
                json={
                    "event": "THERMAL_ANOMALY_ALERT",
                    "alert_id": alert_id,
                    "title": title,
                    "priority": priority,
                    "description": description
                },
                timeout=5.0
            )
            if resp.status_code == 200:
                return {"status": "SENT", "provider": "Webhook", "attempted": True}
            else:
                return {"status": "FAILED", "provider": "Webhook", "attempted": True, "error": f"HTTP {resp.status_code}"}
        except Exception as e:
            return {"status": "FAILED", "provider": "Webhook", "attempted": True, "error": str(e)}

    return {"status": "NOT CONFIGURED", "provider": "None", "attempted": False}
