from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc
from app.database.session import get_db
from app.database.models import Hotspot, ClassificationResult, Alert, SyncRun, TemporalFeature, IndustrialFacility
from app.schemas.schemas import AnalyticsOverview
from app.core.config import settings

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Reporting"])

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    db: Session = Depends(get_db),
    days: int = Query(7, ge=0, le=365),
    satellite: Optional[str] = None,
    classification: Optional[str] = None,
    priority: Optional[str] = None,
    daynight: Optional[str] = None
):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # 1. Base Filter Query for Hotspots
    query = db.query(Hotspot)
    if days > 0:
        cutoff = now - timedelta(days=days)
        query = query.filter(Hotspot.acquisition_datetime >= cutoff)

    if satellite and satellite.upper() != "ALL":
        query = query.filter(Hotspot.satellite.ilike(f"%{satellite}%"))

    if daynight and daynight.upper() != "ALL":
        query = query.filter(Hotspot.daynight == daynight.upper())

    if classification and classification.upper() != "ALL":
        query = query.join(Hotspot.classification).filter(
            ClassificationResult.probable_classification.ilike(f"%{classification}%")
        )

    hotspots = query.order_by(desc(Hotspot.acquisition_datetime)).all()
    total_detections = len(hotspots)

    # 2. Key Metrics
    frp_vals = [h.frp for h in hotspots if h.frp is not None and h.frp > 0]
    avg_frp = round(float(sum(frp_vals) / len(frp_vals)), 1) if frp_vals else None

    # Alerts query
    alert_query = db.query(Alert)
    if priority and priority.upper() != "ALL":
        alert_query = alert_query.filter(Alert.priority == priority.upper())

    active_alerts = alert_query.filter(Alert.status.in_(["NEW", "ACKNOWLEDGED", "INVESTIGATING", "New", "Acknowledged", "Investigating"])).all()
    active_anomalies_count = len(active_alerts)
    high_critical_count = sum(1 for a in active_alerts if (a.priority or "").upper() in ["HIGH", "CRITICAL"])

    # Classification counts
    cls_query = db.query(ClassificationResult)
    if days > 0:
        cutoff = now - timedelta(days=days)
        cls_query = cls_query.join(Hotspot).filter(Hotspot.acquisition_datetime >= cutoff)

    cls_results = cls_query.all()
    industrial_candidates = sum(1 for c in cls_results if c.probable_classification in ["Industrial Fire", "Persistent Gas Flare", "Industrial/Mining Thermal Activity"])
    natural_fire_candidates = sum(1 for c in cls_results if c.probable_classification in ["Wildfire", "Crop Burning"])
    needs_review_count = sum(1 for c in cls_results if "Unknown" in c.probable_classification or "Review" in c.probable_classification)

    # 3. Persistent vs Sudden Cluster counts
    temp_feats = db.query(TemporalFeature).all()
    persistent_sources_count = sum(1 for tf in temp_feats if tf.persistence_score >= 0.5)
    sudden_events_count = sum(1 for tf in temp_feats if tf.persistence_score < 0.5)

    total_clusters = len(temp_feats)
    persistent_pct = round((persistent_sources_count / total_clusters) * 100, 1) if total_clusters > 0 else 0.0
    sudden_pct = round((sudden_events_count / total_clusters) * 100, 1) if total_clusters > 0 else 0.0

    persistent_vs_sudden = {
        "persistent_count": persistent_sources_count,
        "sudden_count": sudden_events_count,
        "persistent_pct": persistent_pct,
        "sudden_pct": sudden_pct
    }

    # 4. Time Series Aggregation (Daily)
    time_series_map: Dict[str, Dict[str, Any]] = {}
    for h in reversed(hotspots):
        d_str = h.acquisition_datetime.strftime("%d %b")
        if d_str not in time_series_map:
            time_series_map[d_str] = {"date": d_str, "count": 0, "frp_sum": 0.0, "frp_count": 0}
        time_series_map[d_str]["count"] += 1
        if h.frp and h.frp > 0:
            time_series_map[d_str]["frp_sum"] += h.frp
            time_series_map[d_str]["frp_count"] += 1

    time_series = [
        {
            "date": d,
            "detection_count": item["count"],
            "avg_frp": round(item["frp_sum"] / item["frp_count"], 1) if item["frp_count"] > 0 else 0.0
        }
        for d, item in time_series_map.items()
    ]

    # 5. Classification breakdown & Avg FRP by Category
    cls_counts: Dict[str, int] = {}
    cls_frp_sums: Dict[str, float] = {}
    cls_frp_counts: Dict[str, int] = {}

    for c in cls_results:
        cat = c.probable_classification
        cls_counts[cat] = cls_counts.get(cat, 0) + 1
        h = c.hotspot
        if h and h.frp and h.frp > 0:
            cls_frp_sums[cat] = cls_frp_sums.get(cat, 0.0) + h.frp
            cls_frp_counts[cat] = cls_frp_counts.get(cat, 0) + 1

    avg_frp_by_classification = {
        cat: round(cls_frp_sums[cat] / cls_frp_counts[cat], 1) if cls_frp_counts.get(cat, 0) > 0 else 0.0
        for cat in cls_counts.keys()
    }

    # 6. Satellite & Day/Night Breakdown
    noaa20_count = sum(1 for h in hotspots if "NOAA-20" in (h.satellite or "").upper() or "NOAA20" in (h.source_dataset or "").upper())
    noaa21_count = sum(1 for h in hotspots if "NOAA-21" in (h.satellite or "").upper() or "NOAA21" in (h.source_dataset or "").upper())
    tot_sat = max(1, noaa20_count + noaa21_count)

    satellites_breakdown = {
        "noaa20_count": noaa20_count,
        "noaa21_count": noaa21_count,
        "noaa20_pct": round((noaa20_count / tot_sat) * 100, 1) if total_detections > 0 else 0.0,
        "noaa21_pct": round((noaa21_count / tot_sat) * 100, 1) if total_detections > 0 else 0.0
    }

    day_count = sum(1 for h in hotspots if h.daynight == "D")
    night_count = sum(1 for h in hotspots if h.daynight == "N")
    tot_dn = max(1, day_count + night_count)

    daynight_breakdown = {
        "day_count": day_count,
        "night_count": night_count,
        "day_pct": round((day_count / tot_dn) * 100, 1) if total_detections > 0 else 0.0,
        "night_pct": round((night_count / tot_dn) * 100, 1) if total_detections > 0 else 0.0
    }

    # 7. Top Anomalies (Recent)
    top_anomalies = []
    top_alerts = db.query(Alert).options(joinedload(Alert.hotspot)).order_by(desc(Alert.created_at)).limit(5).all()
    for a in top_alerts:
        h = a.hotspot
        cls = db.query(ClassificationResult).filter(ClassificationResult.hotspot_id == h.hotspot_id).first() if h else None
        tf = db.query(TemporalFeature).filter(TemporalFeature.cluster_id == h.cluster_id).first() if (h and h.cluster_id) else None
        
        fac_name = cls.nearest_facility_name if cls and cls.nearest_facility_name else "Exact facility not identified"
        
        top_anomalies.append({
            "event_id": f"TT-{a.alert_id[:5].upper()}",
            "hotspot_id": h.hotspot_id if h else a.alert_id,
            "location": fac_name,
            "current_frp": f"{h.frp:.1f}" if h and h.frp else "N/A",
            "baseline": f"{tf.median_frp:.1f}" if tf and tf.median_frp else "Insufficient History",
            "deviation": f"+{tf.baseline_deviation:.0f}%" if tf and tf.baseline_deviation else "N/A",
            "classification": cls.probable_classification if cls else "Unknown",
            "priority": a.priority or "MODERATE",
            "status": a.status or "NEW",
            "detected": h.acquisition_datetime.strftime("%d %b %Y, %H:%M") if h else a.created_at.strftime("%d %b %Y, %H:%M")
        })

    # 8. Data Freshness & System Status
    last_sync_run = db.query(SyncRun).order_by(desc(SyncRun.attempted_at)).first()
    firms_configured = bool(settings.NASA_FIRMS_MAP_KEY and len(settings.NASA_FIRMS_MAP_KEY.strip()) > 5)
    firms_status = "Connected" if firms_configured else "NOT CONFIGURED"

    latest_obs_h = db.query(Hotspot).order_by(desc(Hotspot.acquisition_datetime)).first()
    noaa20_h = db.query(Hotspot).filter(Hotspot.satellite.ilike("%NOAA-20%")).order_by(desc(Hotspot.acquisition_datetime)).first()
    noaa21_h = db.query(Hotspot).filter(Hotspot.satellite.ilike("%NOAA-21%")).order_by(desc(Hotspot.acquisition_datetime)).first()

    data_freshness = {
        "firms_status": firms_status,
        "last_sync": last_sync_run.attempted_at.strftime("%d %b %Y, %H:%M IST") if last_sync_run else "Awaiting Sync",
        "latest_obs": latest_obs_h.acquisition_datetime.strftime("%d %b %Y, %H:%M IST") if latest_obs_h else "N/A",
        "noaa20_latest": noaa20_h.acquisition_datetime.strftime("%d %b %Y, %H:%M IST") if noaa20_h else "N/A",
        "noaa21_latest": noaa21_h.acquisition_datetime.strftime("%d %b %Y, %H:%M IST") if noaa21_h else "N/A",
        "total_db_records": db.query(Hotspot).count(),
        "period_label": f"Last {days} Days" if days > 0 else "All Time"
    }

    # 9. Real KPI Trend Calculations (Period-over-Period Daily Aggregation)
    max_h_dt = db.query(func.max(Hotspot.acquisition_datetime)).scalar()
    anchor_dt = max_h_dt.date() if max_h_dt else now.date()

    current_days = [anchor_dt - timedelta(days=6 - i) for i in range(7)]
    previous_days = [anchor_dt - timedelta(days=13 - i) for i in range(7)]

    start_14d = datetime.combine(anchor_dt - timedelta(days=13), datetime.min.time())
    end_14d = datetime.combine(anchor_dt, datetime.max.time())

    hotspots_14d = db.query(Hotspot).filter(
        Hotspot.acquisition_datetime >= start_14d,
        Hotspot.acquisition_datetime <= end_14d
    ).all()

    cls_14d = db.query(ClassificationResult).join(Hotspot).filter(
        Hotspot.acquisition_datetime >= start_14d,
        Hotspot.acquisition_datetime <= end_14d
    ).all()

    det_map: Dict[Any, int] = {d: 0 for d in current_days + previous_days}
    ind_map: Dict[Any, int] = {d: 0 for d in current_days + previous_days}
    nat_map: Dict[Any, int] = {d: 0 for d in current_days + previous_days}
    rev_map: Dict[Any, int] = {d: 0 for d in current_days + previous_days}

    for h in hotspots_14d:
        d = h.acquisition_datetime.date()
        if d in det_map:
            det_map[d] += 1

    for c in cls_14d:
        if not c.hotspot:
            continue
        d = c.hotspot.acquisition_datetime.date()
        if d not in ind_map:
            continue
        cat = c.probable_classification or ""
        if cat in ["Industrial Fire", "Persistent Gas Flare", "Industrial/Mining Thermal Activity"]:
            ind_map[d] += 1
        elif cat in ["Wildfire", "Crop Burning"]:
            nat_map[d] += 1
        elif "Unknown" in cat or "Review" in cat:
            rev_map[d] += 1

    distinct_dates_count = db.query(func.date(Hotspot.acquisition_datetime)).distinct().count()
    has_history = distinct_dates_count >= 2

    def build_kpi_trend(curr_map: Dict[Any, int]) -> Dict[str, Any]:
        curr_s = [curr_map[d] for d in current_days]
        prev_s = [curr_map[d] for d in previous_days]
        curr_tot = sum(curr_s)
        prev_tot = sum(prev_s)

        if not has_history:
            return {
                "status": "—",
                "trend_text": "—",
                "trend_color": "text-slate-400",
                "trend_pct": None,
                "trend_percent": None,
                "trend_direction": "insufficient",
                "current_period": curr_tot,
                "previous_period": prev_tot,
                "series": curr_s
            }
        if prev_tot == 0 and curr_tot > 0:
            return {
                "status": "↑ New",
                "trend_text": "↑ New",
                "trend_color": "text-emerald-400",
                "trend_pct": None,
                "trend_percent": None,
                "trend_direction": "new",
                "current_period": curr_tot,
                "previous_period": prev_tot,
                "series": curr_s
            }
        if prev_tot == 0 and curr_tot == 0:
            return {
                "status": "→ 0%",
                "trend_text": "→ 0%",
                "trend_color": "text-slate-400",
                "trend_pct": 0.0,
                "trend_percent": 0.0,
                "trend_direction": "flat",
                "current_period": curr_tot,
                "previous_period": prev_tot,
                "series": curr_s
            }

        diff = curr_tot - prev_tot
        pct = round((diff / prev_tot) * 100, 1)
        pct_val = int(pct) if pct.is_integer() else pct

        if diff > 0:
            return {
                "status": f"↑ {pct_val}%",
                "trend_text": f"↑ {pct_val}%",
                "trend_color": "text-emerald-400",
                "trend_pct": pct,
                "trend_percent": pct,
                "trend_direction": "up",
                "current_period": curr_tot,
                "previous_period": prev_tot,
                "series": curr_s
            }
        elif diff < 0:
            return {
                "status": f"↓ {abs(pct_val)}%",
                "trend_text": f"↓ {abs(pct_val)}%",
                "trend_color": "text-rose-400",
                "trend_pct": pct,
                "trend_percent": pct,
                "trend_direction": "down",
                "current_period": curr_tot,
                "previous_period": prev_tot,
                "series": curr_s
            }
        else:
            return {
                "status": "→ 0%",
                "trend_text": "→ 0%",
                "trend_color": "text-slate-400",
                "trend_pct": 0.0,
                "trend_percent": 0.0,
                "trend_direction": "flat",
                "current_period": curr_tot,
                "previous_period": prev_tot,
                "series": curr_s
            }

    kpi_trends = {
        "thermal_detections": build_kpi_trend(det_map),
        "industrial_candidates": build_kpi_trend(ind_map),
        "natural_fire_candidates": build_kpi_trend(nat_map),
        "needs_review": build_kpi_trend(rev_map)
    }

    return AnalyticsOverview(
        total_detections=total_detections,
        active_anomalies_count=active_anomalies_count,
        avg_frp=avg_frp,
        high_critical_count=high_critical_count,
        persistent_sources_count=persistent_sources_count,
        sudden_events_count=sudden_events_count,
        needs_review_count=needs_review_count,
        industrial_candidates=industrial_candidates,
        natural_fire_candidates=natural_fire_candidates,
        last_sync_timestamp=last_sync_run.attempted_at if last_sync_run else None,
        time_series=time_series,
        kpi_trends=kpi_trends,
        classification_breakdown=cls_counts,
        avg_frp_by_classification=avg_frp_by_classification,
        persistent_vs_sudden=persistent_vs_sudden,
        satellites_breakdown=satellites_breakdown,
        daynight_breakdown=daynight_breakdown,
        top_anomalies=top_anomalies,
        data_freshness=data_freshness
    )
