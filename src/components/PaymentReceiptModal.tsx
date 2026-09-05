import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  RefreshCw,
  Camera,
  Check,
  Eye,
  Download
} from 'lucide-react';
import { attachPaymentReceipt, getSubmissionByOrderRef, getSubmissions } from '../services/submissionService';
import { FormSubmissionItem } from '../types';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderRef?: string;
  defaultEmail?: string;
  defaultName?: string;
  onReceiptSubmitted?: (sub: FormSubmissionItem) => void;
}

/**
 * Compresses an image file client-side to ensure smooth local and cloud storage.
 */
export const compressImageFile = (file: File): Promise<{ dataUrl: string; sizeKb: number; name: string }> => {
  return new Promise((resolve, reject) => {
    // If it's a PDF or not an image
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          dataUrl: reader.result as string,
          sizeKb: Math.round(file.size / 1024),
          name: file.name
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1400;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: e.target?.result as string,
            sizeKb: Math.round(file.size / 1024),
            name: file.name
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const approxSizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl: compressedDataUrl,
          sizeKb: approxSizeKb,
          name: file.name.replace(/\.[^/.]+$/, "") + ".jpg"
        });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  defaultOrderRef = '',
  defaultEmail = '',
  defaultName = '',
  onReceiptSubmitted
}) => {
  const [orderRef, setOrderRef] = useState(defaultOrderRef);
  const [senderName, setSenderName] = useState(defaultName);
  const [senderEmail, setSenderEmail] = useState(defaultEmail);
  const [notes, setNotes] = useState('');
  
  const [selectedFile, setSelectedFile] = useState<{
    dataUrl: string;
    sizeKb: number;
    name: string;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successSubmission, setSuccessSubmission] = useState<FormSubmissionItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<FormSubmissionItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setOrderRef(defaultOrderRef);
      setSenderName(defaultName);
      setSenderEmail(defaultEmail);
      setErrorMessage(null);
      setSuccessSubmission(null);
      setSelectedFile(null);

      if (defaultOrderRef) {
        const found = getSubmissionByOrderRef(defaultOrderRef);
        if (found) {
          setExistingSubmission(found);
          if (found.receiptUrl) {
            setSelectedFile({
              dataUrl: found.receiptUrl,
              sizeKb: 0,
              name: found.receiptName || 'Existing Receipt'
            });
          }
        }
      }
    }
  }, [isOpen, defaultOrderRef, defaultName, defaultEmail]);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMessage('Please upload an image file (PNG, JPG, JPEG, WEBP) or PDF screenshot.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds 25MB limit. Please choose a smaller image.');
      return;
    }

    try {
      const processed = await compressImageFile(file);
      setSelectedFile(processed);
    } catch (err) {
      console.error('File compression error:', err);
      setErrorMessage('Failed to read file. Please try another image.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please attach a screenshot or receipt image of your payment.');
      return;
    }

    if (!orderRef.trim()) {
      setErrorMessage('Please enter your Order or Reservation Reference (e.g., GCF-2027-XXXXX).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const updated = attachPaymentReceipt(orderRef.trim(), {
        receiptUrl: selectedFile.dataUrl,
        receiptName: selectedFile.name,
        receiptNotes: [
          notes.trim(),
          senderName ? `Sender: ${senderName}` : '',
          senderEmail ? `Email: ${senderEmail}` : ''
        ].filter(Boolean).join(' • ')
      });

      if (updated) {
        setSuccessSubmission(updated);
        if (onReceiptSubmitted) {
          onReceiptSubmitted(updated);
        }
      } else {
        // Fallback: search submissions to see if any matches partial
        const allSubs = getSubmissions();
        const found = allSubs.find(s => 
          s.id.toLowerCase().includes(orderRef.trim().toLowerCase()) ||
          (s.extraDetails?.OrderRef && s.extraDetails.OrderRef.toLowerCase().includes(orderRef.trim().toLowerCase()))
        );

        if (found) {
          const retried = attachPaymentReceipt(found.id, {
            receiptUrl: selectedFile.dataUrl,
            receiptName: selectedFile.name,
            receiptNotes: notes.trim()
          });
          if (retried) {
            setSuccessSubmission(retried);
            if (onReceiptSubmitted) onReceiptSubmitted(retried);
            setIsSubmitting(false);
            return;
          }
        }

        // If order ref was not found in database, still record and attach to the closest or notify user
        setErrorMessage(`Could not find an active reservation for reference "${orderRef}". Please verify your reference number.`);
      }
    } catch (err) {
      console.error('Error attaching receipt:', err);
      setErrorMessage('An unexpected error occurred while saving your receipt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Send Payment Receipt
              </h3>
              <p className="text-[11px] text-neutral-400">
                Upload Monzo transfer screenshot or payment confirmation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {successSubmission ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">Receipt Successfully Submitted!</h4>
              <p className="text-xs text-neutral-300 max-w-sm mx-auto">
                Your payment screenshot has been attached to reservation <strong className="text-amber-400 font-mono">{orderRef}</strong>.
              </p>
            </div>

            {selectedFile && (
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 max-w-xs mx-auto flex items-center gap-3 text-left">
                {selectedFile.dataUrl.startsWith('data:image') ? (
                  <img 
                    src={selectedFile.dataUrl} 
                    alt="Receipt Thumbnail" 
                    className="w-12 h-12 object-cover rounded-lg border border-neutral-700 shrink-0" 
                  />
                ) : (
                  <FileText className="w-8 h-8 text-amber-400 shrink-0" />
                )}
                <div className="truncate text-xs">
                  <span className="text-white font-medium block truncate">{selectedFile.name}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Status: Pending Verification</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Order Reference */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                Order / Voucher Reference *
              </label>
              <input
                type="text"
                required
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value.toUpperCase())}
                placeholder="e.g. GCF-2027-12345"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Found on your order confirmation screen or voucher pass.
              </span>
            </div>

            {/* File Upload Box (Drag-and-Drop & Click to Browse) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                Receipt Screenshot or File *
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />

              {selectedFile ? (
                <div className="p-3 bg-neutral-950 border border-neutral-700 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {selectedFile.dataUrl.startsWith('data:image') ? (
                      <img 
                        src={selectedFile.dataUrl} 
                        alt="Receipt preview" 
                        className="w-14 h-14 object-cover rounded-lg border border-neutral-800 shrink-0 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        title="Click to replace"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                    <div className="truncate text-xs">
                      <p className="text-white font-bold truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        {selectedFile.sizeKb > 0 ? `~${selectedFile.sizeKb} KB` : 'Ready to attach'} • Optimized
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer mt-0.5 block"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-neutral-700 bg-neutral-950/50 hover:bg-neutral-800/40 hover:border-neutral-600'
                  }`}
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-neutral-800 flex items-center justify-center text-amber-400 mb-2">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-white">
                    Click to browse or drag &amp; drop receipt screenshot
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Supports PNG, JPG, JPEG, WEBP or PDF (Monzo in-app payment screenshot)
                  </p>
                </div>
              )}
            </div>

            {/* Optional Sender Info / Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Account / Sender Name (Optional)
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Attendee Email (Optional)
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Transaction Notes or Transfer Time (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Sent £338 at 14:15 via Monzo app"
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedFile}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isSubmitting || !selectedFile
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Attaching Receipt...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Submit Payment Receipt</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

/**
 * Lightbox modal to view uploaded receipts in high-resolution with download option
 */
export const ReceiptLightboxModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  receiptUrl?: string;
  receiptName?: string;
  orderRef?: string;
  guestName?: string;
}> = ({ isOpen, onClose, receiptUrl, receiptName, orderRef, guestName }) => {
  if (!isOpen || !receiptUrl) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-neutral-950/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Payment Receipt: <span className="text-amber-300 font-mono">{orderRef || 'Proof of Transfer'}</span></span>
            {guestName && <span className="text-neutral-400 font-normal">({guestName})</span>}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={receiptUrl}
              download={receiptName || `receipt-${orderRef || 'payment'}.jpg`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold px-2.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-3 sm:p-6 overflow-auto flex-1 flex items-center justify-center bg-black/40">
          {receiptUrl.startsWith('data:image') || receiptUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
            <img 
              src={receiptUrl} 
              alt={receiptName || "Payment Receipt Screenshot"} 
              className="max-h-[70vh] max-w-full object-contain rounded-lg border border-neutral-800 shadow-lg"
            />
          ) : (
            <iframe 
              src={receiptUrl} 
              title="Receipt Document" 
              className="w-full h-[65vh] rounded-lg border border-neutral-800"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
