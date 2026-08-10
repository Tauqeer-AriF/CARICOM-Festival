import React from 'react';
import { FESTIVAL_TESTIMONIALS } from '../data/festivalData';
import { ActiveTab } from '../types';
import { Sparkles, Star, Quote, Heart, Music, MessageSquare } from 'lucide-react';

interface TestimonialsViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const TestimonialsView: React.FC<TestimonialsViewProps> = ({ setActiveTab }) => {
  return (
    <div className="space-y-12 pb-12">
      
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 font-sans-display">CARIBBEAN UNITY & REVELER VOICES</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Festival Testimonials
        </h1>
        <p className="text-slate-300 text-sm font-light leading-relaxed">
          Hear what previous revelers, London DJs, and Caribbean visitors say about the Grenada CARICOM Carnival experience.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {FESTIVAL_TESTIMONIALS.map((item) => (
          <div
            key={item.id}
            className="bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 rounded-3xl p-8 space-y-6 shadow-xl transition-all relative flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex text-amber-400">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-neutral-700" />
              </div>

              <p className="text-sm text-neutral-200 italic leading-relaxed font-serif">
                "{item.quote}"
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center gap-3">
              <img
                src={item.avatar}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/40"
              />
              <div>
                <h4 className="font-bold text-sm text-white">{item.name}</h4>
                <span className="text-xs text-amber-400 font-medium block">{item.location}</span>
                <span className="text-[10px] text-neutral-400">{item.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Share Your Story Card */}
      <div className="bg-gradient-to-r from-amber-600/20 via-emerald-600/20 to-teal-600/20 border border-amber-500/30 rounded-3xl p-8 text-center space-y-4 max-w-2xl mx-auto shadow-2xl">
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="text-2xl font-bold font-serif text-white">Joining Us in May 2027?</h3>
        <p className="text-xs sm:text-sm text-neutral-300">
          Be part of the legend! Lock in your passes, submit your flight details, and join us for an unforgettable reunion in the Spice Isle.
        </p>
        <button
          onClick={() => setActiveTab('shop')}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer"
        >
          Book Your Festival Passes Now
        </button>
      </div>

    </div>
  );
};
