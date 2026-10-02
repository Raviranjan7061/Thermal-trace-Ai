import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.workers.sync_worker import seed_industrial_facilities_if_empty, run_firms_synchronization
from app.api.routers import (
    health, sync, hotspots, industrial_sites, analytics, alerts, reviews, model, auth, search, watchlists, notifications, authority, admin, feedback, subscriptions
)

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("thermaltrace.main")

def ensure_subscription_schema_updated(target_engine):
    """
    Safely adds missing payment verification columns to the existing 'subscriptions' table
    in an idempotent, non-destructive manner for both SQLite and PostgreSQL.
    """
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(target_engine)
        if "subscriptions" in inspector.get_table_names():
            columns = [col["name"] for col in inspector.get_columns("subscriptions")]
            new_columns = [
                ("subscription_code", "VARCHAR(64)"),
                ("utr_reference", "VARCHAR(100)"),
                ("utr_submitted_at", "TIMESTAMP"),
                ("payment_proof_screenshot", "TEXT"),
                ("resubmit_reason", "TEXT"),
                ("verified_at", "TIMESTAMP"),
                ("verified_by", "VARCHAR(255)")
            ]
            with target_engine.connect() as conn:
                for col_name, col_type in new_columns:
                    if col_name not in columns:
                        logger.info(f"Adding column '{col_name}' to existing 'subscriptions' table...")
                        try:
                            conn.execute(text(f"ALTER TABLE subscriptions ADD COLUMN {col_name} {col_type};"))
                            conn.commit()
                        except Exception as e:
                            logger.warning(f"Could not add column {col_name}: {e}")
    except Exception as exc:
        logger.warning(f"Idempotent schema migration notice: {exc}")

def ensure_user_notification_schema_updated(target_engine):
    """
    Safely adds missing notification_email and email_notifications_enabled columns
    to the existing 'users' table in an idempotent, non-destructive manner for both SQLite and PostgreSQL.
    """
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(target_engine)
        if "users" in inspector.get_table_names():
            columns = [col["name"] for col in inspector.get_columns("users")]
            with target_engine.connect() as conn:
                if "notification_email" not in columns:
                    logger.info("Adding column 'notification_email' to existing 'users' table...")
                    try:
                        conn.execute(text("ALTER TABLE users ADD COLUMN notification_email VARCHAR(255);"))
                        conn.commit()
                    except Exception as e:
                        logger.warning(f"Could not add notification_email column: {e}")
                if "email_notifications_enabled" not in columns:
                    logger.info("Adding column 'email_notifications_enabled' to existing 'users' table...")
                    try:
                        conn.execute(text("ALTER TABLE users ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT FALSE;"))
                        conn.commit()
                    except Exception as e:
                        logger.warning(f"Could not add email_notifications_enabled column: {e}")
    except Exception as exc:
        logger.warning(f"User schema migration notice: {exc}")

# Create database tables and update existing schema
ensure_subscription_schema_updated(engine)
ensure_user_notification_schema_updated(engine)
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} Backend Engine v{settings.VERSION}...")
    
    # 1. Seed Indian Industrial Facilities if empty
    db = SessionLocal()
    try:
        seed_industrial_facilities_if_empty(db)
    finally:
        db.close()

    # 2. Trigger auto sync if configured
    if settings.AUTO_SYNC_ON_STARTUP and settings.NASA_FIRMS_MAP_KEY:
        logger.info("AUTO_SYNC_ON_STARTUP is enabled. Initiating NASA FIRMS synchronization...")
        asyncio.create_task(run_firms_synchronization(trigger_source="Startup Auto-Sync"))
    
    yield
    logger.info("Shutting down ThermalTrace AI Backend Engine...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=f"{settings.PROJECT_SUBTITLE} (SIH Problem Statement {settings.PROBLEM_STATEMENT_ID})",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(sync.router)
app.include_router(hotspots.router)
app.include_router(industrial_sites.router)
app.include_router(analytics.router)
app.include_router(alerts.router)
app.include_router(reviews.router)
app.include_router(model.router)
app.include_router(auth.router)
app.include_router(search.router)
app.include_router(watchlists.router)
app.include_router(notifications.router)
app.include_router(authority.router)
app.include_router(admin.router)
app.include_router(feedback.router)
app.include_router(subscriptions.router)

@app.get("/")
def root_info():
    return {
        "title": settings.PROJECT_NAME,
        "subtitle": settings.PROJECT_SUBTITLE,
        "sih_id": settings.PROBLEM_STATEMENT_ID,
        "status": "Online",
        "documentation": "/docs"
    }
