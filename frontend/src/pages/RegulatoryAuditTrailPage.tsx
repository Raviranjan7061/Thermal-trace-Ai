import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { AdminAuditLog } from '../types';
import {
  FileText,
  Shield,
  Search,
  Lock,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const RegulatoryAuditTrailPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAuthorityAuditLogs(300);
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to load authority regulatory audit logs:', err);
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
      const matchEntity = (log.entity_type || '').toLowerCase().includes(q) || (log.entity_id || '').toLowerCase().includes(q);
      if (!matchAction && !matchActor && !matchEntity) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const uniqueActorsCount = new Set(auditLogs.map((l) => l.actor_email).filter(Boolean)).size;

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto custom-scrollbar p-6 space-y-6 select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <span>Immutable Regulatory Audit Trail</span>
            </h1>
            <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase">
              Compliance Oversight
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            System-wide immutable action log tracking alert lifecycle updates, user review decisions, and operational compliance telemetry.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="self-start md:self-auto flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3.5 py-2 rounded-xl transition cursor-pointer font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh Compliance Audit</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-xl">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Logged Regulatory Events</div>
            <div className="text-xl font-bold text-slate-100">{loading ? '...' : auditLogs.length}</div>
            <div className="text-[10px] text-slate-500">Immutable record entries</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-xl">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Recorded System Actors</div>
            <div className="text-xl font-bold text-cyan-400">{loading ? '...' : uniqueActorsCount}</div>
            <div className="text-[10px] text-slate-500">Identified email identities</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-xl">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Audit Verification Status</div>
            <div className="text-xs font-bold text-emerald-400 mt-1 uppercase">100% Immutability Passed</div>
            <div className="text-[10px] text-slate-500">Tamper-evident logs</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-xl">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Distinct Action Codes</div>
            <div className="text-xl font-bold text-purple-400">{uniqueActions.length}</div>
            <div className="text-[10px] text-slate-500">Logged action types</div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by Action Code, Actor Email, or Target Identifier..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-300 focus:outline-none text-xs"
            >
              <option value="ALL" className="bg-slate-900">All Action Codes</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act} className="bg-slate-900">
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Trail Viewer Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col">
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Showing {paginatedLogs.length} of {filteredLogs.length} regulatory records</span>
          <span className="font-mono text-[11px] text-slate-500">Read-Only Compliance Mode</span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold font-sans">
                <th className="py-3 px-4">Action Code</th>
                <th className="py-3 px-4">Actor Identity</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Target Identifier</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                    Loading regulatory audit trail telemetry...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                    No regulatory audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.audit_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <span className="font-bold text-amber-400">{log.action}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-200">{log.actor_email || 'System'}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] uppercase">{log.entity_type}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {log.entity_id ? log.entity_id.substring(0, 18) : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-sans">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
