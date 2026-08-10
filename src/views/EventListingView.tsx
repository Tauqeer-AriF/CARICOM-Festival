import React, { useState, useEffect } from 'react';
import { FESTIVAL_EVENTS } from '../data/festivalData';
import { ActiveTab, EventItem } from '../types';
import { MapPin, Clock, Filter, ShieldCheck, Ticket, Users } from 'lucide-react';
import { LuxurySkeletonOverlay } from '../components/LuxurySkeletonOverlay';

interface EventListingViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  events?: EventItem[];
}

export const EventListingView: React.FC<EventListingViewProps> = ({ setActiveTab, events = [] }) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedDay, setSelectedDay] = useState<number | 'All'>('All');
  const [isFiltering, setIsFiltering] = useState(false);

  const genresList = ['All', 'Soca', 'Afro', 'Reggae', 'Soul', 'R&B', 'Jungle'];

  const handleGenreChange = (genre: string) => {
    if (genre === selectedGenre) return;
    setIsFiltering(true);
    setSelectedGenre(genre);
    setTimeout(() => setIsFiltering(false), 260);
  };

  const handleDayChange = (val: string) => {
    setIsFiltering(true);
    setSelectedDay(val === 'All' ? 'All' : Number(val));
    setTimeout(() => setIsFiltering(false), 260);
  };

  const activeEvents = events.length > 0 ? events : FESTIVAL_EVENTS;

  const filteredEvents = activeEvents.filter((ev) => {
    const matchesGenre = selectedGenre === 'All' || ev.genres.includes(selectedGenre);
    const matchesDay = selectedDay === 'All' || ev.dayNumber === selectedDay;
    return matchesGenre && matchesDay;
  });

  return (
    <div className="space-y-10 pb-16">
      
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 font-sans-display">MAY 13 - MAY 22, 2027</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          10-Day Official Event Schedule
        </h1>
        <p className="text-slate-300 text-sm font-light leading-relaxed">
          Explore the full 10-day schedule of music fetes, White Gala parties, river tubing limes, and cultural showcases across Grenada.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 border border-white/10">
        
        {/* Genre Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0 font-sans-display">
            <Filter className="w-3.5 h-3.5 text-amber-400" /> Genre:
          </span>
          {genresList.map((genre) => (
            <button
              key={genre}
              onClick={() => handleGenreChange(genre)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === genre
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Day Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 font-sans-display">Day:</span>
          <select
            value={selectedDay}
            onChange={(e) => handleDayChange(e.target.value)}
            className="bg-[#0D121A] border border-white/15 text-xs font-semibold text-white p-2 px-3 rounded-full focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="All">All 10 Days</option>
            {FESTIVAL_EVENTS.map((ev) => (
              <option key={ev.id} value={ev.dayNumber}>
                Day {ev.dayNumber} - {ev.date}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Events Grid or Luxury Skeleton Overlay */}
      {isFiltering ? (
        <LuxurySkeletonOverlay type="cards" count={4} />
      ) : (
        <div
          key={`${selectedGenre}-${selectedDay}`}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
        {filteredEvents.map((ev, index) => (
          <div
            key={ev.id}
            style={{ animationDelay: `${index * 70}ms` }}
            className="animate-card-entrance glass-card glass-card-interactive rounded-3xl overflow-hidden border border-white/10 flex flex-col justify-between group shadow-xl"
          >
            {/* Image Header */}
            <div className="relative h-60 overflow-hidden">
              <img
                src={ev.highlightImage}
                alt={ev.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07090D] via-[#07090D]/40 to-transparent" />

              <div className="absolute top-3 left-3 bg-[#0B0E14]/90 backdrop-blur-md text-amber-300 text-[11px] font-mono font-bold px-3 py-1 rounded-full border border-amber-500/30">
                DAY {ev.dayNumber} • {ev.date}
              </div>

              {ev.wristbandRequired && (
                <div className="absolute top-3 right-3 bg-emerald-500/20 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Wristband Required
                </div>
              )}
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-5 flex-1 flex flex-col justify-between">
              
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-amber-300">
                  <span className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 text-amber-300 font-light">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> {ev.location}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10 text-slate-300 font-light">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {ev.time}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  {ev.title}
                </h3>

                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-light">
                  {ev.description}
                </p>

                {/* DJ Lineup & Dress code */}
                <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs font-light">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <strong className="text-white font-semibold">DJs / Artists:</strong> {ev.djLineup.join(', ')}
                  </div>
                  {ev.dressCode && (
                    <div className="text-amber-200/90 font-medium">
                      ✨ <strong className="text-amber-300">Dress Code:</strong> {ev.dressCode}
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 flex items-center justify-between border-t border-white/10">
                <div className="flex flex-wrap gap-1">
                  {ev.genres.map((g) => (
                    <span key={g} className="text-[10px] bg-white/5 text-slate-400 px-2.5 py-0.5 rounded-full border border-white/5">
                      #{g}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setActiveTab('shop')}
                  className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs rounded-full border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <Ticket className="w-3.5 h-3.5" /> Get Pass
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>
      )}

    </div>
  );
};


