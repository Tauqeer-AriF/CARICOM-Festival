import React from 'react';
import { ActiveTab } from '../types';
import { Palmtree, ArrowRight } from 'lucide-react';

interface NotFoundViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ setActiveTab }) => {
  return (
    <div className="py-20 text-center space-y-6 max-w-md mx-auto animate-fadeIn">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-2xl">
        <Palmtree className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-white font-serif">404 - Page Not Found</h1>
        <p className="text-xs text-neutral-400 font-light leading-relaxed">
          The requested island page or resource could not be found. Let's get you back to the main festival schedule!
        </p>
      </div>
      <button
        onClick={() => setActiveTab('home')}
        className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
      >
        <span>Back to Festival Home</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
