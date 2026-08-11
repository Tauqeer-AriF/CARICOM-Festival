import React, { useState, useEffect } from 'react';
import { ActiveTab, CartItem, PassItem, SiteConfig } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WhatsAppFloating } from './components/WhatsAppFloating';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { CartDrawer } from './components/CartDrawer';
import { LuxurySkeletonOverlay } from './components/LuxurySkeletonOverlay';
import { getSiteConfig, getEvents, getGalleryItems, getHotels, getPasses } from './services/submissionService';

import { HomeView } from './views/HomeView';
import { EventListingView } from './views/EventListingView';
import { AboutGrenadaView } from './views/AboutGrenadaView';
import { AboutMellowlandView } from './views/AboutMellowlandView';
import { TransportationView } from './views/TransportationView';
import { HotelsView } from './views/HotelsView';
import { TestimonialsView } from './views/TestimonialsView';
import { ShopView } from './views/ShopView';
import { TravelInsuranceView } from './views/TravelInsuranceView';
import { ContactView } from './views/ContactView';
import { TermsView } from './views/TermsView';
import { GalleryView } from './views/GalleryView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { NotFoundView } from './views/NotFoundView';
import { RegistrationModal } from './components/RegistrationModal';
import { AnimatePresence } from 'motion/react';
import { SplashScreen } from './components/SplashScreen';

// Helper to parse current path to ActiveTab
const getTabFromUrl = (): ActiveTab => {
  const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  const hash = window.location.hash.toLowerCase().replace(/^#+/, '');
  
  const current = path || hash;
  if (!current) return 'home';
  
  const config = getSiteConfig();
  const adminPath = (config.adminPath || 'admin').toLowerCase();
  
  if (current === adminPath) return 'admin';
  if (current === 'events') return 'events';
  if (current === 'gallery') return 'gallery';
  if (current === 'about-grenada') return 'about-grenada';
  if (current === 'about-mellowland') return 'about-mellowland';
  if (current === 'transportation') return 'transportation';
  if (current === 'hotels') return 'hotels';
  if (current === 'testimonials') return 'testimonials';
  if (current === 'shop') return 'shop';
  if (current === 'register') return 'register';
  if (current === 'travel-insurance') return 'travel-insurance';
  if (current === 'contact') return 'contact';
  if (current === 'terms') return 'terms';
  return 'not-found';
};

function hexToRgb(hex: string, fallback = '245, 158, 11'): string {
  if (!hex) return fallback;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  if (c.length !== 6) return fallback;
  const num = parseInt(c, 16);
  if (isNaN(num)) return fallback;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTabState] = useState<ActiveTab>(getTabFromUrl);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [currency, setCurrency] = useState<'GBP' | 'USD' | 'XCD'>('GBP');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(getSiteConfig());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', theme);
      }
    } catch (err) {
      console.warn('Failed to save theme to localStorage:', err);
    }
  }, [theme]);

  const [events, setEvents] = useState(() => getEvents());
  const [galleryItems, setGalleryItems] = useState(() => getGalleryItems());
  const [hotels, setHotels] = useState(() => getHotels());
  const [passes, setPasses] = useState(() => getPasses());

  // Listen for data updates from executive panel
  useEffect(() => {
    const handleEventsUpdate = () => setEvents(getEvents());
    const handleGalleryUpdate = () => setGalleryItems(getGalleryItems());
    const handleHotelsUpdate = () => setHotels(getHotels());
    const handlePassesUpdate = () => setPasses(getPasses());

    window.addEventListener('events_updated', handleEventsUpdate);
    window.addEventListener('gallery_updated', handleGalleryUpdate);
    window.addEventListener('hotels_updated', handleHotelsUpdate);
    window.addEventListener('passes_updated', handlePassesUpdate);

    return () => {
      window.removeEventListener('events_updated', handleEventsUpdate);
      window.removeEventListener('gallery_updated', handleGalleryUpdate);
      window.removeEventListener('hotels_updated', handleHotelsUpdate);
      window.removeEventListener('passes_updated', handlePassesUpdate);
    };
  }, []);

  // Listen for browser forward/back popstate events
  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update address bar dynamically when adminPath changes
  useEffect(() => {
    if (activeTab === 'admin') {
      const adminPath = siteConfig.adminPath || 'admin';
      const targetPath = `/${adminPath}`;
      if (window.location.pathname !== targetPath) {
        window.history.replaceState({ tab: 'admin' }, '', targetPath);
      }
    }
  }, [siteConfig.adminPath, activeTab]);

  // Listen for dynamic site branding & banner updates from Admin Dashboard
  useEffect(() => {
    const handleConfigUpdate = (e: Event) => {
      const customEv = e as CustomEvent<SiteConfig>;
      if (customEv.detail) {
        setSiteConfig(customEv.detail);
      } else {
        setSiteConfig(getSiteConfig());
      }
    };
    window.addEventListener('site_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('site_config_updated', handleConfigUpdate);
  }, []);

  // Dynamically update document favicon
  useEffect(() => {
    const faviconUrl = siteConfig.appFaviconUrl || '/src/assets/images/favicon_icon_1786434632871.jpg';
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviconUrl;
  }, [siteConfig.appFaviconUrl]);

  // Auto-detect user currency on app load based on timezone, locale, and IP location
  useEffect(() => {
    // Immediate locale/timezone detection
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const lang = navigator.language || '';
      
      if (tz.includes('London') || tz.includes('Belfast') || lang === 'en-GB') {
        setCurrency('GBP');
      } else if (tz.includes('Grenada') || tz.includes('St_Lucia') || tz.includes('Dominica') || tz.includes('Antigua') || tz.includes('St_Vincent')) {
        setCurrency('XCD');
      } else if (tz.startsWith('America/') || lang.endsWith('-US')) {
        setCurrency('USD');
      }
    } catch {
      // Fallback safe
    }

    // IP-based geolocation detection with fallback timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.country_code === 'GD' || data.currency === 'XCD') {
            setCurrency('XCD');
          } else if (data.country_code === 'GB' || data.currency === 'GBP') {
            setCurrency('GBP');
          } else if (data.country_code === 'US' || data.currency === 'USD') {
            setCurrency('USD');
          }
        }
      })
      .catch(() => {
        // Silently keep timezone/locale default on network/timeout error
      })
      .finally(() => clearTimeout(timeoutId));
  }, []);

  const setActiveTab = (newTab: ActiveTab) => {
    if (newTab === activeTab) return;
    setIsLoadingTab(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Sync browser URL pathname
    const adminPath = siteConfig.adminPath || 'admin';
    const targetPath = newTab === 'home' ? '/' : (newTab === 'admin' ? `/${adminPath}` : `/${newTab}`);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab: newTab }, '', targetPath);
    }

    setTimeout(() => {
      setActiveTabState(newTab);
      setIsLoadingTab(false);
    }, 320);
  };

  const handleAddToCart = (pass: PassItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.pass.id === pass.id);
      if (existing) {
        return prev.map((item) =>
          item.pass.id === pass.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { pass, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const getTabLabel = (tab: ActiveTab) => {
    switch (tab) {
      case 'home': return 'Festival Highlights & 10-Day Experience';
      case 'events': return 'Event Lineup & Schedule';
      case 'gallery': return 'Festival Gallery & Media Highlights';
      case 'about-grenada': return 'Grenada Spice Island Guide';
      case 'about-mellowland': return 'Mellowland Experience & Tubing';
      case 'transportation': return 'VIP Shuttles & Airport Pickup';
      case 'hotels': return 'Royalton & Partner Hotels';
      case 'shop': return 'Festival Passes & VIP Packages';
      case 'register': return 'Flight & Logistics Registration';
      case 'testimonials': return 'Reveler Testimonials';
      case 'contact': return 'Mellows Concierge Helpdesk';
      case 'travel-insurance': return 'Travel Insurance & Peace of Mind';
      case 'not-found': return 'Page Not Found';
      default: return 'Grenada CARICOM Festival 2027';
    }
  };

  const primaryColor = siteConfig.branding.primaryColor || '#F59E0B';
  const secondaryColor = siteConfig.branding.secondaryColor || '#10B981';
  const headingFont = siteConfig.branding.headingFont || 'Poppins';
  const bodyFont = siteConfig.branding.bodyFont || 'Inter';
  const bgTone = siteConfig.branding.bgTone || 'dark-onyx';
  const buttonStyle = siteConfig.branding.buttonStyle || 'rounded';
  const cardStyle = siteConfig.branding.cardStyle || 'glassy';
  const glowIntensity = siteConfig.branding.glowIntensity || 'medium';
  const glassOpacity = siteConfig.branding.glassOpacity !== undefined ? siteConfig.branding.glassOpacity : 30;

  const primaryRgb = hexToRgb(primaryColor, '245, 158, 11');
  const secondaryRgb = hexToRgb(secondaryColor, '16, 185, 129');

  // Parse background tones
  let bgColor = '#080A0F'; // default dark-onyx
  let cardColor = '#0D1118';
  let borderColor = 'rgba(255, 255, 255, 0.08)';
  let bgColorRgb = '8, 10, 15';
  
  if (bgTone === 'deep-midnight') {
    bgColor = '#02040A';
    cardColor = '#070913';
    borderColor = 'rgba(255, 255, 255, 0.06)';
    bgColorRgb = '2, 4, 10';
  } else if (bgTone === 'luxury-charcoal') {
    bgColor = '#121214';
    cardColor = '#1A1A1E';
    borderColor = 'rgba(255, 255, 255, 0.05)';
    bgColorRgb = '18, 18, 20';
  } else if (bgTone === 'caribbean-night') {
    bgColor = '#010A0A';
    cardColor = '#031414';
    borderColor = 'rgba(255, 255, 255, 0.07)';
    bgColorRgb = '1, 10, 10';
  }

  // Construct safe URL-friendly family names for Google Fonts import
  const headingFontUrl = headingFont.replace(/ /g, '+');
  const bodyFontUrl = bodyFont.replace(/ /g, '+');

  const dynamicStyleBlock = (
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=${headingFontUrl}:wght@400;500;600;700;800;900&family=${bodyFontUrl}:wght@300;400;500;600;700;800&display=swap');
        
        :root {
          --primary-color-dynamic: ${primaryColor};
          --primary-rgb: ${primaryRgb};
          --secondary-color-dynamic: ${secondaryColor};
          --secondary-rgb: ${secondaryRgb};
          --bg-color-dynamic: ${bgColor};
          --bg-color-dynamic-rgb: ${bgColorRgb};
          --card-color-dynamic: ${cardColor};
          --border-color-dynamic: ${borderColor};
          --heading-font-dynamic: '${headingFont}', sans-serif;
          --body-font-dynamic: '${bodyFont}', sans-serif;
          --button-radius-dynamic: ${buttonStyle === 'sharp' ? '0px' : buttonStyle === 'pill' ? '9999px' : '12px'};
          --card-radius-dynamic: ${buttonStyle === 'sharp' ? '0px' : '24px'};
        }
        
        /* Apply dynamic border rounding globally */
        button, 
        input, 
        select, 
        textarea, 
        .rounded-xl, 
        .rounded-lg, 
        .rounded-md {
          border-radius: var(--button-radius-dynamic) !important;
        }
        .rounded-full {
          border-radius: ${buttonStyle === 'sharp' ? '0px' : '9999px'} !important;
        }
        
        .rounded-3xl, .rounded-2xl, .rounded-[32px], .rounded-[24px] {
          border-radius: var(--card-radius-dynamic) !important;
        }

        /* Dynamic Card overrides */
        .glass-card {
          border-radius: var(--card-radius-dynamic) !important;
          background-color: ${
            cardStyle === 'flat' 
              ? 'var(--card-color-dynamic)' 
              : `rgba(var(--bg-color-dynamic-rgb), ${glassOpacity / 100})`
          } !important;
          backdrop-filter: ${cardStyle === 'flat' ? 'none' : 'blur(16px)'} !important;
          -webkit-backdrop-filter: ${cardStyle === 'flat' ? 'none' : 'blur(16px)'} !important;
          border: ${
            cardStyle === 'bordered'
              ? '1.5px solid var(--primary-color-dynamic)'
              : '1px solid var(--border-color-dynamic)'
          } !important;
          box-shadow: ${
            cardStyle === 'glow'
              ? `0 0 ${glowIntensity === 'high' ? '30px' : glowIntensity === 'low' ? '10px' : '20px'} rgba(var(--primary-rgb), ${glowIntensity === 'high' ? '0.25' : glowIntensity === 'low' ? '0.08' : '0.15'})`
              : '0 20px 40px -15px rgba(0, 0, 0, 0.4)'
          } !important;
        }

        body, html, #root {
          font-family: var(--body-font-dynamic) !important;
        }

        p, span, a, button, input, select, textarea, label, li, td, th, div, section, article, header, footer, nav, main, aside, option, dialog, text, tspan {
          font-family: var(--body-font-dynamic) !important;
        }

        .font-sans, .font-sans *, .font-body-text, .font-body-text *, .font-body-premium, .font-body-premium * {
          font-family: var(--body-font-dynamic) !important;
        }
        
        h1, h2, h3, h4, h5, h6, 
        h1 *, h2 *, h3 *, h4 *, h5 *, h6 *,
        .font-serif, 
        .font-serif *,
        .font-sans-display, 
        .font-sans-display *,
        .font-heading, 
        .font-heading *,
        .font-display, 
        .font-display *,
        .font-headline, 
        .font-headline *,
        .font-serif-luxury,
        .font-serif-luxury *,
        .heading-font,
        .heading-font * {
          font-family: var(--heading-font-dynamic) !important;
        }

        /* Monospace font preservation only for raw code logs/previews */
        code, pre, .font-code-raw, .font-code-raw * {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }

        /* Let standard font-mono classes respect the dynamic body font by default with tabular lining numbers */
        .font-mono, .font-mono * {
          font-family: var(--body-font-dynamic) !important;
          font-feature-settings: "tnum" 1, "lnum" 1 !important; /* Align figures beautifully */
        }

        /* Surfaces & Backgrounds */
        body, .bg-neutral-950, .bg-[#05070C], .bg-[#05070A], .bg-[#080A0F], .bg-[#05070c], .bg-[#03050A], .bg-black/40 {
          background-color: var(--bg-color-dynamic) !important;
        }
        
        .bg-neutral-900, .bg-[#0C0F1E], .bg-[#121822], .bg-[#12162E], .glass-card, .bg-[#0A0D14], .bg-[#0D1118], .bg-[#090D1A], .bg-[#0F172A], .bg-[#080C17], .bg-neutral-950/20 {
          background-color: var(--card-color-dynamic) !important;
        }
        
        .border-neutral-800, .border-neutral-800\\/60, .border-neutral-800\\/80, .border-white\\/10, .border-white\\/15, .border-white\\/5 {
          border-color: var(--border-color-dynamic) !important;
        }

        /* Glass navigation */
        .glass-nav {
          background: rgba(var(--bg-color-dynamic-rgb), 0.9) !important;
          border-color: var(--border-color-dynamic) !important;
        }

        /* ------------------------------------------------------------- */
        /* PRIMARY COLOR DYNAMIC OVERRIDES (Amber / Gold / Main Accent)   */
        /* ------------------------------------------------------------- */

        .text-amber-500, .text-amber-400, .text-amber-300, .text-amber-200, .text-amber-100, .text-amber-600, .text-amber-700, 
        .text-amber-300\\/80, .text-amber-300\\/90, .text-amber-400\\/80, .text-amber-400\\/90, .text-amber-500\\/80,
        .text-yellow-500, .text-yellow-400, .text-yellow-300,
        .hover\\:text-amber-300:hover, .hover\\:text-amber-400:hover, .hover\\:text-amber-500:hover,
        .group-hover\\:text-amber-300:group-hover, .group-hover\\:text-amber-400:group-hover, .group-hover\\:text-amber-500:group-hover,
        .focus\\:text-amber-400:focus, .gold-text, .text-gold-subtle {
          color: var(--primary-color-dynamic) !important;
        }

        .bg-amber-500, .bg-amber-400, .bg-amber-300, .bg-amber-600, .bg-yellow-500, .bg-yellow-400,
        .hover\\:bg-amber-400:hover, .hover\\:bg-amber-500:hover, .hover\\:bg-amber-600:hover,
        .group-hover\\:bg-amber-400:group-hover, .group-hover\\:bg-amber-500:group-hover, 
        .active\\:bg-amber-600:active, .gold-btn, .bg-gold-primary {
          background-color: var(--primary-color-dynamic) !important;
        }

        /* Primary Opacity Backgrounds */
        .bg-amber-500\\/5, .bg-amber-400\\/5, .bg-amber-300\\/5 {
          background-color: rgba(var(--primary-rgb), 0.05) !important;
        }
        .bg-amber-500\\/10, .bg-amber-400\\/10, .bg-amber-300\\/10 {
          background-color: rgba(var(--primary-rgb), 0.10) !important;
        }
        .bg-amber-500\\/15, .bg-amber-400\\/15, .bg-amber-300\\/15 {
          background-color: rgba(var(--primary-rgb), 0.15) !important;
        }
        .bg-amber-500\\/20, .bg-amber-400\\/20, .bg-amber-300\\/20 {
          background-color: rgba(var(--primary-rgb), 0.20) !important;
        }
        .bg-amber-500\\/25, .bg-amber-400\\/25, .bg-amber-300\\/25 {
          background-color: rgba(var(--primary-rgb), 0.25) !important;
        }
        .bg-amber-500\\/30, .bg-amber-400\\/30, .bg-amber-300\\/30 {
          background-color: rgba(var(--primary-rgb), 0.30) !important;
        }
        .bg-amber-500\\/40, .bg-amber-400\\/40 {
          background-color: rgba(var(--primary-rgb), 0.40) !important;
        }
        .bg-amber-500\\/50, .bg-amber-400\\/50 {
          background-color: rgba(var(--primary-rgb), 0.50) !important;
        }

        /* Primary Borders */
        .border-amber-500, .border-amber-400, .border-amber-300, .border-amber-600, .border-\[\#D4AF37\],
        .hover\\:border-amber-500:hover, .hover\\:border-amber-400:hover, .focus\\:border-amber-500:focus, .focus-within\\:border-amber-500:focus-within,
        .group-hover\\:border-amber-500\\/50:group-hover, .group-hover\\:border-amber-400:group-hover {
          border-color: var(--primary-color-dynamic) !important;
        }

        .border-amber-500\\/10, .border-amber-400\\/10, .border-amber-300\\/10 {
          border-color: rgba(var(--primary-rgb), 0.10) !important;
        }
        .border-amber-500\\/15, .border-amber-400\\/15 {
          border-color: rgba(var(--primary-rgb), 0.15) !important;
        }
        .border-amber-500\\/20, .border-amber-400\\/20, .border-amber-300\\/20 {
          border-color: rgba(var(--primary-rgb), 0.20) !important;
        }
        .border-amber-500\\/30, .border-amber-400\\/30, .border-amber-300\\/30, .border-\[\#D4AF37\]\/30 {
          border-color: rgba(var(--primary-rgb), 0.30) !important;
        }
        .border-amber-500\\/35, .border-amber-400\\/35, .border-amber-300\\/35 {
          border-color: rgba(var(--primary-rgb), 0.35) !important;
        }
        .border-amber-500\\/40, .border-amber-400\\/40 {
          border-color: rgba(var(--primary-rgb), 0.40) !important;
        }
        .border-amber-500\\/50, .border-amber-400\\/50 {
          border-color: rgba(var(--primary-rgb), 0.50) !important;
        }
        .border-amber-500\\/60, .border-amber-400\\/60, .border-\[\#D4AF37\]\/60 {
          border-color: rgba(var(--primary-rgb), 0.60) !important;
        }

        /* Primary Gradients */
        .from-amber-300, .from-amber-400, .from-amber-500, .from-amber-600, .from-yellow-400, .from-yellow-500 {
          --tw-gradient-from: var(--primary-color-dynamic) !important;
          --tw-gradient-to: rgba(var(--primary-rgb), 0) !important;
          --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-from), var(--tw-gradient-to)) !important;
        }

        .to-amber-300, .to-amber-400, .to-amber-500, .to-amber-600, .to-yellow-400, .to-yellow-500 {
          --tw-gradient-to: var(--primary-color-dynamic) !important;
        }

        .via-amber-300, .via-amber-400, .via-amber-500, .via-amber-600, .via-yellow-400, .via-yellow-500 {
          --tw-gradient-via-stops: var(--tw-gradient-from), var(--primary-color-dynamic), var(--tw-gradient-to) !important;
          --tw-gradient-to: var(--primary-color-dynamic) !important;
        }

        .hover\\:from-amber-300:hover, .hover\\:from-amber-400:hover, .hover\\:to-amber-500:hover {
          --tw-gradient-from: var(--primary-color-dynamic) !important;
          --tw-gradient-to: var(--primary-color-dynamic) !important;
        }

        /* Primary Shadows & Glass Cards */
        .shadow-amber-500\\/10, .shadow-amber-500\\/20, .shadow-amber-500\\/30, .shadow-amber-500\\/40, .shadow-amber-400\\/20, .shadow-amber-500\\/50,
        .shadow-yellow-500\\/20, .shadow-yellow-500\\/30 {
          box-shadow: 0 10px 25px -5px rgba(var(--primary-rgb), 0.35) !important;
        }

        .glass-card-amber {
          background: rgba(var(--primary-rgb), 0.08) !important;
          border-color: rgba(var(--primary-rgb), 0.3) !important;
        }

        .glass-card-interactive:hover {
          border-color: rgba(var(--primary-rgb), 0.45) !important;
          box-shadow: 0 15px 35px -10px rgba(var(--primary-rgb), 0.3) !important;
        }

        .ring-amber-500, .ring-amber-400, .focus\\:ring-amber-500:focus {
          --tw-ring-color: var(--primary-color-dynamic) !important;
        }

        ::selection {
          background-color: var(--primary-color-dynamic) !important;
          color: #080a0f !important;
        }

        /* ------------------------------------------------------------- */
        /* SECONDARY COLOR DYNAMIC OVERRIDES (Emerald / Secondary)       */
        /* ------------------------------------------------------------- */

        .text-emerald-500, .text-emerald-400, .text-emerald-300, .text-emerald-200, .text-emerald-100, .text-emerald-600,
        .hover\\:text-emerald-300:hover, .hover\\:text-emerald-400:hover, .hover\\:text-emerald-500:hover,
        .group-hover\\:text-emerald-300:group-hover, .group-hover\\:text-emerald-400:group-hover, .group-hover\\:text-emerald-500:group-hover,
        .focus\\:text-emerald-400:focus {
          color: var(--secondary-color-dynamic) !important;
        }

        .bg-emerald-500, .bg-emerald-400, .bg-emerald-300, .bg-emerald-600,
        .hover\\:bg-emerald-400:hover, .hover\\:bg-emerald-500:hover, .hover\\:bg-emerald-600:hover,
        .group-hover\\:bg-emerald-400:group-hover, .group-hover\\:bg-emerald-500:group-hover,
        .active\\:bg-emerald-600:active {
          background-color: var(--secondary-color-dynamic) !important;
        }

        .bg-emerald-500\\/5, .bg-emerald-400\\/5 {
          background-color: rgba(var(--secondary-rgb), 0.05) !important;
        }
        .bg-emerald-500\\/10, .bg-emerald-400\\/10, .bg-emerald-300\\/10 {
          background-color: rgba(var(--secondary-rgb), 0.10) !important;
        }
        .bg-emerald-500\\/15, .bg-emerald-400\\/15 {
          background-color: rgba(var(--secondary-rgb), 0.15) !important;
        }
        .bg-emerald-500\\/20, .bg-emerald-400\\/20, .bg-emerald-300\\/20 {
          background-color: rgba(var(--secondary-rgb), 0.20) !important;
        }
        .bg-emerald-500\\/30, .bg-emerald-400\\/30 {
          background-color: rgba(var(--secondary-rgb), 0.30) !important;
        }
        .bg-emerald-500\\/40, .bg-emerald-400\\/40 {
          background-color: rgba(var(--secondary-rgb), 0.40) !important;
        }

        .border-emerald-500, .border-emerald-400, .border-emerald-300,
        .hover\\:border-emerald-500:hover, .hover\\:border-emerald-400:hover, .focus\\:border-emerald-500:focus {
          border-color: var(--secondary-color-dynamic) !important;
        }

        .border-emerald-500\\/10, .border-emerald-400\\/10 {
          border-color: rgba(var(--secondary-rgb), 0.10) !important;
        }
        .border-emerald-500\\/20, .border-emerald-400\\/20 {
          border-color: rgba(var(--secondary-rgb), 0.20) !important;
        }
        .border-emerald-500\\/30, .border-emerald-400\\/30 {
          border-color: rgba(var(--secondary-rgb), 0.30) !important;
        }
        .border-emerald-500\\/40, .border-emerald-400\\/40 {
          border-color: rgba(var(--secondary-rgb), 0.40) !important;
        }

        .from-emerald-300, .from-emerald-400, .from-emerald-500, .from-emerald-600 {
          --tw-gradient-from: var(--secondary-color-dynamic) !important;
          --tw-gradient-to: rgba(var(--secondary-rgb), 0) !important;
          --tw-gradient-stops: var(--tw-gradient-via-stops, var(--tw-gradient-from), var(--tw-gradient-to)) !important;
        }

        .to-emerald-300, .to-emerald-400, .to-emerald-500, .to-emerald-600 {
          --tw-gradient-to: var(--secondary-color-dynamic) !important;
        }

        .via-emerald-300, .via-emerald-400, .via-emerald-500 {
          --tw-gradient-to: var(--secondary-color-dynamic) !important;
        }

        .ring-emerald-500, .ring-emerald-400, .focus\\:ring-emerald-500:focus {
          --tw-ring-color: var(--secondary-color-dynamic) !important;
        }

        /* Custom Ring/Focus styles */
        .focus\\:border-amber-500:focus, .focus-within\\:border-amber-500:focus-within {
          border-color: var(--primary-color-dynamic) !important;
        }
        .focus\\:border-emerald-500:focus {
          border-color: var(--secondary-color-dynamic) !important;
        }
      `}
    </style>
  );

  if (activeTab === 'admin') {
    return (
      <div 
        className="min-h-screen text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-950"
        style={{
          backgroundColor: bgColor,
          fontFamily: `${bodyFont}, sans-serif`
        }}
      >
        {dynamicStyleBlock}
        <AnimatePresence mode="wait">
          {showSplash && (
            <SplashScreen 
              key="splash"
              primaryColor={primaryColor}
              onComplete={() => setShowSplash(false)} 
            />
          )}
        </AnimatePresence>
        <div className={`flex-1 flex flex-col transition-opacity duration-1000 ${showSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <AdminDashboardView setActiveTab={setActiveTab} />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-950 relative overflow-x-clip"
      style={{
        fontFamily: `${bodyFont}, sans-serif`
      }}
    >
      {dynamicStyleBlock}

      {/* Ambient Main Body Shimmer Background Effect */}
      <div className="body-shimmer-container" aria-hidden="true">
        <div className="body-shimmer-layer" />
        <div className="body-shimmer-orb-1" />
        <div className="body-shimmer-orb-2" />
        <div className="body-shimmer-beam" />
      </div>

      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen 
            key="splash"
            primaryColor={primaryColor}
            onComplete={() => setShowSplash(false)} 
          />
        )}
      </AnimatePresence>

      <div className={`flex-1 flex flex-col relative z-10 transition-opacity duration-1000 ${showSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Top Announcement Banner */}
        {siteConfig.banner?.enabled && siteConfig.banner.text && (
        <div 
          className="w-full text-center text-[10px] sm:text-xs font-bold py-2 px-4 select-none relative overflow-hidden transition-all duration-300 shrink-0 z-40 flex items-center justify-center gap-2 border-b border-white/5"
          style={{ backgroundColor: siteConfig.banner.bgColor || '#10B981', color: '#ffffff' }}
        >
          <span className="inline-flex items-center justify-center w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
          <span className="uppercase tracking-[0.15em] font-sans text-white truncate">{siteConfig.banner.text}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        theme={theme}
        setTheme={setTheme}
        siteConfig={siteConfig}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoadingTab ? (
          <LuxurySkeletonOverlay type="page" message={`Loading ${getTabLabel(activeTab)}...`} />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView setActiveTab={setActiveTab} onAddToCart={handleAddToCart} />
            )}

            {activeTab === 'events' && (
              <EventListingView setActiveTab={setActiveTab} events={events} />
            )}

            {activeTab === 'gallery' && (
              <GalleryView setActiveTab={setActiveTab} galleryItems={galleryItems} />
            )}

            {activeTab === 'about-grenada' && (
              <AboutGrenadaView setActiveTab={setActiveTab} />
            )}

            {activeTab === 'about-mellowland' && (
              <AboutMellowlandView setActiveTab={setActiveTab} onAddToCart={handleAddToCart} passes={passes} />
            )}

            {activeTab === 'transportation' && (
              <TransportationView setActiveTab={setActiveTab} />
            )}

            {activeTab === 'hotels' && (
              <HotelsView setActiveTab={setActiveTab} hotels={hotels} />
            )}

            {activeTab === 'testimonials' && (
              <TestimonialsView setActiveTab={setActiveTab} />
            )}

            {activeTab === 'shop' && (
              <ShopView setActiveTab={setActiveTab} onAddToCart={handleAddToCart} currency={currency} passes={passes} />
            )}

            {activeTab === 'register' && (
              <div className="space-y-6">
                <RegistrationModal onComplete={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              </div>
            )}

            {activeTab === 'travel-insurance' && (
              <TravelInsuranceView setActiveTab={setActiveTab} />
            )}

            {activeTab === 'contact' && <ContactView />}

            {activeTab === 'terms' && <TermsView setActiveTab={setActiveTab} />}

            {activeTab === 'not-found' && <NotFoundView setActiveTab={setActiveTab} />}
          </>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        setCart={setCart}
        currency={currency}
        onNavigateRegister={() => {
          setIsCartOpen(false);
          setActiveTab('register');
        }}
      />

      {/* Floating Widgets */}
      {!isCartOpen && (
        <>
          <WhatsAppFloating siteConfig={siteConfig} />
          <ScrollToTopButton />
        </>
      )}

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} siteConfig={siteConfig} />
      </div>

    </div>
  );
}
