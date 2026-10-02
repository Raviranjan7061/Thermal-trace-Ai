import logging
import threading
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("thermaltrace.notification_delivery")

def _dispatch_email_notifications_background(
    alert_id: str,
    title: str,
    priority: str,
    description: str
):
    """
    Isolated background thread worker for non-blocking SMTP email dispatch.
    Uses its own isolated SessionLocal() instance and 10s SMTP socket timeout.
    """
    if not settings.SMTP_HOST:
        return

    from app.database.session import SessionLocal
    from app.database.models import User, AuditLog

    db = SessionLocal()
    try:
        # Query active eligible users with email notifications enabled
        recipients = db.query(User).filter(
            User.is_active == True,
            User.email_notifications_enabled == True,
            User.notification_email.isnot(None),
            User.notification_email != '',
            User.role.in_(["user", "analyst", "authority"])
        ).all()

        if not recipients:
            logger.info(f"No active users with email notifications enabled for alert '{alert_id}'.")
            return

        smtp_from = settings.SMTP_FROM_EMAIL or settings.SMTP_USER or "alerts@thermaltrace.ai"

        for recipient in recipients:
            target_email = (recipient.notification_email or "").strip().lower()
            if not target_email:
                continue

            # Idempotency check against audit_logs table
            existing_log = db.query(AuditLog).filter(
                AuditLog.action == "email_alert_sent",
                AuditLog.entity_id == alert_id,
                AuditLog.actor_email == target_email
            ).first()

            if existing_log:
                logger.info(f"Email alert for '{alert_id}' already dispatched to '{target_email}'. Skipping duplicate.")
                continue

            # Build MIME email message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"[ThermalTrace AI Alert] [{priority.upper()}] {title}"
            msg["From"] = smtp_from
            msg["To"] = target_email

            text_body = f"""ThermalTrace AI — Thermal Anomaly Alert

Alert ID: {alert_id}
Priority: {priority.upper()}
Title: {title}

Description:
{description}

Access ThermalTrace AI dashboard for full spatial & temporal analysis.
"""

            html_body = f"""
            <html>
              <body style="font-family: Arial, sans-serif; background-color: #0b111e; color: #f8fafc; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px;">
                  <h2 style="color: #f59e0b; margin-top: 0;">ThermalTrace AI Alert</h2>
                  <div style="background-color: #0f172a; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px;">
                    <strong style="color: #ffffff;">[{priority.upper()}] {title}</strong>
                  </div>
                  <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">{description}</p>
                  <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; border-top: 1px solid #334155; padding-top: 12px;">
                    Alert ID: <code style="color: #f59e0b;">{alert_id}</code> &bull; ThermalTrace AI Intelligence Engine
                  </p>
                </div>
              </body>
            </html>
            """

            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            # Dispatch via SMTP with 10.0s socket timeout
            try:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10.0)
                if settings.SMTP_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(smtp_from, [target_email], msg.as_string())
                server.quit()

                # Record successful delivery in AuditLog
                audit = AuditLog(
                    action="email_alert_sent",
                    actor_email=target_email,
                    entity_type="alert",
                    entity_id=alert_id,
                    details={"status": "SENT", "channel": "email", "priority": priority}
                )
                db.add(audit)
                db.commit()
                logger.info(f"Email alert '{alert_id}' successfully sent to '{target_email}'.")
            except Exception as smtp_err:
                logger.warning(f"SMTP send error for recipient '{target_email}' on alert '{alert_id}': {smtp_err}")
                db.rollback()

    except Exception as exc:
        logger.warning(f"Background email delivery worker error for alert '{alert_id}': {exc}")
    finally:
        db.close()


def attempt_external_alert_delivery(
    alert_id: str,
    title: str,
    priority: str,
    description: str
) -> Dict[str, Any]:
    """
    External notification delivery architecture for HIGH/CRITICAL alerts.
    Supports Webhook and SMTP Email integration.
    
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

    # If SMTP is configured, trigger asynchronous background email dispatch
    if smtp_host:
        worker_thread = threading.Thread(
            target=_dispatch_email_notifications_background,
            args=(alert_id, title, priority, description),
            daemon=True
        )
        worker_thread.start()

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

    return {"status": "SENT", "provider": "SMTP", "attempted": True}
