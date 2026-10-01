from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import logging

from app.database.session import get_db
from app.database.models import User, FeedbackItem, AuditLog
from app.schemas.schemas import (
    FeedbackCreate,
    FeedbackStatusUpdate,
    FeedbackResponse,
    FeedbackSummaryResponse,
)
from app.api.deps import get_current_user, require_role

logger = logging.getLogger("thermaltrace.feedback")

router = APIRouter(prefix="/api/feedback", tags=["Feedback & Issue Reporting"])

ALLOWED_PRIORITIES = {"Low", "Medium", "High"}
ALLOWED_STATUSES = {"NEW", "IN_REVIEW", "RESOLVED"}

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.title or not payload.title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title cannot be empty.",
        )
    if not payload.description or not payload.description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description cannot be empty.",
        )
    if not payload.category or not payload.category.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category cannot be empty.",
        )

    # Priority default & check (submitters restricted to Low, Medium, High)
    priority = payload.priority.strip() if payload.priority else "Medium"
    if priority not in ALLOWED_PRIORITIES:
        priority = "Medium"

    feedback_item = FeedbackItem(
        user_id=current_user.id,
        submitter_email=current_user.email,
        submitter_role=current_user.role,
        category=payload.category.strip(),
        title=payload.title.strip(),
        description=payload.description.strip(),
        priority=priority,
        screenshot_data=payload.screenshot_data,
        status="NEW",
    )

    db.add(feedback_item)
    db.flush()
    
    audit_entry = AuditLog(
        action="feedback_submitted",
        actor_email=current_user.email,
        entity_type="feedback",
        entity_id=feedback_item.id,
        details={
            "category": feedback_item.category,
            "title": feedback_item.title,
            "priority": feedback_item.priority,
            "role": current_user.role,
        }
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(feedback_item)

    return feedback_item


@router.get("/my", response_model=List[FeedbackResponse])
def get_my_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(FeedbackItem)
        .filter(FeedbackItem.submitter_email == current_user.email)
        .order_by(desc(FeedbackItem.created_at))
        .all()
    )
    return items


@router.get("/summary", response_model=FeedbackSummaryResponse)
def get_admin_feedback_summary(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("admin")),
):
    items = db.query(FeedbackItem).all()
    total = len(items)
    new_count = sum(1 for i in items if i.status == "NEW")
    in_review_count = sum(1 for i in items if i.status == "IN_REVIEW")
    resolved_count = sum(1 for i in items if i.status == "RESOLVED")

    return FeedbackSummaryResponse(
        total=total,
        new_count=new_count,
        in_review_count=in_review_count,
        resolved_count=resolved_count,
        items=items,
    )


@router.get("", response_model=List[FeedbackResponse])
def get_admin_feedback_inbox(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("admin")),
):
    items = db.query(FeedbackItem).order_by(desc(FeedbackItem.created_at)).all()
    return items


@router.patch("/{feedback_id}/status", response_model=FeedbackResponse)
def update_feedback_status(
    feedback_id: str,
    payload: FeedbackStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("admin")),
):
    new_status = payload.status.upper().strip() if payload.status else ""
    if new_status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.status}'. Must be one of {sorted(list(ALLOWED_STATUSES))}.",
        )

    item = db.query(FeedbackItem).filter(FeedbackItem.id == feedback_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feedback record '{feedback_id}' not found.",
        )

    old_status = item.status
    item.status = new_status
    if payload.admin_notes is not None:
        item.admin_notes = payload.admin_notes

    audit_entry = AuditLog(
        action="feedback_status_updated",
        actor_email=admin_user.email,
        entity_type="feedback",
        entity_id=item.id,
        previous_state=old_status,
        new_state=new_status,
        details={
            "admin_notes": payload.admin_notes,
            "admin_email": admin_user.email,
        }
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(item)

    return item
