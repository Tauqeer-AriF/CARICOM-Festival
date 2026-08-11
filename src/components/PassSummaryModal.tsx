import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, ShieldCheck, Ticket, MapPin, PhoneCall, Copy, Check, Star } from 'lucide-react';
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
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  // Safe pricing calculation avoiding NaN
  const parsedTotal = parseFloat(String(totalConverted || '').replace(/[^0-9.]/g, ''));
  const safeTotalAmount = !isNaN(parsedTotal) && parsedTotal > 0
    ? parsedTotal
    : cart.reduce((sum, item) => {
        const p = typeof item.pass?.priceGbp === 'number' && !isNaN(item.pass.priceGbp)
          ? item.pass.priceGbp
          : parseFloat(String(item.pass?.priceGbp || '169').replace(/[^0-9.]/g, '')) || 169;
        return sum + p * (item.quantity || 1);
      }, 0) || 169;

  const symbol = currencySymbol || '£';
  const displayTotal = `${symbol}${safeTotalAmount.toLocaleString('en-GB')}`;

  const refCode = reservationRef || 'GCF-2027-8892';
  const nameDisplay = buyerName || 'Valued VIP Guest';
  const emailDisplay = buyerEmail || 'guest@mellows-grenada.com';
  const phoneDisplay = buyerPhone || '+44 7900 123456';
  const dateIssued = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

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
      const marginBottom = 65; // ~23mm bottom margin
      const marginX = 30;

      const printableWidth = pdfWidth - (marginX * 2);
      const printableHeight = pdfHeight - marginTop - marginBottom;

      const ratio = Math.min(printableWidth / img.width, printableHeight / img.height);
      const finalWidth = img.width * ratio;
      const finalHeight = img.height * ratio;

      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = marginTop;
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      pdf.save(`Mellows_Festival_Pass_${refCode}.pdf`);
      
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyText = () => {
    const textContent = `
OFFICIAL VIP FESTIVAL CONFIRMATION - GRENADA CARICOM FESTIVAL 2027
Guest Name: ${nameDisplay}
Reservation Ref: ${refCode}
Email: ${emailDisplay}
Phone: ${phoneDisplay}
Total Paid / Reserved: ${displayTotal} (${currency || 'GBP'})

Reserved Items:
${cart.map(i => `- ${i.quantity}x ${i.pass.title} (${i.pass.tier} Tier)`).join('\n')}

Collection Desk: Royalton Grenada Resort & Mellowland VIP Desk
WhatsApp Concierge: +44 7900 123456
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-2xl animate-fadeIn font-sans">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 20mm 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-pass-summary, #printable-pass-summary * {
            visibility: visible !important;
          }
          #printable-pass-summary {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            background-color: #090D1A !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            padding: 28px 28px 56px 28px !important;
            margin-bottom: 48px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-[#080B14] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header bar (no-print) */}
        <div className="no-print p-4 sm:p-5 border-b border-amber-500/30 bg-neutral-950 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6 text-neutral-950" />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block font-mono">OFFICIAL CONCIERGE DOCUMENT</span>
              <h3 className="text-base font-bold text-white font-serif">VIP Festival Pass Summary</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 disabled:opacity-50 text-neutral-950 font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {isGeneratingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-neutral-950/20 border-t-neutral-950 rounded-full animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Executive PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE / DISPLAY CANVAS (EXECUTIVE DARK OBSIDIAN STYLE) */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-[#03050A] flex flex-col items-center flex-1">
          <div className="w-full max-w-2xl flex justify-center py-4 sm:py-8 pb-24 sm:pb-32">
            <div
              id="printable-pass-summary"
              className="w-full bg-[#090D1A] text-white p-7 sm:p-9 pb-12 sm:pb-16 rounded-2xl shadow-2xl border-2 border-amber-500 space-y-6 relative font-sans"
              style={{ color: '#ffffff', backgroundColor: '#090D1A' }}
            >
              {/* Fine Metallic Border Frame */}
              <div className="absolute inset-3 border border-amber-500/30 rounded-xl pointer-events-none" />

              {/* Brand Header */}
              <div className="bg-[#0F172A] text-white p-5 rounded-xl border border-amber-500/60 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 relative z-10">
                  <div className="flex items-center gap-2 text-amber-400 text-[11px] font-extrabold uppercase tracking-widest font-mono">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>GRENADA CARICOM FESTIVAL 2027</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-serif text-white tracking-wide uppercase">
                    OFFICIAL FESTIVAL PASS SUMMARY
                  </h2>
                  <p className="text-xs font-bold text-amber-200/90 uppercase tracking-wider font-mono">
                    Issued by Mellows Entertainment • 10-Day Cultural & Music Celebration
                  </p>
                </div>

                <div className="bg-[#080C17] border border-amber-500/40 p-3 rounded-xl text-right shrink-0 relative z-10 w-full sm:w-auto">
                  <span className="text-[9px] uppercase font-black text-amber-400 block tracking-widest font-mono">
                    RESERVATION REFERENCE
                  </span>
                  <span className="text-lg font-mono font-black text-amber-300 block tracking-wider mt-0.5">
                    {refCode}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-black bg-emerald-950/90 px-2.5 py-0.5 rounded border border-emerald-500/60 inline-block mt-1">
                    ✓ VERIFIED & CONFIRMED
                  </span>
                </div>
              </div>

              {/* Guest Details & Venue Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#0F1629] text-white p-4 sm:p-5 rounded-xl border border-amber-500/30 space-y-2 shadow-md">
                  <h4 className="font-black text-amber-400 uppercase tracking-wider text-[10px] font-mono">GUEST INFORMATION</h4>
                  <p className="text-sm font-black text-white">{nameDisplay}</p>
                  <div className="space-y-1 font-mono text-slate-200 text-xs pt-1.5 border-t border-slate-800">
                    <p><strong className="text-amber-400/80">Email:</strong> {emailDisplay}</p>
                    <p><strong className="text-amber-400/80">Phone:</strong> {phoneDisplay}</p>
                    <p><strong className="text-amber-400/80">Date Issued:</strong> {dateIssued}</p>
                  </div>
                </div>

                <div className="bg-[#0F1629] text-white p-4 sm:p-5 rounded-xl border border-amber-500/30 space-y-2 shadow-md">
                  <h4 className="font-black text-amber-400 uppercase tracking-wider text-[10px] font-mono">WRISTBAND COLLECTION POINT</h4>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    Royalton Grenada Resort & Mellowland Desk
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-1.5 border-t border-slate-800">
                    Present this summary or reservation reference upon airport or hotel arrival to receive official RFID access wristbands.
                  </p>
                  <p className="text-[10px] font-mono font-bold text-emerald-400 pt-0.5">
                    <PhoneCall className="w-3 h-3 text-emerald-400 inline mr-1" />
                    Helpline WhatsApp: +44 7900 123456
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2.5">
                <h4 className="font-black text-amber-400 uppercase tracking-wider text-xs border-b border-amber-500/30 pb-1.5 font-mono">
                  RESERVED PASSES & VIP PACKAGES
                </h4>
                
                <div className="border border-amber-500/30 rounded-xl overflow-hidden shadow-md bg-[#0F1629]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#17213B] text-amber-300 font-bold text-[10px] uppercase tracking-wider font-mono border-b border-amber-500/30">
                        <th className="py-2.5 px-3.5">ITEM / PASS DESCRIPTION</th>
                        <th className="py-2.5 px-3.5 text-center">QTY</th>
                        <th className="py-2.5 px-3.5 text-right">PRICE ({currency || 'GBP'})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-white font-medium">
                      {cart.map((item, idx) => {
                        const p = typeof item.pass?.priceGbp === 'number' && !isNaN(item.pass.priceGbp)
                          ? item.pass.priceGbp
                          : parseFloat(String(item.pass?.priceGbp || '169').replace(/[^0-9.]/g, '')) || 169;
                        const linePrice = `${symbol}${(p * (item.quantity || 1)).toLocaleString('en-GB')}`;

                        return (
                          <tr key={item.pass?.id || idx}>
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-2">
                                <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <strong className="text-white font-bold text-xs">{item.pass?.title || 'VIP Festival Pass'}</strong>
                              </div>
                              <span className="text-[10px] text-slate-300 block pl-5.5 mt-0.5 font-sans">
                                {item.pass?.tier || 'VIP'} Tier • Full Access to 10-Day Events
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-200">
                              {item.quantity || 1}
                            </td>
                            <td className="py-3 px-3.5 text-right font-black font-mono text-amber-400 text-sm">
                              {linePrice}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Total Footer */}
                <div className="bg-[#0D1322] border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-amber-300 uppercase tracking-wider">TOTAL AMOUNT PAID / RESERVED ({currency || 'GBP'}):</span>
                  <span className="text-xl font-black text-amber-400">{displayTotal}</span>
                </div>
              </div>

              {/* Terms Footer */}
              <div className="pt-4 pb-3 border-t border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400 font-sans">
                <div className="space-y-1">
                  <p className="font-bold text-amber-300 uppercase font-mono">• Official festival passes are non-transferable without prior notification to Mellows Concierge.</p>
                  <p className="text-slate-400">• Airport shuttle pickups are guaranteed for guests submitting flight arrival details via the registration portal.</p>
                  <p className="text-slate-400">• Grenada CARICOM Festival 2027 • 10 Days of Culture, Soca, Reggae, River Tubing & Culinary Fetes.</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-12 h-12 rounded-full border border-amber-500/60 bg-[#0F172A] text-amber-400 font-mono font-black text-[8px] text-center p-1 flex flex-col items-center justify-center shadow-md">
                    <Star className="w-3 h-3 text-amber-400 mb-0.5" />
                    <span>SEAL OF</span>
                    <span className="text-[6.5px] text-amber-300">AUTHENTICITY</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer actions (no-print) */}
        <div className="no-print p-4 bg-neutral-950 border-t border-amber-500/30 flex justify-between items-center gap-2 shrink-0">
          <button
            onClick={handleCopyText}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-neutral-800"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? 'Copied to Clipboard' : 'Copy Text Summary'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-neutral-800"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 disabled:opacity-50 text-neutral-950 font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {isGeneratingPdf ? (
                <div className="w-4 h-4 border-2 border-neutral-950/20 border-t-neutral-950 rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Executive Dark PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
