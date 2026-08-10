import React from 'react';
import { ActiveTab } from '../types';
import { ShieldCheck, Plane, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface TravelInsuranceViewProps {
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

export const TravelInsuranceView: React.FC<TravelInsuranceViewProps> = ({ setActiveTab }) => {
  return (
    <div className="space-y-12 pb-12">
      
      {/* Title */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="text-center max-w-3xl mx-auto space-y-3"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 font-sans-display">ESSENTIAL REVELER GUIDANCE</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Why We Highly Recommend Travel Insurance ✈️🛡️
        </h1>
        <p className="text-slate-300 text-sm font-light leading-relaxed">
          When you're prepping for the ultimate link-up between London and Grenada, securing comprehensive travel insurance is the smartest move before you touch down in the Spice Isle.
        </p>
      </motion.div>

      {/* 3 Core Pillars */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        
        {/* Pillar 1 */}
        <motion.div 
          variants={fadeInUp}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4 shadow-xl"
        >
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center font-extrabold text-lg">
            1
          </div>
          <h3 className="text-xl font-bold font-serif text-white">Protecting Your Carnival Investment</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Carnival isn’t just a trip; it’s an investment. Between flights, accommodation, event tickets, and custom mas costumes, you’ve put money on the line.
          </p>

          <div className="space-y-2 text-xs pt-2">
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <strong className="text-amber-300 block mb-1">Trip Cancellation & Interruption:</strong>
              If an unexpected emergency forces you to cancel or head home early, insurance helps recover non-refundable costs.
            </div>
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <strong className="text-amber-300 block mb-1">Baggage Delays & Loss:</strong>
              If your carnival wear or camera gear is stuck in a layover, baggage coverage lets you buy replacements without paying out of pocket.
            </div>
          </div>
        </motion.div>

        {/* Pillar 2 */}
        <motion.div 
          variants={fadeInUp}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4 shadow-xl"
        >
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center font-extrabold text-lg">
            2
          </div>
          <h3 className="text-xl font-bold font-serif text-white">Medical Emergencies & Excursions</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            From dancing for hours under the Caribbean sun to diving into river tubing and waterfall hikes, carnival season is highly active.
          </p>

          <div className="space-y-2 text-xs pt-2">
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <strong className="text-emerald-300 block mb-1">Medical Coverage:</strong>
              Your local health insurance (like the UK NHS) won't cover you abroad. Insurance covers doctor or hospital bills if needed.
            </div>
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <strong className="text-emerald-300 block mb-1">Adventure Sports Add-ons:</strong>
              If you plan on doing water excursions like river tubing at Mellowland, ensure your policy covers water sports!
            </div>
          </div>
        </motion.div>

        {/* Pillar 3 */}
        <motion.div 
          variants={fadeInUp}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4 shadow-xl"
        >
          <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center font-extrabold text-lg">
            3
          </div>
          <h3 className="text-xl font-bold font-serif text-white">Flight & Travel Disruptions</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Long-haul travel always comes with a bit of unpredictability across airlines and connections.
          </p>

          <div className="space-y-2 text-xs pt-2">
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <strong className="text-teal-300 block mb-1">Missed Connections:</strong>
              If a flight delay causes you to miss a connection, insurance covers rebooking and overnight stays.
            </div>
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
              <strong className="text-teal-300 block mb-1">Delay Benefits:</strong>
              Covers food, drinks, and comfort items during prolonged airport delays.
            </div>
          </div>
        </motion.div>

      </motion.div>

      {/* Pro-Tip Banner */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl text-xs sm:text-sm text-amber-200 flex items-start gap-3"
      >
        <SparklesIcon className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-400 font-bold block mb-1">Pro-Tip for Travelers:</strong>
          Don't wait until the week before you fly to buy your policy. Purchase your travel insurance as soon as you book your flights or accommodation so you are covered for pre-departure cancellations starting from day one.
        </div>
      </motion.div>

      {/* Cancellation Policy Section */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-12 space-y-8 shadow-2xl"
      >
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">THE CANCELLATION POLICY</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-serif text-white">
            Who Covers What? Refund Guidelines
          </h2>
          <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
            When booking this trip, travel components are split into two distinct coverage categories: event wristbands and airline travel arrangements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* 30-Day Wristband Policy */}
          <div className="bg-neutral-950 border border-amber-500/30 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-amber-400 text-base font-serif">
                London-Based Wristbands: The 30-Day Policy
              </h3>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Your event wristbands are protected directly under a strict 30-day cancellation window.
            </p>

            <ul className="space-y-2 text-xs text-neutral-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>What is covered:</strong> Only the cost of the official wristbands / event tickets.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>The Timeline:</strong> Up to 30 days from date of purchase (or before the event terms) to request a cancellation refund.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Exceptions:</strong> Once the 30-day window closes, wristband purchases become non-refundable under the policy.</span>
              </li>
            </ul>
          </div>

          {/* Airline Guidelines */}
          <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-white text-base font-serif">
                Flights & Travel: Airline Guidelines
              </h3>
              <Plane className="w-5 h-5 text-teal-400" />
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Wristband refunds do not cover, manage, or refund any portion of your flight bookings. All travel logistics are subject entirely to your airline.
            </p>

            <ul className="space-y-2 text-xs text-neutral-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>What is covered:</strong> Flights, baggage fees, and airline upgrades.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>The Policy:</strong> Each carrier (e.g., British Airways, Virgin Atlantic, Caribbean Airlines) operates under its own distinct ticket guidelines.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Refunds & Credits:</strong> Depends on class of ticket purchased (Economy vs. Flexible/Business).</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Helpline Footer Box */}
        <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-bold text-white block">Need Additional Cancellation Information?</span>
            <span className="text-neutral-400">Our helpline team is available to clarify wristband terms or policy questions.</span>
          </div>
          <button
            onClick={() => setActiveTab('contact')}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl shadow-lg cursor-pointer shrink-0"
          >
            Contact Helpline
          </button>
        </div>

      </motion.div>

    </div>
  );
};

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  );
}
