import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { getSiteConfig, getPageImage, addSubmission } from '../services/submissionService';
import { motion } from 'motion/react';
import { 
  Car, 
  Bus, 
  Plane, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  CheckCircle,
  PhoneCall,
  Send
} from 'lucide-react';

interface TransportationViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const TransportationView: React.FC<TransportationViewProps> = ({ setActiveTab }) => {
  const siteConfig = getSiteConfig();
  const bannerImg = getPageImage('transportationBanner', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [transferType, setTransferType] = useState('airport-shuttle');
  const [passengers, setPassengers] = useState('1');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSubmission({
      type: 'transport-request',
      name: fullName,
      email,
      phone,
      topicOrPass: transferType,
      messageOrDetails: `Passengers: ${passengers}. Notes: ${notes}`
    });
    setSubmitted(true);
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Hero Banner */}
      <div data-no-invert className="relative rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl min-h-[300px] sm:min-h-[380px] flex items-center p-6 sm:p-12">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono tracking-wider uppercase inline-flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5" /> Island Mobility & Shuttles
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif tracking-tight leading-tight">
            Festival <span className="text-gold-gradient">Transportation & Transfers</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed">
            Hassle-free transfers across Grenada. From Maurice Bishop International Airport (GND) to your hotel, and dedicated festival shuttles to Mellowland & Grand Anse beach fetes.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-900/90 border border-neutral-800 p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Plane className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-serif">Airport Express Transfers</h3>
          <p className="text-xs text-neutral-400 font-light leading-relaxed">
            Meet-and-greet airport pickup at GND Airport straight to Royalton, Mount Cinnamon, or your private villa.
          </p>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Bus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-serif">Daily Festival Shuttles</h3>
          <p className="text-xs text-neutral-400 font-light leading-relaxed">
            Scheduled luxury air-conditioned shuttles running between major hotels, Grand Anse beach, and Mellowland Entertainment Complex.
          </p>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Car className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-serif">Private VIP Chauffeur</h3>
          <p className="text-xs text-neutral-400 font-light leading-relaxed">
            Dedicated private SUV or van driver on call for your group throughout your 10-day island stay.
          </p>
        </div>
      </div>

      {/* Request Form Section */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-10 max-w-3xl mx-auto shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white font-serif">Request Airport Transfer or Private Shuttle</h2>
          <p className="text-xs text-neutral-400">Fill in your flight or transfer requirements and our concierge team will confirm your booking.</p>
        </div>

        {submitted ? (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Transfer Request Confirmed &amp; Logged!</h3>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-lg mx-auto">
              Thank you, <strong className="text-amber-400">{fullName}</strong>! An official island transfer confirmation email with your booking reference and airport greeting instructions has been automatically dispatched to <strong className="text-white">{email}</strong>. Our transport concierge team will align with your flight schedule.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-300 font-bold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-bold">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-300 font-bold">WhatsApp / Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+44 7123 456789"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-bold">Service Type</label>
                <select
                  value={transferType}
                  onChange={e => setTransferType(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="airport-shuttle">Airport Pickup (GND)</option>
                  <option value="festival-pass-shuttle">Daily Festival Shuttle Pass</option>
                  <option value="private-driver">Private Chauffeur SUV</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-bold">Passengers</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={passengers}
                  onChange={e => setPassengers(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-300 font-bold">Flight Details & Special Requests</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Include flight number, arrival date/time, and hotel name..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Transfer Booking Request</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
