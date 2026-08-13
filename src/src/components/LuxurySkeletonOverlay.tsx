import React from 'react';
import { Sparkles, Palmtree } from 'lucide-react';

interface LuxurySkeletonOverlayProps {
  type?: 'page' | 'cards' | 'modal' | 'banner';
  count?: number;
  message?: string;
}

export const LuxurySkeletonOverlay: React.FC<LuxurySkeletonOverlayProps> = ({
  type = 'page',
  count = 4,
  message = 'Loading Luxury Experience...'
}) => {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full animate-fadeIn">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="gold-skeleton-card rounded-3xl p-6 border border-amber-500/20 bg-neutral-900/60 backdrop-blur-xl flex flex-col justify-between h-[380px] shadow-2xl relative"
          >
            {/* Top Badge & Image Skeleton */}
            <div className="space-y-4">
              <div className="h-48 w-full rounded-2xl gold-skeleton relative overflow-hidden flex items-center justify-center">
                <Palmtree className="w-10 h-10 text-amber-500/20 animate-pulse" />
              </div>

              {/* Title & Meta Lines */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-3/5 gold-skeleton rounded-lg" />
                  <div className="h-5 w-1/5 gold-skeleton rounded-md" />
                </div>
                <div className="h-4 w-4/5 gold-skeleton rounded-md opacity-70" />
                <div className="h-4 w-2/5 gold-skeleton rounded-md opacity-50" />
              </div>
            </div>

            {/* Bottom Actions Skeleton */}
            <div className="flex items-center justify-between pt-6 border-t border-amber-500/10">
              <div className="h-8 w-28 gold-skeleton rounded-xl" />
              <div className="h-10 w-36 gold-skeleton rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'modal') {
    return (
      <div className="p-8 space-y-6 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-full gold-skeleton border-2 border-amber-500/40 mx-auto flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
        <div className="space-y-2 max-w-sm mx-auto">
          <div className="h-6 w-3/4 gold-skeleton rounded-lg mx-auto" />
          <div className="h-4 w-5/6 gold-skeleton rounded-md mx-auto opacity-70" />
        </div>
        <div className="space-y-3 pt-4">
          <div className="h-12 w-full gold-skeleton rounded-xl" />
          <div className="h-12 w-full gold-skeleton rounded-xl opacity-60" />
        </div>
      </div>
    );
  }

  if (type === 'banner') {
    return (
      <div className="w-full h-64 rounded-3xl gold-skeleton-card border border-amber-500/20 p-8 flex flex-col justify-end space-y-3 animate-fadeIn">
        <div className="h-4 w-32 gold-skeleton rounded-md" />
        <div className="h-8 w-3/4 gold-skeleton rounded-xl" />
        <div className="h-4 w-1/2 gold-skeleton rounded-md opacity-70" />
      </div>
    );
  }

  // Full Page Transition Skeleton Overlay
  return (
    <div className="w-full space-y-10 animate-fadeIn py-4">
      {/* Hero Header Skeleton */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 gold-skeleton-card border border-amber-500/25 bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto">
          {/* Gold Emblem Spinner */}
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Palmtree className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>

          <div className="h-3 w-40 gold-skeleton rounded-full" />
          <div className="h-10 w-4/5 gold-skeleton rounded-2xl" />
          <div className="h-4 w-3/5 gold-skeleton rounded-lg opacity-75" />

          {/* Loading Indicator Pill */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>{message}</span>
          </div>
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="gold-skeleton-card rounded-3xl p-6 border border-amber-500/20 bg-neutral-900/50 backdrop-blur-md space-y-4 shadow-xl"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="h-44 w-full rounded-2xl gold-skeleton" />
            <div className="h-5 w-3/4 gold-skeleton rounded-lg" />
            <div className="h-4 w-full gold-skeleton rounded-md opacity-60" />
            <div className="h-4 w-2/3 gold-skeleton rounded-md opacity-40" />
            <div className="pt-4 flex justify-between items-center border-t border-amber-500/10">
              <div className="h-6 w-20 gold-skeleton rounded-md" />
              <div className="h-9 w-28 gold-skeleton rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
