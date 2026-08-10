import React from 'react';
import { ActiveTab } from '../types';
import { MapPin, Hotel, MessageCircle, ShieldCheck, Plane, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface TransportationViewProps {
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

export const TransportationView: React.FC<TransportationViewProps> = ({ setActiveTab }) => {
  return (
    <div className="space-y-12 pb-12">
      
      {/* Title */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="text-center max-w-3xl mx-auto space-y-3"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-400 font-sans-display">SEAMLESS ISLAND LOGISTICS</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Transportation & Hotel Transfers
        </h1>
        <p className="text-slate-300 text-sm font-light leading-relaxed">
          From airport pickup to daily event shuttles, Mellows Entertainment ensures your stay in Grenada is smooth and completely stress-free.
        </p>
      </motion.div>

      {/* Main Pick-up & Drop-off Feature */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-12 space-y-8 shadow-2xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 text-xs font-bold px-3 py-1 rounded-full border border-teal-500/30">
              <MapPin className="w-4 h-4 text-teal-400" /> AIRPORT GREETING & BRIEFING
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-white">
              Pick-up & Drop-off Greeting
            </h2>

            <p className="text-neutral-300 text-sm leading-relaxed">
              Upon arrival, you’ll be greeted by Mellows Entertainment representatives and transported directly to your chosen hotel. You’ll also receive a comprehensive briefing about your stay and event schedule on the way!
            </p>

            <div className="p-4 bg-neutral-950 rounded-2xl border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Hotel className="w-4 h-4" /> Hotel Recommendation:
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                We highly recommend the <strong className="text-white">Royalton Hotel</strong> for the experience that we recommend. <span className="text-amber-300 font-bold">No stress!</span>
              </p>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Listings for the event nights will be placed within the hotel reception area, or you can check directly with your assigned Mellows representative.
            </p>

            <button
              onClick={() => setActiveTab('hotels')}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              View Royalton Hotel Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-neutral-950 p-6 rounded-3xl border border-neutral-800 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base font-serif">WhatsApp Coordination</h3>
                <span className="text-xs text-neutral-400">Event Timings & Confidential Helpline</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              We highly recommend using WhatsApp for instant updates on event shuttle timings and concierge assistance throughout your stay.
            </p>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Direct VIP Concierge:</strong> Connect directly with our team on WhatsApp for immediate shuttle coordination.
              </span>
            </div>

            <a
              href="https://wa.me/447900123456?text=Hello%20Mellows%20Concierge,%20I%20need%20assistance%20with%20shuttle%20transfers%20and%20event%20timings."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2.5 border border-emerald-400/30"
            >
              <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
              <span>Chat Directly on WhatsApp (+44 7900 123456)</span>
            </a>

          </div>

        </div>
      </motion.div>

      {/* Flight Details Submission Box */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-gradient-to-r from-amber-600/30 via-emerald-600/20 to-teal-600/30 border border-amber-500/40 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
            <Plane className="w-3.5 h-3.5" /> MANDATORY FOR TRANSFERS
          </div>
          <h3 className="text-xl font-bold font-serif text-white">Have You Submitted Your Flight Itinerary?</h3>
          <p className="text-neutral-300 text-xs sm:text-sm max-w-xl">
            We require flight details even if you aren’t using transfer service so we can guarantee your wristband check-in at hotel reception.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('register')}
          className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 shrink-0 cursor-pointer flex items-center gap-2"
        >
          <Plane className="w-4 h-4" />
          Submit Flight Details
        </button>
      </motion.div>

    </div>
  );
};
