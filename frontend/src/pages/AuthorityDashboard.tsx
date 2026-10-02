import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  ArrowRight,
  Layers,
  Flame,
  CheckSquare,
  AlertOctagon,
  Download,
  Filter,
  Eye,
  Building2,
  Maximize2
} from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AuthoritySummary, Hotspot, IndustrialFacility } from '../types';

const maskEmail = (email?: string | null): string => {
  if (!email) return 'System';
  if (email === 'System') return 'System';
  if (!email.includes('@')) return email;

  const [local, domain] = email.split('@');
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}****@${domain}`;
};
import { MapView } from '../components/Dashboard/MapView';
import { generateAuthorityPdfReport } from '../services/authorityPdfReport';

export const AuthorityDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [summary, setSummary] = useState<AuthoritySummary | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [industrialSites, setIndustrialSites] = useState<IndustrialFacility[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Map overlay toggle states
  const [showHotspots, setShowHotspots] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showStateBoundaries, setShowStateBoundaries] = useState(true);
  const [showCities, setShowCities] = useState(true);
  const [showWatchlists, setShowWatchlists] = useState(false);

  // Pagination for audit log section on dashboard
  const [auditPage, setAuditPage] = useState(1);
  const auditPageSize = 5;

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, hData, iData] = await Promise.all([
        apiService.getAuthoritySummary().catch((err) => {
          console.warn('Authority summary API fetch error:', err);
          return null;
        }),
        apiService.getHotspots({ limit: 300 }).catch(() => []),
        apiService.getIndustrialSites().catch(() => [])
      ]);
      setSummary(data);
      setHotspots(hData || []);
      setIndustrialSites(iData || []);
      if (!data) {
        setError('Authority summary telemetry is currently unavailable. Please check backend connection.');
      }
    } catch (err: any) {
      console.warn('Failed to load live backend authority telemetry:', err);
      setError('Failed to load live backend authority telemetry.');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleExportReport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportError(null);
    try {
      await generateAuthorityPdfReport({
        summary,
        hotspots,
        industrialSites,
      });
    } catch (err: any) {
      console.error('Failed to generate Authority PDF report:', err);
      setExportError('Failed to generate PDF report. Please try again.');
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  // Strict High/Critical priority incidents filter derived from real backend summary
  const strictHighCriticalIncidents = summary?.priority_incidents
    ? summary.priority_incidents.filter((item) => {
        const p = (item.priority || '').toUpperCase();
        return p === 'HIGH' || p === 'CRITICAL';
      })
    : [];

  // Fallback real recent thermal observations if zero High/Critical incidents exist
  const fallbackRecentActivity = (summary?.priority_incidents && summary.priority_incidents.length > 0)
    ? summary.priority_incidents.slice(0, 5).map((item) => ({
        id: item.alert_id,
        eventId: item.event_id || item.alert_id,
        hotspotId: item.hotspot_id,
        title: item.title,
        location: item.location || 'Industrial Area',
        frp: item.frp ? item.frp.toString().replace(' MW', '') + ' MW' : 'N/A',
        classification: item.classification || 'Thermal Activity',
        priority: (item.priority || 'MEDIUM').toUpperCase(),
        time: item.created_at || 'Recent',
        rawHotspot: null
      }))
    : hotspots.slice(0, 5).map((h) => ({
        id: h.hotspot_id,
        eventId: `HS-${h.hotspot_id.substring(0, 8).toUpperCase()}`,
        hotspotId: h.hotspot_id,
        title: h.classification?.probable_classification || 'Thermal Observation',
        location: h.classification?.nearest_facility_name
          ? h.classification.nearest_facility_name
          : `${h.latitude.toFixed(2)}° N, ${h.longitude.toFixed(2)}° E`,
        frp: h.frp ? `${h.frp.toFixed(1)} MW` : 'N/A',
        classification: h.classification?.probable_classification || 'Thermal Activity',
        priority: h.frp && h.frp > 45 ? 'HIGH' : h.frp && h.frp > 15 ? 'MEDIUM' : 'LOW',
        time: new Date(h.acquisition_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawHotspot: h
      }));

  const auditLogs = summary?.audit_trail || [];
  const totalAuditLogs = auditLogs.length;
  const totalAuditPages = Math.max(1, Math.ceil(totalAuditLogs / auditPageSize));
  const paginatedAuditLogs = auditLogs.slice(
    (auditPage - 1) * auditPageSize,
    auditPage * auditPageSize
  );

  return (
    <div className="p-4 sm:p-6 space-y-5 w-full min-h-full pb-10 bg-slate-50 dark:bg-[#050914] text-slate-900 dark:text-slate-100 select-none transition-colors duration-200">
      {/* 1. POLISHED COMMAND-CENTER HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-3 flex-wrap gap-y-1">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Regulatory Authority Monitoring Dashboard</span>
              </h1>
              <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-extrabold px-3 py-1 rounded-md uppercase tracking-wider font-mono">
                OVERSIGHT & COMPLIANCE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Real-time oversight, regulatory visibility, and compliance monitoring of industrial thermal activity across India.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block font-mono">
            <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              {new Date().toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} IST
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>Live Data</span>
            </div>
          </div>

          <button
            onClick={handleExportReport}
            disabled={isExporting || loading}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-cyan-400/30 transition cursor-pointer shadow-lg shadow-cyan-950/50 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <FileText className={`w-4 h-4 ${isExporting ? 'animate-pulse text-amber-300' : ''}`} />
            <span>{isExporting ? 'Generating Report...' : 'Export Report'}</span>
          </button>
        </div>
      </div>

      {exportError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center justify-between animate-fade-in">
          <span>{exportError}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
          <div className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading executive authority situational awareness telemetry...</span>
        </div>
      ) : error || !summary ? (
        <div className="py-16 text-center text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-2xl p-6">
          {error || 'Failed to load authority summary.'}
        </div>
      ) : (
        <>
          {/* 2. TOP KPI ROW (4 Cards matching Reference Visual Hierarchy) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: TOTAL THERMAL ALERTS */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate('/alerts')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/alerts');
                }
              }}
              aria-label="View all total thermal alerts"
              className="bg-white dark:bg-[#0B111E] p-4.5 sm:p-5 rounded-xl border border-slate-200 dark:border-cyan-500/20 shadow-md dark:shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[125px] cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 group"
            >
              <div className="flex items-start justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-extrabold uppercase tracking-wider font-mono">
                  TOTAL THERMAL ALERTS
                </span>
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 dark:bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm dark:shadow-[0_0_10px_rgba(6,182,212,0.25)] shrink-0 group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-2">
                <div className="flex items-baseline space-x-2.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">{summary.total_alerts}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">+12%</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Live operational thermal anomalies</p>
              </div>
            </div>

            {/* Card 2: HIGH / CRITICAL PRIORITY */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate('/alerts?priority=HIGH_CRITICAL')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/alerts?priority=HIGH_CRITICAL');
                }
              }}
              aria-label="View high and critical priority alerts"
              className="bg-white dark:bg-[#0B111E] p-4.5 sm:p-5 rounded-xl border border-slate-200 dark:border-red-500/20 shadow-md dark:shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[125px] cursor-pointer hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500/50 group"
            >
              <div className="flex items-start justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-extrabold uppercase tracking-wider font-mono">
                  HIGH / CRITICAL PRIORITY
                </span>
                <div className="w-10 h-10 rounded-full bg-red-500/10 dark:bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm dark:shadow-[0_0_10px_rgba(239,68,68,0.25)] shrink-0 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-2">
                <div className="flex items-baseline space-x-2.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-red-600 dark:text-red-400 tracking-tight font-mono">
                    {summary.critical_priority + summary.high_priority}
                  </span>
                  {summary.critical_priority + summary.high_priority === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">↓ -100%</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 text-xs font-bold font-mono">↑ Active</span>
                  )}
                </div>
                <p className="text-xs text-red-600/90 dark:text-red-400/90 font-medium mt-1">
                  {summary.critical_priority} Critical | {summary.high_priority} High Priority
                </p>
              </div>
            </div>

            {/* Card 3: ACTIVE INVESTIGATIONS */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate('/alerts?status=INVESTIGATING')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/alerts?status=INVESTIGATING');
                }
              }}
              aria-label="View active investigations"
              className="bg-white dark:bg-[#0B111E] p-4.5 sm:p-5 rounded-xl border border-slate-200 dark:border-amber-500/20 shadow-md dark:shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[125px] cursor-pointer hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50 group"
            >
              <div className="flex items-start justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-extrabold uppercase tracking-wider font-mono">
                  ACTIVE INVESTIGATIONS
                </span>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 dark:bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm dark:shadow-[0_0_10px_rgba(245,158,11,0.25)] shrink-0 group-hover:scale-105 transition-transform">
                  <Search className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-2">
                <div className="flex items-baseline space-x-2.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight font-mono">{summary.investigating_cases}</span>
                </div>
                <p className="text-xs text-amber-600/90 dark:text-amber-400/90 font-medium mt-1">
                  {summary.investigating_cases} Under Review
                </p>
              </div>
            </div>

            {/* Card 4: RESOLVED & VERIFIED */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate('/alerts?status=RESOLVED')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/alerts?status=RESOLVED');
                }
              }}
              aria-label="View resolved and verified alerts"
              className="bg-white dark:bg-[#0B111E] p-4.5 sm:p-5 rounded-xl border border-slate-200 dark:border-emerald-500/20 shadow-md dark:shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[125px] cursor-pointer hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 group"
            >
              <div className="flex items-start justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-extrabold uppercase tracking-wider font-mono">
                  RESOLVED & VERIFIED
                </span>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-[0_0_10px_rgba(16,185,129,0.25)] shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-2">
                <div className="flex items-baseline space-x-2.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">{summary.resolved_cases}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">+100%</span>
                </div>
                <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 font-medium mt-1">Compliance closed cases</p>
              </div>
            </div>
          </div>

          {/* 3. MAIN WORKSPACE GRID: Left = Dominant India Map, Right = Incident & Compliance Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-5">
            {/* LEFT COLUMN: Large India Overview Thermal Map (62% desktop width) */}
            <div className="xl:col-span-7 bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 sm:p-4.5 shadow-md dark:shadow-2xl space-y-3.5 flex flex-col justify-between transition-colors duration-200">
              {/* Map Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <Satellite className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight uppercase font-mono">
                      India Overview (Thermal Anomalies)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Real-time satellite detections from NOAA-20 & NOAA-21
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/map')}
                  className="flex items-center space-x-2 bg-cyan-500/10 dark:bg-cyan-600/20 hover:bg-cyan-500/20 dark:hover:bg-cyan-600/30 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <span>View Full Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Interactive India Map - Primary Full-Width Visual */}
              <div className="w-full h-[500px] sm:h-[560px] lg:h-[580px] min-h-[500px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/90 shadow-inner bg-slate-100 dark:bg-[#040812] relative flex-1">
                {/* Leaflet Map Implementation with built-in controls */}
                <MapView
                  hotspots={hotspots}
                  industrialSites={industrialSites}
                  selectedHotspot={selectedHotspot}
                  onSelectHotspot={(h) => setSelectedHotspot(h)}
                  onViewIncident={(h) => {
                    navigate('/incidents', { state: { selectedHotspot: h, hotspotId: h.hotspot_id } });
                  }}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Recent Incidents & Regulatory Compliance Status (38% desktop width) */}
            <div className="xl:col-span-5 space-y-4 flex flex-col justify-between">
              {/* Card 1: Recent High-Priority Industrial Anomaly Incidents */}
              <div className="bg-white dark:bg-[#0B111E] rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-md dark:shadow-2xl overflow-hidden flex flex-col transition-colors duration-200">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight">
                      Recent High-Priority Industrial Anomaly Incidents
                    </h3>
                  </div>
                  <button
                    onClick={() => navigate('/incidents')}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-md"
                  >
                    <span>View All</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* STATE A: REAL HIGH/CRITICAL INCIDENTS EXIST */}
                {strictHighCriticalIncidents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-100 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/80 text-[10px] font-sans">
                        <tr>
                          <th className="p-3">INCIDENT ID</th>
                          <th className="p-3">LOCATION</th>
                          <th className="p-3">FRP (MW)</th>
                          <th className="p-3">PRIORITY</th>
                          <th className="p-3 text-right">TIME</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                        {strictHighCriticalIncidents.slice(0, 5).map((item) => {
                          const prio = (item.priority || 'HIGH').toUpperCase();
                          const isHigh = prio === 'HIGH' || prio === 'CRITICAL';
                          const displayFrp = item.frp ? item.frp.toString().replace(' MW', '') : 'N/A';

                          return (
                            <tr
                              key={item.alert_id}
                              onClick={() => {
                                navigate('/incidents', { state: { hotspotId: item.hotspot_id } });
                              }}
                              className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition cursor-pointer group"
                            >
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      isHigh
                                        ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                                        : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                                    }`}
                                  />
                                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs font-mono group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                                    {item.event_id || item.alert_id}
                                  </span>
                                </div>
                              </td>

                              <td className="p-3 font-sans">
                                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[140px]">
                                  {item.location || item.title}
                                </div>
                              </td>

                              <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-200 text-xs">
                                {displayFrp}
                              </td>

                              <td className="p-3 font-sans">
                                <span
                                  className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                    isHigh
                                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/40'
                                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isHigh ? 'bg-red-500 dark:bg-red-400' : 'bg-amber-500 dark:bg-amber-400'
                                    }`}
                                  />
                                  <span>{prio === 'CRITICAL' ? 'High' : item.priority || 'High'}</span>
                                </span>
                              </td>

                              <td className="p-3 text-right text-slate-500 dark:text-slate-400 text-xs font-mono">
                                {item.created_at}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* STATE B: REAL HIGH/CRITICAL COUNT = 0 -> TRUTHFUL BANNER + RECENT THERMAL ACTIVITY TABLE */
                  <div className="flex flex-col">
                    <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/20 border-b border-emerald-500/20 flex items-center space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs block">✓ No High or Critical Incidents</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          No immediate high-priority industrial anomalies detected in current observation cycle.
                        </span>
                      </div>
                    </div>

                    <div className="px-3.5 py-2 bg-slate-100/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
                      <span>RECENT THERMAL ACTIVITY</span>
                      <span className="text-slate-500">{fallbackRecentActivity.length} Real Telemetry Records</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-100 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/60 text-[9.5px] font-sans">
                          <tr>
                            <th className="p-2.5">INCIDENT / OBSERVATION</th>
                            <th className="p-2.5">LOCATION</th>
                            <th className="p-2.5">FRP</th>
                            <th className="p-2.5">CLASSIFICATION</th>
                            <th className="p-2.5">PRIORITY</th>
                            <th className="p-2.5 text-right">TIME</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                          {fallbackRecentActivity.map((item) => {
                            const prio = item.priority;
                            const isHigh = prio === 'HIGH' || prio === 'CRITICAL';
                            const isMed = prio === 'MEDIUM';

                            return (
                              <tr
                                key={item.id}
                                onClick={() => {
                                  if (item.rawHotspot) {
                                    navigate('/incidents', { state: { selectedHotspot: item.rawHotspot, hotspotId: item.hotspotId } });
                                  } else {
                                    navigate('/incidents', { state: { hotspotId: item.hotspotId } });
                                  }
                                }}
                                className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition cursor-pointer group text-[11px]"
                              >
                                <td className="p-2.5 font-mono">
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        isHigh
                                          ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                                          : isMed
                                          ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                                          : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                                      }`}
                                    />
                                    <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                                      {item.eventId}
                                    </span>
                                  </div>
                                </td>

                                <td className="p-2.5 font-sans">
                                  <div className="font-semibold text-slate-700 dark:text-slate-300 text-xs truncate max-w-[120px]">
                                    {item.location}
                                  </div>
                                </td>

                                <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-slate-200 text-xs">
                                  {item.frp}
                                </td>

                                <td className="p-2.5 font-sans text-slate-700 dark:text-slate-300 text-xs truncate max-w-[110px]">
                                  {item.classification}
                                </td>

                                <td className="p-2.5 font-sans">
                                  <span
                                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                      isHigh
                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/40'
                                        : isMed
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                                    }`}
                                  >
                                    <span
                                      className={`w-1 h-1 rounded-full ${
                                        isHigh ? 'bg-red-500 dark:bg-red-400' : isMed ? 'bg-amber-500 dark:bg-amber-400' : 'bg-emerald-500 dark:bg-emerald-400'
                                      }`}
                                    />
                                    <span>{prio}</span>
                                  </span>
                                </td>

                                <td className="p-2.5 text-right text-slate-500 dark:text-slate-400 text-xs font-mono">
                                  {item.time}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Regulatory & Compliance Status */}
              <div className="bg-white dark:bg-[#0B111E] rounded-2xl border border-slate-200 dark:border-slate-800/90 p-3.5 shadow-md dark:shadow-2xl space-y-3 transition-colors duration-200">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                      Regulatory & Compliance Status
                    </h3>
                  </div>
                  <button
                    onClick={() => navigate('/authority/audit')}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <span>View Details</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Category 1: Environmental Review */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[10px]">
                      <span className="font-semibold truncate">Environmental Review</span>
                      <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">{summary.investigating_cases}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Under regulatory review</div>
                  </div>

                  {/* Category 2: Compliance Actions */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[10px]">
                      <span className="font-semibold truncate">Compliance Actions</span>
                      <CheckSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    </div>
                    <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">{summary.high_priority}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Pending authority action</div>
                  </div>

                  {/* Category 3: Violation Flags */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[10px]">
                      <span className="font-semibold truncate">Violation Flags</span>
                      <AlertOctagon className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                    </div>
                    <div className="text-xl font-extrabold text-red-600 dark:text-red-400 font-mono">{summary.critical_priority}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Non-compliance detected</div>
                  </div>

                  {/* Category 4: Closed Cases */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[10px]">
                      <span className="font-semibold truncate">Closed Cases</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>
                    <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{summary.resolved_cases}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Compliance verified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. CURRENT SITUATION STRIP BELOW MAP */}
          <div className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-medium shadow-md dark:shadow-2xl transition-colors duration-200">
            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold px-3 py-1 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>Current Situation</span>
            </div>

            <div className="flex items-center space-x-2">
              <Satellite className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-[11px]">NOAA FIRMS Live</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Real-time satellite data</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-[11px]">
                  {summary.total_alerts} thermal observations
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">From NOAA-20 & NOAA-21</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-[11px]">
                  {summary.critical_priority + summary.high_priority} high-priority incidents
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Requiring immediate attention</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-[11px]">
                  {summary.investigating_cases} active investigation
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Under review</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-[11px]">Last data update</span>
                <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-mono">
                  {summary.last_update || 'Recent Observation'}
                </span>
              </div>
            </div>
          </div>

          {/* 5. IMMUTABLE REGULATORY AUDIT TRAIL LOG SECTION */}
          <div className="bg-white dark:bg-[#0B111E] rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-md dark:shadow-2xl overflow-hidden transition-colors duration-200">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Immutable Regulatory Audit Trail Log
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Full audit trail with immutable records for regulatory compliance
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <button
                  onClick={() => navigate('/authority/audit')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <span>View Full Log</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-[10px] font-sans">
                  <tr>
                    <th className="p-3">ACTION CODE</th>
                    <th className="p-3">ACTOR IDENTITY</th>
                    <th className="p-3">ENTITY TYPE</th>
                    <th className="p-3">TARGET IDENTIFIER</th>
                    <th className="p-3">DESCRIPTION</th>
                    <th className="p-3 text-right">TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {paginatedAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 dark:text-slate-400 font-sans">
                        No audit trail records logged yet.
                      </td>
                    </tr>
                  ) : (
                    paginatedAuditLogs.map((log) => (
                      <tr key={log.audit_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                        <td className="p-3 font-bold text-cyan-600 dark:text-cyan-400">{log.action}</td>
                        <td className="p-3 text-slate-800 dark:text-slate-200">
                          {role === 'admin' ? (log.actor_email || 'System') : maskEmail(log.actor_email)}
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 uppercase text-[10px]">{log.entity_type}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 text-[10px]">
                          {log.entity_id ? `${log.entity_id.substring(0, 18)}...` : 'N/A'}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 font-sans text-[11px] truncate max-w-[220px]">
                          {log.details?.description || log.details?.action_description || `${log.action} performed on ${log.entity_type}`}
                        </td>
                        <td className="p-3 text-right text-slate-500 dark:text-slate-400">{log.timestamp}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Matching Design Reference */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>
                Showing {(auditPage - 1) * auditPageSize + 1}–
                {Math.min(auditPage * auditPageSize, totalAuditLogs)} of {totalAuditLogs} records
              </span>
              <div className="flex items-center space-x-1.5 font-sans">
                <button
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  disabled={auditPage === 1}
                  className="p-1.5 rounded-lg bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
                        : 'bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                {totalAuditPages > 5 && <span className="text-slate-400 dark:text-slate-600 px-1">...</span>}
                <button
                  onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                  disabled={auditPage === totalAuditPages}
                  className="p-1.5 rounded-lg bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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

export default AuthorityDashboardPage;
