import React, { useState, useEffect } from 'react';
import { FESTIVAL_DATE_STRING } from '../data/festivalData';
import { getSiteConfig } from '../services/submissionService';
import { getEffectiveFestivalDateRange } from '../utils/dateUtils';
import { SiteConfig } from '../types';
import { Calendar, Clock, Sparkles } from 'lucide-react';

interface CountdownTimerProps {
  variant?: 'hero' | 'widget';
  siteConfig?: SiteConfig;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ variant = 'widget', siteConfig: propSiteConfig }) => {
  const [config, setConfig] = useState<SiteConfig>(propSiteConfig || getSiteConfig());
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (propSiteConfig) {
      setConfig(propSiteConfig);
    }
  }, [propSiteConfig]);

  useEffect(() => {
    const handleConfigChange = (e?: any) => {
      if (e?.detail) {
        setConfig(e.detail);
      } else {
        setConfig(getSiteConfig());
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'grenada_caricom_site_config_v1' || e.key === 'grenada_caricom_events_v4' || e.key === 'grenada_site_config') {
        setConfig(getSiteConfig());
      }
    };

    window.addEventListener('site_config_updated', handleConfigChange);
    window.addEventListener('events_updated', handleConfigChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('site_config_updated', handleConfigChange);
      window.removeEventListener('events_updated', handleConfigChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const targetDateString = config?.festivalDates?.startDate 
    ? `${config.festivalDates.startDate}T${config.festivalDates.startTime || '18:00:00'}`
    : FESTIVAL_DATE_STRING;

  const festivalDateDisplay = getEffectiveFestivalDateRange(config);
  const dateHeading = `${festivalDateDisplay.toUpperCase()} • SPICE ISLE`;

  useEffect(() => {
    const targetDate = new Date(targetDateString).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [targetDateString]);

  if (variant === 'hero') {
    return (
      <div id="hero-countdown-timer" className="inline-flex items-center gap-3 sm:gap-5 px-5 sm:px-7 py-3 rounded-2xl bg-neutral-950/85 backdrop-blur-xl border border-amber-500/30 shadow-2xl shadow-amber-500/10">
        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-widest pr-3 border-r border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline">Countdown</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 text-center">
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight tabular-nums font-heading">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Days</span>
          </div>

          <span className="text-amber-500/40 text-lg font-bold pb-2.5">:</span>

          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight tabular-nums font-heading">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Hours</span>
          </div>

          <span className="text-amber-500/40 text-lg font-bold pb-2.5">:</span>

          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight tabular-nums font-heading">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Mins</span>
          </div>

          <span className="hidden sm:inline text-amber-500/40 text-lg font-bold pb-2.5">:</span>

          <div className="hidden sm:flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight animate-pulse tabular-nums font-heading">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-amber-300/80 font-semibold">Secs</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="countdown-widget" className="glass-card rounded-3xl p-6 md:p-8 shadow-2xl text-white border border-amber-500/20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-semibold flex items-center gap-1.5 font-sans-display">
              <Clock className="w-3.5 h-3.5" /> Official Festival Countdown
            </div>
            <h3 className="text-xl md:text-2xl font-bold font-serif tracking-tight text-white mt-0.5">
              {dateHeading}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 md:gap-4 text-center w-full md:w-auto">
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-3 min-w-[60px] sm:min-w-[70px] md:min-w-[88px] shadow-inner">
            <span className="block text-2xl md:text-3xl font-black text-amber-300 tracking-tight tabular-nums font-heading">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Days</span>
          </div>

          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-3 min-w-[60px] sm:min-w-[70px] md:min-w-[88px] shadow-inner">
            <span className="block text-2xl md:text-3xl font-black text-amber-300 tracking-tight tabular-nums font-heading">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Hours</span>
          </div>

          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-3 min-w-[60px] sm:min-w-[70px] md:min-w-[88px] shadow-inner">
            <span className="block text-2xl md:text-3xl font-black text-amber-300 tracking-tight tabular-nums font-heading">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Mins</span>
          </div>

          <div className="bg-[#0B0E14] border border-amber-500/30 rounded-2xl p-3 min-w-[60px] sm:min-w-[70px] md:min-w-[88px] shadow-inner bg-amber-500/5">
            <span className="block text-2xl md:text-3xl font-black text-amber-400 tracking-tight animate-pulse tabular-nums font-heading">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] md:text-[10px] text-amber-300 uppercase tracking-widest font-semibold">Secs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

