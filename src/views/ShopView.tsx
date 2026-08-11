import React, { useState } from 'react';
import { ActiveTab, PassItem } from '../types';
import { getSiteConfig, getPageImage } from '../services/submissionService';
import { motion } from 'motion/react';
import { 
  Ticket, 
  Check, 
  Sparkles, 
  ShoppingBag, 
  ShieldCheck, 
  ArrowRight,
  Crown
} from 'lucide-react';

interface ShopViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onAddToCart: (pass: PassItem) => void;
  currency: string;
  passes: PassItem[];
}

export const ShopView: React.FC<ShopViewProps> = ({ setActiveTab, onAddToCart, currency, passes }) => {
  const siteConfig = getSiteConfig();
  const passesBanner = getPageImage('passesBanner', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80');

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl min-h-[300px] sm:min-h-[380px] flex items-center p-6 sm:p-12">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${passesBanner})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono tracking-wider uppercase inline-flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5" /> Official Festival Passes
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif tracking-tight leading-tight">
            Select Your <span className="text-gold-gradient">Festival Wristband</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed">
            Choose your 10-day VIP pass tier or adventure add-ons. Lock in your entry to all beach fetes, Mellowland river tubing, and the White Gala.
          </p>
        </div>
      </div>

      {/* Passes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {passes.map((pass) => (
          <motion.div
            key={pass.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`relative bg-neutral-900/90 border rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 ${
              pass.popular 
                ? 'border-amber-500/80 shadow-amber-500/10 scale-102 bg-gradient-to-b from-neutral-900 via-neutral-900 to-amber-950/20' 
                : 'border-neutral-800 hover:border-amber-500/40'
            }`}
          >
            {pass.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-neutral-950 font-black text-[10px] uppercase font-mono px-4 py-1 rounded-full shadow-lg tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3" /> Most Popular Pass
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2 text-center pt-2">
                <span className="text-[10px] uppercase font-mono font-bold text-amber-400 tracking-widest block">
                  {pass.wristbandType}
                </span>
                <h3 className="text-2xl font-bold text-white font-serif">{pass.title}</h3>
                <p className="text-xs text-neutral-400 font-light">{pass.subtitle}</p>
              </div>

              {/* Price Tag */}
              <div className="text-center bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 space-y-1">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-serif">
                    £{pass.priceGBP}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">GBP</span>
                </div>
                <p className="text-[10px] text-neutral-500 font-mono">
                  Approx. ${pass.priceUSD} USD / ${Math.round(pass.priceUSD * 2.7)} XCD
                </p>
              </div>

              {/* Included Events Label */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                <span className="text-xs font-bold text-amber-300 block">
                  {pass.includedEvents}
                </span>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2.5 text-xs text-neutral-300">
                <span className="text-[10px] font-bold font-mono text-neutral-500 uppercase tracking-wider block">
                  What's Included:
                </span>
                {pass.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-tight font-light">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => onAddToCart(pass)}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add Pass to Cart (£{pass.priceGBP})</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
