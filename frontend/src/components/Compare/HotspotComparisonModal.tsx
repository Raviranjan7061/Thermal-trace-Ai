import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Flame, Factory, MapPin, Clock, ShieldCheck, Activity } from 'lucide-react';
import { apiService } from '../../services/api';
import { Hotspot } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availableHotspots: Hotspot[];
}

export const HotspotComparisonModal: React.FC<Props> = ({ isOpen, onClose, availableHotspots }) => {
  const [id1, setId1] = useState('');
  const [id2, setId2] = useState('');
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (availableHotspots.length >= 2) {
      setId1(availableHotspots[0].hotspot_id);
      setId2(availableHotspots[1].hotspot_id);
    } else if (availableHotspots.length === 1) {
      setId1(availableHotspots[0].hotspot_id);
    }
  }, [availableHotspots]);

  if (!isOpen) return null;

  const handleCompare = async () => {
    if (!id1 || !id2 || id1 === id2) return;
    setLoading(true);
    try {
      const data = await apiService.compareHotspots(id1, id2);
      setComparisonData(data);
    } catch (err) {
      console.error('Hotspot comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[650] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-white">Comparative Thermal Incident Analysis Tool</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Primary Event 1</label>
            <select
              value={id1}
              onChange={(e) => setId1(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-amber-500"
            >
              {availableHotspots.map((h) => (
                <option key={h.hotspot_id} value={h.hotspot_id}>
                  {h.hotspot_id.substring(0, 12)}... ({h.satellite}, FRP: {h.frp || 0} MW)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Comparative Event 2</label>
            <select
              value={id2}
              onChange={(e) => setId2(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-amber-500"
            >
              {availableHotspots.map((h) => (
                <option key={h.hotspot_id} value={h.hotspot_id}>
                  {h.hotspot_id.substring(0, 12)}... ({h.satellite}, FRP: {h.frp || 0} MW)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-3 bg-slate-950 text-center border-b border-slate-800 flex items-center justify-between px-6">
          <span className="text-xs text-slate-400">
            {comparisonData
              ? `Spatial Separation: ${comparisonData.spatial_separation_km} km | Time Delta: ${comparisonData.temporal_difference_hours} hrs`
              : 'Select two thermal events to compute comparative metrics.'}
          </span>
          <button
            onClick={handleCompare}
            disabled={!id1 || !id2 || id1 === id2 || loading}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-1.5 px-6 rounded-lg text-xs transition disabled:opacity-50"
          >
            {loading ? 'Comparing...' : 'Run Side-by-Side Comparison'}
          </button>
        </div>

        {/* Comparison Data Grid */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar text-xs">
          {comparisonData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event 1 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-amber-400 text-sm">Event 1 Details</h3>
                  <span className="font-mono text-[10px] text-slate-400">{comparisonData.event_1.hotspot_id.substring(0, 14)}...</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Satellite / Instrument</span>
                    <span className="font-semibold text-slate-200">
                      {comparisonData.event_1.satellite} ({comparisonData.event_1.instrument})
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Acquisition Time</span>
                    <span className="text-slate-200">{new Date(comparisonData.event_1.acquisition_datetime).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Classification</span>
                    <span className="font-bold text-white">{comparisonData.event_1.probable_classification}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Confidence Score</span>
                    <span className="font-bold text-amber-400">
                      {Math.round((comparisonData.event_1.confidence_score || 0) * 100)}% ({comparisonData.event_1.confidence_level})
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">FRP (MW) / Ti4 (K)</span>
                    <span className="font-bold text-amber-400">
                      {comparisonData.event_1.frp || 0} MW / {comparisonData.event_1.brightness_ti4 || 0} K
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Nearest Infrastructure</span>
                    <span className="text-slate-200">{comparisonData.event_1.nearest_facility}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Proximity Distance</span>
                    <span className="text-amber-400 font-semibold">
                      {comparisonData.event_1.distance_km !== null ? `${comparisonData.event_1.distance_km.toFixed(2)} km` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Land Cover Context</span>
                    <span className="text-slate-200 uppercase">{comparisonData.event_1.land_cover}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Persistence (30-Day Detections)</span>
                    <span className="text-slate-200 font-semibold">
                      {comparisonData.event_1.detection_count_30d || 1} detections (Score: {comparisonData.event_1.persistence_score?.toFixed(2) || '0.00'})
                    </span>
                  </div>
                </div>

                {/* Supporting Evidence */}
                {comparisonData.event_1.supporting_evidence?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Supporting Evidence:</span>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {comparisonData.event_1.supporting_evidence.map((ev: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Event 2 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-amber-400 text-sm">Event 2 Details</h3>
                  <span className="font-mono text-[10px] text-slate-400">{comparisonData.event_2.hotspot_id.substring(0, 14)}...</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Satellite / Instrument</span>
                    <span className="font-semibold text-slate-200">
                      {comparisonData.event_2.satellite} ({comparisonData.event_2.instrument})
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Acquisition Time</span>
                    <span className="text-slate-200">{new Date(comparisonData.event_2.acquisition_datetime).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Classification</span>
                    <span className="font-bold text-white">{comparisonData.event_2.probable_classification}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Confidence Score</span>
                    <span className="font-bold text-amber-400">
                      {Math.round((comparisonData.event_2.confidence_score || 0) * 100)}% ({comparisonData.event_2.confidence_level})
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">FRP (MW) / Ti4 (K)</span>
                    <span className="font-bold text-amber-400">
                      {comparisonData.event_2.frp || 0} MW / {comparisonData.event_2.brightness_ti4 || 0} K
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Nearest Infrastructure</span>
                    <span className="text-slate-200">{comparisonData.event_2.nearest_facility}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Proximity Distance</span>
                    <span className="text-amber-400 font-semibold">
                      {comparisonData.event_2.distance_km !== null ? `${comparisonData.event_2.distance_km.toFixed(2)} km` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Land Cover Context</span>
                    <span className="text-slate-200 uppercase">{comparisonData.event_2.land_cover}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Persistence (30-Day Detections)</span>
                    <span className="text-slate-200 font-semibold">
                      {comparisonData.event_2.detection_count_30d || 1} detections (Score: {comparisonData.event_2.persistence_score?.toFixed(2) || '0.00'})
                    </span>
                  </div>
                </div>

                {/* Supporting Evidence */}
                {comparisonData.event_2.supporting_evidence?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Supporting Evidence:</span>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {comparisonData.event_2.supporting_evidence.map((ev: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Select two thermal observations above to run side-by-side comparative analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
