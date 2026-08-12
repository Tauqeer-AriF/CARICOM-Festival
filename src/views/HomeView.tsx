import React, { useState, useEffect, useMemo } from 'react';
import { ActiveTab, PassItem, SiteConfig } from '../types';
import { FESTIVAL_IMAGES } from '../data/festivalData';
import { getSiteConfig, getPageImage } from '../services/submissionService';
import { CountdownTimer } from '../components/CountdownTimer';
import { GrenadaWeatherWidget } from '../components/GrenadaWeatherWidget';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Calendar, 
  Music, 
  Heart, 
  Ticket, 
  ArrowLeft,
  ArrowRight, 
  Waves, 
  ShieldCheck, 
  Mic2,
  Palmtree,
  Star,
  Compass,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause
} from 'lucide-react';

interface HomeViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onAddToCart: (pass: PassItem) => void;
}

// Custom animation presets for a premium aesthetic
const fadeInUp = {
  hidden: { opacity: 0, y: 35 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] // Custom luxury cubic-bezier ease
    }
  }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 1, ease: 'easeOut' }
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

// Distinct, highly dramatic liquid & optical glass transition modes per background slide
const HERO_SLIDE_MODES = [
  {
    type: 'glass-cascade',
    slices: 5,
    getSliceVariants: (i: number, total: number, dir: number) => ({
      initial: {
        y: dir > 0 ? (i % 2 === 0 ? '-100%' : '100%') : (i % 2 === 0 ? '100%' : '-100%'),
        opacity: 0,
        scaleY: 1.4,
        rotateY: dir > 0 ? (i - 2) * 12 : (2 - i) * 12,
        filter: 'brightness(2.2) blur(12px) saturate(2.0)',
      },
      animate: {
        y: '0%',
        opacity: 1,
        scaleY: 1,
        rotateY: 0,
        filter: 'brightness(1) blur(0px) saturate(1.0)',
        transition: {
          y: { duration: 1.1, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.8, delay: i * 0.07, ease: 'easeOut' },
          scaleY: { duration: 1.2, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
          rotateY: { duration: 1.3, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
          filter: { duration: 1.0, delay: i * 0.07, ease: 'easeOut' },
        }
      },
      exit: {
        y: dir > 0 ? (i % 2 === 0 ? '80%' : '-80%') : (i % 2 === 0 ? '-80%' : '80%'),
        opacity: 0,
        scaleY: 0.8,
        rotateY: (i - 2) * -15,
        filter: 'brightness(0.2) blur(16px)',
        transition: {
          duration: 0.7,
          delay: (total - 1 - i) * 0.04,
          ease: [0.7, 0, 0.84, 0]
        }
      }
    })
  },
  {
    type: 'radial-prism',
    slices: 5,
    getSliceVariants: (i: number, total: number, dir: number) => ({
      initial: {
        scale: 1.6,
        rotate: dir > 0 ? (i + 1) * 6 : -(i + 1) * 6,
        opacity: 0,
        filter: 'contrast(1.8) blur(18px) saturate(2.5)',
      },
      animate: {
        scale: 1,
        rotate: 0,
        opacity: 1,
        filter: 'contrast(1.06) blur(0px) saturate(1.0)',
        transition: {
          duration: 1.3,
          delay: i * 0.06,
          ease: [0.16, 1, 0.3, 1]
        }
      },
      exit: {
        scale: 0.75,
        rotate: dir > 0 ? -(i + 1) * 8 : (i + 1) * 8,
        opacity: 0,
        filter: 'brightness(0.1) blur(14px)',
        transition: {
          duration: 0.8,
          ease: [0.7, 0, 0.84, 0]
        }
      }
    })
  },
  {
    type: '3D-shutter',
    slices: 5,
    getSliceVariants: (i: number, total: number, dir: number) => ({
      initial: {
        rotateY: dir > 0 ? 90 : -90,
        z: -300,
        opacity: 0,
        filter: 'brightness(2.5) blur(10px)',
      },
      animate: {
        rotateY: 0,
        z: 0,
        opacity: 1,
        filter: 'brightness(1) blur(0px)',
        transition: {
          duration: 1.2,
          delay: i * 0.09,
          ease: [0.16, 1, 0.3, 1]
        }
      },
      exit: {
        rotateY: dir > 0 ? -90 : 90,
        z: -300,
        opacity: 0,
        filter: 'brightness(0.2) blur(12px)',
        transition: {
          duration: 0.7,
          delay: (total - 1 - i) * 0.05,
          ease: 'easeInOut'
        }
      }
    })
  },
  {
    type: 'liquid-ripple',
    slices: 5,
    getSliceVariants: (i: number, total: number, dir: number) => ({
      initial: {
        scaleX: 1.5,
        scaleY: 0.2,
        opacity: 0,
        filter: 'brightness(3.0) blur(20px) saturate(3.0)',
      },
      animate: {
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        filter: 'brightness(1) blur(0px) saturate(1.0)',
        transition: {
          duration: 1.4,
          delay: Math.abs(i - 2) * 0.1,
          ease: [0.16, 1, 0.3, 1]
        }
      },
      exit: {
        scaleX: 0.2,
        scaleY: 1.5,
        opacity: 0,
        filter: 'brightness(0.1) blur(15px)',
        transition: {
          duration: 0.8,
          ease: [0.7, 0, 0.84, 0]
        }
      }
    })
  }
];

export const HomeView: React.FC<HomeViewProps> = ({ setActiveTab, onAddToCart }) => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(getSiteConfig());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handlePrevSlide = () => {
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev - 1 + activeHeroImages.length) % activeHeroImages.length);
  };

  const handleNextSlide = () => {
    setDirection(1);
    setCurrentImageIndex((prev) => (prev + 1) % activeHeroImages.length);
  };

  const handleDotClick = (idx: number) => {
    setDirection(idx > currentImageIndex ? 1 : -1);
    setCurrentImageIndex(idx);
  };

  useEffect(() => {
    const handleConfigUpdate = (e: any) => {
      if (e.detail) {
        setSiteConfig(e.detail);
      } else {
        setSiteConfig(getSiteConfig());
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'grenada_site_config') {
        setSiteConfig(getSiteConfig());
      }
    };
    window.addEventListener('site_config_updated', handleConfigUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('site_config_updated', handleConfigUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Compute active background images considering displayCount setting
  const activeHeroImages = useMemo(() => {
    const imagesList = siteConfig.hero?.images && siteConfig.hero.images.length > 0
      ? siteConfig.hero.images
      : [
          { url: FESTIVAL_IMAGES.hero, alt: "Grenada Beach DJ Showcase 2027" },
          { url: FESTIVAL_IMAGES.festivalHero, alt: "Spectacular Spice Isle Festival Crowd" },
          { url: FESTIVAL_IMAGES.whiteGala, alt: "Premium VIP White Gala Party Lounge" },
          { url: FESTIVAL_IMAGES.riverTubing, alt: "Mellowland Tropical River Tubing Adventure" },
          { url: FESTIVAL_IMAGES.ecoParadise, alt: "Beautiful Grenada Eco Paradise Coastline" },
        ];
    
    const count = Math.max(1, Math.min(siteConfig.hero?.displayCount ?? imagesList.length, imagesList.length));
    return imagesList.slice(0, count);
  }, [siteConfig]);

  // Preload all active hero images for instantaneous crossfading
  useEffect(() => {
    activeHeroImages.forEach((img) => {
      if (img?.url) {
        const imgObj = new Image();
        imgObj.src = img.url;
      }
    });
  }, [activeHeroImages]);

  // Reset current index if it goes out of bounds when active images change
  useEffect(() => {
    if (currentImageIndex >= activeHeroImages.length) {
      setCurrentImageIndex(0);
    }
  }, [activeHeroImages.length, currentImageIndex]);

  // Autoplay rotation timer
  useEffect(() => {
    if (activeHeroImages.length <= 1 || isPaused) return;
    const intervalMs = Math.max(2, siteConfig.hero?.autoplayInterval || 4) * 1000;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentImageIndex((prev) => (prev + 1) % activeHeroImages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [activeHeroImages.length, siteConfig.hero?.autoplayInterval, isPaused]);

  return (
    <div className="space-y-20 pb-16">
      
      {/* Hero Section */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="relative rounded-3xl overflow-hidden min-h-[580px] sm:min-h-[660px] flex flex-col justify-between items-center border border-amber-500/20 shadow-2xl group pt-8 sm:pt-12 pb-8 sm:pb-20"
      >
        {/* Background Slideshow - Multi-Slice Optical Glass Cascading Engine */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-950 perspective-[1200px]">
          {/* SVG Optical Refraction Filter for Liquid Transitions */}
          <svg className="hidden">
            <defs>
              <filter id="liquid-refraction">
                <feTurbulence type="fractalNoise" baseFrequency="0.015 0.04" numOctaves="2" result="noise">
                  <animate attributeName="baseFrequency" values="0.015 0.04;0.04 0.08;0.015 0.04" dur="8s" repeatCount="indefinite" />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>

          <AnimatePresence initial={false} custom={direction}>
            {activeHeroImages.map((imgItem, idx) => {
              if (idx !== currentImageIndex) return null;

              const isBroken = failedImages[imgItem.url];
              const srcUrl = isBroken ? FESTIVAL_IMAGES.hero : (imgItem.url || FESTIVAL_IMAGES.hero);
              const mode = HERO_SLIDE_MODES[idx % HERO_SLIDE_MODES.length];
              const sliceCount = mode.slices;

              return (
                <div key={`${imgItem.url}-${idx}`} className="absolute inset-0 w-full h-full pointer-events-none z-[1]">
                  {Array.from({ length: sliceCount }).map((_, i) => {
                    const sliceWidthPercent = 100 / sliceCount;
                    const sliceLeftPercent = i * sliceWidthPercent;

                    return (
                      <motion.div
                        key={i}
                        custom={direction}
                        variants={mode.getSliceVariants(i, sliceCount, direction)}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute top-0 bottom-0 overflow-hidden transform-gpu"
                        style={{
                          left: `${sliceLeftPercent}%`,
                          width: `${sliceWidthPercent + 0.2}%`, // slight 0.2% overlap to prevent subpixel seams
                        }}
                      >
                        <img
                          src={srcUrl}
                          alt={imgItem.alt || "Grenada CARICOM Festival Background"}
                          referrerPolicy="no-referrer"
                          onError={() => {
                            setFailedImages((prev) => ({ ...prev, [imgItem.url]: true }));
                          }}
                          className="absolute top-0 bottom-0 h-full max-w-none object-cover object-center filter brightness-[0.72] contrast-[1.08] transform-gpu"
                          style={{
                            width: `${sliceCount * 100}%`,
                            left: `-${i * 100}%`,
                          }}
                        />
                        {/* Shimmer Prism Edge Highlight on Slices */}
                        <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-amber-300/30 via-white/20 to-transparent pointer-events-none" />
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </AnimatePresence>

          {/* Anamorphic Gold Light Sweep Beam */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`light-flare-${currentImageIndex}`}
              initial={{ x: '-120%', opacity: 0.9 }}
              animate={{ x: '280%', opacity: 0 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-amber-300/25 to-transparent -skew-x-20 pointer-events-none z-[3]"
            />
          </AnimatePresence>

          {/* Ambient Lighting Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090D] via-[#07090D]/50 to-[#07090D]/20 z-[2] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/12 via-transparent to-transparent z-[2] pointer-events-none" />
        </div>

        {/* Content Box */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-4 text-center space-y-6 sm:space-y-8 my-auto">
          
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <div className="inline-flex items-center gap-2 bg-[#121822]/90 backdrop-blur-md text-amber-300 text-[11px] sm:text-xs font-semibold px-3.5 sm:px-4 py-1.5 rounded-full border border-amber-500/30 uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-xl">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" /> MAY 13 - 17, 2027 • SPICE ISLE, GRENADA
            </div>
            <GrenadaWeatherWidget variant="badge" />
          </div>

          <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.14]">
            Experience the Magic <br />
            <span className="text-gold-gradient font-extrabold">
              Grenada CARICOM Festival 2027
            </span>
          </h1>

          <p className="text-sm sm:text-xl font-light text-slate-300 max-w-2xl mx-auto leading-relaxed px-2">
            Where London's top DJs & revelers unite with Grenada's tropical warmth. A 10-day luxury festival of Caribbean culture, music, beach fetes, and river tubing.
          </p>

          {/* Sophisticated Hero Countdown Timer */}
          <div className="pt-2 pb-1">
            <CountdownTimer variant="hero" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 pt-2 sm:pt-4">
            <button
              onClick={() => setActiveTab('shop')}
              id="hero-btn-passes"
              className="w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-xl shadow-amber-500/20 transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              Lock In Your Festival Pass
            </button>

            <button
              onClick={() => setActiveTab('register')}
              id="hero-btn-flight"
              className="w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 glass-card hover:bg-white/10 text-white rounded-full font-semibold text-xs tracking-wider transition-all hover:scale-[1.03] cursor-pointer flex items-center justify-center gap-2 border border-white/15"
            >
              Submit Flight Arrival
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>

        </div>

        {/* Carousel Navigation Controls */}
        {activeHeroImages.length > 1 && (
          <>
            {/* Desktop Left Carousel Control */}
            <button
              onClick={handlePrevSlide}
              className="group absolute left-4 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-neutral-900/85 hover:bg-neutral-900 border border-amber-500/40 hover:border-amber-400 backdrop-blur-xl text-amber-400 hover:text-amber-300 transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.8)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] hidden lg:flex items-center justify-center overflow-hidden"
              title="Previous Slide"
              aria-label="Previous Slide"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/10 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
            </button>

            {/* Desktop Right Carousel Control */}
            <button
              onClick={handleNextSlide}
              className="group absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-neutral-900/85 hover:bg-neutral-900 border border-amber-500/40 hover:border-amber-400 backdrop-blur-xl text-amber-400 hover:text-amber-300 transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.8)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] hidden lg:flex items-center justify-center overflow-hidden"
              title="Next Slide"
              aria-label="Next Slide"
            >
              <div className="absolute inset-0 bg-gradient-to-tl from-amber-500/0 via-amber-500/10 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>

            {/* Bottom Controls Pill Bar (Mobile Friendly Flow + Desktop Absolute) */}
            <div className="relative z-20 mt-6 sm:mt-0 sm:absolute sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 flex items-center justify-center shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 bg-neutral-950/85 backdrop-blur-xl px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-amber-500/40 hover:border-amber-400/80 shadow-[0_15px_35px_rgba(0,0,0,0.8)] transition-all">
                {/* Mobile Left Arrow */}
                <button
                  onClick={handlePrevSlide}
                  className="p-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/30 transition-all cursor-pointer flex items-center justify-center lg:hidden active:scale-90"
                  title="Previous Slide"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>

                {/* Slide Counter */}
                <span className="text-[10px] sm:text-xs font-mono font-black text-amber-400 uppercase tracking-widest border-r border-amber-500/20 pr-3 sm:pr-3.5">
                  {String(currentImageIndex + 1).padStart(2, '0')} <span className="text-neutral-500 font-normal">/</span> {String(activeHeroImages.length).padStart(2, '0')}
                </span>

                {/* Dots */}
                <div className="flex items-center gap-1.5 px-1">
                  {activeHeroImages.map((imgItem, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleDotClick(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        currentImageIndex === idx 
                          ? 'w-6 sm:w-7 bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]' 
                          : 'w-2 bg-white/20 hover:bg-white/50'
                      }`}
                      title={imgItem.alt || `Go to slide ${idx + 1}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Pause/Play Toggle */}
                <button
                  onClick={() => setIsPaused((prev) => !prev)}
                  className="p-1 sm:p-1.5 rounded-full hover:bg-amber-500/20 text-amber-400 transition-all cursor-pointer border-l border-amber-500/20 pl-2.5 sm:pl-3 flex items-center"
                  title={isPaused ? "Resume Autoplay" : "Pause Autoplay"}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                {/* Mobile Right Arrow */}
                <button
                  onClick={handleNextSlide}
                  className="p-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/30 transition-all cursor-pointer flex items-center justify-center lg:hidden active:scale-90"
                  title="Next Slide"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.section>

      {/* Countdown Clock Widget */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeInUp}
      >
        <CountdownTimer />
      </motion.section>

      {/* London Touching Down Feature Card */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="glass-card-amber rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-300 text-xs font-semibold px-3.5 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> LONDON'S FINEST TOUCHING DOWN
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              London Vibes Meets Spice Isle Paradise
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
              We are bringing that undeniable, high-energy London vibe straight to Grenada! Enjoy a seamless blend of UK DJs, international carnival masquerade, and Caribbean warmth.
            </p>

            <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                <Music className="w-4 h-4 text-amber-400" /> The Vibe & Sounds:
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                Non-stop Soca, Afro, Soul, Reggae, R&B, and Jungle across beach clubs, luxury hotel lounges, and river sanctuaries.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => setActiveTab('events')}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
              >
                Explore 10-Day Lineup
              </button>
              <button
                onClick={() => setActiveTab('about-mellowland')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                Learn About Mellowland Tubing →
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl h-[380px] group">
            <img 
              src={getPageImage('homeWhiteGala', FESTIVAL_IMAGES.whiteGala)} 
              alt="White Gala Party Grenada" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.mellowlandGarden;
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090D] via-transparent to-transparent" />
            <div className="absolute z-10 bottom-4 left-4 right-4 glass-card p-4 rounded-xl border border-amber-500/30 text-xs space-y-1 backdrop-blur-md">
              <span className="text-amber-300 font-bold block uppercase tracking-wider text-[11px]">FLAGSHIP WHITE GALA PARTY</span>
              <span className="text-slate-300 font-light">All-White Beachfront Elegance • Top UK & Grenadian DJs</span>
            </div>
          </div>

        </div>
      </motion.section>

      {/* Why You Can't Miss This Event */}
      <section className="space-y-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">UNMISSABLE CARIBBEAN EXPERIENCE</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Why You Can't Miss This Event
          </h2>
          <p className="text-slate-400 text-sm font-light">
            This is more than a festival — it is a joyful reunion celebrating Caribbean culture, sister islands, and lifetime memories.
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          
          <motion.div 
            variants={fadeInUp}
            className="glass-card glass-card-interactive rounded-3xl p-8 space-y-5 transition-all shadow-xl"
          >
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">Vibrant Cultural Showcases</h3>
            <p className="text-slate-300 text-sm leading-relaxed font-light">
              Experience the rich heritage of Grenada through traditional masquerade, steel pan music, spice plantation tours, and authentic sister-island culinary presentations.
            </p>
            <button
              onClick={() => setActiveTab('about-grenada')}
              className="text-xs font-semibold text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Discover Grenada's Heritage →
            </button>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="glass-card glass-card-interactive rounded-3xl p-8 space-y-5 transition-all shadow-xl"
          >
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">Our Community, Our Celebration</h3>
            <p className="text-slate-300 text-sm leading-relaxed font-light">
              A warm, welcoming reunion of sister islands and international visitors. Whether you come for the soca, the white sand beaches, or the river adventures, you belong here!
            </p>
            <button
              onClick={() => setActiveTab('testimonials')}
              className="text-xs font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Read Visitor Stories →
            </button>
          </motion.div>

        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="glass-card p-6 rounded-2xl text-center space-y-2 border border-amber-500/20"
        >
          <p className="text-sm sm:text-base text-amber-200 font-medium">
            Pack your bags, bring your energy, and let the Spice Isle capture your heart.
          </p>
          <p className="text-xs text-slate-400">
            Passes are limited to ensure an intimate, high-end reveler experience.
          </p>
        </motion.div>
      </section>

      {/* Music Events & 10-Day Stay Overview */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="glass-card rounded-3xl p-8 sm:p-12 space-y-10 shadow-2xl border border-white/10"
      >
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-300 text-xs font-semibold px-3.5 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest">
            <Music className="w-3.5 h-3.5 text-amber-400" /> EXCLUSIVE 10-DAY PARTY ATMOSPHERE
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            10 Days of Music, Parties & Vibes
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
            During your ten-day stay in Grenada, enjoy an exclusive itinerary blending beach parties, white gala night, river tubing, and luxury resort lounges with London's finest DJs.
          </p>
        </div>

        <motion.div 
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          
          <motion.div 
            variants={fadeInUp}
            className="glass-card glass-card-interactive p-6 rounded-2xl border border-white/10 space-y-3"
          >
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">White Gala Party</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              All-white attire under the stars on Grand Anse Beach with signature cocktails and world-class DJs.
            </p>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="glass-card glass-card-interactive p-6 rounded-2xl border border-white/10 space-y-3"
          >
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit border border-teal-500/20">
              <Waves className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Sunset Beach Fetes</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              High-energy soca and reggae fetes as the sun dips into the Caribbean horizon.
            </p>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="glass-card glass-card-interactive p-6 rounded-2xl border border-white/10 space-y-3"
          >
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit border border-amber-500/20">
              <Mic2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">London vs Grenada Karaoke</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              A friendly rivalry karaoke night pairing classic UK hits with Caribbean anthems.
            </p>
          </motion.div>

        </motion.div>

        {/* Wristband Collection Info Box */}
        <div className="glass-card-amber p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Event Wristbands & Hotel Representative Service
            </h4>
            <p className="text-xs text-slate-300 font-light">
              Wristbands will be issued directly at your hotel upon arrival by our designated Mellows Entertainment concierges.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('shop')}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-lg shrink-0 cursor-pointer"
          >
            Reserve Passes →
          </button>
        </div>
      </motion.section>

    </div>
  );
};


