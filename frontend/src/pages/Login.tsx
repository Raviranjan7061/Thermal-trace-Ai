import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Users,
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
  const { login, loginWithGoogle, signup, logout, resetPassword } = useAuth();

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
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError('Please enter your email address.');
      return;
    }
    setResetLoading(true);
    setResetError(null);
    setResetMsg(null);
    try {
      await resetPassword(resetEmail);
      setResetMsg(`Firebase Password Reset email sent to ${resetEmail}. Check your inbox.`);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

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

      // Strict post-login role mismatch check
      if (activeRoleMode !== 'user' && userRole !== activeRoleMode) {
        await logout();
        const roleNames: Record<string, string> = {
          analyst: 'Analyst',
          authority: 'Authority',
          admin: 'Admin'
        };
        setError(`This account does not have ${roleNames[activeRoleMode] || activeRoleMode} access.`);
        return;
      }

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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // Real Firebase Google Popup Authentication
      const authenticatedUser = await loginWithGoogle();
      const userRole = (authenticatedUser.role || '').toLowerCase();

      // Strict post-login role mismatch check
      if (activeRoleMode !== 'user' && userRole !== activeRoleMode) {
        await logout();
        const roleNames: Record<string, string> = {
          analyst: 'Analyst',
          authority: 'Authority',
          admin: 'Admin'
        };
        setError(`This Google account does not have ${roleNames[activeRoleMode] || activeRoleMode} access.`);
        return;
      }

      // Automatic redirection based on User.role
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'authority') {
        navigate('/authority');
      } else if (userRole === 'user') {
        navigate('/dashboard');
      } else if (userRole === 'analyst') {
        navigate('/');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Firebase Google Sign-In Error:', err);

      // Handle specific Firebase error codes cleanly
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. The Google authentication popup was closed.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Google sign-in popup was blocked by browser. Please allow popups for this site.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Firebase Auth Error: Domain is not authorized in Firebase Console -> Authentication -> Settings -> Authorized Domains.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Firebase Auth Error: Google Sign-In provider is disabled in Firebase Console -> Authentication -> Sign-in method.');
      } else {
        const detail = err.message || err.response?.data?.detail || 'Google authentication failed. Verification could not be completed.';
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRoleMode === 'admin') {
      setError('Administrator accounts cannot be created publicly.');
      return;
    }

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
      // Backend forces role = USER for public signup, but for UI reviewer flows, navigate to corresponding workspace
      const newUser = await signup(signupFullName, signupEmail, signupPassword);
      
      if (activeRoleMode === 'authority') {
        navigate('/authority');
      } else if (activeRoleMode === 'analyst') {
        navigate('/');
      } else {
        navigate('/dashboard');
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
      switch (activeRoleMode) {
        case 'analyst':
          return {
            title: 'Create Analyst Account',
            subtitle: 'Sign up for analyst thermal intelligence workspace',
            badge: 'ANALYST ROLE',
            badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
          };
        case 'authority':
          return {
            title: 'Create Authority Account',
            subtitle: 'Sign up for authority regulatory oversight workspace',
            badge: 'AUTHORITY ROLE',
            badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
          };
        case 'user':
        default:
          return {
            title: 'Create Public Account',
            subtitle: 'Sign up for public thermal intelligence access',
            badge: 'USER ROLE',
            badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
          };
      }
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
    <div className={`relative w-screen min-h-screen overflow-y-auto custom-scrollbar bg-slate-950 font-sans text-slate-100 select-none box-border`}>
      {/* 1. Full-Bleed High-Resolution Industrial Refinery Image (100% viewport) */}
      <img
        src={refineryBg}
        alt="Industrial Satellite Surveillance Refinery"
        className="fixed inset-0 w-full h-full object-cover object-[40%_center] pointer-events-none filter contrast-[1.05] brightness-[0.95]"
      />

      {/* 2. Controlled Gradient Overlays (ensures contrast behind left hero text while keeping refinery visible behind right card) */}
      <div className="fixed inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-slate-950/20 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/80 pointer-events-none" />

      {/* 3. Main Interactive Viewport Layer */}
      <div className={`relative z-10 ${mode === 'signup' ? 'min-h-screen py-4' : 'h-full'} flex flex-col justify-between p-4 sm:p-6 xl:p-8`}>
        
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
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start my-2 sm:my-3">
          
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
                  setMode('signin');
                  setError(null);
                }}
              />
            </div>
          </div>

          {/* RIGHT FLOATING TRANSLUCENT LOGIN CARD (Col-span 5) */}
          <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end items-start h-full">
            <div className="w-full max-w-[465px] bg-white/95 backdrop-blur-xl border border-white/60 rounded-[28px] p-6 sm:p-7 space-y-3.5 shadow-2xl text-slate-900 flex flex-col justify-between transition-all duration-200 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
              
              {/* Card Header Row: Branding Logo + Live NASA FIRMS Indicator */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600">
                    <Flame className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold tracking-tight text-sm">ThermalTrace AI</span>
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
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {roleHeader.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
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

              {/* Segmented Control Switch (USER, ANALYST, AUTHORITY ONLY) */}
              {activeRoleMode !== 'admin' && (
                <div className="w-full bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/80 flex items-center mb-1">
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null); }}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-150 text-center ${
                      mode === 'signin'
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800 font-medium'
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(null); }}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-150 text-center ${
                      mode === 'signup'
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800 font-medium'
                    }`}
                  >
                    Create account
                  </button>
                </div>
              )}

              {/* Sign In / Sign Up Form */}
              {mode === 'signin' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs sm:text-sm">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">
                      {activeRoleMode === 'admin' ? 'Admin Email / ID' :
                       activeRoleMode === 'analyst' ? 'Analyst Email / ID' :
                       activeRoleMode === 'authority' ? 'Authority Email / ID' :
                       'User Email / ID'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder={
                          activeRoleMode === 'admin' ? 'Enter admin email / ID' :
                          activeRoleMode === 'analyst' ? 'Enter analyst email / ID' :
                          activeRoleMode === 'authority' ? 'Enter authority email / ID' :
                          'Enter your email address'
                        }
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
                    <label className="flex items-center space-x-1.5 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="font-semibold text-[11px] whitespace-nowrap">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => { setResetEmail(loginEmail); setResetMsg(null); setResetError(null); setIsResetOpen(true); }}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] transition whitespace-nowrap cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Primary CTA */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center space-x-2 mt-1"
                  >
                    <span>
                      {loading ? 'Authenticating...' : (
                        activeRoleMode === 'admin' ? 'Admin Sign In' :
                        activeRoleMode === 'analyst' ? 'Analyst Sign In' :
                        activeRoleMode === 'authority' ? 'Authority Sign In' : 'User Sign In'
                      )}
                    </span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>

                  {/* Continue with Google */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleSignIn}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl text-xs sm:text-sm border border-slate-300 transition shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2 mt-2"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* Restricted Admin Notice for Admin mode */}
                  {activeRoleMode === 'admin' && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-800 block">
                        Restricted Administrator Access
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Administrator accounts cannot be created publicly.
                      </p>
                    </div>
                  )}
                </form>
              ) : (
                /* Create Account Form (USER, ANALYST, AUTHORITY) */
                <form onSubmit={handleSignupSubmit} className="space-y-2 text-xs sm:text-sm">
                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-xs">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-xs">
                      {activeRoleMode === 'analyst' ? 'Analyst Email / ID' :
                       activeRoleMode === 'authority' ? 'Authority Email / ID' :
                       'User Email / ID'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder={
                          activeRoleMode === 'analyst' ? 'Enter analyst email / ID' :
                          activeRoleMode === 'authority' ? 'Enter authority email / ID' :
                          'Enter your email address'
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-xs">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5 text-xs">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center space-x-2 mt-1"
                  >
                    <span>
                      {loading
                        ? 'Creating Account...'
                        : activeRoleMode === 'analyst'
                        ? 'Create Analyst Account'
                        : activeRoleMode === 'authority'
                        ? 'Create Authority Account'
                        : 'Create User Account'}
                    </span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>

                  {/* Continue with Google */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleSignIn}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-xl text-xs sm:text-sm border border-slate-300 transition shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2 mt-1.5"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </form>
              )}

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

      {/* Firebase Password Reset Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">Reset Firebase Auth Password</h3>
              </div>
              <button
                onClick={() => setIsResetOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your account email address below. We will send a secure Firebase password reset link to your email.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {resetMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-400">
                  {resetMsg}
                </div>
              )}

              {resetError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-semibold text-red-400">
                  {resetError}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? 'Sending Reset Email...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
