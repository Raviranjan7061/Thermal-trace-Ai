import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { DataSourceStatus } from '../types';
import { Database, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

export const DataSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<DataSourceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getDataSourcesStatus()
      .then(setSources)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto custom-scrollbar overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-bold text-white">Data Sources & Provenance Transparency</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Complete attribution, synchronization status, known limitations, and provenance of integrated geospatial data feeds
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading data sources telemetry...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sources.map((src, idx) => (
            <div
              key={idx}
              className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">{src.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{src.purpose}</p>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded border ${
                    src.status === 'Active' || src.status === 'Available'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  {src.status}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Records Stored</span>
                  <span className="font-semibold text-slate-200">{src.records_loaded}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Attribution</span>
                  <span className="text-slate-300 font-medium">{src.attribution}</span>
                </div>
                {src.last_sync && (
                  <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                    <span>Last Sync</span>
                    <span className="text-amber-400">{src.last_sync}</span>
                  </div>
                )}
              </div>

              <div className="text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block text-[11px]">Known Source Limitations:</span>
                <p className="text-[11px] leading-relaxed">{src.known_limitations}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
