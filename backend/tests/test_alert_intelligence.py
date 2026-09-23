import pytest
from app.ml.temporal_engine import calculate_cluster_frp_trend
from app.ml.why_no_alert import generate_why_no_alert_explanation
from app.services.notification_delivery import attempt_external_alert_delivery

class DummyHotspot:
    def __init__(self, frp, lat=20.5, lon=78.9):
        self.frp = frp
        self.latitude = lat
        self.longitude = lon

def test_frp_trend_rising():
    h1 = DummyHotspot(10.0)
    h2 = DummyHotspot(20.0)
    h3 = DummyHotspot(45.0)
    trend, jump = calculate_cluster_frp_trend([h1, h2, h3])
    assert trend in ["RAPID ESCALATION", "RISING"]
    assert jump > 0

def test_frp_trend_stable():
    h1 = DummyHotspot(20.0)
    h2 = DummyHotspot(21.0)
    trend, jump = calculate_cluster_frp_trend([h1, h2])
    assert trend == "STABLE"

def test_why_no_alert_explanation():
    hotspot = DummyHotspot(12.0)
    explanation = generate_why_no_alert_explanation(
        hotspot=hotspot,
        cls_result=None,
        temp_feat=None,
        active_alert=None
    )
    assert explanation["alert_generated"] is False
    assert len(explanation["reasons"]) > 0

def test_notification_delivery_stub():
    res = attempt_external_alert_delivery("alert_123", "Test Alert", "HIGH", "Test description")
    assert res["status"] in ["NOT CONFIGURED", "SENT", "FAILED"]
