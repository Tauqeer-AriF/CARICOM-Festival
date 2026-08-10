import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { FESTIVAL_IMAGES } from '../data/festivalData';
import { MapPin, Hotel, MessageCircle, ShieldCheck, CheckCircle2, Plane, Sparkles, PhoneCall, ArrowRight } from 'lucide-react';

interface TransportationViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const TransportationView: React.FC<TransportationViewProps> = ({ setActiveTab }) => {
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber) {
      setPhoneSubmitted(true);
    }
  };

  return (
    <div className="space-y-12 pb-12">
      
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-400 font-sans-display">SEAMLESS ISLAND LOGISTICS</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Transportation & Hotel Transfers
        </h1>
        <p className="text-slate-300 text-sm font-light leading-relaxed">
          From airport pickup to daily event shuttles, Mellows Entertainment ensures your stay in Grenada is smooth and completely stress-free.
        </p>
      </div>

      {/* Main Pick-up & Drop-off Feature */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-12 space-y-8 shadow-2xl">
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
              We highly recommend the use of WhatsApp for event timings and anything related to your stay. Please submit your telephone number below.
            </p>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Confidentiality Guarantee:</strong> This will not be shared with anyone and is held strictly confidential under Mellows Entertainment privacy guidelines.
              </span>
            </div>

            {phoneSubmitted ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Telephone Number Registered!</p>
                <p className="text-xs text-neutral-300">
                  Our representative will reach out on WhatsApp prior to your departure to confirm your pickup window.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePhoneSubmit} className="space-y-3">
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter WhatsApp # (e.g. +44 7900 123456)"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  Submit Confidential Number
                </button>
              </form>
            )}

          </div>

        </div>
      </div>

      {/* Flight Details Submission Box */}
      <div className="bg-gradient-to-r from-amber-600/30 via-emerald-600/20 to-teal-600/30 border border-amber-500/40 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
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
      </div>

    </div>
  );
};
