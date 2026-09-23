import React from 'react';
import { X, ShieldAlert, KeyRound, Mail, UserCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountHelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3>Need Account Help?</h3>
            <p className="text-[11px] text-slate-500 font-normal">ThermalTrace AI Credential Guidance</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200/80 space-y-1">
            <span className="font-bold text-blue-900 flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Public Evaluators & Users</span>
            </span>
            <p className="text-slate-700 text-[11px]">
              Anyone can sign up immediately for a <strong>Public User</strong> account by clicking <em>"Create an Account (Public User)"</em> on the sign-in panel.
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Analyst, Authority & Admin Credentials</span>
            </span>
            <p className="text-slate-600 text-[11px]">
              Operational role privileges are provisioned directly by system administrators via the Admin Console. Roles cannot be self-selected.
            </p>
          </div>

          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 space-y-1">
            <span className="font-bold text-emerald-900 flex items-center space-x-1.5">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>Password Resets & Role Updates</span>
            </span>
            <p className="text-emerald-800 text-[11px]">
              To reset your password or request role access, please contact your ThermalTrace AI System Administrator or email <strong>admin@thermaltrace.ai</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
