import math
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.database.models import IndustrialFacility, Hotspot

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates exact geodesic distance between two latitude/longitude points on Earth in kilometers
    using the Haversine formula (WGS-84 spherical approximation).
    """
    R = 6371.0088 # Earth radius in km
    
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def find_nearest_industrial_facility(
    db: Session,
    lat: float,
    lon: float
) -> Tuple[Optional[IndustrialFacility], Optional[float], Dict[str, int]]:
    """
    Finds the nearest industrial facility from the database for given coordinates.
    Returns (nearest_facility_obj, distance_km, counts_dict)
    where counts_dict contains 'within_1km', 'within_5km', 'within_10km'.
    """
    facilities = db.query(IndustrialFacility).all()
    if not facilities:
        return None, None, {"within_1km": 0, "within_5km": 0, "within_10km": 0}

    nearest_facility = None
    min_dist_km = float("inf")
    within_1km = 0
    within_5km = 0
    within_10km = 0

    for fac in facilities:
        dist_km = haversine_distance_km(lat, lon, fac.latitude, fac.longitude)
        
        if dist_km < min_dist_km:
            min_dist_km = dist_km
            nearest_facility = fac
            
        if dist_km <= 1.0:
            within_1km += 1
        if dist_km <= 5.0:
            within_5km += 1
        if dist_km <= 10.0:
            within_10km += 1

    counts = {
        "within_1km": within_1km,
        "within_5km": within_5km,
        "within_10km": within_10km
    }

    return nearest_facility, round(min_dist_km, 3) if min_dist_km != float("inf") else None, counts
