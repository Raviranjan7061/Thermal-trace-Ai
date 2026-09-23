import pytest
from app.geospatial.distance import haversine_distance_km

def test_haversine_distance_zero():
    dist = haversine_distance_km(22.3553, 69.8322, 22.3553, 69.8322)
    assert dist == 0.0

def test_haversine_distance_known_points():
    # Jamnagar Refinery to Mundra (approx 59.5 km across Gulf of Kutch)
    dist = haversine_distance_km(22.3553, 69.8322, 22.8222, 69.5494)
    assert 50.0 < dist < 70.0
