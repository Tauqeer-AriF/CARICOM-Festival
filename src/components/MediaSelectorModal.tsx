import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  Search, 
  Trash2, 
  Image as ImageIcon, 
  Percent, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { MediaItem } from '../types';
import { getMediaItems, addMediaItem, deleteMediaItem, uploadFileToServer } from '../services/submissionService';

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  primaryColor?: string;
  allowedTypes?: 'all' | 'image' | 'video';
}

export const MediaSelectorModal: React.FC<MediaSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  primaryColor = '#F59E0B',
  allowedTypes = 'all'
}) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadStats, setUploadStats] = useState<{ original: number; compressed: number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');

  useEffect(() => {
    if (isOpen) {
      setMedia(getMediaItems());
      setErrorMessage(null);
      if (allowedTypes === 'image') {
        setTypeFilter('image');
      } else if (allowedTypes === 'video') {
        setTypeFilter('video');
      } else {
        setTypeFilter('all');
      }
    }

    const handleUpdate = () => loadMedia();
    window.addEventListener('media_updated', handleUpdate);
    return () => {
      window.removeEventListener('media_updated', handleUpdate);
    };
  }, [isOpen, allowedTypes]);

  const loadMedia = () => {
    setMedia(getMediaItems());
  };

  // Helper to format bytes nicely
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Canvas Image Compression Function
  const compressImage = (file: File, maxWidth = 1000, quality = 0.75): Promise<{ compressedUrl: string; compressedSize: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ compressedUrl: event.target?.result as string, compressedSize: file.size });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressedUrl = canvas.toDataURL(mimeType, quality);
          
          // Calculate exact base64 size in bytes
          const stringLength = compressedUrl.length - `data:${mimeType};base64,`.length;
          const sizeInBytes = Math.round(stringLength * 3 / 4);

          resolve({ compressedUrl, compressedSize: sizeInBytes });
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setUploading(true);
    setUploadStats(null);
    const totalFiles = files.length;

    let totalOriginal = 0;
    let totalCompressed = 0;
    let lastUploadedUrl = '';

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const isVideoFile = file.type.startsWith('video/') || Boolean(file.name.match(/\.(mp4|mov|avi|webm|mkv|m4v)$/i));

      if (allowedTypes === 'image' && isVideoFile) {
        setErrorMessage('Video files cannot be used as image thumbnails or covers. Please upload a photo/image (JPG, PNG, WebP) instead.');
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (allowedTypes === 'video' && !isVideoFile) {
        setErrorMessage('Only video files (MP4, WebM, MOV) can be uploaded here. Please select a video file.');
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      try {
        let url = '';
        let compressedSize = file.size;
        let fileType = file.type || (isVideoFile ? 'video/mp4' : 'image/jpeg');

        const serverRes = await uploadFileToServer(file);
        if (serverRes && serverRes.url) {
          url = serverRes.url;
          compressedSize = serverRes.size;
          fileType = serverRes.type || fileType;
          totalOriginal += file.size;
          totalCompressed += compressedSize;
        } else if (file.type.startsWith('image/')) {
          // Compress image using client-side HTML5 Canvas
          const result = await compressImage(file, 1024, 0.75);
          url = result.compressedUrl;
          compressedSize = result.compressedSize;

          totalOriginal += file.size;
          totalCompressed += compressedSize;
        } else {
          // Non-image fallback: Convert directly to base64
          url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          totalOriginal += file.size;
          totalCompressed += file.size;
        }

        lastUploadedUrl = url;

        const newItem: MediaItem = {
          id: 'media-' + Date.now() + '-' + i,
          name: file.name,
          url: url,
          originalSize: file.size,
          compressedSize: compressedSize,
          type: fileType,
          uploadedAt: new Date().toISOString()
        };

        await addMediaItem(newItem);
      } catch (err) {
        console.error('File upload/compression failed:', err);
      }
    }

    loadMedia();

    if (totalFiles === 1 && totalOriginal > 0) {
      setUploadStats({
        original: totalOriginal,
        compressed: totalCompressed,
        name: files[0].name
      });
      setTimeout(() => {
        setUploadStats(null);
      }, 4000);
    }

    // Auto select the newly uploaded item if onSelect is defined and type matches
    if (lastUploadedUrl && onSelect) {
      onSelect(lastUploadedUrl);
      onClose();
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteMediaItem(id);
    loadMedia();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const isItemVideo = (item: MediaItem): boolean => {
    return Boolean(
      item.type?.startsWith('video/') ||
      item.url?.includes('data:video') ||
      item.url?.includes('/uploads/') && /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(item.url) ||
      /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(item.url)
    );
  };

  const handleSelectMedia = (item: MediaItem) => {
    const isVideo = isItemVideo(item);
    if (allowedTypes === 'image' && isVideo) {
      setErrorMessage('MP4 / Video files cannot be selected as image thumbnails or covers. Please select a photo or image.');
      return;
    }
    if (allowedTypes === 'video' && !isVideo) {
      setErrorMessage('Photos cannot be selected as video media. Please select a video file.');
      return;
    }
    onSelect(item.url);
    onClose();
  };

  const filteredMedia = media.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const isVideo = isItemVideo(item);
    
    // Strict allowedTypes restriction
    if (allowedTypes === 'image' && isVideo) return false;
    if (allowedTypes === 'video' && !isVideo) return false;

    // User-selected tab filter
    if (typeFilter === 'image' && isVideo) return false;
    if (typeFilter === 'video' && !isVideo) return false;
    
    return matchesSearch;
  });

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative w-full max-w-4xl bg-[#090B15] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col h-[85vh] max-h-[800px] text-left"
          >
            {/* Header */}
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-[#070911]">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                  {allowedTypes === 'image'
                    ? 'Photo & Poster Thumbnail Selector'
                    : allowedTypes === 'video'
                    ? 'Video Reel & Media Selector'
                    : 'Media Library Asset selector'}
                </span>
                <h3 className="text-base font-bold text-white font-sans mt-0.5">
                  {allowedTypes === 'image'
                    ? 'Choose Photo / Thumbnail Image (Images Only)'
                    : allowedTypes === 'video'
                    ? 'Choose Video File (MP4, WebM)'
                    : 'Choose Cover & Showcase Media'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message Toast/Banner */}
            {errorMessage && (
              <div className="bg-rose-500/10 border-b border-rose-500/20 px-5 py-2.5 flex items-center justify-between text-rose-400 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-[11px] underline hover:text-rose-300 ml-4 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col md:flex-row gap-6 min-h-0">
              {/* Left Side: Upload Zone */}
              <div className="w-full md:w-80 shrink-0 space-y-4">
                <div className="bg-neutral-950/40 p-4 border border-neutral-800/80 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {allowedTypes === 'image'
                      ? 'Upload Thumbnail Photo'
                      : allowedTypes === 'video'
                      ? 'Upload Video File'
                      : 'Upload New Media'}
                  </h4>
                  <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                    {allowedTypes === 'image'
                      ? 'Select JPG, PNG, or WebP images. MP4 video files are filtered out to keep thumbnails lightweight.'
                      : allowedTypes === 'video'
                      ? 'Select MP4 or WebM video files to store in the festival media library.'
                      : 'Files are compressed directly inside your browser prior to saving, protecting disk quotas and ensuring high speed loading times.'}
                  </p>

                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2.5 min-h-[160px] ${
                      dragActive ? 'border-amber-500 bg-amber-500/5' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/60'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={
                        allowedTypes === 'image'
                          ? 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml'
                          : allowedTypes === 'video'
                          ? 'video/mp4,video/webm,video/quicktime,video/x-matroska,video/avi'
                          : 'image/*,video/*'
                      }
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                    
                    {uploading ? (
                      <>
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                        <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">Compressing & Saving...</span>
                      </>
                    ) : (
                      <>
                        <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-white">Click to Browse</p>
                          <p className="text-[10px] text-neutral-500 font-light">
                            {allowedTypes === 'image'
                              ? 'or drag and drop photo images'
                              : allowedTypes === 'video'
                              ? 'or drag and drop MP4/video files'
                              : 'or drag and drop images'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Compression Alert Widget */}
                {uploadStats && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>Upload & Optimization Complete!</span>
                    </div>
                    <p className="text-[10px] text-neutral-300 font-light leading-snug truncate" title={uploadStats.name}>
                      {uploadStats.name}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div>
                        <span className="text-neutral-500 uppercase block font-bold text-[9px]">Original</span>
                        <span className="text-neutral-300 line-through font-mono">{formatBytes(uploadStats.original)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 uppercase block font-bold text-[9px]">Compressed</span>
                        <span className="text-emerald-400 font-bold font-mono">{formatBytes(uploadStats.compressed)}</span>
                      </div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-1.5 rounded-lg text-center font-bold font-mono text-[10px] text-emerald-400 flex items-center justify-center gap-1">
                      <Percent className="w-3 h-3" />
                      <span>{Math.round((1 - uploadStats.compressed / uploadStats.original) * 100)}% size savings</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Side: Media Asset Grid */}
              <div className="flex-1 flex flex-col gap-4 min-w-0 min-h-[300px]">
                {/* Search Bar & Media Type Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                      placeholder="Search media files by name..."
                    />
                  </div>
                  {allowedTypes === 'all' && (
                    <div className="flex bg-neutral-950 border border-neutral-800 rounded-xl p-1 gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setTypeFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === 'all' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'}`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setTypeFilter('image')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === 'image' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'}`}
                      >
                        📷 Photos
                      </button>
                      <button
                        type="button"
                        onClick={() => setTypeFilter('video')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === 'video' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'}`}
                      >
                        🎥 Videos
                      </button>
                    </div>
                  )}
                  {allowedTypes === 'image' && (
                    <div className="flex bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 items-center gap-1.5 text-xs font-bold text-amber-400 shrink-0">
                      <span>📷 Photos Only</span>
                    </div>
                  )}
                  {allowedTypes === 'video' && (
                    <div className="flex bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 items-center gap-1.5 text-xs font-bold text-rose-400 shrink-0">
                      <span>🎥 Videos Only</span>
                    </div>
                  )}
                </div>

                {/* Media Grid */}
                <div className="flex-1 overflow-y-auto border border-neutral-800/80 rounded-xl bg-neutral-950/30 p-3 min-h-0">
                  {filteredMedia.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3">
                      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-500">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white">
                          {allowedTypes === 'image'
                            ? 'No Image Assets Found'
                            : allowedTypes === 'video'
                            ? 'No Video Assets Found'
                            : 'No Assets Found'}
                        </h4>
                        <p className="text-[11px] text-neutral-500 font-light max-w-xs">
                          {allowedTypes === 'image'
                            ? 'Upload a new photo on the left panel or search by another name.'
                            : 'Try searching for another keyword or upload new files on the left panel.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredMedia.map((item) => {
                        const compressionRatio = Math.round((1 - item.compressedSize / item.originalSize) * 100);
                        const isVideo = isItemVideo(item);
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectMedia(item)}
                            className="group relative border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 aspect-video flex flex-col justify-end shadow-sm cursor-pointer hover:border-amber-500/60 transition-all hover:shadow-lg"
                          >
                            {isVideo ? (
                              <video
                                src={item.url}
                                className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity"
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={item.url}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80';
                                }}
                                className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity"
                              />
                            )}
                            
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent pointer-events-none" />

                            {/* Badge Top Left */}
                            <div className="absolute top-2 left-2 z-10">
                              {isVideo ? (
                                <span className="bg-rose-500/90 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow">
                                  VIDEO
                                </span>
                              ) : (
                                <span className="bg-neutral-950/80 border border-neutral-700 text-neutral-300 text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                                  PHOTO
                                </span>
                              )}
                            </div>

                            {/* Select Feedback on hover */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950/40 pointer-events-none">
                              <span className="bg-amber-500 text-neutral-950 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md">
                                {isVideo ? 'Use This Video' : 'Use This Image'}
                              </span>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={(e) => handleDelete(e, item.id)}
                              className="absolute top-2 right-2 p-1.5 bg-neutral-950/90 border border-neutral-800 text-neutral-400 hover:text-rose-400 rounded-md opacity-0 group-hover:opacity-100 transition-all shadow cursor-pointer z-10 hover:border-rose-500/20"
                              title="Delete from Library"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Bottom Info Ribbon */}
                            <div className="p-2 z-10 space-y-0.5">
                              <p className="text-white font-bold text-[10px] truncate leading-tight" title={item.name}>
                                {item.name}
                              </p>
                              <div className="flex justify-between items-center text-[9px] text-neutral-400 font-mono">
                                <span>{formatBytes(item.compressedSize)}</span>
                                {compressionRatio > 0 && (
                                  <span className="text-emerald-400 font-bold">-{compressionRatio}%</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
