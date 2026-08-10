import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  Search, 
  Grid, 
  Trash2, 
  Check, 
  Image as ImageIcon, 
  FileText, 
  Percent, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { MediaItem } from '../types';
import { getMediaItems, addMediaItem, deleteMediaItem } from '../services/submissionService';

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  primaryColor?: string;
}

export const MediaSelectorModal: React.FC<MediaSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  primaryColor = '#F59E0B'
}) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ original: number; compressed: number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMedia(getMediaItems());
    }
  }, [isOpen]);

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
    setUploading(true);
    setUploadStats(null);

    const file = files[0];
    try {
      let url = '';
      let compressedSize = file.size;

      if (file.type.startsWith('image/')) {
        // Compress image using client-side HTML5 Canvas
        const result = await compressImage(file, 1024, 0.75);
        url = result.compressedUrl;
        compressedSize = result.compressedSize;

        setUploadStats({
          original: file.size,
          compressed: compressedSize,
          name: file.name
        });
      } else {
        // Non-image fallback: Convert directly to base64
        url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const newItem: MediaItem = {
        id: 'media-' + Date.now(),
        name: file.name,
        url: url,
        originalSize: file.size,
        compressedSize: compressedSize,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };

      addMediaItem(newItem);
      loadMedia();

      // Clear the stats banner after 4 seconds
      setTimeout(() => {
        setUploadStats(null);
      }, 4000);

    } catch (err) {
      console.error('File upload/compression failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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

  const filteredMedia = media.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

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
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Media Library Asset selector</span>
                <h3 className="text-base font-bold text-white font-sans mt-0.5">Choose Cover & Showcase Media</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col md:flex-row gap-6 min-h-0">
              {/* Left Side: Upload Zone */}
              <div className="w-full md:w-80 shrink-0 space-y-4">
                <div className="bg-neutral-950/40 p-4 border border-neutral-800/80 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Upload New Image</h4>
                  <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                    Files are compressed directly inside your browser prior to saving, protecting disk quotas and ensuring high speed loading times.
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
                      accept="image/*"
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
                          <p className="text-[10px] text-neutral-500 font-light">or drag and drop images</p>
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
                      <span>Compression Complete!</span>
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
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    placeholder="Search media files by name..."
                  />
                </div>

                {/* Media Grid */}
                <div className="flex-1 overflow-y-auto border border-neutral-800/80 rounded-xl bg-neutral-950/30 p-3 min-h-0">
                  {filteredMedia.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3">
                      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-500">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white">No Assets Found</h4>
                        <p className="text-[11px] text-neutral-500 font-light max-w-xs">
                          Try searching for another keyword or upload new images on the left panel.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredMedia.map((item) => {
                        const compressionRatio = Math.round((1 - item.compressedSize / item.originalSize) * 100);
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              onSelect(item.url);
                              onClose();
                            }}
                            className="group relative border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 aspect-video flex flex-col justify-end shadow-sm cursor-pointer hover:border-amber-500/60 transition-all hover:shadow-lg"
                          >
                            <img
                              src={item.url}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80';
                              }}
                              className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity"
                            />
                            
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent pointer-events-none" />

                            {/* Select Feedback on hover */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950/40 pointer-events-none">
                              <span className="bg-amber-500 text-neutral-950 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md">
                                Use This Image
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
