import axios from 'axios';
import {
  User,
  Hotspot,
  IndustrialFacility,
  Alert,
  AnalystReview,
  AnalyticsOverview,
  DataSourceStatus,
  SystemHealth,
  Watchlist,
  NotificationItem,
  HotspotReplayItem,
  TimelineEvent,
  MultiSatelliteCorrelation,
  SimilarEvent,
  FacilityMonitoringProfile,
  AuthoritySummary,
  AdminAuditLog,
  FeedbackItem,
  FeedbackSummary,
  SubscriptionItem,
  SubscriptionStatusResponse,
  SubscriptionMessage,
  PaymentSubmissionPayload
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach Authorization Bearer token from localStorage
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('thermaltrace_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Authentication & RBAC
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string; user: User }> {
    const res = await client.post<{ access_token: string; token_type: string; user: User }>('/api/auth/login', { email, password });
    return res.data;
  },

  async googleLogin(data: { email: string; full_name?: string; firebase_uid?: string; requested_role?: string }): Promise<{ access_token: string; token_type: string; user: User }> {
    const res = await client.post<{ access_token: string; token_type: string; user: User }>('/api/auth/google', data);
    return res.data;
  },

  async signup(data: { full_name: string; email: string; password: string; role?: string }): Promise<{ access_token: string; token_type: string; user: User }> {
    const res = await client.post<{ access_token: string; token_type: string; user: User }>('/api/auth/signup', data);
    return res.data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await client.get<User>('/api/auth/me');
    return res.data;
  },

  async updateNotificationEmailPreference(enabled: boolean): Promise<User> {
    const res = await client.patch<User>('/api/auth/me/notification-email', { enabled });
    return res.data;
  },

  async logout(): Promise<{ message: string }> {
    try {
      const res = await client.post('/api/auth/logout');
      return res.data;
    } catch {
      return { message: 'Logged out' };
    }
  },

  // Admin User & Role Management
  async getAdminUsers(): Promise<User[]> {
    const res = await client.get<User[]>('/api/admin/users');
    return res.data;
  },

  async createAdminUser(data: { full_name: string; email: string; password: string; role: string }): Promise<User> {
    const res = await client.post<User>('/api/admin/users', data);
    return res.data;
  },

  async updateAdminUser(userId: string, data: { is_active?: boolean; role?: string; full_name?: string }): Promise<User> {
    const res = await client.patch<User>(`/api/admin/users/${userId}`, data);
    return res.data;
  },

  async getAdminAuditLogs(limit = 50): Promise<AdminAuditLog[]> {
    const res = await client.get<AdminAuditLog[]>('/api/admin/audit-logs', { params: { limit } });
    return res.data;
  },

  // System & Health
  async getSystemHealth(): Promise<SystemHealth> {
    const res = await client.get<SystemHealth>('/api/system/health');
    return res.data;
  },

  async getDataSourcesStatus(): Promise<DataSourceStatus[]> {
    const res = await client.get<DataSourceStatus[]>('/api/data-sources/status');
    return res.data;
  },

  // FIRMS Synchronization
  async triggerFirmsSync(): Promise<{ message: string; result: any }> {
    const res = await client.post('/api/sync/firms');
    return res.data;
  },

  // Hotspots & Geospatial
  async getHotspots(params?: {
    skip?: number;
    limit?: number;
    satellite?: string;
    dataset?: string;
    classification?: string;
    confidence_level?: string;
    daynight?: string;
    min_frp?: number;
    max_frp?: number;
    max_industrial_dist_km?: number;
  }): Promise<Hotspot[]> {
    const res = await client.get<Hotspot[]>('/api/hotspots', { params });
    return res.data;
  },

  async getHotspotById(hotspotId: string): Promise<Hotspot> {
    const res = await client.get<Hotspot>(`/api/hotspots/${hotspotId}`);
    return res.data;
  },

  async getHotspotReplayData(): Promise<HotspotReplayItem[]> {
    const res = await client.get<HotspotReplayItem[]>('/api/hotspots/replay');
    return res.data;
  },

  async getHotspotTimeline(hotspotId: string): Promise<TimelineEvent[]> {
    const res = await client.get<TimelineEvent[]>(`/api/hotspots/${hotspotId}/timeline`);
    return res.data;
  },

  async getHotspotHistory(hotspotId: string): Promise<any> {
    const res = await client.get(`/api/hotspots/${hotspotId}/history`);
    return res.data;
  },

  async getHotspotEvidence(hotspotId: string): Promise<any> {
    const res = await client.get(`/api/hotspots/${hotspotId}/evidence`);
    return res.data;
  },

  async getHotspotImagery(hotspotId: string): Promise<any> {
    const res = await client.get(`/api/hotspots/${hotspotId}/imagery`);
    return res.data;
  },

  async getHotspotReport(hotspotId: string): Promise<any> {
    const res = await client.get(`/api/hotspots/${hotspotId}/report`);
    return res.data;
  },

  async getWhyNoAlert(hotspotId: string): Promise<any> {
    const res = await client.get(`/api/hotspots/${hotspotId}/why-no-alert`);
    return res.data;
  },

  async compareHotspots(id1: string, id2: string): Promise<any> {
    const res = await client.get('/api/hotspots/compare', { params: { id1, id2 } });
    return res.data;
  },

  // Search
  async globalSearch(q: string): Promise<any> {
    const res = await client.get('/api/search', { params: { q } });
    return res.data;
  },

  // Notifications
  async getNotifications(unreadOnly = false): Promise<NotificationItem[]> {
    const res = await client.get<NotificationItem[]>('/api/notifications', { params: { unread_only: unreadOnly } });
    return res.data;
  },

  async markAllNotificationsRead(): Promise<any> {
    const res = await client.post('/api/notifications/mark-read');
    return res.data;
  },

  async markNotificationRead(id: string): Promise<any> {
    const res = await client.post(`/api/notifications/${id}/read`);
    return res.data;
  },

  // Watchlists
  async getWatchlists(): Promise<Watchlist[]> {
    const res = await client.get<Watchlist[]>('/api/watchlists');
    return res.data;
  },

  async createWatchlist(data: {
    name: string;
    interest_type?: string;
    latitude?: number;
    longitude?: number;
    radius_km?: number;
    min_lat?: number;
    max_lat?: number;
    min_lon?: number;
    max_lon?: number;
    facility_id?: string;
  }): Promise<Watchlist> {
    const res = await client.post<Watchlist>('/api/watchlists', data);
    return res.data;
  },

  async deleteWatchlist(id: string): Promise<any> {
    const res = await client.delete(`/api/watchlists/${id}`);
    return res.data;
  },

  // Industrial Sites
  async getIndustrialSites(params?: { search?: string; facility_type?: string; state?: string } | string): Promise<IndustrialFacility[]> {
    const queryParams = typeof params === 'string' ? { search: params } : params;
    const res = await client.get<IndustrialFacility[]>('/api/industrial-sites', { params: queryParams });
    return res.data;
  },

  // Operational Analytics
  async getAnalyticsOverview(params?: {
    days?: number;
    satellite?: string;
    classification?: string;
    priority?: string;
    daynight?: string;
  }): Promise<AnalyticsOverview> {
    const res = await client.get<AnalyticsOverview>('/api/analytics/overview', { params });
    return res.data;
  },

  // Alerts
  async getAlerts(params?: { status?: string; priority?: string }): Promise<Alert[]> {
    const res = await client.get<Alert[]>('/api/alerts', { params });
    return res.data;
  },

  async updateAlert(alertId: string, data: { status?: string; assigned_to?: string; analyst_notes?: string }): Promise<Alert> {
    const res = await client.patch<Alert>(`/api/alerts/${alertId}`, data);
    return res.data;
  },

  // Analyst Reviews
  async submitReview(data: {
    hotspot_id: string;
    analyst_classification: string;
    analyst_notes?: string;
    analyst_status: string;
  }): Promise<AnalystReview> {
    const res = await client.post<AnalystReview>('/api/reviews', data);
    return res.data;
  },

  async getReviews(): Promise<AnalystReview[]> {
    const res = await client.get<AnalystReview[]>('/api/reviews');
    return res.data;
  },

  // Model Intelligence
  async getModelInfo(): Promise<any> {
    const res = await client.get('/api/model/info');
    return res.data;
  },

  // Multi-Satellite Correlation
  async getMultiSatelliteCorrelation(hotspotId: string): Promise<MultiSatelliteCorrelation> {
    const res = await client.get<MultiSatelliteCorrelation>(`/api/hotspots/${hotspotId}/multi-satellite`);
    return res.data;
  },

  // Similar Historical Events
  async getSimilarEvents(hotspotId: string): Promise<SimilarEvent[]> {
    const res = await client.get<SimilarEvent[]>(`/api/hotspots/${hotspotId}/similar`);
    return res.data;
  },

  // Facility Monitoring Profile
  async getFacilityProfile(facilityId: string, days = 30): Promise<FacilityMonitoringProfile> {
    const res = await client.get<FacilityMonitoringProfile>(`/api/industrial-sites/${facilityId}/profile`, { params: { days } });
    return res.data;
  },

  // Authority Monitoring Dashboard
  async getAuthoritySummary(): Promise<AuthoritySummary> {
    const res = await client.get<AuthoritySummary>('/api/authority/summary');
    return res.data;
  },

  async getAuthorityAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
    const res = await client.get<AdminAuditLog[]>('/api/authority/audit-logs', { params: { limit } });
    return res.data;
  },

  // Feedback & Issue Reporting
  async submitFeedback(data: {
    category: string;
    title: string;
    description: string;
    priority?: string;
    screenshot_data?: string;
  }): Promise<FeedbackItem> {
    const res = await client.post<FeedbackItem>('/api/feedback', data);
    return res.data;
  },

  async getMyFeedback(): Promise<FeedbackItem[]> {
    const res = await client.get<FeedbackItem[]>('/api/feedback/my');
    return res.data;
  },

  async getAdminFeedbackInbox(): Promise<FeedbackItem[]> {
    const res = await client.get<FeedbackItem[]>('/api/feedback');
    return res.data;
  },

  async getAdminFeedbackSummary(): Promise<FeedbackSummary> {
    const res = await client.get<FeedbackSummary>('/api/feedback/summary');
    return res.data;
  },

  async updateFeedbackStatus(id: string, data: { status: string; admin_notes?: string }): Promise<FeedbackItem> {
    const res = await client.patch<FeedbackItem>(`/api/feedback/${id}/status`, data);
    return res.data;
  },

  async requestSubscription(payload: { plan_id?: string; plan?: string; notes?: string } | string): Promise<SubscriptionItem> {
    const planId = typeof payload === 'string' ? payload : (payload.plan_id || payload.plan || '');
    const res = await client.post<SubscriptionItem>('/api/subscriptions/request', { plan_id: planId });
    return res.data;
  },

  async changeSubscriptionPlan(payload: { plan_id?: string; plan?: string } | string): Promise<SubscriptionItem> {
    const planId = typeof payload === 'string' ? payload : (payload.plan_id || payload.plan || '');
    const res = await client.put<SubscriptionItem>('/api/subscriptions/change-plan', { plan_id: planId });
    return res.data;
  },

  async getMySubscriptionStatus(): Promise<SubscriptionStatusResponse> {
    const res = await client.get<SubscriptionStatusResponse>('/api/subscriptions/my-status');
    return res.data;
  },

  async getAdminSubscriptions(statusFilter?: string): Promise<SubscriptionItem[]> {
    const params = statusFilter ? { status: statusFilter } : {};
    const res = await client.get<SubscriptionItem[]>('/api/admin/subscriptions', { params });
    return res.data;
  },

  async approveSubscription(subscriptionId: string): Promise<SubscriptionItem> {
    const res = await client.post<SubscriptionItem>(`/api/admin/subscriptions/${subscriptionId}/approve`);
    return res.data;
  },

  async rejectSubscription(subscriptionId: string, data?: { rejection_reason?: string } | string): Promise<SubscriptionItem> {
    const payload = typeof data === 'string' ? { rejection_reason: data } : (data || {});
    const res = await client.post<SubscriptionItem>(`/api/admin/subscriptions/${subscriptionId}/reject`, payload);
    return res.data;
  },

  async startPaymentConversation(subscriptionId: string): Promise<SubscriptionItem> {
    const res = await client.post<SubscriptionItem>(`/api/subscriptions/${subscriptionId}/start-conversation`);
    return res.data;
  },

  async getSubscriptionMessages(subscriptionId: string): Promise<SubscriptionMessage[]> {
    const res = await client.get<SubscriptionMessage[]>(`/api/subscriptions/${subscriptionId}/messages`);
    return res.data;
  },

  async sendSubscriptionMessage(subscriptionId: string, messageText: string): Promise<SubscriptionMessage> {
    const res = await client.post<SubscriptionMessage>(`/api/subscriptions/${subscriptionId}/messages`, { message_text: messageText });
    return res.data;
  },

  async submitPaymentInfo(subscriptionId: string, payload: PaymentSubmissionPayload): Promise<SubscriptionItem> {
    const res = await client.post<SubscriptionItem>(`/api/subscriptions/${subscriptionId}/submit-payment`, payload);
    return res.data;
  },

  async requestPaymentResubmit(subscriptionId: string, resubmitReason: string): Promise<SubscriptionItem> {
    const res = await client.post<SubscriptionItem>(`/api/subscriptions/${subscriptionId}/request-resubmit`, { resubmit_reason: resubmitReason });
    return res.data;
  },

  async verifyAndActivatePayment(subscriptionId: string): Promise<SubscriptionItem> {
    const res = await client.post<SubscriptionItem>(`/api/subscriptions/${subscriptionId}/verify-and-activate`);
    return res.data;
  },

  async cancelSubscriptionRequest(subscriptionId: string): Promise<SubscriptionItem> {
    const res = await client.post<SubscriptionItem>(`/api/subscriptions/${subscriptionId}/cancel`);
    return res.data;
  }
};

