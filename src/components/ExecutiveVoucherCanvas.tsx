import React from 'react';
import { ShieldCheck, Sparkles, MapPin, QrCode, Star, Clock, AlertCircle } from 'lucide-react';
import { FormSubmissionItem } from '../types';
import { isPassOrderConfirmed } from '../services/submissionService';

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

export interface ExecutiveVoucherCanvasProps {
  submission: FormSubmissionItem;
  docType?: 'full' | 'wristband' | 'credential';
  elementId?: string;
  collectionPointName?: string;
  collectionPointDetails?: string;
  conciergePhone?: string;
}

export const ExecutiveVoucherCanvas: React.FC<ExecutiveVoucherCanvasProps> = ({
  submission,
  docType = 'full',
  elementId = 'executive-pdf-canvas',
  collectionPointName = 'Royalton Grenada Resort & Mellowland Desk',
  collectionPointDetails = 'Present this credential or reservation reference upon airport or hotel arrival to receive official RFID access wristbands.',
  conciergePhone = '+44 7900 123456'
}) => {
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

  const isConfirmed = isPassOrderConfirmed(submission);
  const isInReview = submission.status === 'in-review' || submission.receiptStatus === 'in-review';

  return (
    <div
      id={elementId}
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
          {isConfirmed ? (
            <span className="text-[10px] font-mono text-emerald-400 font-black bg-emerald-950/90 px-3 py-1 rounded-md border border-emerald-500/60 inline-block mt-1.5 shadow-sm">
              ✓ VERIFIED & PAID
            </span>
          ) : isInReview ? (
            <span className="text-[10px] font-mono text-amber-400 font-black bg-amber-950/90 px-3 py-1 rounded-md border border-amber-500/60 inline-block mt-1.5 shadow-sm">
              ⏳ IN REVIEW / PENDING
            </span>
          ) : (
            <span className="text-[10px] font-mono text-slate-400 font-black bg-slate-950/90 px-3 py-1 rounded-md border border-slate-700 inline-block mt-1.5 shadow-sm">
              ⚪ AWAITING SETTLEMENT
            </span>
          )}
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
            <span className="text-[10px] text-slate-400">
              {isConfirmed ? 'SPEC: 350MM X 25MM • ACTIVE RFID TRANSPONDER' : 'SPEC: 350MM X 25MM • RFID HELD PENDING CLEARANCE'}
            </span>
          </div>

          {/* Wristband Layout Graphic */}
          <div className="relative bg-gradient-to-r from-[#0C1222] via-[#111A30] to-[#0C1222] text-white rounded-2xl p-6 border border-amber-500/50 shadow-xl overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5">
            {/* Holographic Watermark Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(var(--primary-rgb),0.15),transparent)] pointer-events-none" />

            {/* Left RFID Chip Zone */}
            <div className="flex items-center gap-4 relative z-10 min-w-0">
              <div className={`w-16 h-16 rounded-xl text-neutral-950 font-black flex flex-col items-center justify-center p-2 shadow-lg border shrink-0 ${
                isConfirmed 
                  ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 border-amber-300' 
                  : isInReview
                  ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-neutral-800 text-amber-200 border-amber-600/50'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}>
                <QrCode className="w-8 h-8" />
                <span className="text-[8px] font-mono uppercase tracking-widest font-black mt-0.5">
                  {isConfirmed ? 'RFID CHIP' : 'HELD'}
                </span>
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
              {isConfirmed ? (
                <>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider">
                    ★ VIP ENCLAVE
                  </span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider">
                    ★ MAIN STAGE
                  </span>
                  <span className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/50 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider">
                    ★ SHUTTLE EXPRESS
                  </span>
                </>
              ) : isInReview ? (
                <span className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded-md text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>PAYMENT UNDER REVIEW • WRISTBAND HELD</span>
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-neutral-800 text-neutral-400 border border-neutral-700 rounded-md text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>AWAITING PAYMENT • WRISTBAND HELD</span>
                </span>
              )}
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
              <span className="text-[8px] font-mono text-slate-400 block uppercase">
                {isConfirmed ? 'Official RFID Barcode' : 'Pending Verification Barcode'}
              </span>
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
                {submission.extraDetails?.CollectionPoint || collectionPointName}
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-2 border-t border-slate-800">
                {collectionPointDetails}
              </p>
              <p className="text-[10px] font-mono font-bold text-emerald-400 pt-0.5">Helpline WhatsApp: {conciergePhone}</p>
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
  );
};
