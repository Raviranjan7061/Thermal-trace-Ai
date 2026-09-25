import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { IndustrialFacility, FacilityMonitoringProfile } from '../types';
import {
  Factory,
  Search,
  X,
  Flame,
  Clock,
  ExternalLink,
  Radio,
  Building2,
  SlidersHorizontal
} from 'lucide-react';

export const IndustrialSitesPage: React.FC = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState<IndustrialFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Selected Facility Profile State
  const [selectedFacility, setSelectedFacility] = useState<IndustrialFacility | null>(null);
  const [profile, setProfile] = useState<FacilityMonitoringProfile | null>(null);
  const [profileTimeframe, setProfileTimeframe] = useState<number>(90);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

  // Fetch industrial sites
  useEffect(() => {
    setLoading(true);
    apiService.getIndustrialSites({ search, facility_type: typeFilter || undefined })
      .then(setSites)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, typeFilter]);

  // Fetch facility profile when selection or timeframe changes
  useEffect(() => {
    if (selectedFacility) {
      setLoadingProfile(true);
      apiService.getFacilityProfile(selectedFacility.facility_id, profileTimeframe)
        .then(setProfile)
        .catch(console.error)
        .finally(() => setLoadingProfile(false));
    } else {
      setProfile(null);
    }
  }, [selectedFacility, profileTimeframe]);

  // Handle Keyboard Escape key to close profile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFacility(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderProfilePanel = () => {
    if (!selectedFacility) return null;

    return (
      <div className="space-y-5 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-cyan-400 shadow-md">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">{selectedFacility.name}</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5 capitalize">
                {selectedFacility.facility_type.replace('_', ' ')} • {selectedFacility.state || 'India'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedFacility(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close profile (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timeframe Selector */}
        <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Monitoring History Timeframe:</span>
          </span>
          <div className="flex items-center space-x-1 text-xs">
            {[7, 14, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setProfileTimeframe(days)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  profileTimeframe === days
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        {/* 3 Summary KPI Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-center space-y-1">
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">
              Nearby Observations (5km)
            </span>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
              {loadingProfile ? '...' : (profile?.nearby_observations_count ?? 0)}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-center space-y-1">
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">
              Average Radiative Power
            </span>
            <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
              {loadingProfile ? '...' : (profile?.avg_frp ? `${profile.avg_frp} MW` : 'N/A')}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-center space-y-1">
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">
              Max Radiative Output
            </span>
            <p className="text-lg font-extrabold text-red-600 dark:text-red-400">
              {loadingProfile ? '...' : (profile?.max_frp ? `${profile.max_frp} MW` : 'N/A')}
            </p>
          </div>
        </div>

        {/* Recent Satellite Thermal Detections */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Recent Satellite Thermal Detections</span>
          </h4>

          {loadingProfile ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-500 text-xs bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800/80">
              Querying satellite thermal observations...
            </div>
          ) : profile?.recent_observations && profile.recent_observations.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {profile.recent_observations.map((obs) => (
                <div
                  key={obs.hotspot_id}
                  className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex justify-between items-center text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 dark:text-slate-200">{obs.satellite}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        {obs.daynight === 'N' ? 'Night' : 'Day'}
                      </span>
                    </div>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {new Date(obs.acquisition_datetime).toUTCString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-amber-600 dark:text-amber-400">{obs.frp ? `${obs.frp} MW` : 'N/A'}</span>
                    {obs.brightness_ti4 && (
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">Ti4: {obs.brightness_ti4} K</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Radio className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-300">
                No satellite thermal observations recorded within 5 km during the selected {profileTimeframe}-day period.
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                This does not indicate a system error; no qualifying observations were found for the selected monitoring window.
              </p>
            </div>
          )}
        </div>

        {/* Facility Details & Map Action */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Facility Details</span>
          </h4>

          <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>State / District</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium">
                {selectedFacility.state || 'India'}, {selectedFacility.district || 'Unspecified'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Operator / Owner</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium">{selectedFacility.operator_owner || 'Unspecified'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              <span>Coordinates</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {selectedFacility.latitude.toFixed(4)}, {selectedFacility.longitude.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 capitalize">
              <span>Facility Type</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium">{selectedFacility.facility_type.replace('_', ' ')}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/map')}
            className="w-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-800 transition flex items-center justify-center space-x-2 shadow-sm dark:shadow-lg group cursor-pointer"
          >
            <span>Open in Map</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto custom-scrollbar overflow-y-auto h-full text-slate-900 dark:text-slate-100 select-none bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Indian Industrial Infrastructure Registry & Monitoring Profiles
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verified geospatial spatial registry of refineries, power plants, petrochemical complexes, LNG terminals, and steel works across India
        </p>
      </div>

      {/* 2. Toolbar / Search & Filter */}
      <div className="bg-white dark:bg-[#0B101D] p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-xl flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search facility name, operator, or district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500/50 transition-all"
          />
        </div>

        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500/50 transition-all cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">All Facility Categories</option>
            <option value="refinery" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Oil Refineries</option>
            <option value="power_plant" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Thermal Power Plants</option>
            <option value="petrochemical" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Petrochemical Complexes</option>
            <option value="steel_plant" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Steel Works & Plants</option>
            <option value="lng_facility" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">LNG Terminals & Gas Hubs</option>
            <option value="mine" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Mining Infrastructure</option>
          </select>
        </div>
      </div>

      {/* 3. Main Grid & Profile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Facilities Grid */}
        <div className={`${selectedFacility ? 'lg:col-span-2' : 'lg:col-span-3'} transition-all duration-300`}>
          {loading ? (
            <div className="py-24 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm dark:shadow-none">
              Loading industrial facilities registry...
            </div>
          ) : sites.length === 0 ? (
            <div className="py-24 text-center bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800/80 rounded-2xl text-slate-500 dark:text-slate-400 text-xs shadow-sm dark:shadow-none">
              No industrial facilities match the search query.
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${selectedFacility ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
              {sites.map((site) => {
                const isSelected = selectedFacility?.facility_id === site.facility_id;
                return (
                  <div
                    key={site.facility_id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedFacility(site)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedFacility(site);
                      }
                    }}
                    className={`group relative bg-white dark:bg-[#0B101D] p-4 rounded-xl border transition-all duration-200 cursor-pointer space-y-3.5 shadow-sm dark:shadow-md hover:shadow-md dark:hover:shadow-xl ${
                      isSelected
                        ? 'border-amber-500/80 ring-1 ring-amber-500/40 bg-amber-50/30 dark:bg-[#0E1628]'
                        : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#0E1424]'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
                          <Factory className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                            {site.name}
                          </h3>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize font-medium">
                            {site.facility_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className="shrink-0 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
                        <span>Monitoring</span>
                      </span>
                    </div>

                    {/* Metadata Table */}
                    <div className="text-xs space-y-1.5 bg-slate-50 dark:bg-slate-950/70 p-3 rounded-lg border border-slate-200 dark:border-slate-800/60">
                      <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <span>State / District</span>
                        <span className="text-slate-900 dark:text-slate-200 font-medium">{site.state || 'India'}, {site.district || ''}</span>
                      </div>
                      {site.operator_owner && (
                        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                          <span>Operator / Owner</span>
                          <span className="text-slate-900 dark:text-slate-200 font-medium truncate max-w-[180px]">{site.operator_owner}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        <span>Coordinates</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}</span>
                      </div>
                    </div>

                    {/* Footer Action Bar */}
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/60">
                      <span>Click anywhere on this card to view details</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFacility(site);
                        }}
                        className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        View Profile →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Side-by-Side Profile Panel */}
        {selectedFacility && (
          <div className="hidden lg:block lg:col-span-1 bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xl dark:shadow-2xl sticky top-6 h-fit max-h-[85vh] overflow-y-auto custom-scrollbar">
            {renderProfilePanel()}
          </div>
        )}
      </div>

      {/* Mobile Backdrop Modal Overlay (for screens < lg) */}
      {selectedFacility && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedFacility(null);
          }}
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-xl w-full space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            {renderProfilePanel()}
          </div>
        </div>
      )}
    </div>
  );
};
