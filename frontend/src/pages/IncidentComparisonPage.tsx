import React, { useState, useEffect } from 'react';
import {
  Flame,
  ExternalLink,
  ArrowRightLeft
} from 'lucide-react';
import { apiService } from '../services/api';
import { Hotspot } from '../types';
import { HotspotDrawer } from '../components/Dashboard/HotspotDrawer';

export const IncidentComparisonPage: React.FC = () => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedId1, setSelectedId1] = useState<string>('');
  const [selectedId2, setSelectedId2] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [drawerHotspot, setDrawerHotspot] = useState<Hotspot | null>(null);

  useEffect(() => {
    const fetchHotspots = async () => {
      setLoading(true);
      try {
        const data = await apiService.getHotspots({ limit: 100 });
        setHotspots(data);
        if (data.length >= 2) {
          setSelectedId1(data[0].hotspot_id);
          setSelectedId2(data[1].hotspot_id);
        }
      } catch (err) {
        console.error('Failed to load hotspots for comparison:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotspots();
  }, []);

  const h1 = hotspots.find((h) => h.hotspot_id === selectedId1);
  const h2 = hotspots.find((h) => h.hotspot_id === selectedId2);

  const frp1 = h1?.frp ?? null;
  const frp2 = h2?.frp ?? null;
  const frp1Text = frp1 != null ? `${frp1.toFixed(1)} MW` : 'N/A';
  const frp2Text = frp2 != null ? `${frp2.toFixed(1)} MW` : 'N/A';
  const h1FrpHigher = frp1 != null && frp2 != null && frp1 > frp2;
  const h2FrpHigher = frp1 != null && frp2 != null && frp2 > frp1;

  const bright1 = h1?.brightness_ti4 != null ? `${h1.brightness_ti4.toFixed(1)} K` : 'N/A';
  const bright2 = h2?.brightness_ti4 != null ? `${h2.brightness_ti4.toFixed(1)} K` : 'N/A';

  const conf1 = h1?.classification?.confidence_level || h1?.confidence || 'N/A';
  const conf2 = h2?.classification?.confidence_level || h2?.confidence || 'N/A';

  return (
    <div className="p-6 space-y-6 w-full max-w-full text-slate-900 dark:text-slate-100 select-none bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span>↔ Incident Comparison Matrix</span>
            </h1>
            <span className="bg-amber-500/10 text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/30">
              Side-by-Side Analysis
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comparative evaluation of physical radiant attributes, satellite sensors, and spatial proximity across thermal events.
          </p>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm dark:shadow-none">
        <div>
          <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5" />
            <span>Select Observation A</span>
          </label>
          <select
            value={selectedId1}
            onChange={(e) => setSelectedId1(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
          >
            {hotspots.map((h) => {
              const fText = h.frp != null ? `${h.frp.toFixed(1)} MW` : 'N/A';
              return (
                <option key={h.hotspot_id} value={h.hotspot_id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                  {h.hotspot_id} | {h.satellite} | FRP: {fText} ({h.acquisition_datetime ? new Date(h.acquisition_datetime).toLocaleDateString() : 'N/A'})
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5" />
            <span>Select Observation B</span>
          </label>
          <select
            value={selectedId2}
            onChange={(e) => setSelectedId2(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            {hotspots.map((h) => {
              const fText = h.frp != null ? `${h.frp.toFixed(1)} MW` : 'N/A';
              return (
                <option key={h.hotspot_id} value={h.hotspot_id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                  {h.hotspot_id} | {h.satellite} | FRP: {fText} ({h.acquisition_datetime ? new Date(h.acquisition_datetime).toLocaleDateString() : 'N/A'})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      {h1 && h2 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-xl">
          <div className="p-4 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Analytical Metric</span>
            <div className="grid grid-cols-2 w-2/3 text-center">
              <span className="text-amber-600 dark:text-amber-400 font-mono">{h1.hotspot_id} (Observation A)</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-mono">{h2.hotspot_id} (Observation B)</span>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono">
            {/* Satellite */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400 font-sans font-medium w-1/3">Satellite Payload</span>
              <div className="grid grid-cols-2 w-2/3 text-center font-bold">
                <span className="text-slate-900 dark:text-slate-200">{h1.satellite}</span>
                <span className="text-slate-900 dark:text-slate-200">{h2.satellite}</span>
              </div>
            </div>

            {/* Acquisition Datetime */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400 font-sans font-medium w-1/3">Acquisition Datetime</span>
              <div className="grid grid-cols-2 w-2/3 text-center text-slate-700 dark:text-slate-300">
                <span>{h1.acquisition_datetime ? new Date(h1.acquisition_datetime).toUTCString() : 'N/A'}</span>
                <span>{h2.acquisition_datetime ? new Date(h2.acquisition_datetime).toUTCString() : 'N/A'}</span>
              </div>
            </div>

            {/* Coordinates */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400 font-sans font-medium w-1/3">Geospatial Coordinates</span>
              <div className="grid grid-cols-2 w-2/3 text-center text-slate-700 dark:text-slate-300">
                <span>{h1.latitude.toFixed(4)}, {h1.longitude.toFixed(4)}</span>
                <span>{h2.latitude.toFixed(4)}, {h2.longitude.toFixed(4)}</span>
              </div>
            </div>

            {/* FRP Power */}
            <div className="p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-slate-500 dark:text-slate-400 font-sans font-medium w-1/3">Fire Radiative Power (MW)</span>
              <div className="grid grid-cols-2 w-2/3 text-center font-bold text-sm">
                <span className={h1FrpHigher ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}>
                  {frp1Text} {h1FrpHigher ? '▲' : ''}
                </span>
                <span className={h2FrpHigher ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}>
                  {frp2Text} {h2FrpHigher ? '▲' : ''}
                </span>
              </div>
            </div>

            {/* Brightness Temp */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400 font-sans font-medium w-1/3">Brightness Temp (K)</span>
              <div className="grid grid-cols-2 w-2/3 text-center text-slate-700 dark:text-slate-300">
                <span>{bright1}</span>
                <span>{bright2}</span>
              </div>
            </div>

            {/* Confidence */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400 font-sans font-medium w-1/3">Detection Confidence</span>
              <div className="grid grid-cols-2 w-2/3 text-center">
                <span className="uppercase text-emerald-600 dark:text-emerald-400 font-bold">{conf1}</span>
                <span className="uppercase text-emerald-600 dark:text-emerald-400 font-bold">{conf2}</span>
              </div>
            </div>

            {/* Classification */}
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400 font-sans font-medium w-1/3">Probable Classification</span>
              <div className="grid grid-cols-2 w-2/3 text-center font-sans font-semibold text-slate-800 dark:text-slate-200">
                <span>{h1.classification?.probable_classification || 'Thermal Anomaly'}</span>
                <span>{h2.classification?.probable_classification || 'Thermal Anomaly'}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <span className="text-slate-500 dark:text-slate-400 font-sans font-medium w-1/3">Deep Evidence Inspection</span>
              <div className="grid grid-cols-2 w-2/3 text-center gap-4">
                <button
                  onClick={() => setDrawerHotspot(h1)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2 px-3 rounded-lg transition font-sans flex items-center justify-center space-x-1"
                >
                  <span>Inspect A</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDrawerHotspot(h2)}
                  className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs py-2 px-3 rounded-lg transition font-sans flex items-center justify-center space-x-1"
                >
                  <span>Inspect B</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm dark:shadow-none">
          {loading ? 'Loading comparison data...' : 'Select two observations above to compare.'}
        </div>
      )}

      {/* Intelligence Drawer */}
      <HotspotDrawer hotspot={drawerHotspot} onClose={() => setDrawerHotspot(null)} />
    </div>
  );
};
