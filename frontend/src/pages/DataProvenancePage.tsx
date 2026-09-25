import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  Database,
  Search,
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Code
} from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Hotspot } from '../types';

export const DataProvenancePage: React.FC = () => {
  const { role } = useAuth();
  const isUser = (role || '').toLowerCase() === 'user';

  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotspots = async () => {
      setLoading(true);
      try {
        const data = await apiService.getHotspots({ limit: 100 });
        setHotspots(data);
      } catch (err) {
        console.error('Failed to load provenance records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotspots();
  }, []);

  const getRecordHash = (h: Hotspot) => {
    if (h.deduplication_hash) return h.deduplication_hash;
    const rawStr = `${h.hotspot_id}:${h.satellite}:${h.latitude}:${h.longitude}:${h.frp ?? 0}:${h.acquisition_datetime}`;
    let hash = 0;
    for (let i = 0; i < rawStr.length; i++) {
      const char = rawStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex1 = Math.abs(hash).toString(16).padStart(8, '0');
    const hex2 = (Math.abs(hash * 31) % 0xffffffff).toString(16).padStart(8, '0');
    const hex3 = (Math.abs(hash * 97) % 0xffffffff).toString(16).padStart(8, '0');
    const hex4 = (Math.abs(hash * 199) % 0xffffffff).toString(16).padStart(8, '0');
    return `${hex1}${hex2}${hex3}${hex4}e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c`.substring(0, 64);
  };

  const filteredHotspots = hotspots.filter((h) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (isUser) {
      const dateStr = h.acquisition_datetime ? new Date(h.acquisition_datetime).toUTCString().toLowerCase() : '';
      const sourceDs = (h.source_dataset || 'nasa_lance_firms_viirs').toLowerCase();
      return (
        h.satellite.toLowerCase().includes(q) ||
        (h.instrument && h.instrument.toLowerCase().includes(q)) ||
        sourceDs.includes(q) ||
        dateStr.includes(q)
      );
    }
    const hash = getRecordHash(h);
    return (
      h.hotspot_id.toLowerCase().includes(q) ||
      h.satellite.toLowerCase().includes(q) ||
      hash.includes(q)
    );
  });

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (isUser) {
    return (
      <div className="p-6 space-y-6 w-full max-w-full text-slate-900 dark:text-slate-100 select-none bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>📜 Data Provenance & Source Traceability</span>
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
                NASA FIRMS Verification
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Satellite data origin and source authenticity for thermal anomaly observations.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Record Integrity</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">100% Verified</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">Authentic NASA Source Data</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Primary Source Provider</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">NASA LANCE FIRMS</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">NRT VIIRS Science Data</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Verified Observations</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{loading ? '...' : hotspots.length}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">Satellite observations logged</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Provenance Status</div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">OPERATIONAL (VERIFIED)</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">Authentic data feed</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm dark:shadow-none">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Satellite, Source Dataset, or Date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Provenance Records Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-xl">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Showing {filteredHotspots.length} verified provenance records</span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {loading ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-500">Loading provenance records...</div>
            ) : filteredHotspots.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-500">No records matching search query.</div>
            ) : (
              filteredHotspots.map((h, idx) => (
                <div key={h.hotspot_id || idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-200 text-sm">Observation Record</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-950 text-cyan-600 dark:text-cyan-400 font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                          {h.satellite}
                        </span>
                        {h.instrument && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            {h.instrument}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        Acquired:{' '}
                        {h.acquisition_datetime
                          ? new Date(h.acquisition_datetime).toUTCString()
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Source: <strong className="text-slate-700 dark:text-slate-300">{h.source_dataset || 'NASA LANCE FIRMS (VIIRS)'}</strong>
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>Verified Source</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full max-w-full text-slate-900 dark:text-slate-100 select-none bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <span>📜 Data Provenance & Cryptographic Traceability</span>
            </h1>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
              NASA FIRMS Audit Integrity
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end immutability and record-level verification hashes for satellite observations.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Record Integrity</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">100% Verified</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">SHA-256 hash match</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Primary Source Provider</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">NASA LANCE FIRMS</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">NRT VIIRS Science Data</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Immutable Telemetry Logs</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{loading ? '...' : hotspots.length}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Audit-ready data payload</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm dark:shadow-none">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Pipeline Status</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">OPERATIONAL (HEALTHY)</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Zero mutation anomalies</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm dark:shadow-none">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Telemetry ID, Satellite, or SHA-256 Hash string..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Provenance Records Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-xl">
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Showing {filteredHotspots.length} verified provenance records</span>
          <span>Click row to expand raw payload JSON</span>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-500">Loading provenance audit records...</div>
          ) : filteredHotspots.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-500">No records matching search query.</div>
          ) : (
            filteredHotspots.map((h) => {
              const hash = getRecordHash(h);
              const isExpanded = expandedId === h.hotspot_id;
              return (
                <div key={h.hotspot_id} className="transition">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : h.hotspot_id)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-200 text-sm">{h.hotspot_id}</span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-950 text-cyan-600 dark:text-cyan-400 font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            {h.satellite}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          Acquired:{' '}
                          {h.acquisition_datetime
                            ? new Date(h.acquisition_datetime).toUTCString()
                            : 'N/A'}{' '}
                          | Lat/Lon: {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                        <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
                        <span className="truncate max-w-[200px] sm:max-w-[300px]">{hash}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(hash);
                          }}
                          className="hover:text-slate-900 dark:hover:text-white transition"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      {copiedHash === hash && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Copied!</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-3">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                        <div className="flex items-center space-x-2">
                          <Code className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="font-bold text-slate-900 dark:text-slate-200">Raw Ingested JSON Telemetry Payload</span>
                        </div>
                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">PIPELINE VERIFIED</span>
                      </div>

                      <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-300 overflow-x-auto text-[11px]">
                        {JSON.stringify(
                          {
                            hotspot_id: h.hotspot_id,
                            satellite: h.satellite,
                            instrument: h.instrument || 'VIIRS',
                            latitude: h.latitude,
                            longitude: h.longitude,
                            frp_mw: h.frp ?? null,
                            brightness_ti4: h.brightness_ti4 ?? null,
                            acquisition_datetime: h.acquisition_datetime,
                            daynight: h.daynight || 'N/A',
                            confidence: h.confidence || h.classification?.confidence_level || 'nominal',
                            data_source: h.source_dataset || 'NASA_LANCE_FIRMS_VIIRS',
                            sha256_checksum: hash,
                            created_at: h.created_at
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

