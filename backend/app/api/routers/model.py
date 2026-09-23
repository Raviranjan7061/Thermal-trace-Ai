from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import ModelVersion

router = APIRouter(prefix="/api/model", tags=["AI/ML Model Intelligence"])

@router.get("/info")
def get_model_info(db: Session = Depends(get_db)):
    active_model = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()

    if not active_model:
        return {
            "mode": "Evidence-based preliminary classification",
            "active_model_trained": False,
            "status_message": "Validated trained machine learning model artifact not currently active. System operating in Evidence/Heuristic Mode.",
            "pipeline_description": "Combines NASA satellite thermal metrics, geodesic distance to verified Indian industrial infrastructure, Copernicus land-cover context, and 90-day cluster FRP baseline deviation Z-scores with transparent supporting and contradictory evidence rules.",
            "metrics": None
        }

    return {
        "mode": f"Trained {active_model.model_name}",
        "active_model_trained": True,
        "model_name": active_model.model_name,
        "version_tag": active_model.version_tag,
        "trained_at": active_model.trained_at.isoformat() if active_model.trained_at else None,
        "metrics": active_model.metrics_json,
        "features": active_model.feature_list,
        "dataset_info": active_model.dataset_info
    }
