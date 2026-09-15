export interface PaymentConfig {
  monzoEnabled: boolean;
  paypalEnabled: boolean;
  paypalEmail: string;
  paypalMeSlug: string;
  payNowEnabled: boolean;
  payOnArrivalEnabled: boolean;
  defaultTiming: 'now' | 'arrival';
  defaultMethod?: 'monzo' | 'paypal';
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
  paypalEnabled: true,
  paypalEmail: 'payments@mellowsentertainment.com',
  paypalMeSlug: 'mellowsentertainment',
  payNowEnabled: true,
  payOnArrivalEnabled: true,
  defaultTiming: 'now',
  defaultMethod: 'monzo',
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
  wristbandCollectionNotes: 'Present your reservation voucher to collect RFID wristband and settle via Monzo or PayPal.',
  supportPhone: '+44 7904 983210',
  supportEmail: 'wristbands@mellowsentertainment.com',
  autoReconcileOrders: false,
  allowPassVoucherDownloadBeforePayment: true,
  paymentDeadlineHours: 48,
  sendConfirmationEmail: true,
  emailReceiptCopyAdmin: true,
  showMonzoQrCode: true,
  updatedAt: '2020-01-01T00:00:00.000Z',
  updatedBy: 'System'
};

export const PAYMENT_CONFIG_KEY = 'grenada_payment_config_v1';

// Instant server fetch for initial page load / first-time visitors
let isInitialFetching = false;
export async function refreshPaymentConfigFromServer(): Promise<PaymentConfig | null> {
  if (typeof window === 'undefined' || isInitialFetching) return null;
  isInitialFetching = true;
  try {
    const res = await fetch('/api/payment-config');
    if (res.ok) {
      const serverConfig = await res.json();
      if (serverConfig && typeof serverConfig === 'object' && Object.keys(serverConfig).length > 0) {
        const merged: PaymentConfig = { ...DEFAULT_PAYMENT_CONFIG, ...serverConfig };
        localStorage.setItem(PAYMENT_CONFIG_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('payment_config_updated', { detail: merged }));
        return merged;
      }
    }
  } catch (err) {
    console.warn('[PaymentConfig] Initial server fetch failed, using local/default:', err);
  } finally {
    isInitialFetching = false;
  }
  return null;
}

// Setup cross-tab sync listener and kick off instant fetch
if (typeof window !== 'undefined') {
  // Eagerly fetch authoritative payment configuration on startup
  refreshPaymentConfigFromServer();

  window.addEventListener('storage', (e) => {
    if (e.key === PAYMENT_CONFIG_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        const merged = { ...DEFAULT_PAYMENT_CONFIG, ...parsed };
        window.dispatchEvent(new CustomEvent('payment_config_updated', { detail: merged }));
      } catch (err) {
        console.error('Error parsing cross-tab payment config update:', err);
      }
    }
  });
}

export function getPaymentConfig(): PaymentConfig {
  try {
    if (typeof window === 'undefined') return DEFAULT_PAYMENT_CONFIG;
    const raw = localStorage.getItem(PAYMENT_CONFIG_KEY);
    if (!raw) {
      // First-time visit: trigger async fetch immediately
      refreshPaymentConfigFromServer();
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

      // Asynchronously persist to backend SQLite database & broadcast SSE to all clients
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if ((window as any).clientId) {
        headers['X-Client-Id'] = (window as any).clientId;
      }
      fetch('/api/payment-config', {
        method: 'POST',
        headers,
        body: JSON.stringify(updated)
      }).catch((err) => {
        console.warn('[PaymentConfig] Background server sync error:', err);
      });
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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if ((window as any).clientId) {
        headers['X-Client-Id'] = (window as any).clientId;
      }
      fetch('/api/payment-config', {
        method: 'POST',
        headers,
        body: JSON.stringify(reset)
      }).catch((err) => {
        console.warn('[PaymentConfig] Background server reset sync error:', err);
      });
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

export function getPayPalMeUrl(slug: string, amount: number, currency = 'GBP', reference = 'GCF-2027'): string {
  const safeSlug = (slug || 'mellowsentertainment').replace(/^@/, '').trim();
  const safeRef = encodeURIComponent(reference || 'GCF-2027');
  return `https://www.paypal.com/paypalme/${safeSlug}/${amount}${currency}?note=${safeRef}`;
}

