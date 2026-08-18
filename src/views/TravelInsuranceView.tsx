import React from 'react';
import { ActiveTab } from '../types';
import { getSiteConfig, getPageImage } from '../services/submissionService';
import { motion } from 'motion/react';
import { ShieldCheck, Check, HelpCircle, ArrowRight } from 'lucide-react';

interface TravelInsuranceViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const TravelInsuranceView: React.FC<TravelInsuranceViewProps> = ({ setActiveTab }) => {
  const siteConfig = getSiteConfig();
  const bannerImg = getPageImage('travelInsuranceBanner', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80');

  return (
    <div className="space-y-12 animate-fadeIn pb-16 max-w-4xl mx-auto">
      {/* Hero Banner */}
      <div data-no-invert className="relative rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl min-h-[260px] flex items-center p-6 sm:p-10">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent" />
        <div className="relative z-10 space-y-3">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono tracking-wider uppercase inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Buyer Peace of Mind
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif">
            30-Day Cancellation <span className="text-gold-gradient">Guarantee Policy</span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-light leading-relaxed max-w-xl">
            We want you to book your Grenada CARICOM Festival 2027 passes with 100% confidence. Review our straightforward 30-day cancellation terms and travel protection guidelines.
          </p>
        </div>
      </div>

      {/* Guarantee Cards */}
      <div className="space-y-6">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-white font-serif text-amber-400">
            1. Full Refund Within 30 Days of Purchase
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
            All festival passes, wristbands, and river tubing add-ons are eligible for a 100% full refund within 30 calendar days of initial order date (up to 60 days before event commencement on May 22, 2027).
          </p>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-white font-serif text-amber-400">
            2. Pass Transferability Policy
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
            Unable to attend last-minute? You can transfer your festival wristband pass to a friend or family member up to 48 hours prior to festival start at zero additional transfer cost.
          </p>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-white font-serif text-amber-400">
            3. Travel Insurance Recommendations
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
            For international guests traveling from the UK, US, or Canada, we strongly recommend securing comprehensive travel insurance covering flight delays, luggage, and personal medical expenses.
          </p>
        </div>
      </div>

      <div className="text-center pt-4">
        <button
          onClick={() => setActiveTab('shop')}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <span>Back to Festival Passes</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
