import React, { useState, useEffect } from 'react';
import {
  Flame,
  AlertTriangle,
  Factory,
  Search,
  ExternalLink,
  ShieldAlert,
  MapPin,
  Clock,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';
import { apiService } from '../services/api';
import { Alert as AlertType, Hotspot } from '../types';
import { HotspotDrawer } from '../components/Dashboard/HotspotDrawer';

export const ThermalIncidentsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch thermal incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleInspectHotspot = async (hotspotId: string) => {
    try {
      const h = await apiService.getHotspotById(hotspotId);
      setSelectedHotspot(h);
    } catch (err) {
      console.error('Failed to fetch hotspot details for incident:', err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (priorityFilter !== 'ALL' && (a.priority || '').toLowerCase() !== priorityFilter.toLowerCase()) return false;
    if (statusFilter !== 'ALL' && (a.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (a.alert_id || '').toLowerCase().includes(q);
      const matchTitle = (a.title || '').toLowerCase().includes(q);
      const matchNotes = (a.analyst_notes || '').toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchNotes) return false;
    }
    return true;
  });

  const highPriorityCount = alerts.filter((a) => (a.priority || '').toLowerCase() === 'high').length;
  const industrialCount = alerts.filter((a) => (a.title || '').toLowerCase().includes('facility') || (a.title || '').toLowerCase().includes('industrial')).length;
  const investigatingCount = alerts.filter((a) => (a.status || '').toLowerCase() === 'investigating').length;

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto custom-scrollbar p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <span>🔥 Thermal Incidents</span>
            </h1>
            <span className="bg-amber-500/10 text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/30">
              Evidence Engine Synthesized
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized thermal anomalies correlated with industrial assets and spatial baseline persistence.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Total Synthesized Incidents</div>
            <div className="text-xl font-bold text-slate-100">{loading ? '...' : alerts.length}</div>
            <div className="text-[10px] text-slate-500">Events passing evidence threshold</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">High Priority Incidents</div>
            <div className="text-xl font-bold text-red-400">{loading ? '...' : highPriorityCount}</div>
            <div className="text-[10px] text-slate-500">Requires immediate attention</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Industrial Infrastructure Incidents</div>
            <div className="text-xl font-bold text-amber-400">{loading ? '...' : industrialCount}</div>
            <div className="text-[10px] text-slate-500">Near registered facility boundary</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Under Investigation</div>
            <div className="text-xl font-bold text-cyan-400">{loading ? '...' : investigatingCount}</div>
            <div className="text-[10px] text-slate-500">Assigned analyst workflow</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter incidents by title, ID, or facility description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none text-xs"
            >
              <option value="ALL" className="bg-slate-900">All Priorities</option>
              <option value="high" className="bg-slate-900">High Priority</option>
              <option value="medium" className="bg-slate-900">Medium Priority</option>
              <option value="low" className="bg-slate-900">Low Priority</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none text-xs"
            >
              <option value="ALL" className="bg-slate-900">All Statuses</option>
              <option value="new" className="bg-slate-900">New</option>
              <option value="investigating" className="bg-slate-900">Investigating</option>
              <option value="resolved" className="bg-slate-900">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 text-slate-500 text-xs">
            Loading thermal incidents...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 text-slate-500 text-xs">
            No thermal incidents found matching filters.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const prio = (alert.priority || 'medium').toLowerCase();
            return (
              <div
                key={alert.alert_id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        prio === 'high'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : prio === 'medium'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {alert.priority || 'MEDIUM'} PRIORITY
                    </span>

                    <span className="text-xs font-mono text-slate-400">{alert.alert_id}</span>

                    <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                      {alert.status || 'NEW'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100">{alert.title}</h3>

                  <p className="text-xs text-slate-400">{alert.analyst_notes || 'Synthesized incident by ThermalTrace Evidence Engine based on satellite telemetry.'}</p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{alert.created_at || 'Recent telemetry'}</span>
                    </div>
                    {alert.hotspot_id && (
                      <div className="flex items-center space-x-1 text-amber-400">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Hotspot: {alert.hotspot_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {alert.hotspot_id && (
                  <button
                    onClick={() => handleInspectHotspot(alert.hotspot_id!)}
                    className="self-start md:self-auto flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg transition shrink-0"
                  >
                    <span>Inspect Evidence</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Intelligence Drawer */}
      <HotspotDrawer hotspot={selectedHotspot} onClose={() => setSelectedHotspot(null)} />
    </div>
  );
};
