import sys
import argparse
import getpass
from app.database.session import SessionLocal
from app.database.models import User, AuditLog
from app.core.security import get_password_hash

def main():
    parser = argparse.ArgumentParser(description="ThermalTrace AI — Create Initial Admin User CLI Command")
    parser.add_argument("--name", type=str, help="Full name of the admin user")
    parser.add_argument("--email", type=str, help="Email address of the admin user")
    parser.add_argument("--password", type=str, help="Password for the admin user")
    args = parser.parse_args()

    name = args.name
    email = args.email
    password = args.password

    if not name:
        name = input("Enter Admin Full Name: ").strip()
    if not email:
        email = input("Enter Admin Email Address: ").strip()
    if not password:
        password = getpass.getpass("Enter Admin Password: ").strip()

    if not name or not email or not password:
        print("[ERROR] All fields (Name, Email, Password) are required.")
        sys.exit(1)

    email_clean = email.strip().lower()
    if "@" not in email_clean:
        print(f"[ERROR] '{email_clean}' is not a valid email address.")
        sys.exit(1)

    if len(password) < 6:
        print("[ERROR] Password must be at least 6 characters long.")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            print(f"[SAFE FAIL] A user with email '{email_clean}' already exists in the database.")
            print(f"Existing User ID: {existing.id} | Role: {existing.role}")
            sys.exit(1)

        admin_user = User(
            email=email_clean,
            hashed_password=get_password_hash(password),
            full_name=name.strip(),
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        audit = AuditLog(
            action="INITIAL_ADMIN_CREATED",
            actor_email=email_clean,
            entity_type="user",
            entity_id=admin_user.id,
            details={"name": name.strip(), "role": "admin"}
        )
        db.add(audit)
        db.commit()

        print("==================================================")
        print("[SUCCESS] First Admin User created successfully!")
        print(f"User ID   : {admin_user.id}")
        print(f"Name      : {admin_user.full_name}")
        print(f"Email     : {admin_user.email}")
        print(f"Role      : {admin_user.role.upper()}")
        print(f"Status    : Active")
        print("==================================================")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to create admin user: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
