import React, { useState } from 'react';
import { getSiteConfig, getPageImage, addSubmission } from '../services/submissionService';
import { Mail, Phone, MapPin, Send, CheckCircle, MessageSquare } from 'lucide-react';

export const ContactView: React.FC = () => {
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
            <Mail className="w-3.5 h-3.5" /> 24/7 Concierge Support
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif">
            Contact <span className="text-gold-gradient">Festival Concierge</span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-light leading-relaxed max-w-xl">
            Have questions about wristbands, hotel accommodation, flight registration, or VIP groups? Get in touch with our team in Grenada or London.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white font-serif">Reach Our Team Direct</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 text-neutral-300 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <Mail className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block font-mono">Email Support</span>
                  <a href={`mailto:${siteConfig.contactEmail || 'info@mellowscomplex.com'}`} className="font-bold text-white hover:text-amber-400">
                    {siteConfig.contactEmail || 'info@mellowscomplex.com'}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-neutral-300 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
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
                className="flex items-center gap-3 text-neutral-300 p-3 bg-neutral-950 rounded-xl border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-900/60 transition-all group cursor-pointer"
                title="View Festival Headquarters on Google Maps"
              >
                <MapPin className="w-5 h-5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block font-mono">Festival Headquarters</span>
                  <span className="font-bold text-white group-hover:text-amber-400 transition-colors underline decoration-amber-500/20">Mellows Entertainment Complex, St. David's, Grenada</span>
                </div>
              </a>
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
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
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
