import React from 'react';

export const SimpleSatelliteVisual: React.FC = () => {
  return (
    <div className="relative w-full h-[clamp(140px,22vh,220px)] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg flex items-center justify-center select-none">
      {/* Subtle Starfield & Grid Pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="0 0 600 240">
        <defs>
          <pattern id="simpleGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#334155" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#simpleGrid)" />
      </svg>

      {/* Atmospheric Orbit Curve */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none text-blue-500/20" viewBox="0 0 600 240">
        <path d="M -50 200 C 150 100, 450 80, 650 180" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>

      {/* Satellite Icon (Top Left) */}
      <div className="absolute top-4 left-8 z-20 flex items-center space-x-3 pointer-events-none">
        <div className="relative text-cyan-400 p-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl shadow-lg backdrop-blur-md">
          <svg
            className="w-10 h-10 transform -rotate-12 text-cyan-400 animate-pulse"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="8" width="5" height="8" rx="1" fill="#1e3a8a" stroke="#60a5fa" />
            <rect x="17" y="8" width="5" height="8" rx="1" fill="#1e3a8a" stroke="#60a5fa" />
            <rect x="8" y="9" width="8" height="6" rx="1" fill="#0284c7" stroke="#93c5fd" />
            <circle cx="12" cy="12" r="1.5" fill="#f97316" />
            <path d="M12 15v3m-2 2h4" stroke="#94a3b8" />
          </svg>
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 block uppercase">
            NOAA-20 / NOAA-21
          </span>
          <span className="text-xs font-bold text-slate-100 block">
            VIIRS Thermal Sensing
          </span>
        </div>
      </div>

      {/* Translucent Orange Scanning Cone Beam */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-50" viewBox="0 0 600 240">
        <defs>
          <linearGradient id="vectorBeam" x1="15%" y1="20%" x2="70%" y2="80%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#fb923c" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points="65,35 340,195 480,215" fill="url(#vectorBeam)" />
      </svg>

      {/* Clean Industrial Facility Vector Silhouette (Bottom Center/Right) */}
      <div className="absolute bottom-0 right-12 z-10 text-slate-700/80 pointer-events-none flex items-end space-x-4">
        {/* Flare Stacks & Refinery Towers Vector */}
        <svg className="w-64 h-28 text-slate-600/90" viewBox="0 0 240 100" fill="none" stroke="currentColor">
          {/* Cooling Tower */}
          <path d="M 170 100 C 175 70, 180 40, 172 20 L 198 20 C 190 40, 195 70, 200 100 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* Stacks */}
          <rect x="50" y="25" width="8" height="75" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <rect x="90" y="10" width="10" height="90" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <rect x="130" y="35" width="8" height="65" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          {/* Flare Flame Dot */}
          <circle cx="95" cy="8" r="4" fill="#f97316" className="animate-ping" />
          <circle cx="95" cy="8" r="2.5" fill="#ef4444" />
        </svg>
      </div>

      {/* Target Anomaly Overlay Badge */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center space-x-2 bg-slate-900/90 border border-amber-500/50 px-3 py-1.5 rounded-full shadow-lg text-xs backdrop-blur-md">
        <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping"></span>
        <span className="text-[11px] font-bold text-amber-400">
          Detecting Industrial Thermal Anomalies
        </span>
      </div>
    </div>
  );
};
