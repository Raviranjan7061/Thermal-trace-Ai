import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Map,
  Table,
  TrendingUp,
  Factory,
  CheckSquare,
  AlertOctagon,
  BarChart3,
  Database,
  Cpu,
  Activity,
  Shield,
  ShieldAlert,
  Users,
  Flame,
  Satellite,
  Clock,
  Layers,
  ArrowRightLeft,
  FileText,
  Radio,
  Settings,
  MessageSquare,
  Inbox,
  X,
  Crown
} from 'lucide-react';
import { apiService } from '../../services/api';
import { PremiumAccessRequired } from '../Subscription/PremiumAccessRequired';

const authorityNavSections = [
  {
    title: 'REGULATORY OVERSIGHT',
    items: [
      { path: '/authority', label: 'Authority Monitoring', icon: ShieldAlert },
      { path: '/incidents', label: 'Incident Intelligence', icon: Flame },
      { path: '/industrial-sites', label: 'Industrial Infrastructure', icon: Factory },
      { path: '/alerts', label: 'Operational Alerts', icon: AlertOctagon },
      { path: '/analytics', label: 'Dynamic Analytics', icon: BarChart3 },
    ]
  },
  {
    title: 'COMPLIANCE & TRACEABILITY',
    items: [
      { path: '/authority/audit', label: 'Regulatory Audit Trail', icon: FileText },
      { path: '/data-sources', label: 'Data Sources Transparency', icon: Database },
      { path: '/system-health', label: 'System Health', icon: Activity },
      { path: '/feedback', label: 'Report Issue / Feedback', icon: MessageSquare },
      { path: '/settings', label: 'General Settings', icon: Settings },
    ]
  }
];

// Active Premium User Nav Sections (All features unlocked, no lock badges)
const activeUserNavSections = [
  {
    title: 'PUBLIC INTELLIGENCE',
    items: [
      { path: '/dashboard', label: 'Map Dashboard', icon: Map },
      { path: '/observations', label: 'Live Thermal Observations', icon: Satellite },
      { path: '/explorer', label: 'Data Explorer', icon: Table },
      { path: '/temporal', label: 'Temporal Analysis', icon: TrendingUp },
      { path: '/industrial-sites', label: 'Industrial Infrastructure', icon: Factory },
    ]
  },
  {
    title: 'INTELLIGENCE TOOLS',
    items: [
      { path: '/incidents', label: 'Thermal Incidents', icon: Flame },
      { path: '/replay', label: 'Historical Thermal Replay', icon: Clock },
      { path: '/multi-satellite', label: 'Multi-Satellite Intelligence', icon: Layers },
      { path: '/compare', label: 'Incident Comparison', icon: ArrowRightLeft },
      { path: '/provenance', label: 'Data Provenance', icon: FileText },
      { path: '/analytics', label: 'Dynamic Analytics', icon: BarChart3 },
    ]
  },
  {
    title: 'PLATFORM',
    items: [
      { path: '/data-sources', label: 'Data Sources Transparency', icon: Database },
      { path: '/model-performance', label: 'Evidence Intelligence', icon: Cpu },
      { path: '/system-health', label: 'System Health', icon: Activity },
      { path: '/feedback', label: 'Report Issue / Feedback', icon: MessageSquare },
      { path: '/settings', label: 'General Settings', icon: Settings },
    ]
  }
];

// Standard / Free User Nav Sections (5 free items + 1 Upgrade card under PREMIUM ACCESS)
const standardUserNavSections = [
  {
    title: 'PUBLIC INTELLIGENCE',
    items: [
      { path: '/dashboard', label: 'Map Dashboard', icon: Map },
      { path: '/observations', label: 'Live Thermal Observations', icon: Satellite },
      { path: '/explorer', label: 'Data Explorer', icon: Table },
    ]
  },
  {
    title: 'PREMIUM ACCESS',
    isPremiumCTASection: true,
    items: []
  },
  {
    title: 'PLATFORM',
    items: [
      { path: '/data-sources', label: 'Data Sources Transparency', icon: Database },
      { path: '/feedback', label: 'Report Issue / Feedback', icon: MessageSquare },
      { path: '/settings', label: 'General Settings', icon: Settings },
    ]
  }
];

const analystNavSections = [
  {
    title: 'OPERATIONAL INTELLIGENCE',
    items: [
      { path: '/', label: 'Map Dashboard', icon: Map },
      { path: '/observations', label: 'Live Thermal Observations', icon: Satellite },
      { path: '/explorer', label: 'Data Explorer', icon: Table },
      { path: '/temporal', label: 'Temporal Analysis', icon: TrendingUp },
      { path: '/industrial-sites', label: 'Industrial Infrastructure', icon: Factory },
    ]
  },
  {
    title: 'INVESTIGATION TOOLS',
    items: [
      { path: '/alerts', label: 'Operational Alerts', icon: AlertOctagon },
      { path: '/replay', label: 'Historical Thermal Replay', icon: Clock },
      { path: '/multi-satellite', label: 'Multi-Satellite Intelligence', icon: Layers },
      { path: '/compare', label: 'Incident Comparison', icon: ArrowRightLeft },
      { path: '/provenance', label: 'Data Provenance', icon: FileText },
      { path: '/watchlists', label: 'Watchlists & AOI', icon: Shield },
      { path: '/reviews', label: 'Analyst Review Queue', icon: CheckSquare },
      { path: '/analytics', label: 'Dynamic Analytics', icon: BarChart3 },
    ]
  },
  {
    title: 'PLATFORM',
    items: [
      { path: '/data-sources', label: 'Data Sources Transparency', icon: Database },
      { path: '/model-performance', label: 'Evidence Intelligence', icon: Cpu },
      { path: '/system-health', label: 'System Health', icon: Activity },
      { path: '/feedback', label: 'Report Issue / Feedback', icon: MessageSquare },
      { path: '/settings', label: 'General Settings', icon: Settings },
    ]
  }
];

const adminNavSections = [
  {
    title: 'ADMINISTRATION',
    items: [
      { path: '/admin', label: 'Admin Console', icon: Shield },
      { path: '/admin/feedback', label: 'Feedback Inbox', icon: Inbox },
      { path: '/admin/users', label: 'User & Role Management', icon: Users },
      { path: '/admin/audit', label: 'Security Audit Logs', icon: FileText },
    ]
  },
  {
    title: 'SYSTEM OPERATIONS',
    items: [
      { path: '/system-health', label: 'System Health', icon: Activity },
      { path: '/data-sources', label: 'Data Sources Transparency', icon: Database },
      { path: '/pipeline-status', label: 'Data Pipeline / FIRMS Status', icon: Radio },
      { path: '/alerts', label: 'Operational Alerts', icon: AlertOctagon },
      { path: '/analytics', label: 'Dynamic Analytics', icon: BarChart3 },
      { path: '/feedback', label: 'Report Issue / Feedback', icon: MessageSquare },
      { path: '/settings', label: 'General Settings', icon: Settings },
    ]
  },
  {
    title: 'SYSTEM INTELLIGENCE',
    items: [
      { path: '/provenance', label: 'Data Provenance', icon: FileText },
      { path: '/model-performance', label: 'Evidence Intelligence', icon: Cpu },
    ]
  }
];

interface SidebarProps {
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileMenuOpen, onCloseMobileMenu }) => {
  const { user, role } = useAuth();
  const userRole = (role || 'analyst').toLowerCase();
  const [isPremiumActive, setIsPremiumActive] = useState<boolean>(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (userRole === 'user' && user) {
      apiService.getMySubscriptionStatus()
        .then((res) => setIsPremiumActive(res.is_premium_active))
        .catch(() => setIsPremiumActive(false));
    }
  }, [userRole, user]);

  const sections =
    userRole === 'admin'
      ? adminNavSections
      : userRole === 'user'
      ? isPremiumActive
        ? activeUserNavSections
        : standardUserNavSections
      : userRole === 'authority'
      ? authorityNavSections
      : analystNavSections;

  const handleOpenUpgradeModal = () => {
    if (onCloseMobileMenu) onCloseMobileMenu();
    setIsPremiumModalOpen(true);
  };

  const renderNavContent = (isMobile: boolean = false) => (
    <nav className="p-4 space-y-4 custom-scrollbar overflow-y-auto flex-1">
      {sections.map((section: any) => (
        <div key={section.title} className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
            {section.title}
          </div>

          {/* Render Upgrade to Premium Card if standard user CTA section */}
          {section.isPremiumCTASection ? (
            <div className="pt-0.5 pb-1">
              <button
                type="button"
                onClick={handleOpenUpgradeModal}
                className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 border border-amber-500/40 hover:border-amber-500/80 transition-all cursor-pointer shadow-sm group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Crown className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                        Upgrade to Premium
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 font-mono">
                        11 Features
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                      Unlock advanced intelligence tools
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            section.items.map((item: any) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={isMobile ? onCloseMobileMenu : undefined}
                  end={item.path === '/' || item.path === '/admin' || item.path === '/dashboard' || item.path === '/authority'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                </NavLink>
              );
            })
          )}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar (>=1024px) */}
      <aside className="hidden lg:flex w-64 bg-slate-100/90 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex-col shrink-0 select-none transition-colors duration-200">
        {renderNavContent(false)}

        {/* Footer Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1.5">
          {userRole === 'user' && isPremiumActive && (
            <div className="mb-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
              <Crown className="w-3.5 h-3.5 shrink-0" />
              <div>
                <div className="font-extrabold text-[10px] uppercase tracking-wider">Premium Active</div>
                <div className="text-[9px] opacity-80">All advanced features unlocked</div>
              </div>
            </div>
          )}

          <p className="font-semibold text-slate-700 dark:text-slate-400">ThermalTrace AI Platform</p>
          <p>SIH Problem Statement SIH26162</p>
          <p>Operational Satellite Intelligence</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-slate-200 dark:border-slate-800/60">🌱 A Cleaner India • A Safer Tomorrow</p>
        </div>
      </aside>

      {/* Mobile Navigation Drawer Overlay (<1024px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Dark Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobileMenu}
          />

          {/* Slide-over Mobile Drawer */}
          <aside className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col h-full shadow-2xl z-10 border-r border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Navigation Menu</span>
              <button
                type="button"
                onClick={onCloseMobileMenu}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderNavContent(true)}

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1.5">
              {userRole === 'user' && isPremiumActive && (
                <div className="mb-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                  <Crown className="w-3.5 h-3.5 shrink-0" />
                  <div>
                    <div className="font-extrabold text-[10px] uppercase tracking-wider">Premium Active</div>
                    <div className="text-[9px] opacity-80">All advanced features unlocked</div>
                  </div>
                </div>
              )}

              <p className="font-semibold text-slate-700 dark:text-slate-400">ThermalTrace AI Platform</p>
              <p>SIH Problem Statement SIH26162</p>
              <p>Operational Satellite Intelligence</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-slate-200 dark:border-slate-800/60">🌱 A Cleaner India • A Safer Tomorrow</p>
            </div>
          </aside>
        </div>
      )}

      {/* PREMIUM SUBSCRIPTION MODAL OVERLAY */}
      {isPremiumModalOpen && (
        <PremiumAccessRequired
          isModal={true}
          onClose={() => setIsPremiumModalOpen(false)}
        />
      )}
    </>
  );
};
