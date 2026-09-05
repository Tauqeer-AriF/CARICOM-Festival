export interface PaymentConfig {
  monzoEnabled: boolean;
  payNowEnabled: boolean;
  payOnArrivalEnabled: boolean;
  defaultTiming: 'now' | 'arrival';
  accountName: string;
  sortCode: string;
  accountNumber: string;
  bankName: string;
  monzoMeSlug: string;
  referencePrefix?: string;
  iban?: string;
  bicSwift?: string;
  arrivalDeskName: string;
  arrivalDeskLocation: string;
  arrivalDeskHours?: string;
  wristbandCollectionNotes: string;
  supportPhone: string;
  supportEmail: string;
  autoReconcileOrders: boolean;
  allowPassVoucherDownloadBeforePayment?: boolean;
  paymentDeadlineHours?: number;
  sendConfirmationEmail?: boolean;
  emailReceiptCopyAdmin?: boolean;
  showMonzoQrCode?: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  monzoEnabled: true,
  payNowEnabled: true,
  payOnArrivalEnabled: true,
  defaultTiming: 'now',
  accountName: 'Mellows Entertainment Ltd',
  sortCode: '04-00-04',
  accountNumber: '89214730',
  bankName: 'Monzo Bank UK',
  monzoMeSlug: 'mellowsentertainment',
  referencePrefix: 'GCF-2027-',
  iban: 'GB29 MONZ 0400 0489 2147 30',
  bicSwift: 'MONZGB21XXX',
  arrivalDeskName: 'Maurice Bishop Airport (GND) Arrival Concierge',
  arrivalDeskLocation: 'Arrivals Terminal, Point Salines, St. George & Royalton Grenada Welcome Desk',
  arrivalDeskHours: '24/7 during festival week (July 29 – August 7, 2027)',
  wristbandCollectionNotes: 'Present your reservation voucher to collect RFID wristband and settle via Monzo contactless, card tap, or app transfer.',
  supportPhone: '+44 7904 983210',
  supportEmail: 'wristbands@mellowsentertainment.com',
  autoReconcileOrders: false,
  allowPassVoucherDownloadBeforePayment: true,
  paymentDeadlineHours: 48,
  sendConfirmationEmail: true,
  emailReceiptCopyAdmin: true,
  showMonzoQrCode: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'System'
};

const PAYMENT_CONFIG_KEY = 'grenada_payment_config_v1';

export function getPaymentConfig(): PaymentConfig {
  try {
    if (typeof window === 'undefined') return DEFAULT_PAYMENT_CONFIG;
    const raw = localStorage.getItem(PAYMENT_CONFIG_KEY);
    if (!raw) {
      localStorage.setItem(PAYMENT_CONFIG_KEY, JSON.stringify(DEFAULT_PAYMENT_CONFIG));
      return DEFAULT_PAYMENT_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PAYMENT_CONFIG,
      ...parsed
    };
  } catch (err) {
    console.error('Failed to load payment config:', err);
    return DEFAULT_PAYMENT_CONFIG;
  }
}

export function savePaymentConfig(updates: Partial<PaymentConfig>, updatedBy = 'Admin Operator'): PaymentConfig {
  try {
    const current = getPaymentConfig();
    const updated: PaymentConfig = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(PAYMENT_CONFIG_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('payment_config_updated', { detail: updated }));
    }
    return updated;
  } catch (err) {
    console.error('Failed to save payment config:', err);
    return DEFAULT_PAYMENT_CONFIG;
  }
}

export function resetPaymentConfig(updatedBy = 'Admin Operator'): PaymentConfig {
  try {
    const reset = {
      ...DEFAULT_PAYMENT_CONFIG,
      updatedAt: new Date().toISOString(),
      updatedBy
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(PAYMENT_CONFIG_KEY, JSON.stringify(reset));
      window.dispatchEvent(new CustomEvent('payment_config_updated', { detail: reset }));
    }
    return reset;
  } catch (err) {
    console.error('Failed to reset payment config:', err);
    return DEFAULT_PAYMENT_CONFIG;
  }
}

export function getMonzoMeUrl(slug: string, amountGBP: number, reference: string): string {
  const safeSlug = (slug || 'mellowsentertainment').replace(/^@/, '').trim();
  const safeRef = encodeURIComponent(reference || 'GCF-2027');
  return `https://monzo.me/${safeSlug}/${amountGBP}?d=${safeRef}`;
}
