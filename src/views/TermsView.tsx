import React from 'react';
import { ActiveTab } from '../types';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface TermsViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const TermsView: React.FC<TermsViewProps> = ({ setActiveTab }) => {
  return (
    <div className="space-y-8 animate-fadeIn pb-16 max-w-4xl mx-auto text-xs sm:text-sm text-neutral-300">
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-xl">
        <div className="space-y-2 border-b border-neutral-800 pb-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono uppercase inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Code of Conduct & Rules
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
            Festival Terms, Conditions & Wristband Rules
          </h1>
        </div>

        <div className="space-y-4 leading-relaxed font-light">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white font-serif text-amber-400">1. Age Requirement</h3>
            <p>Grenada CARICOM Festival 2027 events are strictly 18+. Valid photo ID (passport or driver's licence) is required upon wristband collection.</p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white font-serif text-amber-400">2. Wristband Policy</h3>
            <p>Wristbands must be worn securely on the wrist at all times during festival events. Tampered, cut, or lost wristbands will not be replaced free of charge.</p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white font-serif text-amber-400">3. Respect for Island Culture</h3>
            <p>We pride ourselves on community unity, warm hospitality, and zero tolerance for harassment, violence, or illegal substances.</p>
          </section>
        </div>

        <div className="pt-4 border-t border-neutral-800">
          <button
            onClick={() => setActiveTab('home')}
            className="px-6 py-2.5 bg-amber-500 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
          >
            <span>Return to Home</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
