import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Building2, 
  MapPin, 
  PhoneCall, 
  Mail, 
  ExternalLink, 
  Copy, 
  Check, 
  RotateCcw, 
  Save, 
  ShieldCheck, 
  Sliders, 
  Eye, 
  AlertCircle,
  HelpCircle,
  QrCode,
  Ticket,
  Calendar,
  Camera,
  UploadCloud,
  FileText,
  Filter,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  XCircle
} from 'lucide-react';
import { FormSubmissionItem } from '../types';
import { 
  getPaymentConfig, 
  savePaymentConfig, 
  resetPaymentConfig, 
  PaymentConfig 
} from '../services/paymentConfigService';
import { verifyPaymentReceipt, attachPaymentReceipt, deletePaymentReceipt } from '../services/submissionService';
import { ReceiptLightboxModal } from './PaymentReceiptModal';

interface AdminPaymentsTabProps {
  primaryColor?: string;
  submissions: FormSubmissionItem[];
  onToast: (msg: string) => void;
  triggerConfirm: (title: string, message: string, action: () => void) => void;
  onNavigateToOrders?: (filterTiming?: string) => void;
}

export const AdminPaymentsTab: React.FC<AdminPaymentsTabProps> = ({
  primaryColor = '#F59E0B',
  submissions,
  onToast,
  triggerConfirm,
  onNavigateToOrders
}) => {
  const [config, setConfig] = useState<PaymentConfig>(getPaymentConfig);
  const [isDirty, setIsDirty] = useState(false);
  const [activeSubSection, setActiveSubSection] = useState<'banking' | 'workflows' | 'arrival' | 'receipts'>('banking');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<{
    url: string;
    name?: string;
    orderRef?: string;
    guestName?: string;
  } | null>(null);
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);

  // Collapsible state for Payment Gateways & Banking
  const [openBankingMethods, setOpenBankingMethods] = useState<Record<string, boolean>>({
    monzo: true,
    paypal: false,
  });

  const toggleBankingMethod = (key: string) => {
    setOpenBankingMethods(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const expandAllBanking = () => {
    setOpenBankingMethods({
      monzo: true,
      paypal: true,
    });
  };

  const collapseAllBanking = () => {
    setOpenBankingMethods({
      monzo: false,
      paypal: false,
    });
  };

  useEffect(() => {
    const handleConfigUpdate = () => {
      setConfig(getPaymentConfig());
      setIsDirty(false);
    };
    window.addEventListener('payment_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('payment_config_updated', handleConfigUpdate);
  }, []);

  const handleChange = <K extends keyof PaymentConfig>(field: K, value: PaymentConfig[K]) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    // Basic validation
    if (!config.accountName.trim()) {
      onToast('Error: Beneficiary account name cannot be empty.');
      return;
    }
    if (!config.sortCode.trim()) {
      onToast('Error: Sort code cannot be empty.');
      return;
    }
    if (!config.accountNumber.trim()) {
      onToast('Error: Account number cannot be empty.');
      return;
    }
    if (!config.payNowEnabled && !config.payOnArrivalEnabled) {
      onToast('Error: At least one payment option (Pay Now or Pay on Arrival) must be enabled.');
      return;
    }

    savePaymentConfig(config, 'Admin Console');
    setIsDirty(false);
    onToast('Payment gateway and Monzo configuration saved successfully!');
  };

  const handleReset = () => {
    triggerConfirm(
      'Reset Payment Configuration',
      'Are you sure you want to reset all Monzo banking credentials, arrival desk info, and payment workflows to festival factory defaults?',
      () => {
        const reset = resetPaymentConfig('Admin Console');
        setConfig(reset);
        setIsDirty(false);
        onToast('Payment configuration restored to default settings.');
      }
    );
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    onToast(`Copied ${fieldKey} to clipboard`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Compute metrics from pass-order submissions
  const passOrders = useMemo(() => {
    return submissions.filter(s => s.type === 'pass-order');
  }, [submissions]);

  const metrics = useMemo(() => {
    let totalVolumeGBP = 0;
    let payNowOrdersCount = 0;
    let payOnArrivalOrdersCount = 0;
    let paidOrdersCount = 0;
    let pendingOrdersCount = 0;
    let receiptsCount = 0;
    let pendingReceiptsCount = 0;
    let verifiedReceiptsCount = 0;

    passOrders.forEach(o => {
      const amount = o.amountGBP || 0;
      totalVolumeGBP += amount;

      const timing = o.extraDetails?.PaymentTiming || '';
      const status = o.extraDetails?.PaymentStatus || '';

      if (timing.toLowerCase().includes('now') || !timing.toLowerCase().includes('arrival')) {
        payNowOrdersCount++;
      } else {
        payOnArrivalOrdersCount++;
      }

      if (status === 'PAID' || o.status === 'resolved') {
        paidOrdersCount++;
      } else {
        pendingOrdersCount++;
      }

      if (o.receiptUrl) {
        receiptsCount++;
        if (o.receiptStatus === 'verified') {
          verifiedReceiptsCount++;
        } else {
          pendingReceiptsCount++;
        }
      }
    });

    return {
      totalOrders: passOrders.length,
      totalVolumeGBP,
      payNowOrdersCount,
      payOnArrivalOrdersCount,
      paidOrdersCount,
      pendingOrdersCount,
      receiptsCount,
      pendingReceiptsCount,
      verifiedReceiptsCount
    };
  }, [passOrders]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & Action Header */}
      <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-widest flex items-center gap-1.5">
                <CreditCard className="w-3 h-3 text-amber-400" /> Monzo Bank UK Integration
              </span>
              {config.monzoEnabled ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Gateway
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Gateway Paused
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white font-serif tracking-tight">
              Payment Gateway &amp; Monzo Banking
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 max-w-2xl leading-relaxed">
              Configure beneficiary bank credentials, Monzo.me handles, arrival pickup desks, and checkout workflows for festival wristbands.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-300 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Reset all payment settings to default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-400" /> Reset Defaults
            </button>
            <button
              onClick={handleSave}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                isDirty 
                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 ring-2 ring-amber-400/50 shadow-amber-500/20 animate-pulse' 
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              <Save className="w-4 h-4" /> {isDirty ? 'Save Changes *' : 'Saved'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Sub-Navigation Bar */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 border-b border-neutral-800 pb-1.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
          <button
            type="button"
            onClick={() => setActiveSubSection('banking')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeSubSection === 'banking'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
            style={activeSubSection === 'banking' ? { borderBottom: `2px solid ${primaryColor}` } : undefined}
          >
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Gateways &amp; Banking</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection('workflows')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeSubSection === 'workflows'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
            style={activeSubSection === 'workflows' ? { borderBottom: `2px solid ${primaryColor}` } : undefined}
          >
            <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Methods &amp; Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection('arrival')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeSubSection === 'arrival'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
            style={activeSubSection === 'arrival' ? { borderBottom: `2px solid ${primaryColor}` } : undefined}
          >
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Arrival &amp; Concierge</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection('receipts')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeSubSection === 'receipts'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
            style={activeSubSection === 'receipts' ? { borderBottom: `2px solid ${primaryColor}` } : undefined}
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Payment Receipts</span>
            {metrics.pendingReceiptsCount > 0 ? (
              <span 
                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-neutral-950 font-mono leading-none"
                title={`${metrics.pendingReceiptsCount} pending verification`}
              >
                {metrics.pendingReceiptsCount}
              </span>
            ) : metrics.receiptsCount > 0 ? (
              <span 
                className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-neutral-900 text-neutral-300 border border-neutral-750 leading-none"
                title={`${metrics.receiptsCount} total receipts`}
              >
                {metrics.receiptsCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* SECTION 1: PAYMENT GATEWAYS & BANKING (COLLAPSIBLE) */}
      {activeSubSection === 'banking' && (
        <div className="space-y-4">
          {/* Section Header with Quick Actions */}
          <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">
                  Gateway Configurations
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                  2 Gateways
                </span>
              </div>
              <h2 className="text-xl font-bold text-white font-serif mt-1">
                Payment Gateways &amp; Banking Setup
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Configure banking accounts, gateway credentials, and statement descriptors. Open any payment method below to edit its settings.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={expandAllBanking}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAllBanking}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                Collapse All
              </button>
            </div>
          </div>

          {/* METHOD 1: MONZO BANKING & FASTER PAYMENTS */}
          <div className={`border rounded-2xl transition-all duration-200 overflow-hidden shadow-md ${
            openBankingMethods.monzo 
              ? 'border-rose-500/40 bg-[#0C0F1E]' 
              : 'border-neutral-800/80 bg-neutral-950/60 hover:border-neutral-700'
          }`}>
            <button
              type="button"
              onClick={() => toggleBankingMethod('monzo')}
              className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer hover:bg-neutral-900/40"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white font-serif">
                      Monzo Bank Transfer &amp; UK Faster Payments
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Monzo
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Sort Code, 8-digit Account Number, Monzo.me handle, and international IBAN/SWIFT wires.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-neutral-900 text-amber-300 border border-neutral-800">
                    Sort: {config.sortCode}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-neutral-900 text-neutral-300 border border-neutral-800">
                    Acc: {config.accountNumber}
                  </span>
                </div>
                <div className={`w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 transition-transform duration-200 ${
                  openBankingMethods.monzo ? 'rotate-180 text-rose-400 border-rose-500/30' : ''
                }`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </button>

            {openBankingMethods.monzo && (
              <div className="p-5 sm:p-6 border-t border-neutral-800/80 bg-[#0C0F1E] space-y-5">
                <div className="flex items-start justify-between gap-4 p-3.5 bg-neutral-900/60 rounded-xl border border-neutral-800/80">
                  <div>
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block font-mono">Customer Cart Display</span>
                    <p className="text-xs text-neutral-300 mt-0.5">
                      These credentials appear in the cart drawer and on generated pass summary vouchers for direct bank transfer settlements.
                    </p>
                  </div>
                  <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800 hidden md:flex items-center gap-2.5 shrink-0">
                    <Building2 className="w-4 h-4 text-rose-400" />
                    <div>
                      <p className="text-[10px] font-bold text-white">{config.bankName}</p>
                      <p className="text-[9px] text-neutral-400 font-mono">Sort: {config.sortCode} • Acc: {config.accountNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-200 block">
                      Beneficiary / Account Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.accountName}
                      onChange={(e) => handleChange('accountName', e.target.value)}
                      placeholder="e.g. Mellows Entertainment Ltd"
                      className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <p className="text-[10px] text-neutral-500">Legal entity name registered on the Monzo Business account.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-200 block">
                      Bank Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.bankName}
                      onChange={(e) => handleChange('bankName', e.target.value)}
                      placeholder="e.g. Monzo Bank UK"
                      className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <p className="text-[10px] text-neutral-500">The receiving banking institution shown on receipts.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-200 block">
                      Sort Code <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.sortCode}
                      onChange={(e) => handleChange('sortCode', e.target.value)}
                      placeholder="04-00-04"
                      className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-amber-300 font-mono font-bold placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <p className="text-[10px] text-neutral-500">Standard 6-digit UK clearing code (e.g. 04-00-04).</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-200 block">
                      Account Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.accountNumber}
                      onChange={(e) => handleChange('accountNumber', e.target.value)}
                      placeholder="89214730"
                      className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-amber-300 font-mono font-bold placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <p className="text-[10px] text-neutral-500">8-digit Monzo account number for domestic transfers.</p>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-200 block">
                        Monzo.me Handle / Slug
                      </label>
                      <a
                        href={`https://monzo.me/${config.monzoMeSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1"
                      >
                        https://monzo.me/{config.monzoMeSlug} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">
                        https://monzo.me/
                      </span>
                      <input
                        type="text"
                        value={config.monzoMeSlug}
                        onChange={(e) => handleChange('monzoMeSlug', e.target.value.replace(/^@/, ''))}
                        placeholder="mellowsentertainment"
                        className="w-full pl-36 pr-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      Attendees can click this to open the Monzo app or pay with Apple Pay/Google Pay directly on web.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-200 block">
                      International IBAN (Optional)
                    </label>
                    <input
                      type="text"
                      value={config.iban || ''}
                      onChange={(e) => handleChange('iban', e.target.value)}
                      placeholder="GB29 MONZ 0400 0489 2147 30"
                      className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <p className="text-[10px] text-neutral-500">For diaspora &amp; international attendees paying from European/overseas accounts.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-200 block">
                      BIC / SWIFT Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={config.bicSwift || ''}
                      onChange={(e) => handleChange('bicSwift', e.target.value)}
                      placeholder="MONZGB21XXX"
                      className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <p className="text-[10px] text-neutral-500">Bank identifier code for cross-border banking wires.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* METHOD 2: PAYPAL GATEWAY */}
          <div className={`border rounded-2xl transition-all duration-200 overflow-hidden shadow-md ${
            openBankingMethods.paypal 
              ? 'border-sky-500/40 bg-[#0C0F1E]' 
              : 'border-neutral-800/80 bg-neutral-950/60 hover:border-neutral-700'
          }`}>
            <button
              type="button"
              onClick={() => toggleBankingMethod('paypal')}
              className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer hover:bg-neutral-900/40"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white font-serif">
                      PayPal Business Gateway
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      PayPal
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Receiving business email and PayPal.me handle for one-tap checkout links.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-neutral-900 text-sky-300 border border-neutral-800 truncate max-w-[200px]">
                    {config.paypalEmail || 'Not configured'}
                  </span>
                </div>
                <div className={`w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 transition-transform duration-200 ${
                  openBankingMethods.paypal ? 'rotate-180 text-sky-400 border-sky-500/30' : ''
                }`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </button>

            {openBankingMethods.paypal && (
              <div className="p-5 sm:p-6 border-t border-neutral-800/80 bg-[#0C0F1E] space-y-5">
                <div className="p-3.5 bg-neutral-900/60 rounded-xl border border-neutral-800/80">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block font-mono">PayPal Integration</span>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Attendees selecting PayPal will receive your direct business email and PayPal.me link to execute immediate online transfers.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-200 block">
                      PayPal Receiving Email <span className="text-sky-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={config.paypalEmail || ''}
                      onChange={(e) => handleChange('paypalEmail', e.target.value)}
                      placeholder="payments@mellowsentertainment.com"
                      className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                    <p className="text-[10px] text-neutral-500">Email where customer PayPal transfers are sent.</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-200 block">
                        PayPal.me Username / Slug
                      </label>
                      {config.paypalMeSlug && (
                        <a
                          href={`https://paypal.me/${config.paypalMeSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1"
                        >
                          paypal.me/{config.paypalMeSlug} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">
                        paypal.me/
                      </span>
                      <input
                        type="text"
                        value={config.paypalMeSlug || ''}
                        onChange={(e) => handleChange('paypalMeSlug', e.target.value.replace(/^@/, ''))}
                        placeholder="mellowsent"
                        className="w-full pl-24 pr-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500">Used for one-click PayPal payments in the checkout drawer.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: TIMING & CHECKOUT RULES */}
      {activeSubSection === 'workflows' && (
        <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-md">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-mono">Payment Policies</span>
            <h2 className="text-xl font-bold text-white font-serif mt-0.5">Checkout Timings &amp; Allocation Policies</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Control which payment methods and options are offered in the checkout drawer and pass reservations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* PayPal Toggle */}
            <div className="p-5 bg-neutral-950/70 rounded-xl border border-neutral-800/80 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-sky-400" /> PayPal Direct Gateway
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Enables PayPal.me link checkout and manual email transfer for global attendees.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={config.paypalEnabled ?? true}
                  onChange={(e) => handleChange('paypalEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>

            {/* Global Monzo Toggle */}
            <div className="p-5 bg-neutral-950/70 rounded-xl border border-neutral-800/80 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Monzo Bank Transfer
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Master switch for Monzo bank transfers and Monzo.me link generation across the entire website.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={config.monzoEnabled}
                  onChange={(e) => handleChange('monzoEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Default Online Method Selection */}
            <div className="p-5 bg-neutral-950/70 rounded-xl border border-neutral-800/80 space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-white block">
                Default Online Payment Method Pre-Selected
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'monzo', name: 'Monzo', color: 'amber' },
                  { id: 'paypal', name: 'PayPal', color: 'sky' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleChange('defaultMethod', m.id as any)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      (config.defaultMethod || 'monzo') === m.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-neutral-500">The payment method highlighted first when the attendee chooses Pay Now.</p>
            </div>

            {/* Option 1: Pay Now via Monzo */}
            <div className="p-5 bg-neutral-950/70 rounded-xl border border-neutral-800/80 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-400" /> "Pay Now via Monzo" Option
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Allows attendees to settle upfront before traveling, securing immediate wristband allocation.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={config.payNowEnabled}
                  onChange={(e) => handleChange('payNowEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>

            {/* Option 2: Pay on Arrival */}
            <div className="p-5 bg-neutral-950/70 rounded-xl border border-neutral-800/80 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> "Pay on Arrival" Option
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Allows guests to reserve wristbands at £0 upfront and settle in Grenada at the airport or hotel welcome desk.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={config.payOnArrivalEnabled}
                  onChange={(e) => handleChange('payOnArrivalEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Default Timing Selection */}
            <div className="p-5 bg-neutral-950/70 rounded-xl border border-neutral-800/80 space-y-2">
              <label className="text-xs font-bold text-white block">
                Default Option Pre-Selected in Cart
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('defaultTiming', 'now')}
                  disabled={!config.payNowEnabled}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    config.defaultTiming === 'now'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  } ${!config.payNowEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  Pay Now
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('defaultTiming', 'arrival')}
                  disabled={!config.payOnArrivalEnabled}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    config.defaultTiming === 'arrival'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  } ${!config.payOnArrivalEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  Pay on Arrival
                </button>
              </div>
              <p className="text-[10px] text-neutral-500">The default selection when attendees open the checkout drawer.</p>
            </div>

            {/* Payment Window / Grace Period */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-200 block">
                Pay Now Payment Window (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={config.paymentDeadlineHours || 48}
                onChange={(e) => handleChange('paymentDeadlineHours', parseInt(e.target.value) || 48)}
                className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-[10px] text-neutral-500">Time allowed for bank transfer reconciliation before order follow-up notice.</p>
            </div>

            {/* Voucher Download Permission */}
            <div className="p-5 bg-neutral-950/70 rounded-xl border border-neutral-800/80 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-emerald-400" /> Allow Voucher Download Before Settle
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Permits attendees to save their printable reservation PDF immediately while awaiting arrival payment.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={config.allowPassVoucherDownloadBeforePayment ?? true}
                  onChange={(e) => handleChange('allowPassVoucherDownloadBeforePayment', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ARRIVAL DESK & CONCIERGE */}
      {activeSubSection === 'arrival' && (
        <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-md">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-mono">Physical Handover Point</span>
            <h2 className="text-xl font-bold text-white font-serif mt-0.5">Arrival Concierge &amp; Wristband Collection Desk</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Specify where arriving passengers can collect their RFID wristbands and settle on arrival.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-neutral-200 block">
                Primary Collection Desk Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={config.arrivalDeskName}
                onChange={(e) => handleChange('arrivalDeskName', e.target.value)}
                placeholder="Maurice Bishop Airport (GND) Arrival Concierge"
                className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-[10px] text-neutral-500">Displayed prominently on the confirmation voucher header.</p>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-neutral-200 block">
                Terminal &amp; Hotel Location Description <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={config.arrivalDeskLocation}
                onChange={(e) => handleChange('arrivalDeskLocation', e.target.value)}
                placeholder="Arrivals Terminal, Point Salines, St. George & Royalton Grenada Welcome Desk"
                className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-[10px] text-neutral-500">Directions for guests finding the airport kiosk or resort desks.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-200 block">
                Operating Hours
              </label>
              <input
                type="text"
                value={config.arrivalDeskHours || ''}
                onChange={(e) => handleChange('arrivalDeskHours', e.target.value)}
                placeholder="24/7 during festival week (July 29 – August 7, 2027)"
                className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-[10px] text-neutral-500">When staff will be present to issue RFID bands.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-200 block">
                Concierge Helpline Phone / WhatsApp
              </label>
              <input
                type="text"
                value={config.supportPhone}
                onChange={(e) => handleChange('supportPhone', e.target.value)}
                placeholder="+44 7904 983210"
                className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-amber-300 font-mono placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-[10px] text-neutral-500">Emergency contact for passengers arriving late or delayed flights.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-200 block">
                Payment Enquiries Email
              </label>
              <input
                type="email"
                value={config.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                placeholder="wristbands@mellowsentertainment.com"
                className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-[10px] text-neutral-500">Email where guests submit bank transfer receipts.</p>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-neutral-200 block">
                Wristband Collection Instructions &amp; Terms
              </label>
              <textarea
                rows={3}
                value={config.wristbandCollectionNotes}
                onChange={(e) => handleChange('wristbandCollectionNotes', e.target.value)}
                placeholder="Present your reservation voucher to collect RFID wristband..."
                className="w-full px-3.5 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-[10px] text-neutral-500">Appears in footer notes of the voucher and checkout completion modal.</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: PAYMENT RECEIPTS & SCREENSHOTS */}
      {activeSubSection === 'receipts' && (
        <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white tracking-wide">
                  Customer Payment Receipts &amp; Transfer Proof
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Review submitted Monzo screenshots, match against bank transactions, and verify pass orders.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 shrink-0">
              <button
                type="button"
                onClick={() => setReceiptFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  receiptFilter === 'all'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All ({metrics.receiptsCount})
              </button>
              <button
                type="button"
                onClick={() => setReceiptFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  receiptFilter === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Pending ({metrics.pendingReceiptsCount})
              </button>
              <button
                type="button"
                onClick={() => setReceiptFilter('verified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  receiptFilter === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Verified ({metrics.verifiedReceiptsCount})
              </button>
            </div>
          </div>

          {/* List of Orders with Receipts */}
          {(() => {
            const filtered = passOrders
              .filter(o => Boolean(o.receiptUrl))
              .filter(o => {
                if (receiptFilter === 'pending') return o.receiptStatus !== 'verified' && o.receiptStatus !== 'rejected';
                if (receiptFilter === 'verified') return o.receiptStatus === 'verified';
                if (receiptFilter === 'rejected') return o.receiptStatus === 'rejected';
                return true;
              });

            const allFilteredIds = filtered.map(o => o.id);
            const isAllSelected = filtered.length > 0 && allFilteredIds.every(id => selectedReceiptIds.includes(id));
            const selectedCount = selectedReceiptIds.filter(id => allFilteredIds.includes(id)).length;

            const toggleSelectAll = () => {
              if (isAllSelected) {
                setSelectedReceiptIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
              } else {
                setSelectedReceiptIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
              }
            };

            const toggleSelectOne = (id: string) => {
              setSelectedReceiptIds(prev => 
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
              );
            };

            const handleBulkVerify = () => {
              const targetIds = selectedReceiptIds.filter(id => allFilteredIds.includes(id));
              if (targetIds.length === 0) return;

              triggerConfirm(
                `Bulk Verify ${targetIds.length} Receipt${targetIds.length > 1 ? 's' : ''}`,
                `Mark ${targetIds.length} selected reservation(s) as PAID and confirm payment receipts? Attendees will instantly be unlocked for official PDF wrist vouchers.`,
                () => {
                  let count = 0;
                  targetIds.forEach(id => {
                    verifyPaymentReceipt(id, 'verified', 'Bulk verified by Admin');
                    count++;
                  });
                  setSelectedReceiptIds([]);
                  onToast(`Successfully verified and confirmed ${count} receipt${count > 1 ? 's' : ''}!`);
                }
              );
            };

            const handleBulkReject = () => {
              const targetIds = selectedReceiptIds.filter(id => allFilteredIds.includes(id));
              if (targetIds.length === 0) return;

              triggerConfirm(
                `Bulk Reject ${targetIds.length} Receipt${targetIds.length > 1 ? 's' : ''}`,
                `Flag ${targetIds.length} selected receipt(s) as rejected? Customers will be able to re-upload clear payment proofs.`,
                () => {
                  let count = 0;
                  targetIds.forEach(id => {
                    verifyPaymentReceipt(id, 'rejected', 'Bulk rejected during admin review');
                    count++;
                  });
                  setSelectedReceiptIds([]);
                  onToast(`Flagged ${count} receipt${count > 1 ? 's' : ''} as rejected.`);
                }
              );
            };

            const handleBulkDelete = () => {
              const targetIds = selectedReceiptIds.filter(id => allFilteredIds.includes(id));
              if (targetIds.length === 0) return;

              triggerConfirm(
                `Bulk Delete ${targetIds.length} Payment Receipt${targetIds.length > 1 ? 's' : ''}`,
                `Permanently delete and remove the payment proof file for ${targetIds.length} order(s)? The order reservation will remain intact and return to awaiting payment proof status.`,
                () => {
                  let count = 0;
                  targetIds.forEach(id => {
                    deletePaymentReceipt(id);
                    count++;
                  });
                  setSelectedReceiptIds([]);
                  onToast(`Permanently removed ${count} payment receipt${count > 1 ? 's' : ''}.`);
                }
              );
            };

            if (filtered.length === 0) {
              return (
                <div className="py-14 text-center space-y-3 bg-neutral-950/40 rounded-2xl border border-dashed border-neutral-800">
                  <div className="w-12 h-12 mx-auto rounded-full bg-neutral-900 flex items-center justify-center text-neutral-500">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-neutral-300">
                      {receiptFilter === 'all' 
                        ? 'No Payment Receipts Uploaded Yet' 
                        : `No ${receiptFilter} receipts found`}
                    </h4>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      When customers complete checkout via Monzo and attach a payment screenshot or receipt, it will appear here for fast-track reconciliation.
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {/* Bulk Actions Header Toolbar */}
                <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-white transition-colors cursor-pointer select-none"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-500" />
                      )}
                      <span>{isAllSelected ? 'Deselect All' : 'Select All'} ({filtered.length})</span>
                    </button>

                    {selectedCount > 0 && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                        {selectedCount} selected
                      </span>
                    )}
                  </div>

                  {/* Bulk Action Trigger Buttons */}
                  <div className="flex items-center gap-2">
                    {selectedCount > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptIds([])}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent transition-all cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkDelete}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Permanently remove uploaded receipts"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Bulk Delete ({selectedCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkReject}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Bulk Reject ({selectedCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkVerify}
                          className="px-3 py-1.5 rounded-lg text-xs font-black text-neutral-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Bulk Verify &amp; Confirm Paid ({selectedCount})</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-neutral-500 italic">
                        Select one or more receipts to apply bulk actions
                      </span>
                    )}
                  </div>
                </div>

                {/* Receipts Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map(order => {
                    const ref = order.extraDetails?.OrderRef || order.id;
                    const isVerified = order.receiptStatus === 'verified';
                    const isRejected = order.receiptStatus === 'rejected';
                    const isSelected = selectedReceiptIds.includes(order.id);

                    return (
                      <div 
                        key={order.id}
                        className={`bg-neutral-950/90 border rounded-2xl p-4 space-y-4 transition-all shadow-md flex flex-col justify-between ${
                          isSelected 
                            ? 'border-amber-500/60 ring-1 ring-amber-500/30 bg-amber-500/[0.02]' 
                            : 'border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              {/* Selection Checkbox */}
                              <button
                                type="button"
                                onClick={() => toggleSelectOne(order.id)}
                                className="mt-0.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                title={isSelected ? "Deselect receipt" : "Select receipt"}
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-amber-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-neutral-600 hover:text-neutral-400" />
                                )}
                              </button>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-amber-400">
                                    {ref}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(ref, ref)}
                                    className="text-neutral-500 hover:text-white transition-colors"
                                    title="Copy Reference"
                                  >
                                    {copiedField === ref ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                                <h4 className="text-sm font-bold text-white mt-0.5">{order.name}</h4>
                                <p className="text-[11px] text-neutral-400 font-mono">{order.email}</p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-base font-black font-mono text-emerald-400 block">
                                {order.extraDetails?.TotalPaid || `£${order.amountGBP || 0}`}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono mt-1 ${
                                isVerified 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                  : isRejected
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {isVerified ? 'VERIFIED' : isRejected ? 'REJECTED' : 'PENDING REVIEW'}
                              </span>
                            </div>
                          </div>

                          {/* Screenshot Thumbnail & Notes */}
                          <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800/80 flex gap-3 items-center">
                            {order.receiptUrl ? (
                              <div 
                                className="relative group shrink-0 cursor-pointer overflow-hidden rounded-lg border border-neutral-700 bg-neutral-950 w-20 h-20"
                                onClick={() => setPreviewReceipt({
                                  url: order.receiptUrl!,
                                  name: order.receiptName,
                                  orderRef: ref,
                                  guestName: order.name
                                })}
                              >
                                {order.receiptUrl.startsWith('data:image') || order.receiptUrl.match(/\.(jpg|jpeg|png|webp)/i) ? (
                                  <img
                                    src={order.receiptUrl}
                                    alt="Receipt proof"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-amber-400 p-1 text-center">
                                    <FileText className="w-6 h-6" />
                                    <span className="text-[8px] mt-1 text-neutral-300 truncate w-full">Document</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye className="w-4 h-4" />
                                </div>
                              </div>
                            ) : null}

                            <div className="flex-1 min-w-0 text-xs space-y-1">
                              <div className="text-[10px] text-neutral-400 font-mono">
                                File: <span className="text-white truncate">{order.receiptName || 'Payment_Proof.jpg'}</span>
                              </div>
                              {order.receiptUploadedAt && (
                                <div className="text-[10px] text-neutral-400 font-mono">
                                  Uploaded: <span className="text-neutral-300">{new Date(order.receiptUploadedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              )}
                              {order.receiptNotes && (
                                <div className="text-[11px] text-amber-300/90 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 line-clamp-2">
                                  &ldquo;{order.receiptNotes}&rdquo;
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewReceipt({
                                url: order.receiptUrl!,
                                name: order.receiptName,
                                orderRef: ref,
                                guestName: order.name
                              })}
                              className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-neutral-800 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>View Full Size</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                triggerConfirm(
                                  'Delete Payment Receipt',
                                  `Permanently delete the attached receipt proof for order ${ref} (${order.name})? The order will return to pending proof status.`,
                                  () => {
                                    deletePaymentReceipt(order.id);
                                    setSelectedReceiptIds(prev => prev.filter(id => id !== order.id));
                                    onToast(`Payment receipt for ${ref} deleted.`);
                                  }
                                );
                              }}
                              className="p-1.5 bg-neutral-900 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 rounded-lg text-xs transition-colors border border-neutral-800 hover:border-red-500/30 cursor-pointer"
                              title="Delete this payment receipt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isRejected && (
                              <button
                                type="button"
                                onClick={() => {
                                  triggerConfirm(
                                    'Reject Payment Receipt',
                                    `Flag receipt for order ${ref} as rejected? The attendee can upload an amended screenshot.`,
                                    () => {
                                      verifyPaymentReceipt(order.id, 'rejected', 'Rejected during admin review');
                                      onToast(`Receipt for ${ref} flagged as rejected.`);
                                    }
                                  );
                                }}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-bold transition-all border border-rose-500/30 cursor-pointer"
                              >
                                Reject
                              </button>
                            )}

                            {!isVerified && (
                              <button
                                type="button"
                                onClick={() => {
                                  verifyPaymentReceipt(order.id, 'verified', 'Verified by Admin');
                                  onToast(`Receipt for ${ref} verified and order marked as PAID!`);
                                }}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Verify &amp; Confirm Paid</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Full Lightbox View Modal */}
      {previewReceipt && (
        <ReceiptLightboxModal
          isOpen={Boolean(previewReceipt)}
          onClose={() => setPreviewReceipt(null)}
          receiptUrl={previewReceipt.url}
          receiptName={previewReceipt.name}
          orderRef={previewReceipt.orderRef}
          guestName={previewReceipt.guestName}
        />
      )}
    </div>
  );
};
