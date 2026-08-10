import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { 
  Palmtree, 
  Menu, 
  X, 
  ShoppingBag, 
  Plane, 
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Calendar,
  HelpCircle,
  FileText,
  Star
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currency: 'GBP' | 'USD' | 'XCD';
  setCurrency: (currency: 'GBP' | 'USD' | 'XCD') => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  cartCount,
  onOpenCart
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryNavItems: { id: ActiveTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'events', label: 'Schedule' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'about-grenada', label: 'Spice Isle' },
    { id: 'about-mellowland', label: 'Mellowland' },
    { id: 'hotels', label: 'Hotels' },
    { id: 'transportation', label: 'Shuttles' },
    { id: 'shop', label: 'Passes & VIP' },
  ];

  const secondaryNavItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'register', label: 'Flight Arrival', icon: <Plane className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'testimonials', label: 'Reveler Reviews', icon: <Star className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'travel-insurance', label: 'Travel Insurance', icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'contact', label: 'Concierge Support', icon: <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'terms', label: 'Terms & Guidelines', icon: <FileText className="w-3.5 h-3.5 text-amber-400" /> },
  ];

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isMoreActive = secondaryNavItems.some(item => item.id === activeTab);

  return (
    <header className="sticky top-0 z-50 transition-all">
      {/* Main Glass Navbar */}
      <div className="bg-neutral-950/85 backdrop-blur-2xl border-b border-amber-500/20 shadow-2xl shadow-black/80">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-3">
            
            {/* Left Section: Logo */}
            <div 
              onClick={() => handleTabClick('home')}
              className="flex items-center gap-3 cursor-pointer group shrink-0"
              id="nav-logo"
            >
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 rounded-xl blur-[3px] opacity-40 group-hover:opacity-80 transition duration-300" />
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-950 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl group-hover:scale-105 transition-transform">
                  <Palmtree className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:rotate-6 transition-transform" />
                </div>
              </div>

              <div className="flex flex-col justify-center leading-tight">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-amber-400/90 font-sans-display flex items-center gap-1 whitespace-nowrap">
                  CARICOM FESTIVAL
                </span>
                <span className="text-base sm:text-lg font-bold font-serif tracking-tight text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                  Grenada <span className="font-sans font-extrabold text-amber-400 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30">2027</span>
                </span>
              </div>
            </div>

            {/* Desktop Nav Items */}
            <nav className="hidden xl:flex items-center justify-center gap-0.5 2xl:gap-1.5 mx-auto">
              {primaryNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => handleTabClick(item.id)}
                    className={`px-2.5 2xl:px-3.5 py-1.5 2xl:py-2 rounded-xl text-[11px] 2xl:text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all cursor-pointer relative ${
                      isActive 
                        ? 'text-amber-300 bg-amber-500/15 border border-amber-500/35 shadow-[0_0_15px_rgba(212,175,55,0.15)] font-bold' 
                        : 'text-neutral-300 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    )}
                  </button>
                );
              })}

              {/* More Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => setMoreOpen(true)}
                onMouseLeave={() => setMoreOpen(false)}
              >
                <button 
                  type="button"
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`px-2.5 2xl:px-3.5 py-1.5 2xl:py-2 rounded-xl text-[11px] 2xl:text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer border ${
                    isMoreActive || moreOpen
                      ? 'text-amber-300 bg-amber-500/15 border-amber-500/35 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                      : 'text-neutral-300 hover:text-white hover:bg-white/5 border-transparent'
                  }`}
                >
                  <span>More</span>
                  <ChevronDown className={`w-3 h-3 text-amber-400/80 transition-transform duration-200 ${moreOpen ? 'rotate-180' : 'group-hover:rotate-180'}`} />
                </button>

                {/* Dropdown Container with seamless top-full padding bridge */}
                <div 
                  className={`absolute right-0 top-full pt-1.5 w-56 z-50 transition-all duration-150 ${
                    moreOpen ? 'block opacity-100 pointer-events-auto' : 'hidden group-hover:block opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <div className="bg-neutral-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl p-2 border border-amber-500/30 shadow-amber-500/20">
                    {secondaryNavItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleTabClick(item.id);
                          setMoreOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 cursor-pointer transition-colors whitespace-nowrap ${
                          activeTab === item.id 
                            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' 
                            : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </nav>

            {/* Right Section: Controls */}
            <div className="flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2.5 sm:gap-3">
                {/* Currency Selector */}
                <div className="flex bg-neutral-900 border border-amber-500/20 rounded-xl p-0.5 text-[11px] font-semibold text-neutral-300 shadow-inner">
                  {(['GBP', 'USD', 'XCD'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap font-mono ${
                        currency === c 
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm font-bold' 
                          : 'hover:text-white opacity-80 hover:opacity-100'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Flight Arrival VIP Button */}
                <button
                  onClick={() => handleTabClick('register')}
                  id="nav-btn-register"
                  className="px-3.5 2xl:px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-neutral-950 font-extrabold text-[11px] 2xl:text-xs uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 rounded-xl shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.5)] transition-all hover:scale-[1.03] active:scale-95 cursor-pointer border border-amber-300/40"
                >
                  <Plane className="w-3.5 h-3.5 fill-neutral-950" />
                  <span>Flight Arrival</span>
                </button>

                {/* Cart Icon */}
                <button
                  onClick={onOpenCart}
                  id="nav-btn-cart"
                  className="relative p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 rounded-xl text-neutral-200 transition-all cursor-pointer hover:border-amber-400 shadow-lg shrink-0 group"
                  title="View Reserved Passes"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-neutral-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile / Tablet Toggle */}
              <div className="flex xl:hidden items-center gap-2">
                <button
                  onClick={onOpenCart}
                  className="relative p-2 bg-neutral-900 border border-amber-500/30 rounded-xl text-amber-400"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-neutral-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  id="nav-btn-mobile-toggle"
                  className="p-2 bg-neutral-900 border border-amber-500/30 rounded-xl text-neutral-200 hover:text-white"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5 text-amber-400" />}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-neutral-950/95 backdrop-blur-2xl border-b border-amber-500/30 px-4 pt-3 pb-6 space-y-4 max-h-[80vh] overflow-y-auto animate-fadeIn shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            {[...primaryNavItems, ...secondaryNavItems].map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`p-3 rounded-xl text-xs uppercase tracking-wider font-semibold text-left transition-all cursor-pointer ${
                  activeTab === item.id 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-md' 
                    : 'bg-neutral-900 text-neutral-300 hover:bg-white/5 border border-white/5'
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-xs text-neutral-400 font-medium">Select Currency:</span>
            <div className="flex bg-neutral-900 border border-amber-500/20 rounded-xl p-0.5 text-xs text-neutral-300">
              {(['GBP', 'USD', 'XCD'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1 rounded-lg font-mono font-medium ${
                    currency === c ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : ''
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};




