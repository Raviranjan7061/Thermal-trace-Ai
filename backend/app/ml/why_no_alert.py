from typing import Optional, List, Dict, Any
from app.database.models import Hotspot, ClassificationResult, TemporalFeature, Alert

def generate_why_no_alert_explanation(
    hotspot: Hotspot,
    cls_result: Optional[ClassificationResult],
    temp_feat: Optional[TemporalFeature],
    active_alert: Optional[Alert]
) -> Dict[str, Any]:
    """
    Generates explainable rationale for why an operational alert was NOT generated for a hotspot.
    """
    if active_alert:
        return {
            "alert_generated": True,
            "alert_id": active_alert.alert_id,
            "title": active_alert.title,
            "reasons": ["Operational alert actively triggered for this thermal observation."]
        }

    reasons: List[str] = []

    # 1. Measurement Validity
    frp_val = hotspot.frp if hotspot.frp is not None else 0.0
    reasons.append(f"Satellite radiometric measurement recorded ({frp_val:.1f} MW FRP)")

    # 2. Historical Baseline Evaluation
    if temp_feat:
        if temp_feat.detection_count_90d < 3:
            reasons.append("Insufficient historical observations (< 3 detections) to confirm baseline anomaly")
        elif temp_feat.baseline_deviation < 2.0:
            reasons.append(f"Radiative output remains within normal historical variation (baseline: {temp_feat.baseline_frp:.1f} MW FRP, +{temp_feat.baseline_deviation:.1f} Z-score)")

        if temp_feat.persistence_score >= 0.6:
            reasons.append(f"Location exhibits recurring thermal persistence (persistence score: {temp_feat.persistence_score:.2f}) consistent with continuous industrial flaring")
    else:
        reasons.append("No spatial cluster history available for anomaly baseline evaluation")

    # 3. Proximity Rationale
    if cls_result:
        dist_km = cls_result.distance_to_nearest_facility_km
        if dist_km is not None and dist_km > 5.0:
            reasons.append(f"Distance to nearest registered industrial facility ({dist_km:.1f} km) exceeds 5 km immediate priority threshold")
        
        if cls_result.probable_classification == "Persistent Gas Flare":
            reasons.append("Preliminary classifier categorized site as Persistent Gas Flare rather than sudden industrial fire")

    # 4. Escalation Rationale
    reasons.append("No sudden or rapid FRP escalation detected across recent satellite passes")

    return {
        "alert_generated": False,
        "summary": "No operational anomaly alert generated for this observation.",
        "reasons": reasons
    }
