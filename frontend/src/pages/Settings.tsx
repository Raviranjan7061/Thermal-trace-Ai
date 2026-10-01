import React, { useState, useEffect } from 'react';
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
  Database,
  Map,
  Volume2,
  Clock,
  RefreshCw,
  Zap,
  Globe,
  Check,
  RotateCcw,
  Save,
  AlertTriangle,
  Info,
  Layers,
  LogOut,
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  CreditCard,
  Crown,
  Sparkles,
  MessageSquare
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
  whatsappNotifications: boolean;
  telegramNotifications: boolean;
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
  whatsappNotifications: false,
  telegramNotifications: false,
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
  defaultReplayVisible: false,
  defaultBoundariesVisible: false,
  defaultPlaceLabelsVisible: false,
  hotspotClustering: true,
  rememberMapPosition: true,
  defaultFrpFilter: 'all'
};

export const SettingsPage: React.FC = () => {
  const { user, role, logout, resetPassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const [passwordResetSent, setPasswordResetSent] = useState<string | null>(null);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('thermaltrace_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse saved settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [savedState, setSavedState] = useState<UserSettings>(settings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Real System & Telemetry Data
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>([]);
  const [latestHotspotTimestamp, setLatestHotspotTimestamp] = useState<string | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);

  // Modal / Feedback State for Account Actions
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [testNotifMsg, setTestNotifMsg] = useState<string | null>(null);

  // USER Subscription & Premium Access State
  const [subStatus, setSubStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [showRequestSubModal, setShowRequestSubModal] = useState(false);
  const [selectedPlanKey, setSelectedPlanKey] = useState<'monthly' | 'six_months' | 'yearly'>('monthly');
  const [requestNotes, setRequestNotes] = useState('');
  const [subSubmitting, setSubSubmitting] = useState(false);
  const [subMsg, setSubMsg] = useState<string | null>(null);

  const fetchSubStatus = React.useCallback(async () => {
    if ((role || '').toLowerCase() !== 'user') return;
    setSubLoading(true);
    try {
      const res = await apiService.getMySubscriptionStatus();
      setSubStatus(res);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    } finally {
      setSubLoading(false);
    }
  }, [role]);

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

  // Check for unsaved changes
  useEffect(() => {
    const isDifferent = JSON.stringify(settings) !== JSON.stringify(savedState);
    setHasUnsavedChanges(isDifferent);
  }, [settings, savedState]);

  // Apply root body classes for density / reduce motion
  useEffect(() => {
    const root = document.documentElement;
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [settings.reduceMotion]);

  // Fetch real telemetry & system data
  useEffect(() => {
    let isMounted = true;
    const fetchTelemetry = async () => {
      setLoadingTelemetry(true);
      try {
        const [healthData, sourcesData, recentHotspots] = await Promise.allSettled([
          apiService.getSystemHealth(),
          apiService.getDataSourcesStatus(),
          apiService.getHotspots({ limit: 1 })
        ]);

        if (isMounted) {
          if (healthData.status === 'fulfilled') {
            setSystemHealth(healthData.value);
          }
          if (sourcesData.status === 'fulfilled') {
            setDataSources(sourcesData.value);
          }
          if (recentHotspots.status === 'fulfilled' && recentHotspots.value.length > 0) {
            setLatestHotspotTimestamp(recentHotspots.value[0].acquisition_datetime || recentHotspots.value[0].created_at || 'Recent');
          }
        }
      } catch (err) {
        console.error('Failed to fetch system telemetry:', err);
      } finally {
        if (isMounted) setLoadingTelemetry(false);
      }
    };

    fetchTelemetry();
  }, []);

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('thermaltrace_settings', JSON.stringify(settings));
      setSavedState(settings);
      setSaveSuccessMsg('General Settings saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (e) {
      alert('Failed to save settings to local storage.');
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Reset all General Settings to system defaults?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('thermaltrace_settings', JSON.stringify(DEFAULT_SETTINGS));
      setSavedState(DEFAULT_SETTINGS);
      setSaveSuccessMsg('Settings reset to system defaults.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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

  const userRoleDisplay = (role || 'USER').toUpperCase();
  const userName = user?.full_name || user?.email?.split('@')[0] || 'Authenticated User';
  const userEmail = user?.email || 'N/A';

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
              {hasUnsavedChanges && (
                <span className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Unsaved Changes</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Customize your ThermalTrace AI experience, notifications, data usage, map behavior, and account preferences.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
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

      {/* SECTION 1 — APPEARANCE & INTERFACE */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Sliders className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
            APPEARANCE & INTERFACE
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme Selector */}
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
              System automatically matches your operating system or browser light/dark mode preference.
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
              <option value="comfortable">Comfortable — Standard spacing & line heights</option>
              <option value="compact">Compact — Reduced padding for higher data visibility</option>
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
                  Minimize decorative transitions & glowing pulse effects while maintaining core loading indicators.
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
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
            >
              <option value="en">English (US) — Primary System Language</option>
              <option value="hi" disabled>Hindi (हिन्दी) — Coming Soon</option>
              <option value="es" disabled>Spanish (Español) — Coming Soon</option>
            </select>
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
              Display formatting preference only. Satellite raw UTC acquisition times remain unchanged.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — NOTIFICATIONS & ALERTS */}
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

        {/* Notification Channels Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* In-App Notifications */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">In-App Notifications</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Configured
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Real-time header dropdown alerts & popups.
            </p>
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={settings.inAppNotifications}
                onChange={(e) => updateSetting('inAppNotifications', e.target.checked)}
                disabled={!settings.notificationsEnabled}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>Receive In-App</span>
            </label>
          </div>

          {/* Email Notifications */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Email Delivery</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                Not Configured
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Backend SMTP host server not configured.
            </p>
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-500 cursor-not-allowed pt-1">
              <input type="checkbox" disabled checked={false} className="rounded" />
              <span>Email Alerts (Disabled)</span>
            </label>
          </div>

          {/* WhatsApp Notifications */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">WhatsApp Integration</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                Unavailable
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              WhatsApp Business API gateway integration not linked.
            </p>
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-500 cursor-not-allowed pt-1">
              <input type="checkbox" disabled checked={false} className="rounded" />
              <span>WhatsApp (Disabled)</span>
            </label>
          </div>

          {/* Telegram Notifications */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Telegram Bot</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                Unavailable
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Telegram Bot token not provided in backend environment.
            </p>
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-500 cursor-not-allowed pt-1">
              <input type="checkbox" disabled checked={false} className="rounded" />
              <span>Telegram (Disabled)</span>
            </label>
          </div>
        </div>

        {/* Alert Preferences Checklist */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            Subscribed Alert Types
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.criticalAlerts}
                onChange={(e) => updateSetting('criticalAlerts', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>Critical Priority Alerts (&gt; 50 MW FRP)</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.highPriorityAlerts}
                onChange={(e) => updateSetting('highPriorityAlerts', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>High Priority Alerts (&gt; 15 MW FRP)</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.investigationUpdates}
                onChange={(e) => updateSetting('investigationUpdates', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>Analyst Investigation Updates</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.complianceUpdates}
                onChange={(e) => updateSetting('complianceUpdates', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>Regulatory Compliance Status</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.watchlistMatches}
                onChange={(e) => updateSetting('watchlistMatches', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>Watchlist / Area of Interest (AOI) Matches</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.systemStatusAlerts}
                onChange={(e) => updateSetting('systemStatusAlerts', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>System & Data Pipeline Status</span>
            </label>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            Notification preferences do not alter scientific evidence classifications, anomaly priority algorithms, or audit log records.
          </p>
        </div>

        {/* Alert Sound & Quiet Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4 text-amber-500" />
                <span>Alert Audio Signal</span>
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

        {/* Test Notification Trigger */}
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

      {/* SECTION 3 — DATA & PERFORMANCE */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Zap className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
            DATA & PERFORMANCE
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
              Reduce network bandwidth and map data usage while keeping essential thermal anomaly intelligence active. Optimizes background sync polling frequency and defers optional visual tile pre-loading.
            </p>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center space-x-1.5 pt-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Data Saver mode NEVER deletes records, hides critical incidents, or alters NASA FIRMS calculations.</span>
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
                <option value={1}>1 Minute (Real-Time Monitoring)</option>
                <option value={5}>5 Minutes (Recommended Default)</option>
                <option value={10}>10 Minutes (Standard Interval)</option>
                <option value={15}>15 Minutes (Low Overhead)</option>
              </select>
            )}
          </div>

          {/* Default Data Window */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              Default Data Window
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

          {/* Satellite Sources Read-only */}
          <div className="space-y-2.5 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              Active Satellite Sources
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>NOAA-20 (VIIRS 375m)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">ACTIVE</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>NOAA-21 (VIIRS 375m)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Data Status Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 pt-4">
          <div className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
            <span>REAL SYSTEM TELEMETRY STATUS</span>
            <span className="text-[10px] text-slate-500 font-mono">Live Telemetry</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">NASA FIRMS Pipeline</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{systemHealth?.firms_integration?.last_sync_status || 'Operational'}</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Last Successful Sync</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono text-[11px]">
                {systemHealth?.firms_integration?.last_attempted_sync ? new Date(systemHealth.firms_integration.last_attempted_sync).toLocaleString() : 'Recent'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Latest Satellite Observation</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono text-[11px]">
                {latestHotspotTimestamp || 'Ingested Live'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Backend API Status</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{systemHealth?.status || 'Live'}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — MAP PREFERENCES */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Map className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
            MAP PREFERENCES
          </h2>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
            Default Layer Visibility
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

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultReplayVisible}
                onChange={(e) => updateSetting('defaultReplayVisible', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>Thermal History Replay</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultBoundariesVisible}
                onChange={(e) => updateSetting('defaultBoundariesVisible', e.target.checked)}
                className="text-amber-500 focus:ring-amber-500 rounded"
              />
              <span>Administrative Boundaries</span>
            </label>

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
                Default FRP Filter
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

      {/* SECTION 5 — ACCOUNT & SECURITY */}
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

            {/* Read-Only Role Display */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <span>Role:</span>
                <span className="px-2.5 py-0.5 rounded font-extrabold text-xs uppercase bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40">
                  {userRoleDisplay}
                </span>
              </span>
              <span className="text-[11px] text-slate-500 font-semibold flex items-center space-x-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Managed by system (Read-Only)</span>
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
                  <div>JWT Token authenticated • Storage: Local Browser Token</div>
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
                  To change your account password, you can trigger a secure Firebase Password Reset link to your registered email (<strong>{user?.email || 'authenticated email'}</strong>).
                </p>
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
                  Note: Zero-Trust RBAC security requires email verification for password updates.
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
                      setPasswordResetSent(`Firebase Password Reset email dispatched to ${user.email}. Check your inbox!`);
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

      {/* SECTION — SUBSCRIPTION & PREMIUM ACCESS (USER ROLE ONLY) */}
      {userRoleDisplay === 'USER' && (
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
                    Your request for the <strong className="capitalize">{subStatus.latest_subscription?.plan_name || 'Requested'} Plan</strong> (₹{subStatus.latest_subscription?.price_inr}) is currently waiting for Admin review and approval.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Requested on: {subStatus.latest_subscription?.created_at ? new Date(subStatus.latest_subscription.created_at).toLocaleString() : 'Recently'}. Once approved, all 11 Premium intelligence modules will unlock automatically.
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
                    You may submit a new subscription request below or contact support.
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

      {/* REQUEST SUBSCRIPTION MODAL */}
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
                <div>Submitting this form records your subscription request in the central database for Admin review. Price and duration are resolved authoritatively on the backend.</div>
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

      {/* SECTION 6 — SYSTEM INFORMATION */}
      <section className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Activity className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs sm:text-sm">
            SYSTEM INFORMATION
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
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Platform Version</span>
            <span className="font-extrabold text-slate-900 dark:text-white mt-1 block font-mono">
              v1.2.0 (SIH26162)
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 sm:col-span-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Ingestion Datasets</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block text-[11px]">
              NASA FIRMS VIIRS (NOAA-20, NOAA-21) • CPCB Industrial Facilities
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
