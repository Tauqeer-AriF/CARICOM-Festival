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
  Loader2,
  Check,
  Video,
  Film,
  CheckSquare,
  Square,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { MediaItem } from '../types';
import { CustomConfirmModal } from './CustomConfirmModal';
import { 
  getMediaItems, 
  addMediaItem, 
  deleteMediaItem, 
  deleteMultipleMediaItems,
  getAllUsedMediaUrls,
  getUnusedMediaItems,
  getAutoCleanupConfig,
  saveAutoCleanupConfig,
  performUnusedMediaCleanup,
  checkAndRunAutoCleanup,
  uploadFileToServer,
  AutoCleanupConfig
} from '../services/submissionService';

interface MediaLibraryTabProps {
  primaryColor?: string;
}

export const MediaLibraryTab: React.FC<MediaLibraryTabProps> = ({
  primaryColor = '#F59E0B'
}) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [usedUrls, setUsedUrls] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'unused'>('all');
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadStats, setUploadStats] = useState<{ original: number; compressed: number; name: string } | null>(null);

  // Auto-Cleanup Modal State
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [autoCleanupConfig, setAutoCleanupConfig] = useState<AutoCleanupConfig>({ enabled: false, ageInDays: 7 });
  const [selectedCleanupDays, setSelectedCleanupDays] = useState<number>(7);
  const [customDaysInput, setCustomDaysInput] = useState<string>('14');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Confirm Modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    primaryColor?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  useEffect(() => {
    loadMedia();
    const config = getAutoCleanupConfig();
    setAutoCleanupConfig(config);
    setSelectedCleanupDays(config.ageInDays);

    // Run background auto-cleanup if due
    const cleanupResult = checkAndRunAutoCleanup();
    if (cleanupResult.executed && cleanupResult.deletedCount > 0) {
      showToast(`Auto-cleanup removed ${cleanupResult.deletedCount} unused media item(s) (${formatBytes(cleanupResult.freedBytes)} freed)`);
      loadMedia();
    }

    const handleUpdate = () => loadMedia();
    window.addEventListener('media_updated', handleUpdate);
    return () => {
      window.removeEventListener('media_updated', handleUpdate);
    };
  }, []);

  const loadMedia = () => {
    setMedia(getMediaItems());
    setUsedUrls(getAllUsedMediaUrls());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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
          
          // Convert heavy PNG files (which ignore the quality parameter in toDataURL) to highly compressed JPEG
          // except if they are small logos/icons under 200KB where transparency needs to be preserved.
          let mimeType = 'image/jpeg';
          if (file.type === 'image/png' && file.size < 200 * 1024) {
            mimeType = 'image/png';
          }
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
    const totalFiles = files.length;

    let totalOriginal = 0;
    let totalCompressed = 0;
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < totalFiles; i++) {
      setUploadProgress({ current: i + 1, total: totalFiles });
      const file = files[i];

      try {
        let url = '';
        let compressedSize = file.size;
        let fileType = file.type || (file.name.match(/\.(mp4|mov|avi|webm|mkv)$/i) ? 'video/mp4' : 'image/jpeg');

        // First attempt server binary file upload
        const serverRes = await uploadFileToServer(file);
        if (serverRes && serverRes.url) {
          url = serverRes.url;
          compressedSize = serverRes.size;
          fileType = serverRes.type || fileType;
          totalOriginal += file.size;
          totalCompressed += compressedSize;
        } else if (file.type.startsWith('image/')) {
          const result = await compressImage(file, 1024, 0.75);
          url = result.compressedUrl;
          compressedSize = result.compressedSize;

          totalOriginal += file.size;
          totalCompressed += compressedSize;
        } else {
          url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          totalOriginal += file.size;
          totalCompressed += file.size;
        }

        const newItem: MediaItem = {
          id: 'media-' + Date.now() + '-' + i,
          name: file.name,
          url: url,
          originalSize: file.size,
          compressedSize: compressedSize,
          type: fileType,
          uploadedAt: new Date().toISOString()
        };

        const success = await addMediaItem(newItem);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        console.error('File upload/compression failed:', err);
        failedCount++;
      }
    }

    loadMedia();
    if (successCount > 0) {
      if (totalFiles === 1 && totalOriginal > 0) {
        setUploadStats({
          original: totalOriginal,
          compressed: totalCompressed,
          name: files[0].name
        });
        setTimeout(() => setUploadStats(null), 5000);
      } else {
        showToast(`Successfully uploaded ${successCount} media item${successCount > 1 ? 's' : ''}!`);
      }
    }

    if (failedCount > 0) {
      showToast(`Warning: ${failedCount} file${failedCount > 1 ? 's' : ''} failed to upload. Payloads might be too large.`);
    }

    setUploading(false);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Asset',
      message: 'Are you sure you want to permanently delete this media asset?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      primaryColor: '#EF4444',
      onConfirm: () => {
        deleteMediaItem(id);
        setSelectedIds(prev => prev.filter(item => item !== id));
        loadMedia();
        showToast('Asset deleted!');
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;
    setConfirmState({
      isOpen: true,
      title: 'Bulk Delete Assets',
      message: `Are you sure you want to permanently delete the ${selectedIds.length} selected asset${selectedIds.length > 1 ? 's' : ''}?`,
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      primaryColor: '#EF4444',
      onConfirm: () => {
        deleteMultipleMediaItems(selectedIds);
        showToast(`Successfully deleted ${selectedIds.length} asset${selectedIds.length > 1 ? 's' : ''}!`);
        setSelectedIds([]);
        loadMedia();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBulkCopyUrls = async () => {
    if (!selectedIds.length) return;
    const selectedMedia = media.filter(item => selectedIds.includes(item.id));
    const urlsText = selectedMedia.map(item => item.url).join('\n');
    try {
      await navigator.clipboard.writeText(urlsText);
      showToast(`Copied ${selectedIds.length} URL${selectedIds.length > 1 ? 's' : ''} to clipboard!`);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  };

  const handleCopyLink = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      showToast('URL copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredMedia.map(item => item.id);
    const isAllSelected = allFilteredIds.every(id => selectedIds.includes(id));
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const unusedMediaList = media.filter(item => !usedUrls.has(item.url));
  const unusedCount = unusedMediaList.length;

  const filteredMedia = media.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const isVideo = item.type?.startsWith('video/') || item.url?.includes('data:video') || /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(item.url);
    const isUsed = usedUrls.has(item.url);

    if (typeFilter === 'video' && !isVideo) return false;
    if (typeFilter === 'image' && isVideo) return false;
    if (typeFilter === 'unused' && isUsed) return false;
    return matchesSearch;
  });

  const handleInstantCleanup = (daysThreshold: number) => {
    const matchingUnused = getUnusedMediaItems(daysThreshold);
    if (!matchingUnused.length) {
      showToast('No unused media items match the selected timeframe.');
      return;
    }

    const totalFreed = matchingUnused.reduce((acc, i) => acc + (i.compressedSize || i.originalSize || 0), 0);
    const dayLabel = daysThreshold === 0 ? 'any age' : `older than ${daysThreshold} day${daysThreshold > 1 ? 's' : ''}`;

    setConfirmState({
      isOpen: true,
      title: 'Unused Assets Cleanup',
      message: `Are you sure you want to permanently delete ${matchingUnused.length} unused media asset(s) (${dayLabel})? This will free up ${formatBytes(totalFreed)}.`,
      confirmText: 'Clean Up Now',
      cancelText: 'Cancel',
      primaryColor: '#EF4444',
      onConfirm: () => {
        const result = performUnusedMediaCleanup(daysThreshold);
        showToast(`Deleted ${result.deletedCount} unused asset(s) (${formatBytes(result.freedBytes)} freed)!`);
        setSelectedIds([]);
        loadMedia();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSaveAutoCleanup = (enabled: boolean, ageInDays: number) => {
    const newConfig: AutoCleanupConfig = {
      enabled,
      ageInDays,
      lastRunTimestamp: new Date().toISOString()
    };
    saveAutoCleanupConfig(newConfig);
    setAutoCleanupConfig(newConfig);
    showToast(enabled ? `Auto-cleanup enabled for unused media older than ${ageInDays === 0 ? 'immediate' : ageInDays + ' days'}!` : 'Auto-cleanup disabled.');
  };

  const ITEMS_PER_PAGE = 9;
  const totalPages = Math.ceil(filteredMedia.length / ITEMS_PER_PAGE) || 1;
  const paginatedMedia = filteredMedia.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openLightbox = (item: MediaItem) => {
    const idx = filteredMedia.findIndex(m => m.id === item.id);
    if (idx !== -1) {
      setLightboxIndex(idx);
    }
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextLightbox = () => {
    if (lightboxIndex === null || filteredMedia.length === 0) return;
    setLightboxIndex((lightboxIndex + 1) % filteredMedia.length);
  };

  const prevLightbox = () => {
    if (lightboxIndex === null || filteredMedia.length === 0) return;
    setLightboxIndex((lightboxIndex - 1 + filteredMedia.length) % filteredMedia.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredMedia]);

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-amber-500/90 text-neutral-950 font-bold text-xs rounded-xl shadow-lg flex items-center justify-between border border-amber-400"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 fill-neutral-950" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Heading */}
      <div>
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Dashboard Media Storage</span>
        <h2 className="text-xl font-bold text-white font-serif mt-0.5">Asset & Media Library</h2>
        <p className="text-xs text-neutral-400 font-light">
          Upload, manage, and batch-process assets. High-resolution photos are automatically compressed on-the-fly to protect client memory limits.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column: Upload panel */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans flex items-center justify-between">
              <span>Upload Assets</span>
              <span className="text-[10px] text-amber-400 font-mono font-bold">Multi-File Ready</span>
            </h3>
            <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
              Drag and drop single or multiple files. Client-side compression automatically shrinks image size while preserving vibrant contrast.
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
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">
                    {uploadProgress ? `Processing ${uploadProgress.current} of ${uploadProgress.total}...` : 'Compressing & Saving...'}
                  </span>
                </>
              ) : (
                <>
                  <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400">
                    <Upload className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Click to Browse Files</p>
                    <p className="text-[10px] text-neutral-500 font-light">Select multiple photos or videos</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Auto Cleanup Button Card */}
          <div className="bg-[#0C0F1E] border border-amber-500/20 rounded-2xl p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Auto Storage Manager</span>
              </span>
              {autoCleanupConfig.enabled && (
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold rounded-full font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ACTIVE</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 font-light leading-snug">
              Automatically detect and clean up media files that are not referenced in events, gallery, site settings, or pages.
            </p>
            <button
              type="button"
              onClick={() => setShowCleanupModal(true)}
              className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Clean Up / Auto-Delete Unused</span>
            </button>
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

        {/* Right column: Media grid & search & bulk bar */}
        <div className="flex-1 space-y-4">
          {/* Search and Media Type Filter */}
          <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                placeholder="Search assets by name..."
              />
            </div>

            {/* Media Type Filter Pills */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end flex-wrap">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'all'
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                <Film className="w-3 h-3" />
                <span>All ({media.length})</span>
              </button>
              <button
                onClick={() => setTypeFilter('image')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'image'
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Photos</span>
              </button>
              <button
                onClick={() => setTypeFilter('video')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'video'
                    ? 'bg-rose-500 text-white shadow'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                <Video className="w-3 h-3" />
                <span>Videos</span>
              </button>
              <button
                onClick={() => setTypeFilter('unused')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all ${
                  typeFilter === 'unused'
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>Unused ({unusedCount})</span>
              </button>
            </div>
          </div>

          {/* BULK ACTIONS TOOLBAR */}
          <div className="bg-[#12162E] border border-amber-500/30 p-3 px-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-white cursor-pointer bg-neutral-900 px-2.5 py-1.5 rounded-lg border border-neutral-800"
              >
                {filteredMedia.length > 0 && filteredMedia.every(item => selectedIds.includes(item.id)) ? (
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-500" />
                )}
                <span>Select All ({filteredMedia.length})</span>
              </button>

              {selectedIds.length > 0 && (
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  {selectedIds.length} selected
                </span>
              )}
            </div>

            {selectedIds.length > 0 ? (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleBulkCopyUrls}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 font-bold text-xs rounded-lg border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Selected URLs</span>
                </button>

                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs rounded-lg border border-rose-500/40 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete ({selectedIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="p-1.5 text-neutral-400 hover:text-white cursor-pointer"
                  title="Deselect All"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-neutral-500 font-light hidden sm:inline">
                Check items to unlock bulk operations (copy URLs, batch deletion)
              </span>
            )}
          </div>

          {filteredMedia.length === 0 ? (
            <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-16 text-center space-y-3 shadow-md">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500 inline-block">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">No Assets Found</h4>
                <p className="text-xs text-neutral-500 font-light max-w-sm mx-auto leading-relaxed">
                  No media items match your search query or filter. Upload new files to populate your media library.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedMedia.map((item) => {
                  const pctSavings = Math.round((1 - item.compressedSize / item.originalSize) * 100);
                  const isSelected = selectedIds.includes(item.id);
                  const isVideo = item.type?.startsWith('video/') || item.url?.includes('data:video') || /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(item.url);

                  return (
                    <div
                      key={item.id}
                      className={`group border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all duration-250 ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500' 
                          : 'border-neutral-800/80 bg-[#0C0F1E] hover:border-neutral-700'
                      }`}
                    >
                      {/* Media Preview Window */}
                      <div 
                        onClick={() => openLightbox(item)}
                        className="relative aspect-video bg-neutral-950 overflow-hidden border-b border-neutral-900 cursor-pointer group/preview"
                      >
                        {isVideo ? (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80';
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                          <span className="px-3 py-1.5 bg-neutral-950/90 text-amber-400 border border-neutral-700/80 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xl">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Expand View</span>
                          </span>
                        </div>
                        
                        {/* Technical Meta badge */}
                        <span className="absolute top-3 left-3 bg-neutral-950/90 backdrop-blur-md border border-neutral-800 text-[8px] font-extrabold text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono z-10 flex items-center gap-1">
                          {isVideo && <Video className="w-2.5 h-2.5 text-rose-400" />}
                          <span>{item.type?.split('/')[1]?.toUpperCase() || 'MEDIA'}</span>
                        </span>

                        {/* Multi-Select Checkbox Top-Right */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(item.id);
                          }}
                          className="absolute top-3 right-3 z-20 p-1 bg-neutral-950/90 rounded-lg border border-neutral-700 hover:border-amber-400 cursor-pointer transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-400" />
                          )}
                        </button>
                      </div>

                      {/* Metadata & Actions */}
                      <div className="p-4 space-y-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate leading-tight" title={item.name}>
                              {item.name}
                            </h4>
                            <span className="text-[9px] text-neutral-500 font-mono block">
                              Uploaded: {new Date(item.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {usedUrls.has(item.url) ? (
                            <span className="shrink-0 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-mono font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>IN USE</span>
                            </span>
                          ) : (
                            <span className="shrink-0 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-mono font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>UNUSED</span>
                            </span>
                          )}
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-neutral-800 bg-neutral-950/20 px-4 py-3 rounded-xl">
                  <span className="text-[11px] text-neutral-400">
                    Showing <span className="text-white font-bold">{((page - 1) * ITEMS_PER_PAGE) + 1}</span> to{' '}
                    <span className="text-white font-bold">{Math.min(page * ITEMS_PER_PAGE, filteredMedia.length)}</span> of{' '}
                    <span className="text-white font-bold">{filteredMedia.length}</span> assets
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Prev
                    </button>
                    <span className="text-xs font-mono text-neutral-300">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FULL-SCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredMedia[lightboxIndex] && (() => {
          const currentItem = filteredMedia[lightboxIndex];
          const isVideo = currentItem.type?.startsWith('video/') || currentItem.url?.includes('data:video') || /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(currentItem.url);

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden"
              onClick={closeLightbox}
            >
              {/* Top Control Header Bar */}
              <div 
                className="flex items-center justify-between text-white border-b border-neutral-800/80 pb-4 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold rounded-lg shadow">
                    {lightboxIndex + 1} / {filteredMedia.length}
                  </span>
                  <div className="space-y-0.5 max-w-xs sm:max-w-md">
                    <h3 className="text-sm font-bold text-white truncate" title={currentItem.name}>
                      {currentItem.name}
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-mono block">
                      {currentItem.type?.toUpperCase() || 'MEDIA'} • Original: {formatBytes(currentItem.originalSize)} → Saved: {formatBytes(currentItem.compressedSize)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(currentItem)}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 font-bold text-xs rounded-xl border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedId === currentItem.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Copy Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={currentItem.url}
                    download={currentItem.name}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-bold text-xs rounded-xl border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Download Asset"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      handleDelete(currentItem.id);
                      closeLightbox();
                    }}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 cursor-pointer transition-colors"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={closeLightbox}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl border border-neutral-700 cursor-pointer transition-colors ml-2"
                    title="Close (ESC)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Media Container with Nav Arrows */}
              <div 
                className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {filteredMedia.length > 1 && (
                  <button
                    type="button"
                    onClick={prevLightbox}
                    className="absolute left-2 sm:left-6 z-20 p-3.5 rounded-full bg-neutral-900/90 border border-neutral-700 text-white hover:bg-amber-500 hover:text-neutral-950 transition-all cursor-pointer shadow-2xl hover:scale-110"
                    title="Previous (Left Arrow)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}

                <motion.div
                  key={currentItem.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-full max-h-full flex items-center justify-center p-2"
                >
                  {isVideo ? (
                    <video
                      src={currentItem.url}
                      controls
                      autoPlay
                      className="max-h-[75vh] max-w-full rounded-2xl border border-neutral-800 shadow-2xl object-contain bg-black"
                    />
                  ) : (
                    <img
                      src={currentItem.url}
                      alt={currentItem.name}
                      referrerPolicy="no-referrer"
                      className="max-h-[75vh] max-w-full object-contain rounded-2xl border border-neutral-800 shadow-2xl bg-neutral-950"
                    />
                  )}
                </motion.div>

                {filteredMedia.length > 1 && (
                  <button
                    type="button"
                    onClick={nextLightbox}
                    className="absolute right-2 sm:right-6 z-20 p-3.5 rounded-full bg-neutral-900/90 border border-neutral-700 text-white hover:bg-amber-500 hover:text-neutral-950 transition-all cursor-pointer shadow-2xl hover:scale-110"
                    title="Next (Right Arrow)"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Bottom Footer Info */}
              <div 
                className="flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/80 pt-3 gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-neutral-500">Uploaded:</span>
                  <span className="text-neutral-300 font-bold">
                    {new Date(currentItem.uploadedAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-neutral-500 font-mono text-[10px]">
                  <span className="bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg">← → Navigate</span>
                  <span className="bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg">ESC Close</span>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* AUTO-CLEANUP & UNUSED MEDIA MODAL */}
      <AnimatePresence>
        {showCleanupModal && (
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0C0F1E] border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-8"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-neutral-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-serif">Auto-Delete Unused Media</h3>
                    <p className="text-xs text-neutral-400">Clean up unreferenced media or configure automatic background cleanup.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCleanupModal(false)}
                  className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Summary Banner */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-400 block font-light">Unused Assets Found</span>
                  <span className="text-amber-400 font-bold font-mono text-sm">{unusedCount} item{unusedCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-400 block font-light">Total Unused Size</span>
                  <span className="text-amber-400 font-bold font-mono text-sm">
                    {formatBytes(unusedMediaList.reduce((acc, i) => acc + (i.compressedSize || i.originalSize || 0), 0))}
                  </span>
                </div>
              </div>

              {/* Section 1: Manual / Immediate Cleanup */}
              <div className="space-y-3 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>1. Instant Clean Up Now</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">Select Timeframe</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'All / Immediate', days: 0 },
                    { label: '> 1 Day', days: 1 },
                    { label: '> 7 Days', days: 7 },
                    { label: '> 30 Days', days: 30 },
                  ].map((option) => {
                    const matchCount = getUnusedMediaItems(option.days).length;
                    return (
                      <button
                        key={option.days}
                        type="button"
                        onClick={() => setSelectedCleanupDays(option.days)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedCleanupDays === option.days
                            ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-md'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <span className="block text-[11px] font-bold">{option.label}</span>
                        <span className={`text-[9px] font-mono block mt-0.5 ${selectedCleanupDays === option.days ? 'text-neutral-900 font-bold' : 'text-neutral-500'}`}>
                          {matchCount} match{matchCount !== 1 ? 'es' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Days Input Option */}
                <div className="pt-2 flex items-center gap-2">
                  <label className="text-[11px] text-neutral-400 whitespace-nowrap">Or custom older than:</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={customDaysInput}
                    onChange={(e) => {
                      setCustomDaysInput(e.target.value);
                      const num = parseInt(e.target.value) || 1;
                      setSelectedCleanupDays(num);
                    }}
                    className="w-20 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[11px] text-neutral-400">days</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleInstantCleanup(selectedCleanupDays)}
                  className="w-full py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Delete Matching Unused Media ({getUnusedMediaItems(selectedCleanupDays).length})</span>
                </button>
              </div>

              {/* Section 2: Scheduled Background Auto-Cleanup */}
              <div className="space-y-3 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>2. Automatic Scheduled Cleanup</span>
                  </span>
                  
                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !autoCleanupConfig.enabled;
                      handleSaveAutoCleanup(nextState, autoCleanupConfig.ageInDays);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                      autoCleanupConfig.enabled ? 'bg-emerald-500 justify-end' : 'bg-neutral-800 justify-start'
                    }`}
                  >
                    <motion.div
                      layout
                      className="w-4 h-4 rounded-full bg-white shadow-md"
                    />
                  </button>
                </div>

                <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                  When enabled, the application will automatically purge unused media items older than your configured threshold in the background.
                </p>

                {autoCleanupConfig.enabled && (
                  <div className="space-y-3 pt-2 border-t border-neutral-800">
                    <label className="text-[11px] font-bold text-neutral-300 block">Auto-Purge Threshold:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Immediate', days: 0 },
                        { label: '> 7 Days', days: 7 },
                        { label: '> 30 Days', days: 30 },
                      ].map((opt) => (
                        <button
                          key={opt.days}
                          type="button"
                          onClick={() => handleSaveAutoCleanup(true, opt.days)}
                          className={`py-2 px-3 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all ${
                            autoCleanupConfig.ageInDays === opt.days
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                              : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {autoCleanupConfig.lastRunTimestamp && (
                      <p className="text-[10px] text-neutral-500 font-mono text-center pt-1">
                        Last automated run: {new Date(autoCleanupConfig.lastRunTimestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowCleanupModal(false)}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs rounded-xl border border-neutral-800 transition-colors cursor-pointer"
              >
                Close Manager
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <CustomConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        primaryColor={confirmState.primaryColor}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

