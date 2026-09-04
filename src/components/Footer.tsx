import React, { useState } from 'react';
import { ActiveTab, SiteConfig } from '../types';
import { getEffectiveFestivalDateRange } from '../utils/dateUtils';
import { addSubmission } from '../services/submissionService';
import { 
  Palmtree, 
  Instagram, 
  Facebook, 
  PhoneCall, 
  Mail, 
  MapPin, 
  Sparkles,
  ArrowRight,
  Twitter,
  Youtube,
  Crown,
  Flame,
  Music,
  Globe,
  Shield,
  Compass,
  Sun,
  CheckCircle,
  Send
} from 'lucide-react';
import { GrenadaWeatherWidget } from './GrenadaWeatherWidget';

// TikTok SVG icon helper
const TikTokIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 2.22 6.338 6.338 0 0 0 .195 8.736 6.335 6.335 0 0 0 8.653-.29 6.277 6.277 0 0 0 1.849-4.321V9.034a8.232 8.232 0 0 0 5.13 1.776V7.365a4.797 4.797 0 0 1-1.205-.679z" />
  </svg>
);

interface FooterProps {
  setActiveTab: (tab: ActiveTab) => void;
  siteConfig?: SiteConfig;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, siteConfig }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterName, setNewsletterName] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    addSubmission({
      type: 'newsletter',
      name: newsletterName.trim() || 'VIP Reveler',
      email: newsletterEmail.trim(),
      topicOrPass: 'VIP Newsletter & Lineup Drops',
      messageOrDetails: 'Subscribed for London DJ headline lineup drops, secret VIP tickets, and Caricom event updates.'
    });

    setNewsletterSubmitted(true);
  };

  const handleTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const festivalDateDisplay = getEffectiveFestivalDateRange(siteConfig);

  const socialLinks = siteConfig?.socialLinks || {
    instagram: 'https://instagram.com',
    tiktok: 'https://tiktok.com',
    facebook: 'https://facebook.com',
    whatsapp: 'https://wa.me/447900123456',
    youtube: 'https://youtube.com',
    twitter: 'https://twitter.com',
  };

  return (
    <footer className="bg-[#05070A] text-slate-300 border-t border-white/10 pt-16 pb-12 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top CTA Card with Integrated VIP Newsletter Form */}
        <div className="glass-card-amber rounded-3xl p-8 sm:p-10 mb-16 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Heading & Description & Quick Action Buttons */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-[0.2em]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {festivalDateDisplay.toUpperCase()} • SPICE ISLE
              </div>
              <h3 className="text-2xl sm:text-4xl font-bold text-white font-serif tracking-tight">
                Ready for London's Finest in Grenada?
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm font-light leading-relaxed max-w-xl">
                Lock in your official festival passes, submit flight details for complimentary hotel transfer, and join our VIP insider list for secret lineup drops and priority event access.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => handleTab('shop')}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:scale-[1.02] cursor-pointer flex items-center gap-2"
                >
                  Get Festival Passes
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleTab('register')}
                  className="px-6 py-3 glass-card hover:bg-white/10 text-white rounded-full font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/15"
                >
                  Submit Flight Details
                </button>
              </div>
            </div>

            {/* Right Column: Newsletter Subscription Box */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-[#0A0D14]/90 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white font-sans">
                        VIP Newsletter & Lineup Drops
                      </h4>
                      <p className="text-[10px] text-neutral-400 font-light">
                        Secret London DJ announcements & VIP perks
                      </p>
                    </div>
                  </div>
                </div>

                {newsletterSubmitted ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-white">You're on the VIP list!</h5>
                      <p className="text-[10px] sm:text-[11px] text-neutral-300">
                        Welcome dossier automatically dispatched to <span className="text-amber-400 font-semibold">{newsletterEmail}</span>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newsletterName}
                        onChange={(e) => setNewsletterName(e.target.value)}
                        placeholder="Your Name (Optional)"
                        className="w-full px-3 py-1.5 sm:py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-[12px] sm:text-xs text-white placeholder:text-neutral-500 placeholder:text-[11px] sm:placeholder:text-xs focus:outline-none focus:border-amber-500 transition-colors leading-normal"
                      />
                      <input
                        type="email"
                        required
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder="name@email.com"
                        className="w-full px-3 py-1.5 sm:py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-[12px] sm:text-xs text-white placeholder:text-neutral-500 placeholder:text-[11px] sm:placeholder:text-xs focus:outline-none focus:border-amber-500 transition-colors leading-normal"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 sm:py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-[11px] sm:text-xs rounded-xl shadow-md shadow-amber-500/10 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Subscribe to VIP Newsletter</span>
                    </button>
                  </form>
                )}

                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400/80" /> Instant welcome dossier
                  </span>
                  <span>Zero spam • Unsubscribe anytime</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {(() => {
                if (siteConfig?.appLogoUrl) {
                  return (
                    <img 
                      src={siteConfig.appLogoUrl} 
                      alt={siteConfig.appName || "Logo"} 
                      className="w-10 h-10 object-cover rounded-xl border border-amber-500/30 shadow-md bg-neutral-950"
                    />
                  );
                }
                const iconName = siteConfig?.appLogoIcon || 'Palmtree';
                const iconClass = "w-5 h-5 text-amber-400";
                let iconComponent = <Palmtree className={iconClass} />;
                if (iconName === 'Sparkles') iconComponent = <Sparkles className={iconClass} />;
                else if (iconName === 'Crown') iconComponent = <Crown className={iconClass} />;
                else if (iconName === 'Sun') iconComponent = <Sun className={iconClass} />;
                else if (iconName === 'Flame') iconComponent = <Flame className={iconClass} />;
                else if (iconName === 'Music') iconComponent = <Music className={iconClass} />;
                else if (iconName === 'Globe') iconComponent = <Globe className={iconClass} />;
                else if (iconName === 'Shield') iconComponent = <Shield className={iconClass} />;
                else if (iconName === 'Compass') iconComponent = <Compass className={iconClass} />;

                return (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    {iconComponent}
                  </div>
                );
              })()}
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-[0.2em] block font-sans-display">
                  {siteConfig?.appSubtitle || 'CARICOM UNITY'}
                </span>
                <span className="text-lg font-bold text-white font-serif">
                  {siteConfig?.appName || 'Grenada'}
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm font-light">
              {siteConfig?.appTagline || "An exclusive 10-day celebration blending UK & home-base DJs, beach parties, White Gala elegance, river tubing at Mellowland, and luxury island stay."}
            </p>

            {/* Live Grenada Weather Widget */}
            <div className="pt-1 max-w-sm">
              <GrenadaWeatherWidget variant="card" />
            </div>

            {/* Social Media Links */}
            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2 font-sans-display">Connect With Us:</span>
              <div className="flex flex-wrap items-center gap-2">
                {socialLinks.instagram && (
                  <a 
                    href={socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 bg-[#121822] border border-white/10 hover:border-amber-500/50 rounded-xl text-slate-300 hover:text-amber-400 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {socialLinks.facebook && (
                  <a 
                    href={socialLinks.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 bg-[#121822] border border-white/10 hover:border-amber-500/50 rounded-xl text-slate-300 hover:text-amber-400 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a 
                    href={socialLinks.tiktok} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 bg-[#121822] border border-white/10 hover:border-amber-500/50 rounded-xl text-slate-300 hover:text-amber-400 transition-colors"
                    aria-label="TikTok"
                  >
                    <TikTokIcon className="w-4 h-4" />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a 
                    href={socialLinks.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 bg-[#121822] border border-white/10 hover:border-amber-500/50 rounded-xl text-slate-300 hover:text-amber-400 transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {socialLinks.youtube && (
                  <a 
                    href={socialLinks.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 bg-[#121822] border border-white/10 hover:border-amber-500/50 rounded-xl text-slate-300 hover:text-amber-400 transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4 border-l-2 border-amber-500 pl-2 font-sans-display">
              Festival Tabs
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-light">
              <li><button onClick={() => handleTab('home')} className="hover:text-amber-300 cursor-pointer transition-colors">Home Overview</button></li>
              <li><button onClick={() => handleTab('events')} className="hover:text-amber-300 cursor-pointer transition-colors">Official Event Lineup</button></li>
              <li><button onClick={() => handleTab('about-grenada')} className="hover:text-amber-300 cursor-pointer transition-colors">Spice Isle Grenada</button></li>
              <li><button onClick={() => handleTab('about-mellowland')} className="hover:text-amber-300 cursor-pointer transition-colors">About Mellowland</button></li>
              <li><button onClick={() => handleTab('testimonials')} className="hover:text-amber-300 cursor-pointer transition-colors">Reveler Testimonials</button></li>
            </ul>
          </div>

          {/* Logistics */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4 border-l-2 border-emerald-500 pl-2 font-sans-display">
              Travel & Logistics
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-light">
              <li><button onClick={() => handleTab('transportation')} className="hover:text-amber-300 cursor-pointer transition-colors">Airport Transfers</button></li>
              <li><button onClick={() => handleTab('hotels')} className="hover:text-amber-300 cursor-pointer transition-colors">Hotels (Royalton Stay)</button></li>
              <li><button onClick={() => handleTab('register')} className="hover:text-amber-300 cursor-pointer transition-colors">Register Flight Details</button></li>
              <li><button onClick={() => handleTab('travel-insurance')} className="hover:text-amber-300 cursor-pointer transition-colors">Travel Insurance Guide</button></li>
              <li><button onClick={() => handleTab('terms')} className="hover:text-amber-300 cursor-pointer transition-colors">Wristband Terms & Rules</button></li>
            </ul>
          </div>

          {/* Contact & Helpline */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4 border-l-2 border-amber-400 pl-2 font-sans-display">
              Official Helpline
            </h4>
            <div className="space-y-3 text-xs text-slate-300 font-light">
              <div className="flex items-start gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block font-medium text-white">UK / Grenada Helpline:</span>
                  <a 
                    href={`tel:${(siteConfig?.contactPhone || '+44 (0)7900 123 456').replace(/\s+/g, '')}`} 
                    className="text-slate-400 hover:text-amber-400 transition-colors underline decoration-amber-500/20 hover:decoration-amber-400 font-mono"
                    title="Call Festival Helpline"
                  >
                    {siteConfig?.contactPhone || '+44 (0)7900 123 456'}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block font-medium text-white">Direct Email:</span>
                  <a 
                    href={`mailto:${siteConfig?.contactEmail || 'info@grenadacaricomfestival.com'}`} 
                    className="text-slate-400 hover:text-amber-400 transition-colors underline decoration-amber-500/20 hover:decoration-amber-400"
                    title="Email Concierge Desk"
                  >
                    {siteConfig?.contactEmail || 'info@grenadacaricomfestival.com'}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block font-medium text-white">Mellowland Complex:</span>
                  <a 
                    href="https://maps.google.com/?q=Balthazar+River,+St.+Andrew,+Grenada" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-amber-400 transition-colors underline decoration-amber-500/20 hover:decoration-amber-400"
                    title="View Location on Google Maps"
                  >
                    Balthazar River, St. Andrew, Grenada
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4 font-light border-t border-white/5">
          <p className="text-center sm:text-left">© 2027 Grenada CARICOM Festival & Mellows Entertainment Complex. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => handleTab('terms')} className="hover:text-slate-300 transition-colors">Terms & Rules</button>
            <span>•</span>
            <button onClick={() => handleTab('travel-insurance')} className="hover:text-slate-300 transition-colors">30-Day Cancellation Policy</button>
            <span>•</span>
            <button onClick={() => handleTab('contact')} className="hover:text-slate-300 transition-colors">Helpline Support</button>
          </div>
        </div>

        {/* Developer Attribution Row */}
        <div 
          className="pt-4 text-center text-[11px] text-slate-400 font-light border-t border-white/5 flex justify-center items-center mx-auto max-w-full"
          style={{ width: '350px', height: '50.4688px', marginTop: '35px' }}
        >
          <p>
            Developed by{' '}
            <a 
              href="https://creativeengagementservices.com/web-agency/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-amber-400/90 hover:text-amber-300 font-medium transition-colors underline decoration-amber-500/30 hover:decoration-amber-400"
            >
              creative engagement services
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
};

