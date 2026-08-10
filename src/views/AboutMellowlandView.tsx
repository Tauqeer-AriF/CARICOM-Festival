import React from 'react';
import { ActiveTab, PassItem } from '../types';
import { FESTIVAL_IMAGES, FESTIVAL_PASSES } from '../data/festivalData';
import { Waves, Shield, Utensils, Camera, Clock, Ticket, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

interface AboutMellowlandViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onAddToCart: (pass: PassItem) => void;
}

export const AboutMellowlandView: React.FC<AboutMellowlandViewProps> = ({ setActiveTab, onAddToCart }) => {
  const tubingPass = FESTIVAL_PASSES.find((p) => p.id === 'pass-mellowland-tubing') || FESTIVAL_PASSES[0];

  return (
    <div className="space-y-12 pb-12">
      
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 font-sans-display">PIONEERS OF RIVER TUBING IN GRENADA</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          About Mellowland
        </h1>
        <p className="text-slate-300 text-sm font-light leading-relaxed">
          Mellows Entertainment Complex — or Mellowland as we like to call it — is Grenada's premier river adventure, organic restaurant, and outdoor party oasis.
        </p>
      </div>

      {/* Main Banner */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/50 border border-amber-500/30 rounded-3xl p-8 md:p-12 shadow-2xl space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
              <Sparkles className="w-4 h-4 text-emerald-400" /> ORGANIC FOOD & RIVER ADVENTURES
            </div>

            <h2 className="text-3xl font-extrabold text-white">
              Welcome to Mellows Entertainment Complex
            </h2>

            <p className="text-neutral-300 text-sm leading-relaxed">
              Mellows Entertainment Complex, or <strong className="text-amber-400">Mellowland</strong> as we like to call it, is a lovely bar and restaurant that serves organic food straight from our own garden. We also have some fun outdoor parties and activities like river tubing and hiking.
            </p>

            <p className="text-neutral-300 text-sm leading-relaxed">
              Come and have a great time with your friends and family at Mellow’s Entertainment Complex—<strong className="text-amber-300">we’re the first to bring river tubing to Grenada!</strong>
            </p>

            <div className="p-4 bg-neutral-950/80 rounded-2xl border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
              <Ticket className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-400 text-sm">Entry Note:</strong>
                Wristbands must be obtained to ensure your entry (Party Time!).
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden h-[340px] border border-neutral-700 shadow-xl">
            <img
              src={FESTIVAL_IMAGES.riverTubing}
              alt="Mellowland River Tubing"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 bg-neutral-950/90 p-3 rounded-xl text-xs text-white">
              <span className="text-amber-400 font-bold block">45-Minute River Tubing Sessions</span>
              <span>Supervised by professional guides with helmets, life jackets, and tubes provided.</span>
            </div>
          </div>

        </div>

      </div>

      {/* Tubing Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-3">
          <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center">
            <Waves className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-serif text-white">Thrilling River Rapids</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Get ready for an exciting and fun adventure navigating the rapids, all while enjoying the beauty of untouched nature. Don’t forget to take amazing photos!
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-3">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-serif text-white">Safety & Supervision</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Our sessions are 45 minutes long, and we have professional guides who will be there to supervise you, providing helmets, life jackets, and safety tubes.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-3">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-serif text-white">Garden Lunch & Bar</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            And if you’re hungry, we have delicious organic lunch available straight from our garden, along with cold tropical drinks at our riverside bar.
          </p>
        </div>

      </div>

      {/* Book Pass CTA */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <h3 className="text-xl font-bold font-serif text-white">Ready to Tube Down the River?</h3>
          <p className="text-neutral-300 text-xs sm:text-sm">
            Lock in your Mellowland River Tubing & Garden Lunch Pass today or select the 10-Day VIP Pass for full access.
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => onAddToCart(tubingPass)}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <Ticket className="w-4 h-4" />
            Add Tubing Pass (£89)
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            View All Passes
          </button>
        </div>
      </div>

    </div>
  );
};
