import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Float, Integer, DateTime, Boolean, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="analyst", nullable=False) # admin, analyst, authority
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    reviews = relationship("AnalystReview", back_populates="user")

class Hotspot(Base):
    __tablename__ = "hotspots"
    
    hotspot_id = Column(String(64), primary_key=True, default=generate_uuid)
    deduplication_hash = Column(String(64), unique=True, nullable=False, index=True)
    source = Column(String(100), default="NASA FIRMS", nullable=False)
    source_dataset = Column(String(100), nullable=False, index=True) # VIIRS_NOAA20_NRT, VIIRS_NOAA21_NRT
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    acquisition_datetime = Column(DateTime, nullable=False, index=True)
    satellite = Column(String(50), nullable=False)
    instrument = Column(String(50), nullable=False)
    brightness_ti4 = Column(Float, nullable=True)
    brightness_ti5 = Column(Float, nullable=True)
    frp = Column(Float, nullable=True, index=True)
    confidence = Column(String(50), nullable=True) # n, l, h, or numeric string
    daynight = Column(String(10), nullable=True) # D, N
    scan = Column(Float, nullable=True)
    track = Column(Float, nullable=True)
    cluster_id = Column(String(64), nullable=True, index=True)
    raw_source_record = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    # Relationships
    land_context = relationship("LandContext", back_populates="hotspot", uselist=False, cascade="all, delete-orphan")
    classification = relationship("ClassificationResult", back_populates="hotspot", uselist=False, cascade="all, delete-orphan")
    reviews = relationship("AnalystReview", back_populates="hotspot", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="hotspot", cascade="all, delete-orphan")

class IndustrialFacility(Base):
    __tablename__ = "industrial_facilities"
    
    facility_id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    facility_type = Column(String(100), nullable=False, index=True) # refinery, power_plant, petrochemical, steel_plant, lng_facility, industrial_park, mine
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    operator_owner = Column(String(255), nullable=True)
    source_dataset = Column(String(255), nullable=False, default="OpenStreetMap & Global Energy Infrastructure Registry")
    raw_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)

class LandContext(Base):
    __tablename__ = "land_context"
    
    land_id = Column(String(64), primary_key=True, default=generate_uuid)
    hotspot_id = Column(String(64), ForeignKey("hotspots.hotspot_id", ondelete="CASCADE"), nullable=False, unique=True)
    land_cover_class = Column(String(100), nullable=False, default="Unknown") # built-up, industrial, forest, cropland, grassland, water, bare land, Unknown
    source = Column(String(255), default="Copernicus & OSM Land-Use Registry")
    observation_date = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    hotspot = relationship("Hotspot", back_populates="land_context")

class TemporalFeature(Base):
    __tablename__ = "temporal_features"
    
    feature_id = Column(String(64), primary_key=True, default=generate_uuid)
    cluster_id = Column(String(64), nullable=False, unique=True, index=True)
    detection_count_7d = Column(Integer, default=1)
    detection_count_30d = Column(Integer, default=1)
    detection_count_90d = Column(Integer, default=1)
    avg_frp = Column(Float, nullable=True)
    max_frp = Column(Float, nullable=True)
    median_frp = Column(Float, nullable=True)
    frp_variance = Column(Float, nullable=True)
    recurrence_frequency = Column(Float, default=0.0) # detections per day
    persistence_score = Column(Float, default=0.0) # 0 to 1 score
    first_observed = Column(DateTime, nullable=True)
    last_observed = Column(DateTime, nullable=True)
    daynight_ratio = Column(Float, default=0.5)
    baseline_frp = Column(Float, nullable=True)
    baseline_deviation = Column(Float, default=0.0) # Z-score or multiplier
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class ClassificationResult(Base):
    __tablename__ = "classification_results"
    
    classification_id = Column(String(64), primary_key=True, default=generate_uuid)
    hotspot_id = Column(String(64), ForeignKey("hotspots.hotspot_id", ondelete="CASCADE"), nullable=False, unique=True)
    cluster_id = Column(String(64), nullable=True, index=True)
    probable_classification = Column(String(100), nullable=False) # Industrial Fire, Persistent Gas Flare, Wildfire, Crop Burning, Industrial/Mining Thermal Activity, Other Thermal Source, Unknown
    confidence_score = Column(Float, nullable=False) # 0.0 to 1.0
    confidence_level = Column(String(50), nullable=False) # High confidence, Moderate confidence, Low confidence, Insufficient evidence
    classification_mode = Column(String(100), nullable=False) # Evidence-based preliminary classification, Trained XGBoost Model v1.0
    nearest_facility_id = Column(String(64), nullable=True)
    nearest_facility_name = Column(String(255), nullable=True)
    distance_to_nearest_facility_km = Column(Float, nullable=True)
    nearest_facility_type = Column(String(100), nullable=True)
    facilities_within_1km = Column(Integer, default=0)
    facilities_within_5km = Column(Integer, default=0)
    facilities_within_10km = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)

    hotspot = relationship("Hotspot", back_populates="classification")
    evidence = relationship("ClassificationEvidence", back_populates="classification", uselist=False, cascade="all, delete-orphan")

class ClassificationEvidence(Base):
    __tablename__ = "classification_evidence"
    
    evidence_id = Column(String(64), primary_key=True, default=generate_uuid)
    classification_id = Column(String(64), ForeignKey("classification_results.classification_id", ondelete="CASCADE"), nullable=False, unique=True)
    supporting_evidence = Column(JSON, nullable=False) # list of string points
    contradictory_evidence = Column(JSON, nullable=False) # list of string points
    feature_contributions = Column(JSON, nullable=True) # dict of feature -> score
    created_at = Column(DateTime, default=utc_now)

    classification = relationship("ClassificationResult", back_populates="evidence")

class AnalystReview(Base):
    __tablename__ = "analyst_reviews"
    
    review_id = Column(String(64), primary_key=True, default=generate_uuid)
    hotspot_id = Column(String(64), ForeignKey("hotspots.hotspot_id", ondelete="CASCADE"), nullable=False)
    original_classification = Column(String(100), nullable=False)
    analyst_classification = Column(String(100), nullable=False)
    analyst_notes = Column(Text, nullable=True)
    analyst_status = Column(String(50), nullable=False, default="Confirmed") # Confirmed, Changed, Marked Uncertain, Field Verification Requested
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewer_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    hotspot = relationship("Hotspot", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

class Alert(Base):
    __tablename__ = "alerts"
    
    alert_id = Column(String(64), primary_key=True, default=generate_uuid)
    hotspot_id = Column(String(64), ForeignKey("hotspots.hotspot_id", ondelete="CASCADE"), nullable=False)
    priority = Column(String(50), default="MODERATE", nullable=False) # LOW, MODERATE, HIGH, CRITICAL
    severity = Column(String(50), nullable=False) # Low, Moderate, High, Critical
    alert_type = Column(String(100), nullable=False) # New Industrial-Area Anomaly, Baseline FRP Deviation, Rapid FRP Increase, New Source at Inactive Location, Persistent Unresolved Source
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="NEW", nullable=False) # NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED, DISMISSED
    assigned_to = Column(String(255), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    analyst_notes = Column(Text, nullable=True)
    trigger_details = Column(JSON, nullable=True)
    evidence_quality = Column(String(50), default="MODERATE", nullable=True) # STRONG, MODERATE, LIMITED, INSUFFICIENT
    why_priority = Column(JSON, nullable=True) # List of bullet point strings
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    hotspot = relationship("Hotspot", back_populates="alerts")

class Watchlist(Base):
    __tablename__ = "watchlists"
    
    watchlist_id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    interest_type = Column(String(50), nullable=False, default="radius_point") # radius_point, industrial_site, region, bounding_box
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    radius_km = Column(Float, default=10.0)
    min_lat = Column(Float, nullable=True)
    max_lat = Column(Float, nullable=True)
    min_lon = Column(Float, nullable=True)
    max_lon = Column(Float, nullable=True)
    facility_id = Column(String(64), nullable=True)
    created_by = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

class Notification(Base):
    __tablename__ = "notifications"
    
    notification_id = Column(String(64), primary_key=True, default=generate_uuid)
    notification_type = Column(String(100), nullable=False) # alert_triggered, watchlist_matched, sync_completed, analyst_action
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), default="info") # info, warning, high, critical
    related_entity_type = Column(String(50), nullable=True) # hotspot, alert, watchlist, sync
    related_entity_id = Column(String(64), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=utc_now, index=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    audit_id = Column(String(64), primary_key=True, default=generate_uuid)
    action = Column(String(100), nullable=False, index=True) # login, review_submitted, classification_changed, alert_acknowledged, alert_investigating, alert_resolved, note_added, watchlist_created
    actor_email = Column(String(255), nullable=True, index=True)
    entity_type = Column(String(50), nullable=False) # hotspot, alert, review, watchlist
    entity_id = Column(String(64), nullable=False, index=True)
    previous_state = Column(Text, nullable=True)
    new_state = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True)

class SyncRun(Base):
    __tablename__ = "sync_runs"
    
    run_id = Column(String(64), primary_key=True, default=generate_uuid)
    attempted_at = Column(DateTime, default=utc_now, index=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=False) # Success, Partial, Failed, In Progress
    dataset = Column(String(100), nullable=False)
    observations_received = Column(Integer, default=0)
    observations_inserted = Column(Integer, default=0)
    duplicates_skipped = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    sync_trigger = Column(String(50), default="Scheduled") # Scheduled, Manual, System Init

class ModelVersion(Base):
    __tablename__ = "model_versions"
    
    version_id = Column(String(64), primary_key=True, default=generate_uuid)
    model_name = Column(String(100), nullable=False)
    version_tag = Column(String(50), nullable=False)
    trained_at = Column(DateTime, default=utc_now)
    metrics_json = Column(JSON, nullable=True)
    feature_list = Column(JSON, nullable=True)
    dataset_info = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)

class FeedbackItem(Base):
    __tablename__ = "feedback_items"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    submitter_email = Column(String(255), nullable=False, index=True)
    submitter_role = Column(String(50), nullable=False, default="user") # user, analyst, authority, admin
    category = Column(String(100), nullable=False) # Bug, UI/UX Issue, Data Issue, Feature Suggestion, Performance Issue, Other
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="Medium", nullable=False) # Low, Medium, High
    screenshot_data = Column(Text, nullable=True) # Optional Base64 image data URL
    status = Column(String(50), default="NEW", nullable=False, index=True) # NEW, IN_REVIEW, RESOLVED
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_email = Column(String(255), nullable=False, index=True)
    plan_id = Column(String(50), nullable=False) # monthly, six_months, yearly
    plan_name = Column(String(100), nullable=False) # Monthly, 6 Months, Yearly
    price_inr = Column(Integer, nullable=False) # 400, 2400, 4800
    status = Column(String(50), default="PENDING", nullable=False, index=True) # PENDING, ACTIVE, REJECTED, EXPIRED, CANCELLED
    requested_at = Column(DateTime, default=utc_now, index=True)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(String(255), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    subscription_start = Column(DateTime, nullable=True)
    subscription_expiry = Column(DateTime, nullable=True, index=True)
    subscription_code = Column(String(64), nullable=True, unique=True, index=True)
    utr_reference = Column(String(100), nullable=True, index=True)
    utr_submitted_at = Column(DateTime, nullable=True)
    payment_proof_screenshot = Column(Text, nullable=True)
    resubmit_reason = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User")
    messages = relationship("SubscriptionMessage", back_populates="subscription", cascade="all, delete-orphan", order_by="SubscriptionMessage.created_at.asc()")


class SubscriptionMessage(Base):
    __tablename__ = "subscription_messages"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    sender_email = Column(String(255), nullable=True)
    sender_role = Column(String(50), nullable=False, default="user") # user, admin, system
    message_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now, index=True)

    subscription = relationship("Subscription", back_populates="messages")
    sender = relationship("User")

