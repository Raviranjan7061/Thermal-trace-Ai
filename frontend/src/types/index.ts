export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminAuditLog {
  audit_id: string;
  action: string;
  actor_email?: string;
  entity_type: string;
  entity_id: string;
  details?: any;
  timestamp: string;
}

export interface LandContext {
  land_id: string;
  land_cover_class: string;
  source: string;
  observation_date?: string;
  confidence?: number;
}

export interface ClassificationEvidence {
  supporting_evidence: string[];
  contradictory_evidence: string[];
  feature_contributions?: Record<string, number>;
}

export interface ClassificationResult {
  classification_id: string;
  hotspot_id: string;
  cluster_id?: string;
  probable_classification: string;
  confidence_score: number;
  confidence_level: string;
  classification_mode: string;
  nearest_facility_id?: string;
  nearest_facility_name?: string;
  distance_to_nearest_facility_km?: number;
  nearest_facility_type?: string;
  facilities_within_1km: number;
  facilities_within_5km: number;
  facilities_within_10km: number;
  created_at: string;
  evidence?: ClassificationEvidence;
}

export interface Hotspot {
  hotspot_id: string;
  source: string;
  source_dataset: string;
  latitude: number;
  longitude: number;
  acquisition_datetime: string;
  satellite: string;
  instrument: string;
  brightness_ti4?: number;
  brightness_ti5?: number;
  frp?: number;
  confidence?: string;
  daynight?: string;
  scan?: number;
  track?: number;
  cluster_id?: string;
  deduplication_hash: string;
  created_at: string;
  land_context?: LandContext;
  classification?: ClassificationResult;
}

export interface IndustrialFacility {
  facility_id: string;
  name: string;
  facility_type: string;
  latitude: number;
  longitude: number;
  state?: string;
  district?: string;
  operator_owner?: string;
  source_dataset: string;
}

export interface Alert {
  alert_id: string;
  hotspot_id: string;
  priority: string; // LOW, MODERATE, HIGH, CRITICAL
  severity: string; // Low, Moderate, High, Critical
  alert_type: string;
  title: string;
  description: string;
  status: string; // NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED, DISMISSED
  assigned_to?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  analyst_notes?: string;
  trigger_details?: Record<string, any>;
  evidence_quality?: string; // STRONG, MODERATE, LIMITED, INSUFFICIENT
  why_priority?: string[];
  created_at: string;
  updated_at: string;
  hotspot?: Hotspot;
}

export interface Watchlist {
  watchlist_id: string;
  name: string;
  interest_type: string;
  latitude?: number;
  longitude?: number;
  radius_km: number;
  min_lat?: number;
  max_lat?: number;
  min_lon?: number;
  max_lon?: number;
  facility_id?: string;
  created_by?: string;
  is_active: boolean;
  created_at: string;
}

export interface NotificationItem {
  notification_id: string;
  notification_type: string;
  title: string;
  message: string;
  severity: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  audit_id: string;
  action: string;
  actor_email?: string;
  entity_type: string;
  entity_id: string;
  previous_state?: string;
  new_state?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface HotspotReplayItem {
  hotspot_id: string;
  latitude: number;
  longitude: number;
  acquisition_datetime: string;
  frp?: number;
  satellite: string;
  cluster_id?: string;
  probable_classification?: string;
}

export interface TimelineEvent {
  timestamp: string;
  event_type: string;
  title: string;
  description: string;
}

export interface AnalystReview {
  review_id: string;
  hotspot_id: string;
  original_classification: string;
  analyst_classification: string;
  analyst_notes?: string;
  analyst_status: string;
  reviewer_email?: string;
  created_at: string;
}

export interface KPITrendItem {
  status?: string;
  trend_text: string;
  trend_color: string;
  trend_pct?: number | null;
  trend_percent?: number | null;
  trend_direction: string;
  current_period?: number;
  previous_period?: number;
  series: number[];
}

export interface KPITrendsResponse {
  thermal_detections: KPITrendItem;
  industrial_candidates: KPITrendItem;
  natural_fire_candidates: KPITrendItem;
  needs_review: KPITrendItem;
}

export interface AnalyticsOverview {
  total_detections: number;
  active_anomalies_count: number;
  avg_frp?: number;
  baseline_expected_mean?: number;
  high_critical_count: number;
  persistent_sources_count: number;
  sudden_events_count: number;
  needs_review_count: number;
  industrial_candidates: number;
  natural_fire_candidates: number;
  last_sync_timestamp?: string;
  time_series: Array<{ date: string; detection_count: number; avg_frp: number }>;
  kpi_trends?: KPITrendsResponse;
  classification_breakdown: Record<string, number>;
  avg_frp_by_classification: Record<string, number>;
  persistent_vs_sudden: { persistent_count: number; sudden_count: number; persistent_pct: number; sudden_pct: number };
  satellites_breakdown: { noaa20_count: number; noaa21_count: number; noaa20_pct: number; noaa21_pct: number };
  daynight_breakdown: { day_count: number; night_count: number; day_pct: number; night_pct: number };
  top_anomalies: Array<{
    event_id: string;
    hotspot_id: string;
    location: string;
    current_frp: string;
    baseline: string;
    deviation: string;
    classification: string;
    priority: string;
    status: string;
    detected: string;
  }>;
  data_freshness: {
    firms_status: string;
    last_sync: string;
    latest_obs: string;
    noaa20_latest: string;
    noaa21_latest: string;
    total_db_records: number;
    period_label: string;
  };
}

export interface DataSourceStatus {
  name: string;
  purpose: string;
  status: string;
  last_sync?: string;
  records_loaded: number;
  attribution: string;
  known_limitations: string;
}

export interface SystemHealth {
  status: string;
  backend_api: string;
  database: {
    status: string;
    engine: string;
    hotspots_stored: number;
    facilities_stored: number;
  };
  firms_integration: {
    configured: boolean;
    map_key_present: boolean;
    last_attempted_sync?: string;
    last_sync_status: string;
    last_observations_inserted: number;
  };
}

export interface MultiSatelliteCorrelation {
  target_hotspot_id: string;
  target_satellite: string;
  target_acq_datetime: string;
  target_frp?: number;
  correlation_strength: 'Strong' | 'Moderate' | 'None';
  summary_wording: string;
  supporting_observations: number;
  correlated_observations: Array<{
    hotspot_id: string;
    satellite: string;
    instrument: string;
    acquisition_datetime: string;
    frp?: number;
    distance_km: number;
    latitude: number;
    longitude: number;
  }>;
}

export interface SimilarEvent {
  hotspot_id: string;
  acquisition_datetime: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  frp: number;
  classification: string;
  priority: string;
  final_status: string;
  similarity_explanation: string;
}

export interface FacilityMonitoringProfile {
  facility_id: string;
  name: string;
  facility_type: string;
  latitude: number;
  longitude: number;
  state: string;
  district: string;
  operator_owner: string;
  timeframe_days: number;
  nearby_observations_count: number;
  avg_frp: number;
  max_frp: number;
  active_alerts_count: number;
  recent_observations: Array<{
    hotspot_id: string;
    acquisition_datetime: string;
    frp?: number;
    satellite: string;
    brightness_ti4?: number;
    daynight?: string;
  }>;
}

export interface AuthoritySummary {
  title: string;
  total_alerts: number;
  critical_priority: number;
  high_priority: number;
  investigating_cases: number;
  resolved_cases: number;
  priority_incidents: Array<{
    alert_id: string;
    event_id: string;
    hotspot_id: string;
    title: string;
    location: string;
    priority: string;
    status: string;
    classification: string;
    frp: string;
    created_at: string;
  }>;
  audit_trail?: Array<{
    audit_id: string;
    action: string;
    actor_email?: string;
    entity_type: string;
    entity_id: string;
    details?: any;
    timestamp: string;
  }>;
  last_update?: string;
}

export interface FeedbackItem {
  id: string;
  user_id?: string | null;
  submitter_email: string;
  submitter_role: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  screenshot_data?: string | null;
  status: string;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackSummary {
  total: number;
  new_count: number;
  in_review_count: number;
  resolved_count: number;
  items?: FeedbackItem[];
}

