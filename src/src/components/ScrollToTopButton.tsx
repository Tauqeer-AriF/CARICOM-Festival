import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      id="btn-back-to-top"
      aria-label="Back to top"
      className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40 p-2.5 sm:p-3 bg-neutral-900/90 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 border border-amber-500/40 hover:border-amber-400 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer flex items-center gap-2"
      title="Back to Top"
    >
      <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300" />
      <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider text-neutral-200 group-hover:text-amber-300 pr-1">
        Top
      </span>
    </button>
  );
};
