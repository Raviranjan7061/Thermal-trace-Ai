import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Cpu, Info } from 'lucide-react';

export const ModelPerformancePage: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getModelInfo()
      .then(setModelInfo)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto custom-scrollbar overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-amber-400" />
          <span>Evidence Engine & Classification Intelligence</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Transparent evidence-based preliminary classification using satellite thermal, industrial proximity, historical and contextual signals.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading evidence classification status...</div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{modelInfo?.mode || 'Evidence Engine v1.0'}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {modelInfo?.active_model_trained
                      ? 'Validated Machine Learning Model Active'
                      : 'Scientific Evidence Rule Engine Active'}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  modelInfo?.active_model_trained
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                {modelInfo?.active_model_trained ? 'Trained Model Mode' : 'Evidence / Heuristic Mode'}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-slate-200">Pipeline Description:</p>
              <p className="text-slate-400 leading-relaxed">{modelInfo?.pipeline_description}</p>
            </div>

            {!modelInfo?.active_model_trained && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-amber-400">
                  <Info className="w-4 h-4" />
                  <span>Scientific Honesty & Transparency Rule</span>
                </div>
                <p className="text-amber-200/90 leading-relaxed">
                  {modelInfo?.status_message} Output predictions are explicitly marked as "Evidence-based preliminary classification" with supporting and contradictory evidence points. Evidence confidence scores represent heuristic signal alignment, not synthetic trained model accuracy.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
