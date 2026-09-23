import csv
import io
import logging
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("thermaltrace.firms")

class FIRMSClient:
    def __init__(self, map_key: Optional[str] = None):
        self.map_key = map_key or settings.NASA_FIRMS_MAP_KEY
        self.base_url = settings.NASA_FIRMS_BASE_URL.rstrip("/")

    def is_configured(self) -> bool:
        return bool(self.map_key and len(self.map_key.strip()) > 5)

    async def fetch_country_hotspots(
        self,
        country: str = "IND",
        dataset: str = "VIIRS_NOAA20_NRT",
        days: int = 1
    ) -> List[Dict[str, Any]]:
        if not self.is_configured():
            logger.warning("NASA FIRMS MAP_KEY is missing or unconfigured.")
            raise ValueError("NASA FIRMS MAP_KEY is missing or invalid. Set NASA_FIRMS_MAP_KEY in .env.")

        # Default bounding box for India region (68.0, 6.5, 97.5, 35.5)
        bbox = "68.0,6.5,97.5,35.5"
        return await self.fetch_area_hotspots(bbox=bbox, dataset=dataset, days=days)

    async def fetch_area_hotspots(
        self,
        bbox: str = "68.0,6.5,97.5,35.5",
        dataset: str = "VIIRS_NOAA20_NRT",
        days: int = 1
    ) -> List[Dict[str, Any]]:
        if not self.is_configured():
            raise ValueError("NASA FIRMS MAP_KEY is missing or invalid.")

        url = f"{self.base_url}/area/csv/{self.map_key}/{dataset}/{bbox}/{days}"
        logger.info(f"Querying NASA FIRMS Area API: dataset={dataset}, bbox={bbox}, days={days}")

        async with httpx.AsyncClient(timeout=35.0) as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                safe_text = exc.response.text.replace(self.map_key, "[REDACTED_KEY]") if self.map_key else exc.response.text
                logger.error(f"NASA FIRMS API returned HTTP error {exc.response.status_code}: {safe_text}")
                raise RuntimeError(f"NASA FIRMS API HTTP error {exc.response.status_code}")
            except Exception as exc:
                safe_err = str(exc).replace(self.map_key, "[REDACTED_KEY]") if self.map_key else str(exc)
                logger.error(f"NASA FIRMS API request failed: {safe_err}")
                raise RuntimeError(f"NASA FIRMS API request failed: {safe_err}")

        content = response.text
        if "Invalid MAP_KEY" in content or "MAP_KEY is required" in content:
            logger.error("NASA FIRMS API reported Invalid MAP_KEY.")
            raise ValueError("NASA FIRMS API key is invalid.")

        return self._parse_firms_csv(content, dataset)

    def _parse_firms_csv(self, csv_content: str, dataset: str) -> List[Dict[str, Any]]:
        records = []
        if not csv_content or not csv_content.strip():
            return records

        csv_reader = csv.DictReader(io.StringIO(csv_content))
        for row in csv_reader:
            try:
                lat = float(row["latitude"])
                lon = float(row["longitude"])
                
                acq_date_str = row.get("acq_date", "").strip()
                acq_time_str = row.get("acq_time", "0000").strip().zfill(4)
                
                try:
                    acq_datetime = datetime.strptime(f"{acq_date_str} {acq_time_str}", "%Y-%m-%d %H%M")
                except ValueError:
                    acq_datetime = datetime.now(timezone.utc).replace(tzinfo=None)

                bright_ti4 = float(row["bright_ti4"]) if row.get("bright_ti4") else None
                bright_ti5 = float(row["bright_ti5"]) if row.get("bright_ti5") else None
                frp = float(row["frp"]) if row.get("frp") else None
                scan = float(row["scan"]) if row.get("scan") else None
                track = float(row["track"]) if row.get("track") else None

                satellite = row.get("satellite", "Unknown").strip()
                instrument = row.get("instrument", "VIIRS").strip()
                confidence = row.get("confidence", "n").strip()
                daynight = row.get("daynight", "D").strip()

                record = {
                    "source": "NASA FIRMS",
                    "source_dataset": dataset,
                    "latitude": lat,
                    "longitude": lon,
                    "acquisition_datetime": acq_datetime,
                    "satellite": satellite,
                    "instrument": instrument,
                    "brightness_ti4": bright_ti4,
                    "brightness_ti5": bright_ti5,
                    "frp": frp,
                    "confidence": confidence,
                    "daynight": daynight,
                    "scan": scan,
                    "track": track,
                    "raw_source_record": dict(row)
                }
                records.append(record)
            except (KeyError, ValueError) as err:
                logger.debug(f"Skipping unparseable FIRMS CSV row: {err}")
                continue

        logger.info(f"Parsed {len(records)} valid FIRMS observation records from {dataset}.")
        return records
