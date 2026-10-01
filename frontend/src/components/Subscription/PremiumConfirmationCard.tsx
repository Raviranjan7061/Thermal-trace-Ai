import React from 'react';
import { Crown, ShieldCheck, CheckCircle2, Calendar, FileText, Sparkles, ArrowRight } from 'lucide-react';
import { SubscriptionItem } from '../../types';

interface Props {
  subscription: SubscriptionItem;
  onExploreFeatures?: () => void;
}

const formatTimestampDisplay = (raw?: string | null): string => {
  if (!raw) return 'N/A';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
};

export const PremiumConfirmationCard: React.FC<Props> = ({
  subscription,
  onExploreFeatures
}) => {
  return (
    <div className="p-6 sm:p-8 bg-gradient-to-br from-amber-500/15 via-slate-900/90 to-amber-950/20 border border-amber-500/40 rounded-2xl space-y-6 shadow-2xl relative overflow-hidden select-none">
      {/* BACKGROUND AMBIENT GLOW */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER */}
      <div className="flex items-center space-x-3.5 border-b border-amber-500/30 pb-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          <Crown className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black tracking-widest text-amber-400 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full uppercase">
              THERMALTRACE AI
            </span>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>ACTIVE</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-1 flex items-center space-x-2">
            <span>👑 Premium Access Confirmation</span>
          </h2>
        </div>
      </div>

      {/* CONFIRMATION DETAILS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Subscription Code</span>
          <span className="font-mono text-amber-400 font-bold text-sm tracking-wide block">
            {subscription.subscription_code || 'TT-SUB-CONFIRMED'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Plan & Amount</span>
          <span className="font-extrabold text-white text-sm block">
            {subscription.plan_name} — <span className="text-amber-400 font-mono">₹{subscription.price_inr?.toLocaleString('en-IN')}</span>
          </span>
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Payment Verification</span>
          <span className="font-bold text-emerald-400 text-xs flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Manually Verified by Admin</span>
          </span>
          {subscription.utr_reference && (
            <span className="text-[10px] font-mono text-slate-400 block pt-0.5">
              Ref/UTR: {subscription.utr_reference}
            </span>
          )}
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Activation & Expiry</span>
          <div className="text-[11px] font-medium text-slate-300 space-y-0.5">
            <div><span className="text-slate-500">Activated:</span> {formatTimestampDisplay(subscription.subscription_start || subscription.approved_at)}</div>
            <div><span className="text-slate-500">Expires:</span> <span className="text-amber-400 font-bold">{formatTimestampDisplay(subscription.subscription_expiry)}</span></div>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium leading-relaxed flex items-start space-x-2.5">
        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-emerald-200">All 11 Premium Features Unlocked</span>
          You have full access to Temporal Analysis, Industrial Infrastructure, Thermal Incidents, Historical Replay, Dynamic Analytics, Evidence Intelligence, and System Health.
        </div>
      </div>

      {onExploreFeatures && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onExploreFeatures}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 uppercase tracking-wider cursor-pointer"
          >
            <span>View Premium Features</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
