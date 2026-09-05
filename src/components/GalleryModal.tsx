import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FESTIVAL_IMAGES } from '../data/festivalData';
import { getFallbackImage, isDirectVideoUrl } from './GalleryThumbnail';
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
  Share2, 
  Camera,
  Video,
  AlertCircle
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

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
  }
  return null;
};

const getVimeoEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const match = url.trim().match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (match && match[1]) {
    return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
  }
  return null;
};

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

  const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl);

  const toggleZoom = () => {
    if (isVideo) return;
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

  const renderMedia = () => {
    if (isVideo) {
      const rawVideoUrl = (item.videoUrl || '').trim();
      const rawImageUrl = (item.imageUrl || '').trim();

      const isPortrait = 
        item.aspectRatio === 'aspect-portrait' ||
        rawVideoUrl.includes('/shorts/') ||
        rawImageUrl.includes('/shorts/') ||
        rawVideoUrl.includes('tiktok.com') ||
        rawVideoUrl.includes('instagram.com/reel');

      const embedAspectClass = isPortrait 
        ? 'aspect-[9/16] h-full max-h-full max-w-[320px] sm:max-w-[380px] w-auto' 
        : 'aspect-video w-full max-w-4xl max-h-full';

      // Check YouTube
      const ytEmbed = getYouTubeEmbedUrl(rawVideoUrl) || getYouTubeEmbedUrl(rawImageUrl);
      if (ytEmbed) {
        return (
          <div 
            className={`${embedAspectClass} flex items-center justify-center bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-amber-500/20`}
            style={{ maxHeight: '100%', maxWidth: '100%' }}
          >
            <iframe
              src={ytEmbed}
              title={item.title}
              className="w-full h-full rounded-xl sm:rounded-2xl object-contain"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      // Check Vimeo
      const vimeoEmbed = getVimeoEmbedUrl(rawVideoUrl) || getVimeoEmbedUrl(rawImageUrl);
      if (vimeoEmbed) {
        return (
          <div 
            className={`${embedAspectClass} flex items-center justify-center bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-amber-500/20`}
            style={{ maxHeight: '100%', maxWidth: '100%' }}
          >
            <iframe
              src={vimeoEmbed}
              title={item.title}
              className="w-full h-full rounded-xl sm:rounded-2xl object-contain"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      // Direct video file (MP4, WebM, MOV, blob, data:video, etc.)
      const directVideoSrc = rawVideoUrl || (isDirectVideoUrl(rawImageUrl) ? rawImageUrl : '');

      if (directVideoSrc) {
        return (
          <video
            src={directVideoSrc}
            controls
            autoPlay
            playsInline
            loop
            preload="metadata"
            poster={item.imageUrl && !item.imageUrl.includes('logo') && !item.imageUrl.includes('favicon') && !item.imageUrl.startsWith('data:video') ? item.imageUrl : undefined}
            className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl sm:rounded-2xl shadow-2xl border border-amber-500/20 bg-black block"
            style={{ maxHeight: '100%', maxWidth: '100%' }}
          />
        );
      }

      // If video source wasn't direct, but an image URL is present, display image preview gracefully
      if (rawImageUrl) {
        return (
          <img
            src={rawImageUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = getFallbackImage(item);
            }}
            className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl sm:rounded-2xl shadow-2xl border border-amber-500/20 block select-none pointer-events-auto"
            style={{ maxHeight: '100%', maxWidth: '100%' }}
          />
        );
      }

      // Fallback if video URL is missing or invalid
      return (
        <div className="w-full max-w-4xl max-h-full flex flex-col items-center justify-center bg-neutral-900/90 rounded-2xl border border-amber-500/20 text-center p-6 gap-3 shadow-2xl overflow-y-auto">
          <AlertCircle className="w-12 h-12 text-amber-400 opacity-80 shrink-0" />
          <h4 className="text-base font-bold text-white font-serif">{item.title}</h4>
          <p className="text-xs text-neutral-400 max-w-md leading-relaxed">
            Video link format not recognized or video source unavailable. Please verify the video URL (YouTube, Vimeo, or MP4) in the Admin Dashboard.
          </p>
        </div>
      );
    }

    const photoSrc = (item.imageUrl || '').trim() || getFallbackImage(item);

    return (
      <img
        src={photoSrc}
        alt={item.title}
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = getFallbackImage(item);
        }}
        className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl sm:rounded-2xl shadow-2xl transition-transform duration-300 ease-out border border-amber-500/20 block select-none pointer-events-auto"
        style={{ 
          maxHeight: '100%', 
          maxWidth: '100%',
          transform: zoomLevel > 1 ? `scale(${zoomLevel})` : undefined 
        }}
      />
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-2xl animate-fadeIn">
      
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container - Explicit Height so flex children have a definite bounding box */}
      <div 
        className="relative z-10 w-full max-w-5xl bg-neutral-950 border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[94dvh] sm:h-[90vh] max-h-[95vh] my-auto"
        style={{ height: 'min(94dvh, 92vh)' }}
      >
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between py-2.5 px-3.5 sm:py-3.5 sm:px-5 border-b border-amber-500/20 bg-neutral-900/90 backdrop-blur-md shrink-0 z-20">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {isVideo ? (
              <span className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-[10px] uppercase tracking-wider rounded-full flex items-center gap-1 shadow-md shrink-0">
                <Video className="w-3 h-3 text-rose-400" />
                <span>Video Highlight</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider rounded-full flex items-center gap-1 shrink-0">
                <Camera className="w-3 h-3 text-amber-400" />
                <span>Photo</span>
              </span>
            )}
            <span className="px-2.5 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 font-extrabold text-[10px] uppercase tracking-wider rounded-full flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="truncate max-w-[120px] sm:max-w-none">{item.category}</span>
            </span>
            <span className="text-neutral-400 text-xs hidden sm:inline">• {item.year}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Button (Photos only) */}
            {!isVideo && (
              <button
                onClick={toggleZoom}
                className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-amber-500/20"
                title="Toggle Zoom Level"
              >
                {zoomLevel > 1 ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline font-mono">{Math.round(zoomLevel * 100)}%</span>
              </button>
            )}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-1.5 sm:p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-all cursor-pointer border border-neutral-700"
              title="Share Gallery Link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-300 rounded-xl transition-all cursor-pointer border border-neutral-700"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Copy Toast */}
        {isCopied && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 bg-emerald-500 text-neutral-950 font-bold text-xs rounded-full shadow-lg">
            Link copied to clipboard!
          </div>
        )}

        {/* Image & Lightbox Container */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-black flex items-center justify-center">
          
          {/* Previous Arrow */}
          <button
            onClick={onPrev}
            className="absolute left-2 sm:left-4 z-30 p-2 sm:p-3 bg-neutral-950/80 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 border border-amber-500/40 rounded-full shadow-2xl transition-all cursor-pointer backdrop-blur-md group"
            title="Previous Item (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* Next Arrow */}
          <button
            onClick={onNext}
            className="absolute right-2 sm:right-4 z-30 p-2 sm:p-3 bg-neutral-950/80 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 border border-amber-500/40 rounded-full shadow-2xl transition-all cursor-pointer backdrop-blur-md group"
            title="Next Item (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Media Display */}
          <div 
            className={`w-full h-full flex items-center justify-center p-2 sm:p-4 ${!isVideo ? 'cursor-zoom-in' : ''} min-h-0 min-w-0 overflow-hidden`}
            onClick={!isVideo ? toggleZoom : undefined}
          >
            {renderMedia()}
          </div>
        </div>

        {/* Caption & Metadata Footer */}
        <div className="p-3 sm:p-4 bg-neutral-900/95 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 shrink-0 max-h-[25vh] sm:max-h-[25vh] overflow-y-auto z-20">
          <div className="space-y-1 max-w-2xl min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold font-serif text-white tracking-tight truncate sm:whitespace-normal">
                {item.title}
              </h3>
            </div>

            <div className="flex items-center gap-3 text-[11px] sm:text-xs text-amber-400/90 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{item.location}</span>
              </span>
              {item.photographer && (
                <span className="flex items-center gap-1 text-neutral-400">
                  <Camera className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.photographer}</span>
                </span>
              )}
            </div>

            {item.caption && (
              <p className="text-xs text-neutral-300 leading-relaxed pt-0.5 max-h-16 sm:max-h-20 overflow-y-auto pr-1">
                {item.caption}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">
            {/* Like Counter */}
            <button
              onClick={handleLikeToggle}
              className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isLiked 
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="font-mono">{likesCount}</span>
            </button>

            {/* Reserve VIP Pass CTA */}
            {onNavigateShop && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateShop();
                }}
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer shrink-0"
              >
                <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-neutral-950" />
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
