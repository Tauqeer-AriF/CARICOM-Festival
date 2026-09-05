import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Search, Download, Printer, ShieldCheck, Ticket, CheckCircle2, 
  Clock, AlertTriangle, MapPin, PhoneCall, Copy, Check, Camera, 
  ExternalLink, Sparkles, User, Mail, Calendar, ArrowRight, Shield, Award
} from 'lucide-react';
import { FormSubmissionItem } from '../types';
import { getSubmissionByOrderRef, isPassOrderConfirmed, getSiteConfig } from '../services/submissionService';
import { getPaymentConfig } from '../services/paymentConfigService';
import { ExecutiveVoucherCanvas } from './ExecutiveVoucherCanvas';

interface VoucherLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRef?: string;
  onOpenReceiptModal?: (ref: string) => void;
}

export const VoucherLookupModal: React.FC<VoucherLookupModalProps> = ({
  isOpen,
  onClose,
  initialRef = '',
  onOpenReceiptModal
}) => {
  const [refInput, setRefInput] = useState(initialRef);
  const [searchedRef, setSearchedRef] = useState('');
  const [submission, setSubmission] = useState<FormSubmissionItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [docType, setDocType] = useState<'full' | 'wristband' | 'credential'>('full');
  const [paymentConfig, setPaymentConfig] = useState(getPaymentConfig);

  const siteConfig = getSiteConfig();

  useEffect(() => {
    const handleConfigUpdate = () => {
      setPaymentConfig(getPaymentConfig());
    };
    window.addEventListener('payment_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('payment_config_updated', handleConfigUpdate);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialRef) {
        setRefInput(initialRef);
        handleLookup(initialRef);
      }
    }
  }, [isOpen, initialRef]);

  const handleLookup = (lookupCode?: string) => {
    const code = (lookupCode ?? refInput).trim();
    if (!code) return;

    setSearchedRef(code);
    const found = getSubmissionByOrderRef(code);
    setSubmission(found);
    setHasSearched(true);
  };

  const isConfirmed = submission ? isPassOrderConfirmed(submission) : false;
  const allowDownloadBeforeSettle = paymentConfig.allowPassVoucherDownloadBeforePayment ?? true;
  const canShowVoucherCanvas = isConfirmed || allowDownloadBeforeSettle;
  const isPassOrder = submission?.type === 'pass-order' || Boolean(submission?.extraDetails?.OrderRef);
  const orderRef = submission?.extraDetails?.OrderRef || submission?.extraDetails?.Reference || searchedRef;

  const handlePrint = async () => {
    if (!canShowVoucherCanvas) {
      alert('Official PDF voucher download before payment settlement is disabled by event organizers.');
      return;
    }
    const element = document.getElementById('printable-wristband-voucher');
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
      pdf.save(`CARICOM_2027_VIP_Pass_${orderRef}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyVoucherText = () => {
    if (!submission) return;
    const refCode = submission.extraDetails?.OrderRef || submission.id;
    const text = `
OFFICIAL GRENADA CARICOM FESTIVAL 2027 - WRISTBAND VOUCHER
Status: CONFIRMED & ALLOCATED
Reservation Ref: ${refCode}
Guest Name: ${submission.name}
Email: ${submission.email}
Phone: ${submission.phone || 'N/A'}
Allocated Passes: ${submission.extraDetails?.PurchasedItems || submission.topicOrPass || 'VIP Festival Pass'}
Total Amount: ${submission.extraDetails?.TotalPaid || (submission.amountGBP ? `£${submission.amountGBP}` : 'Confirmed')}
Wristband Collection Point: ${submission.extraDetails?.CollectionPoint || paymentConfig.arrivalDeskName}
Festival Dates: 1–11 August 2027
Venue: Mellows Entertainment Complex & Partner Resorts, Grenada
Concierge WhatsApp: ${siteConfig.socialLinks?.whatsapp || '+44 7900 123456'}
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 20mm 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-wristband-voucher, #printable-wristband-voucher * {
            visibility: visible !important;
          }
          #printable-wristband-voucher {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
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

      <div className="relative w-full max-w-4xl bg-[#090D1A] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="no-print p-4 sm:p-5 border-b border-white/10 bg-neutral-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Ticket className="w-6 h-6 text-neutral-950" />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block font-mono">
                SELF-SERVICE CONCIERGE
              </span>
              <h3 className="text-base font-bold text-white font-serif">
                Download Wristband Voucher
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#050811]">
          {/* Reference Lookup Box */}
          <div className="no-print bg-neutral-900/90 border border-neutral-800 p-4 sm:p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                Enter Reservation Reference Number
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">
                Format: GCF-2027-XXXXX
              </span>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup();
              }}
              className="flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value.toUpperCase())}
                  placeholder="e.g. GCF-2027-99102"
                  className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-400 text-white px-4 py-3 rounded-xl font-mono text-sm tracking-wider uppercase placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  autoFocus
                />
                {refInput && (
                  <button
                    type="button"
                    onClick={() => setRefInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!refInput.trim()}
                className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-500/20 shrink-0 font-mono"
              >
                <Search className="w-4 h-4" />
                <span>Verify &amp; Retrieve</span>
              </button>
            </form>
          </div>

          {/* Results Area */}
          {hasSearched && (
            <div className="space-y-6 animate-fadeIn">
              {submission ? (
                canShowVoucherCanvas ? (
                  /* ===================== CONFIRMED / PRE-SETTLE VOUCHER VIEW ===================== */
                  <div className="space-y-4">
                    {/* Confirmation / Pre-Settle Header & Doc Type Switcher */}
                    <div className={`p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg border ${
                      isConfirmed 
                        ? 'bg-emerald-500/10 border-emerald-500/40' 
                        : 'bg-amber-500/10 border-amber-500/40'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${
                          isConfirmed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {isConfirmed ? <CheckCircle2 className="w-6 h-6" /> : <Ticket className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black uppercase tracking-wider font-mono ${
                              isConfirmed ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {isConfirmed ? 'PASS CONFIRMED & VERIFIED' : 'PASS RESERVED (PRE-SETTLEMENT VOUCHER)'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isConfirmed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {isConfirmed ? 'RFID ALLOCATED' : 'PAYMENT PENDING'}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300">
                            {isConfirmed
                              ? 'Your reservation is fully cleared for entry. Download your official wristband voucher below.'
                              : 'Your reservation is saved. Organizers permit downloading your PDF voucher prior to arrival settlement.'}
                          </p>
                        </div>
                      </div>

                      {/* Doc Type Selector */}
                      <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1.5 rounded-xl self-stretch md:self-auto justify-center">
                        <button
                          type="button"
                          onClick={() => setDocType('full')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            docType === 'full' ? 'bg-amber-500 text-neutral-950 shadow-md font-extrabold' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Full Pass & Wristband
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocType('wristband')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            docType === 'wristband' ? 'bg-amber-500 text-neutral-950 shadow-md font-extrabold' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          RFID Wristband Only
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocType('credential')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            docType === 'credential' ? 'bg-amber-500 text-neutral-950 shadow-md font-extrabold' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Pass Voucher Sheet
                        </button>
                      </div>
                    </div>

                    {/* OFFICIAL EXECUTIVE PRINTABLE VOUCHER CANVAS */}
                    <div className="w-full flex justify-center py-2">
                      <ExecutiveVoucherCanvas
                        submission={submission}
                        docType={docType}
                        elementId="printable-wristband-voucher"
                      />
                    </div>

                    {/* Bottom Action Controls */}
                    <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCopyVoucherText}
                        className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors border border-neutral-800 cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Voucher Text'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
                          title="Print Document"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Print</span>
                        </button>

                        <button
                          type="button"
                          onClick={handlePrint}
                          disabled={isGeneratingPdf}
                          className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-xl shadow-amber-500/20 cursor-pointer font-mono"
                        >
                          {isGeneratingPdf ? (
                            <div className="w-4 h-4 border-2 border-neutral-950/20 border-t-neutral-950 rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 stroke-[2.5]" />
                          )}
                          <span>{isGeneratingPdf ? 'Generating Executive PDF...' : 'Download Executive Dark PDF'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ===================== PENDING VERIFICATION VIEW ===================== */
                  <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                        <Clock className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white font-serif">
                            Reservation Found: Awaiting Payment Verification
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase border border-amber-500/30">
                            PENDING REVIEW
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          We found your pass reservation for <strong className="text-white">{submission.name}</strong> (Ref: <strong className="text-amber-300 font-mono">{submission.extraDetails?.OrderRef || submission.id}</strong>).
                          Your official wristband voucher will unlock for download as soon as your bank transfer or Monzo settlement is verified by our concierge team.
                        </p>
                      </div>
                    </div>

                    {/* Order Snapshot Card */}
                    <div className="bg-neutral-950/80 p-4 rounded-xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-neutral-500 text-[10px] block uppercase">Pass Reserved</span>
                        <span className="text-white font-bold">{submission.extraDetails?.PurchasedItems || submission.topicOrPass || 'Festival Pass'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px] block uppercase">Total Amount</span>
                        <span className="text-amber-400 font-bold">{submission.extraDetails?.TotalPaid || `£${submission.amountGBP || 0}`}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px] block uppercase">Payment Method</span>
                        <span className="text-neutral-300">{submission.extraDetails?.PaymentTiming || 'Monzo / Bank Transfer'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px] block uppercase">Current Status</span>
                        <span className="text-amber-300 font-bold">
                          {submission.receiptStatus === 'verified' ? 'Verified' : submission.receiptUrl ? 'Receipt Under Review' : 'Awaiting Payment Proof'}
                        </span>
                      </div>
                    </div>

                    {/* Direct Upload Receipt Action */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-500/20">
                      <p className="text-xs text-neutral-400">
                        Have you made your transfer? Attach your screenshot to expedite voucher clearance.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenReceiptModal) {
                            onOpenReceiptModal(submission.extraDetails?.OrderRef || submission.id);
                          } else {
                            window.dispatchEvent(new CustomEvent('open_payment_receipt_modal', {
                              detail: { orderRef: submission.extraDetails?.OrderRef || submission.id }
                            }));
                          }
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-mono shrink-0 shadow-lg shadow-amber-500/20"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Upload Transfer Receipt</span>
                      </button>
                    </div>
                  </div>
                )
              ) : (
                /* ===================== NOT FOUND VIEW ===================== */
                <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white font-serif">
                      No Reservation Found for "{searchedRef}"
                    </h4>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                      Please double-check the reference number entered. Reservation codes typically start with <span className="font-mono text-amber-300">GCF-2027-</span> or match your order ID on your checkout receipt.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRefInput('')}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono rounded-xl cursor-pointer transition-colors"
                    >
                      Try Another Code
                    </button>
                    <a
                      href={`https://wa.me/${(siteConfig.socialLinks?.whatsapp || '+447900123456').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello Concierge, I need assistance finding my pass voucher for reservation ${searchedRef}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Contact WhatsApp Support</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="no-print p-4 bg-neutral-950 border-t border-white/10 flex items-center justify-between text-xs text-neutral-500 font-mono shrink-0">
          <span>Official Mellows Festival RFID System</span>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
