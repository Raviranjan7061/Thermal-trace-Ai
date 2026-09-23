import React, { useState, useEffect } from 'react';
import { BarChart3, Shield, Satellite, Flame } from 'lucide-react';
import { apiService } from '../../services/api';
import refineryBg from '../../assets/refinery_hero_bg.jpg';

export const RefineryHeroVisual: React.FC = () => {
  const [firmsCount, setFirmsCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTelemetry = async () => {
      try {
        const [analytics, hotspots] = await Promise.all([
          apiService.getAnalyticsOverview().catch(() => null),
          apiService.getHotspots({ limit: 300 }).catch(() => [])
        ]);

        if (isMounted) {
          const obsCount = analytics?.total_detections || analytics?.data_freshness?.total_db_records || (Array.isArray(hotspots) ? hotspots.length : 0);
          setFirmsCount(obsCount || 138);
        }
      } catch (err) {
        console.warn('Could not fetch real FIRMS metrics for landing visual:', err);
      }
    };

    fetchTelemetry();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full shrink-0 space-y-2">
      {/* 3 Quick Features Strip */}
      <div className="grid grid-cols-3 gap-3 text-xs text-slate-700 font-semibold">
        <div className="flex items-center space-x-2 bg-white/70 border border-slate-200/70 p-2 rounded-xl backdrop-blur-sm shadow-2xs">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Satellite className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-xs leading-none">NASA FIRMS</span>
            <span className="text-[10px] text-slate-500 leading-none">Real satellite data</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-white/70 border border-slate-200/70 p-2 rounded-xl backdrop-blur-sm shadow-2xs">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-xs leading-none">Live Monitoring</span>
            <span className="text-[10px] text-slate-500 leading-none">Thermal insights</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-white/70 border border-slate-200/70 p-2 rounded-xl backdrop-blur-sm shadow-2xs">
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-xs leading-none">Safer Tomorrow</span>
            <span className="text-[10px] text-slate-500 leading-none">Cleaner & greener India</span>
          </div>
        </div>
      </div>

      {/* Industrial Hero Canvas */}
      <div className="relative w-full h-[clamp(160px,25vh,280px)] rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 select-none">
        {/* Background Image */}
        <img
          src={refineryBg}
          alt="Industrial Satellite Thermal Surveillance"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Soft Sky Atmospheric Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Satellite Graphic (Top Center-Right) */}
        <div className="absolute top-2 right-12 z-20 flex flex-col items-end pointer-events-none">
          <div className="relative text-cyan-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]">
            <svg
              className="w-12 h-12 sm:w-14 sm:h-14 transform -rotate-12 text-blue-400 animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="1" y="7" width="6" height="10" rx="1" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
              <rect x="17" y="7" width="6" height="10" rx="1" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
              <rect x="8" y="8" width="8" height="8" rx="1.5" fill="#0284c7" stroke="#93c5fd" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="2" fill="#f97316" />
              <path d="M12 16v4m-3 2h6" stroke="#94a3b8" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Translucent Orange Scanning Beam Overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-50"
          preserveAspectRatio="none"
          viewBox="0 0 800 500"
        >
          <defs>
            <linearGradient id="refineryBeam" x1="75%" y1="5%" x2="45%" y2="85%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#fb923c" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points="580,30 240,420 420,480" fill="url(#refineryBeam)" />
        </svg>

        {/* Callout Badge 1: Real-time Intelligence */}
        <div className="absolute top-4 right-28 z-20 hidden sm:flex items-center space-x-2 bg-white/90 border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md text-xs">
          <div className="p-1 bg-blue-500/10 text-blue-600 rounded-md">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800 text-[11px] leading-tight">
            Real-time Intelligence<br />
            <span className="font-normal text-slate-500">for a Safer India</span>
          </span>
        </div>

        {/* Callout Badge 2: Detecting Thermal Anomalies */}
        <div className="absolute top-[40%] right-[32%] z-20 flex items-center space-x-2 bg-white/90 border border-amber-500/50 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md text-xs">
          <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping shrink-0" />
          <span className="font-bold text-slate-800 text-[11px]">
            Detecting Thermal Anomalies from Space
          </span>
        </div>
      </div>
    </div>
  );
};
