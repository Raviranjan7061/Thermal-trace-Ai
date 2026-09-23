import hashlib
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.database.models import Hotspot, SyncRun

logger = logging.getLogger("thermaltrace.deduplication")

def generate_observation_hash(record: Dict[str, Any]) -> str:
    lat = round(float(record["latitude"]), 4)
    lon = round(float(record["longitude"]), 4)
    acq_dt = record["acquisition_datetime"].isoformat() if hasattr(record["acquisition_datetime"], "isoformat") else str(record["acquisition_datetime"])
    sat = str(record.get("satellite", "")).upper().strip()
    inst = str(record.get("instrument", "")).upper().strip()
    ds = str(record.get("source_dataset", "")).strip()

    fingerprint = f"{lat}:{lon}:{acq_dt}:{sat}:{inst}:{ds}"
    return hashlib.sha256(fingerprint.encode("utf-8")).hexdigest()

def process_and_deduplicate_hotspots(
    db: Session,
    records: list[Dict[str, Any]],
    dataset_name: str,
    trigger_source: str = "Scheduled"
) -> Tuple[int, int, SyncRun]:
    inserted_count = 0
    skipped_count = 0

    sync_run = SyncRun(
        status="In Progress",
        dataset=dataset_name,
        observations_received=len(records),
        sync_trigger=trigger_source
    )
    db.add(sync_run)
    db.flush()

    try:
        existing_hashes = set(
            h[0] for h in db.query(Hotspot.deduplication_hash).all()
        )

        new_hotspots = []
        for rec in records:
            obs_hash = generate_observation_hash(rec)
            if obs_hash in existing_hashes:
                skipped_count += 1
                continue

            existing_hashes.add(obs_hash)
            hotspot = Hotspot(
                deduplication_hash=obs_hash,
                source=rec.get("source", "NASA FIRMS"),
                source_dataset=rec.get("source_dataset", dataset_name),
                latitude=rec["latitude"],
                longitude=rec["longitude"],
                acquisition_datetime=rec["acquisition_datetime"],
                satellite=rec.get("satellite", "Unknown"),
                instrument=rec.get("instrument", "VIIRS"),
                brightness_ti4=rec.get("brightness_ti4"),
                brightness_ti5=rec.get("brightness_ti5"),
                frp=rec.get("frp"),
                confidence=rec.get("confidence"),
                daynight=rec.get("daynight"),
                scan=rec.get("scan"),
                track=rec.get("track"),
                raw_source_record=rec.get("raw_source_record")
            )
            new_hotspots.append(hotspot)
            inserted_count += 1

        if new_hotspots:
            db.bulk_save_objects(new_hotspots)
            db.commit()

        sync_run.status = "Success"
        sync_run.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        sync_run.observations_inserted = inserted_count
        sync_run.duplicates_skipped = skipped_count
        db.commit()

        logger.info(f"Sync complete for {dataset_name}: {inserted_count} inserted, {skipped_count} skipped duplicates.")
        return inserted_count, skipped_count, sync_run

    except Exception as exc:
        db.rollback()
        sync_run.status = "Failed"
        sync_run.error_message = str(exc)
        db.add(sync_run)
        db.commit()
        logger.error(f"Sync failed for {dataset_name}: {str(exc)}")
        raise exc
