import pytest
from datetime import datetime, timezone
from app.database.models import Hotspot, IndustrialFacility, LandContext, TemporalFeature
from app.ml.evidence_engine import evaluate_evidence

def test_evidence_engine_industrial_fire():
    hotspot = Hotspot(
        latitude=22.3553,
        longitude=69.8322,
        acquisition_datetime=datetime.now(timezone.utc).replace(tzinfo=None),
        satellite="N20",
        instrument="VIIRS",
        frp=95.0,
        confidence="h",
        daynight="N"
    )
    fac = IndustrialFacility(
        name="Jamnagar Refinery",
        facility_type="refinery",
        latitude=22.3553,
        longitude=69.8322
    )
    land_ctx = LandContext(land_cover_class="industrial")
    temp_feat = TemporalFeature(
        cluster_id="c1",
        baseline_deviation=2.8,
        persistence_score=0.20
    )

    cls, score, level, supporting, contradictory = evaluate_evidence(
        hotspot, fac, 0.20, {"within_1km": 1, "within_5km": 1, "within_10km": 1}, land_ctx, temp_feat
    )

    assert cls == "Industrial Fire"
    assert score >= 0.75
    assert len(supporting) > 0

def test_evidence_engine_uncertainty_handling():
    hotspot = Hotspot(
        latitude=20.0,
        longitude=80.0,
        acquisition_datetime=datetime.now(timezone.utc).replace(tzinfo=None),
        satellite="N20",
        instrument="VIIRS",
        frp=0.0,
        confidence="l",
        daynight="D"
    )

    cls, score, level, supporting, contradictory = evaluate_evidence(
        hotspot, None, None, {"within_1km": 0, "within_5km": 0, "within_10km": 0}, None, None
    )

    assert "Unknown" in cls
    assert score < 0.50
    assert level == "Insufficient evidence"
