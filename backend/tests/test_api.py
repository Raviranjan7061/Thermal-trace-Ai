import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Online"
    assert "ThermalTrace AI" in data["title"]

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["sih_id"] == "SIH26162"

def test_system_health_endpoint():
    response = client.get("/api/system/health")
    assert response.status_code == 200
    data = response.json()
    assert "database" in data
    assert "firms_integration" in data

def test_data_sources_endpoint():
    response = client.get("/api/data-sources/status")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3

def test_industrial_sites_endpoint():
    response = client.get("/api/industrial-sites")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_model_info_endpoint():
    response = client.get("/api/model/info")
    assert response.status_code == 200
    data = response.json()
    assert "mode" in data

def test_analytics_overview_endpoint():
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_detections" in data
    assert "industrial_candidates" in data
