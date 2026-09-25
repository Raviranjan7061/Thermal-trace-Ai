import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Cpu,
  Layers,
  Satellite,
  Factory,
  Clock,
  FileText,
  Target,
  BarChart3,
  AlertTriangle,
  Sliders,
  Search,
  ArrowRight
} from 'lucide-react';

export const ModelPerformancePage: React.FC = () => {
  const navigate = useNavigate();
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getModelInfo()
      .then(setModelInfo)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCardClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, path?: string) => {
    if (path && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      navigate(path);
    }
  };

  return (
    <div className="p-6 space-y-6 w-full max-w-full custom-scrollbar overflow-y-auto h-full text-slate-900 dark:text-slate-100 select-none bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400">
            <Cpu className="w-5 h-5" />
          </div>
          <span>Evidence Engine & Classification Intelligence</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Transparent evidence-based preliminary classification using satellite thermal, industrial proximity, historical and contextual signals.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading evidence classification status...</div>
      ) : (
        <div className="space-y-5">
          {/* 2. Engine Status Card */}
          <div className="bg-white dark:bg-[#0B101D] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/90 border-t-cyan-500/40 shadow-sm dark:shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)] shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {modelInfo?.mode || 'Evidence-based preliminary classification'}
                  </h2>
                  <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                    <span>Engine Active</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {modelInfo?.active_model_trained
                    ? 'Validated Machine Learning Model Active'
                    : 'Scientific Evidence Rule Engine Active'}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">
              {modelInfo?.active_model_trained ? 'Trained Model Mode' : 'Evidence / Heuristic Mode'}
            </div>
          </div>

          {/* 3. Pipeline Description Card */}
          <div className="bg-white dark:bg-[#0B101D] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5">
              <Layers className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <h2 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Pipeline Description</h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {modelInfo?.pipeline_description ||
                'Combines NASA satellite thermal metrics, geodesic distance to verified Indian industrial infrastructure, Copernicus land-cover context, and 90-day cluster FRP baseline deviation Z-scores with transparent supporting & contradictory evidence rules.'}
            </p>

            {/* Horizontal 6-Stage Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
              {/* Stage 1: NASA FIRMS */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick('/observations')}
                onKeyDown={(e) => handleKeyDown(e, '/observations')}
                aria-label="View NASA FIRMS satellite thermal metrics"
                className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-500/40 bg-blue-50/50 dark:bg-blue-500/5 flex flex-col justify-between space-y-2 cursor-pointer hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <div className="flex items-center justify-between">
                  <Satellite className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 hidden lg:block" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">NASA FIRMS</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Satellite Thermal Metrics</div>
                </div>
              </div>

              {/* Stage 2: Industrial Proximity */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick('/industrial-sites')}
                onKeyDown={(e) => handleKeyDown(e, '/industrial-sites')}
                aria-label="View industrial proximity metrics"
                className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/5 flex flex-col justify-between space-y-2 cursor-pointer hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <div className="flex items-center justify-between">
                  <Factory className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 hidden lg:block" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Industrial Proximity</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Distance to verified industrial infrastructure</div>
                </div>
              </div>

              {/* Stage 3: Land-Cover Context */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick('/data-sources')}
                onKeyDown={(e) => handleKeyDown(e, '/data-sources')}
                aria-label="View land-cover context sources"
                className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-500/40 bg-purple-50/50 dark:bg-purple-500/5 flex flex-col justify-between space-y-2 cursor-pointer hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
              >
                <div className="flex items-center justify-between">
                  <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 hidden lg:block" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Land-Cover Context</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Copernicus land-cover data</div>
                </div>
              </div>

              {/* Stage 4: 90-Day Historical Baseline */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick('/temporal')}
                onKeyDown={(e) => handleKeyDown(e, '/temporal')}
                aria-label="View 90-day historical baseline analytics"
                className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-500/5 flex flex-col justify-between space-y-2 cursor-pointer hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <div className="flex items-center justify-between">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 hidden lg:block" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">90-Day Historical Baseline</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Cluster FRP baseline deviation (Z-scores)</div>
                </div>
              </div>

              {/* Stage 5: Evidence Rules */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick('/incidents')}
                onKeyDown={(e) => handleKeyDown(e, '/incidents')}
                aria-label="View evidence rules and incidents"
                className="p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-500/40 bg-cyan-50/50 dark:bg-cyan-500/5 flex flex-col justify-between space-y-2 cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                <div className="flex items-center justify-between">
                  <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 hidden lg:block" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Evidence Rules</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Supporting & contradictory rules</div>
                </div>
              </div>

              {/* Stage 6: Preliminary Classification */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick('/incidents')}
                onKeyDown={(e) => handleKeyDown(e, '/incidents')}
                aria-label="View preliminary classification results"
                className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-500/5 flex flex-col justify-between space-y-2 cursor-pointer hover:border-rose-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-rose-400"
              >
                <div className="flex items-center justify-between">
                  <Target className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Preliminary Classification</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Evidence-based preliminary result</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Evidence Signals Section */}
          <div className="bg-white dark:bg-[#0B101D] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5">
              <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Evidence Signals</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Key information sources used in the evidence-based classification pipeline.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {/* Signal 1: Satellite Thermal Metrics */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick('/observations')}
                onKeyDown={(e) => handleKeyDown(e, '/observations')}
                aria-label="View satellite thermal metrics signal"
                className="p-4 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-slate-50 dark:bg-[#070A14] flex flex-col justify-between space-y-3 cursor-pointer hover:border-blue-500/60 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Satellite className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Satellite Thermal Metrics</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    NASA satellite thermal observations and related metrics
                  </div>
                </div>
              </div>

              {/* Signal 2: Industrial Proximity */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick('/industrial-sites')}
                onKeyDown={(e) => handleKeyDown(e, '/industrial-sites')}
                aria-label="View industrial proximity signal"
                className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-slate-50 dark:bg-[#070A14] flex flex-col justify-between space-y-3 cursor-pointer hover:border-emerald-500/60 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Industrial Proximity</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Geodesic distance to verified industrial infrastructure
                  </div>
                </div>
              </div>

              {/* Signal 3: Land-Cover Context */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick('/data-sources')}
                onKeyDown={(e) => handleKeyDown(e, '/data-sources')}
                aria-label="View land-cover context signal"
                className="p-4 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-slate-50 dark:bg-[#070A14] flex flex-col justify-between space-y-3 cursor-pointer hover:border-purple-500/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Land-Cover Context</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Copernicus land-cover information and contextual signals
                  </div>
                </div>
              </div>

              {/* Signal 4: Historical Baseline */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick('/temporal')}
                onKeyDown={(e) => handleKeyDown(e, '/temporal')}
                aria-label="View historical baseline signal"
                className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-slate-50 dark:bg-[#070A14] flex flex-col justify-between space-y-3 cursor-pointer hover:border-amber-500/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Historical Baseline</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    90-day cluster FRP baseline deviation Z-scores
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Scientific Honesty & Transparency Rule Panel */}
          <div className="p-4.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 shadow-sm dark:shadow-xl space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-amber-700 dark:text-amber-400 text-xs">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Scientific Honesty & Transparency Rule</span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
              {modelInfo?.status_message ||
                'Validated trained machine learning model artifact not currently active. System operating in Evidence/Heuristic Mode.'}{' '}
              Output predictions are explicitly marked as "Evidence-based preliminary classification" with supporting and contradictory evidence points. Evidence confidence scores represent heuristic signal alignment, not synthetic trained model accuracy.
            </p>
          </div>

          {/* 6. Bottom 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bottom Card 1: Evidence / Heuristic Mode (Non-clickable: no dedicated sub-page) */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#0B101D] flex items-start space-x-3.5 cursor-default shadow-sm dark:shadow-none">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Evidence / Heuristic Mode</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Rule-based classification using satellite, industrial, contextual and historical signals.
                </div>
              </div>
            </div>

            {/* Bottom Card 2: Transparent Rules (Clickable -> /provenance) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick('/provenance')}
              onKeyDown={(e) => handleKeyDown(e, '/provenance')}
              aria-label="View transparent rule definitions and provenance"
              className="p-4 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-white dark:bg-[#0B101D] flex items-start space-x-3.5 cursor-pointer hover:border-blue-500/60 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-sm dark:shadow-none"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Transparent Rules</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Decisions supported by explicit evidence rules.
                </div>
              </div>
            </div>

            {/* Bottom Card 3: Supporting + Contradictory Evidence (Clickable -> /incidents) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick('/incidents')}
              onKeyDown={(e) => handleKeyDown(e, '/incidents')}
              aria-label="View supporting and contradictory evidence details"
              className="p-4 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-white dark:bg-[#0B101D] flex items-start space-x-3.5 cursor-pointer hover:border-purple-500/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-purple-400 shadow-sm dark:shadow-none"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Supporting + Contradictory Evidence</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Both supporting and contradictory evidence points are considered.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
