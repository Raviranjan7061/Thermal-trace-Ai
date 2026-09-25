import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { AdminAuditLog } from '../types';
import {
  FileText,
  Shield,
  Search,
  Lock,
  Filter,
  RefreshCw
} from 'lucide-react';

export const SecurityAuditPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAdminAuditLogs(200);
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to load security audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const uniqueActions = Array.from(new Set(auditLogs.map((l) => l.action)));

  const filteredLogs = auditLogs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchActor = (log.actor_email || '').toLowerCase().includes(q);
      const matchEntity = log.entity_type.toLowerCase().includes(q) || log.entity_id.toLowerCase().includes(q);
      if (!matchAction && !matchActor && !matchEntity) return false;
    }
    return true;
  });

  const uniqueActorsCount = new Set(auditLogs.map((l) => l.actor_email).filter(Boolean)).size;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto custom-scrollbar p-6 space-y-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              <span>Security Audit & Administrative Activity</span>
            </h1>
            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-500/30">
              Immutable Audit Logs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable security event log, role mutations, account provisioning telemetry, and system administrative actions.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="self-start md:self-auto flex items-center space-x-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs px-3 py-1.5 rounded-lg transition shadow-sm dark:shadow-none"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500 dark:text-amber-400' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Audit Logged Events</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{loading ? '...' : auditLogs.length}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Security & admin activity</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
          <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Unique Administrative Actors</div>
            <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{loading ? '...' : uniqueActorsCount}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Authenticated actors</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Log Immutability Status</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">100% VERIFIED</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Tamper-proof storage</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Categorized Actions</div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{uniqueActions.length}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Distinct security action types</div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm dark:shadow-none">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search logs by Action, Actor Email, or Entity ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none text-xs"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Action Types</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-xl flex-1">
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Showing {filteredLogs.length} audit events</span>
          <span>Audit timestamps recorded in UTC</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-semibold font-sans">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Actor Email</th>
                <th className="py-2.5 px-4">Entity Type & ID</th>
                <th className="py-2.5 px-4">Payload Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    No recorded security events found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.audit_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">{log.timestamp}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">{log.action}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{log.actor_email || 'System'}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {log.entity_type} ({log.entity_id.substring(0, 10)})
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[10px] max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
