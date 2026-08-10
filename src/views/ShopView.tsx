import React from 'react';
import { FESTIVAL_PASSES } from '../data/festivalData';
import { ActiveTab, PassItem } from '../types';
import { ShieldCheck, CheckCircle2, Sparkles, ShoppingBag } from 'lucide-react';

interface ShopViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onAddToCart: (pass: PassItem) => void;
  currency: 'GBP' | 'USD' | 'XCD';
  passes?: PassItem[];
}

export const ShopView: React.FC<ShopViewProps> = ({ setActiveTab, onAddToCart, currency, passes = [] }) => {
  const activePasses = passes.length > 0 ? passes : FESTIVAL_PASSES;

  const getCurrencyRate = (amountGBP: number) => {
    if (currency === 'USD') return Math.round(amountGBP * 1.28);
    if (currency === 'XCD') return Math.round(amountGBP * 3.45);
    return amountGBP;
  };

  const getCurrencySymbol = () => {
    if (currency === 'USD') return '$';
    if (currency === 'XCD') return 'EC$';
    return '£';
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 font-sans-display">OFFICIAL FESTIVAL PASSES & ACCESS</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Shop Festival Passes
        </h1>
        <p className="text-slate-300 text-sm font-light leading-relaxed">
          Select your official festival passes and wristbands. Wristbands will be issued upon arrival in Grenada at your hotel or Mellowland reception.
        </p>
      </div>

      {/* Passes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
        {activePasses.map((pass) => (
          <div
            key={pass.id}
            className={`rounded-3xl p-8 space-y-6 shadow-2xl flex flex-col justify-between relative transition-all duration-300 !overflow-visible ${
              pass.popular
                ? 'glass-card-amber border-2 border-amber-500/50 scale-[1.02] z-10'
                : 'glass-card border border-white/10'
            }`}
          >
            {/* Ambient inner glow for popular card */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent opacity-60" />
            </div>

            {pass.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 text-[10px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-amber-500/40 flex items-center gap-1.5 font-sans-display z-20 whitespace-nowrap border border-amber-300/60">
                <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" /> MOST POPULAR PASS
              </div>
            )}

            <div className="space-y-5">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-widest font-sans-display">{pass.wristbandType}</span>
                <h3 className="text-2xl font-bold text-white mt-1">{pass.title}</h3>
                <p className="text-slate-400 text-xs mt-1 font-light">{pass.subtitle}</p>
              </div>

              <div className="py-3 border-y border-white/10 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold font-mono text-gold-gradient">
                  {getCurrencySymbol()}{getCurrencyRate(pass.priceGBP)}
                </span>
                <span className="text-xs text-slate-400 font-light">/ per person</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-[#0B0E14] p-3.5 rounded-2xl border border-white/10 font-light">
                <strong className="text-amber-300 font-semibold">Included Events:</strong> {pass.includedEvents}
              </p>

              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block font-sans-display">Pass Perks:</span>
                <ul className="space-y-2.5 text-xs text-slate-200 font-light">
                  {pass.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 space-y-2">
              <button
                onClick={() => onAddToCart(pass)}
                className={`w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  pass.popular
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'glass-card hover:bg-white/10 text-white border border-white/15'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Reserve Pass ({getCurrencySymbol()}{getCurrencyRate(pass.priceGBP)})
              </button>

              <p className="text-[10px] text-center text-slate-500 font-light">
                Subject to 30-Day Cancellation Policy. Wristbands issued at hotel.
              </p>
            </div>

          </div>
        ))}
      </div>

      {/* Wristband Security Policy Notice */}
      <div className="glass-card-amber rounded-3xl p-8 space-y-3 border border-amber-500/30">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-amber-400" /> Wristband Security & Collection Terms
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-light">
          Your event passes and wristbands will be issued directly at your hotel upon arrival by Mellows representatives. Please keep them safe. Security personnel will check passes at all events. Wristbands must be worn at all times to ensure only registered revelers gain entry. If you lose a pass, an extra replacement charge applies.
        </p>
        <button
          onClick={() => setActiveTab('terms')}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline cursor-pointer"
        >
          Read Full Terms & Replacement Policy →
        </button>
      </div>

    </div>
  );
};

