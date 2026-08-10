import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Search, 
  Trash2, 
  Copy, 
  Sparkles, 
  Percent, 
  ImageIcon, 
  Calendar, 
  Loader2,
  Check
} from 'lucide-react';
import { MediaItem } from '../types';
import { getMediaItems, addMediaItem, deleteMediaItem } from '../services/submissionService';

interface MediaLibraryTabProps {
  primaryColor?: string;
}

export const MediaLibraryTab: React.FC<MediaLibraryTabProps> = ({
  primaryColor = '#F59E0B'
}) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadStats, setUploadStats] = useState<{ original: number; compressed: number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMedia(getMediaItems());
  }, []);

  const loadMedia = () => {
    setMedia(getMediaItems());
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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
          
          // Calculate base64 size in bytes
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
        const result = await compressImage(file, 1024, 0.75);
        url = result.compressedUrl;
        compressedSize = result.compressedSize;

        setUploadStats({
          original: file.size,
          compressed: compressedSize,
          name: file.name
        });
      } else {
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

      setTimeout(() => {
        setUploadStats(null);
      }, 5000);

    } catch (err) {
      console.error('File upload/compression failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this media asset?')) {
      deleteMediaItem(id);
      loadMedia();
    }
  };

  const handleCopyLink = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
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

  return (
    <div className="space-y-6">
      {/* Tab Heading */}
      <div>
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Dashboard Media Storage</span>
        <h2 className="text-xl font-bold text-white font-serif mt-0.5">Asset & Media Library</h2>
        <p className="text-xs text-neutral-400 font-light">
          Upload and organize assets. High-resolution photos are automatically compressed on-the-fly to protect client memory limits.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column: Upload panel */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">Upload Asset</h3>
            <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
              Drag and drop files. High-efficiency client-side compression reduces up to 90% of image size while preserving rich contrast and vibrant tropical colors.
            </p>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2.5 min-h-[160px] ${
                dragActive ? 'border-amber-500 bg-amber-500/5' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/40'
              }`}
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

          {/* Compression Stats Panel */}
          {uploadStats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3 shadow"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Compression Successful!</span>
              </div>
              <p className="text-[10px] text-neutral-300 font-light leading-snug truncate" title={uploadStats.name}>
                {uploadStats.name}
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-neutral-800/40">
                <div>
                  <span className="text-neutral-500 uppercase block font-bold text-[9px]">Original</span>
                  <span className="text-neutral-300 line-through font-mono">{formatBytes(uploadStats.original)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase block font-bold text-[9px]">Compressed</span>
                  <span className="text-emerald-400 font-bold font-mono">{formatBytes(uploadStats.compressed)}</span>
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-center font-bold font-mono text-[10px] text-emerald-400 flex items-center justify-center gap-1">
                <Percent className="w-3.5 h-3.5" />
                <span>{Math.round((1 - uploadStats.compressed / uploadStats.original) * 100)}% size reduction</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right column: Media grid & search */}
        <div className="flex-1 space-y-4">
          <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                placeholder="Search media files by name..."
              />
            </div>
            <div className="text-[10px] font-mono text-neutral-500">
              Database contains: <span className="text-neutral-300 font-bold">{media.length} files</span>
            </div>
          </div>

          {filteredMedia.length === 0 ? (
            <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-16 text-center space-y-3 shadow-md">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500 inline-block">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">No Assets Found</h4>
                <p className="text-xs text-neutral-500 font-light max-w-sm mx-auto leading-relaxed">
                  No images match your search query. Drag and drop a new image to save it.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMedia.map((item) => {
                const compressionSavings = item.originalSize - item.compressedSize;
                const pctSavings = Math.round((1 - item.compressedSize / item.originalSize) * 100);
                return (
                  <div
                    key={item.id}
                    className="group border border-neutral-800/80 bg-[#0C0F1E] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-neutral-700 transition-all duration-250"
                  >
                    {/* Image Preview Window */}
                    <div className="relative aspect-video bg-neutral-950 overflow-hidden border-b border-neutral-900">
                      <img
                        src={item.url}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-neutral-950/0 transition-colors duration-300" />
                      
                      {/* Technical Meta badge */}
                      <span className="absolute top-3 left-3 bg-neutral-950/90 backdrop-blur-md border border-neutral-800 text-[8px] font-extrabold text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                        {item.type.split('/')[1] || 'IMAGE'}
                      </span>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-4 space-y-3.5">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white truncate leading-tight" title={item.name}>
                          {item.name}
                        </h4>
                        <span className="text-[9px] text-neutral-500 font-mono block">
                          Uploaded: {new Date(item.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Storage Analytics Ribbon */}
                      <div className="bg-neutral-950/40 p-2 border border-neutral-800/40 rounded-xl grid grid-cols-2 gap-2 text-[10px] font-mono leading-tight">
                        <div>
                          <span className="text-neutral-500 text-[8px] block uppercase font-bold">Saved Disk</span>
                          <span className="text-emerald-400 font-bold">{formatBytes(item.compressedSize)}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 text-[8px] block uppercase font-bold">Reduction</span>
                          <span className="text-amber-400 font-bold">-{pctSavings}%</span>
                        </div>
                      </div>

                      {/* Operations row */}
                      <div className="flex items-center gap-2 pt-1.5 border-t border-neutral-900">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(item)}
                          className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 bg-neutral-900 hover:bg-rose-950/10 border border-neutral-800 text-neutral-500 hover:text-rose-400 hover:border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
  );
};
