import React from 'react';
import { ActiveTab } from '../types';
import { getSiteConfig, getPageImage } from '../services/submissionService';
import { motion } from 'motion/react';
import { 
  Plane, 
  Building2, 
  ExternalLink, 
  ShieldCheck, 
  Luggage, 
  Sparkles, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  Car,
  Ticket,
  Info,
  Clock
} from 'lucide-react';

interface HolidayPackagesViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const HolidayPackagesView: React.FC<HolidayPackagesViewProps> = ({ setActiveTab }) => {
  const siteConfig = getSiteConfig();
  const bannerImg = getPageImage(
    'holidayPackagesBanner' as any, 
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80'
  );

  const VIRGIN_HOLIDAYS_URL = "https://www.virginatlantic.com/holidays/search/holiday/grenada?CTA=AbTest_SP_Holidays&departureDate=11-05-2027&duration=11&gateway=LHR&room=a2";
  const BA_HOLIDAYS_URL = "https://www.britishairways.com/badp/package/searchResults.do";

  return (
    <div className="space-y-12 animate-fadeIn pb-16 max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div data-no-invert className="relative rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl min-h-[320px] sm:min-h-[380px] flex items-center p-6 sm:p-12">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-neutral-950/40" />
        
        {/* Glow orb */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/35 text-amber-400 text-xs font-bold font-mono tracking-wider uppercase">
            <Plane className="w-3.5 h-3.5" /> Official Flight &amp; Hotel Packages
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif tracking-tight leading-tight">
            Curated <span className="text-gold-gradient">Holiday Packages</span> to Grenada 2027
          </h1>
          
          <p className="text-slate-300 text-xs sm:text-base font-light leading-relaxed">
            Fly direct from London or regional UK airports to the Spice Isle with our recommended holiday providers. Bundle your flights, luxury beachfront accommodation, and full ATOL financial protection in a single booking.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-white/10 text-neutral-300 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Recommended Duration: 11 Nights (11–22 May 2027)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-white/10 text-neutral-300 text-xs font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>UK Departures (Heathrow LHR / Gatwick LGW) &rarr; Grenada (GND)</span>
            </div>
          </div>
        </div>
      </div>

      {/* London & UK Airport Gateways Info Note */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 text-xs flex flex-col sm:flex-row items-start sm:items-center gap-3.5 shadow-lg">
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 leading-relaxed font-light">
          <span className="font-bold text-white font-sans">UK Departure Gateways: </span>
          <span>
            Virgin Atlantic operates direct scheduled flights from <strong>London Heathrow (LHR)</strong> to Maurice Bishop International (GND). British Airways operates scheduled services from <strong>London Gatwick (LGW)</strong> and connections via <strong>London Heathrow (LHR)</strong> or regional UK airports. Both options allow you to tailor your departure point when searching.
          </span>
        </div>
      </div>

      {/* Featured Holiday Provider CTAs (The 2 Core Primary CTAs) */}
      <div className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 font-mono">
            Direct Booking Partners
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif">
            Choose Your Official Holiday Provider
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Book your complete holiday package with one of our two primary UK airline partners for flexible deposits and ATOL protection.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
          
          {/* Card 1: Virgin Holidays */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative bg-[#0D101A] border border-red-500/30 hover:border-red-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 hover:shadow-red-500/10"
          >
            {/* Ambient Red Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              {/* Header Badge & Brand */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                    <Sparkles className="w-3 h-3" /> Direct London Heathrow &rarr; GND
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-serif mt-1 flex items-center gap-2">
                    Virgin Holidays
                  </h3>
                  <p className="text-xs text-red-300/90 font-medium">
                    London Heathrow &bull; Direct Flights &bull; 11-Night Holiday Package
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 border border-red-400/40 flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0">
                  <Plane className="w-6 h-6 rotate-45" />
                </div>
              </div>

              {/* Package Details Pre-set Parameters */}
              <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-2xl space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between text-neutral-400 border-b border-neutral-900 pb-2">
                  <span>Departure Date:</span>
                  <span className="text-amber-300 font-bold">11th May 2027</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 border-b border-neutral-900 pb-2">
                  <span>Duration:</span>
                  <span className="text-white font-bold">11 Nights (Complete Festival)</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 border-b border-neutral-900 pb-2">
                  <span>Departure Airport:</span>
                  <span className="text-white font-bold">London Heathrow (LHR)</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Party Size:</span>
                  <span className="text-white font-bold">2 Adults (1 Room)</span>
                </div>
              </div>

              {/* Key Highlights */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block font-mono">
                  Why Book With Virgin Holidays:
                </span>
                <ul className="space-y-2 text-xs text-neutral-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Direct non-stop service between London Heathrow (LHR) and Grenada (GND).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Economy Delight, Premium and Upper Class cabin upgrade options available.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Full ATOL financial protection and 23kg hold luggage included as standard.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Curated resort pairings across Grand Anse beach with flexible deposit schemes.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Primary CTA Button */}
            <div className="pt-6 relative z-10">
              <a
                href={VIRGIN_HOLIDAYS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-red-600/30 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center border border-red-400/40"
              >
                <span>Book with Virgin Holidays</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-[10px] text-center text-neutral-400 mt-2 font-mono">
                Opens official Virgin Atlantic package search (Heathrow &rarr; Grenada, 11th May 2027)
              </p>
            </div>
          </motion.div>

          {/* Card 2: British Airways Holidays */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="group relative bg-[#0D101A] border border-sky-500/30 hover:border-sky-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 hover:shadow-sky-500/10"
          >
            {/* Ambient Blue Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              {/* Header Badge & Brand */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                    <Sparkles className="w-3 h-3" /> London Gatwick &amp; Heathrow &rarr; GND
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-serif mt-1 flex items-center gap-2">
                    British Airways Holidays
                  </h3>
                  <p className="text-xs text-sky-300/90 font-medium">
                    London Gatwick / Heathrow &bull; Flight + Hotel Bundles
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-700 to-blue-900 border border-sky-400/40 flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0">
                  <Plane className="w-6 h-6 -rotate-12" />
                </div>
              </div>

              {/* Package Details Parameters */}
              <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-2xl space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between text-neutral-400 border-b border-neutral-900 pb-2">
                  <span>Destination Airport:</span>
                  <span className="text-amber-300 font-bold">Maurice Bishop (GND)</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 border-b border-neutral-900 pb-2">
                  <span>Package Type:</span>
                  <span className="text-white font-bold">Custom Flight + Hotel Package</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 border-b border-neutral-900 pb-2">
                  <span>Departure Points:</span>
                  <span className="text-white font-bold">London Gatwick (LGW) &amp; LHR</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Executive Club:</span>
                  <span className="text-emerald-400 font-bold">Collect Avios &amp; Tier Points</span>
                </div>
              </div>

              {/* Key Highlights */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block font-mono">
                  Why Book With British Airways Holidays:
                </span>
                <ul className="space-y-2 text-xs text-neutral-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>Bundle flights with Royalton Grenada or partner resorts for exclusive combined savings.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>Low deposits available from £60 per person with flexible balance payment terms.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>Generous 23kg checked hold luggage included per traveller.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>Full ATOL and ABTA protection with 24-hour British Airways holiday support.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Primary CTA Button */}
            <div className="pt-6 relative z-10">
              <a
                href={BA_HOLIDAYS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-700 via-sky-600 to-sky-700 hover:from-blue-600 hover:to-sky-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-sky-600/30 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center border border-sky-400/40"
              >
                <span>Book with British Airways Holidays</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-[10px] text-center text-neutral-400 mt-2 font-mono">
                Opens British Airways custom holiday package search
              </p>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Complimentary VIP Shuttle Notice */}
      <div className="glass-card-amber rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
              <Car className="w-3.5 h-3.5" /> Complimentary Airport Transfer Coordination
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-serif">
              Already Booked Your Flights? Submit Your Arrival Details
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
              Once you have confirmed your Virgin Holidays or British Airways booking, log your flight number into our Flight Arrival Log. Our Concierge Team will organise your complimentary air-conditioned shuttle transfer directly from Maurice Bishop Airport (GND) to your accommodation.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
            <button
              onClick={() => setActiveTab('register')}
              className="py-3 px-5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
            >
              <span>Submit Flight Log</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('hotels')}
              className="py-3 px-5 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>View Partner Hotels</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Booking Tips & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-white font-serif">Recommended Travel Dates</h4>
          <p className="text-xs text-neutral-400 leading-relaxed font-light">
            We advise flying out on <strong>11th May 2027</strong> and departing on <strong>22nd May 2027</strong> (11 nights) to experience the entire 10-day programme, Mellowland river tubing, and the White Gala in comfort.
          </p>
        </div>

        <div className="p-6 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-white font-serif">ATOL Protection</h4>
          <p className="text-xs text-neutral-400 leading-relaxed font-light">
            Both Virgin Holidays and British Airways Holidays provide complete financial protection under the UK ATOL scheme, ensuring your flights and accommodation are 100% safeguhedged.
          </p>
        </div>

        <div className="p-6 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Ticket className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-white font-serif">Official Festival Wristbands</h4>
          <p className="text-xs text-neutral-400 leading-relaxed font-light">
            Please note that festival event access wristbands are purchased separately. Secure your 10-Day Gold VIP or Silver pass for entry to all headline DJ events.
          </p>
          <button
            onClick={() => setActiveTab('shop')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer pt-1"
          >
            <span>View Passes &amp; VIP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
