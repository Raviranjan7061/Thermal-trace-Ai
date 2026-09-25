import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { AnalyticsOverview, Hotspot } from '../types';
import { HotspotDrawer } from '../components/Dashboard/HotspotDrawer';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  ComposedChart,
  Legend
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  Database,
  Flame,
  AlertTriangle,
  Zap,
  ShieldAlert,
  RefreshCw,
  Eye,
  Filter,
  RotateCcw,
  Clock,
  Activity,
  TrendingUp,
  AlertCircle,
  Satellite,
  Sun,
  Moon,
  CheckCircle2,
  SlidersHorizontal,
  Info,
  X
} from 'lucide-react';

const COLORS = ['#ef4444', '#a855f7', '#f59e0b', '#3b82f6', '#10b981', '#64748b'];

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  // Filter States
  const [days, setDays] = useState<number>(30);
  const [satellite, setSatellite] = useState<string>('all');
  const [classification, setClassification] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [daynight, setDaynight] = useState<string>('all');

  // Applied Filter States (triggers API fetch)
  const [appliedFilters, setAppliedFilters] = useState({
    days: 30,
    satellite: 'all',
    classification: 'all',
    priority: 'all',
    daynight: 'all'
  });

  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Drill-down Detail States
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [loadingHotspotId, setLoadingHotspotId] = useState<string | null>(null);
  const [showAvgFrpModal, setShowAvgFrpModal] = useState<boolean>(false);

  const handleRowClick = async (hotspotId: string) => {
    if (!hotspotId) return;
    setLoadingHotspotId(hotspotId);
    try {
      const data = await apiService.getHotspotById(hotspotId);
      setSelectedHotspot(data);
    } catch (err) {
      console.error('Failed to fetch hotspot detail:', err);
    } finally {
      setLoadingHotspotId(null);
    }
  };

  const fetchAnalytics = useCallback(async (filters = appliedFilters) => {
    setLoading(true);
    try {
      const data = await apiService.getAnalyticsOverview({
        days: filters.days,
        satellite: filters.satellite === 'all' ? undefined : filters.satellite,
        classification: filters.classification === 'all' ? undefined : filters.classification,
        priority: filters.priority === 'all' ? undefined : filters.priority,
        daynight: filters.daynight === 'all' ? undefined : filters.daynight
      });
      setAnalytics(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchAnalytics(appliedFilters);
  }, [appliedFilters, fetchAnalytics]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      days,
      satellite,
      classification,
      priority,
      daynight
    });
  };

  const handleResetFilters = () => {
    setDays(30);
    setSatellite('all');
    setClassification('all');
    setPriority('all');
    setDaynight('all');
    setAppliedFilters({
      days: 30,
      satellite: 'all',
      classification: 'all',
      priority: 'all',
      daynight: 'all'
    });
  };

  // Data transformations for charts
  const clsPieData = analytics?.classification_breakdown
    ? Object.entries(analytics.classification_breakdown).map(([name, value]) => ({ name, value }))
    : [];

  const frpBarData = analytics?.avg_frp_by_classification
    ? Object.entries(analytics.avg_frp_by_classification).map(([name, value]) => ({ name, value }))
    : [];

  const persistentVsSuddenData = analytics?.persistent_vs_sudden
    ? [
        { name: 'Persistent Sources', value: analytics.persistent_vs_sudden.persistent_count, color: '#3b82f6' },
        { name: 'Sudden Events', value: analytics.persistent_vs_sudden.sudden_count, color: '#f59e0b' }
      ]
    : [];

  const timeSeriesData = analytics?.time_series || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto custom-scrollbar overflow-y-auto h-full text-slate-900 dark:text-slate-100 select-none bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Satellite Thermal Intelligence Analytics</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time satellite observation metrics, anomaly classification distribution, baseline comparison & telemetry
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {lastUpdated && (
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> Updated: {lastUpdated}
            </span>
          )}
          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full font-medium text-[11px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Real DB Ingestion
          </span>
          <button
            onClick={() => fetchAnalytics()}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm dark:shadow-none space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-amber-500" />
            <span>Filter Operational Data</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Period: <span className="text-amber-600 dark:text-amber-400 font-medium">{days} Days</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Date Range Dropdown */}
          <div>
            <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">Date Range</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value={7} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Last 7 Days</option>
              <option value={14} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Last 14 Days</option>
              <option value={30} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Last 30 Days</option>
              <option value={60} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Last 60 Days</option>
              <option value={90} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Last 90 Days</option>
            </select>
          </div>

          {/* Satellite Dropdown */}
          <div>
            <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">Satellite Instrument</label>
            <select
              value={satellite}
              onChange={(e) => setSatellite(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Satellites</option>
              <option value="NOAA-20" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">NOAA-20 (VIIRS)</option>
              <option value="NOAA-21" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">NOAA-21 (VIIRS)</option>
            </select>
          </div>

          {/* Classification Dropdown */}
          <div>
            <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">Classification</label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Classifications</option>
              <option value="Industrial Flare / Stack" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Industrial Flare / Stack</option>
              <option value="Industrial Kiln / Furnace" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Industrial Kiln / Furnace</option>
              <option value="Refinery Heavy Industrial" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Refinery Heavy Industrial</option>
              <option value="Natural Vegetation Fire" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Natural Vegetation Fire</option>
              <option value="Unclassified / Unknown" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Unclassified / Unknown</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div>
            <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">Investigation Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Priorities</option>
              <option value="CRITICAL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">CRITICAL</option>
              <option value="HIGH" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">HIGH</option>
              <option value="MODERATE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">MODERATE</option>
              <option value="LOW" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">LOW</option>
            </select>
          </div>

          {/* Day / Night Dropdown */}
          <div>
            <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">Day / Night Cycle</label>
            <select
              value={daynight}
              onChange={(e) => setDaynight(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Observations</option>
              <option value="D" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Day (D)</option>
              <option value="N" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Night (N)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg flex items-center space-x-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>

      {/* 7 KPI Summary Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Card 1: Total Thermal Detections */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/observations')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/observations'); } }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1 shadow-sm dark:shadow-none cursor-pointer hover:border-amber-500/50 hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          title="Click to view all live satellite thermal observations"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Total Detections</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {analytics?.total_detections ?? 0}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center justify-between">
            <span>Real satellite records</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 2: Active Anomalies */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/alerts')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/alerts'); } }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1 shadow-sm dark:shadow-none cursor-pointer hover:border-amber-500/50 hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          title="Click to view active flagged anomaly alerts"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Active Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {analytics?.active_anomalies_count ?? 0}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center justify-between">
            <span>Flagged anomalies</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 3: Average FRP */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowAvgFrpModal(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowAvgFrpModal(true); } }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1 shadow-sm dark:shadow-none cursor-pointer hover:border-amber-500/50 hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          title="Click to view average FRP breakdown details"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Average FRP</span>
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {analytics?.avg_frp !== undefined && analytics?.avg_frp !== null
              ? `${analytics.avg_frp.toFixed(1)} MW`
              : 'N/A'}
          </div>
          <div className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium flex items-center justify-between">
            <span>Mean radiative power</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 4: High / Critical Priority */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/alerts')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/alerts'); } }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1 shadow-sm dark:shadow-none cursor-pointer hover:border-red-500/50 hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
          title="Click to view urgent high/critical alerts"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
            <span>High/Critical</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400">
            {analytics?.high_critical_count ?? 0}
          </div>
          <div className="text-[10px] text-red-600 dark:text-red-400 font-medium flex items-center justify-between">
            <span>Urgent investigation</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 5: Persistent Sources */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/industrial-sites')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/industrial-sites'); } }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1 shadow-sm dark:shadow-none cursor-pointer hover:border-blue-500/50 hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          title="Click to view persistent industrial sources"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Persistent Sources</span>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {analytics?.persistent_sources_count ?? 0}
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center justify-between">
            <span>Recurrent clusters</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 6: Sudden Events */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/incidents')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/incidents'); } }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1 shadow-sm dark:shadow-none cursor-pointer hover:border-purple-500/50 hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          title="Click to view sudden / spike events"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Sudden Events</span>
            <Zap className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
            {analytics?.sudden_events_count ?? 0}
          </div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium flex items-center justify-between">
            <span>New / spike events</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 7: Needs Review */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/reviews')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/reviews'); } }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1 shadow-sm dark:shadow-none cursor-pointer hover:border-emerald-500/50 hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          title="Click to view analyst review queue"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Needs Review</span>
            <Eye className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {analytics?.needs_review_count ?? 0}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between">
            <span>Analyst queue</span>
            <span>→</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Thermal Activity Over Time & Baseline Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thermal Activity Over Time (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>Thermal Activity Over Time</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Daily count of satellite thermal observations vs. average Fire Radiative Power (MW)
              </p>
            </div>
            <div className="flex items-center space-x-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="w-3 h-3 bg-blue-500/80 rounded-sm"></span> Detections
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span className="w-3.5 h-0.5 bg-amber-500"></span> Avg FRP (MW)
              </span>
            </div>
          </div>

          <div className="h-72">
            {timeSeriesData.length > 0 && timeSeriesData.some(d => d.detection_count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 10 }} name="Detections" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} name="FRP (MW)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', fontSize: '12px', borderRadius: '8px' }}
                  />
                  <Bar yAxisId="left" dataKey="detection_count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Detections" />
                  <Line yAxisId="right" type="monotone" dataKey="avg_frp" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="Avg FRP (MW)" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                <Info className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                <p className="text-xs font-medium text-slate-700 dark:text-slate-400">No Satellite Thermal Observations Available</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 max-w-sm">
                  No observations match the selected period or filters in the backend database. Synchronize NASA FIRMS data to populate telemetry.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Current vs Historical Baseline Comparison Panel (1 col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 flex flex-col justify-between shadow-sm dark:shadow-none">
          <div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                Historical Baseline Comparison
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Evaluates current operational thermal power against historical cluster baselines.
            </p>

            <div className="mt-4 space-y-3">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Baseline Target Cluster:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium">All Monitored AOIs</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Period Observations:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{analytics?.total_detections ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Baseline Expected Mean:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium">
                    {analytics?.baseline_expected_mean !== undefined && analytics?.baseline_expected_mean !== null
                      ? `${analytics.baseline_expected_mean.toFixed(1)} MW`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Observed Mean FRP:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium">
                    {analytics?.avg_frp !== undefined && analytics?.avg_frp !== null
                      ? `${analytics.avg_frp.toFixed(1)} MW`
                      : '0.0 MW'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Anomaly Deviation Status</div>
                {analytics?.active_anomalies_count && analytics.active_anomalies_count > 0 ? (
                  <div className="p-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>{analytics.active_anomalies_count} active anomalous deviations identified in stored data.</span>
                  </div>
                ) : (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Thermal activity within standard baseline tolerance or no stored anomaly signals.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500">
            Statistical engine uses multi-pass spatial DBSCAN clustering and Z-score variance testing.
          </div>
        </div>
      </div>

      {/* 2x2 Grid of Distributions & Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classification Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-3 shadow-sm dark:shadow-none">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <PieIcon className="w-4 h-4 text-amber-500" />
            <span>Classification Distribution</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Thermal anomaly proportions generated by real proximity and spectral rules
          </p>

          <div className="h-64">
            {clsPieData.length > 0 && clsPieData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clsPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {clsPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs">
                No classification breakdown available for selected period
              </div>
            )}
          </div>
        </div>

        {/* Average FRP by Source Category */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-3 shadow-sm dark:shadow-none">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <span>Average Fire Radiative Power (MW) by Source Category</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Mean MW power output comparison across facility and natural source types
          </p>

          <div className="h-64">
            {frpBarData.length > 0 && frpBarData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frpBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 9 }} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', fontSize: '12px' }} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Avg FRP (MW)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs">
                No category average FRP data available
              </div>
            )}
          </div>
        </div>

        {/* Persistent vs Sudden Sources */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-3 shadow-sm dark:shadow-none">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <span>Persistent vs Sudden Thermal Clusters</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Ratio of recurrent industrial heat signatures to new sudden thermal anomalies
          </p>

          <div className="h-64 flex flex-col md:flex-row items-center justify-around">
            <div className="w-full md:w-1/2 h-full">
              {analytics?.persistent_vs_sudden && (analytics.persistent_vs_sudden.persistent_count > 0 || analytics.persistent_vs_sudden.sudden_count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={persistentVsSuddenData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                    >
                      {persistentVsSuddenData.map((entry, index) => (
                        <Cell key={`cell-pvs-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs">
                  No cluster temporal data
                </div>
              )}
            </div>

            <div className="w-full md:w-1/2 space-y-3 px-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Persistent Sources</span>
                  <span className="text-slate-900 dark:text-slate-200 font-bold">
                    {analytics?.persistent_vs_sudden.persistent_count ?? 0}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full"
                    style={{ width: `${analytics?.persistent_vs_sudden.persistent_pct ?? 0}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 text-right">
                  {analytics?.persistent_vs_sudden.persistent_pct ?? 0}% of clusters
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Sudden Events</span>
                  <span className="text-slate-900 dark:text-slate-200 font-bold">
                    {analytics?.persistent_vs_sudden.sudden_count ?? 0}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${analytics?.persistent_vs_sudden.sudden_pct ?? 0}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 text-right">
                  {analytics?.persistent_vs_sudden.sudden_pct ?? 0}% of clusters
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Satellite & Day/Night Telemetry Splits */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-sm dark:shadow-none">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Satellite className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Satellite & Orbital Pass Telemetry</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Observation distribution across NOAA-20/21 VIIRS platforms and orbital pass cycles
          </p>

          <div className="space-y-4">
            {/* Satellite Breakdown */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                  <Satellite className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Satellite Constellation Split
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  NOAA-20 vs NOAA-21
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-purple-500 h-full"
                  style={{ width: `${analytics?.satellites_breakdown.noaa20_pct ?? 50}%` }}
                  title={`NOAA-20: ${analytics?.satellites_breakdown.noaa20_count ?? 0}`}
                ></div>
                <div
                  className="bg-indigo-500 h-full"
                  style={{ width: `${analytics?.satellites_breakdown.noaa21_pct ?? 50}%` }}
                  title={`NOAA-21: ${analytics?.satellites_breakdown.noaa21_count ?? 0}`}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] pt-1">
                <span className="text-purple-600 dark:text-purple-400">
                  NOAA-20: <strong className="text-slate-900 dark:text-slate-200">{analytics?.satellites_breakdown.noaa20_count ?? 0}</strong> ({analytics?.satellites_breakdown.noaa20_pct ?? 0}%)
                </span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  NOAA-21: <strong className="text-slate-900 dark:text-slate-200">{analytics?.satellites_breakdown.noaa21_count ?? 0}</strong> ({analytics?.satellites_breakdown.noaa21_pct ?? 0}%)
                </span>
              </div>
            </div>

            {/* Day / Night Breakdown */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Day / Night Orbital Cycle Split
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Solar Illumination Phase
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${analytics?.daynight_breakdown.day_pct ?? 50}%` }}
                  title={`Day: ${analytics?.daynight_breakdown.day_count ?? 0}`}
                ></div>
                <div
                  className="bg-blue-600 h-full"
                  style={{ width: `${analytics?.daynight_breakdown.night_pct ?? 50}%` }}
                  title={`Night: ${analytics?.daynight_breakdown.night_count ?? 0}`}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] pt-1">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Sun className="w-3 h-3" /> Day Pass: <strong className="text-slate-900 dark:text-slate-200">{analytics?.daynight_breakdown.day_count ?? 0}</strong> ({analytics?.daynight_breakdown.day_pct ?? 0}%)
                </span>
                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Moon className="w-3 h-3" /> Night Pass: <strong className="text-slate-900 dark:text-slate-200">{analytics?.daynight_breakdown.night_count ?? 0}</strong> ({analytics?.daynight_breakdown.night_pct ?? 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Thermal Anomalies Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Top Thermal Anomalies (Ranked by Priority & FRP)</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Verified anomalies prioritized for immediate analyst investigation
            </p>
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 self-start sm:self-auto font-mono">
            Showing top {analytics?.top_anomalies.length ?? 0} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-950/50">
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Location / Facility</th>
                <th className="py-2.5 px-3">Current FRP</th>
                <th className="py-2.5 px-3">Baseline</th>
                <th className="py-2.5 px-3">Deviation</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
              {analytics?.top_anomalies && analytics.top_anomalies.length > 0 ? (
                analytics.top_anomalies.map((item) => (
                  <tr
                    key={item.event_id}
                    onClick={() => handleRowClick(item.hotspot_id)}
                    className="hover:bg-amber-500/10 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                    title={`Click to inspect event details for ${item.event_id}`}
                  >
                    <td className="py-2.5 px-3 font-mono text-amber-600 dark:text-amber-400 font-medium group-hover:underline flex items-center space-x-1">
                      <span>{item.event_id}</span>
                      {loadingHotspotId === item.hotspot_id && (
                        <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 dark:text-slate-200 font-medium">{item.location}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{item.current_frp}</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{item.baseline}</td>
                    <td className="py-2.5 px-3 font-medium text-emerald-600 dark:text-emerald-400">{item.deviation}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{item.classification}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.priority === 'CRITICAL'
                            ? 'bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-400'
                            : item.priority === 'HIGH'
                            ? 'bg-orange-50 dark:bg-orange-500/20 border border-orange-200 dark:border-orange-500/40 text-orange-700 dark:text-orange-400'
                            : item.priority === 'MODERATE'
                            ? 'bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{item.status}</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px]">{item.detected}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                    No qualifying thermal anomalies found for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Freshness & System Telemetry Footer Panel */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-sm dark:shadow-none">
        <div className="flex items-center space-x-3">
          <Database className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <span>NASA FIRMS Telemetry Pipeline:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  analytics?.data_freshness.firms_status === 'Connected'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                }`}
              >
                {analytics?.data_freshness.firms_status ?? 'NOT CONFIGURED'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Total DB Observations Stored: <strong className="text-slate-900 dark:text-slate-200">{analytics?.data_freshness.total_db_records ?? 0}</strong>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div>
            Last Ingestion Sync:{' '}
            <span className="text-slate-900 dark:text-slate-200 font-mono">{analytics?.data_freshness.last_sync ?? 'Never'}</span>
          </div>
          <div>
            Latest NOAA-20 Obs:{' '}
            <span className="text-slate-900 dark:text-slate-200 font-mono">{analytics?.data_freshness.noaa20_latest ?? 'None'}</span>
          </div>
          <div>
            Latest NOAA-21 Obs:{' '}
            <span className="text-slate-900 dark:text-slate-200 font-mono">{analytics?.data_freshness.noaa21_latest ?? 'None'}</span>
          </div>
        </div>
      </div>

      {/* Event Intelligence Drawer */}
      <HotspotDrawer
        hotspot={selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
        onReviewSubmitted={() => fetchAnalytics(appliedFilters)}
      />

      {/* Average FRP Detail Modal */}
      {showAvgFrpModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Fire Radiative Power (FRP) Telemetry</h2>
              </div>
              <button
                onClick={() => setShowAvgFrpModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl space-y-1">
                <div className="text-[11px] text-yellow-700 dark:text-yellow-400 font-semibold uppercase">Overall Mean FRP Power</div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {analytics?.avg_frp !== undefined && analytics?.avg_frp !== null
                    ? `${analytics.avg_frp.toFixed(1)} MW`
                    : 'N/A'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Calculated from {analytics?.total_detections ?? 0} active satellite thermal observations across the selected period.
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-900 dark:text-slate-200">Category Mean FRP Output</div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {analytics?.avg_frp_by_classification && Object.keys(analytics.avg_frp_by_classification).length > 0 ? (
                    Object.entries(analytics.avg_frp_by_classification).map(([cat, val]) => (
                      <div key={cat} className="p-2.5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{cat}</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{val.toFixed(1)} MW</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-slate-400 text-center">No category FRP data available</div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAvgFrpModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
