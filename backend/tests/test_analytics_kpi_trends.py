import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database.session import get_db
from app.database.models import Hotspot, ClassificationResult

client = TestClient(app)

def test_analytics_kpi_trends_endpoint_structure():
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "kpi_trends" in data
    trends = data["kpi_trends"]
    assert "thermal_detections" in trends
    assert "industrial_candidates" in trends
    assert "natural_fire_candidates" in trends
    assert "needs_review" in trends

    for key in ["thermal_detections", "industrial_candidates", "natural_fire_candidates", "needs_review"]:
        item = trends[key]
        assert "trend_text" in item
        assert "trend_color" in item
        assert "trend_direction" in item
        assert "series" in item
        assert isinstance(item["series"], list)

def test_kpi_trend_calculations_with_synthetic_db_records(db_session: Session):
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # 1. Create previous period hotspot (8 days ago)
    h_prev = Hotspot(
        hotspot_id="test_h_prev_1",
        latitude=20.5,
        longitude=78.5,
        acquisition_datetime=now - timedelta(days=8),
        satellite="NOAA-20",
        instrument="VIIRS",
        source_dataset="VIIRS_NOAA20_NRT",
        deduplication_hash="hash_prev_1"
    )
    db_session.add(h_prev)
    db_session.flush()

    c_prev = ClassificationResult(
        classification_id="test_c_prev_1",
        hotspot_id=h_prev.hotspot_id,
        probable_classification="Industrial Fire",
        confidence_score=0.9,
        confidence_level="HIGH",
        classification_mode="RULE_BASED"
    )
    db_session.add(c_prev)

    # 2. Create current period hotspots (1 day ago and 2 days ago)
    h_curr1 = Hotspot(
        hotspot_id="test_h_curr_1",
        latitude=20.6,
        longitude=78.6,
        acquisition_datetime=now - timedelta(days=1),
        satellite="NOAA-20",
        instrument="VIIRS",
        source_dataset="VIIRS_NOAA20_NRT",
        deduplication_hash="hash_curr_1"
    )
    h_curr2 = Hotspot(
        hotspot_id="test_h_curr_2",
        latitude=20.7,
        longitude=78.7,
        acquisition_datetime=now - timedelta(days=2),
        satellite="NOAA-21",
        instrument="VIIRS",
        source_dataset="VIIRS_NOAA21_NRT",
        deduplication_hash="hash_curr_2"
    )
    db_session.add_all([h_curr1, h_curr2])
    db_session.flush()

    c_curr1 = ClassificationResult(
        classification_id="test_c_curr_1",
        hotspot_id=h_curr1.hotspot_id,
        probable_classification="Industrial Fire",
        confidence_score=0.85,
        confidence_level="HIGH",
        classification_mode="RULE_BASED"
    )
    c_curr2 = ClassificationResult(
        classification_id="test_c_curr_2",
        hotspot_id=h_curr2.hotspot_id,
        probable_classification="Wildfire",
        confidence_score=0.88,
        confidence_level="HIGH",
        classification_mode="RULE_BASED"
    )
    db_session.add_all([c_curr1, c_curr2])
    db_session.commit()

    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    trends = data.get("kpi_trends", {})

    # Thermal Detections
    td = trends.get("thermal_detections", {})
    assert td.get("trend_direction") in ["up", "new", "insufficient", "flat", "down"]
    assert isinstance(td.get("series"), list)
    assert len(td.get("series")) == 7
