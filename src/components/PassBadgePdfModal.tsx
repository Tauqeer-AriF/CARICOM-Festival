import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Check, Award } from 'lucide-react';
import { FormSubmissionItem } from '../types';
import { ExecutiveVoucherCanvas, parseSubmissionItems } from './ExecutiveVoucherCanvas';

export { parseSubmissionItems };

interface PassBadgePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: FormSubmissionItem;
  onAttachToReply?: (submission: FormSubmissionItem, pdfTitle: string) => void;
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
            <ExecutiveVoucherCanvas
              submission={submission}
              docType={docType}
              elementId="executive-pdf-canvas"
            />
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
