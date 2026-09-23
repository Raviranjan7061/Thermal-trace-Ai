from typing import Dict, Any, List, Tuple, Optional
from app.database.models import Hotspot, LandContext, TemporalFeature, IndustrialFacility

def evaluate_evidence(
    hotspot: Hotspot,
    nearest_fac: Optional[IndustrialFacility],
    dist_km: Optional[float],
    counts: Dict[str, int],
    land_ctx: Optional[LandContext],
    temp_feat: Optional[TemporalFeature]
) -> Tuple[str, float, str, List[str], List[str]]:
    """
    Evaluates thermal anomaly features using scientific rules.
    Returns:
    (probable_classification, confidence_score, confidence_level, supporting_evidence, contradictory_evidence)
    """
    supporting: List[str] = []
    contradictory: List[str] = []

    # Default baseline
    probable_class = "Unknown"
    confidence = 0.40

    frp = hotspot.frp if hotspot.frp is not None else 0.0
    satellite_conf = str(hotspot.confidence or "").lower()
    land_cover = land_ctx.land_cover_class if land_ctx else "Unknown"

    # Industrial proximity evaluation
    if dist_km is not None and dist_km <= 1.5:
        supporting.append(f"Industrial infrastructure ({nearest_fac.name if nearest_fac else 'facility'}) detected {dist_km:.2f} km away")
    elif dist_km is not None and dist_km <= 5.0:
        supporting.append(f"Nearby industrial site within 5 km ({dist_km:.2f} km)")
    elif dist_km is not None:
        contradictory.append(f"No industrial site within 5 km (nearest is {dist_km:.2f} km away)")

    # FRP and thermal intensity
    if frp >= 45.0:
        supporting.append(f"High Fire Radiative Power ({frp:.1f} MW) indicates intense thermal emission")
    elif frp >= 15.0:
        supporting.append(f"Moderate Fire Radiative Power ({frp:.1f} MW)")
    elif frp > 0:
        contradictory.append(f"Low Fire Radiative Power ({frp:.1f} MW) reduces likelihood of major industrial structure fire")

    # Satellite confidence rating
    if satellite_conf in ["h", "high", "90", "100"]:
        supporting.append(f"High satellite detection confidence from {hotspot.instrument} ({hotspot.satellite})")
    elif satellite_conf in ["l", "low"]:
        contradictory.append("Low satellite sensor confidence rating")

    # Temporal intelligence evaluation
    if temp_feat:
        pers_score = temp_feat.persistence_score or 0.0
        det_30d = temp_feat.detection_count_30d or 0
        dev_z = temp_feat.baseline_deviation or 0.0

        if pers_score >= 0.60:
            supporting.append(f"High thermal persistence score ({pers_score:.2f}) over historical monitoring period")
        elif det_30d > 10:
            supporting.append(f"Frequent recurring thermal observations ({det_30d} detections in last 30 days)")

        if dev_z >= 2.5:
            supporting.append(f"Abrupt FRP spike (+{dev_z:.1f} Z-score standard deviations above local baseline)")
        elif dev_z < 0.5 and det_30d > 5:
            supporting.append("Consistent thermal baseline matches continuous industrial operational flare profile")

    # Land cover context
    if land_cover == "industrial":
        supporting.append("Land cover verified as industrial / built-up infrastructure zone")
    elif land_cover == "forest":
        contradictory.append("Land cover classified as forest vegetation reserve")
        if dist_km and dist_km > 10.0:
            supporting.append("Location situated deep within forest land cover boundaries")
    elif land_cover == "cropland":
        contradictory.append("Situated in agricultural cropland zone")

    # Classification Rule Logic
    pers_val = temp_feat.persistence_score or 0.0 if temp_feat else 0.0
    dev_val = temp_feat.baseline_deviation or 0.0 if temp_feat else 0.0

    # Rule 1: Persistent Gas Flare / Continuous Thermal Source
    if dist_km is not None and dist_km <= 2.5 and pers_val >= 0.50 and abs(dev_val) < 2.0:
        probable_class = "Persistent Gas Flare"
        confidence = 0.85
        supporting.append("Repeated spatial recurrence at industrial facility with stable baseline indicates persistent flare activity")
    # Rule 2: Sudden Industrial Fire Candidate
    elif dist_km is not None and dist_km <= 2.5 and (frp >= 50.0 or dev_val >= 2.0):
        probable_class = "Industrial Fire"
        confidence = 0.81
        supporting.append("Sudden intense thermal anomaly near industrial facility suggests potential industrial fire event")
    # Rule 3: Industrial/Mining Thermal Activity
    elif dist_km is not None and dist_km <= 5.0 and land_cover in ["industrial", "built-up"]:
        probable_class = "Industrial/Mining Thermal Activity"
        confidence = 0.72
        supporting.append("Thermal detection located in industrial/built-up land context")
    # Rule 4: Wildfire Candidate
    elif land_cover == "forest" and (dist_km is None or dist_km >= 8.0):
        probable_class = "Wildfire"
        confidence = 0.78
        supporting.append("Active thermal detection in forest land cover distant from industrial infrastructure")
    # Rule 5: Crop Burning Candidate
    elif land_cover == "cropland" and (dist_km is None or dist_km >= 5.0):
        probable_class = "Crop Burning"
        confidence = 0.75
        supporting.append("Thermal detection in agricultural cropland region")
    # Rule 6: Other Thermal Source
    elif frp > 0:
        probable_class = "Other Thermal Source"
        confidence = 0.55
        frp_desc = "high" if frp >= 45.0 else ("moderate" if frp >= 15.0 else "lower")
        supporting.append(f"Unclassified thermal anomaly with {frp_desc} satellite radiative power")
    else:
        probable_class = "Unknown"
        confidence = 0.35
        contradictory.append("Insufficient spatial, temporal, or radiative evidence for definitive classification")

    # Determine confidence level string
    if confidence >= 0.75:
        conf_level = "High confidence"
    elif confidence >= 0.55:
        conf_level = "Moderate confidence"
    elif confidence >= 0.40:
        conf_level = "Low confidence"
    else:
        conf_level = "Insufficient evidence"

    # Uncertainty handling threshold
    if confidence < 0.50:
        probable_class = "Unknown / Needs Analyst Review"
        conf_level = "Insufficient evidence"

    return probable_class, round(confidence, 2), conf_level, supporting, contradictory
