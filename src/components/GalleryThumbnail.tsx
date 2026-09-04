import React, { useState, useEffect } from 'react';
import { Video, Camera, Film } from 'lucide-react';
import { GalleryItem } from '../types';
import { FESTIVAL_IMAGES } from '../data/festivalData';

export function extractYouTubeId(url: string | undefined | null): string | null {
  if (!url) return null;
  const match = url.trim().match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/i);
  return match ? match[1] : null;
}

export function getYouTubeThumbnail(url: string | undefined | null): string | null {
  const id = extractYouTubeId(url);
  if (id) {
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return null;
}

export function isDirectVideoUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  
  // Explicit image extensions or data URI images are NEVER videos
  if (
    /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|tiff)$/i.test(clean) ||
    clean.startsWith('data:image/')
  ) {
    return false;
  }

  return (
    clean.startsWith('data:video') ||
    clean.startsWith('blob:') ||
    /\.(mp4|webm|mov|m4v|mkv|avi|ogv)$/i.test(clean)
  );
}

export function getFallbackImage(item: Partial<GalleryItem>): string {
  const title = (item.title || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();

  if (title.includes('waterfall') || title.includes('annandale') || title.includes('rapids')) {
    return FESTIVAL_IMAGES.gallery8; // Waterfall
  }
  if (title.includes('tubing') || title.includes('river') || cat.includes('tubing')) {
    return FESTIVAL_IMAGES.gallery2; // River tubing
  }
  if (title.includes('underwater') || title.includes('sculpture') || title.includes('diving') || title.includes('snorkel')) {
    return FESTIVAL_IMAGES.gallery6; // Underwater park
  }
  if (title.includes('garden') || title.includes('haven') || cat.includes('garden') || title.includes('organic')) {
    return FESTIVAL_IMAGES.gallery10; // Tropical Garden
  }
  if (title.includes('market') || title.includes('spice') || cat.includes('spice')) {
    return FESTIVAL_IMAGES.gallery9; // Spice Market
  }
  if (title.includes('suite') || title.includes('hotel') || title.includes('royalton') || cat.includes('luxury')) {
    return FESTIVAL_IMAGES.gallery7; // Luxury suites
  }
  if (title.includes('sunset') || title.includes('catamaran') || title.includes('cruise') || title.includes('horizon')) {
    return FESTIVAL_IMAGES.gallery11; // Sunset Catamaran
  }
  if (title.includes('beach') || title.includes('fete') || cat.includes('beach')) {
    return FESTIVAL_IMAGES.gallery4; // Beach fete
  }
  if (title.includes('white') || title.includes('gala')) {
    return FESTIVAL_IMAGES.gallery3; // White Gala
  }
  if (title.includes('soca') || title.includes('stage') || title.includes('concert') || title.includes('pyro')) {
    return FESTIVAL_IMAGES.gallery5; // Soca stage
  }
  if (title.includes('rave') || title.includes('night') || title.includes('bass')) {
    return FESTIVAL_IMAGES.gallery12; // Night rave
  }

  return FESTIVAL_IMAGES.gallery1;
}

interface GalleryThumbnailProps {
  item: Partial<GalleryItem>;
  className?: string;
  imageClassName?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
}

export const GalleryThumbnail: React.FC<GalleryThumbnailProps> = ({
  item,
  className = 'w-full h-full',
  imageClassName = 'w-full h-full object-cover',
  alt,
  loading = 'lazy'
}) => {
  const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl);
  const cleanImageUrl = (item.imageUrl || '').trim();
  const cleanVideoUrl = (item.videoUrl || '').trim();

  // Initial source determination: if cleanImageUrl is missing on a video, do not use preset fallback image
  const initialSrc = isVideo ? cleanImageUrl : (cleanImageUrl || getFallbackImage(item));
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [errorCount, setErrorCount] = useState<number>(0);

  // Determine wrapper class cleanly
  const isAbsolute = className.includes('absolute');
  const wrapperClass = `${isAbsolute ? 'absolute inset-0' : 'relative'} w-full h-full overflow-hidden bg-neutral-950 ${className}`.trim();

  // Sync state if props change
  useEffect(() => {
    const nextSrc = isVideo ? cleanImageUrl : (cleanImageUrl || getFallbackImage(item));
    setCurrentSrc(nextSrc);
    setErrorCount(0);
  }, [cleanImageUrl, isVideo, item.title, item.category]);

  const handleImageError = () => {
    if (errorCount === 0) {
      // First error fallback: try category-specific fallback image
      const fallback = getFallbackImage(item);
      if (fallback !== currentSrc) {
        setCurrentSrc(fallback);
        setErrorCount(1);
        return;
      }
    }
    if (errorCount === 1) {
      // Second error fallback: try guaranteed primary hero
      if (FESTIVAL_IMAGES.hero !== currentSrc) {
        setCurrentSrc(FESTIVAL_IMAGES.hero);
        setErrorCount(2);
        return;
      }
    }
    setErrorCount(3);
  };

  // 1. Direct Video in Image URL or Video URL without custom poster
  if (isVideo && (!currentSrc || errorCount >= 2) && cleanVideoUrl) {
    const ytThumb = getYouTubeThumbnail(cleanVideoUrl);
    if (ytThumb && errorCount < 2) {
      return (
        <div className={wrapperClass}>
          <img
            src={ytThumb}
            alt={alt || item.title || 'Video Preview'}
            loading={loading}
            referrerPolicy="no-referrer"
            onError={handleImageError}
            className={imageClassName}
          />
        </div>
      );
    }

    return (
      <div className={wrapperClass}>
        <video
          src={`${cleanVideoUrl}#t=0.001`}
          preload="metadata"
          muted
          playsInline
          className={imageClassName}
        />
      </div>
    );
  }

  // 2. Direct Video File in imageUrl string
  if (currentSrc && isDirectVideoUrl(currentSrc)) {
    return (
      <div className={wrapperClass}>
        <video
          src={`${currentSrc}#t=0.001`}
          preload="metadata"
          muted
          playsInline
          className={imageClassName}
        />
      </div>
    );
  }

  // 3. Render Image
  if (currentSrc && errorCount < 3) {
    return (
      <div className={wrapperClass}>
        <img
          src={currentSrc}
          alt={alt || item.title || 'Festival Media'}
          loading={loading}
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className={imageClassName}
        />
      </div>
    );
  }

  // 4. Video Fallback if image failed
  if (isVideo && cleanVideoUrl) {
    return (
      <div className={wrapperClass}>
        <video
          src={`${cleanVideoUrl}#t=0.001`}
          preload="metadata"
          muted
          playsInline
          className={imageClassName}
        />
      </div>
    );
  }

  // 5. Absolute fallback to verified festival image
  return (
    <div className={wrapperClass}>
      <img
        src={FESTIVAL_IMAGES.gallery1}
        alt={alt || item.title || 'Festival Media'}
        loading={loading}
        referrerPolicy="no-referrer"
        className={imageClassName}
      />
    </div>
  );
};
