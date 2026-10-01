from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.database.session import get_db
from app.database.models import User, AuditLog
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    firebase_uid: Optional[str] = None
    requested_role: Optional[str] = None

class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Optional[str] = None  # Ignored for public registrations

class UserSchema(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSchema

class OAuth2TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

def log_security_event(db: Session, action: str, actor_email: str, entity_id: str, details: Optional[dict] = None):
    try:
        audit = AuditLog(
            action=action,
            actor_email=actor_email,
            entity_type="user",
            entity_id=entity_id,
            details=details or {}
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        db.rollback()

@router.post("/token", response_model=OAuth2TokenResponse)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    email_clean = form_data.username.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        log_security_event(
            db=db,
            action="LOGIN_FAILURE",
            actor_email=email_clean,
            entity_id=user.id if user else "unknown",
            details={"reason": "Invalid credentials (OAuth2 token endpoint)"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        log_security_event(
            db=db,
            action="LOGIN_FAILURE",
            actor_email=email_clean,
            entity_id=user.id,
            details={"reason": "Account deactivated (OAuth2 token endpoint)"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated. Contact system administrator.",
        )

    access_token = create_access_token(subject=user.id, role=user.role)

    log_security_event(
        db=db,
        action="OAUTH2_LOGIN_SUCCESS",
        actor_email=user.email,
        entity_id=user.id,
        details={"role": user.role}
    )

    return OAuth2TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user or not verify_password(payload.password, user.hashed_password):
        log_security_event(
            db=db,
            action="LOGIN_FAILURE",
            actor_email=email_clean,
            entity_id=user.id if user else "unknown",
            details={"reason": "Invalid credentials"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        log_security_event(
            db=db,
            action="LOGIN_FAILURE",
            actor_email=email_clean,
            entity_id=user.id,
            details={"reason": "Account deactivated"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated. Contact system administrator.",
        )

    access_token = create_access_token(subject=user.id, role=user.role)

    log_security_event(
        db=db,
        action="LOGIN_SUCCESS",
        actor_email=user.email,
        entity_id=user.id,
        details={"role": user.role}
    )

    user_schema = UserSchema(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else ""
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_schema
    )

KNOWN_ADMIN_ROLES = {
    "raviranjan706187@gmail.com": "admin",
    "admin@thermaltrace.ai": "admin",
    "viratkumar0097@gmail.com": "analyst",
    "analyst@thermaltrace.ai": "analyst",
    "ravi90kumarr12@gmail.com": "authority",
    "authority@thermaltrace.ai": "authority"
}

@router.post("/google", response_model=LoginResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    expected_role = KNOWN_ADMIN_ROLES.get(email_clean)

    if user:
        if not user.is_active:
            log_security_event(
                db=db,
                action="LOGIN_FAILURE",
                actor_email=email_clean,
                entity_id=user.id,
                details={"reason": "Deactivated user Google login attempt"}
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated. Contact system administrator."
            )

        updated = False
        if payload.full_name and (not user.full_name or user.full_name == user.email):
            user.full_name = payload.full_name.strip()
            updated = True

        if expected_role and user.role != expected_role:
            user.role = expected_role
            updated = True

        if updated:
            db.commit()
            db.refresh(user)
    else:
        full_name = payload.full_name.strip() if payload.full_name else email_clean.split('@')[0]
        req_role = (payload.requested_role or "").strip().lower()
        allowed_public_roles = {"user", "analyst", "authority"}

        if req_role in allowed_public_roles:
            assigned_role = expected_role or req_role
        else:
            assigned_role = expected_role or "user"

        user = User(
            email=email_clean,
            hashed_password=get_password_hash("GOOGLE_SSO_AUTHENTICATED_USER"),
            full_name=full_name,
            role=assigned_role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        log_security_event(
            db=db,
            action="GOOGLE_USER_AUTOPROVISIONED",
            actor_email=user.email,
            entity_id=user.id,
            details={"assigned_role": assigned_role}
        )

    log_security_event(
        db=db,
        action="GOOGLE_LOGIN_SUCCESS",
        actor_email=user.email,
        entity_id=user.id,
        details={"role": user.role}
    )

    access_token = create_access_token(subject=user.id, role=user.role)

    user_schema = UserSchema(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else ""
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_schema
    )

@router.post("/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()

    if not payload.full_name or not payload.full_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required."
        )

    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        role_map = {
            "user": "User",
            "analyst": "Analyst",
            "authority": "Authority",
            "admin": "Admin"
        }
        role_display = role_map.get((existing.role or "").lower(), "User")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This account is already registered for the {role_display} Workspace. Please sign in through the {role_display} Workspace."
        )

    req_role = (payload.role or "").strip().lower()
    allowed_public_roles = {"user", "analyst", "authority"}
    if req_role in allowed_public_roles:
        assigned_role = req_role
    else:
        assigned_role = "user"

    new_user = User(
        email=email_clean,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role=assigned_role,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_security_event(
        db=db,
        action="PUBLIC_USER_REGISTERED",
        actor_email=new_user.email,
        entity_id=new_user.id,
        details={"name": new_user.full_name, "assigned_role": "user"}
    )

    access_token = create_access_token(subject=new_user.id, role=new_user.role)

    user_schema = UserSchema(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        is_active=new_user.is_active,
        created_at=new_user.created_at.isoformat() if new_user.created_at else ""
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_schema
    )

@router.get("/me", response_model=UserSchema)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserSchema(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat() if current_user.created_at else ""
    )

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_security_event(
        db=db,
        action="LOGOUT",
        actor_email=current_user.email,
        entity_id=current_user.id
    )
    return {"message": "Successfully logged out."}
