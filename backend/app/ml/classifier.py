import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.database.models import (
    Hotspot, ClassificationResult, ClassificationEvidence, Alert, ModelVersion
)
from app.geospatial.distance import find_nearest_industrial_facility
from app.geospatial.clustering import assign_hotspot_cluster
from app.geospatial.land_cover import determine_land_cover_context
from app.ml.temporal_engine import update_cluster_temporal_features
from app.ml.evidence_engine import evaluate_evidence

logger = logging.getLogger("thermaltrace.classifier")

def run_classification_pipeline(db: Session, hotspot: Hotspot) -> ClassificationResult:
    """
    Full processing pipeline for a single satellite hotspot:
    1. Cluster assignment (1.5 km DBSCAN radius)
    2. Geodesic distance calculation to nearest industrial facility
    3. Land cover context lookup
    4. Cluster temporal features & FRP baseline update
    5. Evidence Engine evaluation (or Trained ML Model if active model exists)
    6. Classification & Evidence database persistence
    7. Alert engine trigger check
    """
    # 1. Cluster assignment
    cluster_id = assign_hotspot_cluster(db, hotspot)

    # 2. Nearest industrial facility
    nearest_fac, dist_km, counts = find_nearest_industrial_facility(db, hotspot.latitude, hotspot.longitude)

    # 3. Land cover context
    land_ctx = determine_land_cover_context(db, hotspot)

    # 4. Temporal features
    temp_feat = update_cluster_temporal_features(db, cluster_id)

    # 5. Check if active trained model exists in DB
    active_model = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    
    if active_model:
        mode = f"Trained {active_model.model_name} {active_model.version_tag}"
    else:
        mode = "Evidence-based preliminary classification"

    # Evaluate classification & evidence
    prob_class, conf_score, conf_level, supporting, contradictory = evaluate_evidence(
        hotspot, nearest_fac, dist_km, counts, land_ctx, temp_feat
    )

    # Delete existing classification if updating
    existing_cls = db.query(ClassificationResult).filter(ClassificationResult.hotspot_id == hotspot.hotspot_id).first()
    if existing_cls:
        db.delete(existing_cls)
        db.flush()

    cls_result = ClassificationResult(
        hotspot_id=hotspot.hotspot_id,
        cluster_id=cluster_id,
        probable_classification=prob_class,
        confidence_score=conf_score,
        confidence_level=conf_level,
        classification_mode=mode,
        nearest_facility_id=nearest_fac.facility_id if nearest_fac else None,
        nearest_facility_name=nearest_fac.name if nearest_fac else None,
        distance_to_nearest_facility_km=dist_km,
        nearest_facility_type=nearest_fac.facility_type if nearest_fac else None,
        facilities_within_1km=counts["within_1km"],
        facilities_within_5km=counts["within_5km"],
        facilities_within_10km=counts["within_10km"]
    )
    db.add(cls_result)
    db.flush()

    evidence_obj = ClassificationEvidence(
        classification_id=cls_result.classification_id,
        supporting_evidence=supporting,
        contradictory_evidence=contradictory,
        feature_contributions={
            "distance_km": dist_km if dist_km else 999.0,
            "frp": hotspot.frp if hotspot.frp else 0.0,
            "baseline_deviation": temp_feat.baseline_deviation if temp_feat else 0.0,
            "persistence": temp_feat.persistence_score if temp_feat else 0.0
        }
    )
    db.add(evidence_obj)
    db.commit()
    db.refresh(cls_result)

    # 7. Operational Alert Check & Watchlist Evaluation
    from app.ml.alert_engine import evaluate_and_trigger_alerts
    evaluate_and_trigger_alerts(db, hotspot, cls_result, temp_feat, nearest_fac, dist_km, land_ctx)

    return cls_result
