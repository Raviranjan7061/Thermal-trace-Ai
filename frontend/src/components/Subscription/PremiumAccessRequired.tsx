import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  Check,
  Sparkles,
  Send,
  Clock,
  AlertCircle,
  MessageSquare,
  Crown,
  X,
  TrendingUp,
  Factory,
  Flame,
  Layers,
  ArrowRightLeft,
  FileText,
  BarChart3,
  Cpu,
  Activity,
  Info,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { apiService } from '../../services/api';
import { SubscriptionStatusResponse, SubscriptionPlan, SubscriptionItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PaymentChatWindow } from './PaymentChatWindow';
import { PaymentSubmissionModal } from './PaymentSubmissionModal';
import { PremiumConfirmationCard } from './PremiumConfirmationCard';


const PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price_inr: 400,
    duration: '1 Month Access',
    displayPrice: '₹400 / month'
  },
  {
    id: 'six_months',
    name: '6 Months Plan',
    price_inr: 2400,
    duration: '6 Months Access',
    displayPrice: '₹2,400 / 6 months'
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price_inr: 4800,
    duration: '1 Year Access',
    displayPrice: '₹4,800 / year'
  }
];

const PREMIUM_FEATURES = [
  {
    title: 'Everything in Free Plan',
    desc: 'Map Dashboard, Live Thermal Observations, Data Explorer, Data Sources Transparency and General Settings'
  },
  {
    title: 'Temporal Analysis',
    desc: 'Time-based hotspot patterns and trends',
    icon: TrendingUp
  },
  {
    title: 'Industrial Infrastructure',
    desc: 'Detailed industrial facility analysis',
    icon: Factory
  },
  {
    title: 'Thermal Incidents',
    desc: 'Advanced incident intelligence',
    icon: Flame
  },
  {
    title: 'Historical Thermal Replay',
    desc: 'Past thermal observations and timeline analysis',
    icon: Clock
  },
  {
    title: 'Multi-Satellite Intelligence',
    desc: 'Combined satellite intelligence',
    icon: Layers
  },
  {
    title: 'Incident Comparison',
    desc: 'Compare incidents side-by-side',
    icon: ArrowRightLeft
  },
  {
    title: 'Data Provenance',
    desc: 'Source, quality and verification information',
    icon: FileText
  },
  {
    title: 'Dynamic Analytics',
    desc: 'Advanced analytics and trends',
    icon: BarChart3
  },
  {
    title: 'Evidence Intelligence',
    desc: 'Evidence and confidence analysis',
    icon: Cpu
  },
  {
    title: 'System Health',
    desc: 'Platform and data pipeline information',
    icon: Activity
  }
];

const formatTimestamp = (raw?: string | null): string => {
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

interface Props {
  featureTitle?: string;
  featureDescription?: string;
  isModal?: boolean;
  onClose?: () => void;
}

export const PremiumAccessRequired: React.FC<Props> = ({
  featureTitle,
  featureDescription,
  isModal = false,
  onClose
}) => {
  const { user } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'six_months' | 'yearly'>('six_months');
  const [statusData, setStatusData] = useState<SubscriptionStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Request & Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [requestMsg, setRequestMsg] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Contact Admin modal state
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sendingContact, setSendingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  // View Request Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Change Plan states
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [pendingNewPlanId, setPendingNewPlanId] = useState<'monthly' | 'six_months' | 'yearly'>('six_months');
  const [showConfirmPlanModal, setShowConfirmPlanModal] = useState(false);
  const [changingPlanSubmitting, setChangingPlanSubmitting] = useState(false);

  const handleConfirmPlanChange = async () => {
    if (!pendingNewPlanId) return;
    setChangingPlanSubmitting(true);
    setRequestError(null);
    setRequestMsg(null);
    try {
      await apiService.changeSubscriptionPlan(pendingNewPlanId);
      setRequestMsg('Your subscription plan request has been successfully updated.');
      setShowConfirmPlanModal(false);
      setIsChangingPlan(false);
      await fetchStatus();
    } catch (err: any) {
      setRequestError(err.response?.data?.detail || 'Failed to update subscription plan.');
      setShowConfirmPlanModal(false);
    } finally {
      setChangingPlanSubmitting(false);
    }
  };

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await apiService.getMySubscriptionStatus();
      setStatusData(data);
    } catch (e) {
      console.warn('Failed to fetch subscription status:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRequestAccess = async () => {
    setSubmitting(true);
    setRequestMsg(null);
    setRequestError(null);
    try {
      await apiService.requestSubscription(selectedPlanId);
      setRequestMsg('Your Premium Access request has been submitted to Admin for approval.');
      await fetchStatus();
    } catch (err: any) {
      setRequestError(err.response?.data?.detail || 'Failed to submit Premium request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendContactAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingContact(true);
    setContactSuccess(null);
    try {
      await apiService.submitFeedback({
        category: 'Subscription / Premium Access',
        title: contactSubject || 'Subscription Query / Upgrade Assistance',
        description: contactMessage,
        priority: 'High'
      });
      setContactSuccess('Your message has been sent to the System Administrator.');
      setContactMessage('');
      setContactSubject('');
      setTimeout(() => {
        setIsContactOpen(false);
        setContactSuccess(null);
      }, 2500);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to send message to Admin.');
    } finally {
      setSendingContact(false);
    }
  };

  const [showSubmitPaymentModal, setShowSubmitPaymentModal] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'conversation' | 'plans'>('overview');
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [cancellingSub, setCancellingSub] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const latestSub = statusData?.latest_subscription || null;
  const activeSub = statusData?.is_premium_active ? (statusData.active_subscription || latestSub) : null;
  const pendingSub = latestSub?.status === 'PENDING' ? latestSub : null;
  const discussionSub = latestSub?.status === 'PAYMENT_DISCUSSION' ? latestSub : null;
  const verificationPendingSub = latestSub?.status === 'PAYMENT_VERIFICATION_PENDING' ? latestSub : null;
  const actionRequiredSub = latestSub?.status === 'PAYMENT_ACTION_REQUIRED' ? latestSub : null;
  const rejectedSub = latestSub?.status === 'REJECTED' ? latestSub : null;
  const expiredSub = statusData?.status === 'EXPIRED' ? latestSub : null;
  const cancelledSub = latestSub?.status === 'CANCELLED' ? latestSub : null;
  const selectedNewPlan = PLANS.find(p => p.id === pendingNewPlanId) || PLANS[0];
  const activeSubItem = discussionSub || verificationPendingSub || actionRequiredSub || pendingSub;

  const handleConfirmCancelRequest = async () => {
    if (!activeSubItem || cancellingSub) return;
    setCancellingSub(true);
    setCancelError(null);
    try {
      await apiService.cancelSubscriptionRequest(activeSubItem.id);
      setShowCancelConfirmModal(false);
      setActiveView('overview');
      await fetchStatus();
    } catch (err: any) {
      setCancelError(err.response?.data?.detail || 'Failed to cancel subscription request.');
    } finally {
      setCancellingSub(false);
    }
  };


  const contentMarkup = (
    <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-amber-500/30 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden text-slate-900 dark:text-slate-100 max-w-5xl w-full mx-auto select-none">
      {/* Background Subtle Glowing Accents */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER WITH CLOSE BUTTON (IF MODAL) */}
      <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] shrink-0">
            <Crown className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Upgrade to Premium Access
              </h1>
              <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-500/30 font-mono">
                11 PREMIUM FEATURES
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Unlock advanced ThermalTrace AI intelligence tools
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* REJECTED / EXPIRED / SUCCESS NOTIFICATIONS */}
      {rejectedSub && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-300 text-xs font-semibold space-y-1">
          <div className="flex items-center space-x-2 font-bold text-red-800 dark:text-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>Subscription Request Rejected</span>
          </div>
          {rejectedSub.rejection_reason && (
            <p className="text-[11px] font-mono pl-6 text-red-600 dark:text-red-300">
              Reason: {rejectedSub.rejection_reason}
            </p>
          )}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6 pt-0.5">
            You may select a plan below to submit a new access request.
          </p>
        </div>
      )}

      {expiredSub && (
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-700 dark:text-cyan-300 text-xs font-semibold flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-cyan-500" />
          <div>
            <div className="font-bold text-cyan-800 dark:text-cyan-200">Premium Access Expired</div>
            <div>Your previous Premium subscription has expired. Select a plan below to request Premium access again.</div>
          </div>
        </div>
      )}

      {cancelledSub && (
        <div className="p-4 bg-slate-500/10 border border-slate-500/30 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-3">
          <Info className="w-5 h-5 shrink-0 text-slate-400" />
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">Previous Request Cancelled</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Your previous subscription request was cancelled. You may select a plan below to submit a new request.</div>
          </div>
        </div>
      )}

      {requestMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" />
          <span>{requestMsg}</span>
        </div>
      )}

      {requestError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-300 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{requestError}</span>
        </div>
      )}

      {/* 2-COLUMN DESKTOP / 1-COLUMN MOBILE MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-1">
        {/* LEFT SIDE: WHAT YOU GET WITH PREMIUM */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              What you get with Premium
            </h2>
          </div>

          <div className="space-y-3 custom-scrollbar max-h-[380px] overflow-y-auto pr-1">
            {PREMIUM_FEATURES.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 hover:border-amber-500/30 transition"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {feat.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: STATUS CARD (IF ACTIVE, DISCUSSION, PENDING, VERIFICATION PENDING, ACTION REQUIRED) OR CHOOSE A PLAN FORM */}
        <div className="space-y-5 flex flex-col justify-between">
          {activeSub ? (
            <PremiumConfirmationCard subscription={activeSub} onExploreFeatures={onClose} />
          ) : activeView === 'conversation' && activeSubItem ? (
            <div className="space-y-4 h-full flex flex-col justify-between">
              <PaymentChatWindow
                subscriptionId={activeSubItem.id}
                showPaidButton={activeSubItem.status === 'PAYMENT_DISCUSSION' || activeSubItem.status === 'PAYMENT_ACTION_REQUIRED'}
                onPaidClick={() => setShowSubmitPaymentModal(true)}
                onBack={() => setActiveView('overview')}
              />
            </div>
          ) : activeView === 'plans' && activeSubItem ? (
            <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-orange-500/10 border border-amber-500/40 rounded-2xl space-y-4 shadow-lg flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Subscription Plans
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView('overview')}
                    className="text-xs font-bold text-amber-500 hover:text-amber-400 transition cursor-pointer flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Discussion</span>
                  </button>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 font-medium">
                  Your plan is locked while payment discussion is in progress.
                </div>

                <div className="space-y-3">
                  {PLANS.map((plan) => {
                    const isCurrent = activeSubItem.plan_id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                          isCurrent
                            ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 shadow-md opacity-100'
                            : 'bg-slate-900/60 dark:bg-slate-950/80 border-slate-700/60 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center space-x-2">
                            <span>{plan.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
                                CURRENT PLAN (LOCKED)
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                            {plan.displayPrice}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {plan.duration}
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isCurrent
                              ? 'border-amber-500 bg-amber-500 text-slate-950'
                              : 'border-slate-400 dark:border-slate-700 bg-transparent'
                          }`}
                        >
                          {isCurrent && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveView('overview')}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer uppercase tracking-wider shadow-md flex items-center justify-center space-x-2"
                >
                  <span>RETURN TO PAYMENT DISCUSSION</span>
                </button>

                {activeSubItem.status === 'PAYMENT_VERIFICATION_PENDING' ? (
                  <p className="text-[11px] text-amber-400 font-semibold text-center pt-1">
                    Payment verification is already pending. Please contact Admin before cancelling this request.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelError(null);
                      setShowCancelConfirmModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>CANCEL SUBSCRIPTION REQUEST</span>
                  </button>
                )}
              </div>
            </div>
          ) : discussionSub ? (
            <div className="space-y-4 p-6 bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-orange-500/10 border border-amber-500/40 rounded-2xl shadow-xl flex flex-col justify-between h-full">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setActiveView('plans')}
                  className="flex items-center space-x-1.5 text-xs font-bold text-amber-500 hover:text-amber-400 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to Premium Plans</span>
                </button>

                <div className="flex items-center space-x-2 text-xs font-black text-amber-500 uppercase tracking-wider">
                  <Crown className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span>PAYMENT DISCUSSION IN PROGRESS</span>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-xs text-slate-300">
                    Requested Plan: <span className="font-extrabold text-amber-400">{discussionSub.plan_name}</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Amount: <span className="font-mono font-extrabold text-amber-400">₹{discussionSub.price_inr?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-medium pt-1">
                    Your private payment conversation with System Administrator is active.
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveView('conversation')}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition cursor-pointer uppercase tracking-wider shadow-md flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>OPEN PAYMENT CONVERSATION</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSubmitPaymentModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition cursor-pointer uppercase tracking-wider shadow-md flex items-center justify-center space-x-2"
                >
                  <span>I HAVE PAID</span>
                </button>
              </div>
            </div>
          ) : verificationPendingSub ? (
            <div className="space-y-4 p-6 bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-orange-500/10 border border-amber-500/40 rounded-2xl shadow-xl flex flex-col justify-between h-full">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setActiveView('plans')}
                  className="flex items-center space-x-1.5 text-xs font-bold text-amber-500 hover:text-amber-400 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to Premium Plans</span>
                </button>

                <div className="flex items-center space-x-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                  <Clock className="w-5 h-5 animate-spin text-amber-500" />
                  <span>👑 PAYMENT VERIFICATION PENDING</span>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-xs text-slate-300">
                    Transaction Reference / UTR: <span className="font-mono font-extrabold text-amber-400">{verificationPendingSub.utr_reference}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-medium pt-1">
                    Your payment details have been submitted and are waiting for manual Admin verification.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveView('conversation')}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition cursor-pointer uppercase tracking-wider shadow-md flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>OPEN PAYMENT CONVERSATION</span>
                </button>
              </div>
            </div>
          ) : actionRequiredSub ? (
            <div className="space-y-4 p-6 bg-red-500/15 border border-red-500/40 rounded-2xl shadow-xl flex flex-col justify-between h-full">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setActiveView('plans')}
                  className="flex items-center space-x-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to Premium Plans</span>
                </button>

                <div className="flex items-center space-x-2 text-xs font-black text-red-400 uppercase tracking-wider">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span>ACTION REQUIRED BY ADMIN</span>
                </div>

                <div className="p-4 bg-slate-900/80 border border-red-500/30 rounded-xl space-y-2">
                  <div className="text-xs text-red-200 font-semibold">
                    Reason: {actionRequiredSub.resubmit_reason || 'Please check your transaction reference and resubmit.'}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveView('conversation')}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition cursor-pointer uppercase tracking-wider shadow-md flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>OPEN PAYMENT CONVERSATION</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSubmitPaymentModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs transition cursor-pointer uppercase tracking-wider shadow-md flex items-center justify-center space-x-2"
                >
                  <span>RESUBMIT PAYMENT INFORMATION</span>
                </button>
              </div>
            </div>
          ) : pendingSub ? (
            isChangingPlan ? (
              /* CHANGE PLAN SELECTION UI */
              <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-orange-500/10 border border-amber-500/40 rounded-2xl space-y-4 shadow-lg flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Change Premium Plan
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsChangingPlan(false)}
                      className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-3">
                    {PLANS.map((plan) => {
                      const isCurrent = pendingSub.plan_id === plan.id;
                      const isSelected = pendingNewPlanId === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setPendingNewPlanId(plan.id as any)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 shadow-md'
                              : 'bg-slate-900/60 dark:bg-slate-950/80 border-slate-700/60 hover:border-amber-500/30'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center space-x-2">
                              <span>{plan.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
                                  CURRENT REQUEST
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                              {plan.displayPrice}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {plan.duration}
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500 text-slate-950'
                                : 'border-slate-400 dark:border-slate-700 bg-transparent'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPlan(false)}
                    className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (pendingNewPlanId === pendingSub.plan_id) {
                        setIsChangingPlan(false);
                      } else {
                        setShowConfirmPlanModal(true);
                      }
                    }}
                    className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer uppercase tracking-wider shadow-md"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              /* PENDING STATE STATUS CARD */
              <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-orange-500/10 border border-amber-500/40 rounded-2xl space-y-4 shadow-lg flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center shrink-0">
                      <Crown className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                        <span>👑 PREMIUM REQUEST PENDING</span>
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Your request has been sent to Admin for approval.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/60 dark:bg-slate-950/80 p-4 rounded-xl border border-amber-500/20">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Selected Plan</span>
                      <span className="font-black text-amber-500 text-sm">
                        {pendingSub.plan_name} — ₹{pendingSub.price_inr?.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Status</span>
                      <span className="font-extrabold text-amber-400 text-xs flex items-center space-x-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 animate-spin text-amber-500" />
                        <span>Pending Admin Approval</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    After Admin approval, Premium features will be activated for your account.
                  </p>
                </div>

                {/* ACTION BUTTONS: CHANGE PLAN, VIEW REQUEST STATUS & CONTACT ADMIN */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingNewPlanId((pendingSub.plan_id as any) || 'monthly');
                      setIsChangingPlan(true);
                    }}
                    className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-md uppercase tracking-wider"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Change Plan</span>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDetailsModal(true)}
                      className="py-3 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-extrabold rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Request Status</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsContactOpen(true)}
                      className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-extrabold rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                      <span>Contact Admin</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* STANDARD CHOOSE A PLAN FORM (WHEN NOT PENDING) */
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      Choose a Plan
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                    No Online Payment Required
                  </span>
                </div>

                {/* PLAN CARDS */}
                <div className="space-y-3">
                  {PLANS.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all relative flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40 shadow-md'
                            : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-amber-500/30'
                        }`}
                      >
                        {plan.id === 'six_months' && (
                          <span className="absolute -top-2.5 right-4 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-sm">
                            MOST POPULAR
                          </span>
                        )}

                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            {plan.name}
                          </div>
                          <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                            {plan.displayPrice}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {plan.duration}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500 text-slate-950'
                                : 'border-slate-300 dark:border-slate-700 bg-transparent'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium pt-1">
                  Select a plan and request Premium Access. Your request will be sent to Admin for approval.
                </p>
              </div>

              {/* CTAs & FOOTER */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleRequestAccess}
                  disabled={submitting}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 uppercase tracking-wider"
                >
                  <Crown className="w-4 h-4" />
                  <span>{submitting ? 'Submitting Request...' : 'Request Premium Access'}</span>
                </button>

                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 font-medium">
                  After Admin approval, all Premium features will be activated for your account.
                </p>

                <div className="flex items-center justify-center space-x-2 pt-1 text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">OR</span>
                  <button
                    type="button"
                    onClick={() => setIsContactOpen(true)}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-bold underline cursor-pointer flex items-center space-x-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Contact Admin</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* VIEW REQUEST STATUS DETAILS MODAL */}
      {showDetailsModal && pendingSub && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[800] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-slate-900 dark:text-white text-sm">Subscription Request Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-sans">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <span className="text-slate-500 font-medium">Selected Plan:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white capitalize">{pendingSub.plan_name}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <span className="text-slate-500 font-medium">Subscription Price:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono">₹{pendingSub.price_inr?.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <span className="text-slate-500 font-medium">Request Status:</span>
                  <span className="font-extrabold text-amber-500 font-mono flex items-center space-x-1">
                    <Clock className="w-3 h-3 animate-spin" />
                    <span>{pendingSub.status} (Pending Approval)</span>
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Requested Date:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {formatTimestamp(pendingSub.requested_at || pendingSub.created_at)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Admin Review Process</span>
                </div>
                <div>Your request is stored securely in the database. Administrators review and approve access requests. No duplicate submission is required.</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM PLAN CHANGE MODAL */}
      {showConfirmPlanModal && pendingSub && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[850] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-slate-900 dark:text-white text-sm">Change Premium Plan</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmPlanModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-sans">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <span className="text-slate-500 font-medium">Current Plan:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white capitalize">
                    {pendingSub.plan_name} — ₹{pendingSub.price_inr?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">New Plan:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                    {selectedNewPlan.name} — ₹{selectedNewPlan.price_inr?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Your existing pending request will be updated to the new plan. No duplicate request will be created.
              </p>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmPlanModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmPlanChange}
                disabled={changingPlanSubmitting}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition cursor-pointer disabled:opacity-50 uppercase tracking-wider shadow-md"
              >
                {changingPlanSubmitting ? 'Updating Plan...' : 'Confirm Plan Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT ADMIN MODAL */}
      {isContactOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[800] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Contact System Administrator</h3>
              </div>
              <button onClick={() => setIsContactOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {contactSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 font-semibold">
                {contactSuccess}
              </div>
            )}

            <form onSubmit={handleSendContactAdmin} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder={`e.g. Query regarding pending Premium Access request`}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Message Details</label>
                <textarea
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Type your message or subscription inquiry for System Administrator..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsContactOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingContact}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingContact ? 'Sending...' : 'Send to Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL SUBSCRIPTION REQUEST CONFIRMATION MODAL */}
      {showCancelConfirmModal && activeSubItem && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[800] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs select-none">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Cancel Premium Request?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              This will stop your current Premium subscription request and payment discussion.
            </p>

            <div className="p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Current Request</div>
              <div className="text-xs font-black text-amber-500">
                {activeSubItem.plan_name} — ₹{activeSubItem.price_inr?.toLocaleString('en-IN')}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
              Your existing payment conversation will be preserved as read-only and this request cannot continue.
            </p>

            {cancelError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
                {cancelError}
              </div>
            )}

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelRequest}
                disabled={cancellingSub}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black disabled:opacity-50 cursor-pointer shadow-md uppercase tracking-wider text-[11px]"
              >
                {cancellingSub ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT PAYMENT MODAL */}
      {showSubmitPaymentModal && activeSubItem && (
        <PaymentSubmissionModal
          subscription={activeSubItem}
          isOpen={showSubmitPaymentModal}
          onClose={() => setShowSubmitPaymentModal(false)}
          onSuccess={() => fetchStatus()}
        />
      )}
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-[700] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        {contentMarkup}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 text-slate-900 dark:text-slate-100 min-h-full flex flex-col justify-center">
      {contentMarkup}
    </div>
  );
};
