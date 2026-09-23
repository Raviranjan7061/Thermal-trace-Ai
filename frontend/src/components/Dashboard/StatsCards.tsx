import React from 'react';
import { Flame, Factory, TreePine, AlertTriangle } from 'lucide-react';
import { AnalyticsOverview } from '../../types';

interface Props {
  analytics: AnalyticsOverview | null;
  loading: boolean;
}

const Sparkline: React.FC<{
  data: number[];
  color: string;
  id: string;
  showBars?: boolean;
}> = ({ data, color, id, showBars = false }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const width = 68;
  const height = 24;

  const pts = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return { x, y };
  });

  let pathD = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const cp1x = (curr.x + (next.x - curr.x) / 2).toFixed(1);
    const cp1y = curr.y.toFixed(1);
    const cp2x = (curr.x + (next.x - curr.x) / 2).toFixed(1);
    const cp2y = next.y.toFixed(1);
    pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x.toFixed(1)},${next.y.toFixed(1)}`;
  }

  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;
  const lastPt = pts[pts.length - 1];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Vertical bars accent for card 2 */}
      {showBars &&
        pts.map((pt, idx) => (
          <line
            key={idx}
            x1={pt.x.toFixed(1)}
            y1={pt.y.toFixed(1)}
            x2={pt.x.toFixed(1)}
            y2={height}
            stroke={color}
            strokeWidth="1.2"
            strokeOpacity="0.3"
          />
        ))}

      {/* Gradient Area Fill */}
      <path d={fillD} fill={`url(#grad-${id})`} />

      {/* Smooth Bezier Curve Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Glowing End Dot */}
      <circle
        cx={lastPt.x.toFixed(1)}
        cy={lastPt.y.toFixed(1)}
        r="2.5"
        fill={color}
      />
    </svg>
  );
};

export const StatsCards: React.FC<Props> = ({ analytics, loading }) => {
  const trends = analytics?.kpi_trends;

  const cards = [
    {
      id: 'thermal-detections',
      title: 'Thermal Detections',
      value: analytics?.total_detections,
      renderIcon: () => <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />,
      iconBoxStyle: 'bg-orange-500/15 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.25)]',
      cardStyle: 'border-slate-800/80 hover:border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.04)]',
      sparklineColor: '#f97316',
      sparklineData: trends?.thermal_detections?.series || [],
      trendText: trends?.thermal_detections?.status || trends?.thermal_detections?.trend_text || (loading ? '...' : '—'),
      trendColor: trends?.thermal_detections?.trend_color || 'text-slate-400',
      showBars: false,
    },
    {
      id: 'industrial-candidates',
      title: 'Industrial Candidates',
      value: analytics?.industrial_candidates,
      renderIcon: () => <Factory className="w-5 h-5 fill-red-500 text-red-500" />,
      iconBoxStyle: 'bg-red-500/15 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.25)]',
      cardStyle: 'border-slate-800/80 hover:border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.04)]',
      sparklineColor: '#ef4444',
      sparklineData: trends?.industrial_candidates?.series || [],
      trendText: trends?.industrial_candidates?.status || trends?.industrial_candidates?.trend_text || (loading ? '...' : '—'),
      trendColor: trends?.industrial_candidates?.trend_color || 'text-slate-400',
      showBars: true,
    },
    {
      id: 'natural-fire-candidates',
      title: 'Natural Fire Candidates',
      value: analytics?.natural_fire_candidates,
      renderIcon: () => <TreePine className="w-5 h-5 fill-emerald-400 text-emerald-400" />,
      iconBoxStyle: 'bg-emerald-500/15 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
      cardStyle: 'border-slate-800/80 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.04)]',
      sparklineColor: '#10b981',
      sparklineData: trends?.natural_fire_candidates?.series || [],
      trendText: trends?.natural_fire_candidates?.status || trends?.natural_fire_candidates?.trend_text || (loading ? '...' : '—'),
      trendColor: trends?.natural_fire_candidates?.trend_color || 'text-slate-400',
      showBars: false,
    },
    {
      id: 'needs-analyst-review',
      title: 'Needs Analyst Review',
      value: analytics?.needs_review_count,
      renderIcon: () => <AlertTriangle className="w-5 h-5 fill-amber-400 text-[#2B2211]" />,
      iconBoxStyle: 'bg-amber-500/15 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
      cardStyle: 'border-slate-800/80 hover:border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.04)]',
      sparklineColor: '#06b6d4',
      sparklineData: trends?.needs_review?.series || [],
      trendText: trends?.needs_review?.status || trends?.needs_review?.trend_text || (loading ? '...' : '—'),
      trendColor: trends?.needs_review?.trend_color || 'text-slate-400',
      showBars: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-3.5 my-3 select-none">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`bg-[#0B111E] h-[76px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between overflow-hidden transition-all relative ${card.cardStyle}`}
        >
          {/* Subtle Top Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-700/40 to-transparent pointer-events-none" />

          {/* Left Column: Solid Icon & Count / Title */}
          <div className="flex items-center space-x-3 min-w-0 z-10">
            {/* Filled Icon Box */}
            <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center p-2.5 ${card.iconBoxStyle}`}>
              {card.renderIcon()}
            </div>

            {/* Number & Subtitle */}
            <div className="min-w-0 flex flex-col justify-center">
              <h3 className="text-[28px] font-extrabold text-white tracking-tight leading-none">
                {loading ? (
                  <span className="animate-pulse text-slate-600">...</span>
                ) : card.value !== undefined ? (
                  card.value.toLocaleString()
                ) : (
                  <span className="text-slate-500 text-xs">0</span>
                )}
              </h3>
              <p className="text-[11px] font-medium text-slate-400 leading-none truncate mt-1.5">
                {card.title}
              </p>
            </div>
          </div>

          {/* Right Column: Trend Percentage & Sparkline Chart */}
          <div className="flex flex-col items-end justify-between h-full py-0.5 shrink-0 ml-2 z-10">
            <span className={`text-[10px] font-mono font-bold ${card.trendColor}`}>
              {card.trendText}
            </span>
            <Sparkline
              data={card.sparklineData}
              color={card.sparklineColor}
              id={card.id}
              showBars={card.showBars}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
