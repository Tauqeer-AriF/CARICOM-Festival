import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ActiveTab, EventItem } from '../types';
import { getSiteConfig, getPageImage } from '../services/submissionService';
import { formatEventDateRange, calculateDurationDays, getEffectiveFestivalDateRange } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Music, 
  Tag, 
  Sparkles, 
  ChevronRight, 
  Filter, 
  Search,
  Shirt,
  ShieldCheck,
  Disc,
  Radio,
  X
} from 'lucide-react';

interface EventListingViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  events: EventItem[];
}

export const EventListingView: React.FC<EventListingViewProps> = ({ setActiveTab, events }) => {
  const siteConfig = getSiteConfig();
  const bannerImage = getPageImage('eventsBanner', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80');
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeEventModal, setActiveEventModal] = useState<EventItem | null>(null);

  // Dynamically compute filter buttons: only show categories that have at least one related event
  const categories = useMemo(() => {
    const presentCatsMap = new Map<string, string>();
    events.forEach(evt => {
      const cat = evt.category?.trim();
      if (cat) {
        const lower = cat.toLowerCase();
        if (!presentCatsMap.has(lower)) {
          presentCatsMap.set(lower, cat);
        }
      }
    });

    const activeList = Array.from(presentCatsMap.values());
    return ['All', ...activeList];
  }, [events]);

  // If the active filter button no longer has any associated events, safely reset to 'All'
  useEffect(() => {
    if (selectedCategory !== 'All') {
      const exists = categories.some(c => c.toLowerCase() === selectedCategory.toLowerCase());
      if (!exists) {
        setSelectedCategory('All');
      }
    }
  }, [categories, selectedCategory]);

  const filteredEvents = events.filter(evt => {
    const evtCat = evt.category || 'Party';
    const matchesCategory = selectedCategory === 'All' || evtCat.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = evt.title.toLowerCase().includes(query) || 
                          evt.description.toLowerCase().includes(query) ||
                          evtCat.toLowerCase().includes(query) ||
                          (evt.djLineup && evt.djLineup.some(dj => dj.toLowerCase().includes(query))) ||
                          (evt.genres && evt.genres.some(g => g.toLowerCase().includes(query)));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Hero Banner */}
      <div data-no-invert className="relative rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl min-h-[280px] sm:min-h-[340px] flex items-center p-6 sm:p-12">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 transform scale-105"
          style={{ backgroundImage: `url(${bannerImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono tracking-wider uppercase inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {getEffectiveFestivalDateRange(siteConfig, events).toUpperCase()} • SCHEDULE
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif tracking-tight leading-tight">
            Festival <span className="text-gold-gradient">Event Schedule</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed">
            Explore the full festival itinerary featuring London & Grenada’s top DJs, beach fetes, river tubing, cultural street parades, and the grand White Gala.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills (Only visible when events exist for that filter) */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {categories.map((cat) => {
            const count = cat === 'All'
              ? events.length 
              : events.filter(e => (e.category || '').toLowerCase() === cat.toLowerCase()).length;
            
            // Guard: do not render category button if 0 events are related to that filter
            if (cat !== 'All' && count === 0) return null;

            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 font-black' 
                    : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected
                    ? 'bg-neutral-950/20 text-neutral-950'
                    : 'bg-neutral-900/90 text-neutral-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events, DJs, venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group bg-neutral-900/90 border border-neutral-800/80 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col"
          >
            {/* Thumbnail Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={event.highlightImage}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
              
              {/* Day Badge */}
              <div className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur-md border border-amber-500/40 text-amber-400 text-xs font-black font-mono px-3 py-1 rounded-lg">
                DAY {event.dayNumber}
              </div>

              {/* Category Badge */}
              <div className="absolute top-3 right-3 bg-amber-500 text-neutral-950 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider">
                {event.category}
              </div>
            </div>

            {/* Event Details Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400/90 text-xs font-semibold flex-wrap">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{formatEventDateRange(event.startDate, event.endDate, event.date)}</span>
                  {calculateDurationDays(event.startDate, event.endDate) > 1 && (
                    <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                      {calculateDurationDays(event.startDate, event.endDate)} Days
                    </span>
                  )}
                  <span className="text-neutral-600">•</span>
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{event.time}</span>
                </div>

                <h3 className="text-lg font-bold text-white font-serif group-hover:text-amber-300 transition-colors leading-snug">
                  {event.title}
                </h3>

                <p className="text-neutral-400 text-xs leading-relaxed line-clamp-2">
                  {event.description}
                </p>

                {/* Music Genres Badges */}
                {event.genres && event.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {event.genres.map((genre, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-0.5 rounded-md bg-neutral-950/80 border border-neutral-800 text-amber-300 text-[10px] font-bold tracking-wide flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-amber-400" />
                        <span>{genre}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Location & DJ Lineup */}
              <div className="pt-3 border-t border-neutral-800/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-neutral-300">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>

                {event.djLineup && event.djLineup.length > 0 && (
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Disc className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate text-[11px]">
                      DJs: {event.djLineup.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => setActiveEventModal(event)}
                className="w-full mt-2 py-2.5 px-4 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 group/btn"
              >
                <span>View Full Details</span>
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-16 bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-3">
          <Calendar className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Events Found</h3>
          <p className="text-xs text-neutral-400">Try adjusting your search query or category filter.</p>
        </div>
      )}

      {/* Event Details Modal */}
      {createPortal(
        <AnimatePresence>
          {activeEventModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-amber-500/30 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col z-[10000]"
              >
                {/* Modal Header Image */}
                <div className="relative h-60 sm:h-72 shrink-0">
                  <img
                    src={activeEventModal.highlightImage}
                    alt={activeEventModal.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
                  
                  <button
                    onClick={() => setActiveEventModal(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-neutral-950/80 text-white hover:bg-amber-500 hover:text-neutral-950 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-4 left-6 right-6 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-amber-500 text-neutral-950 text-[10px] font-black px-2.5 py-0.5 rounded font-mono uppercase">
                        DAY {activeEventModal.dayNumber}
                      </span>
                      <span className="bg-neutral-900/90 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {activeEventModal.category || 'Event'}
                      </span>
                      <span className="text-amber-400 text-xs font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatEventDateRange(activeEventModal.startDate, activeEventModal.endDate, activeEventModal.date)}
                      </span>
                      {calculateDurationDays(activeEventModal.startDate, activeEventModal.endDate) > 1 ? (
                        <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded font-mono uppercase">
                          {calculateDurationDays(activeEventModal.startDate, activeEventModal.endDate)}-Day Event
                        </span>
                      ) : (
                        <span className="bg-neutral-800/80 border border-neutral-700 text-neutral-400 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                          1-Day Event
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
                      {activeEventModal.title}
                    </h2>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
                  <p className="text-neutral-300 leading-relaxed font-light">
                    {activeEventModal.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-neutral-500 block font-bold">Venue & Location</span>
                      <div className="flex items-center gap-1.5 text-white font-semibold">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span>{activeEventModal.location}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-neutral-500 block font-bold">Time & Schedule</span>
                      <div className="flex items-center gap-1.5 text-white font-semibold">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>{activeEventModal.time}</span>
                      </div>
                    </div>

                    {activeEventModal.dressCode && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-mono text-neutral-500 block font-bold">Dress Code</span>
                        <div className="flex items-center gap-1.5 text-white font-semibold">
                          <Shirt className="w-4 h-4 text-amber-400" />
                          <span>{activeEventModal.dressCode}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-neutral-500 block font-bold">Access Policy</span>
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>{activeEventModal.wristbandRequired ? 'Wristband Required' : 'Open Entry'}</span>
                      </div>
                    </div>
                  </div>

                  {activeEventModal.genres && activeEventModal.genres.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Tag className="w-4 h-4" /> Music Genres
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {activeEventModal.genres.map((genre, i) => (
                          <span key={i} className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-amber-400" /> {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeEventModal.djLineup && activeEventModal.djLineup.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Disc className="w-4 h-4" /> DJ Lineup & Entertainers
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {activeEventModal.djLineup.map((dj, i) => (
                          <span key={i} className="px-3 py-1 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs font-medium">
                            🎧 {dj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => {
                        setActiveEventModal(null);
                        setActiveTab('shop');
                      }}
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer text-center"
                    >
                      Get Festival Pass
                    </button>
                    <button
                      onClick={() => setActiveEventModal(null)}
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
