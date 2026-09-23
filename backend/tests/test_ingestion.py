import pytest
from datetime import datetime
from app.ingestion.firms_client import FIRMSClient
from app.ingestion.deduplication import generate_observation_hash

def test_firms_csv_parser():
    client = FIRMSClient(map_key="TEST_KEY")
    raw_csv = """latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
22.3553,69.8322,345.2,1.1,1.0,2026-09-20,1230,N20,VIIRS,h,1.0,295.4,45.2,D
"""
    records = client._parse_firms_csv(raw_csv, "VIIRS_NOAA20_NRT")
    assert len(records) == 1
    r = records[0]
    assert r["latitude"] == 22.3553
    assert r["longitude"] == 69.8322
    assert r["frp"] == 45.2
    assert r["satellite"] == "N20"

def test_deduplication_hash_consistency():
    rec1 = {
        "latitude": 22.3553,
        "longitude": 69.8322,
        "acquisition_datetime": datetime(2026, 9, 20, 12, 30),
        "satellite": "N20",
        "instrument": "VIIRS",
        "source_dataset": "VIIRS_NOAA20_NRT"
    }
    rec2 = {
        "latitude": 22.355301, # Slight floating point difference within 4 decimals
        "longitude": 69.832202,
        "acquisition_datetime": datetime(2026, 9, 20, 12, 30),
        "satellite": "N20",
        "instrument": "VIIRS",
        "source_dataset": "VIIRS_NOAA20_NRT"
    }
    hash1 = generate_observation_hash(rec1)
    hash2 = generate_observation_hash(rec2)
    assert hash1 == hash2
