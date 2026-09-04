import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, ShoppingBag, Trash2, CheckCircle2, Ticket, ArrowRight, ArrowLeft, Shield, Plane, Download, FileText } from 'lucide-react';
import { LuxurySkeletonOverlay } from './LuxurySkeletonOverlay';
import { PassSummaryModal } from './PassSummaryModal';
import { AnimatePresence, motion } from 'motion/react';
import { addSubmission } from '../services/submissionService';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  currency: 'GBP' | 'USD' | 'XCD';
  onNavigateRegister: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  setCart,
  currency,
  onNavigateRegister
}) => {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details' | 'confirmed'>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPassSummaryOpen, setIsPassSummaryOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [orderRef, setOrderRef] = useState('');

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

  const totalGBP = cart.reduce((acc, item) => acc + item.pass.priceGBP * item.quantity, 0);
  const totalConverted = getCurrencyRate(totalGBP);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const generatedRef = `GCF-2027-${Math.floor(10000 + Math.random() * 90000)}`;
    setOrderRef(generatedRef);
    const passItemsSummary = cart.map(i => `${i.quantity}x ${i.pass.title}`).join(', ');
    const passDetailsText = `Pass order reserved in ${currency}. Total: ${getCurrencySymbol()}${totalConverted} (£${totalGBP} GBP). Purchased: ${cart.map(i => `${i.quantity}x ${i.pass.title} @ £${i.pass.priceGBP}`).join('; ')}`;

    // Save Pass Order in Admin Submissions store
    addSubmission({
      type: 'pass-order',
      name: buyerName,
      email: buyerEmail,
      phone: buyerPhone,
      topicOrPass: passItemsSummary,
      messageOrDetails: passDetailsText,
      amountGBP: totalGBP,
      extraDetails: {
        OrderRef: generatedRef,
        Currency: currency,
        TotalPaid: `${getCurrencySymbol()}${totalConverted}`,
        PurchasedItems: passItemsSummary,
        PaymentStatus: 'CONFIRMED'
      }
    });

    setTimeout(() => {
      setIsProcessing(false);
      setCheckoutStep('confirmed');
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
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-neutral-900 border-l border-amber-500/30 text-white h-full flex flex-col shadow-2xl relative z-10"
            >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2">
            {checkoutStep === 'details' ? (
              <button
                type="button"
                onClick={() => setCheckoutStep('cart')}
                className="p-1.5 -ml-1 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold"
                title="Back to Cart & Remove/Edit Passes"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Back to Cart</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -ml-1 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-xs font-medium"
                title="Back to Festival Passes"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold font-serif text-base sm:text-lg text-white truncate">
              {checkoutStep === 'details' ? 'Buyer Information' : checkoutStep === 'confirmed' ? 'Pass Reserved' : 'Your Festival Cart'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl cursor-pointer transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
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
                      Select your 10-day VIP pass, White Gala ticket, or Mellowland Tubing pass from the Shop tab.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
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

                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Wristbands will be issued upon arrival in Grenada at your hotel or Mellowland reception.
                    </span>
                  </div>
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
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit / Remove Passes
                </button>
                <span className="text-xs font-mono font-bold text-amber-400">
                  Total: {getCurrencySymbol()}{totalConverted}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-amber-400 uppercase tracking-wider">
                  Buyer Contact Details
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Please provide your contact information to reserve your event wristbands.
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

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold text-xs rounded-xl transition-all border border-neutral-700 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                  <span>Back to Cart</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer truncate"
                >
                  Confirm &amp; Reserve Wristbands
                </button>
              </div>
            </form>
          )}

          {!isProcessing && checkoutStep === 'confirmed' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-400/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold font-serif text-white">Pass Reserved Successfully!</h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Thank you, <strong className="text-amber-300">{buyerName || 'Valued Guest'}</strong>! Your festival pass reservation reference is <span className="font-mono text-amber-400 font-bold">{orderRef}</span>.
              </p>

              <div className="bg-neutral-800 p-4 rounded-2xl text-left border border-neutral-700 space-y-2 text-xs">
                <p className="font-bold text-amber-400">Next Steps for Smooth Arrival:</p>
                <p className="text-neutral-300">
                  Submit your flight arrival details now so our Mellows Entertainment transport representatives can greet you at Grenada Airport and issue your wristbands.
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsPassSummaryOpen(true);
                    }}
                    className="py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Pass Summary</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onNavigateRegister();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Plane className="w-4 h-4" />
                  Submit Flight Details Now
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
                Proceed
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
        cart={cart}
        currencySymbol={getCurrencySymbol()}
        currency={currency}
        totalConverted={totalConverted.toString()}
        isConfirmed={checkoutStep === 'confirmed'}
      />
    </>
  );
};
