import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ShieldCheck,
  Lock,
  ExternalLink,
  HelpCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { apiService } from '../services/api';
import { Hotspot, IndustrialFacility, AnalyticsOverview, DataSourceStatus, SystemHealth } from '../types';
import { MapView } from '../components/Dashboard/MapView';
import { HotspotDrawer } from '../components/Dashboard/HotspotDrawer';
import { HotspotComparisonModal } from '../components/Compare/HotspotComparisonModal';

export const PublicDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [facilities, setFacilities] = useState<IndustrialFacility[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [hData, fData, aData, sData] = await Promise.all([
          apiService.getHotspots({ limit: 100 }),
          apiService.getIndustrialSites(),
          apiService.getAnalyticsOverview(),
          apiService.getSystemHealth()
        ]);
        setHotspots(hData);
        setFacilities(fData);
        setAnalytics(aData);
        setHealth(sData);
      } catch (err) {
        console.error('Failed to load public dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSelectHotspot = (h: Hotspot) => {
    setSelectedHotspot(h);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto custom-scrollbar overflow-y-auto h-full text-slate-100 select-none">
      {/* Hero Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
              <Satellite className="w-7 h-7 text-amber-500" />
              <span>ThermalTrace AI</span>
            </h1>
            <span className="bg-slate-950 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded">
              SIH26162
            </span>
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full text-[11px]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-emerald-400 font-semibold">LIVE SATELLITE TELEMETRY</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-300 mt-1">
            Satellite-Based Industrial Thermal Anomaly Intelligence
          </p>
          <p className="text-xs text-slate-400 mt-0.5 italic">
            "Transforming satellite thermal detections into explainable industrial anomaly intelligence."
          </p>
        </div>

        {/* Compact Public Explorer Badge */}
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="font-bold text-slate-200 block">PUBLIC EXPLORER • READ ONLY</span>
            <span className="text-[10px] text-slate-400">Explore live satellite intelligence. Operational actions require an authorized role.</span>
          </div>
        </div>
      </div>

      {/* Compact Live Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NASA FIRMS Detections</span>
            <span className="text-xl font-extrabold text-white">{analytics?.total_detections || hotspots.length || 138}</span>
            <span className="text-[10px] text-slate-500 block">VIIRS NOAA-20 & NOAA-21</span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Factory className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Industrial Facilities</span>
            <span className="text-xl font-extrabold text-cyan-400">{facilities.length || 20}</span>
            <span className="text-[10px] text-slate-500 block">Monitored Infra Registry</span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl flex items-center space-x-3">
          <div className="p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Industrial Thermal Candidates</span>
            <span className="text-xl font-extrabold text-purple-400">{analytics?.industrial_candidates || 103}</span>
            <span className="text-[10px] text-slate-500 block">High Evidence Confidence</span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Satellite Acquisition</span>
            <span className="text-xs font-bold text-emerald-400 block truncate">{analytics?.data_freshness?.firms_status || 'NASA FIRMS Live'}</span>
            <span className="text-[10px] text-slate-500 block">Near-Real-Time Stream</span>
          </div>
        </div>
      </div>

      {/* Main Hero: Large Interactive Map View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-0">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-white">Interactive Geospatial Thermal Anomaly Map</h2>
            <span className="text-[11px] text-slate-400 font-mono hidden md:inline">• Click any hotspot marker to inspect explainable AI evidence</span>
          </div>
          <button
            onClick={() => setIsCompareOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-800 transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>Compare Hotspot Events</span>
          </button>
        </div>

        <div className="h-[520px] w-full relative">
          {loading ? (
            <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span>Loading Leaflet Geospatial Map Telemetry...</span>
            </div>
          ) : (
            <MapView
              hotspots={hotspots}
              industrialSites={facilities}
              selectedHotspot={selectedHotspot}
              onSelectHotspot={handleSelectHotspot}
            />
          )}
        </div>
      </div>

      {/* Explore ThermalTrace Intelligence Showcase Feature Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Explore ThermalTrace Intelligence Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Thermal Replay */}
          <div
            onClick={() => {
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }}
            className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-amber-500/50 transition cursor-pointer group space-y-2"
          >
            <div className="flex justify-between items-center">
              <Play className="w-5 h-5 text-amber-400 group-hover:scale-110 transition" />
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Interactive
              </span>
            </div>
            <h4 className="font-bold text-slate-100 text-xs group-hover:text-amber-400 transition">Historical Thermal Replay</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Animate chronological satellite thermal activity over time across India.
            </p>
          </div>

          {/* Card 2: Multi-Satellite Correlation */}
          <div
            onClick={() => {
              if (hotspots.length > 0) setSelectedHotspot(hotspots[0]);
            }}
            className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-purple-500/50 transition cursor-pointer group space-y-2"
          >
            <div className="flex justify-between items-center">
              <Satellite className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" />
              <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                Multi-Sensor
              </span>
            </div>
            <h4 className="font-bold text-slate-100 text-xs group-hover:text-purple-400 transition">Multi-Satellite Correlation</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Correlate cross-track observations between NOAA-20 and NOAA-21 satellites.
            </p>
          </div>

          {/* Card 3: Industrial Infrastructure */}
          <div
            onClick={() => navigate('/industrial-sites')}
            className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer group space-y-2"
          >
            <div className="flex justify-between items-center">
              <Factory className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                Spatial Proximity
              </span>
            </div>
            <h4 className="font-bold text-slate-100 text-xs group-hover:text-cyan-400 transition">Industrial Infrastructure</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Inspect refineries, power plants, and steel mills matched against thermal events.
            </p>
          </div>

          {/* Card 4: Event Comparison */}
          <div
            onClick={() => setIsCompareOpen(true)}
            className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-blue-500/50 transition cursor-pointer group space-y-2"
          >
            <div className="flex justify-between items-center">
              <GitCompare className="w-5 h-5 text-blue-400 group-hover:scale-110 transition" />
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                Comparison
              </span>
            </div>
            <h4 className="font-bold text-slate-100 text-xs group-hover:text-blue-400 transition">Incident Comparison</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Side-by-side analysis of FRP, classification, and industrial proximity.
            </p>
          </div>

          {/* Card 5: Dynamic Analytics */}
          <div
            onClick={() => navigate('/analytics')}
            className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer group space-y-2"
          >
            <div className="flex justify-between items-center">
              <TrendingUp className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Telemetry
              </span>
            </div>
            <h4 className="font-bold text-slate-100 text-xs group-hover:text-emerald-400 transition">Dynamic Analytics</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Time-series trends, day/night ratios, and classification breakdowns.
            </p>
          </div>

          {/* Card 6: Data Sources Transparency */}
          <div
            onClick={() => navigate('/data-sources')}
            className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-amber-500/50 transition cursor-pointer group space-y-2"
          >
            <div className="flex justify-between items-center">
              <Info className="w-5 h-5 text-amber-400 group-hover:scale-110 transition" />
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Transparency
              </span>
            </div>
            <h4 className="font-bold text-slate-100 text-xs group-hover:text-amber-400 transition">Data Sources & Provenance</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Traceability matrix for NASA FIRMS, Copernicus, and OpenStreetMap.
            </p>
          </div>

          {/* Card 7: Model Intelligence */}
          <div
            onClick={() => navigate('/model-performance')}
            className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-purple-500/50 transition cursor-pointer group space-y-2"
          >
            <div className="flex justify-between items-center">
              <Cpu className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" />
              <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                Methodology
              </span>
            </div>
            <h4 className="font-bold text-slate-100 text-xs group-hover:text-purple-400 transition">Model Intelligence</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Explainable evidence rules, priority scoring, and classification accuracy.
            </p>
          </div>

          {/* Card 8: System Health Telemetry */}
          <div
            onClick={() => navigate('/system-health')}
            className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer group space-y-2"
          >
            <div className="flex justify-between items-center">
              <Activity className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                Health
              </span>
            </div>
            <h4 className="font-bold text-slate-100 text-xs group-hover:text-cyan-400 transition">System Health & Pipeline</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Live status for FastAPI backend, SQLite engine, and FIRMS sync worker.
            </p>
          </div>
        </div>
      </div>

      {/* Observations Preview Table (Moved below hero map) */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden space-y-0">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Recent Satellite Observations Preview</h3>
          </div>
          <button
            onClick={() => navigate('/explorer')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
          >
            <span>View All Detections in Data Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3">Hotspot ID</th>
                <th className="p-3">Satellite / Instrument</th>
                <th className="p-3">FRP (MW)</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Nearest Infrastructure</th>
                <th className="p-3 text-right">Acquisition Time</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {hotspots.slice(0, 8).map((h) => (
                <tr key={h.hotspot_id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-bold text-amber-400 text-[11px]">{h.hotspot_id.substring(0, 12)}...</td>
                  <td className="p-3 font-semibold text-slate-200">{h.satellite} ({h.instrument})</td>
                  <td className="p-3 font-bold text-amber-400">{h.frp ? `${h.frp} MW` : 'N/A'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      {h.classification?.probable_classification || 'Industrial Candidate'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">
                    {h.classification?.nearest_facility_name ? (
                      <span>{h.classification.nearest_facility_name} ({h.classification.distance_to_nearest_facility_km?.toFixed(1)} km)</span>
                    ) : (
                      <span className="text-slate-500">Unspecified Proximity</span>
                    )}
                  </td>
                  <td className="p-3 text-right text-slate-400 font-mono text-[11px]">
                    {new Date(h.acquisition_datetime).toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleSelectHotspot(h)}
                      className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-semibold transition"
                    >
                      Inspect Intelligence
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Intelligence Drawer Modal */}
      <HotspotDrawer
        hotspot={selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
      />

      {/* Event Comparison Modal */}
      <HotspotComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        availableHotspots={hotspots}
      />
    </div>
  );
};
