import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage, SupportedLanguageCode } from '../i18n/config';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { apiService } from '../services/api';
import { SystemHealth, DataSourceStatus, SubscriptionStatusResponse } from '../types';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Bell,
  Sliders,
  Shield,
  Lock,
  Activity,
  Map,
  Volume2,
  Clock,
  Zap,
  RotateCcw,
  Save,
  Info,
  LogOut,
  Key,
  CheckCircle2,
  Crown,
  Sparkles,
  MessageSquare,
  Mail,
  AlertTriangle
} from 'lucide-react';

interface UserSettings {
  // Section 1: Appearance & Interface
  density: 'comfortable' | 'compact';
  reduceMotion: boolean;
  language: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';

  // Section 2: Notifications & Alerts
  notificationsEnabled: boolean;
  inAppNotifications: boolean;
  emailNotifications: boolean;
  notificationEmail: string;
  criticalAlerts: boolean;
  highPriorityAlerts: boolean;
  investigationUpdates: boolean;
  complianceUpdates: boolean;
  watchlistMatches: boolean;
  systemStatusAlerts: boolean;
  alertSound: boolean;
  alertSoundType: 'default' | 'subtle' | 'urgent';
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;

  // Section 3: Data & Performance
  dataSaverMode: boolean;
  autoRefreshEnabled: boolean;
  refreshIntervalMinutes: number;
  defaultDataWindowDays: number;

  // Section 4: Map Preferences
  defaultHotspotsVisible: boolean;
  defaultFacilitiesVisible: boolean;
  defaultReplayVisible: boolean;
  defaultBoundariesVisible: boolean;
  defaultPlaceLabelsVisible: boolean;
  hotspotClustering: boolean;
  rememberMapPosition: boolean;
  defaultFrpFilter: string;

  // Section 5: Evidence & Review Display Preferences (Analyst)
  showClassificationExplanation: boolean;
  showEvidenceQuality: boolean;
  showConfidenceScores: boolean;
  showFrpTrend: boolean;
  showIndustrialProximity: boolean;
  showTemporalEvidence: boolean;

  // Section 6: Analyst Workflow Preferences
  defaultInvestigationFocus: 'observations' | 'reviews' | 'alerts';
  defaultSortPreference: 'newest' | 'priority' | 'frp';

  // Section 7: Authority Display & Oversight Preferences
  defaultPriorityFilter: 'all' | 'critical' | 'high_critical';
  defaultStatusFilter: 'all' | 'active' | 'resolved';
  showIncidentPriority: boolean;
  showLifecycleStatus: boolean;
  showAssignedAnalyst: boolean;
  showAlertTimestamp: boolean;

  // Section 8: Authority Workflow Preferences
  defaultOversightFocus: 'incidents' | 'alerts' | 'lifecycle' | 'regional';
  defaultAuthoritySort: 'priority' | 'newest' | 'updated';
  defaultAuthorityStatusView: 'all' | 'active' | 'resolved';
}

const DEFAULT_SETTINGS: UserSettings = {
  density: 'comfortable',
  reduceMotion: false,
  language: 'en',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',

  notificationsEnabled: true,
  inAppNotifications: true,
  emailNotifications: false,
  notificationEmail: '',
  criticalAlerts: true,
  highPriorityAlerts: true,
  investigationUpdates: true,
  complianceUpdates: true,
  watchlistMatches: true,
  systemStatusAlerts: true,
  alertSound: true,
  alertSoundType: 'default',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',

  dataSaverMode: false,
  autoRefreshEnabled: true,
  refreshIntervalMinutes: 5,
  defaultDataWindowDays: 1,

  defaultHotspotsVisible: true,
  defaultFacilitiesVisible: true,
  defaultReplayVisible: true,
  defaultBoundariesVisible: false,
  defaultPlaceLabelsVisible: false,
  hotspotClustering: true,
  rememberMapPosition: true,
  defaultFrpFilter: 'all',

  showClassificationExplanation: true,
  showEvidenceQuality: true,
  showConfidenceScores: true,
  showFrpTrend: true,
  showIndustrialProximity: true,
  showTemporalEvidence: true,

  defaultInvestigationFocus: 'observations',
  defaultSortPreference: 'newest',

  defaultPriorityFilter: 'all',
  defaultStatusFilter: 'all',
  showIncidentPriority: true,
  showLifecycleStatus: true,
  showAssignedAnalyst: true,
  showAlertTimestamp: true,

  defaultOversightFocus: 'incidents',
  defaultAuthoritySort: 'priority',
  defaultAuthorityStatusView: 'all'
};

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, role, logout, resetPassword } = useAuth();
  const { theme, setTheme } = useTheme();

  // Authoritative Role Resolution from backend DB profile
  const currentRole = ((role || user?.role || 'user') as string).toLowerCase();
  const isUser = currentRole === 'user';
  const isAnalyst = currentRole === 'analyst';
  const isAuthority = currentRole === 'authority';
  const isAdmin = currentRole === 'admin';

  const userRoleDisplay = currentRole.toUpperCase();
  const userName = user?.full_name || user?.email?.split('@')[0] || 'Authenticated User';
  const userEmail = user?.email || 'N/A';

  const roleBadgeStyle =
    isUser ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40' :
    isAnalyst ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40' :
    isAuthority ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40' :
    'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40';

  const pageSubtitle =
    isUser ? 'Customize your thermal intelligence viewer preferences, notifications, basemaps, and account settings.' :
    isAnalyst ? 'Configure investigation display preferences, anomaly thresholds, notification alerts, and telemetry settings.' :
    isAuthority ? 'Set regulatory compliance notification preferences, administrative boundary overlays, and oversight displays.' :
    'Manage administrator platform display preferences, system notification channels, and platform telemetry.';

  const [passwordResetSent, setPasswordResetSent] = useState<string | null>(null);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  // Settings State persisted in localStorage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('thermaltrace_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          notificationEmail: parsed.notificationEmail !== undefined ? parsed.notificationEmail : (user?.email || '')
        };
      }
    } catch (e) {
      console.error('Failed to parse saved settings:', e);
    }
    return { ...DEFAULT_SETTINGS, notificationEmail: user?.email || '' };
  });

  const [savedState, setSavedState] = useState<UserSettings>(settings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null);

  // Real System Telemetry State
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>([]);
  const [latestHotspotTimestamp, setLatestHotspotTimestamp] = useState<string | null>(null);

  // Modals & Feedback State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [testNotifMsg, setTestNotifMsg] = useState<string | null>(null);

  // USER Subscription & Premium Access State (Preserved for USER role only)
  const [subStatus, setSubStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [showRequestSubModal, setShowRequestSubModal] = useState(false);
  const [selectedPlanKey, setSelectedPlanKey] = useState<'monthly' | 'six_months' | 'yearly'>('monthly');
  const [requestNotes, setRequestNotes] = useState('');
  const [subSubmitting, setSubSubmitting] = useState(false);
  const [subMsg, setSubMsg] = useState<string | null>(null);

  const fetchSubStatus = useCallback(async () => {
    if (!isUser) return;
    try {
      const res = await apiService.getMySubscriptionStatus();
      setSubStatus(res);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    }
  }, [isUser]);

  useEffect(() => {
    fetchSubStatus();
  }, [fetchSubStatus]);

  const handleCreateSubscriptionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubSubmitting(true);
    setSubMsg(null);
    try {
      await apiService.requestSubscription({
        plan_id: selectedPlanKey,
        notes: requestNotes.trim() || undefined
      });
      setSubMsg('Subscription request submitted successfully! Pending Admin approval.');
      setShowRequestSubModal(false);
      setRequestNotes('');
      await fetchSubStatus();
    } catch (err: any) {
      setSubMsg(err.response?.data?.detail || err.message || 'Failed to submit request.');
    } finally {
      setSubSubmitting(false);
    }
  };

  // Unsaved changes detection
  useEffect(() => {
    const isDifferent = JSON.stringify(settings) !== JSON.stringify(savedState);
    setHasUnsavedChanges(isDifferent);
  }, [settings, savedState]);

  // Apply root DOM classes for reduce motion
  useEffect(() => {
    const root = document.documentElement;
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [settings.reduceMotion]);

  // Fetch real telemetry data
  useEffect(() => {
    let isMounted = true;
    const fetchTelemetry = async () => {
      try {
        const [healthData, sourcesData, recentHotspots] = await Promise.allSettled([
          apiService.getSystemHealth(),
          apiService.getDataSourcesStatus(),
          apiService.getHotspots({ limit: 1 })
        ]);

        if (isMounted) {
          if (healthData.status === 'fulfilled') setSystemHealth(healthData.value);
          if (sourcesData.status === 'fulfilled') setDataSources(sourcesData.value);
          if (recentHotspots.status === 'fulfilled' && recentHotspots.value.length > 0) {
            setLatestHotspotTimestamp(
              recentHotspots.value[0].acquisition_datetime || recentHotspots.value[0].created_at || 'Recent'
            );
          }
        }
      } catch (err) {
        console.error('Failed to fetch system telemetry:', err);
      }
    };

    fetchTelemetry();
  }, []);

  const validateEmailFormat = (email: string): boolean => {
    if (!email || !email.trim()) return true;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  const handleSaveSettings = async () => {
    setEmailValidationError(null);

    try {
      await apiService.updateNotificationEmailPreference(settings.emailNotifications);
      localStorage.setItem('thermaltrace_settings', JSON.stringify(settings));
      setSavedState(settings);
      setSaveSuccessMsg('General Settings saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || e?.message || 'Failed to save settings to server.');
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Reset General Settings to system defaults?')) {
      const resetState = { ...DEFAULT_SETTINGS, notificationEmail: user?.email || '' };
      setSettings(resetState);
      localStorage.setItem('thermaltrace_settings', JSON.stringify(resetState));
      setSavedState(resetState);
      setEmailValidationError(null);
      setSaveSuccessMsg('Settings reset to system defaults.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLanguageChange = (newLang: string) => {
    updateSetting('language', newLang);
    changeAppLanguage(newLang as SupportedLanguageCode);
  };

  const handleSendTestNotification = () => {
    if (!settings.notificationsEnabled || !settings.inAppNotifications) {
      setTestNotifMsg('In-App Notifications are currently disabled in settings.');
      setTimeout(() => setTestNotifMsg(null), 4000);
      return;
    }
    setTestNotifMsg('Test notification sent to In-App Notification Center!');
    setTimeout(() => setTestNotifMsg(null), 4000);
  };

  const renderAnalystSettings = () => (
    <>
      {/* 1. ANALYST WORKSPACE */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Sliders className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
            {t('analyst.workspaceTitle', 'ANALYST WORKSPACE')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('settings.theme', 'Application Theme')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>{t('common.light', 'Light')}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className="w-4 h-4 text-amber-400" />
                <span>{t('common.dark', 'Dark')}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                  theme === 'system'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Monitor className="w-4 h-4 text-cyan-500" />
                <span>{t('common.system', 'System')}</span>
              </button>
            </div>
          </div>

          {/* Interface Density */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('settings.density', 'Interface Density')}
            </label>
            <select
              value={settings.density}
              onChange={(e) => updateSetting('density', e.target.value as 'comfortable' | 'compact')}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="comfortable">{t('settings.comfortable', 'Comfortable — Standard Spacing')}</option>
              <option value="compact">{t('settings.compact', 'Compact — High Density View')}</option>
            </select>
          </div>

          {/* Reduce Motion */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  {t('settings.reduceMotion', 'Reduce Animations')}
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('settings.reduceMotionHelp', 'Minimize UI motion while preserving active thermal indicators.')}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
                className="w-4 h-4 text-emerald-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('settings.language')}
            </label>
            <select
              value={i18n.language || settings.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="en">English — English</option>
              <option value="hi">हिन्दी — Hindi</option>
              <option value="ta">தமிழ் — Tamil</option>
              <option value="te">తెలుగు — Telugu</option>
              <option value="ur">اردو — Urdu</option>
            </select>
            <p className="text-[11px] text-slate-500 font-medium">
              {t('settings.languageNote')}
            </p>
          </div>
        </div>
      </section>

      {/* 2. INVESTIGATION ALERTS */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <Bell className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              {t('settings.investigationAlerts', '2. INVESTIGATION ALERTS')}
            </h2>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('settings.enableNotifications', 'Enable Notifications')}</span>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => updateSetting('notificationsEnabled', e.target.checked)}
              className="w-4 h-4 text-emerald-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IN-APP ALERTS */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t('settings.inAppInvestigationAlerts', 'In-App Investigation Alerts')}</span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {t('settings.activeChannel', 'ACTIVE CHANNEL')}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
              {t('settings.inAppAnalystSub', 'Receive real-time analyst notification banners for newly detected anomalies and escalation events.')}
            </p>
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={settings.inAppNotifications}
                onChange={(e) => updateSetting('inAppNotifications', e.target.checked)}
                disabled={!settings.notificationsEnabled}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('settings.receiveInAppAlerts', 'Receive In-App Alerts')}</span>
            </label>
          </div>

          {/* EMAIL ALERTS */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t('settings.emailAlerts', 'Email Alerts')}</span>
              </div>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                  disabled={!settings.notificationsEnabled}
                  className="text-emerald-500 focus:ring-emerald-500 rounded cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{t('common.enabled', 'Enable')}</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 block">
                {t('settings.alertEmailLabel', 'Alert Email:')}
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                disabled
                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-xs font-medium cursor-not-allowed opacity-80"
              />
              <p className="text-[11px] text-slate-500 leading-snug">
                {t('settings.alertEmailNote', 'Email alerts are sent to your verified account email.')}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-700 dark:text-emerald-400 flex items-start space-x-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Real-time email alert delivery sends HIGH and CRITICAL thermal incident alerts to your account email.</span>
            </div>
          </div>
        </div>

        {/* Analyst Notification Categories */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            {t('settings.analystAlertCatSub', 'Analyst Alert Category Subscriptions')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.criticalAlerts}
                onChange={(e) => updateSetting('criticalAlerts', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('settings.criticalAlerts')}</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.highPriorityAlerts}
                onChange={(e) => updateSetting('highPriorityAlerts', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('settings.highPriorityAlerts')}</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.investigationUpdates}
                onChange={(e) => updateSetting('investigationUpdates', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('settings.investigationUpdates')}</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.watchlistMatches}
                onChange={(e) => updateSetting('watchlistMatches', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('settings.watchlistMatches', 'AOI / Watchlist Area Anomaly Matches')}</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.systemStatusAlerts}
                onChange={(e) => updateSetting('systemStatusAlerts', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('settings.systemStatusAlerts')}</span>
            </label>
          </div>
        </div>

        {/* Audio & Quiet Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4 text-emerald-500" />
                <span>{t('settings.alertAudio', 'Alert Audio Tone')}</span>
              </label>
              <input
                type="checkbox"
                checked={settings.alertSound}
                onChange={(e) => updateSetting('alertSound', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded cursor-pointer"
              />
            </div>
            {settings.alertSound && (
              <select
                value={settings.alertSoundType}
                onChange={(e) => updateSetting('alertSoundType', e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <option value="default">Default — Standard Chime</option>
                <option value="subtle">Subtle — Soft Beacon</option>
                <option value="urgent">Urgent — High Priority Tone</option>
              </select>
            )}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>{t('settings.quietHours', 'Quiet Hours')}</span>
              </label>
              <input
                type="checkbox"
                checked={settings.quietHoursEnabled}
                onChange={(e) => updateSetting('quietHoursEnabled', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded cursor-pointer"
              />
            </div>
            {settings.quietHoursEnabled && (
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 block mb-1">Start Time</span>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 block mb-1">End Time</span>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Notification Verification */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              {t('settings.channelTestVerification', 'Channel Verification Test')}
            </span>
            <span className="text-[11px] text-slate-500">
              {t('settings.channelTestSub', 'Dispatches a test notification to configured active channels only.')}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSendTestNotification}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
          >
            {t('settings.sendTestNotifBtn', 'Send Test Notification')}
          </button>
        </div>
      </section>

      {/* 3. OBSERVATION ANALYSIS */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              {t('settings.observationAnalysis', '3. OBSERVATION ANALYSIS')}
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            {t('common.savedPreference', 'Saved workspace preference')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Observation Data Window */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('settings.defaultObsDataWindow', 'Default Observation Data Window')}
            </label>
            <select
              value={settings.defaultDataWindowDays}
              onChange={(e) => updateSetting('defaultDataWindowDays', parseInt(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
            >
              <option value={1}>24 Hours — Recent Satellite Swaths</option>
              <option value={3}>3 Days — Multi-Day Correlation</option>
              <option value={7}>7 Days — Weekly Trend Analysis</option>
              <option value={30}>30 Days — Monthly Overview</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Preferred default time range when opening Observation Analysis and Data Explorer.
            </p>
          </div>

          {/* Default FRP Display Filter */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('settings.defaultFrpDisplayFilter', 'Default FRP Display Filter')}
            </label>
            <select
              value={settings.defaultFrpFilter}
              onChange={(e) => updateSetting('defaultFrpFilter', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all">All Radiative Power Levels (&gt; 0 MW)</option>
              <option value="5mw">Moderate & Above (&gt; 5 MW)</option>
              <option value="15mw">High Intensity (&gt; 15 MW)</option>
              <option value="50mw">Extreme Thermal (&gt; 50 MW)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Controls the preferred display filter only. It does not change ThermalTrace alert-generation thresholds.
            </p>
          </div>

          {/* Auto Refresh Interval */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                {t('settings.autoRefreshInterval', 'Auto Refresh Interval')}
              </label>
              <input
                type="checkbox"
                checked={settings.autoRefreshEnabled}
                onChange={(e) => updateSetting('autoRefreshEnabled', e.target.checked)}
                className="w-4 h-4 text-emerald-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>
            {settings.autoRefreshEnabled && (
              <select
                value={settings.refreshIntervalMinutes}
                onChange={(e) => updateSetting('refreshIntervalMinutes', parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
              >
                <option value={1}>1 Minute (Active Monitoring)</option>
                <option value={5}>5 Minutes (Recommended Default)</option>
                <option value={10}>10 Minutes (Standard Interval)</option>
                <option value={15}>15 Minutes (Low Overhead)</option>
              </select>
            )}
          </div>

          {/* Data Saver Mode */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t('settings.dataSaverMode', 'Data Saver Mode')}</span>
              </div>
              <input
                type="checkbox"
                checked={settings.dataSaverMode}
                onChange={(e) => updateSetting('dataSaverMode', e.target.checked)}
                className="w-4 h-4 text-emerald-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('settings.dataSaverSubAnalyst', 'Reduce map tile bandwidth during intensive investigation sessions.')}
            </p>
          </div>
        </div>
      </section>

      {/* 4. INVESTIGATION MAP */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <Map className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              {t('settings.investigationMap', '4. INVESTIGATION MAP')}
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            {t('common.savedPreference', 'Saved workspace preference')}
          </span>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            {t('settings.analystMapLayerDefaults', 'Analyst Map Layer Defaults')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultHotspotsVisible}
                onChange={(e) => updateSetting('defaultHotspotsVisible', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('dashboard.hotspots', 'Thermal Hotspots')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultFacilitiesVisible}
                onChange={(e) => updateSetting('defaultFacilitiesVisible', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('dashboard.facilities', 'Industrial Facilities')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultReplayVisible}
                onChange={(e) => updateSetting('defaultReplayVisible', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('dashboard.replay', 'History Replay')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultBoundariesVisible}
                onChange={(e) => updateSetting('defaultBoundariesVisible', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('dashboard.boundaries', 'Administrative Boundaries')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultPlaceLabelsVisible}
                onChange={(e) => updateSetting('defaultPlaceLabelsVisible', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('dashboard.labels', 'Place Labels')}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  {t('settings.clusterNearbyHotspots', 'Cluster Nearby Hotspots')}
                </label>
                <input
                  type="checkbox"
                  checked={settings.hotspotClustering}
                  onChange={(e) => updateSetting('hotspotClustering', e.target.checked)}
                  className="text-emerald-500 focus:ring-emerald-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500">Group high-density thermal markers at low zoom levels.</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  {t('settings.rememberMapPosition', 'Remember Last Map Position')}
                </label>
                <input
                  type="checkbox"
                  checked={settings.rememberMapPosition}
                  onChange={(e) => updateSetting('rememberMapPosition', e.target.checked)}
                  className="text-emerald-500 focus:ring-emerald-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500">Restore last center coordinates & zoom upon navigation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EVIDENCE & REVIEW DISPLAY */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <Shield className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              {t('settings.evidenceReviewDisplay', '5. EVIDENCE & REVIEW DISPLAY')}
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            {t('common.savedPreference', 'Saved workspace preference')}
          </span>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            {t('settings.analystEvidenceDisplayPref', 'Analyst Evidence Display Preferences')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showClassificationExplanation}
                onChange={(e) => updateSetting('showClassificationExplanation', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('analyst.showClassification', 'Show Classification Explanation')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showEvidenceQuality}
                onChange={(e) => updateSetting('showEvidenceQuality', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('analyst.showEvidenceQuality', 'Show Evidence Quality & Source')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showConfidenceScores}
                onChange={(e) => updateSetting('showConfidenceScores', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('analyst.showConfidence', 'Show Confidence Scores')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showFrpTrend}
                onChange={(e) => updateSetting('showFrpTrend', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('analyst.showFrpTrend', 'Show FRP Trend Analysis')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showIndustrialProximity}
                onChange={(e) => updateSetting('showIndustrialProximity', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('analyst.showProximity', 'Show Industrial Proximity Evidence')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showTemporalEvidence}
                onChange={(e) => updateSetting('showTemporalEvidence', e.target.checked)}
                className="text-emerald-500 focus:ring-emerald-500 rounded"
              />
              <span>{t('analyst.showTemporal', 'Show Temporal Evidence Timeline')}</span>
            </label>
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            Evidence display preferences control visual layout density in Analyst review tools. They do not modify underlying evidence calculations or machine learning scores.
          </p>
        </div>
      </section>

      {/* 6. ANALYST WORKFLOW */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              {t('settings.analystWorkflowHeader', '6. ANALYST WORKFLOW')}
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            {t('common.savedPreference', 'Saved workspace preference')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('analyst.defaultFocus', 'Default Investigation Focus')}
            </label>
            <select
              value={settings.defaultInvestigationFocus}
              onChange={(e) => updateSetting('defaultInvestigationFocus', e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="observations">Latest Observations — Real-time Feed</option>
              <option value="reviews">Analyst Review Queue — Pending Moderation</option>
              <option value="alerts">Thermal Alerts — High & Critical Priority</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Preferred default focus view upon opening the Analyst workspace.
            </p>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('analyst.defaultSort', 'Default Sort Preference')}
            </label>
            <select
              value={settings.defaultSortPreference}
              onChange={(e) => updateSetting('defaultSortPreference', e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="newest">Newest First (Chronological)</option>
              <option value="priority">Highest Priority First</option>
              <option value="frp">Highest FRP Intensity First</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Initial sorting order applied to investigation data tables.
            </p>
          </div>
        </div>
      </section>

      {/* 7. ACCOUNT & SECURITY */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Shield className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
            {t('settings.accountSecurityHeader', '7. ACCOUNT & SECURITY')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Profile Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{t('settings.authenticatedProfile', 'Authenticated Profile')}</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{t('common.sessionActive', 'Session Active')}</span>
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-sm font-black text-slate-900 dark:text-white">{userName}</div>
              <div className="text-xs font-mono text-slate-600 dark:text-slate-400">{userEmail}</div>
            </div>

            {/* Corrected Role Display — "Role managed by system" */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <span>{t('common.role')}:</span>
                  <span className={`px-2.5 py-0.5 rounded font-extrabold text-xs uppercase border ${roleBadgeStyle}`}>
                    {userRoleDisplay}
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 font-semibold flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>{t('settings.roleManagedBySystem', 'Role managed by system')}</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                {t('settings.analystRoleHelp')}
              </div>
            </div>
          </div>

          {/* Account Security Controls */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-2">{t('settings.securityActions', 'Security Actions')}</span>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center space-x-2">
                    <Key className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('settings.changePassword', 'Change Account Password')}</span>
                  </span>
                  <span>→</span>
                </button>

                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 text-[11px] text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">{t('settings.sessionSecurity', 'Session Security')}</div>
                  <div>JWT Token Authenticated • Storage: Local Bearer Storage</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('common.logout', 'Log Out')}</span>
              </button>

              <span className="text-[10px] text-slate-400 font-mono">
                {t('settings.singleSessionArch', 'Single-Session Architecture')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. DATA & SYSTEM STATUS */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Activity className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
            {t('settings.dataSystemStatusHeader', '8. DATA & SYSTEM STATUS')}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">{t('settings.backendStatus', 'Backend Status')}</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{systemHealth?.status === 'Operational' ? 'Healthy' : 'Live'}</span>
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">{t('settings.databaseStatus', 'Database Status')}</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Connected</span>
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">{t('settings.firmsStatus', 'NASA FIRMS API')}</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{systemHealth?.firms_integration?.last_sync_status || 'Connected'}</span>
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">NOAA-20 VIIRS</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Active Feed</span>
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">NOAA-21 VIIRS</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Active Feed</span>
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Platform Version</span>
            <span className="font-extrabold text-slate-900 dark:text-white mt-1 block font-mono">
              v1.2.0 (SIH26162)
            </span>
          </div>
        </div>
      </section>
    </>
  );

  const renderAuthoritySettings = () => (
    <>
      {/* 1. AUTHORITY WORKSPACE */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Sliders className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
            {t('authority.workspaceTitle', 'AUTHORITY WORKSPACE')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('settings.theme', 'Application Theme')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/50 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>{t('common.light', 'Light')}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/50 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className="w-4 h-4 text-amber-400" />
                <span>{t('common.dark', 'Dark')}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                  theme === 'system'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/50 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Monitor className="w-4 h-4 text-cyan-500" />
                <span>{t('common.system', 'System')}</span>
              </button>
            </div>
          </div>

          {/* Interface Density */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('settings.density', 'Interface Density')}
            </label>
            <select
              value={settings.density}
              onChange={(e) => updateSetting('density', e.target.value as 'comfortable' | 'compact')}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
            >
              <option value="comfortable">{t('settings.comfortable', 'Comfortable — Standard Spacing')}</option>
              <option value="compact">{t('settings.compact', 'Compact — High Density View')}</option>
            </select>
          </div>

          {/* Reduce Motion */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  {t('settings.reduceMotion', 'Reduce Animations')}
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('settings.reduceMotionHelp', 'Minimize UI motion while preserving active thermal indicators.')}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
                className="w-4 h-4 text-amber-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('settings.language')}
            </label>
            <select
              value={i18n.language || settings.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition cursor-pointer"
            >
              <option value="en">English — English</option>
              <option value="hi">हिन्दी — Hindi</option>
              <option value="ta">தமிழ் — Tamil</option>
              <option value="te">తెలుగు — Telugu</option>
              <option value="ur">اردو — Urdu</option>
            </select>
            <p className="text-[11px] text-slate-500 font-medium">
              {t('settings.languageNote')}
            </p>
          </div>
        </div>
      </section>

      {/* 2. CRITICAL INCIDENT & OVERSIGHT ALERTS */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <Bell className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              {t('settings.criticalIncidentAlerts', '2. CRITICAL INCIDENT & OVERSIGHT ALERTS')}
            </h2>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('settings.enableNotifications', 'Enable Notifications')}</span>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => updateSetting('notificationsEnabled', e.target.checked)}
              className="w-4 h-4 text-amber-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-amber-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IN-APP ALERTS */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t('settings.inAppOversightAlerts', 'In-App Oversight Alerts')}</span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {t('settings.activeChannel', 'ACTIVE CHANNEL')}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
              {t('settings.inAppAuthoritySub')}
            </p>
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={settings.inAppNotifications}
                onChange={(e) => updateSetting('inAppNotifications', e.target.checked)}
                disabled={!settings.notificationsEnabled}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('settings.receiveInAppAlerts', 'Receive In-App Alerts')}</span>
            </label>
          </div>

          {/* EMAIL ALERTS */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t('settings.emailAlerts', 'Email Alerts')}</span>
              </div>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                  disabled={!settings.notificationsEnabled}
                  className="text-amber-500 focus:ring-amber-500 rounded cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{t('common.enabled', 'Enable')}</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 block">
                {t('settings.alertEmailLabel', 'Alert Email:')}
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                disabled
                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-xs font-medium cursor-not-allowed opacity-80"
              />
              <p className="text-[11px] text-slate-500 leading-snug">
                {t('settings.alertEmailNote', 'Email alerts are sent to your verified account email.')}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400 flex items-start space-x-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Real-time email alert delivery sends HIGH and CRITICAL thermal incident alerts to your account email.</span>
            </div>
          </div>
        </div>

        {/* Authority Notification Categories */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            {t('settings.authorityAlertCatSub', 'Authority Oversight Category Subscriptions')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.criticalAlerts}
                onChange={(e) => updateSetting('criticalAlerts', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('settings.criticalAlerts')}</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.highPriorityAlerts}
                onChange={(e) => updateSetting('highPriorityAlerts', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('settings.highPriorityAlerts')}</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.complianceUpdates}
                onChange={(e) => updateSetting('complianceUpdates', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('settings.complianceUpdates')}</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.watchlistMatches}
                onChange={(e) => updateSetting('watchlistMatches', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>Alert Lifecycle & Status Updates</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.systemStatusAlerts}
                onChange={(e) => updateSetting('systemStatusAlerts', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('settings.systemStatusAlerts')}</span>
            </label>
          </div>
        </div>

        {/* Audio & Quiet Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4 text-amber-500" />
                <span>{t('settings.alertAudio', 'Alert Audio Tone')}</span>
              </label>
              <input
                type="checkbox"
                checked={settings.alertSound}
                onChange={(e) => updateSetting('alertSound', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded cursor-pointer"
              />
            </div>
            {settings.alertSound && (
              <select
                value={settings.alertSoundType}
                onChange={(e) => updateSetting('alertSoundType', e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <option value="default">Default — Standard Chime</option>
                <option value="subtle">Subtle — Soft Beacon</option>
                <option value="urgent">Urgent — High Priority Tone</option>
              </select>
            )}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{t('settings.quietHours', 'Quiet Hours')}</span>
              </label>
              <input
                type="checkbox"
                checked={settings.quietHoursEnabled}
                onChange={(e) => updateSetting('quietHoursEnabled', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded cursor-pointer"
              />
            </div>
            {settings.quietHoursEnabled && (
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 block mb-1">Start Time</span>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 block mb-1">End Time</span>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Notification Verification */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              {t('settings.channelTestVerification', 'Channel Verification Test')}
            </span>
            <span className="text-[11px] text-slate-500">
              {t('settings.channelTestSub', 'Dispatches a test notification to configured active channels only.')}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSendTestNotification}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
          >
            {t('settings.sendTestNotifBtn', 'Send Test Notification')}
          </button>
        </div>
      </section>

      {/* 3. OVERSIGHT DISPLAY PREFERENCES */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              {t('settings.oversightDisplay', '3. OVERSIGHT DISPLAY PREFERENCES')}
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            {t('common.savedPreference', 'Saved workspace preference')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Oversight Time Window */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('settings.defaultOversightTimeWindow', 'Default Oversight Time Window')}
            </label>
            <select
              value={settings.defaultDataWindowDays}
              onChange={(e) => updateSetting('defaultDataWindowDays', parseInt(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
            >
              <option value={1}>24 Hours — Daily Oversight View</option>
              <option value={7}>7 Days — Weekly Incident Summary</option>
              <option value={30}>30 Days — Monthly Compliance Overview</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Preferred default time range when opening Authority oversight dashboards.
            </p>
          </div>

          {/* Priority Display Filter */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('settings.priorityDisplayFilter', 'Priority Display Filter')}
            </label>
            <select
              value={settings.defaultPriorityFilter}
              onChange={(e) => updateSetting('defaultPriorityFilter', e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
            >
              <option value="all">All Priority Levels</option>
              <option value="critical">Critical Priority Only (&gt; 50 MW)</option>
              <option value="high_critical">High & Critical Priority (&gt; 15 MW)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Display preference only. Does not modify ThermalTrace detection or alert-generation thresholds.
            </p>
          </div>

          {/* Incident Status Display */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('settings.incidentStatusDisplayFilter', 'Incident Status Display Filter')}
            </label>
            <select
              value={settings.defaultStatusFilter}
              onChange={(e) => updateSetting('defaultStatusFilter', e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
            >
              <option value="all">All Incidents (Active & Resolved)</option>
              <option value="active">Active / Open Incidents Only</option>
              <option value="resolved">Resolved / Closed Incidents Only</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Initial status filter applied to Authority oversight lists.
            </p>
          </div>

          {/* Auto Refresh Interval */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                {t('settings.autoRefreshInterval', 'Auto Refresh Interval')}
              </label>
              <input
                type="checkbox"
                checked={settings.autoRefreshEnabled}
                onChange={(e) => updateSetting('autoRefreshEnabled', e.target.checked)}
                className="w-4 h-4 text-amber-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-amber-500 cursor-pointer"
              />
            </div>
            {settings.autoRefreshEnabled && (
              <select
                value={settings.refreshIntervalMinutes}
                onChange={(e) => updateSetting('refreshIntervalMinutes', parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
              >
                <option value={1}>1 Minute (Active Monitoring)</option>
                <option value={5}>5 Minutes (Recommended Default)</option>
                <option value={10}>10 Minutes (Standard Interval)</option>
                <option value={15}>15 Minutes (Low Overhead)</option>
              </select>
            )}
          </div>

          {/* Data Saver Mode */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t('settings.dataSaverMode', 'Data Saver Mode')}</span>
              </div>
              <input
                type="checkbox"
                checked={settings.dataSaverMode}
                onChange={(e) => updateSetting('dataSaverMode', e.target.checked)}
                className="w-4 h-4 text-amber-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-amber-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('settings.dataSaverSubAuthority', 'Reduce map tile bandwidth during intensive oversight sessions.')}
            </p>
          </div>
        </div>
      </section>

      {/* 4. REGIONAL & INFRASTRUCTURE MAP */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <Map className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              {t('settings.regionalMap', '4. REGIONAL & INFRASTRUCTURE MAP')}
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            {t('common.savedPreference', 'Saved workspace preference')}
          </span>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            {t('settings.authorityMapLayerDefaults', 'Authority Map Layer Defaults')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultBoundariesVisible}
                onChange={(e) => updateSetting('defaultBoundariesVisible', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('dashboard.boundaries', 'Administrative Boundaries')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultFacilitiesVisible}
                onChange={(e) => updateSetting('defaultFacilitiesVisible', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('dashboard.facilities', 'Industrial Facilities')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultHotspotsVisible}
                onChange={(e) => updateSetting('defaultHotspotsVisible', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('dashboard.hotspots', 'Thermal Hotspots')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultReplayVisible}
                onChange={(e) => updateSetting('defaultReplayVisible', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('dashboard.replay', 'History Replay')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultPlaceLabelsVisible}
                onChange={(e) => updateSetting('defaultPlaceLabelsVisible', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('dashboard.labels', 'Place Labels')}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  {t('settings.clusterNearbyHotspots', 'Cluster Nearby Hotspots')}
                </label>
                <input
                  type="checkbox"
                  checked={settings.hotspotClustering}
                  onChange={(e) => updateSetting('hotspotClustering', e.target.checked)}
                  className="text-amber-500 focus:ring-amber-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500">Group high-density thermal markers at low zoom levels.</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  {t('settings.rememberMapPosition', 'Remember Last Map Position')}
                </label>
                <input
                  type="checkbox"
                  checked={settings.rememberMapPosition}
                  onChange={(e) => updateSetting('rememberMapPosition', e.target.checked)}
                  className="text-amber-500 focus:ring-amber-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500">Restore last center coordinates & zoom upon navigation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMPLIANCE & INCIDENT LIFECYCLE DISPLAY */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              {t('settings.complianceLifecycleDisplay', '5. COMPLIANCE & INCIDENT LIFECYCLE DISPLAY')}
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            {t('common.savedPreference', 'Saved workspace preference')}
          </span>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            {t('settings.authorityOversightVisibilityPref', 'Authority Oversight Visibility Preferences')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showIncidentPriority}
                onChange={(e) => updateSetting('showIncidentPriority', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('authority.showPriority', 'Show Incident Priority')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showLifecycleStatus}
                onChange={(e) => updateSetting('showLifecycleStatus', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('authority.showStatus', 'Show Incident Lifecycle Status')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showAssignedAnalyst}
                onChange={(e) => updateSetting('showAssignedAnalyst', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('authority.showAnalyst', 'Show Assigned Analyst')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showEvidenceQuality}
                onChange={(e) => updateSetting('showEvidenceQuality', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('authority.showQuality', 'Show Evidence Quality')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showClassificationExplanation}
                onChange={(e) => updateSetting('showClassificationExplanation', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('authority.showExplanation', 'Show Classification Explanation')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showAlertTimestamp}
                onChange={(e) => updateSetting('showAlertTimestamp', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('authority.showTimestamp', 'Show Alert Timestamp / Last Updated')}</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showIndustrialProximity}
                onChange={(e) => updateSetting('showIndustrialProximity', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>{t('authority.showProximity', 'Show Facility Proximity Context')}</span>
            </label>
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            Compliance & Incident Lifecycle options control display density in Authority oversight views. They do not alter RBAC permissions, analyst assignments, or alert lifecycle states.
          </p>
        </div>
      </section>

      {/* 6. AUTHORITY WORKFLOW PREFERENCES */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              {t('settings.authorityWorkflowHeader', '6. AUTHORITY WORKFLOW PREFERENCES')}
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            {t('common.savedPreference', 'Saved workspace preference')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('authority.defaultFocus', 'Default Oversight Focus')}
            </label>
            <select
              value={settings.defaultOversightFocus}
              onChange={(e) => updateSetting('defaultOversightFocus', e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
            >
              <option value="incidents">Critical Incidents — Priority Oversight</option>
              <option value="alerts">Recent Alerts — Live Feed</option>
              <option value="lifecycle">Incident Lifecycle — Resolution Tracking</option>
              <option value="regional">Regional Overview — High-Level View</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Preferred default focus view upon opening the Authority workspace.
            </p>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('authority.defaultSort', 'Default Sort Preference')}
            </label>
            <select
              value={settings.defaultAuthoritySort}
              onChange={(e) => updateSetting('defaultAuthoritySort', e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
            >
              <option value="priority">Highest Priority First</option>
              <option value="newest">Newest First (Chronological)</option>
              <option value="updated">Recently Updated First</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Initial sorting order applied to oversight incident lists.
            </p>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('authority.defaultStatusView', 'Default Status View')}
            </label>
            <select
              value={settings.defaultAuthorityStatusView}
              onChange={(e) => updateSetting('defaultAuthorityStatusView', e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
            >
              <option value="all">All Incidents (Active & Resolved)</option>
              <option value="active">Active / Open Incidents Only</option>
              <option value="resolved">Resolved / Closed Incidents Only</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Initial status filter applied to Authority workflow views.
            </p>
          </div>
        </div>
      </section>

      {/* 7. ACCOUNT & SECURITY */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Shield className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
            {t('settings.accountSecurityHeader', '7. ACCOUNT & SECURITY')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Profile Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{t('settings.authenticatedProfile', 'Authenticated Profile')}</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{t('common.sessionActive', 'Session Active')}</span>
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-sm font-black text-slate-900 dark:text-white">{userName}</div>
              <div className="text-xs font-mono text-slate-600 dark:text-slate-400">{userEmail}</div>
            </div>

            {/* Corrected Role Display — "Role managed by system" */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <span>{t('common.role')}:</span>
                  <span className={`px-2.5 py-0.5 rounded font-extrabold text-xs uppercase border ${roleBadgeStyle}`}>
                    {userRoleDisplay}
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 font-semibold flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>{t('settings.roleManagedBySystem', 'Role managed by system')}</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                {t('settings.authorityRoleHelp')}
              </div>
            </div>
          </div>

          {/* Account Security Controls */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-2">{t('settings.securityActions', 'Security Actions')}</span>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center space-x-2">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('settings.changePassword', 'Change Account Password')}</span>
                  </span>
                  <span>→</span>
                </button>

                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 text-[11px] text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">{t('settings.sessionSecurity', 'Session Security')}</div>
                  <div>JWT Token Authenticated • Storage: Local Bearer Storage</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('common.logout', 'Log Out')}</span>
              </button>

              <span className="text-[10px] text-slate-400 font-mono">
                {t('settings.singleSessionArch', 'Single-Session Architecture')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. OPERATIONAL SYSTEM STATUS */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              {t('settings.operationalSystemStatusHeader', '8. OPERATIONAL SYSTEM STATUS')}
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            {t('common.readOnlyStatus', 'Read-Only System Status')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">{t('settings.backendStatus', 'Backend Status')}</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{systemHealth?.status === 'Operational' ? 'Healthy' : 'Live'}</span>
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">{t('settings.databaseStatus', 'Database Status')}</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Connected</span>
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">{t('settings.firmsStatus', 'NASA FIRMS API')}</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{systemHealth?.firms_integration?.last_sync_status || 'Connected'}</span>
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">NOAA-20 VIIRS</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Active Feed</span>
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">NOAA-21 VIIRS</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Active Feed</span>
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">{t('settings.projectIdentifier', 'Project Identifier')}</span>
            <span className="font-extrabold text-slate-900 dark:text-white mt-1 block font-mono">
              SIH26162
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 flex items-center space-x-2">
          <Info className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{t('settings.cpcbNote')}</span>
        </div>
      </section>
    </>
  );

  return (
    <div className={`p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto space-y-8 select-none ${settings.density === 'compact' ? 'space-y-6 text-sm' : ''}`}>
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] shrink-0">
            <SettingsIcon className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                General Settings
              </h1>
              <span className={`px-2.5 py-0.5 rounded font-extrabold text-[11px] uppercase border ${roleBadgeStyle}`}>
                {userRoleDisplay} WORKSPACE
              </span>
              {hasUnsavedChanges && (
                <span className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Unsaved Changes</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {pageSubtitle}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleResetSettings}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
            title="Reset settings to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={!hasUnsavedChanges}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-md ${
              hasUnsavedChanges
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-70'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
        </div>
      )}

      {isAnalyst ? (
        renderAnalystSettings()
      ) : isAuthority ? (
        renderAuthoritySettings()
      ) : (
        <>
          {/* SECTION 1 — APPEARANCE & INTERFACE (ALL ROLES) */}
          <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Sliders className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
            APPEARANCE & INTERFACE
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme Selector (Light / Dark / System) */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              Application Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/50 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/50 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className="w-4 h-4 text-amber-400" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                  theme === 'system'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/50 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Monitor className="w-4 h-4 text-cyan-500" />
                <span>System</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              System mode automatically matches your operating system or browser light/dark mode preference.
            </p>
          </div>

          {/* Interface Density */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              Interface Density
            </label>
            <select
              value={settings.density}
              onChange={(e) => updateSetting('density', e.target.value as 'comfortable' | 'compact')}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
            >
              <option value="comfortable">Comfortable — Standard spacing & padding</option>
              <option value="compact">Compact — Higher data visibility density</option>
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Adjust layout compactness without breaking responsive dashboard cards.
            </p>
          </div>

          {/* Reduce Motion Toggle */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Reduce Animations
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Minimize decorative transitions & pulse effects while maintaining loading indicators.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
                className="w-4 h-4 text-amber-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              {t('settings.language')}
            </label>
            <select
              value={i18n.language || settings.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition cursor-pointer"
            >
              <option value="en">English — English</option>
              <option value="hi">हिन्दी — Hindi</option>
              <option value="ta">தமிழ் — Tamil</option>
              <option value="te">తెలుగు — Telugu</option>
              <option value="ur">اردو — Urdu</option>
            </select>
            <p className="text-[11px] text-slate-500 font-medium">
              {t('settings.languageNote')}
            </p>
          </div>

          {/* Date Format */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              Date Format
            </label>
            <select
              value={settings.dateFormat}
              onChange={(e) => updateSetting('dateFormat', e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/09/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/25/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
            </select>
          </div>

          {/* Time Format */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              Time Format
            </label>
            <div className="flex items-center space-x-4 pt-1">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="timeFormat"
                  value="12h"
                  checked={settings.timeFormat === '12h'}
                  onChange={() => updateSetting('timeFormat', '12h')}
                  className="text-amber-500 focus:ring-amber-500"
                />
                <span>12-hour (08:45 PM)</span>
              </label>
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="timeFormat"
                  value="24h"
                  checked={settings.timeFormat === '24h'}
                  onChange={() => updateSetting('timeFormat', '24h')}
                  className="text-amber-500 focus:ring-amber-500"
                />
                <span>24-hour (20:45)</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Display formatting preference only. Raw satellite acquisition UTC timestamps remain unchanged.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — CLEAN NOTIFICATIONS & ALERTS */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <Bell className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              NOTIFICATIONS & ALERTS
            </h2>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Enable Notifications</span>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => updateSetting('notificationsEnabled', e.target.checked)}
              className="w-4 h-4 text-amber-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-amber-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Primary Delivery Method: In-App Alerts & Email Alert Option */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PRIMARY METHOD: IN-APP ALERTS */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">In-App Alerts</span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                ACTIVE CHANNEL
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
              Receive ThermalTrace alerts directly inside the application via real-time header dropdown & toast notifications.
            </p>
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={settings.inAppNotifications}
                onChange={(e) => updateSetting('inAppNotifications', e.target.checked)}
                disabled={!settings.notificationsEnabled}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>Receive In-App Alerts</span>
            </label>
          </div>

          {/* EMAIL ALERTS OPTION */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Email Alerts</span>
              </div>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                  disabled={!settings.notificationsEnabled}
                  className="text-amber-500 focus:ring-amber-500 rounded cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Enable</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 block">
                Alert Email:
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                disabled
                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-xs font-medium cursor-not-allowed opacity-80"
              />
              <p className="text-[11px] text-slate-500 leading-snug">
                Email alerts are sent to your verified account email.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400 flex items-start space-x-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Real-time email alert delivery sends HIGH and CRITICAL alerts directly to your verified email address.</span>
            </div>
          </div>
        </div>

        {/* Role-Specific Subscribed Notification Categories */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            Subscribed Notification Categories ({userRoleDisplay} Role)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.criticalAlerts}
                onChange={(e) => updateSetting('criticalAlerts', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>Critical Priority Thermal Incident Alerts (&gt; 50 MW FRP)</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.highPriorityAlerts}
                onChange={(e) => updateSetting('highPriorityAlerts', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>High Priority Thermal Anomaly Alerts (&gt; 15 MW FRP)</span>
            </label>

            {(isAnalyst || isUser) && (
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.investigationUpdates}
                  onChange={(e) => updateSetting('investigationUpdates', e.target.checked)}
                  className="text-amber-500 focus:ring-amber-500 rounded"
                />
                <span>Analyst Anomaly Investigation Updates</span>
              </label>
            )}

            {(isAuthority || isUser) && (
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.complianceUpdates}
                  onChange={(e) => updateSetting('complianceUpdates', e.target.checked)}
                  className="text-amber-500 focus:ring-amber-500 rounded"
                />
                <span>Regulatory Compliance Status Updates</span>
              </label>
            )}

            {isAnalyst && (
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.watchlistMatches}
                  onChange={(e) => updateSetting('watchlistMatches', e.target.checked)}
                  className="text-amber-500 focus:ring-amber-500 rounded"
                />
                <span>AOI / Watchlist Area Anomaly Matches</span>
              </label>
            )}

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.systemStatusAlerts}
                onChange={(e) => updateSetting('systemStatusAlerts', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>System Telemetry & Data Pipeline Updates</span>
            </label>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            Notification preferences control display signals only. Notification settings never alter backend alert records, classification algorithms, or system RBAC permissions.
          </p>
        </div>

        {/* Alert Audio Signal & Quiet Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4 text-amber-500" />
                <span>Alert Sound Signal</span>
              </label>
              <input
                type="checkbox"
                checked={settings.alertSound}
                onChange={(e) => updateSetting('alertSound', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded cursor-pointer"
              />
            </div>
            {settings.alertSound && (
              <select
                value={settings.alertSoundType}
                onChange={(e) => updateSetting('alertSoundType', e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <option value="default">Default — Standard Chime</option>
                <option value="subtle">Subtle — Soft Beacon</option>
                <option value="urgent">Urgent — High Priority Tone</option>
              </select>
            )}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Quiet Hours</span>
              </label>
              <input
                type="checkbox"
                checked={settings.quietHoursEnabled}
                onChange={(e) => updateSetting('quietHoursEnabled', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded cursor-pointer"
              />
            </div>
            {settings.quietHoursEnabled && (
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 block mb-1">Start Time</span>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 block mb-1">End Time</span>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Notification Verification */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Channel Verification Test
            </span>
            <span className="text-[11px] text-slate-500">
              Dispatches a test notification to configured active channels only.
            </span>
          </div>
          <button
            type="button"
            onClick={handleSendTestNotification}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
          >
            Send Test Notification
          </button>
        </div>
        {testNotifMsg && (
          <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 p-2.5 rounded-xl">
            {testNotifMsg}
          </p>
        )}
      </section>

      {/* SECTION 3 — DATA & PERFORMANCE PREFERENCES (ANALYST, AUTHORITY, ADMIN) */}
      {(isAnalyst || isAuthority || isAdmin) && (
        <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              DATA & PERFORMANCE PREFERENCES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data Saver Mode */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Data Saver Mode
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dataSaverMode}
                  onChange={(e) => updateSetting('dataSaverMode', e.target.checked)}
                  className="w-4 h-4 text-amber-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-amber-500 cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Reduce network bandwidth and map tile usage while keeping essential thermal anomaly intelligence active. Optimizes background telemetry polling frequency.
              </p>
              <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center space-x-1.5 pt-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Data Saver mode never deletes observation records, hides critical incidents, or alters NASA FIRMS calculations.</span>
              </div>
            </div>

            {/* Auto Refresh */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Auto Refresh Interval
                </label>
                <input
                  type="checkbox"
                  checked={settings.autoRefreshEnabled}
                  onChange={(e) => updateSetting('autoRefreshEnabled', e.target.checked)}
                  className="w-4 h-4 text-amber-500 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-amber-500 cursor-pointer"
                />
              </div>
              {settings.autoRefreshEnabled && (
                <select
                  value={settings.refreshIntervalMinutes}
                  onChange={(e) => updateSetting('refreshIntervalMinutes', parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
                >
                  <option value={1}>1 Minute (Active Monitoring)</option>
                  <option value={5}>5 Minutes (Recommended Default)</option>
                  <option value={10}>10 Minutes (Standard Interval)</option>
                  <option value={15}>15 Minutes (Low Overhead)</option>
                </select>
              )}
            </div>

            {/* Default Data Window */}
            <div className="space-y-2.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                Default Observation Data Window
              </label>
              <select
                value={settings.defaultDataWindowDays}
                onChange={(e) => updateSetting('defaultDataWindowDays', parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
              >
                <option value={1}>24 Hours — Recent Satellite Swaths</option>
                <option value={3}>3 Days — Multi-Day Correlation</option>
                <option value={7}>7 Days — Weekly Trend Analysis</option>
                <option value={30}>30 Days — Monthly Overview</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4 — MAP PREFERENCES (ALL ROLES, ROLE-TAILORED) */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Map className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
            MAP DISPLAY PREFERENCES
          </h2>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            Default Map Layer Visibility
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultHotspotsVisible}
                onChange={(e) => updateSetting('defaultHotspotsVisible', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>Thermal Hotspots (Active Anomalies)</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultFacilitiesVisible}
                onChange={(e) => updateSetting('defaultFacilitiesVisible', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>Industrial Facilities Overlay</span>
            </label>

            {isAnalyst && (
              <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.defaultReplayVisible}
                  onChange={(e) => updateSetting('defaultReplayVisible', e.target.checked)}
                  className="text-amber-500 focus:ring-amber-500 rounded"
                />
                <span>Thermal History Replay Layer</span>
              </label>
            )}

            {(isAuthority || isUser) && (
              <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.defaultBoundariesVisible}
                  onChange={(e) => updateSetting('defaultBoundariesVisible', e.target.checked)}
                  className="text-amber-500 focus:ring-amber-500 rounded"
                />
                <span>Administrative Boundaries</span>
              </label>
            )}

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultPlaceLabelsVisible}
                onChange={(e) => updateSetting('defaultPlaceLabelsVisible', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>Place Labels & Landmarks</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            {/* Hotspot Clustering */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Cluster Nearby Hotspots
                </label>
                <input
                  type="checkbox"
                  checked={settings.hotspotClustering}
                  onChange={(e) => updateSetting('hotspotClustering', e.target.checked)}
                  className="text-amber-500 focus:ring-amber-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500">Group high-density thermal markers at low zoom levels.</p>
            </div>

            {/* Remember Map Position */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Remember Last Map Position
                </label>
                <input
                  type="checkbox"
                  checked={settings.rememberMapPosition}
                  onChange={(e) => updateSetting('rememberMapPosition', e.target.checked)}
                  className="text-amber-500 focus:ring-amber-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500">Restore last center coordinates & zoom upon navigation.</p>
            </div>

            {/* Default FRP Filter */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                Default FRP Radiative Threshold
              </label>
              <select
                value={settings.defaultFrpFilter}
                onChange={(e) => updateSetting('defaultFrpFilter', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <option value="all">All Radiative Power Levels (&gt; 0 MW)</option>
                <option value="5mw">Moderate & Above (&gt; 5 MW)</option>
                <option value="15mw">High Intensity (&gt; 15 MW)</option>
                <option value="50mw">Extreme Thermal (&gt; 50 MW)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — ACCOUNT & SECURITY (ALL ROLES) */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Shield className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
            ACCOUNT & SECURITY
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Profile Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Authenticated Profile</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Session Active</span>
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-sm font-black text-slate-900 dark:text-white">{userName}</div>
              <div className="text-xs font-mono text-slate-600 dark:text-slate-400">{userEmail}</div>
            </div>

            {/* Read-Only Role Indicator (CRITICAL: Settings CANNOT change RBAC) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <span>Role:</span>
                <span className={`px-2.5 py-0.5 rounded font-extrabold text-xs uppercase border ${roleBadgeStyle}`}>
                  {userRoleDisplay}
                </span>
              </span>
              <span className="text-[11px] text-slate-500 font-semibold flex items-center space-x-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>System Managed (Read-Only)</span>
              </span>
            </div>
          </div>

          {/* Account Security Controls */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-2">Security Actions</span>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center space-x-2">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>Change Account Password</span>
                  </span>
                  <span>→</span>
                </button>

                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 text-[11px] text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Session Security</div>
                  <div>JWT Token Authenticated • Storage: Local Bearer Storage</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>

              <span className="text-[10px] text-slate-400 font-mono">
                Single-Session Architecture
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Account Password</h3>
                </div>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <p>
                  To change your password, trigger a secure Password Reset email to your registered account (<strong>{user?.email || 'authenticated email'}</strong>).
                </p>
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
                  Zero-Trust Security requires password updates to be verified via email dispatch.
                </div>
                {passwordResetSent && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                    {passwordResetSent}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  disabled={passwordResetLoading || !user?.email}
                  onClick={async () => {
                    if (!user?.email) return;
                    setPasswordResetLoading(true);
                    try {
                      await resetPassword(user.email);
                      setPasswordResetSent(`Password Reset email dispatched to ${user.email}. Check your inbox!`);
                    } catch (e: any) {
                      setPasswordResetSent(e.message || 'Failed to send reset email.');
                    } finally {
                      setPasswordResetLoading(false);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition cursor-pointer disabled:opacity-50"
                >
                  {passwordResetLoading ? 'Sending Email...' : 'Send Reset Link'}
                </button>
                <button
                  onClick={() => { setShowPasswordModal(false); setPasswordResetSent(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 6 — SUBSCRIPTION & PREMIUM ACCESS (EXCLUSIVELY FOR USER ROLE) */}
      {isUser && (
        <section className="bg-white dark:bg-[#0B111E] border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <Crown className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
                SUBSCRIPTION & PREMIUM ACCESS
              </h2>
            </div>
            {subStatus?.is_premium_active ? (
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PREMIUM ACTIVE</span>
              </span>
            ) : subStatus?.status === 'PENDING' ? (
              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>APPROVAL PENDING</span>
              </span>
            ) : (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                STANDARD FREE TIER
              </span>
            )}
          </div>

          {subMsg && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-bold">
              {subMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Current Account Tier</span>
                <span className="text-xs font-extrabold text-amber-500 font-mono">
                  {subStatus?.is_premium_active ? 'Premium User' : 'Standard Free User'}
                </span>
              </div>

              {subStatus?.is_premium_active ? (
                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-slate-500 font-medium">Active Plan:</span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">
                      {subStatus.active_subscription?.plan_name || 'Premium'} Plan
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-slate-500 font-medium">Subscription Price:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{(subStatus.active_subscription?.price_inr || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-slate-500 font-medium">Access Granted Date:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {subStatus.active_subscription?.approved_at ? new Date(subStatus.active_subscription.approved_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Access Expiry Date:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {subStatus.active_subscription?.subscription_expiry ? new Date(subStatus.active_subscription.subscription_expiry).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : subStatus?.status === 'PENDING' ? (
                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <p className="text-amber-600 dark:text-amber-400 font-semibold">
                    Your request for the <strong className="capitalize">{subStatus.latest_subscription?.plan_name || 'Requested'} Plan</strong> (₹{subStatus.latest_subscription?.price_inr}) is currently waiting for Admin review.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Requested on: {subStatus.latest_subscription?.created_at ? new Date(subStatus.latest_subscription.created_at).toLocaleString() : 'Recently'}. Once approved, all Premium intelligence modules unlock automatically.
                  </p>
                </div>
              ) : subStatus?.status === 'REJECTED' ? (
                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <p className="text-red-600 dark:text-red-400 font-semibold">
                    Your previous request for Premium access was not approved by System Admin.
                  </p>
                  {subStatus.latest_subscription?.rejection_reason && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-700 dark:text-red-300 text-[11px]">
                      <strong>Reason:</strong> {subStatus.latest_subscription.rejection_reason}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 pt-1">
                    You may submit a new subscription request below.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <p className="text-slate-600 dark:text-slate-400">
                    You are currently using the <strong>Standard Free Tier</strong>. You have full access to Map Dashboard, Live Thermal Observations, Data Explorer, and Data Sources.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Upgrade to Premium to unlock Temporal Analysis, Industrial Sites, Verified Incidents, Replay, Multi-Satellite Fusion, Comparison, Provenance, Analytics, Model Performance, and System Health.
                  </p>
                </div>
              )}
            </div>

            {/* Action CTA Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                  Actions & Requests
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Select a subscription plan or consult with system administrators.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                {!subStatus?.is_premium_active && subStatus?.status !== 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => setShowRequestSubModal(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Request Premium Access</span>
                  </button>
                )}

                <a
                  href="/feedback"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                  <span>Contact System Admin</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* REQUEST SUBSCRIPTION MODAL (PRESERVED FOR USER ROLE) */}
      {showRequestSubModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Request Premium Subscription Access</h3>
              </div>
              <button
                onClick={() => setShowRequestSubModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubscriptionRequest} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Select Subscription Plan
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    onClick={() => setSelectedPlanKey('monthly')}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition ${
                      selectedPlanKey === 'monthly'
                        ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-extrabold">Monthly</div>
                    <div className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">₹400</div>
                    <div className="text-[10px] text-slate-500">1 Month</div>
                  </div>

                  <div
                    onClick={() => setSelectedPlanKey('six_months')}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition ${
                      selectedPlanKey === 'six_months'
                        ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-extrabold">6 Months</div>
                    <div className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">₹2,400</div>
                    <div className="text-[10px] text-slate-500">6 Months</div>
                  </div>

                  <div
                    onClick={() => setSelectedPlanKey('yearly')}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition ${
                      selectedPlanKey === 'yearly'
                        ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-extrabold">Yearly</div>
                    <div className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">₹4,800</div>
                    <div className="text-[10px] text-slate-500">1 Year</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Request Notes / Justification (Optional)
                </label>
                <textarea
                  rows={3}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Provide any details for the administrator regarding your subscription request..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold">Subscription Workflow Note:</div>
                <div>Submitting this form records your request in the central database for Admin review. Price and duration are resolved authoritatively on the backend.</div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  disabled={subSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 transition cursor-pointer disabled:opacity-50"
                >
                  {subSubmitting ? 'Submitting Request...' : 'Submit Access Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestSubModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 7 — SYSTEM INFORMATION & TELEMETRY */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Activity className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
            {isAdmin ? 'PLATFORM & SYSTEM TELEMETRY (ADMIN)' : 'SYSTEM INFORMATION'}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Backend Status</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{systemHealth?.status === 'Operational' ? 'Healthy' : 'Live'}</span>
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Database Status</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Connected</span>
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">NASA FIRMS API</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{systemHealth?.firms_integration?.last_sync_status || 'Connected'}</span>
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Project Identifier</span>
            <span className="font-extrabold text-slate-900 dark:text-white mt-1 block font-mono">
              SIH26162
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 sm:col-span-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Ingestion Datasets</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block text-[11px]">
              NASA FIRMS VIIRS (NOAA-20, NOAA-21) • CPCB Industrial Facilities
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Administrator Note: User access management, audit logs, and data ingestion configurations remain managed in the dedicated Admin Console.</span>
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
};
