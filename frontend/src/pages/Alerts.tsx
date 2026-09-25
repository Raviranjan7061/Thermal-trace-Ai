import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../types';
import {
  AlertOctagon,
  ShieldAlert,
  CheckCircle,
  Clock,
  UserCheck,
  ChevronRight,
  Filter,
  FileText,
  X,
  MapPin,
  Lock
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramPriority = searchParams.get('priority');
  const paramStatus = searchParams.get('status');

  const { role } = useAuth();
  const userRole = (role || '').toLowerCase();
  const isReadOnly = userRole === 'authority' || userRole === 'user';
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Filters initialized from URL query parameters if present
  const [priorityFilter, setPriorityFilter] = useState<string>(() => paramPriority || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>(() => paramStatus || 'ALL');

  useEffect(() => {
    if (paramPriority !== null) {
      setPriorityFilter(paramPriority || 'ALL');
    }
  }, [paramPriority]);

  useEffect(() => {
    if (paramStatus !== null) {
      setStatusFilter(paramStatus || 'ALL');
    }
  }, [paramStatus]);

  // Form input for selected alert
  const [analystNotes, setAnalystNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    if (selectedAlert) {
      setAnalystNotes(selectedAlert.analyst_notes || '');
      setAssignedTo(selectedAlert.assigned_to || '');
    }
  }, [selectedAlert]);

  const handleUpdate = async (statusOverride?: string) => {
    if (!selectedAlert) return;
    try {
      setUpdating(true);
      const updated = await apiService.updateAlert(selectedAlert.alert_id, {
        status: statusOverride || selectedAlert.status,
        assigned_to: assignedTo,
        analyst_notes: analystNotes
      });
      setSelectedAlert(updated);
      await loadAlerts();
    } catch (err: any) {
      alert('Failed to update alert: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUpdating(false);
    }
  };

  // KPI Computations
  const totalCount = alerts.length;
  const criticalCount = alerts.filter(a => ['CRITICAL', 'HIGH'].includes((a.priority || '').toUpperCase())).length;
  const investigatingCount = alerts.filter(a => ['INVESTIGATING', 'ACKNOWLEDGED'].includes((a.status || '').toUpperCase())).length;
  const resolvedCount = alerts.filter(a => ['RESOLVED', 'DISMISSED'].includes((a.status || '').toUpperCase())).length;

  const filteredAlerts = alerts.filter(a => {
    const pri = (a.priority || '').toUpperCase();
    const st = (a.status || '').toUpperCase();

    if (priorityFilter !== 'ALL') {
      if (priorityFilter === 'HIGH_CRITICAL') {
        if (!['HIGH', 'CRITICAL'].includes(pri)) return false;
      } else if (pri !== priorityFilter) {
        return false;
      }
    }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'INVESTIGATING') {
        if (!['INVESTIGATING', 'ACKNOWLEDGED'].includes(st)) return false;
      } else if (statusFilter === 'RESOLVED') {
        if (!['RESOLVED', 'DISMISSED'].includes(st)) return false;
      } else if (st !== statusFilter) {
        return false;
      }
    }

    return true;
  });

  const getPriorityBadgeClass = (pri: string) => {
    switch ((pri || '').toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/10 dark:bg-red-950/80 text-red-600 dark:text-red-400 border-red-500/30 dark:border-red-800';
      case 'HIGH':
        return 'bg-amber-500/10 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-500/30 dark:border-amber-800';
      case 'MODERATE':
        return 'bg-yellow-500/10 dark:bg-yellow-950/80 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 dark:border-yellow-800';
      default:
        return 'bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  const getStatusBadgeClass = (st: string) => {
    switch ((st || '').toUpperCase()) {
      case 'NEW':
        return 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse';
      case 'ACKNOWLEDGED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'INVESTIGATING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto custom-scrollbar overflow-y-auto h-full text-slate-900 dark:text-slate-100 select-none bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Operational Anomaly Alert Intelligence</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Backend-driven alert lifecycle management powered by real NASA FIRMS satellite observations and FRP baseline deviation calculations.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm dark:shadow-none transition-colors duration-200">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Alerts Generated</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{totalCount}</p>
          </div>
          <AlertOctagon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm dark:shadow-none transition-colors duration-200">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Critical / High Priority</p>
            <p className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">{criticalCount}</p>
          </div>
          <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm dark:shadow-none transition-colors duration-200">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Under Investigation</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{investigatingCount}</p>
          </div>
          <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm dark:shadow-none transition-colors duration-200">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Resolved Alerts</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{resolvedCount}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-sm dark:shadow-none transition-colors duration-200">
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Filter Alerts:</span>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH_CRITICAL">High & Critical</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MODERATE">Moderate</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="DISMISSED">DISMISSED</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">Showing {filteredAlerts.length} of {alerts.length} records</span>
      </div>

      {/* Alert Feed Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">Loading operational alert feed...</div>
      ) : filteredAlerts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs shadow-sm dark:shadow-none">
          No operational alerts matching selected filters. Incoming satellite observations are continuously evaluated.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((a) => (
            <div
              key={a.alert_id}
              onClick={() => setSelectedAlert(a)}
              className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition cursor-pointer flex flex-wrap items-center justify-between gap-4 shadow-sm dark:shadow-none ${
                selectedAlert?.alert_id === a.alert_id
                  ? 'border-cyan-500 ring-1 ring-cyan-500/50'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className={`p-2.5 rounded-lg border ${getPriorityBadgeClass(a.priority)}`}>
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityBadgeClass(a.priority)}`}>
                      {a.priority || 'MODERATE'}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{a.title}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 dark:bg-slate-950 border border-amber-500/30 dark:border-slate-800 text-amber-600 dark:text-amber-400">
                      {a.alert_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">{a.description}</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    Triggered: {new Date(a.created_at).toLocaleString()} {a.assigned_to ? `• Assigned: ${a.assigned_to}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border uppercase ${getStatusBadgeClass(a.status)}`}>
                  {a.status}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Alert Detail Workspace Modal/Drawer */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-2xl w-full space-y-5 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded border uppercase ${getPriorityBadgeClass(selectedAlert.priority)}`}>
                    {selectedAlert.priority || 'MODERATE'} PRIORITY
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-500/10 dark:bg-slate-950 text-amber-600 dark:text-amber-400 border border-amber-500/30 dark:border-slate-800">
                    {selectedAlert.alert_type}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedAlert.title}</h2>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description & Trigger details */}
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Trigger Description:</p>
                <p>{selectedAlert.description}</p>
              </div>

              {/* Explainable Why This Priority? */}
              {selectedAlert.why_priority && selectedAlert.why_priority.length > 0 && (
                <div className="bg-amber-500/5 dark:bg-slate-950/80 p-4 rounded-lg border border-amber-500/30 dark:border-amber-500/20 text-xs space-y-1.5">
                  <p className="font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Why this investigation priority ({selectedAlert.priority})?</span>
                  </p>
                  <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 pl-1">
                    {selectedAlert.why_priority.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Evidence Quality Breakdown */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Contextual Evidence Quality:</span>
                <span className="font-bold px-2 py-0.5 rounded bg-cyan-500/10 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 dark:border-cyan-800">
                  {selectedAlert.evidence_quality || 'MODERATE'}
                </span>
              </div>
            </div>

            {/* Analyst Review & Lifecycle Form */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">Analyst Lifecycle Actions</h4>

              {isReadOnly ? (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-semibold">
                    <Lock className="w-4 h-4" />
                    <span>Read-Only Oversight Mode</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Assigned Analyst:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">{selectedAlert.assigned_to || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Lifecycle Status:</span>
                      <span className={`font-extrabold uppercase px-2 py-0.5 rounded text-[10px] border ${getStatusBadgeClass(selectedAlert.status)}`}>
                        {selectedAlert.status}
                      </span>
                    </div>
                  </div>
                  {selectedAlert.analyst_notes && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1">Analyst Notes:</span>
                      <p className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 font-mono text-[11px]">
                        {selectedAlert.analyst_notes}
                      </p>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200 dark:border-slate-800/80">
                    Operational alert status updates are restricted to Analysts and Administrators. Authority oversight access is read-only.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Assigned Analyst Email</label>
                      <input
                        type="email"
                        placeholder="analyst@thermaltrace.ai"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Current Lifecycle Status</label>
                      <select
                        value={selectedAlert.status}
                        onChange={(e) => handleUpdate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="NEW">NEW</option>
                        <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                        <option value="INVESTIGATING">INVESTIGATING</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="DISMISSED">DISMISSED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Analyst Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Record investigation findings, field verification notes, or status rationale..."
                      value={analystNotes}
                      onChange={(e) => setAnalystNotes(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <button
                      onClick={() => navigate('/')}
                      className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>View on India Map</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdate('RESOLVED')}
                        disabled={updating}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => handleUpdate()}
                        disabled={updating}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        {updating ? 'Saving...' : 'Save Updates'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
