import React from 'react';
import { ActiveTab } from '../types';
import { Compass, Calendar, ArrowRight, ShieldQuestion } from 'lucide-react';
import { motion } from 'motion/react';

interface NotFoundViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

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

const pulse = {
  initial: { scale: 1, opacity: 0.8 },
  animate: {
    scale: 1.05,
    opacity: 1,
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut"
    }
  }
};

export const NotFoundView: React.FC<NotFoundViewProps> = ({ setActiveTab }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4 max-w-2xl mx-auto text-center space-y-10">
      
      {/* Icon / Decorative Graphic */}
      <motion.div 
        initial="initial"
        animate="animate"
        variants={pulse}
        className="relative flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full w-48 h-48 -z-10" />
        <div className="p-8 bg-neutral-900 border border-neutral-800/80 rounded-full shadow-2xl relative">
          <Compass className="w-16 h-16 text-amber-500 animate-[spin_10s_linear_infinite]" />
          <div className="absolute -top-1 -right-1 bg-emerald-500 text-neutral-950 p-2 rounded-full shadow-lg border-2 border-neutral-950">
            <ShieldQuestion className="w-5 h-5" />
          </div>
        </div>
      </motion.div>

      {/* Message and Typography */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="space-y-4"
      >
        <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-500">404 ERROR</span>
        <h1 className="text-4xl sm:text-6xl font-extrabold font-serif text-white tracking-tight leading-tight">
          Lost in the Rhythm?
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          The page you tried to access has danced its way off our official schedule, or the link took an unexpected route. Don't worry—the main beat is still pumping!
        </p>
      </motion.div>

      {/* Navigation Options */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md pt-4"
      >
        <button
          onClick={() => setActiveTab('home')}
          className="group relative flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Return to Mellows Home</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold text-sm rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Explore Event Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className="sm:col-span-2 flex items-center justify-center gap-2 px-6 py-3.5 bg-transparent hover:bg-neutral-900 border border-dashed border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          <span>Need help finding something? Reach Concierge Support</span>
        </button>
      </motion.div>
      
    </div>
  );
};
