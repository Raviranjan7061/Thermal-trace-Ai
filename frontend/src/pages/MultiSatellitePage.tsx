import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Layers,
  Flame,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { apiService } from '../services/api';
import { Hotspot, MultiSatelliteCorrelation } from '../types';
import { HotspotDrawer } from '../components/Dashboard/HotspotDrawer';

export const MultiSatellitePage: React.FC = () => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [correlationData, setCorrelationData] = useState<MultiSatelliteCorrelation | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerHotspot, setDrawerHotspot] = useState<Hotspot | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const data = await apiService.getHotspots({ limit: 50 });
        setHotspots(data);
        if (data.length > 0) {
          setSelectedHotspot(data[0]);
        }
      } catch (err) {
        console.error('Failed to load multi-satellite data:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedHotspot) {
      apiService
        .getMultiSatelliteCorrelation(selectedHotspot.hotspot_id)
        .then(setCorrelationData)
        .catch(console.error);
    }
  }, [selectedHotspot]);

  const hasCorrelation = (correlationData?.supporting_observations ?? 0) > 0;

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto custom-scrollbar p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <Satellite className="w-5 h-5 text-cyan-400" />
              <span>🛰 Multi-Satellite Intelligence</span>
            </h1>
            <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-cyan-500/30">
              NOAA-20 / NOAA-21 Cross-Verification
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Spatial-temporal correlation between dual VIIRS sensor payloads to verify persistent thermal anomalies and rule out transient artifacts.
          </p>
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 shrink-0">
          <Layers className="w-6 h-6" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="font-bold text-slate-200">How Multi-Satellite Correlation Works</div>
          <p className="text-slate-400">
            NOAA-20 and NOAA-21 orbit Earth in tandem, providing repeated observations over the same target site within adjacent orbital passes.
            When both sensor passes detect an anomaly at the same location, ThermalTrace calculates thermal persistence and upgrades anomaly confidence.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hotspot Selector List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col h-[520px]">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-2 shrink-0">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Select Thermal Observation</span>
          </h3>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {loading ? (
              <div className="text-xs text-slate-500 p-4 text-center">Loading observations...</div>
            ) : (
              hotspots.map((h) => {
                const isSelected = selectedHotspot?.hotspot_id === h.hotspot_id;
                const frpText = h.frp != null ? `${h.frp.toFixed(1)} MW` : 'N/A';
                return (
                  <button
                    key={h.hotspot_id}
                    onClick={() => setSelectedHotspot(h)}
                    className={`w-full text-left p-3 rounded-lg border transition text-xs flex flex-col space-y-1.5 ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span className={isSelected ? 'text-cyan-400' : 'text-slate-200'}>{h.hotspot_id}</span>
                      <span className="text-amber-400">{frpText}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{h.satellite}</span>
                      <span className="text-slate-500 font-mono">
                        {h.latitude.toFixed(3)}, {h.longitude.toFixed(3)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Multi-Satellite Correlation Details */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 flex flex-col justify-between">
          {selectedHotspot ? (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs text-slate-400 font-mono">Selected Target Anomaly</div>
                  <div className="text-lg font-bold font-mono text-slate-100">{selectedHotspot.hotspot_id}</div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full border ${
                      hasCorrelation
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {hasCorrelation
                        ? `CORRELATED OBSERVATIONS (${correlationData?.correlation_strength?.toUpperCase()} STRENGTH)`
                        : 'SINGLE PASS OBSERVATION'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Orbit Pass Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Pass */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b border-slate-800 pb-2">
                    <Satellite className="w-4 h-4" />
                    <span>Target Observation ({selectedHotspot.satellite})</span>
                  </div>

                  <div className="space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sensor Payload:</span>
                      <span>{selectedHotspot.instrument || 'VIIRS'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Acquisition:</span>
                      <span>
                        {selectedHotspot.acquisition_datetime
                          ? new Date(selectedHotspot.acquisition_datetime).toUTCString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coordinates:</span>
                      <span>{selectedHotspot.latitude.toFixed(4)}, {selectedHotspot.longitude.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fire Radiative Power:</span>
                      <span className="text-red-400 font-bold">
                        {selectedHotspot.frp != null ? `${selectedHotspot.frp.toFixed(1)} MW` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Brightness Temp:</span>
                      <span>
                        {selectedHotspot.brightness_ti4 != null ? `${selectedHotspot.brightness_ti4.toFixed(1)} K` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Correlated Passes */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold border-b border-slate-800 pb-2">
                    <Satellite className="w-4 h-4" />
                    <span>Correlated Orbital Observations ({correlationData?.supporting_observations ?? 0})</span>
                  </div>

                  {hasCorrelation && correlationData?.correlated_observations ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {correlationData.correlated_observations.map((obs) => (
                        <div key={obs.hotspot_id} className="p-2 bg-slate-900 rounded border border-slate-800 space-y-1">
                          <div className="flex justify-between text-indigo-400 font-bold">
                            <span>{obs.hotspot_id}</span>
                            <span>{obs.satellite}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Offset: {obs.distance_km.toFixed(2)} km</span>
                            <span className="text-red-400 font-bold">
                              {obs.frp != null ? `${obs.frp.toFixed(1)} MW` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-500">
                      No supporting multi-satellite observation was found for this event in the 12-hour spatial window.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setDrawerHotspot(selectedHotspot)}
                  className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg transition"
                >
                  <span>Open Full Incident Evidence Drawer</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Select an observation from the left panel to inspect dual-satellite correlation details.
            </div>
          )}
        </div>
      </div>

      {/* Intelligence Drawer */}
      <HotspotDrawer hotspot={drawerHotspot} onClose={() => setDrawerHotspot(null)} />
    </div>
  );
};
