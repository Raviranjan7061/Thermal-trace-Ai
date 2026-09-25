import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Satellite,
  Flame,
  Factory,
  Activity,
  Database,
  Play,
  RotateCcw,
  GitCompare,
  TrendingUp,
  Info,
  Cpu,
  Layers,
  Search,
  ArrowRightLeft,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Lock,
  ExternalLink,
  HelpCircle,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Filter,
  Building2,
  Clock
} from 'lucide-react';
import { apiService } from '../services/api';
import { Hotspot, IndustrialFacility, AnalyticsOverview, AuthoritySummary, SystemHealth } from '../types';
import { MapView } from '../components/Dashboard/MapView';
import { HotspotDrawer } from '../components/Dashboard/HotspotDrawer';
import { HotspotComparisonModal } from '../components/Compare/HotspotComparisonModal';

export const PublicDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth();
  const currentRole = (role || user?.role || '').toLowerCase();

  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [facilities, setFacilities] = useState<IndustrialFacility[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [summary, setSummary] = useState<AuthoritySummary | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Filters for Map Toolbar
  const [satelliteFilter, setSatelliteFilter] = useState<string>('ALL');
  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');

  useEffect(() => {
    if (location.state?.selectedHotspot) {
      setSelectedHotspot(location.state.selectedHotspot);
    }
  }, [location.state]);

  useEffect(() => {
    const handleLocateEvent = (e: CustomEvent) => {
      if (e.detail) {
        setSelectedHotspot(e.detail);
      }
    };
    window.addEventListener('locate_hotspot', handleLocateEvent as EventListener);
    return () => {
      window.removeEventListener('locate_hotspot', handleLocateEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const promises: Promise<any>[] = [
          apiService.getHotspots({ limit: 300 }),
          apiService.getIndustrialSites(),
          apiService.getAnalyticsOverview(),
          apiService.getSystemHealth()
        ];

        if (currentRole === 'authority') {
          promises.push(apiService.getAuthoritySummary());
        }

        const results = await Promise.all(promises);
        setHotspots(results[0]);
        setFacilities(results[1]);
        setAnalytics(results[2]);
        setHealth(results[3]);
        if (currentRole === 'authority' && results[4]) {
          setSummary(results[4]);
        }
      } catch (err) {
        console.error('Failed to load map dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentRole]);

  const handleSelectHotspot = (h: Hotspot) => {
    setSelectedHotspot(h);
  };

  // Filtered hotspots for Map Toolbar
  const filteredHotspots = hotspots.filter((h) => {
    if (satelliteFilter !== 'ALL' && (h.satellite || '').toUpperCase() !== satelliteFilter.toUpperCase()) {
      return false;
    }
    if (classificationFilter !== 'ALL') {
      const cls = (h.classification?.probable_classification || '').toLowerCase();
      if (!cls.includes(classificationFilter.toLowerCase())) return false;
    }
    return true;
  });

  // Derived priority activity for Authority view
  const strictHighCriticalIncidents = summary?.priority_incidents
    ? summary.priority_incidents.filter((item) => {
        const p = (item.priority || '').toUpperCase();
        return p === 'HIGH' || p === 'CRITICAL';
      })
    : [];

  const fallbackRecentActivity = (summary?.priority_incidents && summary.priority_incidents.length > 0)
    ? summary.priority_incidents.slice(0, 5).map((item) => ({
        id: item.alert_id,
        eventId: item.event_id || item.alert_id,
        hotspotId: item.hotspot_id,
        title: item.title,
        location: item.location || 'Industrial Facility Area',
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

  // =========================================================================
  // AUTHORITY FULL MAP OVERSIGHT VIEW
  // =========================================================================
  if (currentRole === 'authority') {
    return (
      <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto custom-scrollbar overflow-y-auto h-full text-slate-900 dark:text-slate-100 select-none bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        {/* 1. AUTHORITY OPERATIONAL HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/90 pb-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
                <ShieldAlert className="w-7 h-7 text-amber-500 shrink-0" />
                <span>REGULATORY AUTHORITY — FULL GEOSPATIAL OVERSIGHT</span>
              </h1>
              <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                AUTHORITY OVERSIGHT & COMPLIANCE
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
              Nationwide thermal anomaly, industrial infrastructure, priority and compliance monitoring.
            </p>
          </div>

          <button
            onClick={() => navigate('/authority')}
            className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700/80 px-3.5 py-2 rounded-xl text-xs font-extrabold transition shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>← Back to Authority Monitoring</span>
          </button>
        </div>

        {/* 2. AUTHORITY TOP KPI STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white dark:bg-[#0B111E] p-4 rounded-xl border border-slate-200 dark:border-cyan-500/20 shadow-md dark:shadow-lg flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">TOTAL THERMAL OBSERVATIONS</span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{analytics?.total_detections || hotspots.length}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">Real-Time Satellite Detections</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0B111E] p-4 rounded-xl border border-slate-200 dark:border-red-500/20 shadow-md dark:shadow-lg flex items-center space-x-3">
            <div className="p-2.5 bg-red-500/10 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">HIGH / CRITICAL PRIORITY</span>
              <span className="text-xl sm:text-2xl font-extrabold text-red-600 dark:text-red-400 font-mono">
                {summary ? summary.critical_priority + summary.high_priority : 0}
              </span>
              <span className="text-[10px] text-red-600/90 dark:text-red-400/90 block font-mono">
                {summary?.critical_priority || 0} Critical | {summary?.high_priority || 0} High
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0B111E] p-4 rounded-xl border border-slate-200 dark:border-amber-500/20 shadow-md dark:shadow-lg flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">ACTIVE INVESTIGATIONS</span>
              <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">{summary?.investigating_cases || 0}</span>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-300/80 block font-mono">Active Regulatory Review</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0B111E] p-4 rounded-xl border border-slate-200 dark:border-emerald-500/20 shadow-md dark:shadow-lg flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">RESOLVED & VERIFIED</span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{summary?.resolved_cases || 0}</span>
              <span className="text-[10px] text-emerald-600/90 dark:text-emerald-400/90 block font-mono">Closed Compliance Cases</span>
            </div>
          </div>
        </div>

        {/* 3. AUTHORITY MAP TOOLBAR */}
        <div className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800/90 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Geospatial Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Satellite:</span>
              <select
                value={satelliteFilter}
                onChange={(e) => setSatelliteFilter(e.target.value)}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="ALL">All Satellites</option>
                <option value="N20">NOAA-20 (VIIRS)</option>
                <option value="N21">NOAA-21 (VIIRS)</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Source:</span>
              <select
                value={classificationFilter}
                onChange={(e) => setClassificationFilter(e.target.value)}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="ALL">All Classifications</option>
                <option value="Refinery">Refinery Units</option>
                <option value="Flare">Industrial Flares</option>
                <option value="Plant">Industrial Facilities</option>
              </select>
            </div>

            {(satelliteFilter !== 'ALL' || classificationFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSatelliteFilter('ALL');
                  setClassificationFilter('ALL');
                }}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* 4. PRIMARY GEOSPATIAL & REGULATORY WORKSPACE */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* LEFT: Dominant Interactive Map */}
          <div className="xl:col-span-8 bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3.5 shadow-md dark:shadow-2xl space-y-3 flex flex-col justify-between transition-colors duration-200">
            <div className="w-full h-[520px] sm:h-[560px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/90 shadow-inner bg-slate-100 dark:bg-[#040812] relative flex-1">
              <MapView
                hotspots={filteredHotspots}
                industrialSites={facilities}
                selectedHotspot={selectedHotspot}
                onSelectHotspot={handleSelectHotspot}
                onViewIncident={(hotspot) => {
                  setSelectedHotspot(hotspot);
                  // Preserve Authority context when navigating to incident detail
                  navigate('/incidents', { state: { selectedHotspot: hotspot, fromAuthority: true } });
                }}
              />
            </div>

            {/* AUTHORITY OVERSIGHT STRIP (BELOW MAP) */}
            <div className="bg-slate-50 dark:bg-[#080D1A] border border-slate-200 dark:border-slate-800/90 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs text-slate-700 dark:text-slate-300 gap-3">
              <div className="flex items-center space-x-2">
                <Satellite className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>
                  <strong>NASA FIRMS:</strong> {analytics?.data_freshness?.firms_status || 'VIIRS NOAA-20 & NOAA-21 Live'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Detections:</strong> {filteredHotspots.length} Observations
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>
                  <strong>High/Critical:</strong> {summary ? summary.critical_priority + summary.high_priority : 0}
                </span>
              </div>
              <div className="flex items-center space-x-2 font-mono text-[11px] text-cyan-700 dark:text-cyan-300">
                <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>
                  <strong>Last Sync:</strong>{' '}
                  {hotspots[0]?.acquisition_datetime
                    ? new Date(hotspots[0].acquisition_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Live'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: REGULATORY INCIDENT OVERVIEW PANEL */}
          <div className="xl:col-span-4 bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-md dark:shadow-2xl space-y-4 flex flex-col justify-between transition-colors duration-200">
            <div>
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-slate-800/80">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider font-mono">
                  REGULATORY INCIDENT OVERVIEW
                </h3>
              </div>

              {/* Oversight Status Grid */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="bg-slate-50 dark:bg-[#080D1A] p-2.5 rounded-xl border border-red-500/30">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">HIGH / CRITICAL</span>
                  <span className="text-lg font-extrabold text-red-600 dark:text-red-400 font-mono">
                    {summary ? summary.critical_priority + summary.high_priority : 0}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[#080D1A] p-2.5 rounded-xl border border-amber-500/30">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">UNDER INVESTIGATION</span>
                  <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                    {summary?.investigating_cases || 0}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[#080D1A] p-2.5 rounded-xl border border-cyan-500/30">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">COMPLIANCE REVIEW</span>
                  <span className="text-lg font-extrabold text-cyan-600 dark:text-cyan-400 font-mono">
                    {summary?.total_alerts || hotspots.length}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-[#080D1A] p-2.5 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">RESOLVED / VERIFIED</span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {summary?.resolved_cases || 0}
                  </span>
                </div>
              </div>

              {/* RECENT PRIORITY ACTIVITY SECTION */}
              <div className="mt-4 space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center justify-between">
                  <span>RECENT PRIORITY ACTIVITY</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-normal">Real Data Stream</span>
                </h4>

                {strictHighCriticalIncidents.length > 0 ? (
                  <div className="space-y-2">
                    {strictHighCriticalIncidents.slice(0, 4).map((inc) => (
                      <div
                        key={inc.alert_id}
                        className="bg-slate-50 dark:bg-[#080D1A] p-3 rounded-xl border border-red-500/30 space-y-1 hover:border-red-500/60 transition cursor-pointer"
                        onClick={() => navigate('/incidents', { state: { hotspotId: inc.hotspot_id } })}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[170px]">{inc.title}</span>
                          <span className="bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40 text-[9px] font-extrabold px-2 py-0.5 rounded">
                            {inc.priority}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10.5px] text-slate-600 dark:text-slate-400 font-mono">
                          <span>{inc.location}</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">{inc.frp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Honest zero High/Critical state banner */}
                    <div className="bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-bold">✓ No High or Critical Incidents Currently Active</span>
                    </div>

                    {/* Display real recent thermal observations keeping actual priority */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wide">
                        Recent Thermal Activity Stream:
                      </span>
                      {fallbackRecentActivity.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-50 dark:bg-[#080D1A] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 hover:border-slate-400 dark:hover:border-slate-700 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[170px]">{item.title}</span>
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                                item.priority === 'HIGH'
                                  ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40'
                                  : item.priority === 'MEDIUM'
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {item.priority}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                            <span className="truncate max-w-[140px]">{item.location}</span>
                            <span className="text-cyan-700 dark:text-cyan-300 font-bold">{item.frp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Button to Incident Intelligence */}
            <button
              onClick={() => navigate('/incidents')}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider shadow-md"
            >
              <span>View Full Incident Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5. REGULATORY & COMPLIANCE STATUS SECTION */}
        <div className="bg-white dark:bg-[#0B111E] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-md dark:shadow-2xl space-y-3 transition-colors duration-200">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight uppercase font-mono">
                REGULATORY & COMPLIANCE STATUS
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono uppercase">Oversight Governance</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-[#080D1A] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">ENVIRONMENTAL REVIEW</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">{summary?.total_alerts || hotspots.length}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">Monitored Facilities</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#080D1A] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">COMPLIANCE ACTIONS</span>
              <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 font-mono">{summary?.investigating_cases || 0}</span>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-300/80 block font-mono">Under Review</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#080D1A] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">VIOLATION FLAGS</span>
              <span className="text-lg font-extrabold text-red-600 dark:text-red-400 font-mono">{summary ? summary.critical_priority + summary.high_priority : 0}</span>
              <span className="text-[10px] text-red-600/90 dark:text-red-400/90 block font-mono">Priority Flagged</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#080D1A] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">CLOSED CASES</span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{summary?.resolved_cases || 0}</span>
              <span className="text-[10px] text-emerald-600/90 dark:text-emerald-400/90 block font-mono">Verified Closed</span>
            </div>
          </div>
        </div>

        {/* Selected Hotspot Drawer Detail */}
        {selectedHotspot && (
          <HotspotDrawer
            hotspot={selectedHotspot}
            onClose={() => setSelectedHotspot(null)}
          />
        )}

        {/* Comparison Modal */}
        {isCompareOpen && (
          <HotspotComparisonModal
            isOpen={isCompareOpen}
            onClose={() => setIsCompareOpen(false)}
            availableHotspots={hotspots}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // DEFAULT PUBLIC / GUEST EXPLORER VIEW
  // =========================================================================
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto custom-scrollbar overflow-y-auto h-full text-slate-900 dark:text-slate-100 select-none bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Hero Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <Satellite className="w-7 h-7 text-amber-500" />
              <span>ThermalTrace AI</span>
            </h1>
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded">
              SIH26162
            </span>
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 rounded-full text-[11px]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">LIVE SATELLITE TELEMETRY</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
            Satellite-Based Industrial Thermal Anomaly Intelligence
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">
            "Transforming satellite thermal detections into explainable industrial anomaly intelligence."
          </p>
        </div>

        {/* Compact Public Explorer Badge */}
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs shadow-md">
          <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">PUBLIC EXPLORER • READ ONLY</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Explore live satellite intelligence. Operational actions require an authorized role.</span>
          </div>
        </div>
      </div>

      {/* Compact Live Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center space-x-3 transition-colors duration-200">
          <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">NASA FIRMS Detections</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">{analytics?.total_detections || hotspots.length || 138}</span>
            <span className="text-[10px] text-slate-500 block">VIIRS NOAA-20 & NOAA-21</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center space-x-3 transition-colors duration-200">
          <div className="p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Factory className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Industrial Facilities</span>
            <span className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400">{facilities.length || 20}</span>
            <span className="text-[10px] text-slate-500 block">Monitored Infra Registry</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center space-x-3 transition-colors duration-200">
          <div className="p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Industrial Thermal Candidates</span>
            <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">{analytics?.industrial_candidates || 103}</span>
            <span className="text-[10px] text-slate-500 block">High Evidence Confidence</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center space-x-3 transition-colors duration-200">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Satellite Acquisition</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block truncate">{analytics?.data_freshness?.firms_status || 'NASA FIRMS Live'}</span>
            <span className="text-[10px] text-slate-500 block">Near-Real-Time Stream</span>
          </div>
        </div>
      </div>

      {/* Main Hero: Large Interactive Map View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-0 transition-colors duration-200">
        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Interactive Geospatial Thermal Anomaly Map</h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden md:inline">• Click any hotspot marker to inspect explainable AI evidence</span>
          </div>
          <button
            onClick={() => navigate('/observations')}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Observations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-[480px] sm:h-[520px] w-full relative">
          <MapView
            hotspots={hotspots}
            industrialSites={facilities}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={handleSelectHotspot}
            onViewIncident={(h) => navigate('/incidents', { state: { selectedHotspot: h } })}
          />
        </div>
      </div>

      {/* Selected Hotspot Drawer Detail */}
      {selectedHotspot && (
        <HotspotDrawer
          hotspot={selectedHotspot}
          onClose={() => setSelectedHotspot(null)}
        />
      )}

      {/* Comparison Modal */}
      {isCompareOpen && (
        <HotspotComparisonModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          availableHotspots={hotspots}
        />
      )}
    </div>
  );
};
