import React, { useState } from 'react';
import { PhoneCall, Mail, MapPin, Instagram, Facebook, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { LuxurySkeletonOverlay } from '../components/LuxurySkeletonOverlay';
import { addSubmission } from '../services/submissionService';
import { motion } from 'motion/react';

const TikTokIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 2.22 6.338 6.338 0 0 0 .195 8.736 6.335 6.335 0 0 0 8.653-.29 6.277 6.277 0 0 0 1.849-4.321V9.034a8.232 8.232 0 0 0 5.13 1.776V7.365a4.797 4.797 0 0 1-1.205-.679z" />
  </svg>
);

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

export const ContactView: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'Wristbands & Tickets',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Record submission into central store for Admin Dashboard
    addSubmission({
      type: 'contact',
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      topicOrPass: formData.inquiryType,
      messageOrDetails: formData.message,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 550);
  };

  return (
    <div className="space-y-12 pb-12">
      
      {/* Title */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="text-center max-w-3xl mx-auto space-y-3"
      >
        <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">24/7 REVELER SUPPORT</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-serif text-white">
          Contact Us & Helpline
        </h1>
        <p className="text-neutral-300 text-sm">
          Have questions about your event wristbands, hotel pickup, or Mellowland river tubing? Our team is ready to assist you.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contact Info Sidebar */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="space-y-6"
        >
          
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-6 shadow-xl">
            <h3 className="font-bold font-serif text-xl text-white border-b border-neutral-800 pb-3">
              Official Helpline Info
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-white text-sm">Telephone Helpline</span>
                  <a 
                    href="tel:+447900123456" 
                    className="text-neutral-300 hover:text-amber-400 transition-colors underline decoration-amber-500/30 hover:decoration-amber-400 font-mono text-xs"
                    title="Call Festival Helpline"
                  >
                    +44 (0)7900 123 456
                  </a>
                  <span className="block text-[10px] text-neutral-500 mt-0.5">Mon - Sun: 08:00 - 20:00 (GMT/AST)</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-white text-sm">Direct Email</span>
                  <a 
                    href="mailto:info@grenadacaricomfestival.com" 
                    className="text-neutral-300 hover:text-amber-400 transition-colors underline decoration-amber-500/30 hover:decoration-amber-400 text-xs"
                    title="Email Festival Concierge"
                  >
                    info@grenadacaricomfestival.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-white text-sm">Mellowland Complex</span>
                  <span className="text-neutral-300">Balthazar River, St. Andrew, Grenada</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Quick Connect */}
            <div className="pt-2">
              <a
                href="https://wa.me/447900123456"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02]"
              >
                <MessageCircle className="w-4 h-4" />
                Connect via WhatsApp
              </a>
            </div>
          </div>

          {/* Social Media Box */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">Official Social Media</h4>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 rounded-xl transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 rounded-xl transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 rounded-xl transition-colors"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

        </motion.div>

        {/* Form Area */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="lg:col-span-2 bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-xl"
        >
          {isSubmitting ? (
            <LuxurySkeletonOverlay type="modal" message="Transmitting Inquiry to Concierge Hotline..." />
          ) : submitted ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
              <h3 className="text-2xl font-bold font-serif text-white">Message Sent Successfully!</h3>
              <p className="text-xs text-neutral-300 max-w-sm mx-auto">
                Thank you for reaching out. A representative from the Grenada CARICOM Festival team will reply shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 bg-neutral-800 text-white rounded-xl text-xs font-bold"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-bold font-serif text-2xl text-white mb-2">
                Send an Inquiry
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Your Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@example.com"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Phone / WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+44 7900 123456"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Inquiry Topic *</label>
                  <select
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Wristbands & Tickets">Wristbands & Passes</option>
                    <option value="Hotel Pick-up & Transport">Hotel Pick-up & Transport</option>
                    <option value="Mellowland Tubing Booking">Mellowland River Tubing</option>
                    <option value="Royalton Hotel Accommodation">Royalton Hotel Accommodation</option>
                    <option value="General Festival Question">General Festival Question</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Your Message *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we assist you with your Grenada CARICOM Festival trip?"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Inquiry
              </button>
            </form>
          )}
        </motion.div>

      </div>

    </div>
  );
};
