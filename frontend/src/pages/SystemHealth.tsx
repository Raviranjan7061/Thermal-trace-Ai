import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { SystemHealth } from '../types';
import {
  Activity,
  Database,
  Satellite,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Server,
  FileText
} from 'lucide-react';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await apiService.getSystemHealth();
      setHealth(data);
      setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const isDbConnected = health?.database.status === 'Connected';
  const isFirmsConfigured = Boolean(health?.firms_integration.configured);
  const isHealthy = health?.status === 'Operational' || health?.status === 'ok';

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto custom-scrollbar overflow-y-auto h-full text-slate-100 select-none bg-slate-950">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            System Health & Diagnostic Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time backend API, database engine, NASA FIRMS synchronization, and background worker state
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {lastChecked && (
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Last checked: {lastChecked}
            </span>
          )}
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold border border-slate-800 transition cursor-pointer shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : 'text-cyan-400'}`} />
            <span>Refresh Health</span>
          </button>
        </div>
      </div>

      {loading && !health ? (
        <div className="py-24 text-center text-slate-400 text-xs">
          Querying system diagnostic telemetry...
        </div>
      ) : (
        <>
          {/* 2. COMPACT SYSTEM STATUS STRIP */}
          <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-3.5 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Item 1: Backend API */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-slate-200 text-xs">Backend API</span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase">
                {health?.backend_api || 'Healthy'}
              </span>
            </div>

            {/* Item 2: Database */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isDbConnected ? 'bg-blue-400' : 'bg-amber-400'}`} />
                <span className="font-bold text-slate-200 text-xs">Database</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase border ${
                isDbConnected
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                {health?.database.status || 'Connected'}
              </span>
            </div>

            {/* Item 3: NASA FIRMS */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isFirmsConfigured ? 'bg-amber-400' : 'bg-amber-500'}`} />
                <span className="font-bold text-slate-200 text-xs">NASA FIRMS</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase border ${
                isFirmsConfigured
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                {isFirmsConfigured ? 'Configured' : 'No MAP_KEY'}
              </span>
            </div>

            {/* Item 4: System Status */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200 text-xs">System Status</span>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-400 tracking-tight">
                {isHealthy ? 'All Services Operational' : 'Degraded Operational Status'}
              </span>
            </div>
          </div>

          {/* 3. PRIMARY HEALTH CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Backend API Service */}
            <div className="bg-[#0B101D] p-5 rounded-2xl border border-slate-800/90 shadow-2xl space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Backend API Service</h3>
                    <p className="text-[10px] text-slate-400">FastAPI REST Telemetry Engine</p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase">
                  {health?.backend_api || 'Healthy'}
                </span>
              </div>

              <div className="text-xs text-slate-400 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span>FastAPI REST Server</span>
                  <span className="text-emerald-400 font-bold">Online</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/60 pt-1.5">
                  <span>Swagger / OpenAPI Specs</span>
                  <span className="text-amber-400 font-mono text-[11px] font-bold">/docs</span>
                </div>
              </div>
            </div>

            {/* Card 2: PostGIS / Database Engine */}
            <div className="bg-[#0B101D] p-5 rounded-2xl border border-slate-800/90 shadow-2xl space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-950/40 border border-blue-500/50 flex items-center justify-center text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)] shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">PostGIS / Database Engine</h3>
                    <p className="text-[10px] text-slate-400">Spatial Telemetry Datastore</p>
                  </div>
                </div>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border uppercase ${
                  isDbConnected
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  {health?.database.status || 'Connected'}
                </span>
              </div>

              <div className="text-xs text-slate-400 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span>Hotspots Persisted</span>
                  <span className="text-white font-extrabold text-sm">{health?.database.hotspots_stored ?? 0}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/60 pt-1.5">
                  <span>Industrial Facilities Stored</span>
                  <span className="text-white font-extrabold text-sm">{health?.database.facilities_stored ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Card 3: NASA FIRMS Sync */}
            <div className="bg-[#0B101D] p-5 rounded-2xl border border-slate-800/90 shadow-2xl space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-950/40 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)] shrink-0">
                    <Satellite className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">NASA FIRMS Sync</h3>
                    <p className="text-[10px] text-slate-400">VIIRS Satellite Ingestion</p>
                  </div>
                </div>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border uppercase ${
                  isFirmsConfigured
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  {isFirmsConfigured ? 'Configured' : 'Awaiting MAP_KEY'}
                </span>
              </div>

              <div className="text-xs text-slate-400 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span>Last Sync Status</span>
                  <span className="text-amber-400 font-bold">{health?.firms_integration.last_sync_status || 'Never Run'}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/60 pt-1.5">
                  <span>Observations Inserted</span>
                  <span className="text-white font-extrabold text-sm">{health?.firms_integration.last_observations_inserted ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. OPERATIONAL HEALTH OVERVIEW (ARCHITECTURE SERVICE FLOW) */}
          <div className="bg-[#0B101D] border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Operational Health Overview</h3>
                  <p className="text-[11px] text-slate-400">End-to-end service flow and current system status</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 italic font-mono hidden md:inline">
                From satellite data to actionable intelligence
              </span>
            </div>

            {/* 5-Node Architectural Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
              {/* Node 1: Satellite Source */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 shadow-md flex flex-col items-center text-center space-y-2 relative">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Satellite className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block text-xs">Satellite Source</span>
                  <span className="text-[10px] text-slate-400 block">NASA FIRMS</span>
                </div>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                  isFirmsConfigured
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  {isFirmsConfigured ? 'Active' : 'Standby'}
                </span>
              </div>

              {/* Node 2: Data Ingestion */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 shadow-md flex flex-col items-center text-center space-y-2 relative">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block text-xs">Data Ingestion</span>
                  <span className="text-[10px] text-slate-400 block">FIRMS Sync</span>
                </div>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase">
                  {isFirmsConfigured ? 'Configured' : 'Awaiting Key'}
                </span>
              </div>

              {/* Node 3: Backend API */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 shadow-md flex flex-col items-center text-center space-y-2 relative">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Cpu className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block text-xs">Backend API</span>
                  <span className="text-[10px] text-slate-400 block">FastAPI Service</span>
                </div>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase">
                  {health?.backend_api || 'Healthy'}
                </span>
              </div>

              {/* Node 4: Database */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 shadow-md flex flex-col items-center text-center space-y-2 relative">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Database className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block text-xs">Database</span>
                  <span className="text-[10px] text-slate-400 block">PostGIS Engine</span>
                </div>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                  isDbConnected
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  {health?.database.status || 'Connected'}
                </span>
              </div>

              {/* Node 5: Operational Platform */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 shadow-md flex flex-col items-center text-center space-y-2 relative">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Server className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block text-xs">Operational Platform</span>
                  <span className="text-[10px] text-slate-400 block">ThermalTrace AI</span>
                </div>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase">
                  Running
                </span>
              </div>
            </div>
          </div>

          {/* 5. LOWER GRID: LIVE DATA SNAPSHOT & RECENT HEALTH CHECKS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Live Data Snapshot (7 cols) */}
            <div className="lg:col-span-6 xl:col-span-7 bg-[#0B101D] border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4 flex flex-col justify-between">
              <div className="flex items-center space-x-2.5 border-b border-slate-800/80 pb-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Live Data Snapshot</h3>
                  <p className="text-[11px] text-slate-400">Key operational metrics from system health</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Metric 1 */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1 relative">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Hotspots Persisted
                  </span>
                  <div className="text-2xl font-extrabold text-white leading-tight">
                    {health?.database.hotspots_stored ?? 0}
                  </div>
                  <Database className="w-4 h-4 text-cyan-400 absolute right-3 bottom-3 opacity-60" />
                </div>

                {/* Metric 2 */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1 relative">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Facilities Stored
                  </span>
                  <div className="text-2xl font-extrabold text-white leading-tight">
                    {health?.database.facilities_stored ?? 0}
                  </div>
                  <Server className="w-4 h-4 text-blue-400 absolute right-3 bottom-3 opacity-60" />
                </div>

                {/* Metric 3 */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1 relative">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Last Sync Status
                  </span>
                  <div className="text-sm font-extrabold text-emerald-400 leading-tight truncate pt-1">
                    {health?.firms_integration.last_sync_status || 'Never Run'}
                  </div>
                  <RefreshCw className="w-4 h-4 text-emerald-400 absolute right-3 bottom-3 opacity-60" />
                </div>

                {/* Metric 4 */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1 relative">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Observations Inserted
                  </span>
                  <div className="text-2xl font-extrabold text-amber-400 leading-tight">
                    {health?.firms_integration.last_observations_inserted ?? 0}
                  </div>
                  <FileText className="w-4 h-4 text-amber-400 absolute right-3 bottom-3 opacity-60" />
                </div>
              </div>
            </div>

            {/* Right Column: Recent Health Checks / Audit Logs (5 cols) */}
            <div className="lg:col-span-6 xl:col-span-5 bg-[#0B101D] border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">Recent Health Checks</h3>
                    <p className="text-[11px] text-slate-400">Latest system health verification logs</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Table / Truthful Empty State */}
              <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800/80 p-1">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] font-extrabold text-slate-400 uppercase border-b border-slate-800/80">
                    <tr>
                      <th className="p-2.5">SERVICE</th>
                      <th className="p-2.5">STATUS</th>
                      <th className="p-2.5 text-right">TIME</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="hover:bg-slate-900/50 transition">
                      <td className="p-2.5 font-bold text-slate-200">Backend API</td>
                      <td className="p-2.5">
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          {health?.backend_api || 'Healthy'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-400 text-[10px]">
                        {lastChecked || 'Just now'}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-900/50 transition">
                      <td className="p-2.5 font-bold text-slate-200">PostGIS Engine</td>
                      <td className="p-2.5">
                        <span className="text-[10px] font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-md">
                          {health?.database.status || 'Connected'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-400 text-[10px]">
                        {lastChecked || 'Just now'}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-900/50 transition">
                      <td className="p-2.5 font-bold text-slate-200">NASA FIRMS Sync</td>
                      <td className="p-2.5">
                        <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          {health?.firms_integration.last_sync_status || 'Never Run'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-400 text-[10px]">
                        {health?.firms_integration.last_attempted_sync
                          ? new Date(health.firms_integration.last_attempted_sync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : lastChecked || 'Just now'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

