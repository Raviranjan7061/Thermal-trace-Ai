import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Hotspot } from '../types';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, Clock, Activity, AlertCircle } from 'lucide-react';

export const TemporalAnalysisPage: React.FC = () => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getHotspots({ limit: 200 })
      .then(setHotspots)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const timelineData = hotspots
    .slice()
    .reverse()
    .map((h) => ({
      time: new Date(h.acquisition_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      frp: h.frp || 0,
      brightness: h.brightness_ti4 || 0,
      classification: h.classification?.probable_classification || 'Unknown'
    }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto custom-scrollbar overflow-y-auto h-full text-slate-900 dark:text-slate-100 select-none bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Temporal Intelligence & Thermal Baseline Engine</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Multi-temporal analysis of satellite radiative power, recurrence frequency, and baseline Z-score deviations
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Computing temporal intelligence features from database...</div>
      ) : hotspots.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 text-xs flex items-center justify-center space-x-2 shadow-sm dark:shadow-none">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>Insufficient historical data. Awaiting satellite observations from FIRMS sync.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FRP Over Time Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Fire Radiative Power (FRP) Timeline</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} label={{ value: 'MW', angle: -90, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="frp" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="FRP (MW)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Brightness Temperature Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Brightness Temperature (Ti4 Channel)</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', fontSize: '12px' }} />
                  <Bar dataKey="brightness" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Brightness Ti4 (K)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
