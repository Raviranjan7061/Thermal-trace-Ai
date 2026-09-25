import React from 'react';
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
  Settings
} from 'lucide-react';

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
      { path: '/settings', label: 'General Settings', icon: Settings },
    ]
  }
];

const userNavSections = [
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
      { path: '/settings', label: 'General Settings', icon: Settings },
    ]
  }
];

const adminNavSections = [
  {
    title: 'ADMINISTRATION',
    items: [
      { path: '/admin', label: 'Admin Console', icon: Shield },
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

export const Sidebar: React.FC = () => {
  const { role } = useAuth();
  const location = useLocation();
  const userRole = (role || 'analyst').toLowerCase();

  const sections =
    userRole === 'admin'
      ? adminNavSections
      : userRole === 'user'
      ? userNavSections
      : userRole === 'authority'
      ? authorityNavSections
      : analystNavSections;

  return (
    <aside className="w-64 bg-slate-100/90 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex flex-col shrink-0 select-none transition-colors duration-200">
      <nav className="p-4 space-y-4 custom-scrollbar overflow-y-auto flex-1">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/' || item.path === '/admin' || item.path === '/dashboard' || item.path === '/authority'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-400">ThermalTrace AI Platform</p>
        <p>SIH Problem Statement SIH26162</p>
        <p>Operational Satellite Intelligence</p>
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-slate-200 dark:border-slate-800/60">🌱 A Cleaner India • A Safer Tomorrow</p>
      </div>
    </aside>
  );
};
