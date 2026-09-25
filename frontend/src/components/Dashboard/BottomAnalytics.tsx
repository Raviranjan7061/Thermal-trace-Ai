import React, { useMemo, useState } from 'react';
import { Activity, CheckCircle2, Flame, Factory, MapPin, Shield } from 'lucide-react';
import { AnalyticsOverview, Hotspot, IndustrialFacility, SystemHealth } from '../../types';

interface Props {
  analytics: AnalyticsOverview | null;
  hotspots: Hotspot[];
  industrialSites: IndustrialFacility[];
  systemHealth: SystemHealth | null;
  loading: boolean;
}

export const BottomAnalytics: React.FC<Props> = ({
  analytics,
  hotspots,
  industrialSites,
  systemHealth,
  loading
}) => {
  // Presentation hover state variables for interactive tooltips
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [hoveredDonutIndex, setHoveredDonutIndex] = useState<number | null>(null);
  const [hoveredRegionIndex, setHoveredRegionIndex] = useState<number | null>(null);

  // 1. Thermal Activity Trend (Last 7 Days) — Daily Timeline Calculation ending on runtime date
  const trendData = useMemo(() => {
    const now = new Date();
    const numDays = 7;

    // Generate 7 consecutive calendar day buckets ending on today (new Date())
    const buckets = Array.from({ length: numDays }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (numDays - 1 - i));
      d.setHours(0, 0, 0, 0);

      const label = d.toLocaleDateString([], { day: 'numeric', month: 'short' });
      const fullDateStr = d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
      const dateKey = d.toISOString().split('T')[0];

      return {
        index: i,
        label,
        fullDateStr,
        dateObj: d,
        dateKey,
        count: 0,
        frpSum: 0,
        maxFrp: 0,
        avgFrp: 0
      };
    });

    // Group real hotspot observations by acquisition calendar day
    if (hotspots.length > 0) {
      hotspots.forEach((h) => {
        if (!h.acquisition_datetime) return;
        const hDate = new Date(h.acquisition_datetime);
        if (isNaN(hDate.getTime())) return;

        const bucket = buckets.find((b) => {
          const nextDay = new Date(b.dateObj);
          nextDay.setDate(b.dateObj.getDate() + 1);
          return hDate >= b.dateObj && hDate < nextDay;
        });

        if (bucket) {
          bucket.count += 1;
          const frp = h.frp || 0;
          if (frp > 0) {
            bucket.frpSum += frp;
            bucket.maxFrp = Math.max(bucket.maxFrp, frp);
          }
        }
      });

      buckets.forEach((b) => {
        b.avgFrp = b.count > 0 && b.frpSum > 0 ? Number((b.frpSum / b.count).toFixed(1)) : 0;
        b.maxFrp = Number(b.maxFrp.toFixed(1));
      });
    }

    return buckets;
  }, [hotspots]);

  // Max value for scaling the SVG trend line
  const maxTrendCount = useMemo(() => {
    const max = Math.max(...trendData.map((d) => d.count), 1);
    return Math.ceil(max * 1.2);
  }, [trendData]);

  // SVG Bezier Curve path generator for Area Chart
  const svgPathData = useMemo(() => {
    const width = 360;
    const height = 110;
    const pts = trendData.map((pt, idx) => {
      const x = (idx / (trendData.length - 1)) * width;
      const y = height - (pt.count / maxTrendCount) * (height - 15) - 10;
      return { x, y };
    });

    if (pts.length === 0) return { pathD: '', fillD: '', pts: [] };

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
    return { pathD, fillD, pts };
  }, [trendData, maxTrendCount]);

  // 2. Classification Distribution calculation
  const classificationDist = useMemo(() => {
    const counts: Record<string, { label: string; count: number; color: string }> = {
      industrial: { label: 'Industrial Fire', count: 0, color: '#ef4444' },
      flare: { label: 'Persistent Gas Flare', count: 0, color: '#f97316' },
      other: { label: 'Other Thermal Source', count: 0, color: '#3b82f6' },
      crop: { label: 'Crop Burning', count: 0, color: '#06b6d4' },
      unknown: { label: 'Unknown', count: 0, color: '#64748b' }
    };

    if (analytics?.classification_breakdown) {
      Object.entries(analytics.classification_breakdown).forEach(([key, count]) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('fire') && !lowerKey.includes('wild')) counts.industrial.count += count;
        else if (lowerKey.includes('flare') || lowerKey.includes('gas')) counts.flare.count += count;
        else if (lowerKey.includes('crop') || lowerKey.includes('agri')) counts.crop.count += count;
        else if (lowerKey.includes('unknown') || lowerKey.includes('review') || lowerKey.includes('unclassified')) counts.unknown.count += count;
        else counts.other.count += count;
      });
    } else if (hotspots.length > 0) {
      hotspots.forEach((h) => {
        const cls = (h.classification?.probable_classification || '').toLowerCase();
        if (cls.includes('industrial fire')) counts.industrial.count += 1;
        else if (cls.includes('gas flare') || cls.includes('flare')) counts.flare.count += 1;
        else if (cls.includes('crop')) counts.crop.count += 1;
        else if (cls.includes('unknown') || cls.includes('review')) counts.unknown.count += 1;
        else counts.other.count += 1;
      });
    }

    const total = Object.values(counts).reduce((acc, c) => acc + c.count, 0) || analytics?.total_detections || hotspots.length || 1;

    return {
      total: analytics?.total_detections || hotspots.length || Object.values(counts).reduce((acc, c) => acc + c.count, 0),
      items: Object.values(counts).map((c) => ({
        ...c,
        pct: Math.round((c.count / total) * 100)
      }))
    };
  }, [analytics, hotspots]);

  // SVG Donut Chart Arcs Generator
  const donutArcs = useMemo(() => {
    const total = classificationDist.total || 1;
    let accumPct = 0;
    const radius = 42;
    const circumference = 2 * Math.PI * radius;

    return classificationDist.items.map((item) => {
      const pctRatio = item.count / total;
      const strokeDasharray = `${pctRatio * circumference} ${circumference}`;
      const strokeDashoffset = -accumPct * circumference;
      accumPct += pctRatio;
      return {
        ...item,
        strokeDasharray,
        strokeDashoffset
      };
    });
  }, [classificationDist]);

  // 3. Top Industrial Regions calculation (derived dynamically from real industrialSites)
  const topRegions = useMemo(() => {
    const regionCounts: Record<string, number> = {};

    if (industrialSites.length > 0) {
      industrialSites.forEach((site) => {
        const region = site.state || 'Other Region';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      });
    }

    const sorted = Object.entries(regionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const maxCount = Math.max(...sorted.map((r) => r.count), 1);
    const barColors = ['#ef4444', '#f97316', '#3b82f6', '#06b6d4', '#64748b'];

    return sorted.map((r, idx) => ({
      ...r,
      pctOfMax: Math.round((r.count / maxCount) * 100),
      color: barColors[idx % barColors.length]
    }));
  }, [industrialSites]);

  // 4. System Status Operational Data (derived only from real backend health signals)
  const systemStatusList = useMemo(() => {
    const firmsSignal = systemHealth?.firms_integration?.last_sync_status || analytics?.data_freshness?.firms_status;
    const dbSignal = systemHealth?.database?.status;

    return [
      {
        name: 'NASA FIRMS',
        hasSignal: !!firmsSignal,
        status: firmsSignal ? (firmsSignal.toUpperCase() === 'SUCCESS' || firmsSignal.toLowerCase() === 'live' || firmsSignal.toLowerCase() === 'active' ? 'Live' : firmsSignal) : 'Status Unavailable',
        badgeColor: firmsSignal ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500',
        dotColor: firmsSignal ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'
      },
      {
        name: 'Satellite Ingestion',
        hasSignal: false,
        status: 'Status Unavailable',
        badgeColor: 'text-slate-400 dark:text-slate-500',
        dotColor: 'bg-slate-400 dark:bg-slate-600'
      },
      {
        name: 'Industrial Database',
        hasSignal: !!dbSignal,
        status: dbSignal ? (dbSignal.toLowerCase() === 'ok' || dbSignal.toLowerCase() === 'healthy' ? 'Online' : dbSignal) : 'Status Unavailable',
        badgeColor: dbSignal ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500',
        dotColor: dbSignal ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'
      },
      {
        name: 'Alert Engine',
        hasSignal: false,
        status: 'Status Unavailable',
        badgeColor: 'text-slate-400 dark:text-slate-500',
        dotColor: 'bg-slate-400 dark:bg-slate-600'
      }
    ];
  }, [systemHealth, analytics]);

  // Determine actual latest observation datetime across all real hotspots
  const latestObservationTime = useMemo(() => {
    if (hotspots.length === 0) return null;
    const validTimes = hotspots
      .map((h) => new Date(h.acquisition_datetime).getTime())
      .filter((t) => !isNaN(t) && t > 0);
    if (validTimes.length === 0) return null;
    return new Date(Math.max(...validTimes));
  }, [hotspots]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 px-3.5 mt-3.5 select-none">
      {/* CARD 1: Thermal Activity Trend (Last 7 Days) */}
      <div className="bg-white dark:bg-[#0B111E] rounded-2xl p-4 border border-slate-200 dark:border-slate-800/90 shadow-md dark:shadow-2xl flex flex-col justify-between transition-colors duration-200 min-h-[220px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Thermal Activity Trend (Last 7 Days)</span>
          </h4>
          <div className="flex items-center space-x-2 text-[10px] font-mono">
            <span className="text-slate-400 dark:text-slate-500 font-semibold">
              Through: <span className="text-slate-700 dark:text-slate-300 font-bold">{new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            {latestObservationTime ? (
              <span className="text-amber-500 font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  Latest: {latestObservationTime.toLocaleDateString([], { month: 'short', day: 'numeric' })} {latestObservationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </span>
            ) : (
              <span className="text-slate-400 font-semibold">Latest: N/A</span>
            )}
          </div>
        </div>

        <div className="relative my-2 flex-1 flex flex-col justify-end">
          {/* Y-Axis Labels overlay */}
          <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[9px] font-mono text-slate-400 dark:text-slate-500 pointer-events-none">
            <span>{maxTrendCount}</span>
            <span>{Math.round(maxTrendCount * 0.66)}</span>
            <span>{Math.round(maxTrendCount * 0.33)}</span>
            <span>0</span>
          </div>

          {/* SVG Area Chart with Live Line & Hover Tooltip */}
          <div className="pl-6 pt-1 relative">
            <svg viewBox="0 0 360 110" className="w-full h-[110px] overflow-visible">
              <defs>
                <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="10" x2="360" y2="10" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3" className="text-slate-500" />
              <line x1="0" y1="43" x2="360" y2="43" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3" className="text-slate-500" />
              <line x1="0" y1="76" x2="360" y2="76" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3" className="text-slate-500" />

              {/* Smooth Area Fill Transition */}
              {svgPathData.fillD && (
                <path d={svgPathData.fillD} fill="url(#trendAreaGrad)" className="transition-all duration-700 ease-out" />
              )}

              {/* Smooth Bezier Line Path Transition */}
              {svgPathData.pathD && (
                <path
                  d={svgPathData.pathD}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-700 ease-out"
                />
              )}

              {/* Interactive Data Points */}
              {svgPathData.pts.map((pt, i) => {
                const isLatest = i === svgPathData.pts.length - 1;
                const isHovered = hoveredTrendIndex === i;
                const hasData = trendData[i]?.count > 0;
                return (
                  <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredTrendIndex(i)} onMouseLeave={() => setHoveredTrendIndex(null)}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5 : hasData ? 4 : 3}
                      fill="#f97316"
                      opacity={hasData || isHovered ? 1 : 0.6}
                      className={`transition-all duration-300 ${isHovered || (isLatest && hasData) ? 'drop-shadow-[0_0_8px_#f97316]' : ''}`}
                    />
                  </g>
                );
              })}
            </svg>

            {/* REAL Data Hover Tooltip Popup */}
            {hoveredTrendIndex !== null && trendData[hoveredTrendIndex] && (
              <div
                className={`absolute z-20 bg-slate-900/95 border border-amber-500/50 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none font-mono transition-all duration-200 min-w-[130px] ${
                  hoveredTrendIndex <= 1
                    ? 'translate-x-0 -translate-y-full'
                    : hoveredTrendIndex >= trendData.length - 2
                    ? '-translate-x-full -translate-y-full'
                    : '-translate-x-1/2 -translate-y-full'
                }`}
                style={{
                  left: `${(svgPathData.pts[hoveredTrendIndex]?.x / 360) * 100}%`,
                  top: `${Math.max(10, svgPathData.pts[hoveredTrendIndex]?.y - 6)}px`
                }}
              >
                <div className="font-bold text-amber-400 border-b border-slate-800 pb-0.5 mb-1">
                  {trendData[hoveredTrendIndex].fullDateStr}
                </div>
                <div className="flex justify-between space-x-2">
                  <span className="text-slate-400">Detections:</span>
                  <span className="font-bold text-white">{trendData[hoveredTrendIndex].count}</span>
                </div>
                {trendData[hoveredTrendIndex].count > 0 ? (
                  <>
                    <div className="flex justify-between space-x-2">
                      <span className="text-slate-400">Avg FRP:</span>
                      <span className="font-bold text-amber-300">{trendData[hoveredTrendIndex].avgFrp} MW</span>
                    </div>
                    <div className="flex justify-between space-x-2">
                      <span className="text-slate-400">Max FRP:</span>
                      <span className="font-bold text-red-400">{trendData[hoveredTrendIndex].maxFrp} MW</span>
                    </div>
                  </>
                ) : (
                  <div className="text-[9px] text-slate-500 italic mt-0.5">No thermal records</div>
                )}
              </div>
            )}
          </div>

          {/* X-Axis Time Labels */}
          <div className="pl-6 flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/80">
            {trendData.map((d, i) => (
              <span
                key={i}
                className={`transition-colors cursor-pointer ${hoveredTrendIndex === i ? 'text-amber-500 font-bold' : ''}`}
                onMouseEnter={() => setHoveredTrendIndex(i)}
                onMouseLeave={() => setHoveredTrendIndex(null)}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CARD 2: Classification Distribution */}
      <div className="bg-white dark:bg-[#0B111E] rounded-2xl p-4 border border-slate-200 dark:border-slate-800/90 shadow-md dark:shadow-2xl flex flex-col justify-between transition-colors duration-200 min-h-[220px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Classification Distribution</span>
          </h4>
        </div>

        <div className="flex items-center justify-between space-x-3 my-auto py-2">
          {/* SVG Donut Chart with Smooth Transition Arcs */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform overflow-visible">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-900" />
              {donutArcs.map((arc, i) => {
                const isHovered = hoveredDonutIndex === i;
                return (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={isHovered ? 15 : 12}
                    strokeDasharray={arc.strokeDasharray}
                    strokeDashoffset={arc.strokeDashoffset}
                    className="transition-all duration-500 ease-in-out cursor-pointer"
                    onMouseEnter={() => setHoveredDonutIndex(i)}
                    onMouseLeave={() => setHoveredDonutIndex(null)}
                    style={{
                      filter: isHovered ? `drop-shadow(0 0 6px ${arc.color})` : 'none'
                    }}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none transition-all duration-300">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                {hoveredDonutIndex !== null ? `${classificationDist.items[hoveredDonutIndex]?.pct}%` : classificationDist.total}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5 truncate max-w-[80px]">
                {hoveredDonutIndex !== null ? classificationDist.items[hoveredDonutIndex]?.label : 'Total'}
              </span>
            </div>
          </div>

          {/* Legend List with Smooth Hover Highlights */}
          <div className="flex-1 space-y-1.5 min-w-0 text-[11px]">
            {classificationDist.items.map((item, idx) => {
              const isHovered = hoveredDonutIndex === idx;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between space-x-1.5 p-1 rounded-lg transition-all cursor-pointer ${
                    isHovered ? 'bg-slate-100 dark:bg-slate-800/80 scale-[1.02]' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                  onMouseEnter={() => setHoveredDonutIndex(idx)}
                  onMouseLeave={() => setHoveredDonutIndex(null)}
                >
                  <div className="flex items-center space-x-1.5 min-w-0 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform" style={{ backgroundColor: item.color, transform: isHovered ? 'scale(1.25)' : 'scale(1)' }} />
                    <span className={`truncate font-medium transition-colors ${isHovered ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono shrink-0 ml-1">
                    {item.pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CARD 3: Top Industrial Regions */}
      <div className="bg-white dark:bg-[#0B111E] rounded-2xl p-4 border border-slate-200 dark:border-slate-800/90 shadow-md dark:shadow-2xl flex flex-col justify-between transition-colors duration-200 min-h-[220px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Top Industrial Regions</span>
          </h4>
        </div>

        {topRegions.length > 0 ? (
          <div className="space-y-2.5 my-auto py-1">
            {topRegions.map((region, idx) => {
              const isHovered = hoveredRegionIndex === idx;
              return (
                <div
                  key={idx}
                  className={`space-y-1 text-[11px] group cursor-pointer p-1 rounded-lg transition-all ${isHovered ? 'bg-slate-100 dark:bg-slate-800/60' : ''}`}
                  onMouseEnter={() => setHoveredRegionIndex(idx)}
                  onMouseLeave={() => setHoveredRegionIndex(null)}
                >
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium">
                    <span className={`truncate max-w-[170px] transition-colors ${isHovered ? 'text-slate-900 dark:text-white font-bold' : ''}`}>
                      {region.name}
                    </span>
                    <span className="font-extrabold font-mono text-slate-900 dark:text-slate-100">{region.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800/60 relative">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                      style={{
                        width: `${Math.max(8, region.pctOfMax)}%`,
                        backgroundColor: region.color,
                        transitionDelay: `${idx * 70}ms`
                      }}
                    >
                      {/* Subtle Highlight Shimmer Sweep on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center my-auto py-6 text-center">
            <MapPin className="w-5 h-5 text-slate-400 mb-1" />
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">No regional data available</span>
          </div>
        )}
      </div>

      {/* CARD 4: System Status */}
      <div className="bg-white dark:bg-[#0B111E] rounded-2xl p-4 border border-slate-200 dark:border-slate-800/90 shadow-md dark:shadow-2xl flex flex-col justify-between transition-colors duration-200 min-h-[220px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>System Status</span>
          </h4>
          {systemStatusList.every(s => s.hasSignal && (s.status === 'Live' || s.status === 'Online' || s.status === 'Active')) ? (
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </span>
          ) : (
            <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Partial Status</span>
            </span>
          )}
        </div>

        <div className="space-y-3 my-auto py-1">
          {systemStatusList.map((srv, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs shadow-sm dark:shadow-none"
            >
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${srv.dotColor}`} />
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{srv.name}</span>
              </div>
              <span className={`font-bold font-mono text-[11px] ${srv.badgeColor}`}>
                {srv.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
