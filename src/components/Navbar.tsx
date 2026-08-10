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
  Star,
  Image,
  Building,
  Car,
  Sun,
  Moon
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currency: 'GBP' | 'USD' | 'XCD';
  setCurrency: (currency: 'GBP' | 'USD' | 'XCD') => void;
  cartCount: number;
  onOpenCart: () => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  cartCount,
  onOpenCart,
  theme,
  setTheme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHoverDropdown, setActiveHoverDropdown] = useState<string | null>(null);

  const flatLinks = [
    { id: 'home' as ActiveTab, label: 'Home' },
    { id: 'events' as ActiveTab, label: 'Events' },
    { id: 'shop' as ActiveTab, label: 'Passes & VIP' },
  ];

  const dropdownMenus = [
    {
      id: 'experience',
      label: 'Experience',
      items: [
        { id: 'about-grenada' as ActiveTab, label: 'Spice Isle Guide', icon: <Palmtree className="w-3.5 h-3.5 text-amber-400" /> },
        { id: 'about-mellowland' as ActiveTab, label: 'Mellowland Tubing', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
        { id: 'gallery' as ActiveTab, label: 'Photo Gallery', icon: <Image className="w-3.5 h-3.5 text-amber-400" /> },
        { id: 'testimonials' as ActiveTab, label: 'Reveler Reviews', icon: <Star className="w-3.5 h-3.5 text-amber-400" /> },
      ]
    },
    {
      id: 'planning',
      label: 'Planning',
      items: [
        { id: 'hotels' as ActiveTab, label: 'Partner Hotels', icon: <Building className="w-3.5 h-3.5 text-amber-400" /> },
        { id: 'transportation' as ActiveTab, label: 'VIP Shuttles', icon: <Car className="w-3.5 h-3.5 text-amber-400" /> },
        { id: 'register' as ActiveTab, label: 'Flight Arrival Log', icon: <Plane className="w-3.5 h-3.5 text-amber-400" /> },
        { id: 'travel-insurance' as ActiveTab, label: 'Travel Insurance', icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> },
      ]
    },
    {
      id: 'support',
      label: 'Support',
      items: [
        { id: 'contact' as ActiveTab, label: 'Concierge Support', icon: <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> },
        { id: 'terms' as ActiveTab, label: 'Terms & Guidelines', icon: <FileText className="w-3.5 h-3.5 text-amber-400" /> },
      ]
    }
  ];

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderDropdown = (
    dropdownId: string, 
    label: string, 
    items: { id: ActiveTab; label: string; icon: React.ReactNode }[]
  ) => {
    const isDropdownActive = items.some(item => item.id === activeTab);
    const isOpen = activeHoverDropdown === dropdownId;

    return (
      <div 
        className="relative group"
        onMouseEnter={() => setActiveHoverDropdown(dropdownId)}
        onMouseLeave={() => setActiveHoverDropdown(null)}
      >
        <button 
          type="button"
          onClick={() => setActiveHoverDropdown(isOpen ? null : dropdownId)}
          className={`px-3 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer border ${
            isDropdownActive || isOpen
              ? 'text-amber-300 bg-amber-500/15 border border-amber-500/35 shadow-sm shadow-amber-500/20'
              : 'text-neutral-300 hover:text-white hover:bg-white/5 border-transparent'
          }`}
        >
          <span>{label}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-amber-400/80 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'group-hover:rotate-180'}`} />
          {isDropdownActive && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-400 rounded-full shadow-sm shadow-amber-400/50" />
          )}
        </button>

        {/* Dropdown Container */}
        <div 
          className={`absolute left-0 top-full pt-1.5 w-56 z-50 transition-all duration-150 ${
            isOpen ? 'block opacity-100 pointer-events-auto' : 'hidden group-hover:block opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="bg-neutral-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl p-2 border border-amber-500/30 shadow-amber-500/20">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  handleTabClick(item.id);
                  setActiveHoverDropdown(null);
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
    );
  };

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
            <nav className="hidden xl:flex items-center justify-center gap-1 2xl:gap-2 mx-auto">
              {/* Home */}
              <button
                id="nav-item-home"
                onClick={() => handleTabClick('home')}
                className={`px-3 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all cursor-pointer relative ${
                  activeTab === 'home'
                    ? 'text-amber-300 bg-amber-500/15 border border-amber-500/35 shadow-sm shadow-amber-500/20 font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                Home
                {activeTab === 'home' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-400 rounded-full shadow-sm shadow-amber-400/50" />
                )}
              </button>

              {/* Events */}
              <button
                id="nav-item-events"
                onClick={() => handleTabClick('events')}
                className={`px-3 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all cursor-pointer relative ${
                  activeTab === 'events'
                    ? 'text-amber-300 bg-amber-500/15 border border-amber-500/35 shadow-sm shadow-amber-500/20 font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                Events
                {activeTab === 'events' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-400 rounded-full shadow-sm shadow-amber-400/50" />
                )}
              </button>

              {/* Experience Dropdown */}
              {renderDropdown('experience', 'Experience', [
                { id: 'about-grenada', label: 'Spice Isle Guide', icon: <Palmtree className="w-3.5 h-3.5 text-amber-400" /> },
                { id: 'about-mellowland', label: 'Mellowland Tubing', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
                { id: 'gallery', label: 'Photo Gallery', icon: <Image className="w-3.5 h-3.5 text-amber-400" /> },
                { id: 'testimonials', label: 'Reveler Reviews', icon: <Star className="w-3.5 h-3.5 text-amber-400" /> },
              ])}

              {/* Planning Dropdown */}
              {renderDropdown('planning', 'Planning', [
                { id: 'hotels', label: 'Partner Hotels', icon: <Building className="w-3.5 h-3.5 text-amber-400" /> },
                { id: 'transportation', label: 'VIP Shuttles', icon: <Car className="w-3.5 h-3.5 text-amber-400" /> },
                { id: 'register', label: 'Flight Arrival Log', icon: <Plane className="w-3.5 h-3.5 text-amber-400" /> },
                { id: 'travel-insurance', label: 'Travel Insurance', icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> },
              ])}

              {/* Passes & VIP */}
              <button
                id="nav-item-shop"
                onClick={() => handleTabClick('shop')}
                className={`px-3 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all cursor-pointer relative ${
                  activeTab === 'shop'
                    ? 'text-amber-300 bg-amber-500/15 border border-amber-500/35 shadow-sm shadow-amber-500/20 font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                Passes & VIP
                {activeTab === 'shop' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-400 rounded-full shadow-sm shadow-amber-400/50" />
                )}
              </button>

              {/* Support Dropdown */}
              {renderDropdown('support', 'Support', [
                { id: 'contact', label: 'Concierge Support', icon: <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> },
                { id: 'terms', label: 'Terms & Guidelines', icon: <FileText className="w-3.5 h-3.5 text-amber-400" /> },
              ])}
            </nav>

            {/* Right Section: Controls */}
            <div className="flex items-center justify-end gap-2 sm:gap-2.5 shrink-0">
              {/* Extra Secondary Controls (Currency & Flight Arrival) */}
              <div className="hidden sm:flex items-center gap-2 sm:gap-2.5">
                {/* Currency Selector */}
                <div className="flex bg-neutral-900 border border-amber-500/20 rounded-xl p-0.5 text-[11px] font-semibold text-neutral-300 shadow-inner">
                  {(['GBP', 'USD', 'XCD'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
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
                  className="hidden md:flex px-3 sm:px-3.5 2xl:px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-neutral-950 font-extrabold text-[11px] 2xl:text-xs uppercase tracking-wider whitespace-nowrap items-center gap-1.5 rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer border border-amber-300/40"
                >
                  <Plane className="w-3.5 h-3.5 fill-neutral-950" />
                  <span>Flight Arrival</span>
                </button>
              </div>

              {/* Single Theme Toggle Button (Mobile, Tablet, Desktop) */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                id="nav-btn-theme-toggle"
                className="p-2 sm:p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 rounded-xl text-neutral-200 transition-all cursor-pointer hover:border-amber-400 shadow-lg shrink-0 group"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <Moon className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                )}
              </button>

              {/* Single Cart Icon Button (Mobile, Tablet, Desktop) */}
              <button
                onClick={onOpenCart}
                id="nav-btn-cart"
                className="relative p-2 sm:p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 rounded-xl text-neutral-200 transition-all cursor-pointer hover:border-amber-400 shadow-lg shrink-0 group"
                title="View Reserved Passes"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-neutral-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)] animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile & Tablet Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                id="nav-btn-mobile-toggle"
                className="xl:hidden p-2 sm:p-2.5 bg-neutral-900 border border-amber-500/30 rounded-xl text-neutral-200 hover:text-white cursor-pointer"
                title="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5 text-amber-400" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-neutral-950/95 backdrop-blur-2xl border-b border-amber-500/30 px-4 pt-3 pb-6 space-y-4 max-h-[80vh] overflow-y-auto animate-fadeIn shadow-2xl">
          <div className="space-y-4">
            {/* Direct Quick Links */}
            <div className="grid grid-cols-3 gap-2">
              {flatLinks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`p-3 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider font-bold text-center transition-all cursor-pointer ${
                    activeTab === item.id 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md font-bold' 
                      : 'bg-neutral-900 text-neutral-300 hover:bg-white/5 border border-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Dropdown sections in Mobile */}
            {dropdownMenus.map((menu) => (
              <div key={menu.id} className="space-y-1.5">
                <span className="block text-[9px] uppercase font-extrabold text-neutral-500 tracking-widest px-1">
                  {menu.label}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {menu.items.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => handleTabClick(subItem.id)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === subItem.id 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-md' 
                          : 'bg-neutral-900 text-neutral-300 hover:bg-white/5 border border-white/5'
                      }`}
                    >
                      {subItem.icon}
                      <span className="truncate">{subItem.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-xs text-neutral-400 font-medium">Select Currency:</span>
            <div className="flex bg-neutral-900 border border-amber-500/20 rounded-xl p-0.5 text-xs text-neutral-300">
              {(['GBP', 'USD', 'XCD'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1 rounded-lg font-medium ${
                    currency === c ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : ''
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-xs text-neutral-400 font-medium">Appearance:</span>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/35 rounded-xl text-amber-400 text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
