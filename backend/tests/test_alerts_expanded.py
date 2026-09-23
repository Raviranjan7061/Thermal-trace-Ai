import pytest
from app.ml.priority_engine import calculate_investigation_priority
from app.ml.evidence_quality import evaluate_evidence_quality

def test_priority_engine_critical():
    priority, reasons = calculate_investigation_priority(
        frp=120.0,
        baseline_deviation=4.0,
        dist_km=0.5,
        persistence_score=0.1,
        classification_name="Industrial Fire",
        confidence_score=0.85,
        evidence_quality="STRONG"
    )
    assert priority == "CRITICAL"
    assert any("Extreme radiative power" in r for r in reasons)
    assert any("Direct proximity to industrial facility" in r for r in reasons)

def test_priority_engine_low():
    priority, reasons = calculate_investigation_priority(
        frp=5.0,
        baseline_deviation=0.2,
        dist_km=15.0,
        persistence_score=0.8,
        classification_name="Persistent Gas Flare",
        confidence_score=0.40,
        evidence_quality="MODERATE"
    )
    assert priority in ["LOW", "MODERATE"]

def test_evidence_quality_assessor():
    class DummyHotspot:
        frp = 45.0
        brightness_ti4 = 320.0

    class DummyFacility:
        name = "Refinery A"

    class DummyLand:
        land_cover_class = "built-up"

    class DummyTemp:
        detection_count_90d = 10

    quality, avail, missing = evaluate_evidence_quality(
        hotspot=DummyHotspot(),
        nearest_fac=DummyFacility(),
        dist_km=1.2,
        land_ctx=DummyLand(),
        temp_feat=DummyTemp(),
        imagery_available=False
    )
    assert quality in ["STRONG", "MODERATE"]
    assert len(avail) >= 3
