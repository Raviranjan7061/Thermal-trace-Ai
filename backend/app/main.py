import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.workers.sync_worker import seed_industrial_facilities_if_empty, run_firms_synchronization
from app.api.routers import (
    health, sync, hotspots, industrial_sites, analytics, alerts, reviews, model, auth, search, watchlists, notifications, authority, admin, feedback
)

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("thermaltrace.main")

# Create database tables
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

@app.get("/")
def root_info():
    return {
        "title": settings.PROJECT_NAME,
        "subtitle": settings.PROJECT_SUBTITLE,
        "sih_id": settings.PROBLEM_STATEMENT_ID,
        "status": "Online",
        "documentation": "/docs"
    }
