import React from 'react';
import { ActiveTab, PassItem } from '../types';
import { getPageImage } from '../services/submissionService';
import { 
  Waves, 
  Compass, 
  Utensils, 
  ShieldCheck, 
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

interface AboutMellowlandViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onAddToCart: (pass: PassItem) => void;
  passes: PassItem[];
  currency: 'GBP' | 'USD' | 'XCD';
}

export const AboutMellowlandView: React.FC<AboutMellowlandViewProps> = ({ setActiveTab, onAddToCart, passes, currency }) => {
  const heroImg = getPageImage('aboutMellowlandHero', 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=1200&q=80');
  const riverImg = getPageImage('aboutMellowlandRiver', 'https://images.unsplash.com/photo-1530731141654-5961b695817a?auto=format&fit=crop&w=1200&q=80');
  const gardenImg = getPageImage('aboutMellowlandGarden', 'https://images.unsplash.com/photo-1541976844346-f18aeac57b06?auto=format&fit=crop&w=1200&q=80');

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

  const tubingPass = passes.find(p => p.id.includes('tubing')) || passes[0];

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Hero Banner */}
      <div data-no-invert className="relative rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl min-h-[300px] sm:min-h-[380px] flex items-center p-6 sm:p-12">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono tracking-wider uppercase inline-flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5" /> Festival Epicentre
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif tracking-tight leading-tight">
            Mellowland <span className="text-gold-gradient">Complex & River Tubing</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed">
            Nestled in Grenada’s verdant valley, Mellowland is the premier eco-entertainment complex hosting guided river tubing, outdoor stages, and farm-to-table culinary limes.
          </p>
        </div>
      </div>

      {/* Feature Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* River Tubing Block */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl space-y-4 flex flex-col justify-between">
          <div className="relative h-56 overflow-hidden">
            <img src={riverImg} alt="River Tubing Rapids" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-4 bg-amber-500 text-neutral-950 font-black text-xs font-mono px-3 py-1 rounded-lg uppercase">
              Main Attraction
            </span>
          </div>
          <div className="p-6 space-y-3 flex-1">
            <h3 className="text-xl font-bold text-white font-serif flex items-center gap-2">
              <Waves className="w-5 h-5 text-amber-400" />
              <span>Guided River Tubing Excursion</span>
            </h3>
            <p className="text-neutral-300 text-xs sm:text-sm font-light leading-relaxed">
              Drift along Grenada’s refreshing mountain river currents through lush rainforest canopy. All sessions are 45 minutes long, fully guided with certified life vests, safety helmets, and experienced river marshals.
            </p>
            <ul className="text-xs text-neutral-400 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full safety gear (Life vest, Helmet, River Marshals)</span>
              </li>
              <li className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Suitable for beginners & groups</span>
              </li>
              <li className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Complimentary fresh coconut water at river exit</span>
              </li>
            </ul>
          </div>
          <div className="p-6 pt-0">
            {tubingPass && (
              <button
                onClick={() => onAddToCart(tubingPass)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Book River Tubing Add-On ({getCurrencySymbol()}{getCurrencyRate(tubingPass.priceGBP)})</span>
              </button>
            )}
          </div>
        </div>

        {/* Eco Garden & Outdoor Pavilion */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl space-y-4 flex flex-col justify-between">
          <div className="relative h-56 overflow-hidden">
            <img src={gardenImg} alt="Mellowland Organic Garden" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-4 bg-emerald-500 text-neutral-950 font-black text-xs font-mono px-3 py-1 rounded-lg uppercase">
              Culinary & Culture
            </span>
          </div>
          <div className="p-6 space-y-3 flex-1">
            <h3 className="text-xl font-bold text-white font-serif flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-400" />
              <span>Organic Garden & Outdoor Pavilion</span>
            </h3>
            <p className="text-neutral-300 text-xs sm:text-sm font-light leading-relaxed">
              Mellowland features an organic spice and fruit garden providing fresh ingredients for our daily culinary limes. Enjoy live acoustic soca, local grilled fish, oil down tastings, and open-air cocktail bars.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <span className="font-bold text-amber-400 block">Location</span>
                <span className="text-neutral-400 text-[11px] block">St. David's Parish, Grenada</span>
              </div>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <span className="font-bold text-amber-400 block">Shuttle Time</span>
                <span className="text-neutral-400 text-[11px] block">20 mins from Grand Anse</span>
              </div>
            </div>
          </div>
          <div className="p-6 pt-0">
            <button
              onClick={() => setActiveTab('events')}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View Mellowland Events</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
