import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.database.models import User
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_test_users():
    db = SessionLocal()
    
    # Clean up test users if existing
    test_emails = [
        "test_admin@thermaltrace.ai",
        "test_analyst@thermaltrace.ai",
        "test_authority@thermaltrace.ai",
        "admin-like-email@thermaltrace.ai",
        "authority-like-email@thermaltrace.ai",
        "deactivated_user@thermaltrace.ai"
    ]
    db.query(User).filter(User.email.in_(test_emails)).delete(synchronize_session=False)
    db.commit()

    # 1. Admin
    u_admin = User(
        email="test_admin@thermaltrace.ai",
        hashed_password=get_password_hash("AdminSecret123"),
        full_name="Test Admin",
        role="admin",
        is_active=True
    )
    # 2. Analyst
    u_analyst = User(
        email="test_analyst@thermaltrace.ai",
        hashed_password=get_password_hash("AnalystSecret123"),
        full_name="Test Analyst",
        role="analyst",
        is_active=True
    )
    # 3. Authority
    u_auth = User(
        email="test_authority@thermaltrace.ai",
        hashed_password=get_password_hash("AuthoritySecret123"),
        full_name="Test Authority",
        role="authority",
        is_active=True
    )
    # 4. Email containing "admin" but role ANALYST
    u_admin_email_analyst_role = User(
        email="admin-like-email@thermaltrace.ai",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Analyst with Admin Email",
        role="analyst",
        is_active=True
    )
    # 5. Email containing "authority" but role ANALYST
    u_authority_email_analyst_role = User(
        email="authority-like-email@thermaltrace.ai",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Analyst with Authority Email",
        role="analyst",
        is_active=True
    )
    # 6. Deactivated user
    u_deactivated = User(
        email="deactivated_user@thermaltrace.ai",
        hashed_password=get_password_hash("Deactivated123!"),
        full_name="Deactivated User",
        role="analyst",
        is_active=False
    )

    db.add_all([u_admin, u_analyst, u_auth, u_admin_email_analyst_role, u_authority_email_analyst_role, u_deactivated])
    db.commit()

    yield {
        "admin": u_admin,
        "analyst": u_analyst,
        "authority": u_auth,
        "admin_email_analyst_role": u_admin_email_analyst_role,
        "authority_email_analyst_role": u_authority_email_analyst_role,
        "deactivated": u_deactivated
    }

    # Teardown
    db.query(User).filter(User.email.in_(test_emails)).delete(synchronize_session=False)
    db.commit()
    db.close()


def test_auth_login_success(setup_test_users):
    response = client.post("/api/auth/login", json={
        "email": "test_admin@thermaltrace.ai",
        "password": "AdminSecret123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"


def test_auth_login_wrong_password(setup_test_users):
    response = client.post("/api/auth/login", json={
        "email": "test_admin@thermaltrace.ai",
        "password": "WrongPassword"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_auth_login_unknown_user(setup_test_users):
    response = client.post("/api/auth/login", json={
        "email": "unknown_user_12345@thermaltrace.ai",
        "password": "SomePassword"
    })
    assert response.status_code == 401


def test_auth_login_deactivated_user(setup_test_users):
    response = client.post("/api/auth/login", json={
        "email": "deactivated_user@thermaltrace.ai",
        "password": "Deactivated123!"
    })
    assert response.status_code == 401
    assert "deactivated" in response.json()["detail"].lower()


def test_auth_me_authenticated(setup_test_users):
    token = create_access_token(subject=setup_test_users["analyst"].id, role="analyst")
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test_analyst@thermaltrace.ai"
    assert data["role"] == "analyst"


def test_auth_me_unauthenticated():
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_unauthenticated_protected_api():
    response = client.get("/api/admin/users")
    assert response.status_code == 401


def test_analyst_access_admin_api_denied(setup_test_users):
    token = create_access_token(subject=setup_test_users["analyst"].id, role="analyst")
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_admin_access_admin_api_allowed(setup_test_users):
    token = create_access_token(subject=setup_test_users["admin"].id, role="admin")
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_admin_create_user(setup_test_users):
    token = create_access_token(subject=setup_test_users["admin"].id, role="admin")
    response = client.post(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "full_name": "New Provisioned Analyst",
            "email": "new_provisioned@thermaltrace.ai",
            "password": "NewSecretPass123",
            "role": "analyst"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "new_provisioned@thermaltrace.ai"
    assert data["role"] == "analyst"

    # Cleanup created user
    db = SessionLocal()
    db.query(User).filter(User.email == "new_provisioned@thermaltrace.ai").delete()
    db.commit()
    db.close()


def test_email_containing_admin_with_analyst_role(setup_test_users):
    """
    CRITICAL SECURITY CHECK:
    User whose email contains 'admin' (admin-like-email@thermaltrace.ai) but database role = 'analyst'
    MUST be DENIED access to Admin APIs (403 Forbidden).
    """
    token = create_access_token(
        subject=setup_test_users["admin_email_analyst_role"].id,
        role=setup_test_users["admin_email_analyst_role"].role
    )
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_email_containing_authority_with_analyst_role(setup_test_users):
    """
    CRITICAL SECURITY CHECK:
    User whose email contains 'authority' (authority-like-email@thermaltrace.ai) but database role = 'analyst'
    Role comes ONLY from database.
    """
    db = SessionLocal()
    user = db.query(User).filter(User.email == "authority-like-email@thermaltrace.ai").first()
    db.close()
    assert user is not None
    assert user.role == "analyst"


def test_google_login_existing_role(setup_test_users):
    response = client.post("/api/auth/google", json={
        "email": "test_admin@thermaltrace.ai",
        "full_name": "Test Admin Google",
        "firebase_uid": "fb_uid_12345"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"


def test_google_login_new_user():
    response = client.post("/api/auth/google", json={
        "email": "new_public_google_user@gmail.com",
        "full_name": "New Google User",
        "firebase_uid": "fb_uid_67890"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "user"

    # Cleanup
    db = SessionLocal()
    db.query(User).filter(User.email == "new_public_google_user@gmail.com").delete()
    db.commit()
    db.close()

