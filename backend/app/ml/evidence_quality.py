from typing import Optional, List, Tuple, Dict, Any

def evaluate_evidence_quality(
    hotspot: Any,
    nearest_fac: Optional[Any],
    dist_km: Optional[float],
    land_ctx: Optional[Any],
    temp_feat: Optional[Any],
    imagery_available: bool = False
) -> Tuple[str, List[str], List[str]]:
    """
    Evaluates evidence quality (STRONG, MODERATE, LIMITED, INSUFFICIENT)
    and returns lists of available evidence factors vs missing evidence factors.
    """
    available_factors: List[str] = []
    missing_factors: List[str] = []

    # 1. Thermal Measurement Quality
    if hotspot.frp is not None and hotspot.brightness_ti4 is not None:
        available_factors.append(f"Complete satellite radiometric parameters ({hotspot.frp} MW FRP, {hotspot.brightness_ti4} K brightness)")
    else:
        missing_factors.append("Partial satellite radiometric measurements")

    # 2. Industrial Context Quality
    if nearest_fac and dist_km is not None:
        available_factors.append(f"Verified industrial facility registry context ({nearest_fac.name}, {dist_km:.2f} km)")
    else:
        missing_factors.append("No registered industrial facility in immediate vicinity")

    # 3. Land Cover Context Quality
    if land_ctx and land_ctx.land_cover_class and land_ctx.land_cover_class != "Unknown":
        available_factors.append(f"Land cover context classification available ({land_ctx.land_cover_class})")
    else:
        missing_factors.append("Copernicus/OSM land cover context unconfirmed")

    # 4. Temporal Historical Baseline Coverage
    if temp_feat and temp_feat.detection_count_90d >= 3:
        available_factors.append(f"Sufficient historical observations for 90-day baseline ({temp_feat.detection_count_90d} detections)")
    else:
        missing_factors.append("Insufficient historical observations to establish robust 90-day baseline")

    # 5. Satellite Imagery Context
    if imagery_available:
        available_factors.append("Recent satellite imagery available")
    else:
        missing_factors.append("Satellite imagery provider key unconfigured")

    # Score calculation
    factor_count = len(available_factors)
    if factor_count >= 4:
        quality = "STRONG"
    elif factor_count == 3:
        quality = "MODERATE"
    elif factor_count == 2:
        quality = "LIMITED"
    else:
        quality = "INSUFFICIENT"

    return quality, available_factors, missing_factors
