import React, { useState } from 'react';
import { FileText, Upload, Check, AlertCircle, ShieldAlert, X, Image as ImageIcon } from 'lucide-react';
import { apiService } from '../../services/api';
import { SubscriptionItem } from '../../types';

interface Props {
  subscription: SubscriptionItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentSubmissionModal: React.FC<Props> = ({
  subscription,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [utrReference, setUtrReference] = useState(subscription.utr_reference || '');
  const [proofBase64, setProofBase64] = useState<string | null>(subscription.payment_proof_screenshot || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a valid JPEG, PNG, or WebP screenshot image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size exceeds the 5 MB limit.');
      return;
    }

    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setProofBase64(reader.result as string);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrReference.trim();
    if (cleanUtr.length < 6 || cleanUtr.length > 50) {
      setError('Transaction Reference / UTR must be between 6 and 50 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiService.submitPaymentInfo(subscription.id, {
        utr_reference: cleanUtr,
        payment_proof_screenshot: proofBase64
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit payment details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[850] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 text-xs text-slate-900 dark:text-slate-100">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">
              Submit Payment Information
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUMMARY CARD */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
            <span className="text-slate-500 font-medium">Selected Plan:</span>
            <span className="font-extrabold text-slate-900 dark:text-white">{subscription.plan_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Amount:</span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-sm">
              ₹{subscription.price_inr?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-300 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* UTR FIELD */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
              Transaction Reference / UTR <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={utrReference}
              onChange={(e) => setUtrReference(e.target.value)}
              placeholder="e.g. 427819024189 or IMPS-29104812"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs tracking-wide focus:outline-none focus:border-amber-500"
            />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
              Enter the bank/UPI reference number (UTR / IMPS / Reference ID) of your external payment.
            </span>
          </div>

          {/* PROOF UPLOAD FIELD */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
              Payment Proof Screenshot (Optional)
            </label>
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-950/50">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center space-y-1.5">
                <Upload className="w-6 h-6 text-amber-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {fileName ? fileName : proofBase64 ? 'Screenshot Attached (Click to replace)' : 'Click or Drag to Upload Payment Proof'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Supported: JPEG, PNG, WebP (Max 5 MB)
                </span>
              </div>
            </div>

            {proofBase64 && (
              <div className="mt-2.5 p-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Proof Preview Attached</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setProofBase64(null); setFileName(null); }}
                  className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-0.5 rounded cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] space-y-1">
            <div className="font-bold flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Manual Admin Verification</span>
            </div>
            <div>Submitting payment information requires manual verification by an Administrator before Premium Access is activated.</div>
          </div>

          {/* ACTIONS */}
          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !utrReference.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition cursor-pointer disabled:opacity-50 uppercase tracking-wider shadow-md flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{submitting ? 'Submitting...' : 'Submit for Verification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
