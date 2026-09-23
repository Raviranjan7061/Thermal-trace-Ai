import numpy as np
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.database.models import Hotspot, TemporalFeature

def calculate_cluster_frp_trend(cluster_hotspots: List[Hotspot]) -> Tuple[str, float]:
    """
    Evaluates whether recent observations show an escalating, rising, stable, or falling FRP trend.
    Returns: (trend_label, frp_jump)
    """
    valid = [h for h in cluster_hotspots if h.frp is not None and h.frp > 0]
    if len(valid) < 2:
        return "INSUFFICIENT DATA", 0.0

    recent = valid[-3:] # Look at up to last 3 observations
    last_frp = recent[-1].frp
    prev_frp = recent[-2].frp
    frp_jump = last_frp - prev_frp

    if len(recent) == 3:
        first_frp = recent[0].frp
        if last_frp > prev_frp > first_frp and (last_frp - first_frp) >= 15.0:
            return "RAPID ESCALATION", round(last_frp - first_frp, 1)

    if frp_jump >= 15.0 or (prev_frp > 0 and (frp_jump / prev_frp) >= 0.5):
        return "RISING", round(frp_jump, 1)
    elif abs(frp_jump) < 5.0:
        return "STABLE", round(frp_jump, 1)
    elif frp_jump <= -10.0:
        return "FALLING", round(frp_jump, 1)

    return "STABLE", round(frp_jump, 1)

def update_cluster_temporal_features(db: Session, cluster_id: str) -> TemporalFeature:
    cluster_hotspots = (
        db.query(Hotspot)
        .filter(Hotspot.cluster_id == cluster_id)
        .order_by(Hotspot.acquisition_datetime.asc())
        .all()
    )

    if not cluster_hotspots:
        temp_feature = db.query(TemporalFeature).filter(TemporalFeature.cluster_id == cluster_id).first()
        if not temp_feature:
            temp_feature = TemporalFeature(
                cluster_id=cluster_id,
                detection_count_7d=0,
                detection_count_30d=0,
                detection_count_90d=0,
                recurrence_frequency=0.0,
                persistence_score=0.0
            )
            db.add(temp_feature)
            db.commit()
        return temp_feature

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    d7_cutoff = now - timedelta(days=7)
    d30_cutoff = now - timedelta(days=30)
    d90_cutoff = now - timedelta(days=90)

    count_7d = sum(1 for h in cluster_hotspots if h.acquisition_datetime >= d7_cutoff)
    count_30d = sum(1 for h in cluster_hotspots if h.acquisition_datetime >= d30_cutoff)
    count_90d = sum(1 for h in cluster_hotspots if h.acquisition_datetime >= d90_cutoff)

    frp_values = [h.frp for h in cluster_hotspots if h.frp is not None and h.frp > 0]
    
    if frp_values:
        avg_frp = float(np.mean(frp_values))
        max_frp = float(np.max(frp_values))
        median_frp = float(np.median(frp_values))
        frp_variance = float(np.var(frp_values)) if len(frp_values) > 1 else 0.0
    else:
        avg_frp, max_frp, median_frp, frp_variance = None, None, None, 0.0

    first_obs = cluster_hotspots[0].acquisition_datetime
    last_obs = cluster_hotspots[-1].acquisition_datetime
    total_days = max(1.0, (last_obs - first_obs).total_seconds() / 86400.0)

    recurrence_freq = len(cluster_hotspots) / total_days
    unique_dates = len(set(h.acquisition_datetime.date() for h in cluster_hotspots))
    persistence_score = min(1.0, round(unique_dates / max(1.0, total_days), 3))

    night_count = sum(1 for h in cluster_hotspots if h.daynight == "N")
    daynight_ratio = night_count / max(1, len(cluster_hotspots))

    # Calculate baseline only if count_90d >= 3
    if count_90d >= 3 and median_frp is not None:
        baseline_frp = median_frp
        latest_frp = cluster_hotspots[-1].frp
        if latest_frp is not None and baseline_frp > 0:
            if frp_variance > 0:
                std_dev = float(np.sqrt(frp_variance))
                baseline_deviation = (latest_frp - baseline_frp) / max(0.1, std_dev)
            else:
                baseline_deviation = (latest_frp - baseline_frp) / baseline_frp
        else:
            baseline_deviation = 0.0
    else:
        baseline_frp = None
        baseline_deviation = 0.0

    temp_feature = db.query(TemporalFeature).filter(TemporalFeature.cluster_id == cluster_id).first()
    if not temp_feature:
        temp_feature = TemporalFeature(cluster_id=cluster_id)
        db.add(temp_feature)

    temp_feature.detection_count_7d = count_7d
    temp_feature.detection_count_30d = count_30d
    temp_feature.detection_count_90d = count_90d
    temp_feature.avg_frp = avg_frp
    temp_feature.max_frp = max_frp
    temp_feature.median_frp = median_frp
    temp_feature.frp_variance = frp_variance
    temp_feature.recurrence_frequency = round(recurrence_freq, 3)
    temp_feature.persistence_score = persistence_score
    temp_feature.first_observed = first_obs
    temp_feature.last_observed = last_obs
    temp_feature.daynight_ratio = round(daynight_ratio, 3)
    temp_feature.baseline_frp = baseline_frp
    temp_feature.baseline_deviation = round(baseline_deviation, 2)
    temp_feature.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    db.commit()
    db.refresh(temp_feature)
    return temp_feature
