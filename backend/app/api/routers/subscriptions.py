import secrets
import base64
import re
from datetime import datetime
from typing import Optional, List
from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import User, Subscription, SubscriptionMessage, utc_now
from app.schemas.schemas import (
    SubscriptionRequestPayload,
    SubscriptionResponse,
    SubscriptionRejectPayload,
    SubscriptionStatusResponse,
    SubscriptionMessageCreatePayload,
    SubscriptionMessageResponse,
    PaymentSubmissionPayload,
    SubscriptionResubmitPayload
)
from app.api.deps import get_current_user, require_role

router = APIRouter(tags=["Subscriptions"])

AUTHORITATIVE_PLANS = {
    "monthly": {
        "name": "Monthly",
        "price_inr": 400,
        "duration_months": 1
    },
    "six_months": {
        "name": "6 Months",
        "price_inr": 2400,
        "duration_months": 6
    },
    "yearly": {
        "name": "Yearly",
        "price_inr": 4800,
        "duration_months": 12
    }
}

def generate_subscription_code(db: Session) -> str:
    """Generates a unique, collision-safe subscription code e.g. TT-SUB-20261001-A9F2C81D"""
    today_str = utc_now().strftime("%Y%m%d")
    for _ in range(10):
        token = secrets.token_hex(4).upper()
        code = f"TT-SUB-{today_str}-{token}"
        existing = db.query(Subscription).filter(Subscription.subscription_code == code).first()
        if not existing:
            return code
    # Fallback to longer token if collisions occur
    return f"TT-SUB-{today_str}-{secrets.token_hex(8).upper()}"


@router.post("/api/subscriptions/request", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def request_subscription(
    payload: SubscriptionRequestPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_role = (current_user.role or "").lower()
    if user_role != "user":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription requests are applicable only for Standard Users."
        )

    plan_key = (payload.plan_id or "").strip().lower()
    if plan_key not in AUTHORITATIVE_PLANS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid subscription plan '{payload.plan_id}'. Allowed plans: {', '.join(AUTHORITATIVE_PLANS.keys())}."
        )

    plan = AUTHORITATIVE_PLANS[plan_key]
    now = utc_now()

    # Check for existing PENDING or in-progress request
    pending = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status.in_(["PENDING", "PAYMENT_DISCUSSION", "PAYMENT_VERIFICATION_PENDING", "PAYMENT_ACTION_REQUIRED"])
        )
        .first()
    )
    if pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active Premium Access request in progress."
        )

    # Check for existing ACTIVE subscription
    active = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "ACTIVE",
            Subscription.subscription_expiry > now
        )
        .first()
    )
    if active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active Premium subscription."
        )

    sub_code = generate_subscription_code(db)
    sub = Subscription(
        user_id=current_user.id,
        user_email=current_user.email,
        plan_id=plan_key,
        plan_name=plan["name"],
        price_inr=plan["price_inr"],
        status="PENDING",
        subscription_code=sub_code,
        requested_at=now
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.put("/api/subscriptions/change-plan", response_model=SubscriptionResponse)
def change_subscription_plan(
    payload: SubscriptionRequestPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_role = (current_user.role or "").lower()
    if user_role != "user":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription plan change is applicable only for Standard Users."
        )

    plan_key = (payload.plan_id or "").strip().lower()
    if plan_key not in AUTHORITATIVE_PLANS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid subscription plan '{payload.plan_id}'. Allowed plans: {', '.join(AUTHORITATIVE_PLANS.keys())}."
        )

    pending = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "PENDING"
        )
        .first()
    )

    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending subscription request found eligible for plan change. Plan change is allowed only while in initial PENDING status."
        )

    if pending.plan_id == plan_key:
        return pending

    plan = AUTHORITATIVE_PLANS[plan_key]
    pending.plan_id = plan_key
    pending.plan_name = plan["name"]
    pending.price_inr = plan["price_inr"]
    pending.updated_at = utc_now()

    db.commit()
    db.refresh(pending)
    return pending


@router.get("/api/subscriptions/my-status", response_model=SubscriptionStatusResponse)
def get_my_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = utc_now()
    user_role = (current_user.role or "").lower()

    if user_role != "user":
        return SubscriptionStatusResponse(
            is_premium_active=True,
            status="ACTIVE",
            active_subscription=None,
            latest_subscription=None
        )

    active_subs = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "ACTIVE"
        )
        .all()
    )
    for sub in active_subs:
        if sub.subscription_expiry and sub.subscription_expiry <= now:
            sub.status = "EXPIRED"
            db.commit()

    active_sub = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "ACTIVE",
            Subscription.subscription_expiry > now
        )
        .first()
    )

    latest_sub = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .order_by(Subscription.created_at.desc())
        .first()
    )

    is_active = active_sub is not None
    effective_status = "ACTIVE" if is_active else (latest_sub.status if latest_sub else "NONE")

    return SubscriptionStatusResponse(
        is_premium_active=is_active,
        status=effective_status,
        active_subscription=active_sub,
        latest_subscription=latest_sub
    )


# -----------------------------------------------------------------------------
# PRIVATE PAYMENT CONVERSATION & MANUAL PAYMENT VERIFICATION ENDPOINTS
# -----------------------------------------------------------------------------

@router.post("/api/subscriptions/{subscription_id}/start-conversation", response_model=SubscriptionResponse)
def start_payment_conversation(
    subscription_id: str,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription request not found.")

    if sub.status == "PENDING":
        sub.status = "PAYMENT_DISCUSSION"
        sub.updated_at = utc_now()

        # Add initial system message
        sys_msg = SubscriptionMessage(
            subscription_id=sub.id,
            sender_id=None,
            sender_email=None,
            sender_role="system",
            message_text="Payment conversation started by System Administrator."
        )
        # Add initial admin message
        admin_msg = SubscriptionMessage(
            subscription_id=sub.id,
            sender_id=current_user.id,
            sender_email=current_user.email,
            sender_role="admin",
            message_text=f"Your Premium request for {sub.plan_name} (₹{sub.price_inr:,}) has been received. We can continue with the payment process here."
        )
        db.add_all([sys_msg, admin_msg])
        db.commit()
        db.refresh(sub)

    return sub


@router.get("/api/subscriptions/{subscription_id}/messages", response_model=List[SubscriptionMessageResponse])
def get_subscription_messages(
    subscription_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription request not found.")

    user_role = (current_user.role or "").lower()
    if user_role != "admin" and sub.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view this payment conversation.")

    return (
        db.query(SubscriptionMessage)
        .filter(SubscriptionMessage.subscription_id == subscription_id)
        .order_by(SubscriptionMessage.created_at.asc())
        .all()
    )


@router.post("/api/subscriptions/{subscription_id}/messages", response_model=SubscriptionMessageResponse)
def post_subscription_message(
    subscription_id: str,
    payload: SubscriptionMessageCreatePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription request not found.")

    user_role = (current_user.role or "").lower()
    if user_role != "admin" and sub.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to participate in this payment conversation.")

    text_clean = (payload.message_text or "").strip()
    if not text_clean:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message text cannot be empty.")

    msg = SubscriptionMessage(
        subscription_id=sub.id,
        sender_id=current_user.id,
        sender_email=current_user.email,
        sender_role="admin" if user_role == "admin" else "user",
        message_text=text_clean
    )
    db.add(msg)
    sub.updated_at = utc_now()
    db.commit()
    db.refresh(msg)
    return msg


@router.post("/api/subscriptions/{subscription_id}/submit-payment", response_model=SubscriptionResponse)
def submit_payment_info(
    subscription_id: str,
    payload: PaymentSubmissionPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription request not found.")

    if sub.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to submit payment for this subscription.")

    if sub.status not in ["PAYMENT_DISCUSSION", "PAYMENT_ACTION_REQUIRED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment submission is not allowed in current status '{sub.status}'."
        )

    # Validate UTR / Transaction Reference
    utr_clean = (payload.utr_reference or "").strip()
    if len(utr_clean) < 6 or len(utr_clean) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction Reference / UTR must be between 6 and 50 characters."
        )

    if not re.match(r"^[A-Za-z0-9\-/#]+$", utr_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction Reference / UTR contains invalid characters."
        )

    # Validate Payment Proof Image (if provided)
    proof_data = payload.payment_proof_screenshot
    if proof_data:
        proof_clean = proof_data.strip()
        if not re.match(r"^data:image/(jpeg|jpg|png|webp);base64,", proof_clean, re.IGNORECASE):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment proof must be a valid JPEG, PNG, or WebP Data URL image."
            )
        try:
            header, b64_str = proof_clean.split(",", 1)
            decoded_bytes = base64.b64decode(b64_str)
            if len(decoded_bytes) > 5 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Payment proof screenshot image size exceeds 5 MB binary limit."
                )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid base64 encoding in payment proof image payload."
            )

    now = utc_now()
    sub.status = "PAYMENT_VERIFICATION_PENDING"
    sub.utr_reference = utr_clean
    sub.utr_submitted_at = now
    sub.payment_proof_screenshot = proof_data
    sub.resubmit_reason = None
    sub.updated_at = now

    # Post system message into conversation
    sys_msg = SubscriptionMessage(
        subscription_id=sub.id,
        sender_id=None,
        sender_email=None,
        sender_role="system",
        message_text=f"Payment information submitted by User. Transaction Reference / UTR: {utr_clean}. Status: PAYMENT VERIFICATION PENDING."
    )
    db.add(sys_msg)
    db.commit()
    db.refresh(sub)
    return sub


@router.post("/api/subscriptions/{subscription_id}/request-resubmit", response_model=SubscriptionResponse)
def request_payment_resubmit(
    subscription_id: str,
    payload: SubscriptionResubmitPayload,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription request not found.")

    if sub.status != "PAYMENT_VERIFICATION_PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resubmission request is allowed only when payment status is PAYMENT_VERIFICATION_PENDING."
        )

    reason = (payload.resubmit_reason or "").strip()
    if not reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Resubmission reason is required.")

    now = utc_now()
    sub.status = "PAYMENT_ACTION_REQUIRED"
    sub.resubmit_reason = reason
    sub.updated_at = now

    sys_msg = SubscriptionMessage(
        subscription_id=sub.id,
        sender_id=None,
        sender_email=None,
        sender_role="system",
        message_text=f"Admin requested payment resubmission. Reason: {reason}"
    )
    admin_msg = SubscriptionMessage(
        subscription_id=sub.id,
        sender_id=current_user.id,
        sender_email=current_user.email,
        sender_role="admin",
        message_text=f"Resubmission Required: {reason}"
    )
    db.add_all([sys_msg, admin_msg])
    db.commit()
    db.refresh(sub)
    return sub


@router.post("/api/subscriptions/{subscription_id}/verify-and-activate", response_model=SubscriptionResponse)
def verify_and_activate_payment(
    subscription_id: str,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription request not found.")

    if sub.status != "PAYMENT_VERIFICATION_PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification & activation is allowed only when status is PAYMENT_VERIFICATION_PENDING."
        )

    if not sub.utr_reference:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Transaction Reference / UTR found to verify."
        )

    plan = AUTHORITATIVE_PLANS.get((sub.plan_id or "").lower(), AUTHORITATIVE_PLANS["monthly"])
    duration_months = plan.get("duration_months", 1)

    now = utc_now()
    expiry = now + relativedelta(months=duration_months)

    if not sub.subscription_code:
        sub.subscription_code = generate_subscription_code(db)

    sub.status = "ACTIVE"
    sub.approved_at = now
    sub.verified_at = now
    sub.verified_by = current_user.email
    sub.approved_by = current_user.email
    sub.subscription_start = now
    sub.subscription_expiry = expiry
    sub.rejection_reason = None
    sub.updated_at = now

    sys_msg = SubscriptionMessage(
        subscription_id=sub.id,
        sender_id=None,
        sender_email=None,
        sender_role="system",
        message_text=f"Payment manually verified by Admin ({current_user.email}). 👑 Premium Access activated until {expiry.strftime('%d %b %Y')}!"
    )
    db.add(sys_msg)
    db.commit()
    db.refresh(sub)
    return sub


@router.get("/api/admin/subscriptions", response_model=List[SubscriptionResponse])
def get_admin_subscriptions(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    query = db.query(Subscription)
    if status_filter:
        s_clean = status_filter.strip().upper()
        query = query.filter(Subscription.status == s_clean)

    return query.order_by(Subscription.created_at.desc()).all()


@router.post("/api/admin/subscriptions/{subscription_id}/approve", response_model=SubscriptionResponse)
def approve_subscription(
    subscription_id: str,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription request not found."
        )

    plan = AUTHORITATIVE_PLANS.get((sub.plan_id or "").lower(), AUTHORITATIVE_PLANS["monthly"])
    duration_months = plan.get("duration_months", 1)

    now = utc_now()
    expiry = now + relativedelta(months=duration_months)

    if not sub.subscription_code:
        sub.subscription_code = generate_subscription_code(db)

    sub.status = "ACTIVE"
    sub.approved_at = now
    sub.verified_at = now
    sub.verified_by = current_user.email
    sub.approved_by = current_user.email
    sub.subscription_start = now
    sub.subscription_expiry = expiry
    sub.rejection_reason = None

    db.commit()
    db.refresh(sub)
    return sub


@router.post("/api/admin/subscriptions/{subscription_id}/reject", response_model=SubscriptionResponse)
def reject_subscription(
    subscription_id: str,
    payload: SubscriptionRejectPayload,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription request not found."
        )

    sub.status = "REJECTED"
    sub.rejection_reason = payload.rejection_reason or "Subscription request rejected by administrator."
    db.commit()
    db.refresh(sub)
    return sub
