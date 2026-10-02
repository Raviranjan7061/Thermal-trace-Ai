import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, AlertTriangle, FileText, CheckCircle2, Clock, Printer, Activity } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AuthoritySummary } from '../../types';

const maskEmail = (email?: string | null): string => {
  if (!email) return 'System';
  if (email === 'System') return 'System';
  if (!email.includes('@')) return email;

  const [local, domain] = email.split('@');
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}****@${domain}`;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthorityModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { role } = useAuth();
  const [summary, setSummary] = useState<AuthoritySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      apiService
        .getAuthoritySummary()
        .then(setSummary)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[650] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Regulatory Authority Monitoring Briefing</h2>
              <p className="text-xs text-slate-400">High-level situational awareness & compliance audit log overview</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Briefing</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading authority summary data...</div>
          ) : !summary ? (
            <div className="py-12 text-center text-red-400">Failed to load authority situational awareness briefing.</div>
          ) : (
            <>
              {/* Executive Metrics Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] font-semibold block uppercase">Total System Alerts</span>
                  <div className="text-2xl font-bold text-white mt-1">{summary.total_alerts}</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Live operational events</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] font-semibold block uppercase">Critical / High Priority</span>
                  <div className="text-2xl font-bold text-red-400 mt-1">{summary.critical_priority + summary.high_priority}</div>
                  <span className="text-[10px] text-red-400/80 mt-1 block">
                    {summary.critical_priority} Critical | {summary.high_priority} High
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] font-semibold block uppercase">Under Investigation</span>
                  <div className="text-2xl font-bold text-amber-400 mt-1">{summary.investigating_cases}</div>
                  <span className="text-[10px] text-amber-400/80 mt-1 block">Active analyst reviews</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] font-semibold block uppercase">Resolved Cases</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{summary.resolved_cases}</div>
                  <span className="text-[10px] text-emerald-400/80 mt-1 block">Verified & closed</span>
                </div>
              </div>

              {/* Priority Incidents Table */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-slate-200 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Recent High-Priority Industrial Anomaly Incidents</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Top {summary.priority_incidents.length} Events</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[11px]">
                      <tr>
                        <th className="p-3">Incident ID</th>
                        <th className="p-3">Title & Location</th>
                        <th className="p-3">Classification</th>
                        <th className="p-3">FRP</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Triggered At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {summary.priority_incidents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-500 font-medium">
                            No HIGH or CRITICAL priority incidents are currently recorded.
                          </td>
                        </tr>
                      ) : (
                        summary.priority_incidents.map((item) => (
                          <tr key={item.alert_id} className="hover:bg-slate-900/50 transition">
                            <td className="p-3 font-mono font-bold text-amber-400">{item.event_id}</td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-200">{item.title}</div>
                              <div className="text-[11px] text-slate-400">{item.location}</div>
                            </td>
                            <td className="p-3 text-slate-300">{item.classification}</td>
                            <td className="p-3 font-semibold text-amber-400">{item.frp}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  item.priority === 'CRITICAL'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                    : item.priority === 'HIGH'
                                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {item.priority}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-300">{item.status}</td>
                            <td className="p-3 text-right text-slate-400 font-mono">{item.created_at}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Compliance Audit Trail */}
              {summary.audit_trail && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-slate-200 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span>System Compliance & Analyst Audit Log</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">Immutable Activity Records</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[11px]">
                        <tr>
                          <th className="p-3">Action</th>
                          <th className="p-3">Actor / Email</th>
                          <th className="p-3">Entity Type</th>
                          <th className="p-3">Target ID</th>
                          <th className="p-3 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {summary.audit_trail.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-500">
                              No recent compliance audit logs recorded.
                            </td>
                          </tr>
                        ) : (
                          summary.audit_trail.map((log) => (
                            <tr key={log.audit_id} className="hover:bg-slate-900/50 transition">
                              <td className="p-3 font-semibold text-cyan-400">{log.action}</td>
                              <td className="p-3 text-slate-300">
                                {role === 'admin' ? (log.actor_email || 'System') : maskEmail(log.actor_email)}
                              </td>
                              <td className="p-3 text-slate-400 uppercase font-mono text-[10px]">{log.entity_type}</td>
                              <td className="p-3 font-mono text-slate-400 text-[11px]">
                                {log.entity_id ? log.entity_id.substring(0, 14) : 'N/A'}...
                              </td>
                              <td className="p-3 text-right text-slate-400 font-mono">{log.timestamp}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
