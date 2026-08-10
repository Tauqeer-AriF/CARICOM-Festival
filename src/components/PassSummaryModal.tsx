import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, Sparkles, ShieldCheck, Ticket, MapPin, PhoneCall, Mail, FileText, Send, Copy, Check, Palmtree } from 'lucide-react';
import { CartItem } from '../types';

interface PassSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  reservationRef: string;
  cart: CartItem[];
  currencySymbol: string;
  currency: string;
  totalConverted: string;
}

export const PassSummaryModal: React.FC<PassSummaryModalProps> = ({
  isOpen,
  onClose,
  buyerName,
  buyerEmail,
  buyerPhone,
  reservationRef,
  cart,
  currencySymbol,
  currency,
  totalConverted
}) => {
  const [isSentAlert, setIsSentAlert] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const handlePrint = async () => {
    const element = document.getElementById('printable-pass-summary');
    if (!element) {
      window.print();
      return;
    }
    
    setIsGeneratingPdf(true);
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      // Temporarily remove constraints for full render
      const originalMaxHeight = element.style.maxHeight;
      const originalOverflow = element.style.overflow;
      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';
      
      const imgData = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff', 
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          margin: '0',
          transform: 'none',
          color: '#000000',
        }
      });
      
      // We need image dimensions. We can create an Image object to get them
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Calculate aspect ratio to fit on standard A4 if needed, 
      // or just use exact canvas dimensions for a custom sized PDF ticket
      const pdfWidth = img.width / 2;
      const pdfHeight = img.height / 2;
      
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Mellows_Festival_Pass_${reservationRef}.pdf`);
      
      // Restore styles
      element.style.maxHeight = originalMaxHeight;
      element.style.overflow = originalOverflow;
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      // Fallback
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyText = () => {
    const textContent = `
OFFICIAL FESTIVAL CONFIRMATION - GRENADA CARICOM FESTIVAL 2027
Guest: ${buyerName || 'Valued Guest'}
Reference: ${reservationRef}
Email: ${buyerEmail || 'guest@example.com'}
Phone: ${buyerPhone || 'N/A'}
Total Paid: ${currencySymbol}${totalConverted} (${currency})

Reserved Items:
${cart.map(i => `- ${i.quantity}x ${i.pass.title} (${i.pass.tier} Tier)`).join('\n')}

Collection Point: Royalton Grenada Resort & Mellowland VIP Desk
Helpline WhatsApp: +44 7900 123456
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-pass-summary, #printable-pass-summary * {
            visibility: visible;
          }
          #printable-pass-summary {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 40px !important;
            border: 2px solid #F59E0B !important;
          }
          .no-print {
            display: none !important;
          }
          .print-black-text {
            color: #000000 !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-2xl bg-neutral-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header bar (no-print) */}
        <div className="no-print flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-neutral-950">
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              {isGeneratingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-neutral-950/20 border-t-neutral-950 rounded-full animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isGeneratingPdf ? 'Generating...' : 'Print / Save PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resend Toast Banner */}
        {isSentAlert && (
          <div className="bg-emerald-500 text-neutral-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>Mock confirmation email sent to {buyerEmail || 'your email inbox'}!</span>
          </div>
        )}

        {/* VIEW 1: PRINTABLE PASS SUMMARY */}
        <div id="printable-pass-summary" className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-neutral-950 text-neutral-100">
            
            {/* Brand Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-500/30">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
                  <ShieldCheck className="w-4 h-4" /> Grenada CARICOM Festival 2027
                </div>
                <h2 className="text-2xl font-bold font-serif text-white tracking-tight">
                  Official Festival Pass Summary
                </h2>
                <p className="text-xs text-neutral-400">
                  Issued by Mellows Entertainment • 10-Day Cultural & Music Celebration
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-right">
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                  Reservation Reference
                </span>
                <span className="text-lg font-mono font-extrabold text-white">
                  {reservationRef}
                </span>
              </div>
            </div>

            {/* Guest Details & Venue Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Guest Information</h4>
                <p className="text-white font-medium"><strong className="text-neutral-400">Name:</strong> {buyerName || 'Valued Guest'}</p>
                <p className="text-neutral-300"><strong className="text-neutral-400">Email:</strong> {buyerEmail ? <a href={`mailto:${buyerEmail}`} className="text-amber-300 hover:underline">{buyerEmail}</a> : 'N/A'}</p>
                <p className="text-neutral-300"><strong className="text-neutral-400">Phone:</strong> {buyerPhone ? <a href={`tel:${buyerPhone.replace(/\s+/g, '')}`} className="text-amber-300 hover:underline">{buyerPhone}</a> : 'N/A'}</p>
                <p className="text-neutral-400 text-[10px]"><strong className="text-neutral-400">Date Issued:</strong> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Wristband Collection Point</h4>
                <p className="text-white font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Royalton Grenada Resort & Mellowland Desk
                </p>
                <p className="text-neutral-300 text-[11px] leading-relaxed">
                  Present this summary or reservation reference upon airport or hotel arrival to receive official RFID access wristbands.
                </p>
                <p className="text-amber-300 font-medium flex items-center gap-1">
                  <PhoneCall className="w-3 h-3 text-emerald-400" /> Helpline WhatsApp: <a href="https://wa.me/447900123456" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-mono ml-1">+44 7900 123456</a>
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs">Reserved Passes & VIP Packages</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Item / Pass Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Price ({currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {cart.map((item) => (
                      <tr key={item.pass.id} className="text-neutral-200">
                        <td className="py-3 px-3 font-medium">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{item.pass.title}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 block pl-5">{item.pass.tier} Tier • Access to events</span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-mono">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-bold font-mono">
                          {currencySymbol}{(item.pass.priceGbp * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-amber-500/30 text-sm">
                <span className="font-bold text-neutral-300 uppercase tracking-wider text-xs">Total Amount Paid / Reserved ({currency}):</span>
                <span className="text-xl font-extrabold font-mono text-amber-400">
                  {currencySymbol}{totalConverted}
                </span>
              </div>
            </div>

            {/* Important Terms Footer */}
            <div className="pt-4 border-t border-neutral-800 text-[10px] text-neutral-400 space-y-1">
              <p>• Official festival passes are non-transferable without prior notification to Mellows Concierge.</p>
              <p>• Airport shuttle pickups are guaranteed for guests submitting flight arrival details via the registration portal.</p>
              <p>• Grenada CARICOM Festival 2027 • 10 Days of Culture, Soca, Reggae, River Tubing & Culinary Fetes.</p>
            </div>

          </div>

        {/* Footer actions (no-print) */}
        <div className="no-print p-4 bg-neutral-950 border-t border-white/10 flex justify-between items-center gap-2">
          <button
            onClick={handleCopyText}
            className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? 'Copied to Clipboard' : 'Copy Text Payload'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              {isGeneratingPdf ? (
                <div className="w-4 h-4 border-2 border-neutral-950/20 border-t-neutral-950 rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download / Print PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
