import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ActiveTab, HotelItem } from '../types';
import { getSiteConfig, getPageImage } from '../services/submissionService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  Star, 
  MapPin, 
  ExternalLink, 
  Sparkles, 
  Check, 
  X,
  PhoneCall
} from 'lucide-react';

interface HotelsViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  hotels: HotelItem[];
}

export const HotelsView: React.FC<HotelsViewProps> = ({ setActiveTab, hotels }) => {
  const siteConfig = getSiteConfig();
  const bannerImg = getPageImage('hotelsBanner', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80');
  const [activeHotelModal, setActiveHotelModal] = useState<HotelItem | null>(null);

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Hero Banner */}
      <div data-no-invert className="relative rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl min-h-[300px] sm:min-h-[380px] flex items-center p-6 sm:p-12">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono tracking-wider uppercase inline-flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" /> Island Accommodation Partners
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif tracking-tight leading-tight">
            Official <span className="text-gold-gradient">Hotel & Resort Partners</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed">
            Stay in luxury during Grenada CARICOM Festival 2027. Enjoy discounted festival rates at beachfront resorts, boutique stays, and private villas with shuttle service to events.
          </p>
        </div>
      </div>

      {/* Hotel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map((hotel) => (
          <motion.div
            key={hotel.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group bg-neutral-900/90 border border-neutral-800/80 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="relative h-52 overflow-hidden">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />

                {hotel.isRecommended && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-neutral-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Recommended
                  </span>
                )}

                <div className="absolute bottom-3 right-3 bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{hotel.stars} Stars</span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                    {hotel.location}
                  </span>
                  <h3 className="text-xl font-bold text-white font-serif group-hover:text-amber-300 transition-colors">
                    {hotel.name}
                  </h3>
                  <p className="text-xs text-amber-400/90 italic font-light">
                    "{hotel.tagline}"
                  </p>
                </div>

                <p className="text-neutral-400 text-xs leading-relaxed line-clamp-3">
                  {hotel.description}
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 pt-2 border-t border-neutral-800">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{hotel.distanceToMellowland} to Mellowland</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {hotel.features.slice(0, 3).map((feat, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px]">
                      {feat}
                    </span>
                  ))}
                  {hotel.features.length > 3 && (
                    <span className="px-2 py-0.5 rounded-md bg-neutral-800/60 text-neutral-500 text-[10px]">
                      +{hotel.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => setActiveHotelModal(hotel)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>View Hotel & Booking Info</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hotel Details Modal */}
      {createPortal(
        <AnimatePresence>
          {activeHotelModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-amber-500/30 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col z-[10000]"
              >
                <div className="relative h-56 shrink-0">
                  <img src={activeHotelModal.image} alt={activeHotelModal.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                  <button
                    onClick={() => setActiveHotelModal(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-neutral-950/80 text-white hover:bg-amber-500 hover:text-neutral-950 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-6 right-6">
                    <div className="flex items-center gap-1 text-amber-400 text-xs font-bold mb-1">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{activeHotelModal.stars}-Star Resort</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white font-serif">{activeHotelModal.name}</h2>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 text-xs text-neutral-300">
                  <p className="leading-relaxed font-light">{activeHotelModal.description}</p>
                  
                  <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-amber-400">Amenities & Features</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {activeHotelModal.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 text-neutral-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    {activeHotelModal.bookingUrl ? (
                      <a
                        href={activeHotelModal.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                      >
                        <span>Book Direct at Hotel Website</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveHotelModal(null);
                          setActiveTab('contact');
                        }}
                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                      >
                        Contact Concierge for Booking
                      </button>
                    )}
                    <button
                      onClick={() => setActiveHotelModal(null)}
                      className="px-5 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
