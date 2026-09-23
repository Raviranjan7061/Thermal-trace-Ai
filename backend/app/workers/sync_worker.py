import json
import os
import logging
import asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.session import SessionLocal
from app.database.models import IndustrialFacility, SyncRun, Hotspot
from app.ingestion.firms_client import FIRMSClient
from app.ingestion.deduplication import process_and_deduplicate_hotspots
from app.ml.classifier import run_classification_pipeline

logger = logging.getLogger("thermaltrace.worker")

def seed_industrial_facilities_if_empty(db: Session):
    count = db.query(IndustrialFacility).count()
    if count > 0:
        logger.info(f"Industrial facilities table already contains {count} facilities.")
        return

    json_path = os.path.join(os.path.dirname(__file__), "..", "data", "indian_industrial_facilities.json")
    if not os.path.exists(json_path):
        logger.warning(f"Industrial facilities JSON file not found at {json_path}")
        return

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            facilities_data = json.load(f)

        fac_objects = []
        for d in facilities_data:
            fac = IndustrialFacility(
                name=d["name"],
                facility_type=d["facility_type"],
                latitude=d["latitude"],
                longitude=d["longitude"],
                state=d.get("state"),
                district=d.get("district"),
                operator_owner=d.get("operator_owner"),
                source_dataset=d.get("source_dataset", "OpenStreetMap & Global Energy Infrastructure Registry")
            )
            fac_objects.append(fac)

        db.bulk_save_objects(fac_objects)
        db.commit()
        logger.info(f"Successfully seeded {len(fac_objects)} real Indian industrial facilities into database.")
    except Exception as err:
        db.rollback()
        logger.error(f"Failed to seed industrial facilities: {str(err)}")

async def run_firms_synchronization(trigger_source: str = "Scheduled") -> dict:
    db = SessionLocal()
    client = FIRMSClient()

    if not client.is_configured():
        logger.warning("Synchronization skipped: NASA FIRMS MAP_KEY is not set.")
        db.close()
        return {
            "status": "Skipped",
            "message": "NASA_FIRMS_MAP_KEY is missing or invalid in environment settings.",
            "inserted": 0,
            "skipped": 0
        }

    total_inserted = 0
    total_skipped = 0
    datasets = settings.DEFAULT_DATASETS

    try:
        for dataset in datasets:
            try:
                records = await client.fetch_country_hotspots(
                    country=settings.DEFAULT_COUNTRY_CODE,
                    dataset=dataset,
                    days=1
                )
                
                inserted, skipped, sync_run = process_and_deduplicate_hotspots(
                    db, records, dataset_name=dataset, trigger_source=trigger_source
                )
                
                total_inserted += inserted
                total_skipped += skipped

                if inserted > 0:
                    unclassified = (
                        db.query(Hotspot)
                        .filter(Hotspot.source_dataset == dataset)
                        .order_by(Hotspot.created_at.desc())
                        .limit(inserted)
                        .all()
                    )
                    for h in unclassified:
                        try:
                            run_classification_pipeline(db, h)
                        except Exception as c_err:
                            logger.error(f"Classification pipeline error for hotspot {h.hotspot_id}: {c_err}")

            except Exception as d_err:
                logger.error(f"Error syncing FIRMS dataset {dataset}: {d_err}")

        return {
            "status": "Completed",
            "inserted": total_inserted,
            "skipped": total_skipped,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    finally:
        db.close()
