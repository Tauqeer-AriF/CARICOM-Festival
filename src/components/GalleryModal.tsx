import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FESTIVAL_IMAGES } from '../data/festivalData';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Heart, 
  MapPin, 
  Sparkles, 
  Ticket, 
  Download,
  Share2,
  Camera
} from 'lucide-react';
import { GalleryItem } from '../types';

interface GalleryModalProps {
  item: GalleryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onNavigateShop?: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  item,
  isOpen,
  onClose,
  onNext,
  onPrev,
  onNavigateShop
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setLikesCount(item.likesCount);
      setIsLiked(false);
      setZoomLevel(1);
    }
  }, [item]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen || !item) return null;

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

  const handleLikeToggle = () => {
    if (isLiked) {
      setLikesCount((prev) => prev - 1);
      setIsLiked(false);
    } else {
      setLikesCount((prev) => prev + 1);
      setIsLiked(true);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-2xl animate-fadeIn">
      
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl bg-neutral-950 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-amber-500/20 bg-neutral-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              {item.category}
            </span>
            <span className="text-neutral-400 text-xs hidden sm:inline">• {item.year}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Button */}
            <button
              onClick={toggleZoom}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-amber-500/20"
              title="Toggle Zoom Level"
            >
              {zoomLevel > 1 ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-mono">{Math.round(zoomLevel * 100)}%</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-all cursor-pointer border border-neutral-700"
              title="Share Gallery Link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-300 rounded-xl transition-all cursor-pointer border border-neutral-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Copy Toast */}
        {isCopied && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-emerald-500 text-neutral-950 font-bold text-xs rounded-full shadow-lg">
            Link copied to clipboard!
          </div>
        )}

        {/* Image & Lightbox Container */}
        <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center min-h-[300px] sm:min-h-[450px]">
          
          {/* Previous Arrow */}
          <button
            onClick={onPrev}
            className="absolute left-3 sm:left-5 z-20 p-3 bg-neutral-950/80 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 border border-amber-500/40 rounded-full shadow-2xl transition-all cursor-pointer backdrop-blur-md group"
            title="Previous Photo (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* Next Arrow */}
          <button
            onClick={onNext}
            className="absolute right-3 sm:right-5 z-20 p-3 bg-neutral-950/80 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 border border-amber-500/40 rounded-full shadow-2xl transition-all cursor-pointer backdrop-blur-md group"
            title="Next Photo (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Image Display */}
          <div 
            className="w-full h-full flex items-center justify-center p-2 sm:p-6 cursor-zoom-in overflow-auto max-h-[70vh]"
            onClick={toggleZoom}
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.mellowlandGarden;
              }}
              className="max-h-[65vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-300 ease-out border border-amber-500/20"
              style={{ transform: `scale(${zoomLevel})` }}
            />
          </div>
        </div>

        {/* Caption & Metadata Footer */}
        <div className="p-5 sm:p-6 bg-neutral-900 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold font-serif text-white tracking-tight">
                {item.title}
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs text-amber-400/90 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {item.location}
              </span>
              {item.photographer && (
                <span className="flex items-center gap-1 text-neutral-400">
                  <Camera className="w-3.5 h-3.5" />
                  {item.photographer}
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed pt-1">
              {item.caption}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0">
            {/* Like Counter */}
            <button
              onClick={handleLikeToggle}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isLiked 
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="font-mono">{likesCount}</span>
            </button>

            {/* Reserve VIP Pass CTA */}
            {onNavigateShop && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateShop();
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Ticket className="w-4 h-4 fill-neutral-950" />
                <span>Reserve Pass for 2027</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
