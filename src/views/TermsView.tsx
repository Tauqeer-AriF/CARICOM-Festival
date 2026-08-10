import React from 'react';
import { ActiveTab } from '../types';
import { FileText, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface TermsViewProps {
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

export const TermsView: React.FC<TermsViewProps> = ({ setActiveTab }) => {
  return (
    <div className="space-y-10 pb-12 max-w-4xl mx-auto">
      
      {/* Title */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="text-center space-y-3"
      >
        <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">OFFICIAL POLICY & RULES</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-serif text-white">
          Terms & Conditions
        </h1>
        <p className="text-neutral-300 text-sm">
          Please read these official rules regarding event passes, wristband entry, lost passes, and airline liabilities.
        </p>
      </motion.div>

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6 shadow-xl text-neutral-300 text-xs sm:text-sm leading-relaxed"
      >
        
        <div className="space-y-3 border-b border-neutral-800 pb-4">
          <h2 className="text-lg font-bold font-serif text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            1. Event Passes & Wristband Issuance Upon Arrival
          </h2>
          <p>
            Your event passes and official wristbands will be given to you when you arrive in Grenada (either at Grenada Maurice Bishop International Airport, during hotel transfer, or at your hotel reception by our assigned Mellows Entertainment representative). Please keep them completely safe.
          </p>
        </div>

        <div className="space-y-3 border-b border-neutral-800 pb-4">
          <h2 className="text-lg font-bold font-serif text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            2. Mandatory Wristband Entry & Security Checks
          </h2>
          <p>
            We require official event passes to allow attendees into all festival venues, beach fetes, White Gala parties, and Mellowland river tubing sessions. Wristbands <strong>MUST</strong> be worn to and at all events to make sure only those who have paid gain access. Security personnel will strictly check passes and wristbands at all event entry points.
          </p>
        </div>

        <div className="space-y-3 border-b border-neutral-800 pb-4">
          <h2 className="text-lg font-bold font-serif text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            3. Lost Passes & Wristband Replacement Fees
          </h2>
          <p>
            If you lose an event pass or wristband, there will be an <strong>extra replacement charge</strong>. To request a replacement pass or report a damaged wristband, please immediately contact our official helpline or visit your Mellows hotel representative.
          </p>
        </div>

        <div className="space-y-3 border-b border-neutral-800 pb-4">
          <h2 className="text-lg font-bold font-serif text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            4. 30-Day Cancellation Policy & Airline Disclaimer
          </h2>
          <p>
            Official London-based wristbands are subject to a strict 30-day cancellation refund policy. Flight bookings, baggage, and airline tickets are managed solely under your airline carrier's rules (e.g. British Airways, Virgin Atlantic, Caribbean Airlines).
          </p>
        </div>

        <div className="p-4 bg-neutral-950 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-white block">Questions Regarding Wristbands or Passes?</span>
            <span className="text-neutral-400 text-xs">For wristband replacement, contact our helpline.</span>
          </div>
          <button
            onClick={() => setActiveTab('contact')}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md cursor-pointer shrink-0"
          >
            Contact Helpline
          </button>
        </div>

      </motion.div>

    </div>
  );
};
