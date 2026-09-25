import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Hotspot } from '../types';
import { EvidenceBadge } from '../components/Dashboard/EvidenceBadge';
import { HotspotDrawer } from '../components/Dashboard/HotspotDrawer';
import { Download, Search, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export const ExplorerPage: React.FC = () => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  const [satelliteFilter, setSatelliteFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [daynightFilter, setDaynightFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 25;

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getHotspots({
        skip: page * limit,
        limit,
        satellite: satelliteFilter || undefined,
        classification: classificationFilter || undefined,
        daynight: daynightFilter || undefined
      });
      setHotspots(data);
    } catch (err) {
      console.error('Error fetching explorer hotspots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, satelliteFilter, classificationFilter, daynightFilter]);

  const exportCSV = () => {
    if (hotspots.length === 0) return;

    const headers = [
      'Hotspot ID',
      'Latitude',
      'Longitude',
      'Acquisition Datetime',
      'Ingested Datetime',
      'Satellite',
      'Instrument',
      'FRP (MW)',
      'Brightness Ti4 (K)',
      'Brightness Ti5 (K)',
      'Day/Night',
      'Classification',
      'Confidence Score',
      'Nearest Facility',
      'Distance (km)'
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = hotspots.map((h) => [
      escapeCSV(h.hotspot_id),
      h.latitude,
      h.longitude,
      escapeCSV(h.acquisition_datetime),
      escapeCSV(h.created_at || ''),
      escapeCSV(h.satellite),
      escapeCSV(h.instrument),
      h.frp || '',
      h.brightness_ti4 || '',
      h.brightness_ti5 || '',
      escapeCSV(h.daynight || ''),
      escapeCSV(h.classification?.probable_classification || 'Unknown'),
      h.classification?.confidence_score || '',
      escapeCSV(h.classification?.nearest_facility_name || ''),
      h.classification?.distance_to_nearest_facility_km || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `thermaltrace_hotspots_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto custom-scrollbar overflow-y-auto h-full text-slate-900 dark:text-slate-100 select-none bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Satellite Hotspot Intelligence Explorer</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Query and analyze real satellite-derived thermal detections and derived geospatial features
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={hotspots.length === 0}
          className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>Export Filtered CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center shadow-sm dark:shadow-md">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filters:</span>
        </div>

        <select
          value={satelliteFilter}
          onChange={(e) => {
            setSatelliteFilter(e.target.value);
            setPage(0);
          }}
          className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
        >
          <option value="">All Satellites</option>
          <option value="N20">VIIRS NOAA-20</option>
          <option value="N21">VIIRS NOAA-21</option>
        </select>

        <select
          value={classificationFilter}
          onChange={(e) => {
            setClassificationFilter(e.target.value);
            setPage(0);
          }}
          className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
        >
          <option value="">All Classifications</option>
          <option value="Industrial Fire">Industrial Fire</option>
          <option value="Persistent Gas Flare">Persistent Gas Flare</option>
          <option value="Industrial/Mining Thermal Activity">Industrial/Mining Activity</option>
          <option value="Wildfire">Wildfire</option>
          <option value="Crop Burning">Crop Burning</option>
          <option value="Unknown">Unknown / Needs Review</option>
        </select>

        <select
          value={daynightFilter}
          onChange={(e) => {
            setDaynightFilter(e.target.value);
            setPage(0);
          }}
          className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
        >
          <option value="">Day & Night</option>
          <option value="D">Daytime Observations</option>
          <option value="N">Nighttime Observations</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg dark:shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">Loading satellite hotspot database records...</div>
        ) : hotspots.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            No thermal observations match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Observation ID</th>
                  <th className="p-3">Acquisition Time</th>
                  <th className="p-3">Location (Lat, Lon)</th>
                  <th className="p-3">Satellite</th>
                  <th className="p-3">FRP (MW)</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3">Nearest Infrastructure</th>
                  <th className="p-3">Distance</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {hotspots.map((h) => {
                  const cls = h.classification;
                  return (
                    <tr key={h.hotspot_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer" onClick={() => setSelectedHotspot(h)}>
                      <td className="p-3 font-mono font-medium text-slate-900 dark:text-slate-300">
                        {h.hotspot_id.substring(0, 10)}...
                      </td>
                      <td className="p-3 text-slate-800 dark:text-slate-300">
                        {new Date(h.acquisition_datetime).toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-slate-800 dark:text-slate-300">
                        {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                      </td>
                      <td className="p-3 text-slate-800 dark:text-slate-300">
                        {h.satellite} ({h.daynight === 'N' ? 'Night' : 'Day'})
                      </td>
                      <td className="p-3 font-bold text-amber-600 dark:text-amber-400">
                        {h.frp ? `${h.frp} MW` : 'N/A'}
                      </td>
                      <td className="p-3">
                        <EvidenceBadge
                          classification={cls?.probable_classification || 'Unknown'}
                          confidenceScore={cls?.confidence_score}
                        />
                      </td>
                      <td className="p-3 text-slate-800 dark:text-slate-300">
                        {cls?.nearest_facility_name || 'None'}
                      </td>
                      <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">
                        {cls?.distance_to_nearest_facility_km !== undefined && cls?.distance_to_nearest_facility_km !== null
                          ? `${cls.distance_to_nearest_facility_km.toFixed(2)} km`
                          : 'N/A'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHotspot(h);
                          }}
                          className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Page {page + 1}</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={hotspots.length < limit}
              className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <HotspotDrawer hotspot={selectedHotspot} onClose={() => setSelectedHotspot(null)} />
    </div>
  );
};
