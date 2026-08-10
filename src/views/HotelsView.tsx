import React from 'react';
import { ActiveTab, HotelItem } from '../types';
import { Hotel, Star, CheckCircle2, ShieldCheck, MapPin, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { FESTIVAL_IMAGES } from '../data/festivalData';

interface HotelsViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  hotels?: HotelItem[];
}

// Custom animation presets for a premium aesthetic
const fadeInUp = {
  hidden: { opacity: 0, y: 35 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

export const HotelsView: React.FC<HotelsViewProps> = ({ setActiveTab, hotels = [] }) => {
  const activeHotels = hotels;

  return (
    <div className="space-y-12 pb-12">
      
      {/* Title */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="text-center max-w-3xl mx-auto space-y-3"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 font-sans-display">LUXURY & CONVENIENCE IN GRENADA</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          List of Recommended Hotels
        </h1>
        <p className="text-slate-300 text-sm font-light leading-relaxed">
          Select from Grenada's top beachfront resorts. All listed partner hotels feature dedicated Mellows Entertainment pickup points and reception listings.
        </p>
      </motion.div>

      {activeHotels.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-neutral-900/40 rounded-3xl border border-neutral-800">
          <Hotel className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Partner Hotels Listed</h3>
          <p className="text-sm text-slate-400 font-light max-w-sm mx-auto">There are no partner hotels currently registered in our database.</p>
        </div>
      ) : (
        <>
          {/* Featured Spotlight - Royalton */}
          {activeHotels.filter((h) => h.isRecommended).map((hotel) => (
            <motion.div
              key={hotel.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/60 border-2 border-amber-500 rounded-3xl p-8 md:p-12 shadow-2xl space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-amber-500 text-neutral-950 text-xs font-extrabold px-6 py-2 rounded-bl-3xl uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-4 h-4 fill-neutral-950" /> HIGHLY RECOMMENDED RESORT
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-2">
                
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-amber-400">
                    {Array.from({ length: hotel.stars }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400" />
                    ))}
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-white">
                    {hotel.name}
                  </h2>

                  <p className="text-amber-300 font-semibold text-sm">
                    "{hotel.tagline}"
                  </p>

                  <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
                    {hotel.description}
                  </p>

                  <div className="p-4 bg-neutral-950/90 rounded-2xl border border-amber-500/30 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Official Mellows Event Desk On-Site:
                    </div>
                    <p className="text-neutral-300">
                      Daily event listings and wristband support will be placed in the hotel reception area or handled directly by your dedicated Mellows representative. <strong className="text-amber-300">No stress!</strong>
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider block">Key Features:</span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-200">
                      {hotel.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 flex flex-wrap items-center gap-4">
                    {hotel.bookingUrl && (
                      <a
                        href={hotel.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center gap-2"
                      >
                        Visit Royalton Website
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setActiveTab('register')}
                      className="px-6 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Register Hotel Selection
                    </button>
                  </div>

                </div>

                <div className="relative rounded-2xl overflow-hidden h-[380px] border border-neutral-700 shadow-2xl">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.royaltonResort;
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 bg-neutral-950/90 p-4 rounded-xl border border-amber-500/30 text-xs">
                    <span className="font-bold text-amber-300 block">{hotel.location}</span>
                    <span className="text-neutral-400">{hotel.distanceToMellowland} to Mellowland Fete Complex</span>
                  </div>
                </div>

              </div>

            </motion.div>
          ))}

          {/* Other Partner Hotels Grid */}
          <div className="space-y-6 pt-4">
            <h3 className="text-2xl font-bold font-serif text-white border-l-4 border-amber-500 pl-3">
              Other Partner Accommodations
            </h3>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {activeHotels.filter((h) => !h.isRecommended).map((hotel) => (
                <motion.div
                  key={hotel.id}
                  variants={fadeInUp}
                  className="glass-card glass-card-interactive rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between"
                >
                  <div className="relative h-48">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.royaltonResort;
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-neutral-950/90 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-lg">
                      {hotel.stars} ★
                    </div>
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-bold font-serif text-lg text-white">{hotel.name}</h4>
                      <p className="text-xs text-amber-300 font-medium">{hotel.tagline}</p>
                      <p className="text-xs text-neutral-300 leading-relaxed">{hotel.description}</p>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs">
                      <div className="text-neutral-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" /> {hotel.location}
                      </div>
                      <button
                        onClick={() => setActiveTab('register')}
                        className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors text-xs"
                      >
                        Register Staying Here
                      </button>
                    </div>
                  </div>

                </motion.div>
              ))}
            </motion.div>
          </div>
        </>
      )}

    </div>
  );
};
