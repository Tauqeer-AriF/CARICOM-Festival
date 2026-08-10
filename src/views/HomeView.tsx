import React from 'react';
import { ActiveTab, PassItem } from '../types';
import { FESTIVAL_IMAGES } from '../data/festivalData';
import { CountdownTimer } from '../components/CountdownTimer';
import { GrenadaWeatherWidget } from '../components/GrenadaWeatherWidget';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Calendar, 
  Music, 
  Heart, 
  Ticket, 
  ArrowRight, 
  Waves, 
  ShieldCheck, 
  Mic2,
  Palmtree,
  Star,
  Compass
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

const BACKGROUND_IMAGES = [
  {
    url: FESTIVAL_IMAGES.hero,
    alt: "Grenada Beach DJ Showcase 2027",
  },
  {
    url: FESTIVAL_IMAGES.festivalHero,
    alt: "Spectacular Spice Isle Festival Crowd",
  },
  {
    url: FESTIVAL_IMAGES.whiteGala,
    alt: "Premium VIP White Gala Party Lounge",
  },
  {
    url: FESTIVAL_IMAGES.riverTubing,
    alt: "Mellowland Tropical River Tubing Adventure",
  },
  {
    url: FESTIVAL_IMAGES.ecoParadise,
    alt: "Beautiful Grenada Eco Paradise Coastline",
  }
];

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

export const HomeView: React.FC<HomeViewProps> = ({ setActiveTab, onAddToCart }) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-20 pb-16">
      
      {/* Hero Section */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="relative rounded-3xl overflow-hidden min-h-[620px] sm:min-h-[680px] flex items-center justify-center border border-amber-500/20 shadow-2xl"
      >
        {/* Background Slideshow with Ambient Shimmer */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.img 
              key={currentImageIndex}
              src={BACKGROUND_IMAGES[currentImageIndex].url} 
              alt={BACKGROUND_IMAGES[currentImageIndex].alt} 
              referrerPolicy="no-referrer"
              initial={{ opacity: 0, scale: 1.12 }}
              animate={{ opacity: 1, scale: 1.04 }}
              exit={{ opacity: 0, scale: 1.08 }}
              transition={{ duration: 1.4, ease: [0.25, 1, 0.5, 1] }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.mellowlandGarden;
              }}
              className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090D] via-[#07090D]/60 to-[#07090D]/30 z-[1]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent z-[1]" />
        </div>

        {/* Content Box */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center space-y-8">
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 bg-[#121822]/90 backdrop-blur-md text-amber-300 text-xs font-semibold px-4 py-1.5 rounded-full border border-amber-500/30 uppercase tracking-[0.2em] shadow-xl">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> MAY 13 - 17, 2027 • SPICE ISLE, GRENADA
            </div>
            <GrenadaWeatherWidget variant="badge" />
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.12]">
            Experience the Magic: <br />
            <span className="text-gold-gradient font-extrabold">
              Grenada CARICOM Festival 2027
            </span>
          </h1>

          <p className="text-base sm:text-xl font-light text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Where London's top DJs & revelers unite with Grenada's tropical warmth. A 10-day luxury festival of Caribbean culture, music, beach fetes, and river tubing.
          </p>

          {/* Sophisticated Hero Countdown Timer */}
          <div className="pt-2 pb-1">
            <CountdownTimer variant="hero" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setActiveTab('shop')}
              id="hero-btn-passes"
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-xl shadow-amber-500/20 transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              Lock In Your Festival Pass
            </button>

            <button
              onClick={() => setActiveTab('register')}
              id="hero-btn-flight"
              className="px-8 py-4 glass-card hover:bg-white/10 text-white rounded-full font-semibold text-xs tracking-wider transition-all hover:scale-[1.03] cursor-pointer flex items-center gap-2 border border-white/15"
            >
              Submit Flight Arrival
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>

        </div>

        {/* Carousel Navigation Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#07090D]/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
          {BACKGROUND_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentImageIndex === idx 
                  ? 'w-6 bg-amber-400' 
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
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
              src={FESTIVAL_IMAGES.whiteGala} 
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


