import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, AdminAuditLog, SystemHealth, AnalyticsOverview, SubscriptionItem } from '../types';
import {
  Shield,
  Users,
  UserPlus,
  Activity,
  Database,
  FileText,
  RefreshCw,
  Radio,
  Flame,
  BarChart3,
  CheckCircle2,
  Lock,
  ArrowRight,
  Server,
  Crown,
  Check,
  X,
  XCircle,
  Clock
} from 'lucide-react';
import { PaymentChatWindow } from '../components/Subscription/PaymentChatWindow';

const formatTimestampDisplay = (raw?: string): string => {
  if (!raw || typeof raw !== 'string') return 'N/A';
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed.toUpperCase() === 'N/A' || trimmed.toUpperCase() === 'UNDEFINED' || trimmed.toUpperCase() === 'NULL') {
    return 'N/A';
  }

  if (trimmed.includes('IST') || (trimmed.includes(',') && trimmed.includes(' '))) {
    return trimmed;
  }

  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return 'N/A';
};

export const AdminConsolePage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync FIRMS state
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Provision User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState('analyst');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [subFilter, setSubFilter] = useState<string>('ALL');
  const [subActionLoading, setSubActionLoading] = useState<string | null>(null);
  const [subMsg, setSubMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Payment Verification & Chat Drawer States
  const [selectedChatSub, setSelectedChatSub] = useState<SubscriptionItem | null>(null);
  const [selectedVerificationSub, setSelectedVerificationSub] = useState<SubscriptionItem | null>(null);
  const [resubmitReasonInput, setResubmitReasonInput] = useState('');
  const [showResubmitPrompt, setShowResubmitPrompt] = useState(false);
  const [showProofZoom, setShowProofZoom] = useState(false);


  // Rejection Modal State
  const [rejectModal, setRejectModal] = useState<{ open: boolean; subId: string | null; reason: string }>({
    open: false,
    subId: null,
    reason: ''
  });

  const loadCommandCenterData = async () => {
    setLoading(true);
    try {
      const [uData, aData, hData, ovData, subData] = await Promise.all([
        apiService.getAdminUsers(),
        apiService.getAdminAuditLogs(10),
        apiService.getSystemHealth(),
        apiService.getAnalyticsOverview(),
        apiService.getAdminSubscriptions().catch(() => [])
      ]);
      setUsers(uData);
      setAuditLogs(aData);
      setHealth(hData);
      setAnalytics(ovData);
      setSubscriptions(subData);
    } catch (err) {
      console.error('Failed to load command center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommandCenterData();
  }, []);

  const handleApproveSubscription = async (subId: string) => {
    setSubActionLoading(subId);
    setSubMsg(null);
    try {
      await apiService.approveSubscription(subId);
      setSubMsg({ type: 'success', text: 'Subscription request approved successfully.' });
      await loadCommandCenterData();
    } catch (err: any) {
      setSubMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to approve subscription.' });
    } finally {
      setSubActionLoading(null);
    }
  };

  const handleOpenRejectModal = (subId: string) => {
    setRejectModal({ open: true, subId, reason: '' });
  };

  const handleRejectSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal.subId) return;
    setSubActionLoading(rejectModal.subId);
    setSubMsg(null);
    try {
      await apiService.rejectSubscription(rejectModal.subId, {
        rejection_reason: rejectModal.reason.trim() || undefined
      });
      setSubMsg({ type: 'success', text: 'Subscription request rejected.' });
      setRejectModal({ open: false, subId: null, reason: '' });
      await loadCommandCenterData();
    } catch (err: any) {
      setSubMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to reject subscription.' });
    } finally {
      setSubActionLoading(null);
    }
  };

  const handleSyncFirms = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await apiService.triggerFirmsSync();
      setSyncMessage({
        type: 'success',
        text: res.message || 'FIRMS synchronization executed successfully.'
      });
      await loadCommandCenterData();
    } catch (err: any) {
      setSyncMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to trigger FIRMS sync.'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      await apiService.createAdminUser({
        full_name: nameInput,
        email: emailInput,
        password: passwordInput,
        role: roleInput
      });
      setIsCreateOpen(false);
      setNameInput('');
      setEmailInput('');
      setPasswordInput('');
      setRoleInput('analyst');
      await loadCommandCenterData();
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Failed to provision user.');
    } finally {
      setCreating(false);
    }
  };

  // Derived counts
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const analystCount = users.filter((u) => u.role.toLowerCase() === 'analyst').length;
  const authorityCount = users.filter((u) => u.role.toLowerCase() === 'authority').length;
  const adminCount = users.filter((u) => u.role.toLowerCase() === 'admin').length;
  const userRoleCount = users.filter((u) => u.role.toLowerCase() === 'user').length;
  const authorizedStaff = analystCount + authorityCount;

  const pendingSubCount = subscriptions.filter((s) => s.status === 'PENDING').length;
  const filteredSubscriptions = subscriptions.filter((s) => {
    if (subFilter === 'ALL') return true;
    return s.status === subFilter;
  });

  const totalObservations = analytics?.data_freshness?.total_db_records ?? health?.database?.hotspots_stored ?? 0;
  const totalAlerts = analytics?.high_critical_count ?? 0;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto custom-scrollbar p-6 space-y-6 transition-colors duration-200">
      {/* Top Header & System Command Center Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <span>ThermalTrace AI — System Command Center</span>
            </h1>
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/30">
              Platform Governance
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Platform administration, security overview, data pipeline, and operational health.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision Authorized User</span>
          </button>
        </div>
      </div>

      {/* Top System Status Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono shadow-sm dark:shadow-none">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-500 dark:text-slate-400">BACKEND:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{health?.status || 'Operational'}</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
          <span className="text-slate-500 dark:text-slate-400">DATABASE:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Connected</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"></span>
          <span className="text-slate-500 dark:text-slate-400">NASA FIRMS:</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">
            {health?.firms_integration?.last_sync_status || 'Connected'}
          </span>
        </div>

        <div className="flex items-center space-x-2 truncate">
          <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400"></span>
          <span className="text-slate-500 dark:text-slate-400">FRESHNESS:</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-bold truncate">
            {formatTimestampDisplay(analytics?.data_freshness?.latest_obs)}
          </span>
        </div>
      </div>

      {/* Sync Result Alert */}
      {syncMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
            syncMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{syncMessage.text}</span>
        </div>
      )}

      {/* ADMIN KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <button
          onClick={() => navigate('/admin/users')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-xl p-3 text-left transition flex flex-col justify-between space-y-1 shadow-sm dark:shadow-none"
        >
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Users</div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{loading ? '...' : totalUsers}</div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">Manage Users →</div>
        </button>

        <button
          onClick={() => navigate('/admin/users')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-xl p-3 text-left transition flex flex-col justify-between space-y-1 shadow-sm dark:shadow-none"
        >
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Active Users</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{loading ? '...' : activeUsers}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Account status</div>
        </button>

        <button
          onClick={() => navigate('/admin/users')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 text-left transition flex flex-col justify-between space-y-1 shadow-sm dark:shadow-none"
        >
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Authorized Staff</div>
          <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{loading ? '...' : authorizedStaff}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Analyst + Authority</div>
        </button>

        <button
          onClick={() => navigate('/admin/audit')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl p-3 text-left transition flex flex-col justify-between space-y-1 shadow-sm dark:shadow-none"
        >
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Security Events</div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{loading ? '...' : auditLogs.length}</div>
          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">View Audit →</div>
        </button>

        <button
          onClick={() => navigate('/pipeline-status')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-xl p-3 text-left transition flex flex-col justify-between space-y-1 shadow-sm dark:shadow-none"
        >
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Thermal Observations</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{loading ? '...' : totalObservations}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Pipeline DB</div>
        </button>

        <button
          onClick={() => navigate('/alerts')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-500/50 rounded-xl p-3 text-left transition flex flex-col justify-between space-y-1 shadow-sm dark:shadow-none"
        >
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Operational Alerts</div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400">{loading ? '...' : totalAlerts}</div>
          <div className="text-[10px] text-red-600 dark:text-red-400 font-mono">Monitor Alerts →</div>
        </button>
      </div>

      {/* Quick Admin Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-sm dark:shadow-none">
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quick System Actions</div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Provision Authorized User</span>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
          >
            <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Manage Users & Roles</span>
          </button>

          <button
            onClick={() => navigate('/admin/audit')}
            className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>View Security Audit</span>
          </button>

          <button
            onClick={() => navigate('/system-health')}
            className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Check System Health</span>
          </button>

          <button
            onClick={() => navigate('/pipeline-status')}
            className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
          >
            <Radio className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>View FIRMS Pipeline</span>
          </button>

          <button
            onClick={handleSyncFirms}
            disabled={syncing}
            className="bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync FIRMS'}</span>
          </button>
        </div>
      </div>

      {/* Main Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 span): Pipeline & Role Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* NASA FIRMS Pipeline Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Radio className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">NASA FIRMS Data Pipeline Command</h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate('/pipeline-status')}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold flex items-center space-x-1"
                >
                  <span>View Pipeline Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Feed Ingestion Status</span>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {health?.firms_integration?.last_sync_status || 'OPERATIONAL'}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Total Observations Stored</span>
                <div className="text-amber-600 dark:text-amber-400 font-bold">{totalObservations} Records</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Constellation Orbiters</span>
                <div className="text-cyan-600 dark:text-cyan-400 font-bold">NOAA-20 / NOAA-21</div>
              </div>
            </div>
          </div>

          {/* User & Role Breakdown Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Platform Role & Access Distribution</h2>
              </div>

              <button
                onClick={() => navigate('/admin/users')}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold flex items-center space-x-1"
              >
                <span>Manage Users</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">PUBLIC USER</div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-200">{userRoleCount}</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold">ANALYST</div>
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{analystCount}</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase font-bold">AUTHORITY</div>
                <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{authorityCount}</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">ADMIN</div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{adminCount}</div>
              </div>
            </div>
          </div>

          {/* USER Premium Subscription Requests Panel */}
          <div className="bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-amber-500/20 rounded-xl p-5 space-y-4 shadow-sm dark:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">USER Premium Subscription Requests</h2>
                {pendingSubCount > 0 && (
                  <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
                    {pendingSubCount} PENDING
                  </span>
                )}
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                {(['ALL', 'PENDING', 'PAYMENT_DISCUSSION', 'PAYMENT_VERIFICATION_PENDING', 'PAYMENT_ACTION_REQUIRED', 'ACTIVE', 'CANCELLED', 'REJECTED', 'EXPIRED'] as const).map((filter) => {
                  const count =
                    filter === 'ALL'
                      ? subscriptions.length
                      : subscriptions.filter((s) => s.status === filter).length;
                  return (
                    <button
                      key={filter}
                      onClick={() => setSubFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg border transition ${
                        subFilter === filter
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 font-extrabold'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {filter.replace('_', ' ')} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {subMsg && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                  subMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{subMsg.text}</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800 pb-2">
                    <th className="pb-2 font-bold">User</th>
                    <th className="pb-2 font-bold">Plan Details</th>
                    <th className="pb-2 font-bold">Requested Date</th>
                    <th className="pb-2 font-bold">Status</th>
                    <th className="pb-2 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No subscription requests found matching status filter "{subFilter}".
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 pr-2">
                          <div className="font-bold text-slate-900 dark:text-white">{sub.user_email.split('@')[0]}</div>
                          <div className="text-[11px] font-mono text-slate-500">{sub.user_email}</div>
                          {sub.subscription_code && (
                            <div className="text-[9px] font-mono text-amber-500 font-bold">{sub.subscription_code}</div>
                          )}
                        </td>

                        <td className="py-3 px-2">
                          <div className="font-extrabold text-amber-600 dark:text-amber-400 capitalize">
                            {sub.plan_name} Plan
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            ₹{sub.price_inr.toLocaleString('en-IN')} / {sub.plan_id === 'monthly' ? '1 Month' : sub.plan_id === 'six_months' ? '6 Months' : '1 Year'}
                          </div>
                          {sub.utr_reference && (
                            <div className="text-[10px] font-mono text-emerald-400 font-bold mt-0.5">
                              Ref/UTR: {sub.utr_reference}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-2 text-[11px] font-mono text-slate-500">
                          {formatTimestampDisplay(sub.created_at)}
                        </td>

                        <td className="py-3 px-2">
                          {sub.status === 'ACTIVE' ? (
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-black">
                              ACTIVE (Exp: {sub.subscription_expiry ? new Date(sub.subscription_expiry).toLocaleDateString() : 'N/A'})
                            </span>
                          ) : sub.status === 'PENDING' ? (
                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                              PENDING APPROVAL
                            </span>
                          ) : sub.status === 'PAYMENT_DISCUSSION' ? (
                            <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                              PAYMENT DISCUSSION
                            </span>
                          ) : sub.status === 'PAYMENT_VERIFICATION_PENDING' ? (
                            <span className="bg-amber-500/20 text-amber-500 border border-amber-500/50 px-2 py-0.5 rounded text-[10px] font-extrabold animate-pulse">
                              VERIFICATION PENDING
                            </span>
                          ) : sub.status === 'PAYMENT_ACTION_REQUIRED' ? (
                            <span className="bg-red-500/15 text-red-500 border border-red-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                              ACTION REQUIRED
                            </span>
                          ) : sub.status === 'CANCELLED' ? (
                            <span className="bg-slate-500/15 text-slate-400 border border-slate-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                              CANCELLED BY USER
                            </span>
                          ) : sub.status === 'REJECTED' ? (
                            <span className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                              REJECTED
                            </span>
                          ) : (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              EXPIRED
                            </span>
                          )}
                        </td>

                        <td className="py-3 pl-2 text-right">
                          {sub.status === 'PENDING' ? (
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={async () => {
                                  try {
                                    const updated = await apiService.startPaymentConversation(sub.id);
                                    loadCommandCenterData();
                                    setSelectedChatSub(updated);
                                  } catch (e: any) {
                                    alert(e.response?.data?.detail || 'Failed to start conversation.');
                                  }
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer shadow-xs"
                              >
                                <Crown className="w-3.5 h-3.5" />
                                <span>Start Payment Conversation</span>
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(sub.id)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : sub.status === 'PAYMENT_VERIFICATION_PENDING' ? (
                            <button
                              onClick={() => setSelectedVerificationSub(sub)}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black px-3 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer shadow-md ml-auto"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Review & Verify Payment</span>
                            </button>
                          ) : sub.status === 'PAYMENT_DISCUSSION' || sub.status === 'PAYMENT_ACTION_REQUIRED' ? (
                            <button
                              onClick={() => setSelectedChatSub(sub)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer ml-auto"
                            >
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                              <span>Open Conversation</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No actions pending</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>


          {/* Recent Administrative Activity Log */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Security & Administrative Activity</h2>
              </div>

              <button
                onClick={() => navigate('/admin/audit')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold flex items-center space-x-1"
              >
                <span>View Full Security Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-600 dark:text-slate-500 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800 pb-2">
                    <th className="pb-2">Action</th>
                    <th className="pb-2">Actor Email</th>
                    <th className="pb-2">Target Entity</th>
                    <th className="pb-2 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-500 font-sans">
                        No security activity records found.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.slice(0, 5).map((log) => (
                      <tr key={log.audit_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 font-bold text-cyan-600 dark:text-cyan-400">{log.action}</td>
                        <td className="py-2.5 text-slate-800 dark:text-slate-300">{log.actor_email || 'System'}</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">{log.entity_type} ({log.entity_id.substring(0, 8)})</td>
                        <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">{log.timestamp}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): System Health & Operational Snapshot */}
        <div className="space-y-6">
          {/* Platform Health Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Platform Health</h2>
              </div>
              <button
                onClick={() => navigate('/system-health')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold"
              >
                Open Health →
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Backend API:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{health?.status || 'Operational'}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Database Engine:</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono">SQLite (Connected)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">NASA FIRMS Pipeline:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">Ready</span>
              </div>
            </div>
          </div>

          {/* Operational Snapshot Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Operational Snapshot</h2>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="text-slate-500">Total Detections:</span>
                <span className="text-slate-900 dark:text-slate-100 font-bold">{analytics?.total_detections ?? totalObservations}</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="text-slate-500">Industrial Candidates:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{analytics?.industrial_candidates ?? 0}</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="text-slate-500">Natural Fire Candidates:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{analytics?.natural_fire_candidates ?? 0}</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="text-slate-500">Active High Alerts:</span>
                <span className="text-red-600 dark:text-red-400 font-bold">{totalAlerts}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs font-semibold">
              <button
                onClick={() => navigate('/alerts')}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                View Operational Alerts →
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
              >
                View Analytics →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Provision User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-[650] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-amber-500" />
                <span>Provision Authorized User Account</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="ramesh@thermaltrace.ai"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-semibold mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-semibold mb-1">Assigned System Role</label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-bold uppercase text-amber-600 dark:text-amber-400"
                >
                  <option value="analyst" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">ANALYST — Operational Thermal Analyst</option>
                  <option value="authority" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">AUTHORITY — Regulatory Oversight Briefings</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Subscription Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-[650] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span>Reject Subscription Request</span>
              </h3>
              <button onClick={() => setRejectModal({ open: false, subId: null, reason: '' })} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectSubscriptionSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  rows={3}
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  placeholder="e.g. Account details require verification before granting premium features."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, subId: null, reason: '' })}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subActionLoading === rejectModal.subId}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50"
                >
                  {subActionLoading === rejectModal.subId ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PAYMENT CONVERSATION DRAWER */}
      {selectedChatSub && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[700] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Payment Conversation ({selectedChatSub.user_email})</span>
                </h3>
                <span className="text-[10px] font-mono text-amber-500 font-bold">
                  {selectedChatSub.subscription_code || selectedChatSub.id} — {selectedChatSub.plan_name} (₹{selectedChatSub.price_inr?.toLocaleString('en-IN')})
                </span>
              </div>
              <button onClick={() => setSelectedChatSub(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <PaymentChatWindow subscriptionId={selectedChatSub.id} showPaidButton={false} />
          </div>
        </div>
      )}

      {/* ADMIN PAYMENT VERIFICATION DRAWER */}
      {selectedVerificationSub && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[750] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-3xl shadow-2xl p-6 space-y-5 text-xs text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-500" />
                  <span>Review Payment & Verify Premium Access</span>
                </h3>
                <span className="text-[11px] font-mono text-amber-500 font-bold">
                  Code: {selectedVerificationSub.subscription_code || selectedVerificationSub.id}
                </span>
              </div>
              <button onClick={() => { setSelectedVerificationSub(null); setShowResubmitPrompt(false); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {/* PAYMENT VERIFICATION SUMMARY */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-sans">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Subscriber Email</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">{selectedVerificationSub.user_email}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Selected Plan & Price</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-xs">
                  {selectedVerificationSub.plan_name} — ₹{selectedVerificationSub.price_inr?.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Transaction Ref / UTR</span>
                <span className="font-extrabold text-emerald-400 font-mono text-sm tracking-wide block">
                  {selectedVerificationSub.utr_reference || 'N/A'}
                </span>
              </div>
            </div>

            {/* PAYMENT PROOF SCREENSHOT PREVIEW */}
            {selectedVerificationSub.payment_proof_screenshot && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-xs flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Payment Proof Screenshot</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowProofZoom(!showProofZoom)}
                    className="text-[11px] text-amber-400 hover:underline font-bold"
                  >
                    {showProofZoom ? 'Hide Full Size' : 'View Full Image'}
                  </button>
                </div>

                <div className="max-h-48 overflow-hidden rounded-lg border border-slate-800 flex items-center justify-center bg-black/40">
                  <img
                    src={selectedVerificationSub.payment_proof_screenshot}
                    alt="Payment Proof"
                    className={`object-contain transition-all ${showProofZoom ? 'max-h-96' : 'max-h-44'}`}
                  />
                </div>
              </div>
            )}

            {/* RESUBMIT REASON PROMPT */}
            {showResubmitPrompt && (
              <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl space-y-3">
                <span className="font-bold text-red-400 text-xs block">Request Payment Detail Resubmission</span>
                <textarea
                  rows={3}
                  value={resubmitReasonInput}
                  onChange={(e) => setResubmitReasonInput(e.target.value)}
                  placeholder="Explain why resubmission is required (e.g. UTR reference not found in bank statement, please check and re-enter)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowResubmitPrompt(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!resubmitReasonInput.trim()}
                    onClick={async () => {
                      try {
                        await apiService.requestPaymentResubmit(selectedVerificationSub.id, resubmitReasonInput.trim());
                        loadCommandCenterData();
                        setSelectedVerificationSub(null);
                        setShowResubmitPrompt(false);
                        setResubmitReasonInput('');
                      } catch (e: any) {
                        alert(e.response?.data?.detail || 'Failed to request resubmission.');
                      }
                    }}
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    Send Resubmit Request
                  </button>
                </div>
              </div>
            )}

            {/* PRIVATE CHAT THREAD INSIDE VERIFICATION DRAWER */}
            <div className="space-y-1">
              <span className="font-bold text-slate-400 text-[11px] block">Payment Communication History</span>
              <PaymentChatWindow subscriptionId={selectedVerificationSub.id} showPaidButton={false} />
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-2 flex justify-between items-center border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResubmitPrompt(true)}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold transition cursor-pointer"
              >
                Ask to Resubmit
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedVerificationSub(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await apiService.verifyAndActivatePayment(selectedVerificationSub.id);
                      loadCommandCenterData();
                      setSelectedVerificationSub(null);
                    } catch (e: any) {
                      alert(e.response?.data?.detail || 'Failed to verify payment.');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition cursor-pointer shadow-md flex items-center space-x-1.5 uppercase tracking-wider"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Payment & Activate Premium</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

