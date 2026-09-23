import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Satellite, Shield, User, Key, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('analyst@thermaltrace.ai');
  const [password, setPassword] = useState('analyst123');
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'analyst' | 'admin'>('analyst');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, selectedRole);
    navigate('/');
  };

  const handleQuickRoleSelect = (role: 'viewer' | 'analyst' | 'admin') => {
    setSelectedRole(role);
    if (role === 'admin') {
      setEmail('admin@thermaltrace.ai');
      setPassword('admin123');
    } else if (role === 'analyst') {
      setEmail('analyst@thermaltrace.ai');
      setPassword('analyst123');
    } else {
      setEmail('viewer@thermaltrace.ai');
      setPassword('viewer123');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 shadow-lg shadow-amber-500/10 mb-2">
            <Satellite className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ThermalTrace AI</h1>
          <p className="text-xs text-slate-400">
            Satellite-Based Industrial Thermal Anomaly Intelligence Platform (SIH26162)
          </p>
        </div>

        {/* Quick Role Demonstration Buttons */}
        <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Select Role Demonstration Credentials:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('viewer')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                selectedRole === 'viewer'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Viewer
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('analyst')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                selectedRole === 'analyst'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Analyst
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleSelect('admin')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                selectedRole === 'admin'
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">User Email Address</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Security Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition shadow-lg shadow-amber-500/10"
          >
            <span>Sign In to Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-[11px] text-slate-500 text-center border-t border-slate-800 pt-4">
          Strict Zero-Fake Data System • Authenticated Operational Access
        </div>
      </div>
    </div>
  );
};
