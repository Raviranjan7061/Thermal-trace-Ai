import React, { useState, useEffect } from 'react';
import {
  Satellite,
  RefreshCw,
  Database,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
  Clock,
  Zap,
  Radio,
  Server
} from 'lucide-react';
import { apiService } from '../services/api';
import { auth } from '../config/firebase';
import { SystemHealth, DataSourceStatus, AnalyticsOverview } from '../types';

const formatTimestampDisplay = (raw?: string): string => {
  if (!raw || typeof raw !== 'string') return 'N/A';
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed.toUpperCase() === 'N/A' || trimmed.toUpperCase() === 'UNDEFINED' || trimmed.toUpperCase() === 'NULL') {
    return 'N/A';
  }

  if (trimmed.includes('IST') || (trimmed.includes(',') && trimmed.includes(' '))) {
    return trimmed;
  }

  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return 'N/A';
};

export const PipelineStatusPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPipelineTelemetry = async () => {
    setLoading(true);
    try {
      const [hData, dsData, aData] = await Promise.all([
        apiService.getSystemHealth(),
        apiService.getDataSourcesStatus(),
        apiService.getAnalyticsOverview()
      ]);
      setHealth(hData);
      setDataSources(dsData);
      setAnalytics(aData);
    } catch (err) {
      console.error('Failed to fetch pipeline status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineTelemetry();
  }, []);

  const handleSyncFirms = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      // Check if backend Bearer token is missing but Firebase session is active
      const token = localStorage.getItem('thermaltrace_token');
      if (!token && auth.currentUser && auth.currentUser.email) {
        try {
          const authRes = await apiService.googleLogin({
            email: auth.currentUser.email,
            full_name: auth.currentUser.displayName || undefined,
            firebase_uid: auth.currentUser.uid
          });
          localStorage.setItem('thermaltrace_token', authRes.access_token);
        } catch (authErr) {
          console.warn('Pre-sync token refresh failed:', authErr);
        }
      }

      const res = await apiService.triggerFirmsSync();
      setSyncResult({
        type: 'success',
        message: res.message || 'FIRMS synchronization completed successfully.'
      });
      await fetchPipelineTelemetry();
    } catch (err: any) {
      setSyncResult({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to sync NASA FIRMS data.'
      });
    } finally {
      setSyncing(false);
    }
  };

  const firms = health?.firms_integration;
  const freshness = analytics?.data_freshness;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto custom-scrollbar p-6 space-y-6 transition-colors duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
              <Radio className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span>📡 Data Pipeline & NASA FIRMS Ingestion Status</span>
            </h1>
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/30">
              System Operations
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monitoring for NASA LANCE FIRMS satellite data feeds, satellite overpass freshness, and database ingestion pipeline health.
          </p>
        </div>

        <button
          onClick={handleSyncFirms}
          disabled={syncing}
          className="self-start md:self-auto flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Synchronizing FIRMS...' : 'Sync NASA FIRMS Data'}</span>
        </button>
      </div>

      {/* Sync Result Alert */}
      {syncResult && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center space-x-2 ${
            syncResult.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{syncResult.message}</span>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Pipeline Connection</div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {firms?.configured ? 'CONNECTED (CONFIGURED)' : 'OPERATIONAL'}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">NASA LANCE FIRMS Feed</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Last Ingestion Status</div>
            <div className="text-base font-bold text-amber-600 dark:text-amber-400 uppercase">
              {firms?.last_sync_status || 'HEALTHY'}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">
              {firms?.last_observations_inserted ?? 0} observations updated
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Database Records</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {loading ? '...' : (freshness?.total_db_records ?? health?.database?.hotspots_stored ?? 0)}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Stored real FIRMS hotspots</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Data Freshness Window</div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-200 mt-1">
              {freshness?.period_label || '24 Hours Window'}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Live satellite pass frequency</div>
          </div>
        </div>
      </div>

      {/* Satellite Constellation Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm dark:shadow-none">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Satellite className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>VIIRS Sensor Constellation Status</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 font-bold border-b border-slate-200 dark:border-slate-800 pb-1">
              <span>NOAA-20 VIIRS Orbiter</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
                ACTIVE
              </span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-500">Latest Observation:</span>
              <span>{formatTimestampDisplay(freshness?.noaa20_latest)}</span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-500">Constellation Share:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {analytics?.satellites_breakdown ? `${analytics.satellites_breakdown.noaa20_pct}%` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold border-b border-slate-200 dark:border-slate-800 pb-1">
              <span>NOAA-21 VIIRS Orbiter</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">
                ACTIVE
              </span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-500">Latest Observation:</span>
              <span>{formatTimestampDisplay(freshness?.noaa21_latest)}</span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-500">Constellation Share:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {analytics?.satellites_breakdown ? `${analytics.satellites_breakdown.noaa21_pct}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources Telemetry */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm dark:shadow-none">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>System Data Source Feed Telemetry</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Data Feed Source</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Status</th>
                <th className="p-3">Records Ingested</th>
                <th className="p-3">Attribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {dataSources.map((ds, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-mono">
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-200">{ds.name}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 font-sans">{ds.purpose}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {ds.status}
                    </span>
                  </td>
                  <td className="p-3 text-amber-600 dark:text-amber-400 font-bold">{ds.records_loaded}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 font-sans text-[11px]">{ds.attribution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
