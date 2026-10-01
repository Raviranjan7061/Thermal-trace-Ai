import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.database.models import User, FeedbackItem
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_feedback_users():
    db = SessionLocal()
    
    test_emails = [
        "fb_user@thermaltrace.ai",
        "fb_analyst@thermaltrace.ai",
        "fb_admin@thermaltrace.ai",
    ]
    db.query(FeedbackItem).filter(FeedbackItem.submitter_email.in_(test_emails)).delete(synchronize_session=False)
    db.query(User).filter(User.email.in_(test_emails)).delete(synchronize_session=False)
    db.commit()

    u_user = User(
        email="fb_user@thermaltrace.ai",
        hashed_password=get_password_hash("UserSecret123"),
        full_name="FB Normal User",
        role="user",
        is_active=True
    )
    u_analyst = User(
        email="fb_analyst@thermaltrace.ai",
        hashed_password=get_password_hash("AnalystSecret123"),
        full_name="FB Analyst User",
        role="analyst",
        is_active=True
    )
    u_admin = User(
        email="fb_admin@thermaltrace.ai",
        hashed_password=get_password_hash("AdminSecret123"),
        full_name="FB Admin User",
        role="admin",
        is_active=True
    )

    db.add(u_user)
    db.add(u_analyst)
    db.add(u_admin)
    db.commit()

    tokens = {
        "user": create_access_token(subject=u_user.id, role=u_user.role),
        "analyst": create_access_token(subject=u_analyst.id, role=u_analyst.role),
        "admin": create_access_token(subject=u_admin.id, role=u_admin.role),
    }

    yield tokens

    # Clean up after tests
    db.query(FeedbackItem).filter(FeedbackItem.submitter_email.in_(test_emails)).delete(synchronize_session=False)
    db.query(User).filter(User.email.in_(test_emails)).delete(synchronize_session=False)
    db.commit()
    db.close()


def test_submit_feedback_unauthenticated():
    res = client.post("/api/feedback", json={
        "category": "Bug",
        "title": "Unauthenticated test",
        "description": "Should fail with 401"
    })
    assert res.status_code == 401


def test_submit_feedback_authenticated_user(setup_feedback_users):
    user_token = setup_feedback_users["user"]
    headers = {"Authorization": f"Bearer {user_token}"}

    payload = {
        "category": "UI/UX Issue",
        "title": "Button contrast on dark theme",
        "description": "The export button text is difficult to read on dark theme.",
        "priority": "High",
        "screenshot_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }

    res = client.post("/api/feedback", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == payload["title"]
    assert data["submitter_email"] == "fb_user@thermaltrace.ai"
    assert data["submitter_role"] == "user"
    assert data["status"] == "NEW"
    assert data["priority"] == "High"
    assert data["screenshot_data"] == payload["screenshot_data"]


def test_submit_feedback_priority_normalization(setup_feedback_users):
    user_token = setup_feedback_users["user"]
    headers = {"Authorization": f"Bearer {user_token}"}

    # Attempt Critical priority (should default to Medium)
    payload = {
        "category": "Data Issue",
        "title": "Sensor calibration offset",
        "description": "Temperature readings off by 2 degrees",
        "priority": "Critical"
    }

    res = client.post("/api/feedback", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["priority"] == "Medium"


def test_get_my_feedback(setup_feedback_users):
    user_token = setup_feedback_users["user"]
    headers = {"Authorization": f"Bearer {user_token}"}

    res = client.get("/api/feedback/my", headers=headers)
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) >= 2
    for item in items:
        assert item["submitter_email"] == "fb_user@thermaltrace.ai"


def test_non_admin_forbidden_on_admin_endpoints(setup_feedback_users):
    user_token = setup_feedback_users["user"]
    analyst_token = setup_feedback_users["analyst"]

    for token in [user_token, analyst_token]:
        headers = {"Authorization": f"Bearer {token}"}
        
        res_inbox = client.get("/api/feedback", headers=headers)
        assert res_inbox.status_code == 403

        res_summary = client.get("/api/feedback/summary", headers=headers)
        assert res_summary.status_code == 403

        res_patch = client.patch("/api/feedback/dummy-id/status", json={"status": "RESOLVED"}, headers=headers)
        assert res_patch.status_code == 403


def test_admin_feedback_inbox_and_status_update(setup_feedback_users):
    admin_token = setup_feedback_users["admin"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Check inbox
    res_inbox = client.get("/api/feedback", headers=headers)
    assert res_inbox.status_code == 200
    items = res_inbox.json()
    assert len(items) >= 2

    target_item = items[0]
    feedback_id = target_item["id"]

    # 2. Check summary
    res_summary = client.get("/api/feedback/summary", headers=headers)
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert summary["total"] >= 2
    assert summary["new_count"] >= 2

    # 3. Admin updates status to IN_REVIEW
    patch_payload = {
        "status": "IN_REVIEW",
        "admin_notes": "Assigned to UI team for investigation."
    }
    res_patch = client.patch(f"/api/feedback/{feedback_id}/status", json=patch_payload, headers=headers)
    assert res_patch.status_code == 200
    updated_item = res_patch.json()
    assert updated_item["status"] == "IN_REVIEW"
    assert updated_item["admin_notes"] == patch_payload["admin_notes"]

    # 4. Verify updated summary metrics
    res_summary_2 = client.get("/api/feedback/summary", headers=headers)
    assert res_summary_2.json()["in_review_count"] >= 1
