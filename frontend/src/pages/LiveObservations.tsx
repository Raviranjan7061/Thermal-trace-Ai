import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Flame,
  Activity,
  Search,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sun,
  Zap
} from 'lucide-react';
import { apiService } from '../services/api';
import { Hotspot } from '../types';
import { HotspotDrawer } from '../components/Dashboard/HotspotDrawer';

export const LiveObservationsPage: React.FC = () => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [satelliteFilter, setSatelliteFilter] = useState('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState('ALL');
  const [dayNightFilter, setDayNightFilter] = useState('ALL');
  const [minFrpFilter, setMinFrpFilter] = useState<number>(0);

  const fetchObservations = async () => {
    setLoading(true);
    try {
      const data = await apiService.getHotspots({ limit: 200 });
      setHotspots(data);
    } catch (err) {
      console.error('Failed to load observations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservations();
  }, []);

  const filteredHotspots = hotspots.filter((h) => {
    if (satelliteFilter !== 'ALL' && h.satellite !== satelliteFilter) return false;

    const conf = (h.classification?.confidence_level || h.confidence || 'nominal').toLowerCase();
    if (confidenceFilter !== 'ALL' && conf !== confidenceFilter.toLowerCase()) return false;

    if (dayNightFilter !== 'ALL' && h.daynight !== dayNightFilter) return false;

    const frpVal = h.frp ?? 0;
    if (frpVal < minFrpFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = h.hotspot_id.toLowerCase().includes(q);
      const matchCoords = `${h.latitude},${h.longitude}`.includes(q);
      const matchSat = h.satellite.toLowerCase().includes(q);
      const matchClass = (h.classification?.probable_classification || '').toLowerCase().includes(q);
      if (!matchId && !matchCoords && !matchSat && !matchClass) return false;
    }
    return true;
  });

  const validFrps = hotspots.map((h) => h.frp).filter((f): f is number => f != null);
  const maxFrp = validFrps.length > 0 ? Math.max(...validFrps) : 0;
  const highFrpCount = hotspots.filter((h) => (h.frp ?? 0) >= 10).length;
  const noaa20Count = hotspots.filter((h) => h.satellite === 'NOAA-20').length;
  const noaa21Count = hotspots.filter((h) => h.satellite === 'NOAA-21').length;

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto custom-scrollbar p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <Satellite className="w-5 h-5 text-amber-400" />
              <span>📡 Live Thermal Observations</span>
            </h1>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
              NASA FIRMS Telemetry Stream
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time VIIRS spaceborne thermal telemetry observations with radiant energy calculations and spatial classification.
          </p>
        </div>

        <button
          onClick={fetchObservations}
          className="self-start md:self-auto flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh Observations</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Total Ingested Telemetry</div>
            <div className="text-xl font-bold text-slate-100">{loading ? '...' : hotspots.length}</div>
            <div className="text-[10px] text-slate-500">Active VIIRS observation records</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Max Fire Radiative Power</div>
            <div className="text-xl font-bold text-red-400">{loading ? '...' : `${maxFrp.toFixed(1)} MW`}</div>
            <div className="text-[10px] text-slate-500">Peak thermal radiant energy</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">High FRP Anomalies (&gt;=10 MW)</div>
            <div className="text-xl font-bold text-amber-400">{loading ? '...' : highFrpCount}</div>
            <div className="text-[10px] text-slate-500">Elevated thermal intensity events</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Constellation Sensor Split</div>
            <div className="text-xs font-mono font-bold text-cyan-400 mt-1">
              NOAA-20: {noaa20Count} | NOAA-21: {noaa21Count}
            </div>
            <div className="text-[10px] text-slate-500">Dual VIIRS satellite orbiters</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Telemetry ID, Lat/Lon, Satellite, or Classification..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Satellite */}
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
              <Satellite className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={satelliteFilter}
                onChange={(e) => setSatelliteFilter(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none text-xs"
              >
                <option value="ALL" className="bg-slate-900">All Satellites</option>
                <option value="NOAA-20" className="bg-slate-900">NOAA-20 VIIRS</option>
                <option value="NOAA-21" className="bg-slate-900">NOAA-21 VIIRS</option>
              </select>
            </div>

            {/* Confidence */}
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none text-xs"
              >
                <option value="ALL" className="bg-slate-900">All Confidence</option>
                <option value="high" className="bg-slate-900">High Confidence</option>
                <option value="nominal" className="bg-slate-900">Nominal Confidence</option>
                <option value="low" className="bg-slate-900">Low Confidence</option>
              </select>
            </div>

            {/* Day / Night */}
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
              <Sun className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={dayNightFilter}
                onChange={(e) => setDayNightFilter(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none text-xs"
              >
                <option value="ALL" className="bg-slate-900">Day & Night</option>
                <option value="D" className="bg-slate-900">Day Pass (D)</option>
                <option value="N" className="bg-slate-900">Night Pass (N)</option>
              </select>
            </div>

            {/* Min FRP slider */}
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1">
              <span className="text-slate-400 text-[11px]">Min FRP:</span>
              <input
                type="range"
                min="0"
                max="50"
                value={minFrpFilter}
                onChange={(e) => setMinFrpFilter(Number(e.target.value))}
                className="w-20 accent-amber-500 cursor-pointer"
              />
              <span className="text-amber-400 font-mono text-xs w-8">{minFrpFilter} MW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Observation Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex-1">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 font-medium">
            Showing <span className="text-amber-400 font-bold">{filteredHotspots.length}</span> of{' '}
            <span className="text-slate-200">{hotspots.length}</span> observations
          </div>
          <div className="text-slate-500 text-[11px]">Click any observation row to open full evidence drawer</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-4">Telemetry ID</th>
                <th className="py-2.5 px-4">Acquisition Time</th>
                <th className="py-2.5 px-4">Satellite / Sensor</th>
                <th className="py-2.5 px-4">Coordinates (Lat, Lon)</th>
                <th className="py-2.5 px-4">FRP (MW)</th>
                <th className="py-2.5 px-4">Brightness (K)</th>
                <th className="py-2.5 px-4">Confidence</th>
                <th className="py-2.5 px-4">Probable Classification</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Loading live thermal observations...
                  </td>
                </tr>
              ) : filteredHotspots.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No thermal observations matching current filters.
                  </td>
                </tr>
              ) : (
                filteredHotspots.map((h) => {
                  const probClass = h.classification?.probable_classification || 'Thermal Anomaly';
                  const conf = h.classification?.confidence_level || h.confidence || 'nominal';
                  const frpDisplay = h.frp != null ? `${h.frp.toFixed(1)} MW` : 'N/A';
                  const brightDisplay = h.brightness_ti4 != null ? `${h.brightness_ti4.toFixed(1)} K` : 'N/A';

                  return (
                    <tr
                      key={h.hotspot_id}
                      onClick={() => setSelectedHotspot(h)}
                      className="hover:bg-slate-800/60 cursor-pointer transition text-slate-300"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">{h.hotspot_id}</td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {h.acquisition_datetime ? new Date(h.acquisition_datetime).toUTCString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            h.satellite === 'NOAA-20'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          }`}
                        >
                          <Satellite className="w-3 h-3" />
                          <span>{h.satellite}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span
                          className={`${
                            (h.frp ?? 0) >= 20
                              ? 'text-red-400'
                              : (h.frp ?? 0) >= 10
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {frpDisplay}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{brightDisplay}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                            conf === 'high'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : conf === 'low'
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {conf}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-300 font-medium">{probClass}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHotspot(h);
                          }}
                          className="inline-flex items-center space-x-1 text-[11px] bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-semibold px-2.5 py-1 rounded transition"
                        >
                          <span>View Intelligence</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intelligence Drawer */}
      <HotspotDrawer hotspot={selectedHotspot} onClose={() => setSelectedHotspot(null)} />
    </div>
  );
};
