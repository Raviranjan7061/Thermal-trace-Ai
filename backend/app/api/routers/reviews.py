from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.session import get_db
from app.api.deps import require_role
from app.database.models import AnalystReview, Hotspot, ClassificationResult, User
from app.schemas.schemas import AnalystReviewCreate, AnalystReviewResponse

router = APIRouter(prefix="/api/reviews", tags=["Analyst Review Workflow"])

@router.post("", response_model=AnalystReviewResponse)
def submit_analyst_review(
    review_in: AnalystReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("analyst", "admin"))
):
    hotspot = db.query(Hotspot).filter(Hotspot.hotspot_id == review_in.hotspot_id).first()
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found.")

    original_cls = "Unknown"
    if hotspot.classification:
        original_cls = hotspot.classification.probable_classification

    review = AnalystReview(
        hotspot_id=review_in.hotspot_id,
        original_classification=original_cls,
        analyst_classification=review_in.analyst_classification,
        analyst_notes=review_in.analyst_notes,
        analyst_status=review_in.analyst_status,
        reviewer_email="analyst@thermaltrace.ai"
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

@router.get("", response_model=List[AnalystReviewResponse])
def list_analyst_reviews(db: Session = Depends(get_db)):
    return db.query(AnalystReview).order_by(desc(AnalystReview.created_at)).all()
