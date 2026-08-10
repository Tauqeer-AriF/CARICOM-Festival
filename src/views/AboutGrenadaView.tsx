import React from 'react';
import { ActiveTab } from '../types';
import { FESTIVAL_IMAGES } from '../data/festivalData';
import { getPageImage } from '../services/submissionService';
import { Waves, Utensils, Mountain, Sun, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AboutGrenadaViewProps {
  setActiveTab: (tab: ActiveTab) => void;
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

export const AboutGrenadaView: React.FC<AboutGrenadaViewProps> = ({ setActiveTab }) => {
  return (
    <div className="space-y-12 pb-16">
      
      {/* Title */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="text-center max-w-3xl mx-auto space-y-3"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 font-sans-display">ISLAND OF SPICE & PARADISE</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          About Grenada: Eco-Tourism Gem
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed font-light">
          Grenada, a captivating eco-tourism paradise in the Caribbean, offers a perfect blend of adventure, natural beauty, rich heritage, and culinary delights.
        </p>
      </motion.div>

      {/* Hero Showcase Grid */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center glass-card border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl"
      >
        <div className="space-y-6">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit border border-emerald-500/20">
            <Mountain className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
            Untouched Rainforests & 14 Waterfalls
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
            Adventure seekers can explore untouched rainforests, summit breathtaking mountain peaks, and dive into crystal-clear pools of <strong className="text-amber-300 font-semibold">14 spectacular waterfalls</strong> scattered across the lush island terrain.
          </p>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-light">
            Whether you’re seeking sun-kissed beaches, family fun, romantic getaways, or a break from everyday life, Grenada has something for everyone.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab('about-mellowland')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-lg transition-transform hover:scale-[1.02] cursor-pointer flex items-center gap-2"
            >
              Explore Mellowland River Tubing
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden h-[300px] border border-white/15 shadow-xl group">
            <img
              src={getPageImage('aboutGrenadaEco', FESTIVAL_IMAGES.ecoParadise)}
              alt="Grenada Eco Paradise"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.mellowlandGarden;
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-100"
            />
          </div>
          <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
            <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[11px] font-sans-display">Grenada Eco Paradise</span>
            <span className="font-light text-slate-300 text-xs block mt-1">Crystal-clear turquoise mountain cascades, pristine coastline, and stunning rainforest peaks.</span>
          </div>
        </div>
      </motion.div>

      {/* Highlights Grid */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        
        <motion.div 
          variants={fadeInUp}
          className="glass-card p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl border border-white/10"
        >
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Culinary Capital & Spices</h3>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            Relax on the beach or indulge in the island’s culinary capital, where organic chocolate, nutmeg, cinnamon, and local dishes create unforgettable gastronomic experiences.
          </p>
        </motion.div>

        <motion.div 
          variants={fadeInUp}
          className="glass-card p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl border border-white/10"
        >
          <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center border border-teal-500/20">
            <Waves className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">World's 1st Underwater Sculpture Park</h3>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            Dive or snorkel into the world’s first underwater sculpture park, captivating wreck and reef dives, surrounded by vibrant marine life and turquoise waters.
          </p>
        </motion.div>

        <motion.div 
          variants={fadeInUp}
          className="glass-card p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl border border-white/10"
        >
          <div className="w-12 h-12 bg-amber-500/10 text-amber-300 rounded-2xl flex items-center justify-center border border-amber-500/20">
            <Sun className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Carnival & Spice Market</h3>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            Grenada’s unique carnival and community traditions add to its cultural richness. Historical forts, colourful spice markets, and warm welcoming people make Grenada a gem worth discovering.
          </p>
        </motion.div>

      </motion.div>

      {/* Underwater Sculpture Banner */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="relative rounded-3xl overflow-hidden border border-teal-500/30 p-8 sm:p-12 text-white shadow-2xl"
      >
        <img
          src={getPageImage('aboutGrenadaUnderwater', FESTIVAL_IMAGES.underwaterPark)}
          alt="Underwater Sculpture Park"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.mellowlandGarden;
          }}
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.4]"
        />
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-[0.2em]">
            <Waves className="w-3.5 h-3.5 text-teal-400" /> Iconic Grenada Attraction
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Molinière Bay Underwater Sculpture Park</h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light">
            Created as an artificial reef to support marine conservation, this breathtaking underwater gallery features life-sized human sculptures submerged in clear shallow waters.
          </p>
          <button
            onClick={() => setActiveTab('events')}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-lg cursor-pointer"
          >
            Join Catamaran Cruise & Snorkel Day →
          </button>
        </div>
      </motion.div>

    </div>
  );
};

