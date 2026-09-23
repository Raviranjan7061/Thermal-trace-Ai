import React, { useState, useEffect } from 'react';
import { Satellite, ShieldCheck, Database, Sun, Cpu } from 'lucide-react';
import indiaSatelliteHero from '../../assets/india_satellite_hero.jpg';
import refineryBg from '../../assets/refinery_hero_bg.jpg';

export const HeroIntelligenceBanner: React.FC = () => {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) +
          ' ' +
          now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) +
          ' IST'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-3.5 mt-3.5 relative overflow-hidden bg-[#0A0F1D] border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-3 lg:gap-4 select-none">
      {/* Background Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#070B16] via-[#0D1527] to-[#080D1A] pointer-events-none" />

      {/* LEFT: HD Satellite Earth View centered over India */}
      <div className="relative z-10 flex items-center space-x-3 shrink-0">
        <div className="relative w-[170px] h-[115px] sm:w-[185px] sm:h-[125px] xl:w-[195px] xl:h-[130px] rounded-xl overflow-hidden border border-cyan-500/30 shadow-xl shrink-0">
          <img
            src={indiaSatelliteHero}
            alt="Satellite Thermal View of India"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1D]/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Header Text beside Globe */}
        <div className="hidden sm:block">
          <span className="text-[10px] font-mono font-extrabold text-cyan-400 tracking-widest block uppercase">
            SATELLITE THERMAL INTELLIGENCE
          </span>
          <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
            NOAA-20 / NOAA-21 VIIRS Sensing
          </h2>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
            Real-Time Industrial Thermal Observations
          </span>
        </div>
      </div>

      {/* CENTER: Main Headline Slogan */}
      <div className="relative z-10 flex flex-col items-start text-left min-w-0 shrink">
        {/* Tagline on one line with glowing green indicator */}
        <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0" />
          <span>REAL SATELLITE DATA. REAL IMPACT.</span>
        </div>

        {/* Main Headline in 2 lines */}
        <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white tracking-tight leading-tight">
          <span className="block whitespace-nowrap">Monitor. Investigate.</span>
          <span className="block text-orange-500 font-extrabold whitespace-nowrap">Prevent.</span>
        </h3>

        {/* Description in clean 2-line layout */}
        <p className="text-[11px] sm:text-xs text-slate-300 font-normal leading-relaxed mt-1 max-w-[320px]">
          Satellite thermal intelligence for a cleaner, safer<br className="hidden sm:inline" /> and more transparent India.
        </p>
      </div>

      {/* MIDDLE-RIGHT: 3-Item Provenance Info Block */}
      <div className="relative z-10 hidden md:flex flex-col space-y-2 border-l border-slate-800/80 pl-3.5 lg:pl-4 text-slate-200 shrink-0">
        {/* Item 1: NOAA-20 / NOAA-21 */}
        <div className="flex items-center space-x-2.5">
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <Satellite className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-100 text-[11px] sm:text-[12px] leading-tight whitespace-nowrap tracking-tight">
              NOAA-20 / NOAA-21
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-snug whitespace-nowrap">
              Thermal Observations
            </span>
          </div>
        </div>

        {/* Item 2: NASA FIRMS */}
        <div className="flex items-center space-x-2.5">
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-100 text-[11px] sm:text-[12px] leading-tight whitespace-nowrap tracking-tight">
              NASA FIRMS
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-snug whitespace-nowrap">
              Real-time Data
            </span>
          </div>
        </div>

        {/* Item 3: Evidence-Based Analysis */}
        <div className="flex items-center space-x-2.5">
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-100 text-[11px] sm:text-[12px] leading-tight whitespace-nowrap tracking-tight">
              Evidence-Based Analysis
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-snug whitespace-nowrap">
              Industrial Context
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Industrial Refinery Visual & Live Timestamp Quote */}
      <div className="relative z-10 flex flex-col items-center xl:items-end justify-between shrink-0 border-t xl:border-t-0 xl:border-l border-slate-800/80 pt-3 xl:pt-0 xl:pl-4 xl:pr-2 text-right">
        {/* Top Live Timestamp */}
        <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] font-mono text-slate-300 font-semibold bg-slate-950/80 px-2.5 py-0.5 rounded-xl border border-slate-800/90 shadow-md">
          <span>{timeString || 'Tue, 23 Sep 2026 08:48 AM IST'}</span>
          <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
        </div>

        {/* Refinery HD Graphic Accent */}
        <div className="relative w-[185px] h-[82px] sm:w-[200px] sm:h-[88px] xl:w-[205px] xl:h-[90px] my-1 rounded-xl overflow-hidden border border-slate-800 shadow-md shrink-0">
          <img
            src={refineryBg}
            alt="Industrial Thermal Asset"
            className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1D]/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Mission Quote */}
        <span className="text-[10px] sm:text-[11px] italic text-slate-300 font-medium whitespace-nowrap">
          "Turning satellite data into a safer tomorrow."
        </span>
      </div>
    </div>
  );
};
