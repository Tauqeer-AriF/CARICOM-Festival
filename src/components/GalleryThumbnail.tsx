import React, { useState } from 'react';
import { Video, Camera, Film } from 'lucide-react';
import { GalleryItem } from '../types';

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
  return (
    clean.startsWith('data:video') ||
    clean.startsWith('blob:') ||
    clean.includes('/uploads/') ||
    /\.(mp4|webm|mov|m4v|mkv|avi|ogv)$/i.test(clean)
  );
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
  const [hasError, setHasError] = useState(false);
  const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl);
  const cleanImageUrl = (item.imageUrl || '').trim();
  const cleanVideoUrl = (item.videoUrl || '').trim();

  // 1. If a custom thumbnail image URL is provided
  if (cleanImageUrl && !hasError) {
    // Check if the user accidentally put a direct video in imageUrl
    if (isDirectVideoUrl(cleanImageUrl)) {
      return (
        <div className={`relative overflow-hidden bg-neutral-950 ${className}`}>
          <video
            src={`${cleanImageUrl}#t=0.001`}
            preload="metadata"
            muted
            playsInline
            className={imageClassName}
          />
        </div>
      );
    }

    return (
      <div className={`relative overflow-hidden bg-neutral-950 ${className}`}>
        <img
          src={cleanImageUrl}
          alt={alt || item.title || 'Festival Media'}
          loading={loading}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={imageClassName}
        />
      </div>
    );
  }

  // 2. If it's a Video and no custom image thumbnail is provided (or image errored)
  if (isVideo && cleanVideoUrl) {
    // 2a. YouTube URL
    const ytThumb = getYouTubeThumbnail(cleanVideoUrl);
    if (ytThumb && !hasError) {
      return (
        <div className={`relative overflow-hidden bg-neutral-950 ${className}`}>
          <img
            src={ytThumb}
            alt={alt || item.title || 'YouTube Video Thumbnail'}
            loading={loading}
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
            className={imageClassName}
          />
        </div>
      );
    }

    // 2b. Direct Video File (MP4, WebM, MOV, uploads)
    return (
      <div className={`relative overflow-hidden bg-neutral-950 ${className}`}>
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

  // 3. Fallback when neither image nor video preview could be rendered (clean styled placeholder, NOT a broken image)
  return (
    <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 p-4 text-center select-none ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
        {isVideo ? <Film className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
      </div>
      <p className="text-[11px] font-bold text-neutral-300 line-clamp-1 max-w-[85%]">
        {item.title || (isVideo ? 'Festival Video' : 'Festival Photo')}
      </p>
      <span className="text-[9px] text-neutral-500 font-mono mt-0.5">
        {item.category || (isVideo ? 'Video Reel' : 'Photo')}
      </span>
    </div>
  );
};
