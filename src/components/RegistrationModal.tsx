import React, { useState, useEffect } from 'react';
import { FlightRegistration } from '../types';
import { Plane, CheckCircle2, ShieldCheck, User, Hotel, Phone, Calendar, Clock, Ticket, Download, Sparkles } from 'lucide-react';
import { LuxurySkeletonOverlay } from './LuxurySkeletonOverlay';
import { addSubmission } from '../services/submissionService';

interface RegistrationModalProps {
  onComplete?: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState<Omit<FlightRegistration, 'id' | 'registeredAt'>>({
    fullName: '',
    email: '',
    phoneWhatsApp: '',
    airline: '',
    flightNumber: '',
    arrivalDate: '2027-05-13',
    arrivalTime: '14:30',
    departureDate: '2027-05-23',
    departureTime: '18:00',
    chosenHotel: 'Royalton Grenada Resort & Spa',
    specialRequests: ''
  });

  const [savedRegistrations, setSavedRegistrations] = useState<FlightRegistration[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReg, setActiveReg] = useState<FlightRegistration | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrintBadge = async () => {
    const element = document.getElementById('registration-badge');
    if (!element) {
      window.print();
      return;
    }
    
    setIsGeneratingPdf(true);
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const imgData = await toPng(element, {
        pixelRatio: 2.5,
        backgroundColor: '#090D1A',
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          margin: '0',
          transform: 'none',
          backgroundColor: '#090D1A',
          color: '#ffffff',
          borderRadius: '16px',
        }
      });
      
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const marginTop = 30;
      const marginBottom = 65;
      const marginX = 30;

      const printableWidth = pdfWidth - (marginX * 2);
      const printableHeight = pdfHeight - marginTop - marginBottom;

      const ratio = Math.min(printableWidth / img.width, printableHeight / img.height);
      const finalWidth = img.width * ratio;
      const finalHeight = img.height * ratio;

      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = marginTop;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      pdf.save(`Mellows_Registration_${activeReg?.id || 'Badge'}.pdf`);
      
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  useEffect(() => {
    try {
      const existing = typeof localStorage !== 'undefined' ? localStorage.getItem('gcf_flight_registrations') : null;
      if (existing) {
        const parsed = JSON.parse(existing);
        setSavedRegistrations(parsed);
      }
    } catch (e) {
      console.error('Failed to load registrations from localStorage:', e);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Save to Admin Submissions Store
    addSubmission({
      type: 'flight-registration',
      name: formData.fullName,
      email: formData.email,
      phone: formData.phoneWhatsApp,
      topicOrPass: `${formData.airline} ${formData.flightNumber}`.trim(),
      messageOrDetails: `Arriving: ${formData.arrivalDate} @ ${formData.arrivalTime}. Staying at: ${formData.chosenHotel}. Requests: ${formData.specialRequests || 'None'}`,
      extraDetails: {
        Airline: formData.airline,
        Flight: formData.flightNumber,
        Arrival: `${formData.arrivalDate} ${formData.arrivalTime}`,
        Hotel: formData.chosenHotel
      }
    });

    setTimeout(() => {
      const newReg: FlightRegistration = {
        ...formData,
        id: 'REG-' + Math.floor(100000 + Math.random() * 900000),
        registeredAt: new Date().toISOString()
      };

      const updated = [newReg, ...savedRegistrations];
      setSavedRegistrations(updated);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('gcf_flight_registrations', JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('localStorage write failed when saving flight registration:', err);
      }
      setActiveReg(newReg);
      setIsSubmitting(false);
      setIsSubmitted(true);
      if (onComplete) onComplete();
    }, 600);
  };

  return (
    <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl text-white max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-start gap-4 pb-6 border-b border-neutral-800">
        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0">
          <Plane className="w-8 h-8" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full mb-1">
            <Sparkles className="w-3.5 h-3.5" /> MANDATORY GUEST LOGISTICS
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-serif text-white">
            Register Your Flight & Hotel Details
          </h2>
          <p className="text-neutral-300 text-xs sm:text-sm mt-1">
            Please note that we require these details even if you’re not using our transfer service. Knowing your arrival and departure times ensures a smooth check-in for your event pass, wristbands, and hotel greeting.
          </p>
        </div>
      </div>

      {isSubmitting ? (
        <LuxurySkeletonOverlay type="modal" message="Syncing Flight Logistics & Generating VIP Badge..." />
      ) : isSubmitted && activeReg ? (
        <div className="py-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-bold font-serif text-white">Flight Details Registered!</h3>
            <p className="text-sm text-neutral-300 max-w-md mx-auto mt-1">
              Your official arrival badge has been generated. Mellows Entertainment representatives will look out for your flight.
            </p>
          </div>

          {/* Digital Badge Card */}
          <div id="registration-badge" className="max-w-md mx-auto bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950/40 border-2 border-amber-500/50 rounded-3xl p-6 pb-9 text-left shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-neutral-950 font-mono text-[10px] font-extrabold px-4 py-1 rounded-bl-2xl uppercase">
              CONFIRMED PASS
            </div>

            <div className="flex items-center gap-3 mb-4">
              <Ticket className="w-6 h-6 text-amber-400" />
              <div>
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider block">GRENADA CARICOM FESTIVAL 2027</span>
                <span className="text-sm font-extrabold text-white">{activeReg.fullName}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-neutral-900/90 p-3 rounded-2xl border border-neutral-800">
              <div>
                <span className="text-neutral-400 block text-[10px]">Pass ID:</span>
                <span className="font-mono font-bold text-amber-300">{activeReg.id}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">Chosen Hotel:</span>
                <span className="font-semibold text-white">{activeReg.chosenHotel}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">Arrival Flight:</span>
                <span className="font-semibold text-white">{activeReg.airline} ({activeReg.flightNumber})</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">Arrival Date/Time:</span>
                <span className="font-semibold text-emerald-400">{activeReg.arrivalDate} @ {activeReg.arrivalTime}</span>
              </div>
            </div>

            <div className="mt-4 text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Confidential WhatsApp: {activeReg.phoneWhatsApp}</span>
              <span className="text-amber-400 font-semibold">Rep Assigned ✓</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsSubmitted(false)}
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold"
            >
              Register Another Guest
            </button>
            <button
              onClick={handlePrintBadge}
              disabled={isGeneratingPdf}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-neutral-950 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              {isGeneratingPdf ? (
                <div className="w-4 h-4 border-2 border-neutral-950/20 border-t-neutral-950 rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isGeneratingPdf ? 'Generating PDF...' : 'Print / Save Registration Badge'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
                <User className="w-4 h-4" /> Personal & Contact Info
              </h3>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Marcus Sterling"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="marcus@example.com"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">WhatsApp / Telephone Number *</label>
                <p className="text-[11px] text-neutral-400 mb-1">
                  Confidential: Used for event timing updates & representative pickup coordination upon arrival.
                </p>
                <input
                  type="tel"
                  required
                  value={formData.phoneWhatsApp}
                  onChange={(e) => setFormData({ ...formData, phoneWhatsApp: e.target.value })}
                  placeholder="+44 7900 123456"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Chosen Accommodation / Hotel *</label>
                <select
                  value={formData.chosenHotel}
                  onChange={(e) => setFormData({ ...formData, chosenHotel: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="Royalton Grenada Resort & Spa">Royalton Grenada Resort & Spa (Highly Recommended)</option>
                  <option value="Radisson Grenada Beach Resort">Radisson Grenada Beach Resort</option>
                  <option value="Coyaba Beach Resort">Coyaba Beach Resort</option>
                  <option value="Silversands Grenada">Silversands Grenada</option>
                  <option value="Mount Cinnamon Resort">Mount Cinnamon Resort</option>
                  <option value="Private Airbnb / Villa">Private Airbnb / Villa in St. George’s</option>
                </select>
              </div>
            </div>

            {/* Flight Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
                <Plane className="w-4 h-4" /> Flight Itinerary Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Airline Carrier *</label>
                  <input
                    type="text"
                    required
                    value={formData.airline}
                    onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                    placeholder="e.g. British Airways / Virgin"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Flight Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.flightNumber}
                    onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                    placeholder="e.g. BA2157"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Arrival Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.arrivalDate}
                    onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Arrival Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Departure Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Departure Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Special Requests / Transfer Notes</label>
                <textarea
                  rows={2}
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  placeholder="Additional luggage, wheelchair assistance, or dietary notes..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>

            </div>

          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Your phone number and data are kept strictly confidential under Mellows Entertainment privacy guidelines.</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-neutral-950 font-extrabold text-base rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 border border-amber-300/40 transition-all transform hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            Submit Flight Details & Generate Event Badge
          </button>
        </form>
      )}

      {/* Saved Registrations list if any */}
      {savedRegistrations.length > 0 && !isSubmitted && (
        <div className="mt-8 pt-6 border-t border-neutral-800">
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
            Previously Submitted Registrations ({savedRegistrations.length})
          </h4>
          <div className="space-y-2">
            {savedRegistrations.slice(0, 3).map((reg) => (
              <div
                key={reg.id}
                onClick={() => {
                  setActiveReg(reg);
                  setIsSubmitted(true);
                }}
                className="p-3 bg-neutral-800 hover:bg-neutral-700/80 rounded-xl flex items-center justify-between text-xs cursor-pointer border border-neutral-700"
              >
                <div>
                  <span className="font-bold text-white block">{reg.fullName} ({reg.id})</span>
                  <span className="text-neutral-400">{reg.airline} • Arrival: {reg.arrivalDate}</span>
                </div>
                <span className="text-amber-400 font-semibold">View Badge →</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
