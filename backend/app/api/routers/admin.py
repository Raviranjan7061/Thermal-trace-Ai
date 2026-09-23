from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.database.session import get_db
from app.database.models import User, AuditLog
from app.core.security import get_password_hash
from app.api.deps import require_role

router = APIRouter(prefix="/api/admin", tags=["Admin User & Role Management"])

class CreateUserRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str # admin, analyst, authority

class UpdateUserRequest(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    full_name: Optional[str] = None

class AdminUserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    audit_id: str
    action: str
    actor_email: Optional[str] = None
    entity_type: str
    entity_id: str
    details: Optional[dict] = None
    timestamp: str

    class Config:
        from_attributes = True

@router.get("/users", response_model=List[AdminUserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("admin"))
):
    users = db.query(User).order_by(desc(User.created_at)).all()
    return [
        AdminUserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at.isoformat() if u.created_at else ""
        )
        for u in users
    ]

@router.post("/users", response_model=AdminUserResponse)
def create_user(
    payload: CreateUserRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("admin"))
):
    email_clean = payload.email.strip().lower()
    
    # Check if user with email already exists
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{email_clean}' already exists."
        )

    role_clean = payload.role.strip().lower()
    if role_clean not in ["admin", "analyst", "authority", "user"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'admin', 'analyst', 'authority', or 'user'."
        )

    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    new_user = User(
        email=email_clean,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role=role_clean,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit Log
    audit = AuditLog(
        action="USER_CREATED",
        actor_email=admin_user.email,
        entity_type="user",
        entity_id=new_user.id,
        details={"created_email": new_user.email, "role": new_user.role}
    )
    db.add(audit)
    db.commit()

    return AdminUserResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        is_active=new_user.is_active,
        created_at=new_user.created_at.isoformat() if new_user.created_at else ""
    )

@router.patch("/users/{user_id}", response_model=AdminUserResponse)
def update_user(
    user_id: str,
    payload: UpdateUserRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("admin"))
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found."
        )

    actions = []
    if payload.is_active is not None and payload.is_active != target.is_active:
        if target.id == admin_user.id and not payload.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own active administrator account."
            )
        target.is_active = payload.is_active
        actions.append("USER_ACTIVATED" if target.is_active else "USER_DEACTIVATED")

    if payload.role is not None:
        role_clean = payload.role.strip().lower()
        if role_clean not in ["admin", "analyst", "authority", "user"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be 'admin', 'analyst', 'authority', or 'user'."
            )
        if role_clean != target.role:
            target.role = role_clean
            actions.append(f"ROLE_CHANGED_TO_{role_clean.upper()}")

    if payload.full_name is not None:
        target.full_name = payload.full_name.strip()

    db.commit()
    db.refresh(target)

    for act in actions:
        audit = AuditLog(
            action=act,
            actor_email=admin_user.email,
            entity_type="user",
            entity_id=target.id,
            details={"target_email": target.email, "role": target.role, "is_active": target.is_active}
        )
        db.add(audit)
    db.commit()

    return AdminUserResponse(
        id=target.id,
        email=target.email,
        full_name=target.full_name,
        role=target.role,
        is_active=target.is_active,
        created_at=target.created_at.isoformat() if target.created_at else ""
    )

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_admin_audit_logs(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("admin"))
):
    logs = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return [
        AuditLogResponse(
            audit_id=l.audit_id,
            action=l.action,
            actor_email=l.actor_email or "System",
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            details=l.details or {},
            timestamp=l.timestamp.isoformat() if l.timestamp else ""
        )
        for l in logs
    ]
