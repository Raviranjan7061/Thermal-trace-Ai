import uuid
import logging
from typing import Optional, List
from sqlalchemy.orm import Session
from app.database.models import Hotspot
from app.geospatial.distance import haversine_distance_km

logger = logging.getLogger("thermaltrace.clustering")

CLUSTER_RADIUS_KM = 1.5 # 1.5 km spatial clustering threshold

def assign_hotspot_cluster(db: Session, hotspot: Hotspot) -> str:
    """
    Assigns a hotspot to an existing spatial cluster if within CLUSTER_RADIUS_KM (1.5 km),
    or generates a new unique cluster_id.
    """
    if hotspot.cluster_id:
        return hotspot.cluster_id

    # Find nearby hotspots that already have a cluster_id
    clustered_hotspots = (
        db.query(Hotspot)
        .filter(Hotspot.cluster_id.isnot(None), Hotspot.hotspot_id != hotspot.hotspot_id)
        .all()
    )

    nearest_cluster_id: Optional[str] = None
    min_dist = float("inf")

    for existing in clustered_hotspots:
        dist = haversine_distance_km(hotspot.latitude, hotspot.longitude, existing.latitude, existing.longitude)
        if dist <= CLUSTER_RADIUS_KM and dist < min_dist:
            min_dist = dist
            nearest_cluster_id = existing.cluster_id

    if nearest_cluster_id:
        hotspot.cluster_id = nearest_cluster_id
    else:
        new_cluster_id = f"cluster-{uuid.uuid4().hex[:12]}"
        hotspot.cluster_id = new_cluster_id

    db.commit()
    return hotspot.cluster_id

def run_spatial_clustering_job(db: Session) -> int:
    """
    Scans all unclustered hotspots in the database and assigns cluster IDs.
    Returns total number of hotspots clustered.
    """
    unclustered = db.query(Hotspot).filter(Hotspot.cluster_id.is_(None)).all()
    clustered_count = 0

    for h in unclustered:
        assign_hotspot_cluster(db, h)
        clustered_count += 1

    logger.info(f"Spatial clustering job completed: {clustered_count} hotspots processed.")
    return clustered_count
