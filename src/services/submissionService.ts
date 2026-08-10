import { FormSubmissionItem, SubmissionReply, SiteConfig, EventItem, HotelItem, PassItem, GalleryItem, MediaItem, TestimonialItem } from '../types';
import { FESTIVAL_EVENTS, FESTIVAL_HOTELS, FESTIVAL_PASSES, FESTIVAL_TESTIMONIALS, FESTIVAL_IMAGES } from '../data/festivalData';
import { GALLERY_ITEMS } from '../data/galleryData';

const SUBMISSIONS_KEY = 'grenada_caricom_submissions_v1';
const SITE_CONFIG_KEY = 'grenada_caricom_site_config_v1';
const EVENTS_KEY = 'grenada_caricom_events_v4';
const GALLERY_KEY = 'grenada_caricom_gallery_v3';
const HOTELS_KEY = 'grenada_caricom_hotels_v2';
const PASSES_KEY = 'grenada_caricom_passes_v2';
const TESTIMONIALS_KEY = 'grenada_caricom_testimonials_v2';
const MEDIA_KEY = 'grenada_caricom_media_v2';

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
    secondaryColor: '#10B981', // Royal Emerald
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
    messageOrDetails: 'Arriving May 13th at 15:20. Staying at Royalton Grenada. Requesting airport shuttle transfer for 2 adults with 4 suitcases.',
    status: 'resolved',
    submittedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    extraDetails: { Airline: 'Virgin Atlantic', FlightNum: 'VS141', Arrival: '2027-05-13 15:20', Departure: '2027-05-23 19:40', Hotel: 'Royalton Grenada Resort & Spa' }
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
    extraDetails: { Airline: 'British Airways', FlightNum: 'BA2158', Arrival: '2027-05-12 14:45', Departure: '2027-05-22 17:30', Hotel: 'Royalton Grenada Resort & Spa' }
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
    messageOrDetails: 'Arriving May 13th at 16:10. Staying at Mount Cinnamon Grenada Resort. Requested private SUV transfer.',
    status: 'resolved',
    submittedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    extraDetails: { Airline: 'American Airlines', FlightNum: 'AA1148', Arrival: '2027-05-13 16:10', Departure: '2027-05-23 11:20', Hotel: 'Mount Cinnamon Resort' }
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

// --- Dual Local-First SQLite Synchronizer ---
async function syncWithDatabase() {
  try {
    // 1. Sync Site Config
    const resConfig = await fetch('/api/site-config');
    if (resConfig.ok) {
      const config = await resConfig.json();
      localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(config));
      window.dispatchEvent(new CustomEvent('site_config_updated', { detail: config }));
    }

    // 2. Sync Submissions
    const resSubs = await fetch('/api/submissions');
    if (resSubs.ok) {
      const subs = await resSubs.json();
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(subs));
      window.dispatchEvent(new Event('submissions_updated'));
    }

    // 3. Sync Events
    const resEvents = await fetch('/api/events');
    if (resEvents.ok) {
      const events = await resEvents.json();
      localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
      window.dispatchEvent(new Event('events_updated'));
    }

    // 4. Sync Gallery
    const resGallery = await fetch('/api/gallery');
    if (resGallery.ok) {
      const gallery = await resGallery.json();
      localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
      window.dispatchEvent(new Event('gallery_updated'));
    }

    // 5. Sync Hotels
    const resHotels = await fetch('/api/hotels');
    if (resHotels.ok) {
      const hotels = await resHotels.json();
      localStorage.setItem(HOTELS_KEY, JSON.stringify(hotels));
      window.dispatchEvent(new Event('hotels_updated'));
    }

    // 6. Sync Passes
    const resPasses = await fetch('/api/passes');
    if (resPasses.ok) {
      const passes = await resPasses.json();
      localStorage.setItem(PASSES_KEY, JSON.stringify(passes));
      window.dispatchEvent(new Event('passes_updated'));
    }

    // 7. Sync Testimonials
    const resTestimonials = await fetch('/api/testimonials');
    if (resTestimonials.ok) {
      const testimonials = await resTestimonials.json();
      localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(testimonials));
      window.dispatchEvent(new Event('testimonials_updated'));
    }

    // 8. Sync Media
    const resMedia = await fetch('/api/media');
    if (resMedia.ok) {
      const media = await resMedia.json();
      localStorage.setItem(MEDIA_KEY, JSON.stringify(media));
      window.dispatchEvent(new Event('media_updated'));
    }
  } catch (err) {
    console.error('Error background syncing with SQLite:', err);
  }
}

// Automatically trigger sync on client import
if (typeof window !== 'undefined') {
  setTimeout(syncWithDatabase, 150);
}

// --- SUBMISSIONS SERVICE ---
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

  // Sync to backend SQLite
  fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSub)
  }).catch(err => console.error('Error persisting submission to SQLite:', err));

  return newSub;
};

export const updateSubmissionStatus = (id: string, status: 'new' | 'in-review' | 'resolved'): void => {
  const current = getSubmissions();
  const updated = current.map(item => item.id === id ? { ...item, status } : item);
  saveSubmissions(updated);

  // Sync to backend SQLite
  fetch(`/api/submissions/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).catch(err => console.error('Error persisting submission status to SQLite:', err));
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
  fetch(`/api/submissions/${id}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newReply)
  }).catch(err => console.error('Error persisting reply to SQLite:', err));
};

export const deleteSubmission = (id: string): void => {
  const current = getSubmissions();
  const updated = current.filter(item => item.id !== id);
  saveSubmissions(updated);

  // Sync to backend SQLite
  fetch(`/api/submissions/${id}`, {
    method: 'DELETE'
  }).catch(err => console.error('Error persisting deletion to SQLite:', err));
};

export const resetSubmissionsToDemo = (): FormSubmissionItem[] => {
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(INITIAL_DEMO_SUBMISSIONS));
  window.dispatchEvent(new Event('submissions_updated'));

  // Sync to backend SQLite
  fetch('/api/submissions/reset', {
    method: 'POST'
  }).catch(err => console.error('Error resetting submissions in SQLite:', err));

  return INITIAL_DEMO_SUBMISSIONS;
};


// --- SITE CONFIG SERVICE ---
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

    // Sync to backend SQLite
    fetch('/api/site-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    }).catch(err => console.error('Error persisting site config to SQLite:', err));
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


// --- EVENTS SERVICE ---
export const getEvents = (): EventItem[] => {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(FESTIVAL_EVENTS));
      return FESTIVAL_EVENTS;
    }
    const events: EventItem[] = JSON.parse(raw);
    let updated = false;
    const fixedEvents = events.map(ev => {
      const matchingDefault = FESTIVAL_EVENTS.find(fe => fe.id === ev.id);
      if (matchingDefault && ev.highlightImage !== matchingDefault.highlightImage) {
        updated = true;
        return { ...ev, highlightImage: matchingDefault.highlightImage };
      }
      return ev;
    });
    if (updated) {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(fixedEvents));
      return fixedEvents;
    }
    return events;
  } catch (e) {
    console.error('Error loading events:', e);
    return FESTIVAL_EVENTS;
  }
};

export const saveEvents = (events: EventItem[]): void => {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    window.dispatchEvent(new Event('events_updated'));

    // Sync to backend SQLite
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events)
    }).catch(err => console.error('Error persisting events to SQLite:', err));
  } catch (e) {
    console.error('Error saving events:', e);
  }
};


// --- GALLERY SERVICE ---
export const getGalleryItems = (): GalleryItem[] => {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    if (!raw) {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(GALLERY_ITEMS));
      return GALLERY_ITEMS;
    }
    const items: GalleryItem[] = JSON.parse(raw);
    let updated = false;
    const fixedItems = items.map(item => {
      const matchingDefault = GALLERY_ITEMS.find(gi => gi.id === item.id);
      if (matchingDefault && item.imageUrl !== matchingDefault.imageUrl) {
        updated = true;
        return { ...item, imageUrl: matchingDefault.imageUrl };
      }
      return item;
    });
    if (updated) {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(fixedItems));
      return fixedItems;
    }
    return items;
  } catch (e) {
    console.error('Error loading gallery items:', e);
    return GALLERY_ITEMS;
  }
};

export const saveGalleryItems = (items: GalleryItem[]): void => {
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('gallery_updated'));

    // Sync to backend SQLite
    fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    }).catch(err => console.error('Error persisting gallery items to SQLite:', err));
  } catch (e) {
    console.error('Error saving gallery items:', e);
  }
};


// --- HOTELS SERVICE ---
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

    // Sync to backend SQLite
    fetch('/api/hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hotels)
    }).catch(err => console.error('Error persisting hotels to SQLite:', err));
  } catch (e) {
    console.error('Error saving hotels:', e);
  }
};


// --- PASSES SERVICE ---
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

    // Sync to backend SQLite
    fetch('/api/passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passes)
    }).catch(err => console.error('Error persisting passes to SQLite:', err));
  } catch (e) {
    console.error('Error saving passes:', e);
  }
};


// --- TESTIMONIALS SERVICE ---
export const getTestimonials = (): TestimonialItem[] => {
  try {
    const raw = localStorage.getItem(TESTIMONIALS_KEY);
    if (!raw) {
      localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(FESTIVAL_TESTIMONIALS));
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
    localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(testimonials));
    window.dispatchEvent(new Event('testimonials_updated'));

    // Sync to backend SQLite
    fetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testimonials)
    }).catch(err => console.error('Error persisting testimonials to SQLite:', err));
  } catch (e) {
    console.error('Error saving testimonials:', e);
  }
};


// --- MEDIA SERVICE ---
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

  // Sync to backend SQLite
  fetch('/api/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  }).catch(err => console.error('Error persisting media item to SQLite:', err));
};

export const deleteMediaItem = (id: string): void => {
  const current = getMediaItems();
  const updated = current.filter(item => item.id !== id);
  saveMediaItems(updated);

  // Sync to backend SQLite
  fetch(`/api/media/${id}`, {
    method: 'DELETE'
  }).catch(err => console.error('Error deleting media item from SQLite:', err));
};


// --- GLOBAL RESET ---
export const resetAllDynamicDataToDefault = (): void => {
  try {
    localStorage.removeItem(EVENTS_KEY);
    localStorage.removeItem(GALLERY_KEY);
    localStorage.removeItem(HOTELS_KEY);
    localStorage.removeItem(PASSES_KEY);
    localStorage.removeItem(TESTIMONIALS_KEY);
    localStorage.removeItem(MEDIA_KEY);

    window.dispatchEvent(new Event('events_updated'));
    window.dispatchEvent(new Event('gallery_updated'));
    window.dispatchEvent(new Event('hotels_updated'));
    window.dispatchEvent(new Event('passes_updated'));
    window.dispatchEvent(new Event('testimonials_updated'));
    window.dispatchEvent(new Event('media_updated'));

    // Trigger SQLite seed resets
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FESTIVAL_EVENTS)
    });
    fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(GALLERY_ITEMS)
    });
    fetch('/api/hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FESTIVAL_HOTELS)
    });
    fetch('/api/passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FESTIVAL_PASSES)
    });
    fetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FESTIVAL_TESTIMONIALS)
    });
  } catch (e) {
    console.error('Error resetting all dynamic data:', e);
  }
};
