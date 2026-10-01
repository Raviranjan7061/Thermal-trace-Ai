import React from 'react';
import { User, Search, Landmark, Settings, CheckCircle2, ArrowRight } from 'lucide-react';

export type RoleMode = 'user' | 'analyst' | 'authority' | 'admin';

interface RoleExplanationCardsProps {
  activeRoleMode: RoleMode;
  onSelectRole: (role: RoleMode) => void;
}

export const RoleExplanationCards: React.FC<RoleExplanationCardsProps> = ({
  activeRoleMode,
  onSelectRole,
}) => {
  const roles = [
    {
      id: 'user' as RoleMode,
      title: 'USER',
      subtitle: 'Explore public\nthermal intelligence',
      icon: User,
      activeCardStyle: 'bg-blue-100/95 border-2 border-blue-600 shadow-md ring-1 ring-blue-500/30 text-slate-900',
      inactiveCardStyle: 'bg-blue-50/90 hover:bg-blue-100/80 border border-blue-200/90 text-slate-900',
      iconBoxStyle: 'bg-blue-600 text-white',
      arrowStyle: 'border-blue-300 bg-blue-50/80 text-blue-600',
      checkColor: 'text-blue-600',
    },
    {
      id: 'analyst' as RoleMode,
      title: 'ANALYST',
      subtitle: 'Investigate and\nanalyse anomalies',
      icon: Search,
      activeCardStyle: 'bg-emerald-100/95 border-2 border-emerald-600 shadow-md ring-1 ring-emerald-500/30 text-slate-900',
      inactiveCardStyle: 'bg-emerald-50/90 hover:bg-emerald-100/80 border border-emerald-200/90 text-slate-900',
      iconBoxStyle: 'bg-emerald-600 text-white',
      arrowStyle: 'border-emerald-300 bg-emerald-50/80 text-emerald-600',
      checkColor: 'text-emerald-600',
    },
    {
      id: 'authority' as RoleMode,
      title: 'AUTHORITY',
      subtitle: 'Monitor oversight\nand compliance',
      icon: Landmark,
      activeCardStyle: 'bg-amber-100/95 border-2 border-amber-600 shadow-md ring-1 ring-amber-500/30 text-slate-900',
      inactiveCardStyle: 'bg-amber-50/90 hover:bg-amber-100/80 border border-amber-200/90 text-slate-900',
      iconBoxStyle: 'bg-amber-600 text-white',
      arrowStyle: 'border-amber-300 bg-amber-50/80 text-amber-600',
      checkColor: 'text-amber-600',
    },
    {
      id: 'admin' as RoleMode,
      title: 'ADMIN',
      subtitle: 'Manage platform\nand data pipeline',
      icon: Settings,
      activeCardStyle: 'bg-rose-100/95 border-2 border-rose-600 shadow-md ring-1 ring-rose-500/30 text-slate-900',
      inactiveCardStyle: 'bg-rose-50/90 hover:bg-rose-100/80 border border-rose-200/90 text-slate-900',
      iconBoxStyle: 'bg-rose-600 text-white',
      arrowStyle: 'border-rose-300 bg-rose-50/80 text-rose-600',
      checkColor: 'text-rose-600',
    },
  ];

  return (
    <div className="w-full shrink-0 select-none">
      {/* SECTION HEADER: LEFT TITLE | RIGHT SLOGAN */}
      <div className="flex items-center justify-between mb-1 px-0.5">
        <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
          PLATFORM ROLE WORKSPACES
        </span>
        <span className="text-[10px] italic text-slate-300 font-normal hidden xl:inline">
          Different perspectives. A common mission — <strong className="text-white not-italic font-semibold">Safer Industries.</strong>
        </span>
      </div>

      {/* 4 CARDS IN ONE COMPACT ROW (Horizontally scrollable on mobile <1024px, 4-col grid on desktop >=1024px) */}
      <div className="flex overflow-x-auto custom-scrollbar gap-2 w-full pb-1.5 lg:pb-0 lg:grid lg:grid-cols-4 lg:overflow-x-visible">
        {roles.map((role) => {
          const IconComp = role.icon;
          const isActive = activeRoleMode === role.id;

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelectRole(role.id)}
              className={`group relative border h-[58px] sm:h-[62px] px-2 sm:px-2.5 py-1.5 rounded-xl transition-all duration-150 flex items-center space-x-1.5 sm:space-x-2 text-left cursor-pointer shrink-0 min-w-[130px] sm:min-w-[145px] lg:min-w-0 lg:w-full lg:shrink shadow-sm ${
                isActive ? role.activeCardStyle : role.inactiveCardStyle
              }`}
            >
              {/* Icon Box */}
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg shrink-0 flex items-center justify-center ${role.iconBoxStyle}`}>
                <IconComp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>

              {/* Title & Subtitle */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1">
                  <span className="font-extrabold text-[11px] sm:text-[12px] tracking-tight text-slate-900 leading-none">
                    {role.title}
                  </span>
                  {isActive && <CheckCircle2 className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${role.checkColor}`} />}
                </div>
                <p className="text-[8.5px] sm:text-[9.5px] text-slate-600 font-medium leading-[1.15] whitespace-pre-line mt-0.5 line-clamp-2">
                  {role.subtitle}
                </p>
              </div>

              {/* Arrow Circle */}
              <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border shrink-0 flex items-center justify-center ${isActive ? role.arrowStyle : 'border-slate-300/80 bg-white/60 text-slate-400'}`}>
                <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
