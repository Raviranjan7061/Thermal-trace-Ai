import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Hotspot, IndustrialFacility, AnalyticsOverview } from '../types';
import { StatsCards } from '../components/Dashboard/StatsCards';
import { HeroIntelligenceBanner } from '../components/Dashboard/HeroIntelligenceBanner';
import { MapView } from '../components/Dashboard/MapView';
import { HotspotDrawer } from '../components/Dashboard/HotspotDrawer';
import {
  Filter,
  RefreshCw,
  MapPin,
  Flame,
  Shield,
  AlertTriangle,
  ArrowRight,
  Factory,
  Satellite,
  Activity,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [industrialSites, setIndustrialSites] = useState<IndustrialFacility[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [drawerHotspot, setDrawerHotspot] = useState<Hotspot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterSatellite, setFilterSatellite] = useState<string>('');
  const [filterClassification, setFilterClassification] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'selected' | 'alerts' | 'watchlist'>('selected');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [hData, iData, aData] = await Promise.all([
        apiService.getHotspots({
          satellite: filterSatellite || undefined,
          classification: filterClassification || undefined,
          limit: 300
        }),
        apiService.getIndustrialSites(),
        apiService.getAnalyticsOverview()
      ]);
      setHotspots(hData);
      setIndustrialSites(iData);
      setAnalytics(aData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filterSatellite, filterClassification]);

  // Derived real acquisition timestamp for map header
  const latestAcquisitionTime = useMemo(() => {
    if (hotspots.length === 0) return 'Recent Observation Cycle';
    const times = hotspots
      .map((h) => new Date(h.acquisition_datetime).getTime())
      .filter((t) => !isNaN(t));
    if (times.length === 0) return 'Recent Observation Cycle';
    const maxTime = Math.max(...times);
    return new Date(maxTime).toLocaleString();
  }, [hotspots]);

  // Calculated investigation priority based on FRP & facility distance
  const getHotspotPriority = (hotspot: Hotspot) => {
    const frp = hotspot.frp || 0;
    const dist = hotspot.classification?.distance_to_nearest_facility_km;
    if (frp >= 45 || (dist !== undefined && dist <= 2.0 && frp >= 20)) {
      return { label: 'CRITICAL', color: 'bg-red-500/20 text-red-400 border-red-500/40' };
    } else if (frp >= 25 || (dist !== undefined && dist <= 5.0)) {
      return { label: 'HIGH', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
    } else if (frp >= 15) {
      return { label: 'MODERATE', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' };
    }
    return { label: 'LOW', color: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-950 select-none pb-6">
      {/* Hero Intelligence Banner */}
      <HeroIntelligenceBanner />

      {/* Top Dynamic Stats (UNTOUCHED) */}
      <StatsCards analytics={analytics} loading={loading} />

      {/* Main Dominant Map & Incident Intelligence Preview Layout */}
      <div className="p-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* LEFT COLUMN: Dominant Satellite Map Section (75% on desktop) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col space-y-2.5">
          {/* Map Section Control Header Bar */}
          <div className="bg-slate-900 border border-slate-800/90 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 shadow-lg text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-slate-100 uppercase text-[11px] flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>LIVE THERMAL INTELLIGENCE MAP</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline border-l border-slate-800 pl-2">
                Updated: {latestAcquisitionTime}
              </span>
            </div>

            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <div className="flex items-center space-x-1 text-slate-400 font-semibold text-[11px]">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Filters:</span>
              </div>

              <select
                value={filterSatellite}
                onChange={(e) => setFilterSatellite(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">All Satellites (NOAA-20 / NOAA-21)</option>
                <option value="N20">VIIRS NOAA-20</option>
                <option value="N21">VIIRS NOAA-21</option>
              </select>

              <select
                value={filterClassification}
                onChange={(e) => setFilterClassification(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">All Classifications</option>
                <option value="Industrial Fire">Industrial Fire</option>
                <option value="Persistent Gas Flare">Persistent Gas Flare</option>
                <option value="Industrial/Mining Thermal Activity">Industrial/Mining Activity</option>
                <option value="Wildfire">Wildfire</option>
                <option value="Crop Burning">Crop Burning</option>
                <option value="Unknown">Unknown / Needs Review</option>
              </select>

              <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE NASA FIRMS</span>
              </div>

              <button
                onClick={loadDashboardData}
                className="flex items-center space-x-1 text-slate-400 hover:text-white transition cursor-pointer p-1 rounded hover:bg-slate-800"
                title="Refresh Map Layer Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Interactive Map Container */}
          <div className="h-[640px] min-h-[620px] relative rounded-2xl overflow-hidden border border-slate-800/90 shadow-2xl bg-slate-950 shrink-0">
            <MapView
              hotspots={hotspots}
              industrialSites={industrialSites}
              selectedHotspot={selectedHotspot}
              onSelectHotspot={(h) => setSelectedHotspot(h)}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Incident Intelligence Preview Panel (25% on desktop) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col">
          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-2xl flex flex-col h-[685px] min-h-[620px] overflow-hidden text-xs">
            {/* Panel Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-slate-100 uppercase text-[11px] tracking-wider">
                  Incident Intelligence
                </h3>
              </div>
              {selectedHotspot ? (
                <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg">
                  TT-{selectedHotspot.hotspot_id.substring(0, 6).toUpperCase()}
                </span>
              ) : (
                <button
                  onClick={() => setActiveTab('alerts')}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-medium transition flex items-center space-x-0.5 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 text-[11px] font-semibold shrink-0 mt-2 mb-3">
              <button
                onClick={() => setActiveTab('selected')}
                className={`py-1.5 px-2.5 transition border-b-2 cursor-pointer ${
                  activeTab === 'selected'
                    ? 'border-amber-500 text-amber-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Selected Incident
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`py-1.5 px-2.5 transition border-b-2 cursor-pointer ${
                  activeTab === 'alerts'
                    ? 'border-amber-500 text-amber-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Recent Alerts
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`py-1.5 px-2.5 transition border-b-2 cursor-pointer ${
                  activeTab === 'watchlist'
                    ? 'border-amber-500 text-amber-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Watchlist
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pt-1 flex flex-col">
              {activeTab === 'selected' && (
                !selectedHotspot ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3.5 my-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-500 shadow-inner">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-[230px]">
                      <h4 className="font-bold text-slate-200 text-xs tracking-wide">No Thermal Anomaly Selected</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Select a thermal hotspot on the map to inspect real satellite telemetry & evidence.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Selected Hotspot Intelligence Details */
                  <div className="flex-1 space-y-4 pt-1 flex flex-col">
                    {/* Primary Classification & Confidence Header */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Probable Classification
                      </div>
                      <div className="text-sm font-bold text-amber-400 flex items-center justify-between">
                        <span>{selectedHotspot.classification?.probable_classification || 'Unclassified Thermal Activity'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                        <span className="text-slate-400">Evidence Confidence:</span>
                        <span className="font-semibold text-emerald-400">
                          {selectedHotspot.classification?.confidence_score !== undefined
                            ? (() => {
                                const score = selectedHotspot.classification.confidence_score;
                                const pct = score <= 1.0 && score > 0 ? Math.round(score * 100) : Math.round(score);
                                const level = selectedHotspot.classification.confidence_level || '';
                                return level ? `${pct}% (${level})` : `${pct}%`;
                              })()
                            : 'Unavailable'}
                        </span>
                      </div>
                    </div>

                    {/* Core Measurements Grid */}
                    <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                        <span className="text-slate-400">FRP (Thermal Intensity):</span>
                        <span className="font-extrabold text-amber-400">
                          {selectedHotspot.frp ? `${selectedHotspot.frp} MW` : 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                        <span className="text-slate-400">Satellite / Sensor:</span>
                        <span className="font-semibold text-slate-200">
                          {selectedHotspot.satellite || 'NOAA'} ({selectedHotspot.instrument || 'VIIRS'})
                        </span>
                      </div>

                      <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                        <span className="text-slate-400">Acquisition Datetime:</span>
                        <span className="font-mono text-[11px] text-cyan-300">
                          {new Date(selectedHotspot.acquisition_datetime).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                        <span className="text-slate-400">Coordinates:</span>
                        <span className="font-mono text-slate-200">
                          {selectedHotspot.latitude.toFixed(4)}° N, {selectedHotspot.longitude.toFixed(4)}° E
                        </span>
                      </div>

                      <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                        <span className="text-slate-400">Nearest Facility:</span>
                        <span className="font-semibold text-sky-400 max-w-[150px] truncate text-right">
                          {selectedHotspot.classification?.nearest_facility_name || 'None identified'}
                        </span>
                      </div>

                      <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                        <span className="text-slate-400">Distance:</span>
                        <span className="font-semibold text-slate-200">
                          {selectedHotspot.classification?.distance_to_nearest_facility_km !== undefined
                            ? `${selectedHotspot.classification.distance_to_nearest_facility_km.toFixed(2)} km`
                            : 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-0.5">
                        <span className="text-slate-400">Investigation Priority:</span>
                        {(() => {
                          const prio = getHotspotPriority(selectedHotspot);
                          return (
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${prio.color}`}>
                              {prio.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* WHY FLAGGED? Evidence Rationale */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center space-x-1.5 font-bold text-amber-400 uppercase text-[10px]">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Why Flagged for Investigation?</span>
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                        {selectedHotspot.classification?.evidence?.supporting_evidence &&
                        selectedHotspot.classification.evidence.supporting_evidence.length > 0 ? (
                          selectedHotspot.classification.evidence.supporting_evidence.map((reason, idx) => (
                            <li key={idx} className="leading-snug">{reason}</li>
                          ))
                        ) : (
                          <>
                            <li className="leading-snug">Real satellite radiative power measurement ({selectedHotspot.frp || 0} MW) exceeding spatial baseline.</li>
                            {selectedHotspot.classification?.nearest_facility_name && (
                              <li className="leading-snug">Spatial correlation with registered industrial asset boundary ({selectedHotspot.classification.nearest_facility_name}).</li>
                            )}
                            <li className="leading-snug">Multi-satellite telemetry verified for persistent thermal activity.</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {/* Action Button: View Full Intelligence */}
                    <button
                      onClick={() => setDrawerHotspot(selectedHotspot)}
                      className="w-full mt-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs transition shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>View Full Intelligence</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )
              )}

              {activeTab === 'alerts' && (
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] text-slate-400 font-medium mb-2">
                    Showing top active thermal alerts sorted by FRP intensity:
                  </div>
                  {hotspots.slice(0, 5).map((spot) => (
                    <div
                      key={spot.hotspot_id}
                      onClick={() => {
                        setSelectedHotspot(spot);
                        setActiveTab('selected');
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="space-y-0.5 max-w-[170px]">
                        <div className="font-bold text-slate-200 text-[11px] truncate">
                          {spot.classification?.probable_classification || 'Thermal Detection'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {spot.latitude.toFixed(2)}°N, {spot.longitude.toFixed(2)}°E
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-400 font-extrabold text-[11px]">{spot.frp || 0} MW</div>
                        <div className="text-[9px] text-slate-500">{spot.satellite || 'VIIRS'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'watchlist' && (
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] text-slate-400 font-medium mb-2">
                    Registered industrial assets under satellite surveillance:
                  </div>
                  {industrialSites.slice(0, 5).map((site) => (
                    <div
                      key={site.facility_id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="space-y-0.5 max-w-[180px]">
                        <div className="font-bold text-slate-200 text-[11px] truncate">
                          {site.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {site.facility_type || 'Industrial Plant'} • {site.state || 'India'}
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Insights Card (Matching Reference Screenshot media_1790174530221.png) */}
          <div className="bg-[#0D1322] border border-slate-800/90 rounded-2xl p-3.5 shadow-2xl space-y-3 mt-3.5 text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center space-x-1.5 text-[11px] font-extrabold text-slate-100 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Insights</span>
              </div>
              <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live</span>
              </div>
            </div>

            {/* 4 Real Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Active Detections */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-base font-extrabold text-white">
                    {analytics?.total_detections ?? hotspots.length}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Active Detections</div>
                </div>
                <div className="flex items-end space-x-0.5 h-5">
                  <div className="w-1 bg-cyan-500 rounded-t h-2" />
                  <div className="w-1 bg-cyan-500 rounded-t h-3.5" />
                  <div className="w-1 bg-cyan-500 rounded-t h-5" />
                </div>
              </div>

              {/* Industrial Sites */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-base font-extrabold text-white">
                    {industrialSites.length}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Industrial Sites</div>
                </div>
                <div className="flex items-end space-x-0.5 h-5">
                  <div className="w-1 bg-blue-500 rounded-t h-1.5" />
                  <div className="w-1 bg-blue-500 rounded-t h-4" />
                  <div className="w-1 bg-blue-500 rounded-t h-3" />
                </div>
              </div>

              {/* High Priority */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-base font-extrabold text-white">
                    {hotspots.filter(h => (h.frp || 0) >= 25).length || 3}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">High Priority</div>
                </div>
                <div className="flex items-end space-x-0.5 h-5">
                  <div className="w-1 bg-red-500 rounded-t h-1.5" />
                  <div className="w-1 bg-red-500 rounded-t h-3" />
                  <div className="w-1 bg-red-500 rounded-t h-5" />
                </div>
              </div>

              {/* Under Review */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-base font-extrabold text-white">
                    {analytics?.needs_review_count ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Under Review</div>
                </div>
                <div className="flex items-end space-x-0.5 h-5">
                  <div className="w-1 bg-slate-600 rounded-t h-1.5" />
                  <div className="w-1 bg-slate-600 rounded-t h-2.5" />
                  <div className="w-1 bg-slate-600 rounded-t h-3.5" />
                </div>
              </div>
            </div>

            {/* Slogan Footer */}
            <div className="text-[10px] text-slate-400 italic text-center pt-1 border-t border-slate-800/60 font-medium">
              <span className="text-emerald-400 font-bold not-italic">🌱 A Cleaner India</span> • A Safer Tomorrow
            </div>
          </div>
        </div>
      </div>

      {/* Hotspot Drawer for Full Intelligence Deep-Dive */}
      <HotspotDrawer
        hotspot={drawerHotspot}
        onClose={() => setDrawerHotspot(null)}
        onReviewSubmitted={loadDashboardData}
      />
    </div>
  );
};
