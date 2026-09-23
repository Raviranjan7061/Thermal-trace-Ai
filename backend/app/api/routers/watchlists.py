from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.session import get_db
from app.api.deps import require_role
from app.database.models import Watchlist, AuditLog, User
from app.schemas.schemas import WatchlistCreate, WatchlistResponse

router = APIRouter(prefix="/api/watchlists", tags=["Watchlists & Areas of Interest"])

@router.get("", response_model=List[WatchlistResponse])
def list_watchlists(db: Session = Depends(get_db)):
    return db.query(Watchlist).order_by(desc(Watchlist.created_at)).all()

@router.post("", response_model=WatchlistResponse, status_code=201)
def create_watchlist(
    payload: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("analyst", "admin"))
):
    watchlist = Watchlist(
        name=payload.name,
        interest_type=payload.interest_type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_km=payload.radius_km,
        min_lat=payload.min_lat,
        max_lat=payload.max_lat,
        min_lon=payload.min_lon,
        max_lon=payload.max_lon,
        facility_id=payload.facility_id,
        created_by=current_user.email,
        is_active=True
    )
    db.add(watchlist)
    db.flush()

    # Audit log
    audit = AuditLog(
        action="watchlist_created",
        actor_email=current_user.email,
        entity_type="watchlist",
        entity_id=watchlist.watchlist_id,
        previous_state=None,
        new_state="ACTIVE",
        details={"name": watchlist.name, "interest_type": watchlist.interest_type}
    )
    db.add(audit)
    db.commit()
    db.refresh(watchlist)
    return watchlist

@router.delete("/{watchlist_id}", status_code=204)
def delete_watchlist(
    watchlist_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("analyst", "admin"))
):
    w = db.query(Watchlist).filter(Watchlist.watchlist_id == watchlist_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Watchlist not found.")
    
    db.delete(w)
    db.commit()
    return None
