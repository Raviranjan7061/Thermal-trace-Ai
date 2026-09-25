import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Activity,
  ExternalLink
} from 'lucide-react';
import { apiService } from '../services/api';
import { Hotspot, HotspotReplayItem } from '../types';
import { MapView } from '../components/Dashboard/MapView';
import { HotspotDrawer } from '../components/Dashboard/HotspotDrawer';

export const ThermalReplayPage: React.FC = () => {
  const [replayData, setReplayData] = useState<HotspotReplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    const fetchReplay = async () => {
      setLoading(true);
      try {
        const data = await apiService.getHotspotReplayData();
        setReplayData(data);
      } catch (err) {
        console.error('Failed to load replay data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReplay();
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(100, 1000 / speed);
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= replayData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, replayData.length]);

  const activeReplayItem = replayData[currentIndex];

  const adaptReplayItemToHotspot = (item: HotspotReplayItem): Hotspot => ({
    hotspot_id: item.hotspot_id,
    source: 'NASA_FIRMS',
    source_dataset: 'VIIRS_NRT',
    latitude: item.latitude,
    longitude: item.longitude,
    acquisition_datetime: item.acquisition_datetime,
    satellite: item.satellite,
    instrument: 'VIIRS',
    frp: item.frp,
    cluster_id: item.cluster_id,
    deduplication_hash: item.hotspot_id,
    created_at: item.acquisition_datetime,
    classification: {
      classification_id: `cls_${item.hotspot_id}`,
      hotspot_id: item.hotspot_id,
      probable_classification: item.probable_classification || 'Thermal Anomaly',
      confidence_score: 0.9,
      confidence_level: 'nominal',
      classification_mode: 'Replay Telemetry',
      facilities_within_1km: 0,
      facilities_within_5km: 0,
      facilities_within_10km: 0,
      created_at: item.acquisition_datetime
    }
  });

  const currentHotspots: Hotspot[] = replayData.slice(0, currentIndex + 1).map(adaptReplayItemToHotspot);

  const activeHotspot: Hotspot | null = activeReplayItem ? adaptReplayItemToHotspot(activeReplayItem) : null;

  const handleInspectActiveHotspot = async () => {
    if (!activeReplayItem) return;
    try {
      const h = await apiService.getHotspotById(activeReplayItem.hotspot_id);
      setSelectedHotspot(h);
    } catch {
      setSelectedHotspot(activeHotspot);
    }
  };

  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsPlaying(false);
    setSpeed(1);
    setCurrentIndex(0);
    setSelectedHotspot(null);
  };

  return (
    <div className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto transition-colors duration-200">
      {/* Top Controls Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span>⏱ Historical Thermal Replay</span>
            </h1>
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/30">
              Time-Lapse Animation
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sequential spatial timeline playback of satellite thermal detections.
          </p>
        </div>

        {/* Playback controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={replayData.length === 0}
            className={`flex items-center space-x-2 font-bold text-xs px-4 py-2 rounded-lg transition ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause Replay' : 'Play Timeline'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition text-xs flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reset</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center space-x-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded ${
                  speed === s
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center space-x-4">
        <span className="text-xs font-mono text-amber-400 font-bold shrink-0">
          Step {currentIndex + 1} / {replayData.length}
        </span>

        <input
          type="range"
          min={0}
          max={Math.max(0, replayData.length - 1)}
          value={currentIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentIndex(Number(e.target.value));
          }}
          className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />

        <div className="text-xs font-mono text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded">
          {activeReplayItem?.acquisition_datetime
            ? new Date(activeReplayItem.acquisition_datetime).toUTCString()
            : 'Acquisition Time'}
        </div>
      </div>

      {/* Map & Detail Split View */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[550px]">
        {/* Main Map Component */}
        <div className="flex-1 relative">
          <MapView
            hotspots={currentHotspots}
            industrialSites={[]}
            selectedHotspot={activeHotspot}
            onSelectHotspot={(h) => setSelectedHotspot(h)}
          />
        </div>

        {/* Replay Frame Inspector Sidebar */}
        <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-4 space-y-4 overflow-y-auto custom-scrollbar shadow-md dark:shadow-none">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Active Frame Telemetry</span>
          </h3>

          {activeReplayItem ? (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 font-mono">
                <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                  <span className="text-slate-500 dark:text-slate-500">Telemetry ID:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{activeReplayItem.hotspot_id}</span>
                </div>
                <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                  <span className="text-slate-500 dark:text-slate-500">Acquisition:</span>
                  <span>
                    {activeReplayItem.acquisition_datetime
                      ? new Date(activeReplayItem.acquisition_datetime).toUTCString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                  <span className="text-slate-500 dark:text-slate-500">Satellite:</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">{activeReplayItem.satellite}</span>
                </div>
                <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                  <span className="text-slate-500 dark:text-slate-500">Coordinates:</span>
                  <span>{activeReplayItem.latitude.toFixed(4)}, {activeReplayItem.longitude.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                  <span className="text-slate-500 dark:text-slate-500">FRP Energy:</span>
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    {activeReplayItem.frp != null ? `${activeReplayItem.frp.toFixed(1)} MW` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                  <span className="text-slate-500 dark:text-slate-500">Classification:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-semibold">
                    {activeReplayItem.probable_classification || 'Thermal Anomaly'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleInspectActiveHotspot}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-3 rounded-lg transition flex items-center justify-center space-x-2"
              >
                <span>Inspect Full Evidence</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-500 p-4 text-center">Loading replay step...</div>
          )}

          {/* Accumulation Summary */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="text-slate-500 dark:text-slate-400 font-medium">Replay Progress Stats</div>
            <div className="flex justify-between text-slate-800 dark:text-slate-300 font-mono text-[11px]">
              <span>Illuminated Hotspots:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{currentHotspots.length}</span>
            </div>
            <div className="flex justify-between text-slate-800 dark:text-slate-300 font-mono text-[11px]">
              <span>Cumulative FRP Sum:</span>
              <span className="text-red-600 dark:text-red-400 font-bold">
                {currentHotspots
                  .reduce((acc, h) => acc + (h.frp ?? 0), 0)
                  .toFixed(1)} MW
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Drawer */}
      <HotspotDrawer hotspot={selectedHotspot} onClose={() => setSelectedHotspot(null)} />
    </div>
  );
};
