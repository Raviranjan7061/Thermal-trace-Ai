import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { SystemHealth } from '../../types';
import { GlobalSearch } from '../Search/GlobalSearch';
import { HotspotComparisonModal } from '../Compare/HotspotComparisonModal';
import { AuthorityModal } from '../Authority/AuthorityModal';
import {
  Satellite,
  RefreshCw,
  Search,
  ArrowRightLeft,
  User,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Bell,
  CheckCheck,
  Sun,
  Moon,
  Monitor,
  Check
} from 'lucide-react';
import { NotificationItem } from '../../types';
import { useTheme } from '../../context/ThemeContext';



const NotificationCenterDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    try {
      const data = await apiService.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await apiService.markAllNotificationsRead();
      await fetchNotifs();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiService.markNotificationRead(id);
      await fetchNotifs();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  return (
    <div className="relative select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 p-2 rounded-xl border border-slate-300 dark:border-slate-800 transition cursor-pointer"
        title="System Notifications"
      >
        <Bell className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-pulse shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3.5 z-50 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">System Notifications</span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={loading}
                className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center space-x-1 font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{loading ? 'Marking...' : 'Mark all read'}</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2">
            {notifications.length === 0 ? (
              <div className="py-6 px-4 text-center text-slate-500 dark:text-slate-400">
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <Bell className="w-6 h-6 text-slate-400 dark:text-slate-600 mb-1" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">No new system notifications</span>
                  <span className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                    Real-time satellite detection & operational alert notifications will appear here.
                  </span>
                </div>
              </div>
            ) : (
              notifications.map((n) => {
                const sev = (n.severity || 'info').toLowerCase();
                const isCritical = sev === 'critical' || n.title.includes('CRITICAL');
                const isHigh = sev === 'high' || n.title.includes('HIGH');
                const isWarning = sev === 'warning' || sev === 'moderate' || n.title.includes('LOW');

                const severityBadgeStyle = isCritical
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                  : isHigh
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : isWarning
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';

                const priorityLabel = isCritical
                  ? 'CRITICAL'
                  : isHigh
                  ? 'HIGH'
                  : isWarning
                  ? 'MODERATE'
                  : 'INFO';

                return (
                  <div
                    key={n.notification_id}
                    onClick={(e) => !n.is_read && handleMarkOne(n.notification_id, e)}
                    className={`p-3 rounded-xl border text-xs transition relative ${
                      n.is_read
                        ? 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/70 text-slate-500 dark:text-slate-400'
                        : 'bg-slate-100 dark:bg-slate-800/80 border-cyan-500/30 text-slate-900 dark:text-slate-200 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${severityBadgeStyle}`}>
                          {priorityLabel}
                        </span>
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{n.title}</div>
                      </div>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0 mt-1" />
                      )}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px] mt-1.5 leading-relaxed font-mono">
                      {n.message}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200 dark:border-slate-800/40 text-[10px] text-slate-400 dark:text-slate-500">
                      <div className="flex items-center space-x-2">
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                        {n.related_entity_id && (
                          <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 bg-slate-200/50 dark:bg-slate-800/50 px-1 py-0.2 rounded">
                            Ref: #{n.related_entity_id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      {!n.is_read && (
                        <span className="text-cyan-600 dark:text-cyan-400 font-semibold text-[10px]">Unread • Click to read</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isAuthorityOpen, setIsAuthorityOpen] = useState(false);
  const [recentHotspots, setRecentHotspots] = useState<any[]>([]);

  const fetchHealth = async () => {
    try {
      const data = await apiService.getSystemHealth();
      setHealth(data);
      setBackendOffline(false);
    } catch (err) {
      setBackendOffline(true);
      setHealth(null);
    }
  };

  useEffect(() => {
    fetchHealth();
    apiService.getHotspots({ limit: 10 }).then(setRecentHotspots).catch(console.error);
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (role !== 'admin' && role !== 'analyst') {
      alert('Manual FIRMS synchronization is restricted to Analyst or Administrator roles.');
      return;
    }
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await apiService.triggerFirmsSync();
      setSyncMessage(`Sync: ${res.result?.inserted || 0} inserted, ${res.result?.skipped || 0} duplicates skipped.`);
      await fetchHealth();
      window.dispatchEvent(new CustomEvent('firms-synced'));
    } catch (err: any) {
      setSyncMessage(err.response?.data?.detail || 'NASA FIRMS synchronization failed.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 8000);
    }
  };

  return (
    <>
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 px-6 py-3 flex flex-wrap items-center justify-between sticky top-0 z-30 transition-colors duration-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-orange-600 to-amber-500 p-2 rounded-lg shadow-lg shadow-amber-500/10">
              <Satellite className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wide text-slate-900 dark:text-white">ThermalTrace AI</span>
                <span className="bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 text-xs font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                  SIH26162
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Satellite-Based Industrial Thermal Anomaly Intelligence Platform
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-2 sm:mt-0">
          {/* Global Search Bar Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 px-3.5 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 transition min-w-[220px] md:min-w-[280px] justify-between cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Search incidents, facilities, locations...</span>
            </div>
            <span className="bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-500 font-mono text-[10px] px-1.5 py-0.5 rounded">
              /
            </span>
          </button>

          {/* Comparison Tool Button */}
          <button
            onClick={() => setIsCompareOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 transition cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span className="hidden md:inline">Compare Events</span>
          </button>

          {/* Authority Briefing Button (Authority & Admin only) */}
          {(role === 'authority' || role === 'admin') && (
            <button
              onClick={() => setIsAuthorityOpen(true)}
              className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 transition cursor-pointer"
              title="Open Regulatory Authority Situational Awareness Briefing"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="hidden md:inline">Authority Briefing</span>
            </button>
          )}

          {/* Health Indicator */}
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                backendOffline
                  ? 'bg-red-500'
                  : health?.status === 'Operational'
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                  : 'bg-amber-500'
              }`}
            />
            <span className="text-slate-800 dark:text-slate-200 font-semibold text-[11px] hidden sm:inline">
              {backendOffline ? 'Backend Offline' : health?.status === 'Operational' ? 'Backend Live' : 'Connecting...'}
            </span>
          </div>

          {/* Sync FIRMS Button (Analyst & Admin only) */}
          {(role === 'analyst' || role === 'admin') && (
            <button
              onClick={handleManualSync}
              disabled={syncing || backendOffline}
              className="flex items-center space-x-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition border border-slate-300 dark:border-slate-700 disabled:opacity-50 cursor-pointer"
              title="Trigger manual NASA FIRMS satellite data synchronization"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-amber-500 dark:text-amber-400' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync FIRMS'}</span>
            </button>
          )}

          {/* Notification Center */}
          <NotificationCenterDropdown />

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme((resolvedTheme || theme) === 'dark' ? 'light' : 'dark')}
            className="bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 p-2 rounded-xl border border-slate-300 dark:border-slate-800 transition cursor-pointer"
            title={`Switch to ${(resolvedTheme || theme) === 'dark' ? 'Normal / Light' : 'Dark'} Mode`}
            aria-label="Toggle theme mode"
          >
            {(resolvedTheme || theme) === 'dark' ? (
              <Moon className="w-4 h-4 text-amber-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-600" />
            )}
          </button>

          {/* Authenticated User Role Badge */}
          {user ? (
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs hidden sm:inline">
                {user.full_name || user.email}
              </span>
              <span
                className={`uppercase font-extrabold px-2 py-0.5 rounded text-[10px] tracking-wider ${
                  role === 'admin'
                    ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40'
                    : role === 'authority'
                    ? 'bg-blue-600 text-white'
                    : role === 'analyst'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {role}
              </span>
              <button onClick={logout} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white ml-1 cursor-pointer" title="Sign out">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectHotspot={() => setIsSearchOpen(false)}
      />

      {/* Event Comparison Modal */}
      <HotspotComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        availableHotspots={recentHotspots}
      />

      {/* Authority Monitoring Briefing Modal */}
      <AuthorityModal
        isOpen={isAuthorityOpen}
        onClose={() => setIsAuthorityOpen(false)}
      />
    </>
  );
};
