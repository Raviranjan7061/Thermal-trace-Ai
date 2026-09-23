import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { AnalystReview } from '../types';
import { CheckSquare, Clock, UserCheck, FileText } from 'lucide-react';

export const AnalystReviewPage: React.FC = () => {
  const [reviews, setReviews] = useState<AnalystReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getReviews()
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto custom-scrollbar overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-bold text-white">Analyst Review & Human-in-the-Loop Audit Trail</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Immutable audit records of analyst evaluations, classification overrides, and field verification requests
        </p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading analyst review audit records...</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No analyst reviews recorded yet. Analysts can submit review decisions from any hotspot side drawer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Review Date / Time</th>
                  <th className="p-3">Hotspot ID</th>
                  <th className="p-3">Original Model Prediction</th>
                  <th className="p-3">Analyst Verified Classification</th>
                  <th className="p-3">Reviewer Status</th>
                  <th className="p-3">Analyst Notes</th>
                  <th className="p-3">Reviewer Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reviews.map((r) => (
                  <tr key={r.review_id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 text-slate-300 font-mono text-[11px]">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-amber-400">
                      {r.hotspot_id.substring(0, 12)}...
                    </td>
                    <td className="p-3 text-slate-400">{r.original_classification}</td>
                    <td className="p-3 font-bold text-white">{r.analyst_classification}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        {r.analyst_status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{r.analyst_notes || '—'}</td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{r.reviewer_email || 'analyst@thermaltrace.ai'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
