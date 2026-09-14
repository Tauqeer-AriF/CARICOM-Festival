import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ActiveTab, DjBioItem } from '../types';
import { getSiteConfig, getPageImage } from '../services/submissionService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Instagram, 
  Facebook, 
  Sparkles, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  X, 
  Search, 
  Filter, 
  Radio, 
  Headphones, 
  Ticket,
  Flame,
  CheckCircle2,
  Video,
  ChevronLeft,
  ChevronRight,
  Youtube
} from 'lucide-react';

interface DJBioViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  djBios: DjBioItem[];
}

export const DJBioView: React.FC<DJBioViewProps> = ({ setActiveTab, djBios }) => {
  const siteConfig = getSiteConfig();
  const bannerImg = getPageImage(
    'djBanner',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedDjModal, setSelectedDjModal] = useState<DjBioItem | null>(null);

  // Pagination State (9 DJs per page)
  const ITEMS_PER_PAGE = 9;
  const [currentPage, setCurrentPage] = useState(1);

  // Horizontal Scroll & Drag-to-Scroll State
  const genresScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Check scroll boundary to show/hide indicators & buttons
  const checkScrollBoundaries = useCallback(() => {
    const el = genresScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  // Update scroll boundaries when genres or dimensions change
  useEffect(() => {
    checkScrollBoundaries();
    const el = genresScrollRef.current;
    if (!el) return;

    const handleResize = () => checkScrollBoundaries();
    window.addEventListener('resize', handleResize);
    el.addEventListener('scroll', checkScrollBoundaries, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      el.removeEventListener('scroll', checkScrollBoundaries);
    };
  }, [checkScrollBoundaries]);

  // Helper to find a DJ from name, moniker or ID
  const findMatchingDj = useCallback((queryStr: string): DjBioItem | undefined => {
    if (!queryStr) return undefined;
    // Strip trailing city/country parenthesis e.g. "DJ Slick (London)" -> "DJ Slick"
    const clean = queryStr.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
    const raw = queryStr.trim().toLowerCase();
    
    return djBios.find(dj => {
      const id = (dj.id || '').toLowerCase();
      const stage = (dj.stageName || '').trim().toLowerCase();
      const name = (dj.name || '').trim().toLowerCase();
      return (
        id === raw ||
        stage === clean ||
        name === clean ||
        stage === raw ||
        name === raw ||
        (clean.length >= 3 && (stage.includes(clean) || clean.includes(stage))) ||
        (clean.length >= 3 && (name.includes(clean) || clean.includes(name)))
      );
    });
  }, [djBios]);

  // Extract all unique genres for filter chips
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    djBios.forEach(dj => {
      if (dj.genres && Array.isArray(dj.genres)) {
        dj.genres.forEach(g => set.add(g.trim()));
      }
    });
    return Array.from(set);
  }, [djBios]);

  // Filtered DJs based on search and genre
  const filteredDjs = useMemo(() => {
    return djBios.filter(dj => {
      const matchesSearch = 
        !searchQuery.trim() ||
        (dj.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dj.stageName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dj.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dj.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dj.country || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGenre = 
        selectedGenre === 'all' || 
        (dj.genres && dj.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase()));

      return matchesSearch && matchesGenre;
    });
  }, [djBios, searchQuery, selectedGenre]);

  // Reset pagination to Page 1 on search or genre change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenre]);

  const totalPages = Math.max(1, Math.ceil(filteredDjs.length / ITEMS_PER_PAGE));

  // Ensure current page does not exceed totalPages when dataset shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Paginated subset of DJs (9 per page)
  const paginatedDjs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDjs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDjs, currentPage]);

  // Handle page change with smooth scroll to grid top
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    const gridEl = document.getElementById('dj-grid-top');
    if (gridEl) {
      gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Listen for open DJ profile events and check session storage
  useEffect(() => {
    const handleOpenDj = (e: Event) => {
      const customEv = e as CustomEvent<{ djName?: string; djId?: string }>;
      const target = customEv?.detail?.djId || customEv?.detail?.djName || sessionStorage.getItem('open_dj_name');
      if (target) {
        sessionStorage.removeItem('open_dj_name');
        const matched = findMatchingDj(target);
        if (matched) {
          // Calculate which page this DJ lives on and navigate there
          const djIdx = filteredDjs.findIndex(d => d.id === matched.id);
          if (djIdx !== -1) {
            const targetPage = Math.floor(djIdx / ITEMS_PER_PAGE) + 1;
            setCurrentPage(targetPage);
          }
          setSelectedDjModal(matched);
          setTimeout(() => {
            const el = document.getElementById(`dj-card-${matched.id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 250);
        } else {
          // If no direct DB match (e.g. custom guest act), search the query
          const cleanSearch = target.replace(/\s*\([^)]*\)/g, '').trim();
          setSearchQuery(cleanSearch);
          setCurrentPage(1);
        }
      }
    };

    // Check stored intent on mount
    const stored = sessionStorage.getItem('open_dj_name');
    if (stored) {
      sessionStorage.removeItem('open_dj_name');
      const matched = findMatchingDj(stored);
      if (matched) {
        const djIdx = filteredDjs.findIndex(d => d.id === matched.id);
        if (djIdx !== -1) {
          const targetPage = Math.floor(djIdx / ITEMS_PER_PAGE) + 1;
          setCurrentPage(targetPage);
        }
        setSelectedDjModal(matched);
        setTimeout(() => {
          const el = document.getElementById(`dj-card-${matched.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 250);
      }
    }

    window.addEventListener('open_dj_profile', handleOpenDj);
    return () => window.removeEventListener('open_dj_profile', handleOpenDj);
  }, [findMatchingDj, filteredDjs]);

  // Smooth scroll left/right actions
  const handleScroll = (direction: 'left' | 'right') => {
    const el = genresScrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Mouse Drag-to-Scroll Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = genresScrollRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftState(el.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = genresScrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    el.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Hero Banner with UK English */}
      <div 
        data-no-invert 
        className="relative rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl min-h-[320px] sm:min-h-[400px] flex items-center p-6 sm:p-12"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-transparent" />
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono tracking-wider uppercase inline-flex items-center gap-2 shadow-sm">
            <Headphones className="w-4 h-4 text-amber-400" />
            Official Sound Curators & Selectors
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif tracking-tight leading-tight">
            Festival <span className="text-gold-gradient">DJ Line-up & Bios</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed">
            Meet the international selectors, UK heavyweights, and Caribbean masters orchestrating the soundscapes for the Grenada CARICOM Festival 2027. Explore their full write-ups, sonic specialisms, and social media channels below.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('events')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> View Events Programme
            </button>
            <button
              onClick={() => setActiveTab('shop')}
              className="px-5 py-2.5 bg-neutral-900/90 hover:bg-neutral-850 text-amber-300 border border-amber-500/30 font-bold text-xs uppercase tracking-wider rounded-xl transition-all hover:border-amber-400 cursor-pointer flex items-center gap-2"
            >
              <Ticket className="w-4 h-4" /> Reserve Festival Passes
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search DJ by name, bio, genre, or origin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-amber-500/80 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {(selectedGenre !== 'all' || searchQuery.trim()) && (
            <button
              onClick={() => {
                setSelectedGenre('all');
                setSearchQuery('');
              }}
              className="self-start sm:self-auto px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-amber-300 text-xs font-semibold rounded-lg transition-all border border-amber-500/20 hover:border-amber-500/40 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <X className="w-3.5 h-3.5 text-amber-400" />
              <span>Clear Filter</span>
            </button>
          )}
        </div>

        {/* Horizontally Moveable / Scrollable Genre Bar */}
        <div className="pt-1 border-t border-neutral-800/60">
          <div className="relative flex items-center group/genre-scroll">
            {/* Left Scroll Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScroll('left')}
                aria-label="Scroll left"
                className="absolute -left-2 z-20 w-8 h-8 rounded-full bg-neutral-900/95 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 border border-neutral-700/80 shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Left Fade Gradient Mask */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-neutral-900/95 to-transparent z-10 pointer-events-none rounded-l-xl" />
            )}

            {/* Horizontal Drag-and-Scroll Strip */}
            <div
              ref={genresScrollRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className={`flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 select-none flex-nowrap w-full ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <button
                onClick={() => setSelectedGenre('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                  selectedGenre === 'all'
                    ? 'bg-amber-500 text-neutral-950 shadow-md ring-1 ring-amber-400'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                }`}
              >
                <span>All Selectors</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedGenre === 'all' ? 'bg-neutral-950/20 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-400'}`}>
                  {djBios.length}
                </span>
              </button>

              {allGenres.map(genre => {
                const isSelected = selectedGenre.toLowerCase() === genre.toLowerCase();
                const count = djBios.filter(dj => dj.genres && dj.genres.some(g => g.toLowerCase() === genre.toLowerCase())).length;
                return (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(isSelected ? 'all' : genre)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 shadow-md ring-1 ring-amber-400'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                    }`}
                  >
                    <span>{genre}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-neutral-950/20 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-400'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Fade Gradient Mask */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neutral-900/95 to-transparent z-10 pointer-events-none rounded-r-xl" />
            )}

            {/* Right Scroll Button */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => handleScroll('right')}
                aria-label="Scroll right"
                className="absolute -right-2 z-20 w-8 h-8 rounded-full bg-neutral-900/95 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 border border-neutral-700/80 shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DJ Grid Listing Anchor */}
      <div id="dj-grid-top" className="scroll-mt-8" />

      {/* DJ Grid Listing */}
      {filteredDjs.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
            <Headphones className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No DJ bios match your criteria</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Try broadening your search term or selecting &ldquo;All Selectors&rdquo; to explore the full line-up.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('all');
            }}
            className="px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-500/30 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {paginatedDjs.map((dj) => {
            const hasInstagram = Boolean(dj.socialLinks?.instagram);
            const hasFacebook = Boolean(dj.socialLinks?.facebook);
            const hasTiktok = Boolean(dj.socialLinks?.tiktok);
            const hasYoutube = Boolean(dj.socialLinks?.youtube);

            return (
              <motion.div
                key={dj.id}
                id={`dj-card-${dj.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group bg-neutral-900/90 border border-neutral-800/90 hover:border-amber-500/40 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* DJ Photo Frame */}
                  <div className="relative h-64 sm:h-72 overflow-hidden bg-neutral-950">
                    <img
                      src={dj.photo || undefined}
                      alt={dj.stageName || dj.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 brightness-95 group-hover:brightness-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
                    
                    {/* Featured / Role Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                      {dj.featured ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500 text-neutral-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md">
                          <Sparkles className="w-3 h-3" /> Headline Act
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-neutral-900/80 backdrop-blur-md text-amber-300 border border-amber-500/30 font-bold text-[10px] tracking-wider uppercase">
                          Resident Selector
                        </span>
                      )}

                      {dj.country && (
                        <span className="px-2.5 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md text-neutral-300 border border-neutral-800 text-[10px] font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400" /> {dj.city || dj.country}
                        </span>
                      )}
                    </div>

                    {/* Bottom overlay in photo */}
                    <div className="absolute bottom-3 left-4 right-4 pointer-events-none">
                      <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight drop-shadow-md">
                        {dj.stageName || dj.name}
                      </h2>
                      {dj.roleOrTitle && (
                        <p className="text-xs font-semibold text-amber-300/90 truncate drop-shadow">
                          {dj.roleOrTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Body Content & Write-up */}
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Genres Chips */}
                    {dj.genres && dj.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {dj.genres.map((g, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-md bg-neutral-800/80 text-amber-300 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* DJ Bio Write-up */}
                    <div className="space-y-2">
                      <p className="text-neutral-300 text-xs sm:text-sm font-light leading-relaxed line-clamp-4">
                        {dj.bio}
                      </p>
                      {dj.bio && dj.bio.length > 180 && (
                        <button
                          type="button"
                          onClick={() => setSelectedDjModal(dj)}
                          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          Read full write-up &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Section: Social Links (Instagram, Facebook, TikTok) & Action Button */}
                <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-3 bg-neutral-950/40">
                  {/* Social Media Links */}
                  <div className="flex items-center gap-2">
                    {/* Instagram */}
                    {hasInstagram ? (
                      <a
                        href={dj.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-gradient-to-tr hover:from-amber-600 hover:to-rose-500 border border-neutral-800 hover:border-transparent text-neutral-300 hover:text-white flex items-center justify-center transition-all shadow-sm group/icon"
                        title={`Follow ${dj.stageName || dj.name} on Instagram`}
                        aria-label="Instagram"
                      >
                        <Instagram className="w-4 h-4 group-hover/icon:scale-110 transition-transform" />
                      </a>
                    ) : (
                      <span 
                        className="w-8 h-8 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-700 flex items-center justify-center cursor-not-allowed opacity-40"
                        title="Instagram not provided"
                      >
                        <Instagram className="w-4 h-4" />
                      </span>
                    )}

                    {/* Facebook */}
                    {hasFacebook ? (
                      <a
                        href={dj.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-blue-600 border border-neutral-800 hover:border-transparent text-neutral-300 hover:text-white flex items-center justify-center transition-all shadow-sm group/icon"
                        title={`Follow ${dj.stageName || dj.name} on Facebook`}
                        aria-label="Facebook"
                      >
                        <Facebook className="w-4 h-4 group-hover/icon:scale-110 transition-transform" />
                      </a>
                    ) : (
                      <span 
                        className="w-8 h-8 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-700 flex items-center justify-center cursor-not-allowed opacity-40"
                        title="Facebook not provided"
                      >
                        <Facebook className="w-4 h-4" />
                      </span>
                    )}

                    {/* TikTok */}
                    {hasTiktok ? (
                      <a
                        href={dj.socialLinks.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-rose-500/50 text-neutral-300 hover:text-rose-400 flex items-center justify-center transition-all shadow-sm group/icon"
                        title={`Follow ${dj.stageName || dj.name} on TikTok`}
                        aria-label="TikTok"
                      >
                        <Video className="w-4 h-4 group-hover/icon:scale-110 transition-transform" />
                      </a>
                    ) : (
                      <span 
                        className="w-8 h-8 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-700 flex items-center justify-center cursor-not-allowed opacity-40"
                        title="TikTok not provided"
                      >
                        <Video className="w-4 h-4" />
                      </span>
                    )}

                    {/* YouTube */}
                    {hasYoutube ? (
                      <a
                        href={dj.socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-red-600 border border-neutral-800 hover:border-transparent text-neutral-300 hover:text-white flex items-center justify-center transition-all shadow-sm group/icon"
                        title={`Follow ${dj.stageName || dj.name} on YouTube`}
                        aria-label="YouTube"
                      >
                        <Youtube className="w-4 h-4 group-hover/icon:scale-110 transition-transform" />
                      </a>
                    ) : (
                      <span 
                        className="w-8 h-8 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-700 flex items-center justify-center cursor-not-allowed opacity-40"
                        title="YouTube not provided"
                      >
                        <Youtube className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  {/* Profile Modal Button */}
                  <button
                    onClick={() => setSelectedDjModal(dj)}
                    className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-bold rounded-xl border border-neutral-750 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Full Profile</span>
                    <ExternalLink className="w-3 h-3 text-amber-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
          </div>

          {/* Pagination Controls Bar (9 DJs per page) */}
          {totalPages > 1 && (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              {/* Range Info */}
              <div className="text-xs text-neutral-400 flex items-center gap-2">
                <Headphones className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Showing <strong className="text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong>–<strong className="text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredDjs.length)}</strong> of <strong className="text-amber-400 font-bold">{filteredDjs.length}</strong> Selectors
                </span>
              </div>

              {/* Page Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 select-none">
                {/* Previous Page Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-850 disabled:opacity-30 disabled:hover:bg-neutral-950 disabled:hover:border-neutral-800 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Numbered Page Pills */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isActive
                            ? 'bg-amber-500 text-neutral-950 shadow-md ring-1 ring-amber-400 scale-105'
                            : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Page Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white hover:border-neutral-700 hover:bg-neutral-850 disabled:opacity-30 disabled:hover:bg-neutral-950 disabled:hover:border-neutral-800 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* In-depth DJ Biography Modal */}
      {selectedDjModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedDjModal(null)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-neutral-950/80 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-all cursor-pointer shadow-lg"
              aria-label="Close dialogue"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header Image */}
            <div className="relative h-64 sm:h-80 overflow-hidden bg-neutral-950 rounded-t-3xl">
              <img
                src={selectedDjModal.photo || undefined}
                alt={selectedDjModal.stageName || selectedDjModal.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
              
              <div className="absolute bottom-4 left-6 right-6 space-y-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {selectedDjModal.featured && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-black text-[10px] tracking-wider uppercase">
                      Featured Headline Act
                    </span>
                  )}
                  {selectedDjModal.city && (
                    <span className="px-2.5 py-0.5 rounded-full bg-neutral-950/80 border border-neutral-700 text-neutral-300 text-[10px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" /> {selectedDjModal.city}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
                  {selectedDjModal.stageName || selectedDjModal.name}
                </h2>
                {selectedDjModal.roleOrTitle && (
                  <p className="text-xs sm:text-sm font-semibold text-amber-400">
                    {selectedDjModal.roleOrTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Genres */}
              {selectedDjModal.genres && selectedDjModal.genres.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Musical Styles & Genres
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedDjModal.genres.map((genre, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-lg bg-neutral-800 text-amber-300 border border-amber-500/20 text-xs font-bold"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Write-up */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Biography & Background
                </span>
                <p className="text-neutral-200 text-sm sm:text-base font-light leading-relaxed whitespace-pre-line">
                  {selectedDjModal.bio}
                </p>
              </div>

              {/* Social Media Channels Box (Instagram, Facebook, TikTok) */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Connect & Listen on Social Media
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Instagram Button */}
                  {selectedDjModal.socialLinks?.instagram ? (
                    <a
                      href={selectedDjModal.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-neutral-900 hover:bg-gradient-to-r hover:from-amber-600 hover:to-rose-600 border border-neutral-800 rounded-xl text-neutral-200 hover:text-white flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Instagram className="w-4 h-4 text-rose-400 group-hover:text-white" />
                        <span className="text-xs font-bold">Instagram</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <div className="p-3 bg-neutral-900/40 border border-neutral-850 rounded-xl text-neutral-600 flex items-center gap-2 text-xs">
                      <Instagram className="w-4 h-4 text-neutral-500" />
                      <span>Not linked</span>
                    </div>
                  )}

                  {/* Facebook Button */}
                  {selectedDjModal.socialLinks?.facebook ? (
                    <a
                      href={selectedDjModal.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-neutral-900 hover:bg-blue-600 border border-neutral-800 rounded-xl text-neutral-200 hover:text-white flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Facebook className="w-4 h-4 text-blue-400 group-hover:text-white" />
                        <span className="text-xs font-bold">Facebook</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <div className="p-3 bg-neutral-900/40 border border-neutral-850 rounded-xl text-neutral-600 flex items-center gap-2 text-xs">
                      <Facebook className="w-4 h-4 text-neutral-500" />
                      <span>Not linked</span>
                    </div>
                  )}

                  {/* TikTok Button */}
                  {selectedDjModal.socialLinks?.tiktok ? (
                    <a
                      href={selectedDjModal.socialLinks.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-rose-500/40 rounded-xl text-neutral-200 hover:text-rose-300 flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Video className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-bold">TikTok</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <div className="p-3 bg-neutral-900/40 border border-neutral-850 rounded-xl text-neutral-600 flex items-center gap-2 text-xs">
                      <Video className="w-4 h-4 text-neutral-500" />
                      <span>Not linked</span>
                    </div>
                  )}

                  {/* YouTube Button */}
                  {selectedDjModal.socialLinks?.youtube ? (
                    <a
                      href={selectedDjModal.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-neutral-900 hover:bg-red-600 border border-neutral-800 rounded-xl text-neutral-200 hover:text-white flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Youtube className="w-4 h-4 text-red-500 group-hover:text-white" />
                        <span className="text-xs font-bold">YouTube</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <div className="p-3 bg-neutral-900/40 border border-neutral-850 rounded-xl text-neutral-600 flex items-center gap-2 text-xs">
                      <Youtube className="w-4 h-4 text-neutral-500" />
                      <span>Not linked</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDjModal(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDjModal(null);
                    setActiveTab('events');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-transform hover:scale-105 flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" /> View DJ Performance Programme
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
