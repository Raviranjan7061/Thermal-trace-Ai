import React, { useState, useEffect } from 'react';
import { Radio, Flame, Cpu, Database, X, CheckCircle2 } from 'lucide-react';
import { apiService } from '../../services/api';
import { SystemHealth } from '../../types';

export const LandingNavbar: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [activeModal, setActiveModal] = useState<'about' | 'features' | 'datasources' | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const data = await apiService.getSystemHealth();
        if (isMounted) setHealth(data);
      } catch (err) {
        console.warn('System health status endpoint check:', err);
      }
    };
    fetchHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  const isSystemLive = Boolean(
    health &&
      (health.status?.toLowerCase() === 'healthy' ||
        health.status?.toLowerCase() === 'ok' ||
        health.status?.toLowerCase() === 'operational' ||
        health.database?.status?.toLowerCase() === 'healthy' ||
        health.database?.status?.toLowerCase() === 'connected')
  );

  return (
    <>
      <header className="w-full h-[7vh] max-h-[60px] min-h-[48px] px-6 xl:px-10 flex items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur-md z-40 shrink-0">
        <div className="w-full max-w-[1550px] mx-auto flex items-center justify-between">
          {/* Top-Left Logo & Title */}
          <div className="flex items-center space-x-3">
            {/* Logo Mark */}
            <div className="bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 p-2 rounded-xl shadow-md shadow-orange-500/20 text-white flex items-center justify-center">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 tracking-tight">ThermalTrace</span>
                <span className="text-base font-extrabold text-orange-600">AI</span>
                <span className="bg-slate-100 text-slate-600 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-300">
                  SIH26162
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block leading-none">
                Satellite-Based Industrial Thermal Anomaly Intelligence Platform
              </p>
            </div>
          </div>

          {/* Top-Right Navigation & Live Status */}
          <div className="flex items-center space-x-5 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveModal('about')}
              className="hover:text-slate-900 transition"
            >
              About
            </button>
            <button
              onClick={() => setActiveModal('features')}
              className="hover:text-slate-900 transition"
            >
              Features
            </button>
            <button
              onClick={() => setActiveModal('datasources')}
              className="hover:text-slate-900 transition"
            >
              Data Sources
            </button>

            {/* Live Data Status Indicator Pill */}
            <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200/80 shadow-sm font-bold text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSystemLive ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSystemLive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span>Live Data</span>
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Information Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'about' && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <h3>About ThermalTrace AI (SIH26162)</h3>
                </div>
                <p>
                  ThermalTrace AI is an automated satellite intelligence system developed for Smart India Hackathon (Problem Statement SIH26162).
                </p>
                <p>
                  The platform ingests real-time VIIRS satellite thermal observations from NASA LANCE FIRMS, cross-references detection coordinates against India's industrial infrastructure registry, and applies a scientific AI evidence engine to identify potential industrial thermal anomalies.
                </p>
              </div>
            )}

            {activeModal === 'features' && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <h3>Platform Intelligence Features</h3>
                </div>
                <div className="space-y-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">🔥 NASA FIRMS NRT Pipeline</span>
                    <span>Automated ingestion of satellite active fire detections with zero hardcoded data.</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">🏭 Spatial Proximity Engine</span>
                    <span>Haversine spatial indexing matching thermal observations within 5km of registered industrial sites.</span>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'datasources' && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <h3>Authoritative Data Sources</h3>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/60 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>NASA LANCE FIRMS:</strong> Near-Real-Time VIIRS 375m active fire observations.</span>
                  </li>
                  <li className="flex items-start space-x-2 bg-blue-50/50 p-2.5 rounded-xl border border-blue-200/60 text-blue-900">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Indian Industrial Registry:</strong> Spatial coordinates of refineries, power plants, and chemical clusters.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
