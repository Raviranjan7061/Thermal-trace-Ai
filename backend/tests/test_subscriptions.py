import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.database.models import User, Subscription
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_sub_test_users():
    db = SessionLocal()
    
    test_emails = [
        "sub_user1@thermaltrace.ai",
        "sub_user2@thermaltrace.ai",
        "sub_analyst@thermaltrace.ai",
        "sub_admin@thermaltrace.ai"
    ]
    
    # Cleanup previous test records
    existing_users = db.query(User).filter(User.email.in_(test_emails)).all()
    if existing_users:
        existing_ids = [u.id for u in existing_users]
        db.query(Subscription).filter(Subscription.user_id.in_(existing_ids)).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_(existing_ids)).delete(synchronize_session=False)
        db.commit()

    # 1. Standard User 1
    u1 = User(
        email="sub_user1@thermaltrace.ai",
        hashed_password=get_password_hash("UserPass123!"),
        full_name="Sub Test User 1",
        role="user",
        is_active=True
    )
    # 2. Standard User 2
    u2 = User(
        email="sub_user2@thermaltrace.ai",
        hashed_password=get_password_hash("UserPass123!"),
        full_name="Sub Test User 2",
        role="user",
        is_active=True
    )
    # 3. Analyst
    u_analyst = User(
        email="sub_analyst@thermaltrace.ai",
        hashed_password=get_password_hash("AnalystPass123!"),
        full_name="Sub Test Analyst",
        role="analyst",
        is_active=True
    )
    # 4. Admin
    u_admin = User(
        email="sub_admin@thermaltrace.ai",
        hashed_password=get_password_hash("AdminPass123!"),
        full_name="Sub Test Admin",
        role="admin",
        is_active=True
    )

    db.add_all([u1, u2, u_analyst, u_admin])
    db.commit()
    db.refresh(u1)
    db.refresh(u2)
    db.refresh(u_analyst)
    db.refresh(u_admin)

    tokens = {
        "user1": create_access_token(u1.id, role=u1.role),
        "user2": create_access_token(u2.id, role=u2.role),
        "analyst": create_access_token(u_analyst.id, role=u_analyst.role),
        "admin": create_access_token(u_admin.id, role=u_admin.role),
        "user1_id": u1.id,
        "user2_id": u2.id,
    }

    yield tokens

    # Final Cleanup
    cleanup_users = db.query(User).filter(User.email.in_(test_emails)).all()
    if cleanup_users:
        cleanup_ids = [u.id for u in cleanup_users]
        db.query(Subscription).filter(Subscription.user_id.in_(cleanup_ids)).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_(cleanup_ids)).delete(synchronize_session=False)
        db.commit()
    db.close()


def test_user_get_subscription_status_default(setup_sub_test_users):
    token = setup_sub_test_users["user1"]
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = client.get("/api/subscriptions/my-status", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_premium_active"] is False
    assert data["status"] == "NONE"
    assert data["active_subscription"] is None


def test_non_user_roles_premium_access_bypass(setup_sub_test_users):
    analyst_token = setup_sub_test_users["analyst"]
    admin_token = setup_sub_test_users["admin"]

    # Analyst status
    resp_analyst = client.get("/api/subscriptions/my-status", headers={"Authorization": f"Bearer {analyst_token}"})
    assert resp_analyst.status_code == 200
    assert resp_analyst.json()["is_premium_active"] is True
    assert resp_analyst.json()["status"] == "ACTIVE"

    # Admin status
    resp_admin = client.get("/api/subscriptions/my-status", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp_admin.status_code == 200
    assert resp_admin.json()["is_premium_active"] is True
    assert resp_admin.json()["status"] == "ACTIVE"


def test_user_request_subscription_success(setup_sub_test_users):
    token = setup_sub_test_users["user1"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "plan_id": "monthly"
    }

    resp = client.post("/api/subscriptions/request", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "PENDING"
    assert data["plan_id"] == "monthly"
    assert data["plan_name"] == "Monthly"
    assert data["price_inr"] == 400

    # Check status again
    status_resp = client.get("/api/subscriptions/my-status", headers=headers)
    assert status_resp.status_code == 200
    s_data = status_resp.json()
    assert s_data["is_premium_active"] is False
    assert s_data["status"] == "PENDING"
    assert s_data["latest_subscription"]["plan_id"] == "monthly"


def test_user_request_duplicate_pending_blocked(setup_sub_test_users):
    token = setup_sub_test_users["user1"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {"plan_id": "yearly"}
    resp = client.post("/api/subscriptions/request", json=payload, headers=headers)
    assert resp.status_code == 400
    detail_lower = resp.json()["detail"].lower()
    assert "pending" in detail_lower or "request in progress" in detail_lower


def test_admin_list_subscriptions(setup_sub_test_users):
    user_token = setup_sub_test_users["user1"]
    admin_token = setup_sub_test_users["admin"]

    # Non-admin forbidden
    resp_user = client.get("/api/admin/subscriptions", headers={"Authorization": f"Bearer {user_token}"})
    assert resp_user.status_code == 403

    # Admin allowed
    resp_admin = client.get("/api/admin/subscriptions", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp_admin.status_code == 200
    sub_list = resp_admin.json()
    assert isinstance(sub_list, list)
    assert len(sub_list) >= 1
    assert any(s["user_email"] == "sub_user1@thermaltrace.ai" for s in sub_list)


def test_admin_approve_subscription(setup_sub_test_users):
    admin_token = setup_sub_test_users["admin"]
    user_token = setup_sub_test_users["user1"]

    # Get subscription ID
    list_resp = client.get("/api/admin/subscriptions", headers={"Authorization": f"Bearer {admin_token}"})
    sub_item = next(s for s in list_resp.json() if s["user_email"] == "sub_user1@thermaltrace.ai")
    sub_id = sub_item["id"]

    # Approve
    approve_resp = client.post(f"/api/admin/subscriptions/{sub_id}/approve", headers={"Authorization": f"Bearer {admin_token}"})
    assert approve_resp.status_code == 200
    approved_sub = approve_resp.json()
    assert approved_sub["status"] == "ACTIVE"

    # Verify user1 now has active premium
    status_resp = client.get("/api/subscriptions/my-status", headers={"Authorization": f"Bearer {user_token}"})
    assert status_resp.status_code == 200
    s_data = status_resp.json()
    assert s_data["is_premium_active"] is True
    assert s_data["status"] == "ACTIVE"
    assert s_data["active_subscription"]["plan_id"] == "monthly"
    assert s_data["active_subscription"]["subscription_expiry"] is not None


def test_admin_reject_subscription(setup_sub_test_users):
    user2_token = setup_sub_test_users["user2"]
    admin_token = setup_sub_test_users["admin"]

    # Request subscription for user2
    req_resp = client.post("/api/subscriptions/request", json={"plan_id": "six_months"}, headers={"Authorization": f"Bearer {user2_token}"})
    assert req_resp.status_code == 201
    sub_id = req_resp.json()["id"]

    # Reject
    reject_resp = client.post(
        f"/api/admin/subscriptions/{sub_id}/reject",
        json={"rejection_reason": "Incomplete verification details"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert reject_resp.status_code == 200
    rejected_sub = reject_resp.json()
    assert rejected_sub["status"] == "REJECTED"

    # Check user2 status
    status_resp = client.get("/api/subscriptions/my-status", headers={"Authorization": f"Bearer {user2_token}"})
    assert status_resp.status_code == 200
    s_data = status_resp.json()
    assert s_data["is_premium_active"] is False
    assert s_data["status"] == "REJECTED"
    assert s_data["latest_subscription"]["rejection_reason"] == "Incomplete verification details"


def test_expired_subscription_access(setup_sub_test_users):
    db = SessionLocal()
    try:
        user2_id = setup_sub_test_users["user2_id"]
        
        # Manually create an expired active subscription record
        expired_sub = Subscription(
            user_id=user2_id,
            user_email="sub_user2@thermaltrace.ai",
            plan_id="monthly",
            plan_name="Monthly",
            price_inr=400,
            status="ACTIVE",
            approved_at=datetime.now(timezone.utc) - timedelta(days=60),
            subscription_expiry=datetime.now(timezone.utc) - timedelta(days=30)
        )
        db.add(expired_sub)
        db.commit()

        user2_token = setup_sub_test_users["user2"]
        status_resp = client.get("/api/subscriptions/my-status", headers={"Authorization": f"Bearer {user2_token}"})
        assert status_resp.status_code == 200
        s_data = status_resp.json()
        assert s_data["is_premium_active"] is False
        assert s_data["status"] == "EXPIRED"
    finally:
        db.close()


def test_change_pending_subscription_plan(setup_sub_test_users):
    db = SessionLocal()
    try:
        user2_token = setup_sub_test_users["user2"]
        headers = {"Authorization": f"Bearer {user2_token}"}

        # 1. Clean up user2 subscriptions
        user2_id = setup_sub_test_users["user2_id"]
        db.query(Subscription).filter(Subscription.user_id == user2_id).delete()
        db.commit()

        # 2. Request initial Yearly subscription
        req_resp = client.post("/api/subscriptions/request", json={"plan_id": "yearly"}, headers=headers)
        assert req_resp.status_code == 201
        initial_sub = req_resp.json()
        sub_id = initial_sub["id"]
        assert initial_sub["plan_id"] == "yearly"
        assert initial_sub["price_inr"] == 4800

        # 3. Change plan: Yearly -> Monthly
        chg_resp1 = client.put("/api/subscriptions/change-plan", json={"plan_id": "monthly"}, headers=headers)
        assert chg_resp1.status_code == 200
        sub1 = chg_resp1.json()
        assert sub1["id"] == sub_id  # Same subscription record preserved!
        assert sub1["plan_id"] == "monthly"
        assert sub1["plan_name"] == "Monthly"
        assert sub1["price_inr"] == 400
        assert sub1["status"] == "PENDING"

        # 4. Change plan: Monthly -> 6 Months
        chg_resp2 = client.put("/api/subscriptions/change-plan", json={"plan_id": "six_months"}, headers=headers)
        assert chg_resp2.status_code == 200
        sub2 = chg_resp2.json()
        assert sub2["id"] == sub_id  # Same subscription record preserved!
        assert sub2["plan_id"] == "six_months"
        assert sub2["plan_name"] == "6 Months"
        assert sub2["price_inr"] == 2400

        # 5. Select same plan again (six_months) - should return successfully without duplicate
        chg_resp_same = client.put("/api/subscriptions/change-plan", json={"plan_id": "six_months"}, headers=headers)
        assert chg_resp_same.status_code == 200
        assert chg_resp_same.json()["id"] == sub_id

        # 6. Verify total subscription records for user2 is EXACTLY 1 (No duplicates created!)
        total_user2_subs = db.query(Subscription).filter(Subscription.user_id == user2_id).count()
        assert total_user2_subs == 1

        # 7. Invalid plan ID check
        inv_resp = client.put("/api/subscriptions/change-plan", json={"plan_id": "invalid_plan_123"}, headers=headers)
        assert inv_resp.status_code == 400
        assert "invalid subscription plan" in inv_resp.json()["detail"].lower()

    finally:
        db.close()


def test_change_plan_blocked_for_non_pending_or_active(setup_sub_test_users):
    user1_token = setup_sub_test_users["user1"]
    headers = {"Authorization": f"Bearer {user1_token}"}

    # user1 has an ACTIVE subscription from test_admin_approve_subscription
    resp = client.put("/api/subscriptions/change-plan", json={"plan_id": "monthly"}, headers=headers)
    assert resp.status_code == 400
    assert "no pending subscription request" in resp.json()["detail"].lower()


def test_analyst_cannot_change_user_subscription(setup_sub_test_users):
    analyst_token = setup_sub_test_users["analyst"]
    headers = {"Authorization": f"Bearer {analyst_token}"}

    resp = client.put("/api/subscriptions/change-plan", json={"plan_id": "monthly"}, headers=headers)
    assert resp.status_code == 400
    assert "applicable only for standard users" in resp.json()["detail"].lower()


def test_payment_conversation_and_manual_verification_workflow(setup_sub_test_users):
    db = SessionLocal()
    try:
        user2_token = setup_sub_test_users["user2"]
        user1_token = setup_sub_test_users["user1"]
        admin_token = setup_sub_test_users["admin"]
        analyst_token = setup_sub_test_users["analyst"]
        user2_id = setup_sub_test_users["user2_id"]

        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        user1_headers = {"Authorization": f"Bearer {user1_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        analyst_headers = {"Authorization": f"Bearer {analyst_token}"}

        # 1. Clean up user2 subscriptions
        db.query(Subscription).filter(Subscription.user_id == user2_id).delete()
        db.commit()

        # 2. User2 creates subscription request
        req_resp = client.post("/api/subscriptions/request", json={"plan_id": "six_months"}, headers=user2_headers)
        assert req_resp.status_code == 201
        sub_data = req_resp.json()
        sub_id = sub_data["id"]
        sub_code = sub_data["subscription_code"]
        assert sub_code.startswith("TT-SUB-")
        assert len(sub_code.split("-")[-1]) == 8  # 8 hex char token

        # 3. Admin starts payment conversation
        start_resp = client.post(f"/api/subscriptions/{sub_id}/start-conversation", headers=admin_headers)
        assert start_resp.status_code == 200
        assert start_resp.json()["status"] == "PAYMENT_DISCUSSION"

        # 4. Duplicate start conversation returns existing discussion state
        start_resp2 = client.post(f"/api/subscriptions/{sub_id}/start-conversation", headers=admin_headers)
        assert start_resp2.status_code == 200

        # 5. Plan change is now BLOCKED after payment discussion starts
        chg_resp = client.put("/api/subscriptions/change-plan", json={"plan_id": "monthly"}, headers=user2_headers)
        assert chg_resp.status_code == 400

        # 6. Messaging Authorization: User2 and Admin allowed; User1 and Analyst forbidden
        msg_resp_user1 = client.get(f"/api/subscriptions/{sub_id}/messages", headers=user1_headers)
        assert msg_resp_user1.status_code == 403

        msg_resp_analyst = client.get(f"/api/subscriptions/{sub_id}/messages", headers=analyst_headers)
        assert msg_resp_analyst.status_code == 403

        msg_resp_owner = client.get(f"/api/subscriptions/{sub_id}/messages", headers=user2_headers)
        assert msg_resp_owner.status_code == 200
        initial_msgs = msg_resp_owner.json()
        assert len(initial_msgs) >= 2
        assert any(m["sender_role"] == "system" and m["sender_id"] is None for m in initial_msgs)

        # 7. User2 sends a message to Admin
        post_msg_resp = client.post(f"/api/subscriptions/{sub_id}/messages", json={"message_text": "I have completed UPI transfer."}, headers=user2_headers)
        assert post_msg_resp.status_code == 200
        posted_msg = post_msg_resp.json()
        assert posted_msg["sender_role"] == "user"

        # 8. User2 submits payment info (invalid UTR rejected)
        inv_utr_resp = client.post(f"/api/subscriptions/{sub_id}/submit-payment", json={"utr_reference": "12"}, headers=user2_headers)
        assert inv_utr_resp.status_code == 400

        # Valid UTR submission + sample valid base64 proof image
        sample_proof = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        sub_pay_resp = client.post(
            f"/api/subscriptions/{sub_id}/submit-payment",
            json={"utr_reference": "427819024189", "payment_proof_screenshot": sample_proof},
            headers=user2_headers
        )
        assert sub_pay_resp.status_code == 200
        updated_sub = sub_pay_resp.json()
        assert updated_sub["status"] == "PAYMENT_VERIFICATION_PENDING"
        assert updated_sub["utr_reference"] == "427819024189"

        # Submitting payment MUST NOT activate Premium!
        status_resp = client.get("/api/subscriptions/my-status", headers=user2_headers)
        assert status_resp.json()["is_premium_active"] is False

        # 9. User2 cannot self-activate Premium
        user_act_resp = client.post(f"/api/subscriptions/{sub_id}/verify-and-activate", headers=user2_headers)
        assert user_act_resp.status_code == 403

        # 10. Admin asks for resubmission
        resubmit_resp = client.post(
            f"/api/subscriptions/{sub_id}/request-resubmit",
            json={"resubmit_reason": "UTR not visible on bank statement. Please double check reference."},
            headers=admin_headers
        )
        assert resubmit_resp.status_code == 200
        assert resubmit_resp.json()["status"] == "PAYMENT_ACTION_REQUIRED"
        assert resubmit_resp.json()["resubmit_reason"] == "UTR not visible on bank statement. Please double check reference."

        # 11. User2 resubmits corrected UTR
        resubmit_pay_resp = client.post(
            f"/api/subscriptions/{sub_id}/submit-payment",
            json={"utr_reference": "427819024199"},
            headers=user2_headers
        )
        assert resubmit_pay_resp.status_code == 200
        assert resubmit_pay_resp.json()["status"] == "PAYMENT_VERIFICATION_PENDING"
        assert resubmit_pay_resp.json()["utr_reference"] == "427819024199"

        # 12. Admin verifies payment and activates Premium
        verify_resp = client.post(f"/api/subscriptions/{sub_id}/verify-and-activate", headers=admin_headers)
        assert verify_resp.status_code == 200
        active_sub_res = verify_resp.json()
        assert active_sub_res["status"] == "ACTIVE"
        assert active_sub_res["verified_by"] is not None

        # Verify calendar expiry: 6 Months plan -> activation + 6 months
        act_start = datetime.fromisoformat(active_sub_res["subscription_start"].replace("Z", "+00:00"))
        act_expiry = datetime.fromisoformat(active_sub_res["subscription_expiry"].replace("Z", "+00:00"))
        assert (act_expiry.month - act_start.month) % 12 == 6 or (act_expiry.month == act_start.month and act_expiry.year == act_start.year + 1)

        # 13. Verify User2 now has active Premium Access
        user2_status = client.get("/api/subscriptions/my-status", headers=user2_headers).json()
        assert user2_status["is_premium_active"] is True
        assert user2_status["status"] == "ACTIVE"
        assert user2_status["active_subscription"]["subscription_code"] == sub_code

    finally:
        db.close()


def test_cancel_subscription_workflow(setup_sub_test_users):
    db = SessionLocal()
    try:
        user1_id = setup_sub_test_users["user1_id"]
        db.query(Subscription).filter(Subscription.user_id == user1_id).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()

    user1_token = setup_sub_test_users["user1"]
    user2_token = setup_sub_test_users["user2"]
    admin_token = setup_sub_test_users["admin"]

    user1_headers = {"Authorization": f"Bearer {user1_token}"}
    user2_headers = {"Authorization": f"Bearer {user2_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. User1 requests subscription
    req_resp = client.post("/api/subscriptions/request", json={"plan_id": "monthly"}, headers=user1_headers)
    assert req_resp.status_code == 201
    sub_id = req_resp.json()["id"]

    # 2. User2 attempts to cancel User1's subscription -> 403 Forbidden
    forbidden_resp = client.post(f"/api/subscriptions/{sub_id}/cancel", headers=user2_headers)
    assert forbidden_resp.status_code == 403

    # 3. Admin starts payment conversation -> status becomes PAYMENT_DISCUSSION
    start_resp = client.post(f"/api/subscriptions/{sub_id}/start-conversation", headers=admin_headers)
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "PAYMENT_DISCUSSION"

    # 4. User1 cancels the payment discussion
    cancel_resp = client.post(f"/api/subscriptions/{sub_id}/cancel", headers=user1_headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

    # 5. Check messages preserved and system event appended
    msg_resp = client.get(f"/api/subscriptions/{sub_id}/messages", headers=user1_headers)
    assert msg_resp.status_code == 200
    msgs = msg_resp.json()
    assert len(msgs) >= 2
    assert any(m["message_text"] == "Subscription request cancelled by User." for m in msgs)

    # 6. User1 attempts to post message on cancelled request -> 400 Bad Request
    post_msg_resp = client.post(f"/api/subscriptions/{sub_id}/messages", json={"message_text": "hello"}, headers=user1_headers)
    assert post_msg_resp.status_code == 400

    # 7. User1 attempts to submit payment on cancelled request -> 400 Bad Request
    submit_pay_resp = client.post(f"/api/subscriptions/{sub_id}/submit-payment", json={"utr_reference": "12345678"}, headers=user1_headers)
    assert submit_pay_resp.status_code == 400

    # 8. User1 can create a NEW subscription request after cancellation
    new_req_resp = client.post("/api/subscriptions/request", json={"plan_id": "yearly"}, headers=user1_headers)
    assert new_req_resp.status_code == 201
    new_sub = new_req_resp.json()
    assert new_sub["id"] != sub_id
    assert new_sub["status"] == "PENDING"
    assert new_sub["subscription_code"] != req_resp.json()["subscription_code"]



