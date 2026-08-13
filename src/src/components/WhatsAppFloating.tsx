import React, { useState } from 'react';
import { X, Send, Sparkles, ShieldCheck, Headphones, ChevronRight } from 'lucide-react';
import { SiteConfig } from '../types';

interface WhatsAppFloatingProps {
  siteConfig?: SiteConfig;
}

export const WhatsAppFloating: React.FC<WhatsAppFloatingProps> = ({ siteConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  const whatsappUrl = siteConfig?.socialLinks?.whatsapp || 'https://wa.me/447900123456';

  const quickPrompts = [
    { label: '🎟️ Festival Passes & VIP', query: 'I would like details on Festival Passes and VIP wristband packages for CARICOM 2027.' },
    { label: '🏨 Hotels & Shuttle Transfers', query: 'Hi! Can you assist me with partner hotel options and shuttle pickup routes?' },
    { label: '🎤 London DJ Lineup & Schedule', query: 'I have a question regarding the London DJ lineup and 10-day event schedule.' },
    { label: '🌴 River Tubing & Food Fete', query: 'Tell me more about the Mellowland Organic River Tubing and food limes.' }
  ];

  const handleOpenWhatsApp = (text: string) => {
    const finalMsg = text.trim() || 'Hello Mellows Concierge Team! I have an inquiry about the Grenada CARICOM Festival 2027.';
    let base = whatsappUrl;
    if (base.includes('?text=')) {
      base = base.split('?text=')[0];
    }
    const sep = base.includes('?') ? '&' : '?';
    const finalUrl = `${base}${sep}text=${encodeURIComponent(finalMsg)}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
      
      {/* Floating Chat Box Popup */}
      {isOpen && (
        <div className="animate-popup-entrance w-[calc(100vw-2rem)] sm:w-96 rounded-3xl overflow-hidden glass-card border border-amber-500/30 shadow-2xl shadow-black/80 flex flex-col mb-2 backdrop-blur-2xl">
          {/* Concierge Header */}
          <div className="bg-gradient-to-r from-[#0C121C] via-[#101B2B] to-[#0A111A] p-4 sm:p-5 border-b border-white/10 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Concierge"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Headphones className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">Mellows Concierge Desk</h4>
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-400 font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span>Official Hotline • Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Body Content */}
          <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 bg-[#080B10]/95 max-h-[360px] sm:max-h-[380px] overflow-y-auto">
            
            {/* Agent Welcome Bubble */}
            <div className="bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-2xl rounded-tl-sm space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-amber-400">
                <Sparkles className="w-3.5 h-3.5" /> GRENADA CARICOM 2027 LIAISON
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-light">
                Greetings! 👋 How can our London-Grenada team assist your travel, VIP wristbands, or hotel shuttle setup today?
              </p>
            </div>

            {/* Quick Select Prompts */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block px-1">
                Popular Concierge Inquiries:
              </span>
              <div className="space-y-1.5">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOpenWhatsApp(p.query)}
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-500/30 text-xs text-slate-200 hover:text-emerald-300 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span className="font-light pr-2">{p.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Field */}
            <div className="pt-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customMsg.trim()) {
                      handleOpenWhatsApp(customMsg);
                    }
                  }}
                  placeholder="Type custom question..."
                  className="w-full bg-slate-900/90 border border-white/15 focus:border-amber-400 text-xs text-white placeholder-slate-500 pl-3.5 pr-10 py-2.5 rounded-xl focus:outline-none transition-all"
                />
                <button
                  onClick={() => handleOpenWhatsApp(customMsg)}
                  className="absolute right-1.5 p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
                  title="Send to WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Footer Notice */}
          <div className="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-950 border-t border-white/5 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <span>Direct WhatsApp connection to UK & Grenada Support Desk</span>
          </div>

        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        id="btn-whatsapp-floating"
        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white p-2.5 sm:pl-4 sm:pr-5 sm:py-3 rounded-full shadow-2xl shadow-emerald-950/60 transition-all duration-300 hover:scale-105 active:scale-95 border border-emerald-400/40 cursor-pointer overflow-hidden"
        title="Direct VIP Concierge Assistance on WhatsApp"
      >
        {/* Glow halo animation */}
        <span className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-emerald-950/40 flex items-center justify-center border border-emerald-300/30">
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-amber-400 rounded-full border-2 border-emerald-600 animate-ping" />
        </div>

        <div className="hidden sm:flex flex-col items-start text-left pr-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-100/95 leading-tight">
            24/7 VIP Concierge
          </span>
          <span className="font-semibold text-xs text-white tracking-tight flex items-center gap-1">
            WhatsApp Help Desk <Sparkles className="w-3 h-3 text-amber-300" />
          </span>
        </div>
      </button>

    </div>
  );
};

