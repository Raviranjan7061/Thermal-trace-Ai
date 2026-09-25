import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Watchlist } from '../types';
import { Shield, Plus, Trash2, MapPin, Eye, AlertTriangle } from 'lucide-react';

export const WatchlistsPage: React.FC = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [interestType, setInterestType] = useState('radius_point');
  const [latitude, setLatitude] = useState<number | ''>(20.5937);
  const [longitude, setLongitude] = useState<number | ''>(78.9629);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);

  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      const data = await apiService.getWatchlists();
      setWatchlists(data);
      setError(null);
    } catch (err: any) {
      setError('Failed to load watchlists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      await apiService.createWatchlist({
        name,
        interest_type: interestType,
        latitude: latitude !== '' ? Number(latitude) : undefined,
        longitude: longitude !== '' ? Number(longitude) : undefined,
        radius_km: Number(radiusKm)
      });
      setShowModal(false);
      setName('');
      fetchWatchlists();
    } catch (err: any) {
      alert('Failed to create watchlist zone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this Watchlist zone?')) return;
    try {
      await apiService.deleteWatchlist(id);
      fetchWatchlists();
    } catch (err: any) {
      alert('Failed to delete watchlist.');
    }
  };

  return (
    <div className="p-6 space-y-6 text-slate-900 dark:text-slate-100 select-none bg-slate-50 dark:bg-slate-950 min-h-full transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm dark:shadow-md">
        <div>
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Areas of Interest & Watchlists</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Define high-priority geographic watch zones to automatically evaluate incoming satellite thermal observations.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Area of Interest</span>
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">Loading watchlists...</div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400 text-sm py-8 text-center">{error}</div>
      ) : watchlists.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm dark:shadow-none">
          <MapPin className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-900 dark:text-slate-200 font-semibold text-lg">No Watchlists Configured</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
            You have not defined any custom watch zones. Create an Area of Interest to monitor specific refinery zones, ports, or industrial districts.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Create First Watch Zone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlists.map((w) => (
            <div key={w.watchlist_id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm dark:shadow-none transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-slate-900 dark:text-slate-100 font-semibold">{w.name}</h3>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-cyan-500/10 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 dark:border-cyan-800/60 font-mono">
                    {w.interest_type.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(w.watchlist_id)}
                  className="text-slate-400 hover:text-red-500 p-1 rounded transition"
                  title="Delete Watchlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800/60">
                {w.latitude && w.longitude && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Center Coordinates:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-200">{w.latitude.toFixed(4)}° N, {w.longitude.toFixed(4)}° E</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Watch Radius:</span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-300">{w.radius_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Created By:</span>
                  <span className="text-slate-700 dark:text-slate-300">{w.created_by || 'Analyst'}</span>
                </div>
              </div>

              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span>Active Monitoring Status</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create Area of Interest Watchlist</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Jamnagar Refinery Zone"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Watch Type</label>
                <select
                  value={interestType}
                  onChange={(e) => setInterestType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="radius_point">Radius Point (Lat/Lon + Distance)</option>
                  <option value="bounding_box">Geographic Bounding Box</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Watch Radius (km)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  {submitting ? 'Saving...' : 'Save Watch Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
