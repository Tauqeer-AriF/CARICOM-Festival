import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, ShieldCheck, Sparkles, Check, MapPin, QrCode, Award, Star } from 'lucide-react';
import { FormSubmissionItem } from '../types';

interface PassBadgePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: FormSubmissionItem;
  onAttachToReply?: (submission: FormSubmissionItem, pdfTitle: string) => void;
}

export interface ParsedOrderItem {
  title: string;
  quantity: number;
  unitPriceGBP: number;
  totalPriceGBP: number;
}

export function parseSubmissionItems(submission: FormSubmissionItem): ParsedOrderItem[] {
  if (!submission) return [];
  const itemsText = submission.extraDetails?.PurchasedItems || submission.topicOrPass || '1x VIP Festival Pass';
  const message = submission.messageOrDetails || '';
  const totalAmount = submission.amountGBP || parseFloat(String(submission.extraDetails?.TotalPaid || '').replace(/[^0-9.]/g, '')) || 0;

  const rawParts = itemsText.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  const parsedItems: ParsedOrderItem[] = [];

  for (const part of rawParts) {
    let qty = 1;
    let title = part;

    const match = part.match(/^(\d+)\s*x\s*(.+)$/i);
    if (match) {
      qty = parseInt(match[1], 10) || 1;
      title = match[2].trim();
    } else {
      const msgQtyMatch = message.match(new RegExp(`(\\d+)\\s*x\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
      if (msgQtyMatch) {
        qty = parseInt(msgQtyMatch[1], 10) || 1;
      }
    }

    let unitPrice = 0;
    if (message) {
      const priceMatch = message.match(new RegExp(`${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*@\\s*£?\\$?([0-9.]+)`, 'i'));
      if (priceMatch) {
        unitPrice = parseFloat(priceMatch[1]) || 0;
      }
    }

    parsedItems.push({
      title,
      quantity: qty,
      unitPriceGBP: unitPrice,
      totalPriceGBP: 0
    });
  }

  if (parsedItems.length === 0) {
    parsedItems.push({
      title: submission.topicOrPass || 'VIP Festival Pass',
      quantity: 1,
      unitPriceGBP: totalAmount || 169,
      totalPriceGBP: totalAmount || 169
    });
  }

  for (const item of parsedItems) {
    if (item.unitPriceGBP === 0) {
      if (parsedItems.length === 1 && totalAmount > 0 && item.quantity > 0) {
        item.unitPriceGBP = Math.round((totalAmount / item.quantity) * 100) / 100;
      } else {
        item.unitPriceGBP = 169;
      }
    }
    item.totalPriceGBP = Math.round(item.unitPriceGBP * item.quantity * 100) / 100;
  }

  return parsedItems;
}

export const PassBadgePdfModal: React.FC<PassBadgePdfModalProps> = ({
  isOpen,
  onClose,
  submission,
}) => {
  const [docType, setDocType] = useState<'full' | 'wristband' | 'credential'>('full');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !submission) return null;

  const orderRef = submission.extraDetails?.OrderRef || submission.extraDetails?.Reference || `GCF-2027-${submission.id.replace('sub-', '')}`;
  const parsedItems = parseSubmissionItems(submission);
  const calculatedTotalGBP = parsedItems.reduce((acc, item) => acc + item.totalPriceGBP, 0);
  
  const totalPaid = calculatedTotalGBP > 0 
    ? `£${calculatedTotalGBP.toLocaleString('en-GB')} GBP`
    : (submission.extraDetails?.TotalPaid || 'CONFIRMED VIP ACCESS');

  const passTitle = parsedItems.map(i => `${i.quantity}x ${i.title}`).join(', ') || submission.topicOrPass || 'VIP 10-DAY ALL-ACCESS FESTIVAL PASS';

  const buyerName = submission.name || 'Valued VIP Guest';
  const buyerEmail = submission.email || 'guest@mellows-grenada.com';
  const buyerPhone = submission.phone || '+44 7900 123456';
  const issueDate = new Date(submission.submittedAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    const element = document.getElementById('executive-pdf-canvas');
    if (!element) {
      window.print();
      setIsGenerating(false);
      return;
    }

    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      // Capture at crisp 2.5x retina DPI
      const imgData = await toPng(element, {
        pixelRatio: 2.5,
        backgroundColor: '#090D1A',
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          transform: 'scale(1)',
          margin: '0',
          backgroundColor: '#090D1A',
          color: '#ffffff'
        }
      });

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Fit inside standard A4 PDF document with generous bottom margin
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // ~595.28 pt
      const pdfHeight = pdf.internal.pageSize.getHeight(); // ~841.89 pt

      const marginTop = 30;
      const marginBottom = 65; // ~23mm clear bottom margin on PDF page
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

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10010] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-2xl animate-fadeIn font-sans">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 20mm 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #executive-pdf-canvas, #executive-pdf-canvas * {
            visibility: visible !important;
          }
          #executive-pdf-canvas {
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

      <div className="relative w-full max-w-4xl bg-[#080B14] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Control Bar */}
        <div className="no-print p-4 sm:p-5 bg-neutral-950 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block font-mono">EXECUTIVE CREDENTIAL SUITE</span>
              <h3 className="text-base font-bold text-white font-serif">VIP Pass & Wristband Badge Studio</h3>
            </div>
          </div>

          {/* Doc Type Selector */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1.5 rounded-xl">
            <button
              onClick={() => setDocType('full')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                docType === 'full' ? 'bg-amber-500 text-neutral-950 shadow-md font-extrabold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Full Pass & Wristband
            </button>
            <button
              onClick={() => setDocType('wristband')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                docType === 'wristband' ? 'bg-amber-500 text-neutral-950 shadow-md font-extrabold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              RFID Wristband Only
            </button>
            <button
              onClick={() => setDocType('credential')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                docType === 'credential' ? 'bg-amber-500 text-neutral-950 shadow-md font-extrabold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Pass Voucher Sheet
            </button>
          </div>
        </div>

        {/* Download Success Banner */}
        {downloadSuccess && (
          <div className="bg-emerald-500 text-neutral-950 px-4 py-2.5 text-xs font-extrabold flex items-center justify-center gap-2 shadow-md animate-fadeIn font-sans shrink-0">
            <Check className="w-4.5 h-4.5 stroke-[3]" />
            <span>High-resolution Executive Dark PDF saved to your device downloads!</span>
          </div>
        )}

        {/* PDF DOCUMENT CANVAS (PREVIEW & CONVERTS TO HIGH RES PDF) */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-[#03050A] flex flex-col items-center flex-1">
          
          <div className="w-full max-w-3xl flex justify-center py-4 sm:py-8 pb-24 sm:pb-32">
            <div
              id="executive-pdf-canvas"
              className="w-full bg-[#090D1A] text-white p-8 sm:p-10 pb-12 sm:pb-16 rounded-2xl shadow-2xl border-2 border-amber-500 space-y-7 relative font-sans"
              style={{ color: '#ffffff', backgroundColor: '#090D1A' }}
            >
              {/* Fine Metallic Border Frame */}
              <div className="absolute inset-3 border border-amber-500/30 rounded-xl pointer-events-none" />

              {/* TOP HEADER: DEEP OBSIDIAN BANNER */}
              <div className="bg-[#0F172A] text-white p-6 rounded-xl border border-amber-500/60 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Background Luxury Crest Shimmer */}
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold text-[11px] uppercase tracking-widest font-mono">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>OFFICIAL VIP CREDENTIAL & ACCESS AUTHORIZATION</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-wide uppercase leading-tight">
                    CARICOM CULTURAL FESTIVAL 2027
                  </h1>
                  <p className="text-xs font-bold text-amber-200/90 uppercase tracking-wider font-mono">
                    Mellowland Cultural Village • Royalton VIP Enclave • Grenada, West Indies
                  </p>
                </div>

                <div className="text-right relative z-10 bg-[#080C17] p-3.5 rounded-xl border border-amber-500/40 shrink-0 w-full sm:w-auto">
                  <span className="text-[9px] font-black uppercase text-amber-400 block tracking-widest font-mono">RESERVATION REFERENCE</span>
                  <span className="text-xl font-mono font-black text-amber-300 block tracking-wider mt-0.5">{orderRef}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-black bg-emerald-950/90 px-3 py-1 rounded-md border border-emerald-500/60 inline-block mt-1.5 shadow-sm">
                    ✓ VERIFIED & PAID
                  </span>
                </div>
              </div>

              {/* SECTION 1: HOLOGRAPHIC RFID VIP WRISTBAND ACCESS BADGE */}
              {(docType === 'full' || docType === 'wristband') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase text-amber-400 border-b border-amber-500/30 pb-2 font-mono">
                    <span className="flex items-center gap-2 font-black text-amber-300">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>HOLOGRAPHIC RFID VIP WRISTBAND ACCESS VOUCHER</span>
                    </span>
                    <span className="text-[10px] text-slate-400">SPEC: 350MM X 25MM • HIGH-SECURITY RFID TRANSPONDER</span>
                  </div>

                  {/* Wristband Layout Graphic */}
                  <div className="relative bg-gradient-to-r from-[#0C1222] via-[#111A30] to-[#0C1222] text-white rounded-2xl p-6 border border-amber-500/50 shadow-xl overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5">
                    {/* Holographic Watermark Pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(var(--primary-rgb),0.15),transparent)] pointer-events-none" />

                    {/* Left RFID Chip Zone */}
                    <div className="flex items-center gap-4 relative z-10 min-w-0">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-neutral-950 font-black flex flex-col items-center justify-center p-2 shadow-lg border border-amber-300 shrink-0">
                        <QrCode className="w-8 h-8 text-neutral-950" />
                        <span className="text-[8px] font-mono uppercase tracking-widest font-black mt-0.5 text-neutral-950">RFID CHIP</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400 block font-mono">AUTHORIZED TIER</span>
                        <h3 className="text-xl font-black font-serif text-white uppercase tracking-wide leading-tight truncate">
                          {passTitle}
                        </h3>
                        <p className="text-xs font-mono text-slate-300 mt-1">
                          Pass Holder: <strong className="text-amber-300 font-bold">{buyerName}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Center Access Zone Badges */}
                    <div className="relative z-10 flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider">
                        ★ VIP ENCLAVE
                      </span>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider">
                        ★ MAIN STAGE
                      </span>
                      <span className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/50 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider">
                        ★ SHUTTLE EXPRESS
                      </span>
                    </div>

                    {/* Right Barcode Security Seal */}
                    <div className="relative z-10 text-right bg-black/70 p-3 rounded-xl border border-amber-500/40 shrink-0">
                      <div className="font-mono font-black text-amber-400 text-xs tracking-widest">{orderRef}</div>
                      <div className="h-7 w-32 bg-white my-1 rounded flex items-center justify-center gap-1 overflow-hidden px-1.5">
                        <div className="w-1.5 h-full bg-black" />
                        <div className="w-2.5 h-full bg-black" />
                        <div className="w-1 h-full bg-black" />
                        <div className="w-3 h-full bg-black" />
                        <div className="w-0.5 h-full bg-black" />
                        <div className="w-2 h-full bg-black" />
                        <div className="w-1.5 h-full bg-black" />
                      </div>
                      <span className="text-[8px] font-mono text-slate-400 block uppercase">Official RFID Barcode</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: OFFICIAL PASS CREDENTIAL VOUCHER SHEET */}
              {(docType === 'full' || docType === 'credential') && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Guest Information */}
                    <div className="bg-[#0F1629] text-white p-5 rounded-xl border border-amber-500/30 space-y-2.5 shadow-md">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block font-mono">
                        AUTHORIZED GUEST INFORMATION
                      </span>
                      <p className="text-base font-black text-white">{buyerName}</p>
                      <div className="space-y-1.5 font-mono text-slate-200 text-xs pt-2 border-t border-slate-800">
                        <p><strong className="text-amber-400/80">Email:</strong> {buyerEmail}</p>
                        <p><strong className="text-amber-400/80">Phone:</strong> {buyerPhone}</p>
                        <p><strong className="text-amber-400/80">Issued Date:</strong> {issueDate}</p>
                      </div>
                    </div>

                    {/* Wristband Collection Desk */}
                    <div className="bg-[#0F1629] text-white p-5 rounded-xl border border-amber-500/30 space-y-2.5 shadow-md">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block font-mono">
                        WRISTBAND COLLECTION POINT
                      </span>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                        Royalton Grenada Resort & Mellowland Desk
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-2 border-t border-slate-800">
                        Present this credential or reservation reference upon airport or hotel arrival to receive official RFID access wristbands.
                      </p>
                      <p className="text-[10px] font-mono font-bold text-emerald-400 pt-0.5">Helpline WhatsApp: +44 7900 123456</p>
                    </div>
                  </div>

                  {/* Itemized Package Table */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 block border-b border-amber-500/30 pb-1.5 font-mono">
                      RESERVED PASSES & VIP PACKAGES
                    </span>
                    
                    <div className="border border-amber-500/30 rounded-xl overflow-hidden shadow-md bg-[#0F1629]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#17213B] text-amber-300 font-bold text-[10px] uppercase tracking-wider font-mono border-b border-amber-500/30">
                            <th className="py-3 px-4">ITEM / PASS DESCRIPTION</th>
                            <th className="py-3 px-4 text-center">QTY</th>
                            <th className="py-3 px-4 text-right">UNIT PRICE</th>
                            <th className="py-3 px-4 text-right">TOTAL (GBP)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-white font-medium">
                          {parsedItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-4 px-4">
                                <strong className="text-sm font-black text-white block">{item.title}</strong>
                                <span className="text-[11px] text-slate-300 block mt-1 font-sans leading-relaxed">
                                  Price: £{item.unitPriceGBP.toLocaleString('en-GB')} per pass • Includes full access to festival events & VIP perks.
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center font-mono font-bold text-slate-200 text-sm">
                                {item.quantity}
                              </td>
                              <td className="py-4 px-4 text-right font-mono font-bold text-slate-300 text-xs">
                                £{item.unitPriceGBP.toLocaleString('en-GB')}
                              </td>
                              <td className="py-4 px-4 text-right font-black font-mono text-base text-amber-400">
                                £{item.totalPriceGBP.toLocaleString('en-GB')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-[#0D1322] border border-amber-500/20 p-4 rounded-xl flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-amber-300 uppercase tracking-wider">TOTAL AMOUNT PAID / RESERVED (GBP):</span>
                      <span className="text-xl font-black text-amber-400">{totalPaid}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* OFFICIAL FOOTER & EMBLEM GUARANTEE */}
              <div className="pt-5 pb-3 border-t border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-sans">
                <div className="space-y-1">
                  <p className="font-bold text-amber-300 uppercase font-mono">
                    • Official festival passes are non-transferable without prior notification to Mellows Concierge.
                  </p>
                  <p className="text-slate-400">
                    • Airport shuttle pickups are guaranteed for guests submitting flight arrival details via the registration portal.
                  </p>
                  <p className="text-slate-400">
                    • Grenada CARICOM Festival 2027 • 10 Days of Culture, Soca, Reggae, River Tubing & Culinary Fetes.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-14 h-14 rounded-full border border-amber-500/60 bg-[#0F172A] text-amber-400 font-mono font-black text-[9px] text-center p-1 flex flex-col items-center justify-center shadow-lg">
                    <Star className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                    <span>SEAL OF</span>
                    <span className="text-[7px] text-amber-300">AUTHENTICITY</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="no-print p-4 bg-neutral-950 border-t border-amber-500/30 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-neutral-800"
          >
            Close Studio
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="px-7 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 disabled:opacity-50 text-neutral-950 font-black text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xl shadow-amber-500/20"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-neutral-950/20 border-t-neutral-950 rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{isGenerating ? 'Generating Executive Dark PDF...' : 'Download Executive Dark PDF'}</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
