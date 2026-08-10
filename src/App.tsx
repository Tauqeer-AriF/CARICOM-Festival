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
import { RegistrationModal } from './components/RegistrationModal';
import { AnimatePresence } from 'motion/react';
import { SplashScreen } from './components/SplashScreen';

// Helper to parse current path to ActiveTab
const getTabFromUrl = (): ActiveTab => {
  const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  const hash = window.location.hash.toLowerCase().replace(/^#+/, '');
  
  const current = path || hash;
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
  return 'home';
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTabState] = useState<ActiveTab>(getTabFromUrl);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [currency, setCurrency] = useState<'GBP' | 'USD' | 'XCD'>('GBP');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(getSiteConfig());

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
      case 'gallery': return 'Festival Photo Gallery & Highlights';
      case 'about-grenada': return 'Grenada Spice Island Guide';
      case 'about-mellowland': return 'Mellowland Experience & Tubing';
      case 'transportation': return 'VIP Shuttles & Airport Pickup';
      case 'hotels': return 'Royalton & Partner Hotels';
      case 'shop': return 'Festival Passes & VIP Packages';
      case 'register': return 'Flight & Logistics Registration';
      case 'testimonials': return 'Reveler Testimonials';
      case 'contact': return 'Mellows Concierge Helpdesk';
      case 'travel-insurance': return 'Travel Insurance & Peace of Mind';
      default: return 'Grenada CARICOM Festival 2027';
    }
  };

  if (activeTab === 'admin') {
    return (
      <div 
        className="min-h-screen bg-[#06080F] text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-950"
        style={{
          fontFamily: 'Inter, sans-serif'
        }}
      >
        <AnimatePresence mode="wait">
          {showSplash && (
            <SplashScreen 
              key="splash"
              primaryColor={siteConfig.branding.primaryColor || '#F59E0B'}
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

  const primaryColor = siteConfig.branding.primaryColor || '#F59E0B';
  const headingFont = siteConfig.branding.headingFont || 'Poppins';
  const bodyFont = siteConfig.branding.bodyFont || 'Inter';
  const bgTone = siteConfig.branding.bgTone || 'dark-onyx';

  // Parse background tones
  let bgColor = '#080A0F'; // default dark-onyx
  let cardColor = '#0D1118';
  let borderColor = 'rgba(255, 255, 255, 0.08)';
  
  if (bgTone === 'deep-midnight') {
    bgColor = '#02040A';
    cardColor = '#070913';
    borderColor = 'rgba(255, 255, 255, 0.06)';
  } else if (bgTone === 'luxury-charcoal') {
    bgColor = '#121214';
    cardColor = '#1A1A1E';
    borderColor = 'rgba(255, 255, 255, 0.05)';
  } else if (bgTone === 'caribbean-night') {
    bgColor = '#010A0A';
    cardColor = '#031414';
    borderColor = 'rgba(255, 255, 255, 0.07)';
  }

  // Construct safe URL-friendly family names for Google Fonts import
  const headingFontUrl = headingFont.replace(/ /g, '+');
  const bodyFontUrl = bodyFont.replace(/ /g, '+');

  return (
    <div 
      className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-950"
      style={{
        fontFamily: `${bodyFont}, sans-serif`
      }}
    >
      {/* Dynamic Branding Stylesheet */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=${headingFontUrl}:wght@400;500;600;700;800;900&family=${bodyFontUrl}:wght@300;400;500;600;700;800&display=swap');
          
          :root {
            --primary-color-dynamic: ${primaryColor};
            --bg-color-dynamic: ${bgColor};
            --card-color-dynamic: ${cardColor};
            --border-color-dynamic: ${borderColor};
          }
          
          body, p, span, a, button, input, select, textarea, div {
            font-family: '${bodyFont}', sans-serif !important;
          }
          
          h1, h2, h3, h4, h5, h6, .font-serif, .font-sans-display, .font-heading, .font-serif-luxury {
            font-family: '${headingFont}', sans-serif !important;
          }

          body, .bg-neutral-950, .bg-[#05070C], .bg-[#05070A], .bg-[#080A0F], .bg-[#05070c] {
            background-color: var(--bg-color-dynamic) !important;
          }
          
          .bg-neutral-900, .bg-[#0C0F1E], .bg-[#121822], .glass-card {
            background-color: var(--card-color-dynamic) !important;
          }
          
          .border-neutral-800, .border-neutral-800\\/60, .border-neutral-800\\/80, .border-white\\/10, .border-amber-500\\/20, .border-amber-500\\/30, .border-amber-500\\/40, .border-white\\/5 {
            border-color: var(--border-color-dynamic) !important;
          }

          /* Text color overrides */
          .text-amber-500, .text-amber-400, .text-amber-300, .text-amber-200, .text-amber-600, .hover\\:text-amber-300:hover, .hover\\:text-amber-400:hover {
            color: var(--primary-color-dynamic) !important;
          }
          
          /* Background overrides */
          .bg-amber-500, .bg-amber-600, .bg-amber-400, .hover\\:bg-amber-400:hover, .hover\\:bg-amber-500:hover {
            background-color: var(--primary-color-dynamic) !important;
          }
          
          /* Background with opacity overrides */
          .bg-amber-500\\/10 {
            background-color: ${primaryColor}1a !important;
          }
          .bg-amber-500\\/15 {
            background-color: ${primaryColor}26 !important;
          }
          .bg-amber-500\\/20 {
            background-color: ${primaryColor}33 !important;
          }
          .bg-amber-500\\/25 {
            background-color: ${primaryColor}40 !important;
          }
          .bg-amber-500\\/30 {
            background-color: ${primaryColor}4d !important;
          }
          
          /* Border overrides to neutralize colorful lines */
          .border-amber-500, .border-amber-600, .border-amber-400, .border-amber-500\\/20, .border-amber-500\\/30, .border-amber-500\\/40, .border-amber-400\\/40, .border-emerald-500, .border-emerald-500\\/20, .border-emerald-500\\/30, .border-rose-500\\/20, .border-amber-500\\/10, .glass-card-amber, .glass-card-interactive:hover, .glass-nav {
            border-color: var(--border-color-dynamic) !important;
          }
          
          /* Custom focus ring */
          .focus\\:border-amber-500:focus {
            border-color: var(--primary-color-dynamic) !important;
          }
          
          /* Dynamic gradient button adjustments */
          .from-amber-400 {
            --tw-gradient-from: ${primaryColor}d9 !important;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, ${primaryColor}00) !important;
          }
          .via-amber-500 {
            --tw-gradient-stops: var(--tw-gradient-from), ${primaryColor} !important;
          }
          .to-amber-600 {
            --tw-gradient-to: ${primaryColor}f2 !important;
          }
          
          /* Shadow effects */
          .shadow-amber-500\\/20, .shadow-amber-500\\/10 {
            --tw-shadow-color: ${primaryColor}33 !important;
          }
          .shadow-amber-500\\/30 {
            --tw-shadow-color: ${primaryColor}4d !important;
          }
          .shadow-amber-500\\/50 {
            --tw-shadow-color: ${primaryColor}80 !important;
          }
        `}
      </style>

      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen 
            key="splash"
            primaryColor={siteConfig.branding.primaryColor || '#F59E0B'}
            onComplete={() => setShowSplash(false)} 
          />
        )}
      </AnimatePresence>

      <div className={`flex-1 flex flex-col transition-opacity duration-1000 ${showSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
