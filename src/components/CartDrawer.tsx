import React, { useState, useEffect, useRef } from 'react';
import { CartItem, WristbandPaymentTiming, WristbandPaymentMethod } from '../types';
import { 
  X, ShoppingBag, Trash2, CheckCircle2, Ticket, ArrowRight, ArrowLeft, 
  Plane, Download, FileText, CreditCard, Clock, Copy, Check, 
  ExternalLink, Sparkles, Building2, MapPin, PhoneCall, Camera, UploadCloud, Eye, AlertCircle, Lock, ShieldCheck
} from 'lucide-react';
import { LuxurySkeletonOverlay } from './LuxurySkeletonOverlay';
import { PassSummaryModal } from './PassSummaryModal';
import { PaymentReceiptModal, ReceiptLightboxModal, compressImageFile } from './PaymentReceiptModal';
import { AnimatePresence, motion } from 'motion/react';
import { addSubmission } from '../services/submissionService';
import { getPaymentConfig, PaymentConfig, getMonzoMeUrl, getPayPalMeUrl } from '../services/paymentConfigService';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  currency: 'GBP' | 'USD' | 'XCD';
  onNavigateRegister: () => void;
  onNavigatePasses?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  setCart,
  currency,
  onNavigateRegister,
  onNavigatePasses
}) => {
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(getPaymentConfig);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details' | 'confirmed'>('cart');
  const [paymentTiming, setPaymentTiming] = useState<WristbandPaymentTiming>(() => {
    const cfg = getPaymentConfig();
    if (!cfg.payNowEnabled && cfg.payOnArrivalEnabled) return 'arrival';
    return cfg.defaultTiming || 'now';
  });
  const [selectedMethod, setSelectedMethod] = useState<WristbandPaymentMethod>(() => {
    const cfg = getPaymentConfig();
    if (cfg.paypalEnabled) return 'paypal';
    if (cfg.monzoEnabled) return 'monzo';
    return 'monzo';
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPassSummaryOpen, setIsPassSummaryOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hasMarkedAsPaid, setHasMarkedAsPaid] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [attachedReceipt, setAttachedReceipt] = useState<{
    url: string;
    name: string;
    sizeKb?: number;
  } | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isDraggingReceipt, setIsDraggingReceipt] = useState(false);
  const [isViewingReceipt, setIsViewingReceipt] = useState(false);
  const [confirmedCart, setConfirmedCart] = useState<CartItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to completely reset checkout flow for placing another order
  const resetToNewOrder = (shouldClose = false) => {
    setCart([]);
    setConfirmedCart([]);
    setOrderRef('');
    setAttachedReceipt(null);
    setHasMarkedAsPaid(false);
    setReceiptError(null);
    setCheckoutStep('cart');
    if (shouldClose) {
      onClose();
      if (onNavigatePasses) {
        onNavigatePasses();
      }
    }
  };

  const handleCloseDrawer = () => {
    if (checkoutStep === 'confirmed') {
      setCheckoutStep('cart');
      setConfirmedCart([]);
      setOrderRef('');
      setAttachedReceipt(null);
      setHasMarkedAsPaid(false);
      setReceiptError(null);
    }
    onClose();
  };

  // When new passes are added to cart while previously on confirmed screen, auto-switch to cart
  useEffect(() => {
    if (cart.length > 0 && checkoutStep === 'confirmed') {
      setCheckoutStep('cart');
      setOrderRef('');
      setAttachedReceipt(null);
      setHasMarkedAsPaid(false);
      setReceiptError(null);
      setConfirmedCart([]);
    }
  }, [cart.length, checkoutStep]);

  // Initialize unique reservation reference when entering details step if not present
  useEffect(() => {
    if (checkoutStep === 'details' && !orderRef) {
      setOrderRef(`GCF-2027-${Math.floor(10000 + Math.random() * 90000)}`);
    }
  }, [checkoutStep, orderRef]);

  useEffect(() => {
    const handleConfigUpdate = () => {
      const cfg = getPaymentConfig();
      setPaymentConfig(cfg);
      if (!cfg.payNowEnabled && paymentTiming === 'now' && cfg.payOnArrivalEnabled) {
        setPaymentTiming('arrival');
      } else if (!cfg.payOnArrivalEnabled && paymentTiming === 'arrival' && cfg.payNowEnabled) {
        setPaymentTiming('now');
      }
    };
    window.addEventListener('payment_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('payment_config_updated', handleConfigUpdate);
  }, [paymentTiming]);

  const getCurrencyRate = (amountGBP: number) => {
    if (currency === 'USD') return Math.round(amountGBP * 1.28);
    if (currency === 'XCD') return Math.round(amountGBP * 3.45);
    return amountGBP;
  };

  const getCurrencySymbol = () => {
    if (currency === 'USD') return '$';
    if (currency === 'XCD') return 'EC$';
    return '£';
  };

  const handleFileUpload = async (file: File) => {
    setReceiptError(null);
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setReceiptError('File exceeds 15MB limit. Please upload a smaller screenshot or receipt.');
      return;
    }

    try {
      setIsUploadingReceipt(true);
      const compressed = await compressImageFile(file);
      setAttachedReceipt({
        url: compressed.dataUrl,
        name: compressed.name,
        sizeKb: compressed.sizeKb
      });
      setHasMarkedAsPaid(true);
      setReceiptError(null);
    } catch (err) {
      console.error('Failed to process receipt image:', err);
      setReceiptError('Unable to process this image. Please try another screenshot or image file.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingReceipt(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const updateQuantity = (passId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.pass.id === passId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const activeCart = cart.length > 0 ? cart : confirmedCart;
  const totalGBP = activeCart.reduce((acc, item) => acc + item.pass.priceGBP * item.quantity, 0);
  const totalConverted = getCurrencyRate(totalGBP);

  const copyToClipboard = (text: string, fieldId: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const getMethodDisplayName = () => {
    if (paymentTiming === 'arrival') return 'Pay on Arrival';
    switch (selectedMethod) {
      case 'paypal': return 'PayPal';
      case 'monzo': default: return 'Monzo Bank Transfer';
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReceiptError(null);

    // Validate payment requirements for Pay Now - proof of payment required for every payment option
    if (paymentTiming === 'now') {
      if (!attachedReceipt) {
        setReceiptError(`Proof of payment is required. Please upload your ${getMethodDisplayName()} payment receipt or screenshot before placing your order.`);
        return;
      }
    }

    setIsProcessing(true);
    setConfirmedCart([...cart]);

    const generatedRef = orderRef || `GCF-2027-${Math.floor(10000 + Math.random() * 90000)}`;
    setOrderRef(generatedRef);
    const passItemsSummary = cart.map(i => `${i.quantity}x ${i.pass.title}`).join(', ');
    const methodName = getMethodDisplayName();
    const timingLabel = paymentTiming === 'now' ? `Pay Now via ${methodName}` : 'Pay on Arrival';
    const statusLabel = paymentTiming === 'now' ? 'RECEIPT_SUBMITTED' : 'PAY_ON_ARRIVAL';
    const passDetailsText = `Wristband pass order placed. Payment Option: ${timingLabel}. Total: ${getCurrencySymbol()}${totalConverted} (£${totalGBP} GBP). Passes: ${cart.map(i => `${i.quantity}x ${i.pass.title} @ £${i.pass.priceGBP}`).join('; ')}${attachedReceipt ? ` [Payment Receipt Attached: ${attachedReceipt.name}]` : ''}`;

    // Save Pass Order in Admin Submissions store with full multi-method & Timing details
    addSubmission({
      type: 'pass-order',
      name: buyerName,
      email: buyerEmail,
      phone: buyerPhone,
      topicOrPass: `${passItemsSummary} [${timingLabel}]`,
      messageOrDetails: passDetailsText,
      amountGBP: totalGBP,
      receiptUrl: attachedReceipt?.url,
      receiptName: attachedReceipt?.name,
      receiptUploadedAt: attachedReceipt ? new Date().toISOString() : undefined,
      receiptStatus: attachedReceipt ? 'pending_verification' : undefined,
      status: 'in-review',
      extraDetails: {
        OrderRef: generatedRef,
        Currency: currency,
        TotalPaid: `${getCurrencySymbol()}${totalConverted}`,
        TotalGBP: `£${totalGBP}`,
        PurchasedItems: passItemsSummary,
        PaymentMethod: methodName,
        PaymentTiming: timingLabel,
        PaymentStatus: statusLabel,
        WristbandStatus: 'RESERVED_FOR_ARRIVAL',
        CollectionPoint: `${paymentConfig.arrivalDeskName} (${paymentConfig.arrivalDeskLocation})`,
        ReceiptAttached: attachedReceipt ? 'YES' : 'NO',
        ReceiptName: attachedReceipt?.name || 'N/A'
      }
    });

    setTimeout(() => {
      setIsProcessing(false);
      setCheckoutStep('confirmed');
      setCart([]);
    }, 600);
  };

      return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={handleCloseDrawer}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full sm:max-w-md bg-neutral-900 border-l border-amber-500/30 text-white h-full flex flex-col shadow-2xl relative z-10"
            >
        
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950 gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {checkoutStep === 'details' ? (
              <button
                type="button"
                onClick={() => setCheckoutStep('cart')}
                className="p-2 -ml-1 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 min-h-[40px]"
                title="Back to Cart & Remove/Edit Passes"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden xs:inline sm:inline">Back</span>
              </button>
            ) : checkoutStep === 'confirmed' ? (
              <button
                type="button"
                onClick={() => resetToNewOrder(true)}
                className="p-2 -ml-1 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-xs font-medium shrink-0 min-h-[40px]"
                title="Place Another Order"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden xs:inline sm:inline">Passes</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigatePasses) onNavigatePasses();
                }}
                className="p-2 -ml-1 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-xs font-medium shrink-0 min-h-[40px]"
                title="Back to Festival Passes"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden xs:inline sm:inline">Back</span>
              </button>
            )}
            <ShoppingBag className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="font-bold font-serif text-sm sm:text-lg text-white truncate">
              {checkoutStep === 'details' ? 'Buyer Details' : checkoutStep === 'confirmed' ? 'Pass Reserved' : 'Festival Cart'}
            </h3>
          </div>
          <button
            onClick={handleCloseDrawer}
            className="p-2 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl cursor-pointer transition-colors shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          {isProcessing && (
            <LuxurySkeletonOverlay type="modal" message="Reserving VIP Wristbands..." />
          )}

          {!isProcessing && checkoutStep === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <Ticket className="w-12 h-12 text-neutral-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-neutral-300 text-sm font-bold">Your cart is currently empty.</p>
                    <p className="text-neutral-500 text-xs max-w-xs mx-auto">
                      Select your 10-day VIP pass, White Gala ticket, or Mellowland Tubing pass from the Passes &amp; VIP page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onNavigatePasses) onNavigatePasses();
                    }}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2 uppercase tracking-wider"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Browse Festival Passes</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Informational banner with clear removal guidance */}
                  <div className="flex items-center justify-between text-xs text-neutral-400 pb-1">
                    <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} pass(es) in cart</span>
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      className="text-neutral-500 hover:text-rose-400 text-[11px] font-semibold cursor-pointer transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  {cart.map((item) => (
                    <div
                      key={item.pass.id}
                      className="bg-neutral-800/90 border border-neutral-700/80 rounded-2xl p-4 flex flex-col gap-3 shadow-md"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-white leading-tight">{item.pass.title}</h4>
                          <span className="text-xs text-amber-400 block pt-0.5">{item.pass.wristbandType}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.pass.id, -item.quantity)}
                          className="px-2.5 py-1 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                          title="Remove this pass from cart"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-700/60">
                        <div className="flex items-center gap-2 bg-neutral-900 px-2.5 py-1 rounded-xl border border-neutral-700">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.pass.id, -1)}
                            className="font-bold text-neutral-400 hover:text-white px-1 cursor-pointer"
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-white px-2">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.pass.id, 1)}
                            className="font-bold text-neutral-400 hover:text-white px-1 cursor-pointer"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-extrabold text-amber-300 text-sm font-mono">
                          {getCurrencySymbol()}{getCurrencyRate(item.pass.priceGBP * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!isProcessing && checkoutStep === 'details' && (
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="p-3 bg-neutral-800/80 border border-amber-500/20 rounded-xl flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="inline-flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer transition-colors bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Passes
                </button>
                <span className="text-xs font-mono font-bold text-amber-400">
                  Total: {getCurrencySymbol()}{totalConverted}
                </span>
              </div>

              {/* Payment Option & Method Selection */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    Wristband Payment Option
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {paymentTiming === 'now' ? getMethodDisplayName() : 'Pay on Arrival'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-tight">
                  Choose whether to purchase your wristband online today or settle upon arrival at Maurice Bishop Airport or your hotel concierge.
                </p>

                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {/* Option 1: Pay Now */}
                  {paymentConfig.payNowEnabled && (
                    <div 
                      onClick={() => setPaymentTiming('now')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer block relative ${
                        paymentTiming === 'now' 
                          ? 'bg-gradient-to-br from-neutral-800 via-neutral-900 to-amber-950/20 border-amber-500/70 shadow-lg shadow-amber-500/10' 
                          : 'bg-neutral-800/60 border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          paymentTiming === 'now' ? 'border-amber-400 bg-amber-500' : 'border-neutral-600'
                        }`}>
                          {paymentTiming === 'now' && <span className="w-1.5 h-1.5 rounded-full bg-neutral-950" />}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              Pay Online Now
                            </span>
                            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              Instant VIP Allocation
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                            Complete payment via PayPal or Monzo bank transfer. Express VIP wristband pack ready for fast-track collection in Grenada.
                          </p>

                          {/* Method Selector Chips */}
                          {paymentTiming === 'now' && (
                            <div className="pt-2.5 mt-2 border-t border-neutral-700/80 space-y-2">
                              <span className="text-[10px] font-mono uppercase text-neutral-400 font-semibold block">
                                Select Payment Method:
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {paymentConfig.paypalEnabled !== false && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMethod('paypal');
                                      setReceiptError(null);
                                    }}
                                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                      selectedMethod === 'paypal'
                                        ? 'bg-sky-950/40 border-sky-400 text-white shadow-sm'
                                        : 'bg-neutral-900/80 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600'
                                    }`}
                                  >
                                    <span className="font-bold text-xs text-sky-400">PayPal</span>
                                    <span className="text-[10px] font-medium leading-none">Instant Pay</span>
                                  </button>
                                )}

                                {paymentConfig.monzoEnabled !== false && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMethod('monzo');
                                      setReceiptError(null);
                                    }}
                                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                      selectedMethod === 'monzo'
                                        ? 'bg-rose-950/40 border-rose-400 text-white shadow-sm'
                                        : 'bg-neutral-900/80 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600'
                                    }`}
                                  >
                                    <span className="font-bold text-xs text-rose-400">monzo</span>
                                    <span className="text-[10px] font-medium leading-none">Bank Transfer</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option 2: Pay on Arrival */}
                  {paymentConfig.payOnArrivalEnabled && (
                    <label 
                      onClick={() => setPaymentTiming('arrival')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer block relative ${
                        paymentTiming === 'arrival' 
                          ? 'bg-gradient-to-br from-neutral-800 via-neutral-900 to-amber-950/30 border-amber-500/70 shadow-lg shadow-amber-500/10' 
                          : 'bg-neutral-800/60 border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          paymentTiming === 'arrival' ? 'border-amber-400 bg-amber-500' : 'border-neutral-600'
                        }`}>
                          {paymentTiming === 'arrival' && <span className="w-1.5 h-1.5 rounded-full bg-neutral-950" />}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              Pay on Arrival
                            </span>
                            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              £0 Due Today
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                            Reserve your wristbands now with £0 upfront. Settle via PayPal, Monzo contactless or cash upon touchdown in Grenada.
                          </p>

                          {paymentTiming === 'arrival' && (
                            <div className="pt-2 mt-1 border-t border-amber-500/20 text-[10px] font-mono text-neutral-300 space-y-0.5">
                              <p className="text-amber-300 font-bold">• Collection Desk: {paymentConfig.arrivalDeskName}</p>
                              <p className="text-neutral-400">• Total due on arrival: {getCurrencySymbol()}{totalConverted} ({currency})</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider">
                  Buyer Contact Details
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Your details are required to tag and register your official festival wristband.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">WhatsApp / Phone Number</label>
                <input
                  type="tel"
                  required
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="+44 7900 123456"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Payment Execution & Receipt Upload Card when Pay Now is selected */}
              {paymentTiming === 'now' && (
                <div className="p-4 bg-gradient-to-b from-neutral-800/90 to-neutral-900 border border-neutral-700/80 rounded-2xl space-y-3.5 shadow-xl">
                  {/* Method Header */}
                  <div className="flex items-center justify-between border-b border-neutral-700/60 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        selectedMethod === 'paypal'
                          ? 'bg-sky-600/20 text-sky-400 border border-sky-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}>
                        {selectedMethod === 'paypal' ? 'PP' : 'M'}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider block">
                          STEP 1: {selectedMethod === 'paypal' ? 'TRANSFER VIA PAYPAL' : 'TRANSFER VIA MONZO'}
                        </span>
                        <span className="text-xs font-bold text-white">
                          Amount Due: £{totalGBP} GBP ({getCurrencySymbol()}{totalConverted} {currency})
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Pay Online Now
                    </span>
                  </div>

                  {/* PayPal Form & Link */}
                  {selectedMethod === 'paypal' && (
                    <div className="space-y-3">
                      <div className="bg-neutral-950/90 border border-sky-500/30 rounded-xl p-3.5 space-y-2.5 text-xs font-mono">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                          <span className="text-neutral-400 text-[11px]">PayPal Account:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sky-300 font-bold">{paymentConfig.paypalEmail || 'payments@mellowsentertainment.com'}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentConfig.paypalEmail || 'payments@mellowsentertainment.com', 'paypal_email')}
                              className="text-neutral-400 hover:text-white"
                              title="Copy PayPal Email"
                            >
                              {copiedField === 'paypal_email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                          <span className="text-neutral-400 text-[11px]">Payment Reference:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-300 font-black">{orderRef}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(orderRef, 'paypal_ref')}
                              className="text-neutral-400 hover:text-white"
                              title="Copy Reference"
                            >
                              {copiedField === 'paypal_ref' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-neutral-400 text-[11px]">Total Due:</span>
                          <span className="text-white font-bold">£{totalGBP} GBP ({getCurrencySymbol()}{totalConverted} {currency})</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <a
                          href={getPayPalMeUrl(paymentConfig.paypalMeSlug || 'mellowsent', totalGBP, currency, orderRef)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all text-center"
                        >
                          <span>Open PayPal Checkout</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(`PayPal: ${paymentConfig.paypalEmail || 'payments@mellowsentertainment.com'}\nReference: ${orderRef}\nAmount: £${totalGBP} GBP`, 'paypal_all')}
                          className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-neutral-700 transition-all cursor-pointer"
                        >
                          {copiedField === 'paypal_all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'paypal_all' ? 'Copied Details!' : 'Copy PayPal Info'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Monzo Transfer Form & Link */}
                  {selectedMethod === 'monzo' && (
                    <div className="space-y-3">
                      {/* Bank credentials */}
                      <div className="bg-neutral-950/90 border border-neutral-700/80 rounded-xl p-3 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                          <span className="text-neutral-400 text-[11px]">Bank:</span>
                          <span className="text-white font-bold">{paymentConfig.bankName}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                          <span className="text-neutral-400 text-[11px]">Account Name:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-bold">{paymentConfig.accountName}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentConfig.accountName, 'form_name')}
                              className="text-neutral-400 hover:text-white"
                              title="Copy Account Name"
                            >
                              {copiedField === 'form_name' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                          <span className="text-neutral-400 text-[11px]">Sort Code:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-300 font-bold">{paymentConfig.sortCode}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentConfig.sortCode, 'form_sort')}
                              className="text-neutral-400 hover:text-white"
                              title="Copy Sort Code"
                            >
                              {copiedField === 'form_sort' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                          <span className="text-neutral-400 text-[11px]">Account Number:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-300 font-bold">{paymentConfig.accountNumber}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentConfig.accountNumber, 'form_acc')}
                              className="text-neutral-400 hover:text-white"
                              title="Copy Account Number"
                            >
                              {copiedField === 'form_acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-rose-400 text-[11px] font-bold">Payment Reference:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-rose-300 font-black">{orderRef}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(orderRef, 'form_ref')}
                              className="text-neutral-400 hover:text-white"
                              title="Copy Reference"
                            >
                              {copiedField === 'form_ref' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <a
                          href={getMonzoMeUrl(paymentConfig.monzoMeSlug, totalGBP, orderRef)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all text-center"
                        >
                          <span>Open Monzo Pay Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(`Bank: ${paymentConfig.bankName}\nName: ${paymentConfig.accountName}\nSort Code: ${paymentConfig.sortCode}\nAccount: ${paymentConfig.accountNumber}\nReference: ${orderRef}\nAmount: £${totalGBP} GBP`, 'form_all')}
                          className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-neutral-700 transition-all cursor-pointer"
                        >
                          {copiedField === 'form_all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'form_all' ? 'Copied Details!' : 'Copy Bank Info'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: RECEIPT / TRANSACTION PROOF UPLOAD */}
                  <div className="pt-2 border-t border-neutral-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          STEP 2: UPLOAD PAYMENT RECEIPT
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border bg-rose-500/20 text-rose-300 border-rose-500/30">
                        Required
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-300 leading-tight">
                      Please upload a screenshot or receipt of your {getMethodDisplayName()} payment. Proof of payment is required for every payment option to confirm your order.
                    </p>

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/webp,image/jpg,application/pdf"
                      className="hidden"
                    />

                    {/* Error display if user attempted submit without receipt */}
                    {receiptError && (
                      <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <strong className="font-bold text-rose-300 block">Payment Verification Required:</strong>
                          <span>{receiptError}</span>
                        </div>
                      </div>
                    )}

                    {attachedReceipt ? (
                      <div className="p-3 bg-neutral-950/90 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {attachedReceipt.url.startsWith('data:image') ? (
                            <img
                              src={attachedReceipt.url}
                              alt="Receipt Proof"
                              className="w-12 h-12 object-cover rounded-lg border border-emerald-500/40 shrink-0 cursor-pointer shadow-sm hover:opacity-90"
                              onClick={() => setIsViewingReceipt(true)}
                              title="Click to view full receipt"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0">
                              <FileText className="w-6 h-6 text-emerald-400" />
                            </div>
                          )}
                          <div className="truncate text-xs">
                            <span className="text-white font-bold block truncate">{attachedReceipt.name}</span>
                            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              {attachedReceipt.sizeKb ? `${attachedReceipt.sizeKb} KB • ` : ''}Receipt Attached
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsViewingReceipt(true)}
                            className="p-1.5 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-xs flex items-center gap-1 font-semibold cursor-pointer"
                            title="View full receipt"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2 py-1 text-[11px] text-amber-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg font-semibold cursor-pointer"
                            title="Replace file"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAttachedReceipt(null);
                              setHasMarkedAsPaid(false);
                            }}
                            className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs cursor-pointer"
                            title="Remove receipt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingReceipt(true);
                        }}
                        onDragLeave={() => setIsDraggingReceipt(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                          isDraggingReceipt
                            ? 'border-amber-400 bg-amber-500/15'
                            : receiptError
                            ? 'border-rose-500 bg-rose-950/20 hover:bg-rose-950/30'
                            : 'border-neutral-700 hover:border-amber-400 bg-neutral-950/60 hover:bg-neutral-950/90'
                        }`}
                      >
                        {isUploadingReceipt ? (
                          <div className="py-2 flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-neutral-300">Processing receipt...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-white mb-0.5">
                              Click or drag &amp; drop your payment screenshot / slip
                            </p>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              Supports JPG, PNG, WEBP, PDF (Max 15MB)
                            </p>
                            <span className="mt-2.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-amber-300 text-xs font-bold rounded-lg transition-colors">
                              Select Receipt File
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold text-xs rounded-xl transition-all border border-neutral-700 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className={`flex-1 min-h-[48px] py-2.5 px-3 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 text-center leading-tight whitespace-normal ${
                    paymentTiming === 'now'
                      ? attachedReceipt
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20'
                      : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20'
                  }`}
                >
                  {paymentTiming === 'now' ? (
                    attachedReceipt ? (
                      <>
                        <Check className="w-4 h-4 shrink-0" />
                        <span>Place Order with {getMethodDisplayName()} ({getCurrencySymbol()}{totalConverted})</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 shrink-0" />
                        <span>Upload Proof &amp; Place Order ({getCurrencySymbol()}{totalConverted})</span>
                      </>
                    )
                  ) : (
                    <>
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Reserve &amp; Pay on Arrival ({getCurrencySymbol()}{totalConverted})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {!isProcessing && checkoutStep === 'confirmed' && (
            <div className="py-4 space-y-4">
              <div className="text-center space-y-2">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto border ${
                  paymentTiming === 'now'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-400/40'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40'
                }`}>
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold font-serif text-white">
                  {paymentTiming === 'now' ? 'Order Placed!' : 'Wristbands Reserved for Arrival!'}
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed max-w-sm mx-auto">
                  Thank you, <strong className="text-amber-300">{buyerName || 'Valued Guest'}</strong>! Your booking reference is:
                </p>
                <div className="inline-flex items-center gap-2 bg-neutral-800 border border-amber-500/40 px-3 py-1.5 rounded-xl font-mono text-amber-300 text-sm font-bold shadow-md">
                  <span>{orderRef}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(orderRef, 'orderRef')}
                    className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy Reference"
                  >
                    {copiedField === 'orderRef' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Dedicated Payment Instructions / Arrival Voucher Card */}
              {paymentTiming === 'now' ? (
                <div className="bg-gradient-to-b from-neutral-800/90 to-neutral-900 border border-neutral-700/80 rounded-2xl p-4 space-y-3 shadow-xl">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-neutral-700/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        selectedMethod === 'paypal'
                          ? 'bg-sky-600/20 text-sky-400 border border-sky-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}>
                        {selectedMethod === 'paypal' ? 'PP' : 'M'}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider block">
                          {selectedMethod === 'paypal' ? 'PAYPAL PAYMENT DETAILS' : 'MONZO PAYMENT DETAILS'}
                        </span>
                        <span className="text-xs font-bold text-white">
                          Amount: £{totalGBP} GBP ({getCurrencySymbol()}{totalConverted} {currency})
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Pay Online
                    </span>
                  </div>

                  {/* PayPal Confirmed Details */}
                  {selectedMethod === 'paypal' && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] text-neutral-300 leading-tight font-sans">
                        Please ensure your transfer of £{totalGBP} GBP has been sent to PayPal account below with your reference:
                      </p>
                      <div className="bg-neutral-950/80 border border-neutral-700/80 rounded-xl p-3 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                          <span className="text-neutral-400 text-[11px]">PayPal:</span>
                          <span className="text-sky-300 font-bold">{paymentConfig.paypalEmail || 'payments@mellowsentertainment.com'}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                          <span className="text-neutral-400 text-[11px]">Reference:</span>
                          <span className="text-amber-300 font-black">{orderRef}</span>
                        </div>
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-neutral-400 text-[11px]">Amount:</span>
                          <span className="text-white font-bold">£{totalGBP} GBP</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <a
                          href={getPayPalMeUrl(paymentConfig.paypalMeSlug || 'mellowsent', totalGBP, currency, orderRef)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all text-center"
                        >
                          <span>Open PayPal Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`PayPal: ${paymentConfig.paypalEmail || 'payments@mellowsentertainment.com'}\nReference: ${orderRef}\nAmount: £${totalGBP} GBP`, 'all')}
                          className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-neutral-700 transition-all cursor-pointer"
                        >
                          {copiedField === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'all' ? 'Copied Details!' : 'Copy PayPal Info'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Monzo Confirmed Details */}
                  {selectedMethod === 'monzo' && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] text-neutral-300 leading-tight font-sans">
                        Please transfer the total amount using your <strong>Monzo App</strong> or UK Faster Payments with the reference below:
                      </p>

                      <div className="bg-neutral-950/80 border border-neutral-700/80 rounded-xl p-3 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                          <span className="text-neutral-400 text-[11px]">Bank:</span>
                          <span className="text-white font-bold">{paymentConfig.bankName}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                          <span className="text-neutral-400 text-[11px]">Account Name:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-bold">{paymentConfig.accountName}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentConfig.accountName, 'name')}
                              className="text-neutral-400 hover:text-white"
                            >
                              {copiedField === 'name' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                          <span className="text-neutral-400 text-[11px]">Sort Code:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-300 font-bold">{paymentConfig.sortCode}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentConfig.sortCode, 'sort')}
                              className="text-neutral-400 hover:text-white"
                            >
                              {copiedField === 'sort' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                          <span className="text-neutral-400 text-[11px]">Account Number:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-300 font-bold">{paymentConfig.accountNumber}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentConfig.accountNumber, 'acc')}
                              className="text-neutral-400 hover:text-white"
                            >
                              {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-rose-400 text-[11px] font-bold">Payment Reference:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-rose-300 font-black">{orderRef}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(orderRef, 'ref')}
                              className="text-neutral-400 hover:text-white"
                            >
                              {copiedField === 'ref' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <a
                          href={getMonzoMeUrl(paymentConfig.monzoMeSlug, totalGBP, orderRef)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all text-center"
                        >
                          <span>Open Monzo Pay Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(`Bank: ${paymentConfig.bankName}\nName: ${paymentConfig.accountName}\nSort Code: ${paymentConfig.sortCode}\nAccount: ${paymentConfig.accountNumber}\nReference: ${orderRef}\nAmount: £${totalGBP} GBP`, 'all')}
                          className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-neutral-700 transition-all cursor-pointer"
                        >
                          {copiedField === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'all' ? 'Copied Details!' : 'Copy Bank Info'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment Mark Confirmation & Receipt Action */}
                  <div className="space-y-2 pt-1 border-t border-neutral-800">
                    {hasMarkedAsPaid ? (
                      <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Transfer recorded for ref <strong>{orderRef}</strong>.</span>
                        </div>
                        {attachedReceipt && (
                          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold shrink-0">
                            Receipt Attached
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setHasMarkedAsPaid(true)}
                        className="w-full py-2 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>I have completed my {getMethodDisplayName()} payment</span>
                      </button>
                    )}

                    {/* Receipt Upload Card */}
                    <div className="p-3 bg-neutral-950/90 border border-amber-500/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Payment Receipt / Screenshot
                          </span>
                        </div>
                        {attachedReceipt ? (
                          <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Attached
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full">
                            Required
                          </span>
                        )}
                      </div>

                      {attachedReceipt ? (
                        <div className="p-2.5 bg-neutral-900/90 border border-neutral-700/80 rounded-lg flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {attachedReceipt.url.startsWith('data:image') ? (
                              <img
                                src={attachedReceipt.url}
                                alt="Receipt"
                                className="w-10 h-10 object-cover rounded-md border border-neutral-700 shrink-0 cursor-pointer"
                                onClick={() => setIsViewingReceipt(true)}
                                title="Click to enlarge"
                              />
                            ) : (
                              <FileText className="w-7 h-7 text-amber-400 shrink-0" />
                            )}
                            <div className="truncate text-xs">
                              <span className="text-white font-medium block truncate">{attachedReceipt.name}</span>
                              <span className="text-[10px] text-emerald-400 font-mono">Proof logged for concierge review</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setIsViewingReceipt(true)}
                              className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg text-xs flex items-center gap-1 font-semibold cursor-pointer"
                              title="View full receipt"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsReceiptModalOpen(true)}
                              className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold px-1 cursor-pointer"
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[11px] text-neutral-300 leading-snug">
                            Upload a screenshot or transaction receipt of your payment to expedite your wristband pass verification.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsReceiptModalOpen(true)}
                            className="w-full py-2 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                          >
                            <UploadCloud className="w-4 h-4 text-amber-400" />
                            <span>Send Receipt or Screenshot of Payment</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-b from-neutral-800/90 to-neutral-900 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider block">
                          WRISTBAND RESERVATION VOUCHER
                        </span>
                        <span className="text-xs font-bold text-white">
                          Pay on Arrival: {getCurrencySymbol()}{totalConverted}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Reserved
                    </span>
                  </div>

                  <div className="bg-neutral-950/80 border border-neutral-700/80 rounded-xl p-3 space-y-2 text-xs font-mono">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-white font-bold block">Collection &amp; Payment Desk:</span>
                        <span className="text-neutral-400 text-[11px] block">
                          {paymentConfig.arrivalDeskName} ({paymentConfig.arrivalDeskLocation})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-neutral-800 pt-2">
                      <span className="text-neutral-400 text-[11px]">Payment Option:</span>
                      <span className="text-amber-300 font-bold">Pay on Arrival in Grenada</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-neutral-800 pt-1.5">
                      <span className="text-neutral-400 text-[11px]">Amount Due on Arrival:</span>
                      <span className="text-amber-300 font-black text-sm">{getCurrencySymbol()}{totalConverted}</span>
                    </div>

                    {paymentConfig.supportPhone && (
                      <div className="flex items-center justify-between border-t border-neutral-800 pt-1.5 text-[10px]">
                        <span className="text-neutral-500">Concierge Helpline:</span>
                        <span className="text-amber-400 font-mono">{paymentConfig.supportPhone}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-300 leading-tight font-sans">
                    {paymentConfig.wristbandCollectionNotes || `Present your reservation reference ${orderRef} at the festival desk upon touchdown in Grenada to settle payment and receive your RFID wristband.`}
                  </p>
                </div>
              )}

              {/* Next Steps Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => resetToNewOrder(true)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-neutral-950" />
                  <span>Place Another Order / Book More Passes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPassSummaryOpen(true)}
                  className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>View Pass Summary{paymentConfig.allowPassVoucherDownloadBeforePayment !== false ? (selectedMethod === 'paypal' ? ' & PayPal Voucher' : ' & Monzo Voucher') : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCloseDrawer();
                    onNavigateRegister();
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>Submit Flight Details (for Airport Handover)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Totals */}
        {cart.length > 0 && checkoutStep === 'cart' && (
          <div className="p-5 border-t border-neutral-800 bg-neutral-950 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Total ({currency}):</span>
              <span className="text-xl font-extrabold font-mono text-amber-400">
                {getCurrencySymbol()}{totalConverted}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsPassSummaryOpen(true);
                }}
                className="py-3 px-3 bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/30 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="Preview / Print Pass Summary"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Pass Summary</span>
              </button>

              <button
                onClick={() => setCheckoutStep('details')}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                Proceed to Payment
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
    )}
    </AnimatePresence>

      {/* Pass Summary Modal */}
      <PassSummaryModal
        isOpen={isPassSummaryOpen}
        onClose={() => setIsPassSummaryOpen(false)}
        buyerName={buyerName}
        buyerEmail={buyerEmail}
        buyerPhone={buyerPhone}
        reservationRef={orderRef || 'GCF-2027-PENDING'}
        cart={activeCart}
        currencySymbol={getCurrencySymbol()}
        currency={currency}
        totalConverted={totalConverted.toString()}
        isConfirmed={checkoutStep === 'confirmed'}
        paymentTiming={paymentTiming}
        paymentMethod={selectedMethod}
      />

      {/* Payment Receipt / Screenshot Upload Modal */}
      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        defaultOrderRef={orderRef}
        defaultEmail={buyerEmail}
        defaultName={buyerName}
        onReceiptSubmitted={(updatedSub) => {
          if (updatedSub.receiptUrl) {
            setAttachedReceipt({
              url: updatedSub.receiptUrl,
              name: updatedSub.receiptName || 'payment_receipt.jpg'
            });
            setHasMarkedAsPaid(true);
          }
        }}
      />

      {/* Receipt Lightbox Viewer */}
      {attachedReceipt && (
        <ReceiptLightboxModal
          isOpen={isViewingReceipt}
          onClose={() => setIsViewingReceipt(false)}
          receiptUrl={attachedReceipt.url}
          receiptName={attachedReceipt.name}
          orderRef={orderRef}
          guestName={buyerName}
        />
      )}
    </>
  );
};
