import { FormSubmissionItem, SiteConfig, EventItem, HotelItem, PassItem, GalleryItem, MediaItem } from '../types';
import { FESTIVAL_EVENTS, FESTIVAL_HOTELS, FESTIVAL_PASSES } from '../data/festivalData';
import { GALLERY_ITEMS } from '../data/galleryData';

const SUBMISSIONS_KEY = 'grenada_caricom_submissions_v1';
const SITE_CONFIG_KEY = 'grenada_caricom_site_config_v1';
const EVENTS_KEY = 'grenada_caricom_events_v2';
const GALLERY_KEY = 'grenada_caricom_gallery_v2';
const HOTELS_KEY = 'grenada_caricom_hotels_v2';
const PASSES_KEY = 'grenada_caricom_passes_v2';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
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
    bgTone: 'dark-onyx',
    headingFont: 'Poppins',
    bodyFont: 'Inter',
  },
  banner: {
    enabled: true,
    text: '🔥 GRENADA CARICOM FESTIVAL 2027 • EARLY BIRD VIP WRISTBANDS 85% SOLD OUT • MAY 13 - 17, 2027',
    bgColor: '#10B981', // Emerald green
  },
  adminPath: 'admin',
  adminPassword: '2027',
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
    status: 'new',
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    extraDetails: { Country: 'United Kingdom', GroupSize: '8 Guests' }
  },
  {
    id: 'sub-102',
    type: 'flight-registration',
    name: 'Marcus Thorne',
    email: 'm.thorne@gmail.com',
    phone: '+1 305 555 0192',
    topicOrPass: 'British Airways BA2158',
    messageOrDetails: 'Arriving May 12th at 14:45. Staying at Royalton Grenada. Requesting airport shuttle transfer for 2 adults with 3 large suitcases.',
    status: 'in-review',
    submittedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    amountGBP: 120,
    extraDetails: { Airline: 'British Airways', FlightNum: 'BA2158', Hotel: 'Royalton Grenada Resort' }
  },
  {
    id: 'sub-103',
    type: 'pass-order',
    name: 'David & Alicia Boyce',
    email: 'david.boyce@caribbean-travel.org',
    phone: '+1 473 405 9911',
    topicOrPass: '10-Day All-Access VIP Gold Pass x2',
    messageOrDetails: 'Confirmed payment via card. Requesting custom wristband sizing and priority access to the White Gala Beach Fete.',
    status: 'resolved',
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    amountGBP: 900,
    extraDetails: { Reference: 'GCF-2027-88219', PaymentStatus: 'PAID' }
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

export const getSubmissions = (): FormSubmissionItem[] => {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    if (!raw) {
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(INITIAL_DEMO_SUBMISSIONS));
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
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
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
  return newSub;
};

export const updateSubmissionStatus = (id: string, status: 'new' | 'in-review' | 'resolved'): void => {
  const current = getSubmissions();
  const updated = current.map(item => item.id === id ? { ...item, status } : item);
  saveSubmissions(updated);
};

export const deleteSubmission = (id: string): void => {
  const current = getSubmissions();
  const updated = current.filter(item => item.id !== id);
  saveSubmissions(updated);
};

export const resetSubmissionsToDemo = (): FormSubmissionItem[] => {
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(INITIAL_DEMO_SUBMISSIONS));
  window.dispatchEvent(new Event('submissions_updated'));
  return INITIAL_DEMO_SUBMISSIONS;
};

export const getSiteConfig = (): SiteConfig => {
  try {
    const raw = localStorage.getItem(SITE_CONFIG_KEY);
    if (!raw) {
      localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(DEFAULT_SITE_CONFIG));
      return DEFAULT_SITE_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SITE_CONFIG,
      ...parsed,
      socialLinks: { ...DEFAULT_SITE_CONFIG.socialLinks, ...(parsed.socialLinks || {}) },
      branding: { ...DEFAULT_SITE_CONFIG.branding, ...(parsed.branding || {}) },
      banner: { ...DEFAULT_SITE_CONFIG.banner, ...(parsed.banner || {}) },
    };
  } catch (e) {
    console.error('Error loading site config:', e);
    return DEFAULT_SITE_CONFIG;
  }
};

export const saveSiteConfig = (config: SiteConfig): void => {
  try {
    localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('site_config_updated', { detail: config }));
  } catch (e) {
    console.error('Error saving site config:', e);
  }
};

export const exportSubmissionsCSV = (submissions: FormSubmissionItem[]): void => {
  const headers = ['ID', 'Type', 'Name', 'Email', 'Phone', 'Topic/Pass', 'Status', 'Submitted At', 'Amount (GBP)', 'Details/Message'];
  const rows = submissions.map(s => [
    s.id,
    s.type,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${(s.email || '').replace(/"/g, '""')}"`,
    `"${(s.phone || '').replace(/"/g, '""')}"`,
    `"${(s.topicOrPass || '').replace(/"/g, '""')}"`,
    s.status,
    new Date(s.submittedAt).toLocaleString(),
    s.amountGBP ?? 0,
    `"${(s.messageOrDetails || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Grenada_Festival_Form_Submissions_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getEvents = (): EventItem[] => {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(FESTIVAL_EVENTS));
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
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    window.dispatchEvent(new Event('events_updated'));
  } catch (e) {
    console.error('Error saving events:', e);
  }
};

export const getGalleryItems = (): GalleryItem[] => {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    if (!raw) {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(GALLERY_ITEMS));
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
    localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('gallery_updated'));
  } catch (e) {
    console.error('Error saving gallery items:', e);
  }
};

export const getHotels = (): HotelItem[] => {
  try {
    const raw = localStorage.getItem(HOTELS_KEY);
    if (!raw) {
      localStorage.setItem(HOTELS_KEY, JSON.stringify(FESTIVAL_HOTELS));
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
    localStorage.setItem(HOTELS_KEY, JSON.stringify(hotels));
    window.dispatchEvent(new Event('hotels_updated'));
  } catch (e) {
    console.error('Error saving hotels:', e);
  }
};

export const getPasses = (): PassItem[] => {
  try {
    const raw = localStorage.getItem(PASSES_KEY);
    if (!raw) {
      localStorage.setItem(PASSES_KEY, JSON.stringify(FESTIVAL_PASSES));
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
    localStorage.setItem(PASSES_KEY, JSON.stringify(passes));
    window.dispatchEvent(new Event('passes_updated'));
  } catch (e) {
    console.error('Error saving passes:', e);
  }
};

export const resetAllDynamicDataToDefault = (): void => {
  try {
    localStorage.removeItem(EVENTS_KEY);
    localStorage.removeItem(GALLERY_KEY);
    localStorage.removeItem(HOTELS_KEY);
    localStorage.removeItem(PASSES_KEY);
    window.dispatchEvent(new Event('events_updated'));
    window.dispatchEvent(new Event('gallery_updated'));
    window.dispatchEvent(new Event('hotels_updated'));
    window.dispatchEvent(new Event('passes_updated'));
  } catch (e) {
    console.error('Error resetting all dynamic data:', e);
  }
};

const MEDIA_KEY = 'grenada_caricom_media_v2';

export const INITIAL_DEMO_MEDIA: MediaItem[] = [
  {
    id: 'media-1',
    name: 'Soca Monarch Live Concert.jpg',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80',
    originalSize: 1048576,
    compressedSize: 184320,
    type: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'media-2',
    name: 'Grand Anse Beach Sunrise.jpg',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80',
    originalSize: 2097152,
    compressedSize: 245760,
    type: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'media-3',
    name: 'Royalton Grenada Resort.jpg',
    url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80',
    originalSize: 1572864,
    compressedSize: 153600,
    type: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'media-4',
    name: 'Spiceland Mall Excursion.jpg',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80',
    originalSize: 3145728,
    compressedSize: 327680,
    type: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export const getMediaItems = (): MediaItem[] => {
  try {
    const raw = localStorage.getItem(MEDIA_KEY);
    if (!raw) {
      localStorage.setItem(MEDIA_KEY, JSON.stringify(INITIAL_DEMO_MEDIA));
      return INITIAL_DEMO_MEDIA;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading media items:', e);
    return INITIAL_DEMO_MEDIA;
  }
};

export const saveMediaItems = (items: MediaItem[]): void => {
  try {
    localStorage.setItem(MEDIA_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('media_updated'));
  } catch (e) {
    console.error('Error saving media items:', e);
  }
};

export const addMediaItem = (item: MediaItem): void => {
  const current = getMediaItems();
  const updated = [item, ...current];
  saveMediaItems(updated);
};

export const deleteMediaItem = (id: string): void => {
  const current = getMediaItems();
  const updated = current.filter(item => item.id !== id);
  saveMediaItems(updated);
};


