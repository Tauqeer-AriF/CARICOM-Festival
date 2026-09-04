import { FormSubmissionItem, SubmissionReply, SiteConfig, EventItem, HotelItem, PassItem, GalleryItem, MediaItem, TestimonialItem } from '../types';
import { FESTIVAL_EVENTS, FESTIVAL_HOTELS, FESTIVAL_PASSES, FESTIVAL_TESTIMONIALS, FESTIVAL_IMAGES } from '../data/festivalData';
import { GALLERY_ITEMS } from '../data/galleryData';
import { 
  ALL_SUBMISSION_TYPE_TAGS, 
  ALL_SUBMISSION_STATUS_TAGS, 
  normalizeTypeTag, 
  normalizeStatusTag 
} from '../utils/submissionTags';
import { 
  dispatchOrderConfirmationEmail, 
  dispatchWelcomeRegistrationEmail, 
  dispatchEnquiryReplyEmail 
} from './emailService';

const SUBMISSIONS_KEY = 'grenada_caricom_submissions_v1';
const SITE_CONFIG_KEY = 'grenada_caricom_site_config_v1';
const EVENTS_KEY = 'grenada_caricom_events_v4';
const GALLERY_KEY = 'grenada_caricom_gallery_v3';
const HOTELS_KEY = 'grenada_caricom_hotels_v2';
const PASSES_KEY = 'grenada_caricom_passes_v2';
const TESTIMONIALS_KEY = 'grenada_caricom_testimonials_v2';
const MEDIA_KEY = 'grenada_caricom_media_v2';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  appName: 'Grenada',
  appSubtitle: 'CARICOM FESTIVAL',
  appLogoUrl: '',
  appFaviconUrl: '/src/assets/images/favicon_icon_1786434632871.jpg',
  appLogoIcon: 'Palmtree',
  appTagline: "Where London's top DJs & revelers unite with Grenada's tropical warmth.",
  appYearBadge: '2027',
  socialLinks: {
    instagram: 'https://instagram.com',
    tiktok: 'https://tiktok.com',
    facebook: 'https://facebook.com',
    whatsapp: 'https://wa.me/447900123456',
    youtube: 'https://youtube.com',
    twitter: 'https://twitter.com',
  },
  branding: {
    primaryColor: '#F59E0B', // Amber Gold
    secondaryColor: '#10B981', // Royal Emerald
    bgTone: 'dark-onyx',
    headingFont: 'Poppins',
    bodyFont: 'Inter',
    buttonStyle: 'rounded',
    cardStyle: 'glassy',
    glowIntensity: 'medium',
    glassOpacity: 30,
  },
  banner: {
    enabled: true,
    text: '🔥 GRENADA 2027 • EARLY BIRD VIP WRISTBANDS 85% SOLD OUT • MAY 22 - 31, 2027',
    bgColor: '#10B981', // Emerald green
  },
  festivalDates: {
    startDate: '2027-05-22',
    endDate: '2027-05-31',
    startTime: '18:00',
    label: 'MAY 22 - 31, 2027',
    locationLabel: 'SPICE ISLE, GRENADA',
  },
  hero: {
    displayCount: 5,
    autoplayInterval: 4,
    images: [
      { url: FESTIVAL_IMAGES.hero, alt: 'Grenada Beach DJ Showcase 2027' },
      { url: FESTIVAL_IMAGES.festivalHero, alt: 'Spectacular Spice Isle Festival Crowd' },
      { url: FESTIVAL_IMAGES.whiteGala, alt: 'Premium VIP White Gala Party Lounge' },
      { url: FESTIVAL_IMAGES.riverTubing, alt: 'Mellowland Tropical River Tubing Adventure' },
      { url: FESTIVAL_IMAGES.ecoParadise, alt: 'Beautiful Grenada Eco Paradise Coastline' },
    ]
  },
  pageImages: {
    homeWhiteGala: FESTIVAL_IMAGES.whiteGala,
    homeLondonVibes: FESTIVAL_IMAGES.whiteGala,
    homeBeachDJ: FESTIVAL_IMAGES.hero,
    homeRiverTubing: FESTIVAL_IMAGES.riverTubing,
    eventsBanner: FESTIVAL_IMAGES.festivalHero,
    galleryBanner: FESTIVAL_IMAGES.gallery5,
    aboutGrenadaHero: FESTIVAL_IMAGES.ecoParadise,
    aboutGrenadaEco: FESTIVAL_IMAGES.ecoParadise,
    aboutGrenadaUnderwater: FESTIVAL_IMAGES.underwaterPark,
    aboutGrenadaWaterfall: FESTIVAL_IMAGES.waterfall,
    aboutGrenadaSpiceMarket: FESTIVAL_IMAGES.spiceMarket,
    aboutMellowlandHero: FESTIVAL_IMAGES.riverTubing,
    aboutMellowlandRiver: FESTIVAL_IMAGES.riverTubing,
    aboutMellowlandGarden: FESTIVAL_IMAGES.mellowlandGarden,
    hotelsBanner: FESTIVAL_IMAGES.royaltonResort,
    passesBanner: FESTIVAL_IMAGES.festivalHero,
    transportationBanner: FESTIVAL_IMAGES.day1_welcome,
    testimonialsBanner: FESTIVAL_IMAGES.whiteGala,
    contactBanner: FESTIVAL_IMAGES.ecoParadise,
    travelInsuranceBanner: FESTIVAL_IMAGES.royaltonResort,
    termsBanner: FESTIVAL_IMAGES.gemini1,
  },
  adminPath: 'admin',
  adminPassword: '2027',
  ownerAdminPath: 'owner-console',
  ownerAdminPassword: '9999',
  contactEmail: 'info@grenadacaricomfestival.com',
  contactPhone: '+44 (0)7900 123 456',
};

export const INITIAL_DEMO_SUBMISSIONS: FormSubmissionItem[] = [
  {
    id: 'sub-101',
    type: 'contact',
    name: 'Sarah Jenkins',
    email: 'sarah.j@outlook.com',
    phone: '+44 7700 900123',
    topicOrPass: 'VIP Cabana & Group Booking',
    messageOrDetails: 'Looking to reserve a VIP Cabana for a party of 8 at the Mellowland River Tubing event. Can you confirm champagne package options?',
    status: 'in-review',
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    extraDetails: { Country: 'United Kingdom', GroupSize: '8 Guests' }
  },
  {
    id: 'sub-106',
    type: 'pass-order',
    name: 'Sarah Jenkins',
    email: 'sarah.j@outlook.com',
    phone: '+44 7700 900123',
    topicOrPass: '2x 10-Day All-Access VIP Gold Pass',
    messageOrDetails: 'Pass order placed in GBP. Total: £900. Breakdown: 2x 10-Day All-Access VIP Gold Pass @ £450',
    status: 'resolved',
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    amountGBP: 900,
    extraDetails: { OrderRef: 'GCF-2027-99102', Currency: 'GBP', TotalPaid: '£900', PurchasedItems: '2x 10-Day All-Access VIP Gold Pass', PaymentStatus: 'PAID' },
    replies: [
      {
        id: 'rep-sarah-1',
        message: 'Hello Sarah! Your 2x VIP Gold Wristbands are confirmed and tagged for delivery to Royalton Grenada.',
        sentAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        sentBy: 'Festival Concierge',
        method: 'email'
      }
    ]
  },
  {
    id: 'sub-107',
    type: 'flight-registration',
    name: 'Sarah Jenkins',
    email: 'sarah.j@outlook.com',
    phone: '+44 7700 900123',
    topicOrPass: 'Virgin Atlantic VS141',
    messageOrDetails: 'Arriving May 22nd at 15:20. Staying at Royalton Grenada. Requesting airport shuttle transfer for 2 adults with 4 suitcases.',
    status: 'resolved',
    submittedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    extraDetails: { Airline: 'Virgin Atlantic', FlightNum: 'VS141', Arrival: '2027-05-22 15:20', Departure: '2027-06-01 19:40', Hotel: 'Royalton Grenada Resort & Spa' }
  },
  {
    id: 'sub-102',
    type: 'flight-registration',
    name: 'Marcus Thorne',
    email: 'm.thorne@gmail.com',
    phone: '+1 305 555 0192',
    topicOrPass: 'British Airways BA2158',
    messageOrDetails: 'Arriving May 21st at 14:45. Staying at Royalton Grenada. Requesting airport shuttle transfer for 2 adults with 3 large suitcases.',
    status: 'in-review',
    submittedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    amountGBP: 120,
    extraDetails: { Airline: 'British Airways', FlightNum: 'BA2158', Arrival: '2027-05-21 14:45', Departure: '2027-05-31 17:30', Hotel: 'Royalton Grenada Resort & Spa' }
  },
  {
    id: 'sub-108',
    type: 'pass-order',
    name: 'Marcus Thorne',
    email: 'm.thorne@gmail.com',
    phone: '+1 305 555 0192',
    topicOrPass: '2x Weekend Carnival VIP Pass',
    messageOrDetails: 'Pass order placed in USD. Total: $614 ($480 GBP). Breakdown: 2x Weekend Carnival VIP Pass @ £240',
    status: 'in-review',
    submittedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    amountGBP: 480,
    extraDetails: { OrderRef: 'GCF-2027-44012', Currency: 'USD', TotalPaid: '$614', PurchasedItems: '2x Weekend Carnival VIP Pass', PaymentStatus: 'PAID' }
  },
  {
    id: 'sub-103',
    type: 'pass-order',
    name: 'David & Alicia Boyce',
    email: 'david.boyce@caribbean-travel.org',
    phone: '+1 473 405 9911',
    topicOrPass: '2x 10-Day All-Access VIP Gold Pass',
    messageOrDetails: 'Confirmed payment via card. Requesting custom wristband sizing and priority access to the White Gala Beach Fete.',
    status: 'resolved',
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    amountGBP: 900,
    extraDetails: { OrderRef: 'GCF-2027-88219', PaymentStatus: 'PAID' },
    replies: [
      {
        id: 'rep-demo-1',
        message: 'Dear David & Alicia, your VIP Gold wristbands have been reserved and assigned to your hotel concierge desk at Royalton Grenada. Priority access passes for the White Gala Beach Fete are attached to your booking file.',
        sentAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        sentBy: 'Festival Concierge Team',
        method: 'email'
      }
    ]
  },
  {
    id: 'sub-109',
    type: 'flight-registration',
    name: 'David & Alicia Boyce',
    email: 'david.boyce@caribbean-travel.org',
    phone: '+1 473 405 9911',
    topicOrPass: 'American Airlines AA1148',
    messageOrDetails: 'Arriving May 22nd at 16:10. Staying at Mount Cinnamon Grenada Resort. Requested private SUV transfer.',
    status: 'resolved',
    submittedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    extraDetails: { Airline: 'American Airlines', FlightNum: 'AA1148', Arrival: '2027-05-22 16:10', Departure: '2027-06-01 11:20', Hotel: 'Mount Cinnamon Resort' }
  },
  {
    id: 'sub-104',
    type: 'transport-request',
    name: 'Elena Rostova',
    email: 'elena.rostova@designstudio.co.uk',
    phone: '+44 7911 123456',
    topicOrPass: 'Daily VIP Shuttle Pass',
    messageOrDetails: 'Requesting daily shuttle pick-up from Sandals Grenada to Mellowland Village and Grand Anse Beach fete.',
    status: 'new',
    submittedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    amountGBP: 150,
    extraDetails: { Hotel: 'Sandals Grenada', Passengers: '2' }
  },
  {
    id: 'sub-105',
    type: 'newsletter',
    name: 'Chloe Williams',
    email: 'chloe.williams@yahoo.com',
    phone: '+1 246 883 1290',
    topicOrPass: 'Early Lineup Release Notifications',
    messageOrDetails: 'Subscribed to VIP mailing list for DJ lineup drops & secret location fetes.',
    status: 'resolved',
    submittedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    extraDetails: { Source: 'Home Hero Modal' }
  }
];

export const INITIAL_DEMO_MEDIA: MediaItem[] = [
  {
    id: 'media-gemini-1',
    name: 'Gemini Beach Fete Vibrance.png',
    url: FESTIVAL_IMAGES.gemini1,
    originalSize: 2097152,
    compressedSize: 345760,
    type: 'image/png',
    uploadedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'media-gemini-2',
    name: 'Gemini Concert Stage Production.png',
    url: FESTIVAL_IMAGES.gemini2,
    originalSize: 2497152,
    compressedSize: 385760,
    type: 'image/png',
    uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'media-gemini-3',
    name: 'Gemini Sunset Cruise Horizon.png',
    url: FESTIVAL_IMAGES.gemini3,
    originalSize: 2197152,
    compressedSize: 325760,
    type: 'image/png',
    uploadedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'media-gemini-4',
    name: 'Gemini Rainforest Island Rave.png',
    url: FESTIVAL_IMAGES.gemini4,
    originalSize: 2397152,
    compressedSize: 365760,
    type: 'image/png',
    uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'media-4',
    name: 'Spiceland Mall Excursion.jpg',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80',
    originalSize: 3145728,
    compressedSize: 327680,
    type: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'media-3',
    name: 'Royalton Grenada Resort.jpg',
    url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80',
    originalSize: 1572864,
    compressedSize: 153600,
    type: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'media-2',
    name: 'Grand Anse Beach Sunrise.jpg',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80',
    originalSize: 2097152,
    compressedSize: 245760,
    type: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 3600000 * 7).toISOString()
  },
  {
    id: 'media-1',
    name: 'Soca Monarch Live Concert.jpg',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80',
    originalSize: 1048576,
    compressedSize: 184320,
    type: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 3600000 * 8).toISOString()
  }
];

// --- Robust storage wrapper with in-memory fallback for iframe compatibility ---
const memoryStore: Record<string, string> = {};

export function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch (err) {
    console.warn(`localStorage.getItem failed for key '${key}':`, err);
  }
  return memoryStore[key] !== undefined ? memoryStore[key] : null;
}

export function safeSetItem(key: string, value: string): boolean {
  memoryStore[key] = value;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      const verifiedValue = localStorage.getItem(key);
      if (verifiedValue === value) {
        return true;
      }
      console.warn(`localStorage verification failed for key '${key}': retrieved value does not match written value.`);
    }
  } catch (err) {
    console.warn(`localStorage write failed for key '${key}':`, err);
  }
  // Return true because it is safely persisted in the memoryStore fallback
  return true;
}

export function safeRemoveItem(key: string): void {
  delete memoryStore[key];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`localStorage.removeItem failed for key '${key}':`, err);
  }
}

export async function uploadFileToServer(file: File): Promise<{ url: string; size: number; name: string; type: string } | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const headers = {} as any;
    if (typeof window !== 'undefined' && (window as any).clientId) {
      headers['X-Client-Id'] = (window as any).clientId;
    }
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      return {
        url: data.url,
        size: data.size,
        name: data.originalName || file.name,
        type: data.mimetype || file.type
      };
    }
  } catch (err) {
    console.warn('[Upload] Binary file upload to server deferred/failed:', err);
  }
  return null;
}

async function fetchWithRetry(url: string, retries = 3, delayMs = 500): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const headers = {} as any;
      if (typeof window !== 'undefined' && (window as any).clientId) {
        headers['X-Client-Id'] = (window as any).clientId;
      }
      const res = await fetch(url, { headers });
      if (res.ok) return res;
    } catch {
      // Ignore transient network errors on retry attempt
    }
    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  return null;
}

async function safeApiCall(url: string, options?: RequestInit): Promise<Response | null> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    } as any;

    if (typeof window !== 'undefined' && (window as any).clientId) {
      headers['X-Client-Id'] = (window as any).clientId;
    }

    const res = await fetch(url, {
      ...options,
      headers
    });
    return res;
  } catch (err) {
    console.warn(`Background API call to ${url} deferred:`, err);
    return null;
  }
}

export async function syncResource(type: string): Promise<void> {
  try {
    switch (type) {
      case 'site_config': {
        const resConfig = await fetchWithRetry('/api/site-config');
        if (resConfig?.ok) {
          const serverConfig = await resConfig.json();
          const localConfigStr = safeGetItem(SITE_CONFIG_KEY);
          if (localConfigStr) {
            try {
              const localConfig = JSON.parse(localConfigStr);
              const localTime = localConfig?.updatedAt ? new Date(localConfig.updatedAt).getTime() : 0;
              const serverTime = serverConfig?.updatedAt ? new Date(serverConfig.updatedAt).getTime() : 0;

              if (localTime > serverTime) {
                console.log('[Sync] Local Site Config is newer than server. Pushing local config to server.');
                await safeApiCall('/api/site-config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(localConfig)
                });
                break;
              }

              // If server config is identical to local config, skip redundant state reloads
              if (JSON.stringify(serverConfig) === localConfigStr) {
                break;
              }
            } catch (err) {
              console.error('[Sync] Error comparing site_config timestamps:', err);
            }
          }
          if (serverConfig && Object.keys(serverConfig).length > 0) {
            safeSetItem(SITE_CONFIG_KEY, JSON.stringify(serverConfig));
            const event = new CustomEvent('site_config_updated', { detail: serverConfig });
            (event as any).isRemoteSync = true;
            window.dispatchEvent(event);
          }
        }
        break;
      }
      case 'submissions': {
        const resSubs = await fetchWithRetry('/api/submissions');
        if (resSubs?.ok) {
          const subs = await resSubs.json();
          safeSetItem(SUBMISSIONS_KEY, JSON.stringify(subs));
          window.dispatchEvent(new Event('submissions_updated'));
        }
        break;
      }
      case 'events': {
        const resEvents = await fetchWithRetry('/api/events');
        if (resEvents?.ok) {
          const events = await resEvents.json();
          safeSetItem(EVENTS_KEY, JSON.stringify(events));
          window.dispatchEvent(new Event('events_updated'));
        }
        break;
      }
      case 'gallery': {
        const resGallery = await fetchWithRetry('/api/gallery');
        if (resGallery?.ok) {
          const gallery = await resGallery.json();
          safeSetItem(GALLERY_KEY, JSON.stringify(gallery));
          window.dispatchEvent(new Event('gallery_updated'));
        }
        break;
      }
      case 'hotels': {
        const resHotels = await fetchWithRetry('/api/hotels');
        if (resHotels?.ok) {
          const hotels = await resHotels.json();
          safeSetItem(HOTELS_KEY, JSON.stringify(hotels));
          window.dispatchEvent(new Event('hotels_updated'));
        }
        break;
      }
      case 'passes': {
        const resPasses = await fetchWithRetry('/api/passes');
        if (resPasses?.ok) {
          const passes = await resPasses.json();
          safeSetItem(PASSES_KEY, JSON.stringify(passes));
          window.dispatchEvent(new Event('passes_updated'));
        }
        break;
      }
      case 'testimonials': {
        const resTestimonials = await fetchWithRetry('/api/testimonials');
        if (resTestimonials?.ok) {
          const testimonials = await resTestimonials.json();
          safeSetItem(TESTIMONIALS_KEY, JSON.stringify(testimonials));
          window.dispatchEvent(new Event('testimonials_updated'));
        }
        break;
      }
      case 'media': {
        const resMedia = await fetchWithRetry('/api/media');
        if (resMedia?.ok) {
          const media = await resMedia.json();
          if (Array.isArray(media)) {
            media.sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
          }
          safeSetItem(MEDIA_KEY, JSON.stringify(media));
          window.dispatchEvent(new Event('media_updated'));
        }
        break;
      }
    }
  } catch (err) {
    console.warn(`Background selective sync for ${type} deferred:`, err);
  }
}

export async function syncWithDatabase(): Promise<void> {
  try {
    // 1. Sync Site Config
    await syncResource('site_config');

    // 2. Sync Submissions
    await syncResource('submissions');

    // 3. Sync Events
    await syncResource('events');

    // 4. Sync Gallery
    await syncResource('gallery');

    // 5. Sync Hotels
    await syncResource('hotels');

    // 6. Sync Passes
    await syncResource('passes');

    // 7. Sync Testimonials
    await syncResource('testimonials');

    // 8. Sync Media
    await syncResource('media');
  } catch (err) {
    console.warn('Background SQLite sync deferred:', err);
  }
}

let eventSource: EventSource | null = null;

export function initRealtimeUpdates(): void {
  if (typeof window === 'undefined') return;

  if (eventSource) {
    eventSource.close();
  }

  // Generate unique tab identifier for sender-skipping logic
  const clientId = `client-${Math.random().toString(36).substring(2, 15)}`;
  (window as any).clientId = clientId;

  const connect = () => {
    console.log('[SSE] Connecting for real-time updates...');
    eventSource = new EventSource('/api/realtime-updates');

    eventSource.onopen = () => {
      console.log('[SSE] Connected to real-time update stream.');
    };

    eventSource.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('[SSE] Received update event:', msg);
        
        // Skip updating if this tab is the one that triggered the change (LWW is handled locally)
        if (msg.senderId === clientId) {
          console.log(`[SSE] Skipping sync for ${msg.type} as it was initiated by this client tab.`);
          return;
        }

        if (msg.type) {
          console.log(`[SSE] Real-time message of type "${msg.type}" received. Running a complete re-sync of application state...`);
          await syncWithDatabase();
        }
      } catch (err) {
        console.error('[SSE] Error processing update event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('[SSE] Connection lost, retrying in 5s...', err);
      if (eventSource) {
        eventSource.close();
      }
      setTimeout(connect, 5000);
    };
  };

  connect();
}

// Automatically trigger sync and connect to real-time stream on client import
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncWithDatabase().then(() => {
      initRealtimeUpdates();
    });
  }, 150);
}

// --- SUBMISSIONS SERVICE ---
export const getSubmissions = (): FormSubmissionItem[] => {
  try {
    const raw = safeGetItem(SUBMISSIONS_KEY);
    if (!raw) {
      safeSetItem(SUBMISSIONS_KEY, JSON.stringify(INITIAL_DEMO_SUBMISSIONS));
      return INITIAL_DEMO_SUBMISSIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading submissions:', e);
    return INITIAL_DEMO_SUBMISSIONS;
  }
};

export const saveSubmissions = (submissions: FormSubmissionItem[]): void => {
  try {
    const success = safeSetItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
    if (!success) {
      throw new Error('Write verification failed for submissions');
    }
    window.dispatchEvent(new Event('submissions_updated'));
  } catch (e) {
    console.error('Error saving submissions:', e);
  }
};

export const addSubmission = (sub: Omit<FormSubmissionItem, 'id' | 'submittedAt' | 'status'>): FormSubmissionItem => {
  const current = getSubmissions();
  const newSub: FormSubmissionItem = {
    ...sub,
    id: `sub-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    status: 'new',
  };
  const updated = [newSub, ...current];
  saveSubmissions(updated);

  // Sync to backend SQLite
  safeApiCall('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSub)
  });

  // Automated transactional email triggers
  try {
    if (newSub.type === 'pass-order') {
      dispatchOrderConfirmationEmail(newSub).catch(e => console.warn('Order confirmation email trigger:', e));
    } else if (newSub.type === 'flight-registration') {
      dispatchWelcomeRegistrationEmail(newSub).catch(e => console.warn('Welcome registration email trigger:', e));
    }
  } catch (err) {
    console.warn('Non-blocking transactional email dispatch notice:', err);
  }

  return newSub;
};

export const updateSubmission = (
  id: string,
  updatedData: Partial<FormSubmissionItem>
): FormSubmissionItem | null => {
  const current = getSubmissions();
  let updatedItem: FormSubmissionItem | null = null;
  const updated = current.map((item) => {
    if (item.id === id) {
      updatedItem = {
        ...item,
        ...updatedData,
        id, // preserve immutable ID
      };
      return updatedItem;
    }
    return item;
  });

  if (!updatedItem) return null;

  saveSubmissions(updated);

  // Sync to backend SQLite
  safeApiCall(`/api/submissions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedItem)
  }).catch(() => {
    safeApiCall('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem)
    });
  });

  return updatedItem;
};

export const updateSubmissionStatus = (id: string, status: 'new' | 'in-review' | 'resolved'): void => {
  const current = getSubmissions();
  const updated = current.map(item => item.id === id ? { ...item, status } : item);
  saveSubmissions(updated);

  // Sync to backend SQLite
  safeApiCall(`/api/submissions/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
};

export const addSubmissionReply = (
  id: string,
  replyMessage: string,
  sentBy: string = 'Festival Concierge',
  method: 'email' | 'mailto' | 'in-app' = 'in-app',
  attachment?: SubmissionReply['attachment']
): void => {
  const current = getSubmissions();
  const newReply: SubmissionReply = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    message: replyMessage,
    sentAt: new Date().toISOString(),
    sentBy,
    method,
    ...(attachment ? { attachment } : {})
  };

  const updated = current.map((item) => {
    if (item.id === id) {
      const existingReplies = item.replies || [];
      return {
        ...item,
        status: 'resolved' as const,
        replies: [newReply, ...existingReplies],
      };
    }
    return item;
  });
  saveSubmissions(updated);

  // Sync to backend SQLite
  safeApiCall(`/api/submissions/${id}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newReply)
  });

  // Automated transactional email trigger for enquiry replies
  try {
    const targetItem = current.find(item => item.id === id);
    if (targetItem && targetItem.email) {
      dispatchEnquiryReplyEmail(targetItem, replyMessage, sentBy).catch(e => console.warn('Enquiry reply dispatch notice:', e));
    }
  } catch (err) {
    console.warn('Non-blocking transactional email dispatch notice:', err);
  }
};

export const deleteSubmission = (id: string): void => {
  const current = getSubmissions();
  const updated = current.filter(item => item.id !== id);
  saveSubmissions(updated);

  // Sync to backend SQLite
  safeApiCall(`/api/submissions/${id}`, {
    method: 'DELETE'
  });
};

export const resetSubmissionsToDemo = (): FormSubmissionItem[] => {
  safeSetItem(SUBMISSIONS_KEY, JSON.stringify(INITIAL_DEMO_SUBMISSIONS));
  window.dispatchEvent(new Event('submissions_updated'));

  // Sync to backend SQLite
  safeApiCall('/api/submissions/reset', {
    method: 'POST'
  });

  return INITIAL_DEMO_SUBMISSIONS;
};


// --- SITE CONFIG SERVICE ---
export const getSiteConfig = (): SiteConfig => {
  try {
    const raw = safeGetItem(SITE_CONFIG_KEY);
    if (!raw) {
      safeSetItem(SITE_CONFIG_KEY, JSON.stringify(DEFAULT_SITE_CONFIG));
      return DEFAULT_SITE_CONFIG;
    }
    const parsed = JSON.parse(raw);
    const resolvedAppName = (!parsed.appName || parsed.appName === 'Grenada CARICOM Festival 2027') ? 'Grenada' : parsed.appName;
    const resolvedBannerText = (parsed.banner?.text || DEFAULT_SITE_CONFIG.banner.text).replace('GRENADA CARICOM FESTIVAL 2027', 'GRENADA 2027');
    return {
      ...DEFAULT_SITE_CONFIG,
      ...parsed,
      appName: resolvedAppName,
      socialLinks: { ...DEFAULT_SITE_CONFIG.socialLinks, ...(parsed.socialLinks || {}) },
      branding: { ...DEFAULT_SITE_CONFIG.branding, ...(parsed.branding || {}) },
      banner: { ...DEFAULT_SITE_CONFIG.banner, ...(parsed.banner || {}), text: resolvedBannerText },
      hero: {
        displayCount: parsed.hero?.displayCount ?? DEFAULT_SITE_CONFIG.hero?.displayCount ?? 5,
        autoplayInterval: parsed.hero?.autoplayInterval ?? DEFAULT_SITE_CONFIG.hero?.autoplayInterval ?? 4,
        images: (parsed.hero?.images && Array.isArray(parsed.hero.images) && parsed.hero.images.length > 0)
          ? parsed.hero.images
          : (DEFAULT_SITE_CONFIG.hero?.images || [])
      },
      pageImages: {
        ...DEFAULT_SITE_CONFIG.pageImages,
        ...(parsed.pageImages || {})
      }
    };
  } catch (e) {
    console.error('Error loading site config:', e);
    return DEFAULT_SITE_CONFIG;
  }
};

export const getPageImage = (key: string, defaultUrl: string): string => {
  const config = getSiteConfig();
  if (config.pageImages) {
    const customVal = (config.pageImages as any)[key];
    if (customVal && typeof customVal === 'string' && customVal.trim()) {
      return customVal.trim();
    }
    if (config.pageImages.customPageImages && config.pageImages.customPageImages[key]) {
      return config.pageImages.customPageImages[key];
    }
  }
  return defaultUrl;
};

export const updatePageImage = (key: string, newUrl: string): void => {
  const config = getSiteConfig();
  if (!config.pageImages) {
    config.pageImages = {};
  }
  (config.pageImages as any)[key] = newUrl;
  saveSiteConfig(config);
};

export const saveSiteConfig = (config: SiteConfig): void => {
  try {
    // Add/update timestamp for Last-Write-Wins conflict resolution
    const normalizedConfig: SiteConfig = {
      ...DEFAULT_SITE_CONFIG,
      ...config,
      festivalDates: {
        ...DEFAULT_SITE_CONFIG.festivalDates,
        ...(config.festivalDates || {})
      },
      socialLinks: { ...DEFAULT_SITE_CONFIG.socialLinks, ...(config.socialLinks || {}) },
      branding: { ...DEFAULT_SITE_CONFIG.branding, ...(config.branding || {}) },
      banner: { ...DEFAULT_SITE_CONFIG.banner, ...(config.banner || {}) },
      hero: {
        displayCount: config.hero?.displayCount ?? DEFAULT_SITE_CONFIG.hero?.displayCount ?? 5,
        autoplayInterval: config.hero?.autoplayInterval ?? DEFAULT_SITE_CONFIG.hero?.autoplayInterval ?? 4,
        images: (config.hero?.images && Array.isArray(config.hero.images) && config.hero.images.length > 0)
          ? config.hero.images
          : (DEFAULT_SITE_CONFIG.hero?.images || [])
      },
      pageImages: {
        ...DEFAULT_SITE_CONFIG.pageImages,
        ...(config.pageImages || {})
      },
      updatedAt: new Date().toISOString()
    };

    const success = safeSetItem(SITE_CONFIG_KEY, JSON.stringify(normalizedConfig));
    if (!success) {
      throw new Error('Write verification failed for site config');
    }
    window.dispatchEvent(new CustomEvent('site_config_updated', { detail: normalizedConfig }));

    // Sync to backend SQLite immediately
    safeApiCall('/api/site-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedConfig)
    }).catch(err => console.error('Failed to sync site config to server:', err));
  } catch (e) {
    console.error('Error saving site config:', e);
  }
};

export const exportSubmissionsCSV = (
  submissions: FormSubmissionItem[], 
  filenamePrefix: string = 'Grenada_Festival_Form_Submissions'
): void => {
  const headers = [
    'ID',
    'Type Code',
    'Category Tag',
    'Status Code',
    'Status Tag',
    'Guest Name',
    'Email',
    'Phone',
    'Topic / Pass Package',
    'Amount (GBP)',
    'Submitted Date (ISO)',
    'Submitted At (Formatted)',
    'Details / Message',
    'Metadata & Extra Tags'
  ];

  const rows = submissions.map(s => {
    const typeMeta = ALL_SUBMISSION_TYPE_TAGS[s.type] || ALL_SUBMISSION_TYPE_TAGS['contact'];
    const statusMeta = ALL_SUBMISSION_STATUS_TAGS[s.status] || ALL_SUBMISSION_STATUS_TAGS['new'];
    
    // Format metadata tags if present
    const metaString = s.extraDetails ? JSON.stringify(s.extraDetails) : '';

    return [
      s.id,
      s.type,
      `"${typeMeta.label.replace(/"/g, '""')}"`,
      s.status,
      `"${statusMeta.label.replace(/"/g, '""')}"`,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${(s.phone || '').replace(/"/g, '""')}"`,
      `"${(s.topicOrPass || '').replace(/"/g, '""')}"`,
      (s.amountGBP ?? 0).toFixed(2),
      s.submittedAt || new Date().toISOString(),
      `"${new Date(s.submittedAt).toLocaleString('en-GB').replace(/"/g, '""')}"`,
      `"${(s.messageOrDetails || '').replace(/"/g, '""')}"`,
      `"${metaString.replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Robust CSV parser that correctly handles escaped quotes, quoted newlines, and commas.
 */
export const parseCSVRows = (text: string): string[][] => {
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Skip carriage returns
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push final field/row if present
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
};

export interface ParsedCsvResult {
  validItems: FormSubmissionItem[];
  errors: string[];
  totalRows: number;
  tagCounts: Record<FormSubmissionItem['type'], number>;
  statusCounts: Record<FormSubmissionItem['status'], number>;
  totalRevenueGBP: number;
}

/**
 * Parse CSV text into validated FormSubmissionItem array with smart header detection
 * and synchronized tag normalization across all 5 categories and 3 statuses.
 */
export const parseSubmissionsCSV = (
  csvText: string,
  defaultType?: FormSubmissionItem['type']
): ParsedCsvResult => {
  const rawRows = parseCSVRows(csvText);
  if (rawRows.length < 2) {
    return {
      validItems: [],
      errors: ['The uploaded CSV file is empty or does not contain a header and data rows.'],
      totalRows: 0,
      tagCounts: { 'pass-order': 0, contact: 0, 'flight-registration': 0, 'transport-request': 0, newsletter: 0 },
      statusCounts: { new: 0, 'in-review': 0, resolved: 0 },
      totalRevenueGBP: 0
    };
  }

  const rawHeaders = rawRows[0].map(h => h.toLowerCase().trim().replace(/[\s_\-\/\(\)]/g, ''));
  const originalHeaders = rawRows[0].map(h => h.trim());
  const dataRows = rawRows.slice(1);

  // Helper to find column index from aliases
  const findCol = (aliases: string[]): number => {
    return rawHeaders.findIndex(h => aliases.some(alias => h === alias || h.includes(alias)));
  };

  const idCol = findCol(['id', 'subid', 'orderid', 'ref', 'reference', 'ordernumber', 'ticketid']);
  const typeCol = findCol(['typecode', 'type', 'categorytag', 'formtype', 'category', 'submissiontype', 'tag']);
  const statusCol = findCol(['statuscode', 'status', 'statustag', 'state', 'stage', 'lifecycle', 'paymentstatus']);
  const nameCol = findCol(['guestname', 'name', 'fullname', 'customer', 'customername', 'applicant', 'contactname', 'attendee']);
  const emailCol = findCol(['email', 'emailaddress', 'mail', 'email-address']);
  const phoneCol = findCol(['phone', 'phonenumber', 'tel', 'telephone', 'mobile', 'whatsapp', 'cell']);
  const topicCol = findCol(['topicpass', 'topicpasspackage', 'topic', 'pass', 'package', 'item', 'passtopic', 'subject', 'ticket', 'passpackage', 'tier']);
  const dateCol = findCol(['submitteddateiso', 'submittedatformatted', 'submittedat', 'submitteddate', 'date', 'createdat', 'timestamp', 'time', 'purchasedat']);
  const amountCol = findCol(['amountgbp', 'amount', 'price', 'total', 'revenue', 'cost', 'fee', 'totalpaid', 'paid']);
  const messageCol = findCol(['detailsmessage', 'message', 'details', 'notes', 'comments', 'inquiry', 'description', 'notescomments', 'specialrequests']);
  const metadataCol = findCol(['metadataextratags', 'metadata', 'customtags', 'extradetails', 'tags', 'properties']);

  const knownColIndices = new Set([idCol, typeCol, statusCol, nameCol, emailCol, phoneCol, topicCol, dateCol, amountCol, messageCol, metadataCol].filter(idx => idx >= 0));

  const validItems: FormSubmissionItem[] = [];
  const errors: string[] = [];
  const tagCounts: Record<FormSubmissionItem['type'], number> = {
    'pass-order': 0,
    contact: 0,
    'flight-registration': 0,
    'transport-request': 0,
    newsletter: 0
  };
  const statusCounts: Record<FormSubmissionItem['status'], number> = {
    new: 0,
    'in-review': 0,
    resolved: 0
  };
  let totalRevenueGBP = 0;

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    if (row.length === 0 || row.every(cell => !cell || cell.trim() === '')) return;

    const rawName = nameCol >= 0 ? row[nameCol]?.trim() : '';
    const rawEmail = emailCol >= 0 ? row[emailCol]?.trim() : '';

    if (!rawName && !rawEmail && row.length < 2) {
      errors.push(`Row ${rowNum}: Skipped row due to empty name and email.`);
      return;
    }

    // Determine type tag (handles all 5 tags identically)
    const rawType = typeCol >= 0 ? row[typeCol] : undefined;
    const determinedType = normalizeTypeTag(rawType, defaultType || 'contact');

    // Determine status tag (handles all 3 statuses identically)
    const rawStatus = statusCol >= 0 ? row[statusCol] : undefined;
    const determinedStatus = normalizeStatusTag(rawStatus, 'new');

    // Determine Amount
    let parsedAmount: number | undefined = undefined;
    if (amountCol >= 0 && row[amountCol]) {
      const cleanedAmount = row[amountCol].replace(/[^0-9.-]+/g, '');
      const num = parseFloat(cleanedAmount);
      if (!isNaN(num) && num >= 0) {
        parsedAmount = Math.round(num * 100) / 100;
      }
    }
    if (parsedAmount === undefined && determinedType === 'pass-order') {
      parsedAmount = 150; // default standard pass baseline if missing
    }

    // Determine submittedAt date
    let submittedAt = new Date().toISOString();
    if (dateCol >= 0 && row[dateCol]) {
      const parsedDate = new Date(row[dateCol]);
      if (!isNaN(parsedDate.getTime())) {
        submittedAt = parsedDate.toISOString();
      }
    }

    // Parse extra metadata tags
    let extraDetails: Record<string, string> = {};
    if (metadataCol >= 0 && row[metadataCol]) {
      const rawMeta = row[metadataCol].trim();
      if (rawMeta.startsWith('{') && rawMeta.endsWith('}')) {
        try {
          extraDetails = JSON.parse(rawMeta);
        } catch {
          extraDetails = { RawMetadata: rawMeta };
        }
      } else if (rawMeta) {
        extraDetails = { Tags: rawMeta };
      }
    }

    // Collect any additional custom columns from the CSV
    originalHeaders.forEach((headerName, hIdx) => {
      if (!knownColIndices.has(hIdx) && row[hIdx]?.trim()) {
        const key = headerName || `Column_${hIdx + 1}`;
        extraDetails[key] = row[hIdx].trim();
      }
    });

    const item: FormSubmissionItem = {
      id: (idCol >= 0 && row[idCol]?.trim()) ? row[idCol].trim() : `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: determinedType,
      name: rawName || 'Imported Guest',
      email: rawEmail || 'attendee@caricom2027.gd',
      phone: phoneCol >= 0 && row[phoneCol]?.trim() ? row[phoneCol].trim() : undefined,
      topicOrPass: topicCol >= 0 && row[topicCol]?.trim() 
        ? row[topicCol].trim() 
        : (determinedType === 'pass-order' ? 'Full Festival Pass (All-Access)' : ALL_SUBMISSION_TYPE_TAGS[determinedType].label),
      status: determinedStatus,
      submittedAt: submittedAt,
      amountGBP: parsedAmount,
      messageOrDetails: messageCol >= 0 && row[messageCol]?.trim() ? row[messageCol].trim() : undefined,
      extraDetails: Object.keys(extraDetails).length > 0 ? extraDetails : undefined
    };

    validItems.push(item);
    tagCounts[item.type] = (tagCounts[item.type] || 0) + 1;
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    if (item.amountGBP) {
      totalRevenueGBP += item.amountGBP;
    }
  });

  return {
    validItems,
    errors,
    totalRows: dataRows.length,
    tagCounts,
    statusCounts,
    totalRevenueGBP: Math.round(totalRevenueGBP * 100) / 100
  };
};

/**
 * Import parsed submissions into local storage and database
 */
export const importSubmissionsCSV = async (
  csvText: string,
  options?: {
    defaultType?: FormSubmissionItem['type'];
    mergeStrategy?: 'append' | 'upsert';
  }
): Promise<{ success: boolean; importedCount: number; errors: string[] }> => {
  const result = parseSubmissionsCSV(csvText, options?.defaultType);
  if (result.validItems.length === 0) {
    return {
      success: false,
      importedCount: 0,
      errors: result.errors.length > 0 ? result.errors : ['No valid records could be extracted from the CSV file.']
    };
  }

  const currentSubmissions = getSubmissions();
  const mergeStrategy = options?.mergeStrategy || 'append';
  let finalSubmissions: FormSubmissionItem[] = [];

  if (mergeStrategy === 'upsert') {
    const existingMap = new Map<string, FormSubmissionItem>();
    currentSubmissions.forEach(sub => existingMap.set(sub.id, sub));

    result.validItems.forEach(item => {
      existingMap.set(item.id, item);
    });

    finalSubmissions = Array.from(existingMap.values());
  } else {
    // Append strategy: ensure unique IDs
    const preparedItems = result.validItems.map((item, idx) => ({
      ...item,
      id: `sub-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`
    }));
    finalSubmissions = [...preparedItems, ...currentSubmissions];
  }

  // Sort descending by date
  finalSubmissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  // Save locally
  saveSubmissions(finalSubmissions);

  // Sync batch to server backend
  try {
    await safeApiCall('/api/submissions/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: result.validItems })
    });
  } catch (err) {
    console.warn('Backend batch sync error:', err);
  }

  return {
    success: true,
    importedCount: result.validItems.length,
    errors: result.errors
  };
};

/**
 * Generate a ready-to-fill sample CSV template with synchronized columns and complete tags
 */
export const generateSampleCSV = (mode: 'all' | 'orders' | 'forms' = 'all'): string => {
  const headers = [
    'ID',
    'Type Code',
    'Category Tag',
    'Status Code',
    'Status Tag',
    'Guest Name',
    'Email',
    'Phone',
    'Topic / Pass Package',
    'Amount (GBP)',
    'Submitted Date (ISO)',
    'Submitted At (Formatted)',
    'Details / Message',
    'Metadata & Extra Tags'
  ];
  
  let sampleRows: string[][] = [];

  if (mode === 'orders') {
    sampleRows = [
      ['ORD-2027-101', 'pass-order', 'Pass Order & Ticketing', 'resolved', 'Resolved / Confirmed', 'Marcus Sterling', 'marcus.sterling@uk-finance.co.uk', '+44 7700 900123', 'VIP Diamond All-Access Pass (4-Day)', '495.00', '2026-08-10T14:30:00.000Z', '10/08/2026, 15:30', 'Includes private catamaran transfer and VIP lounge wristbands.', '{"OrderRef":"ORD-2027-101","Tier":"VIP Diamond","Wristbands":"2"}'],
      ['ORD-2027-102', 'pass-order', 'Pass Order & Ticketing', 'new', 'New / Unprocessed', 'Elena Rostova', 'elena.rostova@caribbeantravel.de', '+49 151 2345678', 'Weekend Carnival Hopper Pass', '225.00', '2026-08-14T09:15:00.000Z', '14/08/2026, 10:15', '2x Weekend Hopper passes. Requested vegetarian catering options.', '{"OrderRef":"ORD-2027-102","Dietary":"Vegetarian"}'],
      ['ORD-2027-103', 'pass-order', 'Pass Order & Ticketing', 'in-review', 'In Review / In Progress', 'David Baptiste', 'david.b@spiceisle-enterprises.gd', '+1 473 440 2233', 'Opening Gala & Heritage Pass', '150.00', '2026-08-15T11:00:00.000Z', '15/08/2026, 12:00', 'Corporate hospitality booking for 5 delegates.', '{"OrderRef":"ORD-2027-103","Seats":"5"}']
    ];
  } else if (mode === 'forms') {
    sampleRows = [
      ['SUB-2027-201', 'contact', 'Contact Inquiry', 'new', 'New / Unprocessed', 'Sophia Chen', 'sophia.chen@globalarts.org', '+1 416 555 0199', 'Cultural Workshop Enquiry', '0.00', '2026-08-12T16:45:00.000Z', '12/08/2026, 17:45', 'Interested in hosting a Caribbean pan jazz youth workshop during festival week.', '{"Department":"Arts & Culture"}'],
      ['SUB-2027-202', 'flight-registration', 'Flight Registration', 'resolved', 'Resolved / Confirmed', 'Captain Liam O\'Connor', 'liam.oc@aerocrew.ie', '+353 87 123 4567', 'BA2157 to GND Airport', '0.00', '2026-08-13T18:20:00.000Z', '13/08/2026, 19:20', 'Arriving Maurice Bishop International GND on July 28 at 16:40 with party of 4.', '{"FlightNumber":"BA2157","Airline":"British Airways","ArrivalAirport":"GND"}'],
      ['SUB-2027-203', 'transport-request', 'Airport & Hotel Shuttle', 'in-review', 'In Review / In Progress', 'Amara Adebayo', 'amara.adebayo@lagos-media.ng', '+234 802 345 6789', 'Airport Executive Shuttle', '65.00', '2026-08-14T12:10:00.000Z', '14/08/2026, 13:10', 'Requires VIP direct transfer from GND Airport to Silversands Resort Grand Anse.', '{"PickupLocation":"GND Airport","DropoffLocation":"Silversands Resort"}'],
      ['SUB-2027-204', 'newsletter', 'VIP Newsletter Subscriber', 'resolved', 'Resolved / Confirmed', 'Chloe Beauchamp', 'chloe.beauchamp@paris-culture.fr', '+33 6 12 34 56 78', 'VIP Newsletter Subscription', '0.00', '2026-08-15T08:00:00.000Z', '15/08/2026, 09:00', 'Subscribed for London DJ headline lineup drops and ticket priority alerts.', '{"Source":"Website Footer"}']
    ];
  } else {
    // Complete synchronized sample with all 5 tags
    sampleRows = [
      ['ORD-2027-101', 'pass-order', 'Pass Order & Ticketing', 'resolved', 'Resolved / Confirmed', 'Marcus Sterling', 'marcus.sterling@uk-finance.co.uk', '+44 7700 900123', 'VIP Diamond All-Access Pass (4-Day)', '495.00', '2026-08-10T14:30:00.000Z', '10/08/2026, 15:30', 'Includes private catamaran transfer and VIP lounge wristbands.', '{"Tier":"VIP Diamond"}'],
      ['SUB-2027-201', 'contact', 'Contact Inquiry', 'new', 'New / Unprocessed', 'Sophia Chen', 'sophia.chen@globalarts.org', '+1 416 555 0199', 'Cultural Workshop Enquiry', '0.00', '2026-08-12T16:45:00.000Z', '12/08/2026, 17:45', 'Interested in hosting a Caribbean pan jazz youth workshop.', '{"Category":"Education"}'],
      ['SUB-2027-202', 'flight-registration', 'Flight Registration', 'resolved', 'Resolved / Confirmed', 'Liam O\'Connor', 'liam.oc@aerocrew.ie', '+353 87 123 4567', 'BA2157 (LGW -> GND)', '0.00', '2026-08-13T18:20:00.000Z', '13/08/2026, 19:20', 'Arriving Maurice Bishop GND Airport on July 28 with party of 4.', '{"FlightNumber":"BA2157","Airline":"British Airways"}'],
      ['SUB-2027-203', 'transport-request', 'Airport & Hotel Shuttle', 'in-review', 'In Review / In Progress', 'Amara Adebayo', 'amara.adebayo@lagos-media.ng', '+234 802 345 6789', 'Executive Airport Shuttle', '65.00', '2026-08-14T12:10:00.000Z', '14/08/2026, 13:10', 'VIP transfer from GND Airport to Grand Anse.', '{"ShuttleRoute":"GND to Grand Anse"}'],
      ['SUB-2027-204', 'newsletter', 'VIP Newsletter Subscriber', 'resolved', 'Resolved / Confirmed', 'Chloe Beauchamp', 'chloe.beauchamp@paris-culture.fr', '+33 6 12 34 56 78', 'VIP Newsletter Subscription', '0.00', '2026-08-15T08:00:00.000Z', '15/08/2026, 09:00', 'Subscribed for London DJ headline lineup drops.', '{"Source":"Website Footer"}']
    ];
  }

  const formattedRows = sampleRows.map(r => [
    r[0],
    r[1],
    `"${r[2].replace(/"/g, '""')}"`,
    r[3],
    `"${r[4].replace(/"/g, '""')}"`,
    `"${r[5].replace(/"/g, '""')}"`,
    `"${r[6].replace(/"/g, '""')}"`,
    `"${r[7].replace(/"/g, '""')}"`,
    `"${r[8].replace(/"/g, '""')}"`,
    r[9],
    r[10],
    `"${r[11].replace(/"/g, '""')}"`,
    `"${r[12].replace(/"/g, '""')}"`,
    `"${r[13].replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...formattedRows.map(r => r.join(','))].join('\n');
};

/**
 * Trigger download of ready-to-fill sample CSV template
 */
export const downloadSampleCSV = (mode: 'all' | 'orders' | 'forms' = 'all'): void => {
  const content = generateSampleCSV(mode);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const label = mode === 'orders' ? 'Pass_Orders' : mode === 'forms' ? 'Received_Forms' : 'All_Tags_Unified';
  link.setAttribute('download', `Grenada_Festival_Template_${label}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


// --- EVENTS SERVICE ---
export const getEvents = (): EventItem[] => {
  try {
    const raw = safeGetItem(EVENTS_KEY);
    if (!raw) {
      safeSetItem(EVENTS_KEY, JSON.stringify(FESTIVAL_EVENTS));
      return FESTIVAL_EVENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading events:', e);
    return FESTIVAL_EVENTS;
  }
};

export const saveEvents = (events: EventItem[]): void => {
  try {
    const success = safeSetItem(EVENTS_KEY, JSON.stringify(events));
    if (!success) {
      throw new Error('Write verification failed for events');
    }
    window.dispatchEvent(new Event('events_updated'));

    // Sync to backend SQLite
    safeApiCall('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events)
    });
  } catch (e) {
    console.error('Error saving events:', e);
  }
};


// --- GALLERY SERVICE ---
export const getGalleryItems = (): GalleryItem[] => {
  try {
    const raw = safeGetItem(GALLERY_KEY);
    if (!raw) {
      safeSetItem(GALLERY_KEY, JSON.stringify(GALLERY_ITEMS));
      return GALLERY_ITEMS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading gallery items:', e);
    return GALLERY_ITEMS;
  }
};

export const saveGalleryItems = (items: GalleryItem[]): void => {
  try {
    const success = safeSetItem(GALLERY_KEY, JSON.stringify(items));
    if (!success) {
      throw new Error('Write verification failed for gallery items');
    }
    window.dispatchEvent(new Event('gallery_updated'));

    // Sync to backend SQLite
    safeApiCall('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });
  } catch (e) {
    console.error('Error saving gallery items:', e);
  }
};


// --- HOTELS SERVICE ---
export const getHotels = (): HotelItem[] => {
  try {
    const raw = safeGetItem(HOTELS_KEY);
    if (!raw) {
      safeSetItem(HOTELS_KEY, JSON.stringify(FESTIVAL_HOTELS));
      return FESTIVAL_HOTELS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading hotels:', e);
    return FESTIVAL_HOTELS;
  }
};

export const saveHotels = (hotels: HotelItem[]): void => {
  try {
    const success = safeSetItem(HOTELS_KEY, JSON.stringify(hotels));
    if (!success) {
      throw new Error('Write verification failed for hotels');
    }
    window.dispatchEvent(new Event('hotels_updated'));

    // Sync to backend SQLite
    safeApiCall('/api/hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hotels)
    });
  } catch (e) {
    console.error('Error saving hotels:', e);
  }
};


// --- PASSES SERVICE ---
export const getPasses = (): PassItem[] => {
  try {
    const raw = safeGetItem(PASSES_KEY);
    if (!raw) {
      safeSetItem(PASSES_KEY, JSON.stringify(FESTIVAL_PASSES));
      return FESTIVAL_PASSES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading passes:', e);
    return FESTIVAL_PASSES;
  }
};

export const savePasses = (passes: PassItem[]): void => {
  try {
    const success = safeSetItem(PASSES_KEY, JSON.stringify(passes));
    if (!success) {
      throw new Error('Write verification failed for passes');
    }
    window.dispatchEvent(new Event('passes_updated'));

    // Sync to backend SQLite
    safeApiCall('/api/passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passes)
    });
  } catch (e) {
    console.error('Error saving passes:', e);
  }
};


// --- TESTIMONIALS SERVICE ---
export const getTestimonials = (): TestimonialItem[] => {
  try {
    const raw = safeGetItem(TESTIMONIALS_KEY);
    if (!raw) {
      safeSetItem(TESTIMONIALS_KEY, JSON.stringify(FESTIVAL_TESTIMONIALS));
      return FESTIVAL_TESTIMONIALS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading testimonials:', e);
    return FESTIVAL_TESTIMONIALS;
  }
};

export const saveTestimonials = (testimonials: TestimonialItem[]): void => {
  try {
    const success = safeSetItem(TESTIMONIALS_KEY, JSON.stringify(testimonials));
    if (!success) {
      throw new Error('Write verification failed for testimonials');
    }
    window.dispatchEvent(new Event('testimonials_updated'));

    // Sync to backend SQLite
    safeApiCall('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testimonials)
    });
  } catch (e) {
    console.error('Error saving testimonials:', e);
  }
};


// --- MEDIA SERVICE ---
export const getMediaItems = (): MediaItem[] => {
  try {
    const raw = safeGetItem(MEDIA_KEY);
    if (!raw) {
      const sortedSeed = [...INITIAL_DEMO_MEDIA].sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
      safeSetItem(MEDIA_KEY, JSON.stringify(sortedSeed));
      return sortedSeed;
    }
    const items: MediaItem[] = JSON.parse(raw);
    items.sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
    return items;
  } catch (e) {
    console.error('Error loading media items:', e);
    return INITIAL_DEMO_MEDIA;
  }
};

export const saveMediaItems = (items: MediaItem[]): void => {
  try {
    const sorted = [...items].sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
    const success = safeSetItem(MEDIA_KEY, JSON.stringify(sorted));
    if (!success) {
      throw new Error('Write verification failed for media items');
    }
    window.dispatchEvent(new Event('media_updated'));
  } catch (e) {
    console.error('Error saving media items:', e);
  }
};

export const addMediaItem = async (item: MediaItem): Promise<boolean> => {
  try {
    // Sync to backend SQLite first
    const res = await safeApiCall('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });

    if (res && res.ok) {
      const current = getMediaItems();
      const updated = [item, ...current.filter(i => i.id !== item.id)];
      saveMediaItems(updated);
      return true;
    } else {
      console.error('Server rejected the media item, status:', res?.status);
      return false;
    }
  } catch (err) {
    console.error('Error in addMediaItem:', err);
    return false;
  }
};

export const deleteMediaItem = (id: string): void => {
  const current = getMediaItems();
  const updated = current.filter(item => item.id !== id);
  saveMediaItems(updated);

  // Sync to backend SQLite
  safeApiCall(`/api/media/${id}`, {
    method: 'DELETE'
  });
};

export const deleteMultipleMediaItems = (ids: string[]): void => {
  if (!ids.length) return;
  const current = getMediaItems();
  const idSet = new Set(ids);
  const updated = current.filter(item => !idSet.has(item.id));
  saveMediaItems(updated);

  // Sync each to backend SQLite
  ids.forEach(id => {
    safeApiCall(`/api/media/${id}`, {
      method: 'DELETE'
    });
  });
};

// --- UNUSED MEDIA & AUTO-CLEANUP SERVICES ---
export const getMediaUsageMap = (): Record<string, string[]> => {
  const usageMap: Record<string, string[]> = {};

  const addUsage = (rawUrl: any, label: string) => {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    const url = rawUrl.trim();
    if (!url) return;

    if (!usageMap[url]) {
      usageMap[url] = [];
    }
    if (!usageMap[url].includes(label)) {
      usageMap[url].push(label);
    }
  };

  try {
    // 1. Site Config
    const config = getSiteConfig();
    if (config) {
      if (config.appLogoUrl) addUsage(config.appLogoUrl, 'Site Logo');
      if (config.appFaviconUrl) addUsage(config.appFaviconUrl, 'Favicon');
      if (config.footer?.logoUrl) addUsage(config.footer.logoUrl, 'Footer Logo');
      if (config.hero?.videoUrl) addUsage(config.hero.videoUrl, 'Hero Video Background');

      if (Array.isArray(config.hero?.images)) {
        config.hero.images.forEach((img: any) => {
          if (img?.url) addUsage(img.url, 'Hero Slideshow');
        });
      }

      if (config.pageImages && typeof config.pageImages === 'object') {
        Object.entries(config.pageImages).forEach(([key, url]) => {
          if (url && typeof url === 'string') {
            const prettyName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            addUsage(url, `Page Banner (${prettyName})`);
          }
        });
      }
    }

    // 2. Events
    const events = getEvents();
    if (Array.isArray(events)) {
      events.forEach((e: any) => {
        const title = e.title || e.name || 'Event';
        if (e.imageUrl) addUsage(e.imageUrl, `Event Cover: ${title}`);
        if (e.bannerUrl) addUsage(e.bannerUrl, `Event Banner: ${title}`);
        if (Array.isArray(e.gallery)) {
          e.gallery.forEach((gUrl: any) => {
            if (typeof gUrl === 'string') addUsage(gUrl, `Event Gallery: ${title}`);
            else if (gUrl?.url) addUsage(gUrl.url, `Event Gallery: ${title}`);
          });
        }
      });
    }

    // 3. Gallery Items
    const gallery = getGalleryItems();
    if (Array.isArray(gallery)) {
      gallery.forEach((g: any) => {
        const title = g.title || g.caption || 'Gallery Photo';
        if (g.imageUrl) addUsage(g.imageUrl, `Gallery: ${title}`);
        if (g.url) addUsage(g.url, `Gallery: ${title}`);
        if (g.thumbnailUrl) addUsage(g.thumbnailUrl, `Gallery Thumbnail: ${title}`);
      });
    }

    // 4. Hotels
    const hotels = getHotels();
    if (Array.isArray(hotels)) {
      hotels.forEach((h: any) => {
        const name = h.name || h.title || 'Hotel';
        if (h.imageUrl) addUsage(h.imageUrl, `Hotel Cover: ${name}`);
        if (Array.isArray(h.images)) {
          h.images.forEach((imgUrl: any) => {
            if (typeof imgUrl === 'string') addUsage(imgUrl, `Hotel Gallery: ${name}`);
            else if (imgUrl?.url) addUsage(imgUrl.url, `Hotel Gallery: ${name}`);
          });
        }
      });
    }

    // 5. Testimonials
    const testimonials = getTestimonials();
    if (Array.isArray(testimonials)) {
      testimonials.forEach((t: any) => {
        const name = t.name || t.author || 'Guest';
        if (t.avatarUrl) addUsage(t.avatarUrl, `Testimonial Avatar: ${name}`);
        if (t.imageUrl) addUsage(t.imageUrl, `Testimonial Photo: ${name}`);
      });
    }

    // 6. Passes
    const passes = getPasses();
    if (Array.isArray(passes)) {
      passes.forEach((p: any) => {
        const title = p.title || p.name || 'Festival Pass';
        if (p.imageUrl) addUsage(p.imageUrl, `Pass Cover: ${title}`);
        if (p.badgeUrl) addUsage(p.badgeUrl, `Pass Badge: ${title}`);
      });
    }

    // 7. Submissions (Forms, Vendor Logos, Performer Photos, Orders, Attachments)
    const submissions = getSubmissions();
    if (Array.isArray(submissions)) {
      submissions.forEach((sub: any) => {
        const sender = sub.name || sub.formData?.fullName || sub.formData?.companyName || sub.email || sub.id;
        const subType = sub.type ? sub.type.toUpperCase() : 'FORM';
        const label = `Submission (${subType}): ${sender}`;

        if (sub.formData) {
          Object.entries(sub.formData).forEach(([k, val]) => {
            if (typeof val === 'string' && (val.startsWith('/uploads/') || val.startsWith('http') || val.startsWith('data:'))) {
              addUsage(val, `${label} [${k}]`);
            }
          });
        }
        if (Array.isArray(sub.attachments)) {
          sub.attachments.forEach((att: any) => {
            if (typeof att === 'string') addUsage(att, `${label} [Attachment]`);
            else if (att?.url) addUsage(att.url, `${label} [Attachment]`);
          });
        }
      });
    }

    // 8. Deep Search fallback across all stringified entities
    const allMedia = getMediaItems();
    if (Array.isArray(allMedia)) {
      const configStr = JSON.stringify(config || {});
      const eventsStr = JSON.stringify(events || []);
      const galleryStr = JSON.stringify(gallery || []);
      const hotelsStr = JSON.stringify(hotels || []);
      const testimonialsStr = JSON.stringify(testimonials || []);
      const passesStr = JSON.stringify(passes || []);
      const subStr = JSON.stringify(submissions || []);

      allMedia.forEach(m => {
        if (!m.url) return;
        const url = m.url;
        const filename = m.name || url.split('/').pop() || '';

        if (!usageMap[url] || usageMap[url].length === 0) {
          if (configStr.includes(url) || (filename && configStr.includes(filename))) {
            addUsage(url, 'Site Config');
          }
          if (eventsStr.includes(url) || (filename && eventsStr.includes(filename))) {
            addUsage(url, 'Events Collection');
          }
          if (galleryStr.includes(url) || (filename && galleryStr.includes(filename))) {
            addUsage(url, 'Gallery Collection');
          }
          if (hotelsStr.includes(url) || (filename && hotelsStr.includes(filename))) {
            addUsage(url, 'Hotels Listing');
          }
          if (testimonialsStr.includes(url) || (filename && testimonialsStr.includes(filename))) {
            addUsage(url, 'Guest Testimonials');
          }
          if (passesStr.includes(url) || (filename && passesStr.includes(filename))) {
            addUsage(url, 'Festival Passes');
          }
          if (subStr.includes(url) || (filename && subStr.includes(filename))) {
            addUsage(url, 'Form Submissions');
          }
        }
      });
    }
  } catch (err) {
    console.error('Error computing media usage map:', err);
  }

  return usageMap;
};

export const getAllUsedMediaUrls = (): Set<string> => {
  const map = getMediaUsageMap();
  return new Set(Object.keys(map).filter(url => map[url] && map[url].length > 0));
};

export const getUnusedMediaItems = (olderThanDays?: number): MediaItem[] => {
  const usedUrls = getAllUsedMediaUrls();
  const allMedia = getMediaItems();

  return allMedia.filter(item => {
    const isUsed = usedUrls.has(item.url);
    if (isUsed) return false;

    if (olderThanDays !== undefined && olderThanDays > 0) {
      const uploadTime = new Date(item.uploadedAt).getTime();
      const ageMs = Date.now() - uploadTime;
      const thresholdMs = olderThanDays * 86400000;
      return ageMs >= thresholdMs;
    }

    return true;
  });
};

export interface AutoCleanupConfig {
  enabled: boolean;
  ageInDays: number; // 0 = immediate/any age, 1 = 1 day, 7 = 7 days, 30 = 30 days, or custom N
  lastRunTimestamp?: string;
}

const AUTO_CLEANUP_KEY = 'grenada_caricom_auto_cleanup_config_v1';

export const getAutoCleanupConfig = (): AutoCleanupConfig => {
  try {
    const raw = safeGetItem(AUTO_CLEANUP_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading auto cleanup config:', e);
  }
  return { enabled: false, ageInDays: 7 };
};

export const saveAutoCleanupConfig = (config: AutoCleanupConfig): void => {
  try {
    safeSetItem(AUTO_CLEANUP_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving auto cleanup config:', e);
  }
};

export const performUnusedMediaCleanup = (olderThanDays: number = 0): { deletedCount: number; freedBytes: number } => {
  const unusedItems = getUnusedMediaItems(olderThanDays);
  if (!unusedItems.length) {
    return { deletedCount: 0, freedBytes: 0 };
  }

  const idsToDelete = unusedItems.map(item => item.id);
  const freedBytes = unusedItems.reduce((acc, item) => acc + (item.compressedSize || item.originalSize || 0), 0);

  deleteMultipleMediaItems(idsToDelete);

  return { deletedCount: idsToDelete.length, freedBytes };
};

export const checkAndRunAutoCleanup = (): { executed: boolean; deletedCount: number; freedBytes: number } => {
  const config = getAutoCleanupConfig();
  if (!config.enabled) {
    return { executed: false, deletedCount: 0, freedBytes: 0 };
  }

  const now = Date.now();
  const lastRun = config.lastRunTimestamp ? new Date(config.lastRunTimestamp).getTime() : 0;
  const TWELVE_HOURS = 12 * 3600 * 1000;

  if (now - lastRun >= TWELVE_HOURS) {
    const result = performUnusedMediaCleanup(config.ageInDays);
    config.lastRunTimestamp = new Date().toISOString();
    saveAutoCleanupConfig(config);
    return { executed: true, ...result };
  }

  return { executed: false, deletedCount: 0, freedBytes: 0 };
};


// --- GLOBAL RESET ---
export const resetAllDynamicDataToDefault = (): void => {
  try {
    safeRemoveItem(EVENTS_KEY);
    safeRemoveItem(GALLERY_KEY);
    safeRemoveItem(HOTELS_KEY);
    safeRemoveItem(PASSES_KEY);
    safeRemoveItem(TESTIMONIALS_KEY);
    safeRemoveItem(MEDIA_KEY);

    // Validate that removal succeeded before triggering broadcasts
    if (
      safeGetItem(EVENTS_KEY) !== null ||
      safeGetItem(GALLERY_KEY) !== null ||
      safeGetItem(HOTELS_KEY) !== null ||
      safeGetItem(PASSES_KEY) !== null ||
      safeGetItem(TESTIMONIALS_KEY) !== null ||
      safeGetItem(MEDIA_KEY) !== null
    ) {
      throw new Error('Verification failed: One or more localStorage keys were not deleted');
    }

    window.dispatchEvent(new Event('events_updated'));
    window.dispatchEvent(new Event('gallery_updated'));
    window.dispatchEvent(new Event('hotels_updated'));
    window.dispatchEvent(new Event('passes_updated'));
    window.dispatchEvent(new Event('testimonials_updated'));
    window.dispatchEvent(new Event('media_updated'));

    // Trigger SQLite seed resets
    safeApiCall('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FESTIVAL_EVENTS)
    });
    safeApiCall('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(GALLERY_ITEMS)
    });
    safeApiCall('/api/hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FESTIVAL_HOTELS)
    });
    safeApiCall('/api/passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FESTIVAL_PASSES)
    });
    safeApiCall('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FESTIVAL_TESTIMONIALS)
    });
  } catch (e) {
    console.error('Error resetting all dynamic data:', e);
  }
};
