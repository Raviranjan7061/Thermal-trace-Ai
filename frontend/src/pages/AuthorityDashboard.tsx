import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Shield,
  AlertTriangle,
  FileText,
  Printer,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Search,
  Clock,
  Database,
  Satellite,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowRight
} from 'lucide-react';
import { apiService } from '../services/api';
import { AuthoritySummary, Hotspot, IndustrialFacility } from '../types';
import { MapView } from '../components/Dashboard/MapView';

export const AuthorityDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AuthoritySummary | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [industrialSites, setIndustrialSites] = useState<IndustrialFacility[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination for audit log section on dashboard
  const [auditPage, setAuditPage] = useState(1);
  const auditPageSize = 6;

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, hData, iData] = await Promise.all([
        apiService.getAuthoritySummary(),
        apiService.getHotspots({ limit: 300 }),
        apiService.getIndustrialSites()
      ]);
      setSummary(data);
      setHotspots(hData);
      setIndustrialSites(iData);
    } catch (err: any) {
      console.error('Failed to load authority summary:', err);
      setError('Failed to load authority situational awareness briefing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Ensure high/critical priority incidents filter
  const highCriticalIncidents = summary?.priority_incidents
    ? summary.priority_incidents.filter((item) => {
        const p = (item.priority || '').toUpperCase();
        return p === 'HIGH' || p === 'CRITICAL';
      })
    : [];

  const auditLogs = summary?.audit_trail || [];
  const totalAuditLogs = auditLogs.length;
  const totalAuditPages = Math.max(1, Math.ceil(totalAuditLogs / auditPageSize));
  const paginatedAuditLogs = auditLogs.slice(
    (auditPage - 1) * auditPageSize,
    auditPage * auditPageSize
  );

  return (
    <div className="p-6 space-y-6 w-full max-w-full custom-scrollbar overflow-y-auto h-full bg-slate-950 text-slate-100 select-none">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Regulatory Authority Monitoring Dashboard
            </h1>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
              OVERSIGHT & COMPLIANCE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Executive situational awareness, high-priority industrial anomaly tracking and regulatory audit records.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold border border-slate-800 transition cursor-pointer shadow-lg"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Export Executive PDF / Print</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 text-xs">
          Loading executive authority situational awareness telemetry...
        </div>
      ) : error || !summary ? (
        <div className="py-20 text-center text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-2xl">
          {error || 'Failed to load authority summary.'}
        </div>
      ) : (
        <>
          {/* Executive Key Performance Indicators (4 Cards Matching Reference Design) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Thermal Alerts */}
            <div className="bg-[#0B101D] p-5 rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[125px]">
              <div className="flex items-start justify-between">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  TOTAL THERMAL ALERTS
                </span>
                <div className="w-10 h-10 rounded-full bg-cyan-950/40 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-2">
                <div className="text-3xl font-extrabold text-white tracking-tight">{summary.total_alerts}</div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Live operational thermal anomalies</p>
              </div>
            </div>

            {/* Card 2: High / Critical Priority */}
            <div className="bg-[#0B101D] p-5 rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[125px]">
              <div className="flex items-start justify-between">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  HIGH / CRITICAL PRIORITY
                </span>
                <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-500/50 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)] shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-2">
                <div className="text-3xl font-extrabold text-red-400 tracking-tight">
                  {summary.critical_priority + summary.high_priority}
                </div>
                <p className="text-[11px] text-red-400/90 font-medium mt-1">
                  {summary.critical_priority} Critical | {summary.high_priority} High Priority
                </p>
              </div>
            </div>

            {/* Card 3: Active Investigations */}
            <div className="bg-[#0B101D] p-5 rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[125px]">
              <div className="flex items-start justify-between">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  ACTIVE INVESTIGATIONS
                </span>
                <div className="w-10 h-10 rounded-full bg-amber-950/40 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)] shrink-0">
                  <Search className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-2">
                <div className="text-3xl font-extrabold text-amber-400 tracking-tight">{summary.investigating_cases}</div>
                <p className="text-[11px] text-amber-400/90 font-medium mt-1">Analyst review queue in progress</p>
              </div>
            </div>

            {/* Card 4: Resolved & Verified */}
            <div className="bg-[#0B101D] p-5 rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[125px]">
              <div className="flex items-start justify-between">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  RESOLVED & VERIFIED
                </span>
                <div className="w-10 h-10 rounded-full bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-2">
                <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">{summary.resolved_cases}</div>
                <p className="text-[11px] text-emerald-400/90 font-medium mt-1">Compliance closed cases</p>
              </div>
            </div>
          </div>

          {/* Main 2-Column Command Center Grid: Left = India Overview, Right = Recent High-Priority Incidents */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* LEFT: India Overview (Thermal Anomalies) Command Center Card */}
            <div className="xl:col-span-7 bg-[#0B101D] border border-slate-800/90 rounded-2xl p-4 shadow-2xl space-y-3.5 flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Satellite className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                      India Overview (Thermal Anomalies)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Real-time satellite observations from NOAA-20 & NOAA-21
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/map')}
                  className="flex items-center space-x-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <span>View Full Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Interactive India Map - Primary Full-Width Visual */}
              <div className="w-full h-[390px] sm:h-[400px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 relative flex-1">
                <MapView
                  hotspots={hotspots}
                  industrialSites={industrialSites}
                  selectedHotspot={selectedHotspot}
                  onSelectHotspot={(h) => setSelectedHotspot(h)}
                />
              </div>
            </div>

            {/* RIGHT: Recent High-Priority Industrial Anomaly Incidents Table */}
            <div className="xl:col-span-5 bg-[#0B101D] rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden flex flex-col h-fit self-start">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-slate-100 text-xs sm:text-sm">
                    Recent High-Priority Industrial Anomaly Incidents
                  </h3>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => navigate('/incidents')}
                    className="bg-blue-600/90 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="p-2.5">INCIDENT ID</th>
                      <th className="p-2.5">LOCATION</th>
                      <th className="p-2.5">FRP (MW)</th>
                      <th className="p-2.5">PRIORITY</th>
                      <th className="p-2.5 text-right">TIME</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {highCriticalIncidents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 px-4 text-center">
                          <div className="flex flex-col items-center justify-center space-y-1.5">
                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <p className="font-bold text-slate-200 text-xs">
                              No High or Critical Incidents
                            </p>
                            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                              No high-priority industrial anomalies detected in the current observation cycle.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      highCriticalIncidents.slice(0, 6).map((item) => (
                        <tr key={item.alert_id} className="hover:bg-slate-800/50 transition">
                          <td className="p-2.5 font-mono font-bold text-amber-400 text-[11px]">{item.event_id}</td>
                          <td className="p-2.5">
                            <div className="font-semibold text-slate-100 text-[11px] truncate max-w-[130px]">{item.title}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{item.location}</div>
                          </td>
                          <td className="p-2.5 font-semibold text-amber-400 text-[11px]">{item.frp}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                item.priority === 'CRITICAL'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              }`}
                            >
                              {item.priority}
                            </span>
                          </td>
                          <td className="p-2.5 text-right text-slate-400 font-mono text-[10px]">{item.created_at}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Current Situation Horizontal Status Strip */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs font-medium shadow-xl">
            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-3 py-1.5 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Current Situation</span>
            </div>

            <div className="flex items-center space-x-2">
              <Satellite className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-100 block text-[11px]">NASA FIRMS Live</span>
                <span className="text-[10px] text-slate-400">Real-time satellite data</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-100 block text-[11px]">
                  {summary.total_alerts} thermal observations
                </span>
                <span className="text-[10px] text-slate-400">From NOAA-20 & NOAA-21</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-100 block text-[11px]">
                  {summary.critical_priority + summary.high_priority} high/critical incidents
                </span>
                <span className="text-[10px] text-slate-400">In current observation cycle</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-100 block text-[11px]">
                  {summary.investigating_cases} active investigations
                </span>
                <span className="text-[10px] text-slate-400">Under review</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-100 block text-[11px]">Last data update</span>
                <span className="text-[10px] text-cyan-300 font-mono">
                  {summary.last_update || 'Recent Observation'}
                </span>
              </div>
            </div>
          </div>

          {/* Immutable Regulatory Audit Trail Log Section */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Immutable Regulatory Audit Trail Log
                </h3>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-400 font-mono text-[11px] flex items-center space-x-1">
                  <span>🔒</span>
                  <span>System Compliance Verification</span>
                </span>
                <button
                  onClick={() => navigate('/authority/audit')}
                  className="bg-blue-600/90 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <span>View Full Log</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 text-[11px] font-sans">
                  <tr>
                    <th className="p-3.5">ACTION CODE</th>
                    <th className="p-3.5">ACTOR IDENTITY</th>
                    <th className="p-3.5">ENTITY TYPE</th>
                    <th className="p-3.5">TARGET IDENTIFIER</th>
                    <th className="p-3.5 text-right">TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                        No audit trail records logged yet.
                      </td>
                    </tr>
                  ) : (
                    paginatedAuditLogs.map((log) => (
                      <tr key={log.audit_id} className="hover:bg-slate-800/50 transition">
                        <td className="p-3.5 font-bold text-cyan-400">{log.action}</td>
                        <td className="p-3.5 text-slate-200">{log.actor_email || 'System'}</td>
                        <td className="p-3.5 text-slate-400 uppercase text-[11px]">{log.entity_type}</td>
                        <td className="p-3.5 text-slate-400 text-[11px]">
                          {log.entity_id ? `${log.entity_id.substring(0, 18)}...` : 'N/A'}
                        </td>
                        <td className="p-3.5 text-right text-slate-400">{log.timestamp}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing {(auditPage - 1) * auditPageSize + 1}–
                {Math.min(auditPage * auditPageSize, totalAuditLogs)} of {totalAuditLogs} entries
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  disabled={auditPage === 1}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: Math.min(5, totalAuditPages) }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setAuditPage(num)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      auditPage === num
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                {totalAuditPages > 5 && <span className="text-slate-600 px-1">...</span>}
                <button
                  onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                  disabled={auditPage === totalAuditPages}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
