import React, { useState } from 'react';
import { getSiteConfig, getPageImage, addSubmission } from '../services/submissionService';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle, 
  Camera, 
  FileText, 
  ChevronRight,
  HelpCircle,
  Clock,
  MessageSquare,
  Ticket,
  Download
} from 'lucide-react';
import { ActiveTab } from '../types';

interface ContactViewProps {
  setActiveTab?: (tab: ActiveTab) => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ setActiveTab }) => {
  const siteConfig = getSiteConfig();
  const bannerImg = getPageImage('contactBanner', 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=1200&q=80');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSubmission({
      type: 'contact',
      name,
      email,
      phone,
      topicOrPass: 'General Inquiry',
      messageOrDetails: message
    });
    setSubmitted(true);
  };

  const handleQuickLink = (tabOrAction: string) => {
    if (tabOrAction === 'voucher_download') {
      window.dispatchEvent(new CustomEvent('open_voucher_lookup_modal'));
      return;
    }
    if (tabOrAction === 'payment_receipt') {
      window.dispatchEvent(new CustomEvent('open_payment_receipt_modal'));
      return;
    }
    if (setActiveTab) {
      setActiveTab(tabOrAction as ActiveTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const supportLinks = [
    {
      id: 'voucher_download',
      title: 'Download Wristband Voucher',
      desc: 'Enter your Reservation Reference to retrieve and print your confirmed official festival RFID wrist voucher',
      icon: <Ticket className="w-5 h-5 text-amber-400" />,
      badge: 'Confirmed Passes',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'payment_receipt',
      title: 'Upload Payment Receipt',
      desc: 'Attach your Monzo, wire transfer, or bank payment screenshot for instant concierge verification',
      icon: <Camera className="w-5 h-5 text-amber-400" />,
      badge: 'Fast-Track',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      id: 'terms',
      title: 'Wristband Terms & Guidelines',
      desc: 'Entry regulations, collection points at Mellows Complex, age policy, and transfer rules',
      icon: <FileText className="w-5 h-5 text-amber-400" />,
      badge: 'Official Policy',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
  ];

  return (
    <div className="space-y-12 animate-fadeIn pb-16 max-w-5xl mx-auto">
      {/* Hero Banner */}
      <div data-no-invert className="relative rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl min-h-[260px] flex items-center p-6 sm:p-10">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent" />
        <div className="relative z-10 space-y-3">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono tracking-wider uppercase inline-flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> 24/7 Concierge Support &amp; Quick Links
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif">
            Support &amp; <span className="text-gold-gradient">Festival Concierge</span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-light leading-relaxed max-w-xl">
            Have questions about wristbands, hotel accommodation, flight registration, or payment verification? Access fast self-service tools below or reach our concierge team in Grenada and London.
          </p>
        </div>
      </div>

      {/* Support Quick Links Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              Support Self-Service Tools
            </h2>
            <p className="text-xs text-neutral-400">
              Immediate self-service actions for payment verification and wristband policies.
            </p>
          </div>
          <span className="hidden sm:inline-flex text-[11px] font-mono text-amber-400/80 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Instant Actions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {supportLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleQuickLink(link.id)}
              className="text-left p-4 rounded-2xl bg-neutral-900/90 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all duration-200 group flex flex-col justify-between space-y-3 shadow-lg hover:shadow-amber-500/10 cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-amber-400 group-hover:scale-110 group-hover:border-amber-500/40 transition-all">
                    {link.icon}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border font-mono ${link.badgeColor}`}>
                    {link.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 leading-relaxed mt-1">
                    {link.desc}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Access Tool</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-serif">Reach Our Team Direct</h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online Now
              </span>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 text-neutral-300 p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <Mail className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block font-mono">Email Support</span>
                  <a href={`mailto:${siteConfig.contactEmail || 'info@mellowscomplex.com'}`} className="font-bold text-white hover:text-amber-400">
                    {siteConfig.contactEmail || 'info@mellowscomplex.com'}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-neutral-300 p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <Phone className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block font-mono">Phone / WhatsApp</span>
                  <a href={`https://wa.me/${(siteConfig.contactPhone || '+1 473 400 0000').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-amber-400">
                    {siteConfig.contactPhone || '+1 473 400 0000'}
                  </a>
                </div>
              </div>

              <a 
                href="https://maps.google.com/?q=Mellows+Entertainment+Complex,+St.+David's,+Grenada"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-neutral-300 p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-900/60 transition-all group cursor-pointer"
                title="View Festival Headquarters on Google Maps"
              >
                <MapPin className="w-5 h-5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block font-mono">Festival Headquarters</span>
                  <span className="font-bold text-white group-hover:text-amber-400 transition-colors underline decoration-amber-500/20">Mellows Entertainment Complex, St. David's, Grenada</span>
                </div>
              </a>

              <div className="flex items-center gap-3 text-neutral-400 p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80 text-[11px]">
                <Clock className="w-4 h-4 text-amber-400/80 shrink-0" />
                <span>Concierge Desk operates 24/7 during festival week (1–11 August 2027)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white font-serif">Send Us a Message</h3>

          {submitted ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">Enquiry Received &amp; Tracking Logged!</h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Thank you, <strong className="text-amber-400">{name}</strong>! An official acknowledgement email with your tracking reference has been automatically dispatched to <strong className="text-white">{email}</strong>. Our concierge team will review and respond within 2–4 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-300 font-bold">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-bold">Your Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-bold">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+44 7123 456789"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-bold">Message *</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="How can we assist you with Grenada CARICOM Festival 2027?"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
