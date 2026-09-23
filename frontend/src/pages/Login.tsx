import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Users,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Database,
  Radio,
  Flame,
  AlertTriangle,
  Shield,
  Leaf
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { SystemHealth } from '../types';
import { AccountHelpModal } from '../components/Landing/AccountHelpModal';
import { RoleExplanationCards, RoleMode } from '../components/Landing/RoleExplanationCards';
import refineryBg from '../assets/refinery_hero_bg.jpg';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [activeRoleMode, setActiveRoleMode] = useState<RoleMode>('user');

  // Sign In State - ALWAYS EMPTY ON FRESH LOAD
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State - ALWAYS EMPTY ON FRESH LOAD
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Help Modal & Health State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiService.getSystemHealth()
      .then((data) => {
        if (isMounted) setHealth(data);
      })
      .catch((err) => {
        console.warn('System health telemetry fetch:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isLive = Boolean(
    health &&
      (health.status?.toLowerCase() === 'healthy' ||
        health.status?.toLowerCase() === 'ok' ||
        health.status?.toLowerCase() === 'operational' ||
        health.database?.status?.toLowerCase() === 'healthy' ||
        health.database?.status?.toLowerCase() === 'connected')
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Database-driven login: payload passes ONLY email and password
      const authenticatedUser = await login(loginEmail, loginPassword);
      const userRole = (authenticatedUser.role || '').toLowerCase();

      // Automatic redirection based strictly on DB User.role
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'authority') {
        navigate('/authority');
      } else if (userRole === 'user') {
        navigate('/dashboard');
      } else if (userRole === 'analyst') {
        navigate('/');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Authentication failed. Please verify your credentials.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupFullName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      setError('Please fill in all registration fields.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Backend forces role = USER for public signup
      const newUser = await signup(signupFullName, signupEmail, signupPassword);
      const userRole = (newUser.role || '').toLowerCase();

      if (userRole === 'user' || userRole === '') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Registration failed. Please try a different email address.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const getRoleHeader = () => {
    if (mode === 'signup') {
      return {
        title: 'Create Public Account',
        subtitle: 'Sign up for public thermal intelligence access',
        badge: 'USER ROLE',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    }

    switch (activeRoleMode) {
      case 'analyst':
        return {
          title: 'Analyst Workspace',
          subtitle: 'Investigate and analyse industrial thermal anomalies',
          badge: 'ANALYST ACCESS',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
        };
      case 'authority':
        return {
          title: 'Authority Workspace',
          subtitle: 'Monitor regulatory oversight and compliance',
          badge: 'AUTHORITY ACCESS',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      case 'admin':
        return {
          title: 'Administrator Workspace',
          subtitle: 'Manage platform operations and satellite data pipeline',
          badge: 'ADMIN ACCESS',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200'
        };
      case 'user':
      default:
        return {
          title: 'Welcome Back',
          subtitle: 'Sign in to access your ThermalTrace AI workspace.',
          badge: 'PUBLIC USER ACCESS',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
        };
    }
  };

  const roleHeader = getRoleHeader();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none box-border">
      {/* 1. Full-Bleed High-Resolution Industrial Refinery Image (100% viewport) */}
      <img
        src={refineryBg}
        alt="Industrial Satellite Surveillance Refinery"
        className="absolute inset-0 w-full h-full object-cover object-[40%_center] pointer-events-none filter contrast-[1.05] brightness-[0.95]"
      />

      {/* 2. Controlled Gradient Overlays (ensures contrast behind left hero text while keeping refinery visible behind right card) */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-slate-950/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/80 pointer-events-none" />

      {/* 3. Main Interactive Viewport Layer */}
      <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-6 xl:p-8 overflow-hidden">
        
        {/* TOP BRANDING & TELEMETRY HEADER */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 p-2 rounded-2xl shadow-lg shadow-orange-500/20 text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold text-white tracking-tight">ThermalTrace</span>
                <span className="text-xl font-extrabold text-orange-500">AI</span>
                <span className="bg-slate-900/90 text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/40">
                  SIH26162
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium hidden sm:block">
                Satellite-Based Industrial Thermal Anomaly Intelligence Platform
              </p>
            </div>
          </div>

          {/* Compact Satellite Telemetry Badge (Top Right) */}
          <div className="hidden sm:flex items-center space-x-2.5 bg-slate-950/80 border border-cyan-500/40 px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-2xl">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <div>
              <div className="text-[11px] font-mono font-extrabold text-cyan-400 tracking-wider">
                NOAA-20 / NOAA-21
              </div>
              <div className="text-[10px] text-slate-300 font-medium leading-none">
                VIIRS Thermal Sensing
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE GRID SECTION: LEFT HERO + RIGHT FLOATING CARD */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center overflow-hidden my-2 sm:my-3">
          
          {/* LEFT HERO CONTENT & ROLE CARDS (Col-span 7) */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between h-full py-1 sm:py-2 max-w-2xl">
            {/* Top Hero Section */}
            <div>
              {/* Category Tag Badge */}
              <div className="mb-2 sm:mb-2.5">
                <div className="inline-flex items-center space-x-2 bg-slate-950/85 px-3 py-1.5 rounded-full border border-orange-500/40 text-xs font-mono font-bold tracking-widest text-orange-400 uppercase backdrop-blur-md shadow-lg">
                  <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>SATELLITE THERMAL INTELLIGENCE • SIH26162</span>
                </div>
              </div>

              {/* Main Headline */}
              <h1 className="text-[clamp(30px,4.2vh,46px)] font-extrabold tracking-tight leading-[1.08] max-w-[540px]">
                <span className="text-white block">Detect thermal</span>
                <span className="text-white block">anomalies. Investigate</span>
                <span className="text-orange-500 font-extrabold block">
                  industrial heat intelligently.
                </span>
              </h1>

              {/* Subtitle Description */}
              <p className="mt-2.5 text-[clamp(12px,1.4vh,15px)] text-slate-200 font-normal leading-relaxed max-w-lg">
                Real satellite thermal observations, industrial context, historical analysis and evidence-based investigation for abnormal heat activity.
              </p>
            </div>

            {/* Bottom Role Cards Section */}
            <div className="mt-auto pt-3">
              <RoleExplanationCards
                activeRoleMode={activeRoleMode}
                onSelectRole={(selectedRole) => {
                  setActiveRoleMode(selectedRole);
                  setError(null);
                  if (selectedRole !== 'user') {
                    setMode('signin');
                  }
                }}
              />
            </div>
          </div>

          {/* RIGHT FLOATING TRANSLUCENT LOGIN CARD (Col-span 5) */}
          <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end items-center h-full">
            <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-xl border border-white/60 rounded-[28px] p-5 sm:p-6 shadow-2xl text-slate-900 flex flex-col justify-between space-y-3.5">
              
              {/* Card Header Row: Branding Logo + Live NASA FIRMS Indicator */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600">
                    <Flame className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold tracking-tight">ThermalTrace AI</span>
                </div>

                <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200/80 font-bold text-[10px] shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </span>
                  <span>Live Data • NASA FIRMS</span>
                </div>
              </div>

              {/* Role Title & Badge Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-mono ${roleHeader.badgeClass}`}>
                    {roleHeader.badge}
                  </span>
                  {mode === 'signin' && activeRoleMode !== 'user' && (
                    <button
                      type="button"
                      onClick={() => { setActiveRoleMode('user'); setError(null); }}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline font-medium"
                    >
                      Switch to Public Mode
                    </button>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {roleHeader.title}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {roleHeader.subtitle}
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5 text-xs text-red-700">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Sign In / Sign Up Form */}
              {mode === 'signin' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs sm:text-sm">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Options row */}
                  <div className="flex items-center justify-between text-slate-600 pt-0.5">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="font-semibold text-[11px]">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsHelpOpen(true)}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] transition"
                    >
                      Need account help?
                    </button>
                  </div>

                  {/* Primary CTA */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center space-x-2 mt-1"
                  >
                    <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>

                  {/* Role Specific Actions or Public Signup */}
                  {activeRoleMode === 'user' ? (
                    <>
                      <div className="relative flex py-0.5 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400">New here?</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                      </div>

                      <button
                        type="button"
                        onClick={() => { setMode('signup'); setError(null); }}
                        className="w-full bg-slate-50 hover:bg-slate-100 text-blue-700 font-bold py-2 rounded-xl text-xs border border-blue-200/90 transition text-center"
                      >
                        Create an Account (Public User)
                      </button>
                    </>
                  ) : (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-800 block">
                        {activeRoleMode === 'analyst' && 'Analyst Credentials Required'}
                        {activeRoleMode === 'authority' && 'Authority Credentials Required'}
                        {activeRoleMode === 'admin' && 'Administrator Credentials Required'}
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {activeRoleMode === 'analyst' && 'Authorized analysts can sign in using their assigned credentials.'}
                        {activeRoleMode === 'authority' && 'Authorized authority personnel can sign in using their assigned credentials.'}
                        {activeRoleMode === 'admin' && 'Authorized administrators can sign in using their assigned credentials.'}
                      </p>
                    </div>
                  )}
                </form>
              ) : (
                /* Public Signup Form */
                <form onSubmit={handleSignupSubmit} className="space-y-2 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="ramesh@gmail.com"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center space-x-2 mt-1"
                  >
                    <span>{loading ? 'Creating Account...' : 'Create Public Account'}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>

                  <div className="relative flex py-0.5 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-semibold text-slate-400">Already have an account?</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null); }}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-1.5 rounded-xl text-xs border border-slate-300 transition text-center"
                  >
                    Back to Sign In
                  </button>
                </form>
              )}

              {/* Security Footnote */}
              <div className="pt-1.5 border-t border-slate-100 text-center space-y-0.5 bg-slate-50/80 p-2 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-center space-x-1.5 text-[11px] font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Secure Role-Based Access</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight max-w-xs mx-auto font-medium">
                  Authorized personnel sign in with assigned credentials.
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* BOTTOM HERO DATA STRIP */}
        <div className="shrink-0 pt-1.5 pb-0 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs font-medium text-slate-400">
          <div className="flex items-center space-x-5 sm:space-x-7">
            <div className="flex items-center space-x-1.5">
              <Database className="w-3 h-3 text-blue-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block text-[11px] leading-none">NASA FIRMS</span>
                <span className="text-[9.5px] text-slate-400 leading-none">Real Satellite Data</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <Radio className="w-3 h-3 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block text-[11px] leading-none">NOAA-20 / NOAA-21</span>
                <span className="text-[9.5px] text-slate-400 leading-none">Thermal Observations</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-1.5">
              <Shield className="w-3 h-3 text-orange-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block text-[11px] leading-none">Secure Role Access</span>
                <span className="text-[9.5px] text-slate-400 leading-none">Authorized Workspaces</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/team')}
              className="flex items-center space-x-1.5 text-cyan-400 hover:text-cyan-300 font-bold text-[11px] transition cursor-pointer group"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="hover:underline">Meet the Team</span>
              <ArrowRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="text-[10.5px] italic text-slate-400 hidden lg:block">
            <Leaf className="w-3 h-3 text-emerald-400 inline mr-1" />
            <span>A Cleaner India • A Safer Tomorrow</span>
          </div>
        </div>

      </div>

      {/* Account Help Modal */}
      <AccountHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
