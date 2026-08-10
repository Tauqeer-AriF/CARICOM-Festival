import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Palmtree } from 'lucide-react';

export const SplashScreen: React.FC<{ onComplete: () => void, primaryColor?: string }> = ({ onComplete, primaryColor = '#F59E0B' }) => {
  useEffect(() => {
    // Lock scroll while splash is visible
    document.body.style.overflow = 'hidden';
    
    const timer = setTimeout(() => {
      onComplete();
    }, 3200);
    
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'unset';
    };
  }, []); // Empty dependency array so it only runs on mount

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(10px)", transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#06080F]"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] opacity-20"
          style={{ backgroundColor: primaryColor }}
        />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0, filter: "blur(20px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl border border-white/5 bg-white/5 shadow-2xl backdrop-blur-xl mb-2 overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
           <motion.div
             initial={{ rotate: -15, scale: 0.8, opacity: 0 }}
             animate={{ rotate: 0, scale: 1, opacity: 1 }}
             transition={{ duration: 1, delay: 0.3, type: "spring", bounce: 0.4 }}
           >
             <Palmtree 
               className="w-10 h-10 drop-shadow-lg" 
               style={{ color: primaryColor }}
             />
           </motion.div>
        </div>

        <div className="text-center space-y-3">
          <motion.div className="overflow-hidden">
            <motion.h1 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-5xl font-black text-white font-serif tracking-tight"
            >
              Mellow<span className="italic font-light pr-1" style={{ color: primaryColor }}>s</span>
            </motion.h1>
          </motion.div>

          <motion.div className="overflow-hidden h-6 flex items-center justify-center">
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              className="text-neutral-400 text-xs font-semibold uppercase tracking-[0.3em]"
            >
              The Premium Experience
            </motion.p>
          </motion.div>
        </div>

        {/* Loading progress line */}
        <motion.div 
          className="w-48 h-[2px] bg-neutral-900 mt-8 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.div 
            className="h-full relative"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.8, delay: 1.2, ease: "easeInOut" }}
            style={{ 
              background: `linear-gradient(to right, ${primaryColor}40, ${primaryColor}, ${primaryColor}80)` 
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
