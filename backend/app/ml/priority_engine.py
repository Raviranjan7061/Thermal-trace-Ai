from typing import Optional, List, Tuple, Dict, Any

def calculate_investigation_priority(
    frp: Optional[float],
    baseline_deviation: float,
    dist_km: Optional[float],
    persistence_score: float,
    classification_name: Optional[str],
    confidence_score: float,
    evidence_quality: str
) -> Tuple[str, List[str]]:
    """
    Computes an explainable investigation priority for thermal anomalies.
    
    Priority levels:
    - CRITICAL: Immediate urgent analyst verification required.
    - HIGH: Elevated priority for investigation.
    - MODERATE: Standard operational priority.
    - LOW: Baseline or low-risk observation.
    
    Returns: (priority_level, list_of_reasons)
    """
    reasons: List[str] = []
    score = 0.0

    # 1. FRP Anomaly Magnitude
    frp_val = frp if frp is not None else 0.0
    if frp_val >= 100.0:
        score += 35.0
        reasons.append(f"Extreme radiative power output ({frp_val:.1f} MW FRP >= 100 MW)")
    elif frp_val >= 50.0:
        score += 25.0
        reasons.append(f"High radiative power output ({frp_val:.1f} MW FRP >= 50 MW)")
    elif frp_val >= 20.0:
        score += 15.0
        reasons.append(f"Moderate thermal intensity ({frp_val:.1f} MW FRP)")
    else:
        score += 5.0
        reasons.append(f"Low thermal intensity ({frp_val:.1f} MW FRP)")

    # 2. Baseline Deviation (+Z Score)
    if baseline_deviation >= 3.5:
        score += 30.0
        reasons.append(f"Severe FRP anomaly (+{baseline_deviation:.1f} Z-score above 90-day baseline)")
    elif baseline_deviation >= 2.0:
        score += 20.0
        reasons.append(f"Elevated FRP baseline deviation (+{baseline_deviation:.1f} Z-score)")
    elif baseline_deviation >= 1.0:
        score += 10.0
        reasons.append(f"Minor FRP deviation (+{baseline_deviation:.1f} Z-score above baseline)")
    else:
        reasons.append("Thermal output within expected historical baseline variation")

    # 3. Industrial Infrastructure Proximity
    if dist_km is not None:
        if dist_km <= 1.0:
            score += 25.0
            reasons.append(f"Direct proximity to industrial facility ({dist_km:.2f} km)")
        elif dist_km <= 3.0:
            score += 15.0
            reasons.append(f"Located near industrial zone ({dist_km:.2f} km)")
        elif dist_km <= 5.0:
            score += 10.0
            reasons.append(f"Within 5 km radius of industrial facility ({dist_km:.2f} km)")
        else:
            reasons.append(f"Distant from known industrial facilities ({dist_km:.1f} km)")
    else:
        reasons.append("No known industrial facility within 10 km range")

    # 4. Sudden Anomaly vs Persistent Flare Profile
    if persistence_score < 0.3 and frp_val > 30.0:
        score += 15.0
        reasons.append("Sudden thermal emergence at location with low historical persistence")
    elif persistence_score >= 0.7:
        reasons.append(f"Persistent thermal source profile (persistence score: {persistence_score:.2f})")

    # 5. Classification Confidence
    if classification_name == "Industrial Fire" and confidence_score >= 0.70:
        score += 20.0
        reasons.append(f"Preliminary classifier identified Industrial Fire with {confidence_score*100:.0f}% confidence")

    # 6. Evidence Quality Modifier
    if evidence_quality == "STRONG":
        score += 5.0
    elif evidence_quality == "INSUFFICIENT":
        score -= 10.0
        reasons.append("Priority adjusted downward due to limited contextual evidence")

    # Final Priority Categorization
    if score >= 65.0:
        priority = "CRITICAL"
    elif score >= 45.0:
        priority = "HIGH"
    elif score >= 25.0:
        priority = "MODERATE"
    else:
        priority = "LOW"

    return priority, reasons
