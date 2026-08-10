import React, { useState, useEffect } from 'react';
import { FESTIVAL_DATE_STRING } from '../data/festivalData';
import { Calendar, Clock, Sparkles } from 'lucide-react';

interface CountdownTimerProps {
  variant?: 'hero' | 'widget';
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ variant = 'widget' }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date(FESTIVAL_DATE_STRING).getTime();

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
  }, []);

  if (variant === 'hero') {
    return (
      <div id="hero-countdown-timer" className="inline-flex items-center gap-3 sm:gap-5 px-5 sm:px-7 py-3 rounded-2xl bg-neutral-950/85 backdrop-blur-xl border border-amber-500/30 shadow-2xl shadow-amber-500/10">
        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-widest pr-3 border-r border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline">Countdown</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 text-center">
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight tabular-nums" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Days</span>
          </div>

          <span className="text-amber-500/40 text-lg font-bold pb-2.5">:</span>

          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight tabular-nums" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Hours</span>
          </div>

          <span className="text-amber-500/40 text-lg font-bold pb-2.5">:</span>

          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight tabular-nums" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Mins</span>
          </div>

          <span className="hidden sm:inline text-amber-500/40 text-lg font-bold pb-2.5">:</span>

          <div className="hidden sm:flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight animate-pulse tabular-nums" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-amber-300/80 font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Secs</span>
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
              MAY 13 - 17, 2027 • SPICE ISLE
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 md:gap-4 text-center w-full md:w-auto">
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-3 min-w-[60px] sm:min-w-[70px] md:min-w-[88px] shadow-inner">
            <span className="block text-2xl md:text-3xl font-black text-amber-300 tracking-tight tabular-nums" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Days</span>
          </div>

          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-3 min-w-[60px] sm:min-w-[70px] md:min-w-[88px] shadow-inner">
            <span className="block text-2xl md:text-3xl font-black text-amber-300 tracking-tight tabular-nums" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Hours</span>
          </div>

          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl p-3 min-w-[60px] sm:min-w-[70px] md:min-w-[88px] shadow-inner">
            <span className="block text-2xl md:text-3xl font-black text-amber-300 tracking-tight tabular-nums" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Mins</span>
          </div>

          <div className="bg-[#0B0E14] border border-amber-500/30 rounded-2xl p-3 min-w-[60px] sm:min-w-[70px] md:min-w-[88px] shadow-inner bg-amber-500/5">
            <span className="block text-2xl md:text-3xl font-black text-amber-400 tracking-tight animate-pulse tabular-nums" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] md:text-[10px] text-amber-300 uppercase tracking-widest font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Secs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

