import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Printer, Download, ShieldCheck, Ticket, MapPin, PhoneCall, Copy, Check, 
  Star, CreditCard, Building, ExternalLink, Camera, UploadCloud, CheckCircle2, Eye, FileText, Lock 
} from 'lucide-react';
import { CartItem, FormSubmissionItem } from '../types';
import { getPaymentConfig, PaymentConfig, getMonzoMeUrl } from '../services/paymentConfigService';
import { getSubmissionByOrderRef } from '../services/submissionService';
import { PaymentReceiptModal, ReceiptLightboxModal } from './PaymentReceiptModal';

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
  isConfirmed?: boolean;
  paymentTiming?: 'now' | 'arrival';
  paymentMethod?: string;
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
  totalConverted,
  isConfirmed = false,
  paymentTiming = 'now',
  paymentMethod = 'Monzo'
}) => {
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(getPaymentConfig);
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<FormSubmissionItem | null>(null);

  useEffect(() => {
    if (isOpen && reservationRef) {
      const found = getSubmissionByOrderRef(reservationRef);
      if (found) setCurrentSubmission(found);
    }
  }, [isOpen, reservationRef]);

  useEffect(() => {
    const handleConfigUpdate = () => {
      setPaymentConfig(getPaymentConfig());
    };
    window.addEventListener('payment_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('payment_config_updated', handleConfigUpdate);
  }, []);

  if (!isOpen) return null;

  const getCurrencyRate = (amountGBP: number) => {
    if (currency === 'USD') return Math.round(amountGBP * 1.28);
    if (currency === 'XCD') return Math.round(amountGBP * 3.45);
    return amountGBP;
  };

  // Safe pricing calculation avoiding NaN
  const parsedTotal = parseFloat(String(totalConverted || '').replace(/[^0-9.]/g, ''));
  const safeTotalAmount = !isNaN(parsedTotal) && parsedTotal > 0
    ? parsedTotal
    : cart.reduce((sum, item) => {
        const p = typeof item.pass?.priceGBP === 'number' && !isNaN(item.pass.priceGBP)
          ? item.pass.priceGBP
          : parseFloat(String(item.pass?.priceGBP || '169').replace(/[^0-9.]/g, '')) || 169;
        return sum + getCurrencyRate(p) * (item.quantity || 1);
      }, 0) || 169;

  const totalGBP = cart.reduce((sum, item) => {
    const p = typeof item.pass?.priceGBP === 'number' && !isNaN(item.pass.priceGBP)
      ? item.pass.priceGBP
      : parseFloat(String(item.pass?.priceGBP || '169').replace(/[^0-9.]/g, '')) || 169;
    return sum + p * (item.quantity || 1);
  }, 0) || 169;

  const symbol = currencySymbol || '£';
  const displayTotal = `${symbol}${safeTotalAmount.toLocaleString('en-GB')}`;

  const refCode = isConfirmed ? (reservationRef || 'GCF-2027-PENDING') : 'DRAFT-PREVIEW';
  const nameDisplay = isConfirmed ? (buyerName || 'Valued VIP Guest') : (buyerName || 'Guest Details Pending');
  const emailDisplay = isConfirmed ? (buyerEmail || 'guest@mellows-grenada.com') : (buyerEmail || 'Complete Checkout to Register Email');
  const phoneDisplay = isConfirmed ? (buyerPhone || '+44 7900 123456') : (buyerPhone || 'Complete Checkout to Register Phone');
  const dateIssued = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Calculate settlement status and download permissions
  const isReceiptVerified = currentSubmission?.receiptStatus === 'verified';
  const isSubmissionConfirmed = currentSubmission?.status === 'Confirmed';
  const isSettled = isReceiptVerified || isSubmissionConfirmed;
  const allowDownloadBeforeSettle = paymentConfig.allowPassVoucherDownloadBeforePayment ?? true;
  const canDownloadVoucher = isSettled || allowDownloadBeforeSettle;

  const handlePrint = async () => {
    if (!canDownloadVoucher) {
      alert('Voucher PDF download is restricted before payment settlement as set by the festival organizers.');
      return;
    }

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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-2xl animate-fadeIn font-sans">
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
            padding: 24px 24px 48px 24px !important;
            margin-bottom: 48px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-[#080B14] border border-amber-500/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Header bar (no-print) */}
        <div className="no-print p-3 sm:p-5 border-b border-amber-500/30 bg-neutral-950 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-950" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest block font-mono truncate">OFFICIAL CONCIERGE DOCUMENT</span>
              <h3 className="text-sm sm:text-base font-bold text-white font-serif truncate">VIP Festival Pass Summary</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Close Summary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Restriction Banner if download before settlement is disallowed */}
        {!canDownloadVoucher && (
          <div className="no-print mx-3 sm:mx-5 mt-3 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center gap-2.5 text-amber-200 text-xs font-medium shrink-0">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="leading-tight">
              <strong className="text-white">PDF Voucher Download Locked:</strong> Organizers require payment settlement or receipt verification prior to PDF voucher download.
            </span>
          </div>
        )}

        {/* PRINTABLE / DISPLAY CANVAS (EXECUTIVE DARK OBSIDIAN STYLE) */}
        <div className="p-2.5 sm:p-6 overflow-y-auto bg-[#03050A] flex flex-col items-center flex-1">
          <div className="w-full max-w-2xl flex justify-center py-2 sm:py-6 pb-20 sm:pb-28">
            <div
              id="printable-pass-summary"
              className="w-full bg-[#090D1A] text-white p-4 sm:p-8 pb-10 sm:pb-16 rounded-xl sm:rounded-2xl shadow-2xl border-2 border-amber-500 space-y-4 sm:space-y-6 relative font-sans"
              style={{ color: '#ffffff', backgroundColor: '#090D1A' }}
            >
              {/* Fine Metallic Border Frame */}
              <div className="absolute inset-2 sm:inset-3 border border-amber-500/30 rounded-lg sm:rounded-xl pointer-events-none" />

              {/* Brand Header */}
              <div className="bg-[#0F172A] text-white p-3.5 sm:p-5 rounded-xl border border-amber-500/60 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-1 relative z-10 min-w-0">
                  <div className="flex items-center gap-1.5 text-amber-400 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                    <span className="truncate">GRENADA CARICOM FESTIVAL 2027</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black font-serif text-white tracking-wide uppercase leading-tight">
                    OFFICIAL FESTIVAL PASS SUMMARY
                  </h2>
                  <p className="text-[10px] sm:text-xs font-bold text-amber-200/90 uppercase tracking-wider font-mono">
                    Issued by Mellows Entertainment • 10-Day Celebration
                  </p>
                </div>

                <div className="bg-[#080C17] border border-amber-500/40 p-2.5 sm:p-3 rounded-xl text-left sm:text-right shrink-0 relative z-10 w-full sm:w-auto">
                  <span className="text-[8px] sm:text-[9px] uppercase font-black text-amber-400 block tracking-widest font-mono">
                    RESERVATION REFERENCE
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-amber-300 block tracking-wider mt-0.5 break-all">
                    {refCode}
                  </span>
                </div>
              </div>

              {/* Guest Details & Venue Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                <div className="bg-[#0F1629] text-white p-3.5 sm:p-5 rounded-xl border border-amber-500/30 space-y-2 shadow-md">
                  <h4 className="font-black text-amber-400 uppercase tracking-wider text-[10px] font-mono">GUEST INFORMATION</h4>
                  <p className="text-sm font-black text-white">{nameDisplay}</p>
                  <div className="space-y-1 font-mono text-slate-200 text-xs pt-1.5 border-t border-slate-800 break-all">
                    <p><strong className="text-amber-400/80">Email:</strong> {emailDisplay}</p>
                    <p><strong className="text-amber-400/80">Phone:</strong> {phoneDisplay}</p>
                    <p><strong className="text-amber-400/80">Date Issued:</strong> {dateIssued}</p>
                  </div>
                </div>

                <div className="bg-[#0F1629] text-white p-3.5 sm:p-5 rounded-xl border border-amber-500/30 space-y-2 shadow-md">
                  <h4 className="font-black text-amber-400 uppercase tracking-wider text-[10px] font-mono">WRISTBAND COLLECTION POINT</h4>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{paymentConfig.arrivalDeskName} ({paymentConfig.arrivalDeskLocation})</span>
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-1.5 border-t border-slate-800">
                    {paymentConfig.wristbandCollectionNotes || 'Present this summary or reservation reference upon airport or hotel arrival to receive official RFID access wristbands.'}
                  </p>
                  {paymentConfig.supportPhone && (
                    <p className="text-[10px] font-mono font-bold text-emerald-400 pt-0.5">
                      <PhoneCall className="w-3 h-3 text-emerald-400 inline mr-1" />
                      Concierge Support: {paymentConfig.supportPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment & Wristband Purchase Option */}
              <div className="bg-[#0F1629] text-white p-3.5 sm:p-5 rounded-xl border border-amber-500/30 space-y-2.5 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-mono text-[10px] font-black uppercase text-amber-400 tracking-wider">
                      PAYMENT METHOD &amp; PURCHASE OPTION
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30 self-start sm:self-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Monzo {paymentTiming === 'now' ? '• Pay Now (Bank Transfer)' : '• Pay on Arrival'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="space-y-1 text-slate-300">
                    <p><strong className="text-white">Payment Method:</strong> {paymentTiming === 'now' ? 'Monzo Bank Transfer' : 'Pay on Arrival'}</p>
                    <p><strong className="text-white">Purchase Option:</strong> {paymentTiming === 'now' ? 'Pay Now via Monzo' : 'Pay on Arrival'}</p>
                    <p><strong className="text-white">Wristband Status:</strong> <span className="text-amber-300 font-bold">{paymentTiming === 'now' ? 'ALLOCATED / SECURED' : 'RESERVED FOR ARRIVAL'}</span></p>
                  </div>
                  <div className="space-y-1 text-slate-300 bg-[#080D1A] p-2.5 rounded-lg border border-slate-800 text-[11px] break-all">
                    {paymentTiming === 'now' ? (
                      <>
                        <p className="text-amber-400 font-bold">Monzo Pay / Transfer Details:</p>
                        <p>Bank: {paymentConfig.bankName} • Sort: {paymentConfig.sortCode} • Acc: {paymentConfig.accountNumber}</p>
                        <p>Beneficiary: {paymentConfig.accountName}</p>
                        <p>Payment Ref: <span className="text-amber-300 font-bold">{refCode}</span></p>
                        {paymentConfig.monzoMeSlug && (
                          <div className="pt-1.5 not-printable">
                            <a
                              href={getMonzoMeUrl(paymentConfig.monzoMeSlug, totalGBP, refCode)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500 hover:bg-rose-400 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Pay Now via Monzo.me (£{totalGBP})
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-emerald-400 font-bold">Settlement upon Arrival in Grenada:</p>
                        <p>Wristbands reserved under ref: <span className="text-amber-300 font-bold">{refCode}</span></p>
                        <p>Pay via Monzo card / contactless or Monzo transfer at airport desk.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Receipt Status & Action in Voucher */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-300">
                      Proof of Payment (Receipt):
                    </span>
                    {currentSubmission?.receiptUrl ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        {currentSubmission.receiptStatus === 'verified' ? 'Verified' : 'Submitted (In Review)'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400/80 font-mono">
                        Not yet attached
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 not-printable self-start sm:self-auto">
                    {currentSubmission?.receiptUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsLightboxOpen(true)}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-neutral-700 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>View Receipt</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsReceiptModalOpen(true)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                        >
                          Replace
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsReceiptModalOpen(true)}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <UploadCloud className="w-3 h-3 text-amber-400" />
                        <span>Upload Receipt Screenshot</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table with horizontal overflow wrapper */}
              <div className="space-y-2.5">
                <h4 className="font-black text-amber-400 uppercase tracking-wider text-xs border-b border-amber-500/30 pb-1.5 font-mono">
                  RESERVED PASSES &amp; VIP PACKAGES
                </h4>
                
                <div className="border border-amber-500/30 rounded-xl overflow-x-auto shadow-md bg-[#0F1629]">
                  <table className="w-full text-left text-xs border-collapse min-w-[320px]">
                    <thead>
                      <tr className="bg-[#17213B] text-amber-300 font-bold text-[10px] uppercase tracking-wider font-mono border-b border-amber-500/30">
                        <th className="py-2.5 px-3">ITEM / PASS</th>
                        <th className="py-2.5 px-2 text-center">QTY</th>
                        <th className="py-2.5 px-2 text-right">UNIT</th>
                        <th className="py-2.5 px-3 text-right">TOTAL ({currency || 'GBP'})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-white font-medium">
                      {cart.map((item, idx) => {
                        const p = typeof item.pass?.priceGBP === 'number' && !isNaN(item.pass.priceGBP)
                          ? item.pass.priceGBP
                          : parseFloat(String(item.pass?.priceGBP || '169').replace(/[^0-9.]/g, '')) || 169;
                        const convertedUnitPrice = getCurrencyRate(p);
                        const qty = item.quantity || 1;
                        const linePrice = `${symbol}${(convertedUnitPrice * qty).toLocaleString('en-GB')}`;

                        return (
                          <tr key={item.pass?.id || idx}>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <strong className="text-white font-bold text-xs">{item.pass?.title || 'VIP Festival Pass'}</strong>
                              </div>
                              <span className="text-[10px] text-slate-300 block pl-5 mt-0.5 font-sans">
                                {item.pass?.tier || 'VIP'} Tier
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center font-mono font-bold text-slate-200 text-sm">
                              {qty}
                            </td>
                            <td className="py-3 px-2 text-right font-mono font-bold text-slate-300 text-xs">
                              {symbol}{convertedUnitPrice.toLocaleString('en-GB')}
                            </td>
                            <td className="py-3 px-3 text-right font-black font-mono text-amber-400 text-sm">
                              {linePrice}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Total Footer */}
                <div className="bg-[#0D1322] border border-amber-500/30 p-3 sm:p-3.5 rounded-xl flex items-center justify-between text-xs font-mono font-bold gap-2">
                  <span className="text-amber-300 uppercase tracking-wider text-[11px] sm:text-xs">TOTAL DUE / PAID:</span>
                  <span className="text-lg sm:text-xl font-black text-amber-400">{displayTotal}</span>
                </div>
              </div>

              {/* Terms Footer */}
              <div className="pt-3 pb-2 border-t border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400 font-sans">
                <div className="space-y-0.5 text-center sm:text-left">
                  <p className="font-bold text-amber-300 uppercase font-mono">• Official passes non-transferable without prior notification to Concierge.</p>
                  <p className="text-slate-400">• Airport shuttle pickups guaranteed for guests submitting flight arrival details.</p>
                  <p className="text-slate-400">• Grenada CARICOM Festival 2027 • 10 Days of Culture, Soca &amp; Reggae.</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-amber-500/60 bg-[#0F172A] text-amber-400 font-mono font-black text-[7px] sm:text-[8px] text-center p-1 flex flex-col items-center justify-center shadow-md">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 mb-0.5" />
                    <span>SEAL OF</span>
                    <span className="text-[6px] text-amber-300">AUTHENTICITY</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer actions (no-print) */}
        <div className="no-print p-3 sm:p-4 bg-neutral-950 border-t border-amber-500/30 flex justify-between items-center gap-2 shrink-0">
          <button
            onClick={handleCopyText}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-neutral-800 min-h-[40px]"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? 'Copied to Clipboard' : 'Copy Text Summary'}</span>
            <span className="sm:hidden">{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          <div className="flex items-center gap-2">
            {canDownloadVoucher && (
              <button
                onClick={handlePrint}
                disabled={isGeneratingPdf}
                title="Download Executive PDF Voucher"
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer min-h-[40px]"
              >
                {isGeneratingPdf ? (
                  <div className="w-3.5 h-3.5 border-2 border-neutral-950/20 border-t-neutral-950 rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span className="hidden sm:inline">
                  {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Voucher'}
                </span>
                <span className="sm:hidden">
                  {isGeneratingPdf ? 'PDF...' : 'PDF'}
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-neutral-800 min-h-[40px]"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* Upload Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        defaultOrderRef={refCode}
        defaultEmail={buyerEmail}
        defaultName={buyerName}
        onReceiptSubmitted={(updated) => {
          setCurrentSubmission(updated);
        }}
      />

      {/* Lightbox for viewing receipt */}
      {currentSubmission?.receiptUrl && (
        <ReceiptLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          receiptUrl={currentSubmission.receiptUrl}
          receiptName={currentSubmission.receiptName}
          orderRef={refCode}
          guestName={buyerName}
        />
      )}
    </div>,
    document.body
  );
};
