from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.workers.sync_worker import run_firms_synchronization
from app.ingestion.firms_client import FIRMSClient
from app.api.deps import require_role
from app.database.models import User

router = APIRouter(prefix="/api/sync", tags=["Synchronization"])

@router.post("/firms")
async def trigger_firms_sync(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("analyst", "admin"))
):
    client = FIRMSClient()
    if not client.is_configured():
        raise HTTPException(
            status_code=400,
            detail="NASA FIRMS MAP_KEY is not configured in backend environment variables. Please add NASA_FIRMS_MAP_KEY to .env."
        )

    # Run sync inline or as background task
    res = await run_firms_synchronization(trigger_source="Manual API Trigger")
    return {
        "message": "NASA FIRMS synchronization triggered successfully.",
        "result": res
    }
