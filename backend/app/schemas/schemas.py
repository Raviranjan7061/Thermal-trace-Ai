from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    role: str = "analyst"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class HotspotBase(BaseModel):
    source: str
    source_dataset: str
    latitude: float
    longitude: float
    acquisition_datetime: datetime
    satellite: str
    instrument: str
    brightness_ti4: Optional[float] = None
    brightness_ti5: Optional[float] = None
    frp: Optional[float] = None
    confidence: Optional[str] = None
    daynight: Optional[str] = None
    scan: Optional[float] = None
    track: Optional[float] = None

class HotspotResponse(HotspotBase):
    hotspot_id: str
    cluster_id: Optional[str] = None
    deduplication_hash: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class IndustrialFacilityResponse(BaseModel):
    facility_id: str
    name: str
    facility_type: str
    latitude: float
    longitude: float
    state: Optional[str] = None
    district: Optional[str] = None
    operator_owner: Optional[str] = None
    source_dataset: str

    model_config = ConfigDict(from_attributes=True)

class LandContextResponse(BaseModel):
    land_id: str
    land_cover_class: str
    source: str
    observation_date: Optional[str] = None
    confidence: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class ClassificationEvidenceResponse(BaseModel):
    supporting_evidence: List[str]
    contradictory_evidence: List[str]
    feature_contributions: Optional[Dict[str, float]] = None

    model_config = ConfigDict(from_attributes=True)

class ClassificationResultResponse(BaseModel):
    classification_id: str
    hotspot_id: str
    cluster_id: Optional[str] = None
    probable_classification: str
    confidence_score: float
    confidence_level: str
    classification_mode: str
    nearest_facility_id: Optional[str] = None
    nearest_facility_name: Optional[str] = None
    distance_to_nearest_facility_km: Optional[float] = None
    nearest_facility_type: Optional[str] = None
    facilities_within_1km: int = 0
    facilities_within_5km: int = 0
    facilities_within_10km: int = 0
    created_at: datetime
    evidence: Optional[ClassificationEvidenceResponse] = None

    model_config = ConfigDict(from_attributes=True)

class HotspotDetailResponse(HotspotResponse):
    land_context: Optional[LandContextResponse] = None
    classification: Optional[ClassificationResultResponse] = None

    model_config = ConfigDict(from_attributes=True)

class AnalystReviewCreate(BaseModel):
    hotspot_id: str
    analyst_classification: str
    analyst_notes: Optional[str] = None
    analyst_status: str = "Confirmed"

class AnalystReviewResponse(BaseModel):
    review_id: str
    hotspot_id: str
    original_classification: str
    analyst_classification: str
    analyst_notes: Optional[str] = None
    analyst_status: str
    reviewer_email: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AlertUpdate(BaseModel):
    status: Optional[str] = None # NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED, DISMISSED
    assigned_to: Optional[str] = None
    analyst_notes: Optional[str] = None

class AlertResponse(BaseModel):
    alert_id: str
    hotspot_id: str
    priority: str = "MODERATE"
    severity: str
    alert_type: str
    title: str
    description: str
    status: str
    assigned_to: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    analyst_notes: Optional[str] = None
    trigger_details: Optional[Dict[str, Any]] = None
    evidence_quality: Optional[str] = "MODERATE"
    why_priority: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    hotspot: Optional[HotspotResponse] = None

    model_config = ConfigDict(from_attributes=True)

class WatchlistCreate(BaseModel):
    name: str
    interest_type: str = "radius_point" # radius_point, industrial_site, region, bounding_box
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: float = 10.0
    min_lat: Optional[float] = None
    max_lat: Optional[float] = None
    min_lon: Optional[float] = None
    max_lon: Optional[float] = None
    facility_id: Optional[str] = None

class WatchlistResponse(BaseModel):
    watchlist_id: str
    name: str
    interest_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: float
    min_lat: Optional[float] = None
    max_lat: Optional[float] = None
    min_lon: Optional[float] = None
    max_lon: Optional[float] = None
    facility_id: Optional[str] = None
    created_by: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationResponse(BaseModel):
    notification_id: str
    notification_type: str
    title: str
    message: str
    severity: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuditLogResponse(BaseModel):
    audit_id: str
    action: str
    actor_email: Optional[str] = None
    entity_type: str
    entity_id: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class HotspotReplayItem(BaseModel):
    hotspot_id: str
    latitude: float
    longitude: float
    acquisition_datetime: datetime
    frp: Optional[float] = None
    satellite: str
    cluster_id: Optional[str] = None
    probable_classification: Optional[str] = None

class SyncRunResponse(BaseModel):
    run_id: str
    attempted_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    dataset: str
    observations_received: int
    observations_inserted: int
    duplicates_skipped: int
    error_message: Optional[str] = None
    sync_trigger: str

    model_config = ConfigDict(from_attributes=True)

class KPITrendItem(BaseModel):
    status: Optional[str] = None
    trend_text: Optional[str] = None
    trend_color: str
    trend_pct: Optional[float] = None
    trend_percent: Optional[float] = None
    trend_direction: str
    current_period: int = 0
    previous_period: int = 0
    series: List[int] = []

class KPITrendsResponse(BaseModel):
    thermal_detections: KPITrendItem
    industrial_candidates: KPITrendItem
    natural_fire_candidates: KPITrendItem
    needs_review: KPITrendItem

class AnalyticsOverview(BaseModel):
    total_detections: int
    active_anomalies_count: int = 0
    avg_frp: Optional[float] = None
    baseline_expected_mean: Optional[float] = None
    high_critical_count: int = 0
    persistent_sources_count: int = 0
    sudden_events_count: int = 0
    needs_review_count: int = 0
    industrial_candidates: int = 0
    natural_fire_candidates: int = 0
    last_sync_timestamp: Optional[datetime] = None
    time_series: List[Dict[str, Any]] = []
    kpi_trends: Optional[KPITrendsResponse] = None
    classification_breakdown: Dict[str, int] = {}
    avg_frp_by_classification: Dict[str, float] = {}
    persistent_vs_sudden: Dict[str, Any] = {}
    satellites_breakdown: Dict[str, Any] = {}
    daynight_breakdown: Dict[str, Any] = {}
    top_anomalies: List[Dict[str, Any]] = []
    data_freshness: Dict[str, Any] = {}

class FeedbackCreate(BaseModel):
    category: str
    title: str
    description: str
    priority: Optional[str] = "Medium"
    screenshot_data: Optional[str] = None

class FeedbackStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    submitter_email: str
    submitter_role: str
    category: str
    title: str
    description: str
    priority: str
    screenshot_data: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FeedbackSummaryResponse(BaseModel):
    total: int
    new_count: int
    in_review_count: int
    resolved_count: int
    items: List[FeedbackResponse] = []

class SubscriptionMessageCreatePayload(BaseModel):
    message_text: str

class SubscriptionMessageResponse(BaseModel):
    id: str
    subscription_id: str
    sender_id: Optional[str] = None
    sender_email: Optional[str] = None
    sender_role: str
    message_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaymentSubmissionPayload(BaseModel):
    utr_reference: str
    payment_proof_screenshot: Optional[str] = None

class SubscriptionResubmitPayload(BaseModel):
    resubmit_reason: str

class SubscriptionRequestPayload(BaseModel):
    plan_id: str

class SubscriptionApprovePayload(BaseModel):
    pass

class SubscriptionRejectPayload(BaseModel):
    rejection_reason: Optional[str] = None

class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    plan_id: str
    plan_name: str
    price_inr: int
    status: str
    subscription_code: Optional[str] = None
    utr_reference: Optional[str] = None
    utr_submitted_at: Optional[datetime] = None
    payment_proof_screenshot: Optional[str] = None
    resubmit_reason: Optional[str] = None
    requested_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    subscription_start: Optional[datetime] = None
    subscription_expiry: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SubscriptionStatusResponse(BaseModel):
    is_premium_active: bool
    status: str
    active_subscription: Optional[SubscriptionResponse] = None
    latest_subscription: Optional[SubscriptionResponse] = None

