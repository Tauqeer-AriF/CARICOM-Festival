import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Upload, 
  Save, 
  MapPin, 
  Heart, 
  Tag, 
  Layers, 
  Calendar, 
  Camera, 
  Film,
  Sparkles 
} from 'lucide-react';
import { GalleryItem } from '../types';
import { uploadFileToServer } from '../services/submissionService';

interface EditGalleryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: GalleryItem) => void;
  item: GalleryItem | null;
  primaryColor?: string;
  onOpenMediaLibrary?: ((target: 'image' | 'video', onSelect: (url: string) => void) => void) | ((onSelect: (url: string) => void) => void);
}

const GALLERY_CATEGORIES: Array<GalleryItem['category']> = [
  'VIP Beach Fete',
  'Mellowland Village',
  'Soca & Concerts',
  'Island Excursions',
  'Luxury & Resort'
];

const ASPECT_RATIOS: Array<{ value: GalleryItem['aspectRatio']; label: string }> = [
  { value: 'aspect-[16/9]', label: '16:9 Landscape' },
  { value: 'aspect-[4/3]', label: '4:3 Standard' },
  { value: 'aspect-square', label: '1:1 Square' },
  { value: 'aspect-[3/4]', label: '3:4 Portrait' },
  { value: 'aspect-[9/16]', label: '9:16 Vertical Reel' }
];

export const EditGalleryItemModal: React.FC<EditGalleryItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
  primaryColor = '#F59E0B',
  onOpenMediaLibrary
}) => {
  const [formData, setFormData] = useState<Partial<GalleryItem>>({
    title: '',
    category: 'VIP Beach Fete',
    location: "Grand Anse Beach, Grenada",
    year: '2027',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80',
    videoUrl: '',
    mediaType: 'image',
    aspectRatio: 'aspect-[16/9]',
    caption: '',
    likesCount: 120,
    photographer: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          ...item,
          mediaType: item.mediaType || (item.videoUrl ? 'video' : 'image')
        });
      } else {
        setFormData({
          title: '',
          category: 'VIP Beach Fete',
          location: "Grand Anse Beach, Grenada",
          year: '2027',
          imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80',
          videoUrl: '',
          mediaType: 'image',
          aspectRatio: 'aspect-[16/9]',
          caption: '',
          likesCount: Math.floor(Math.random() * 150) + 50,
          photographer: ''
        });
      }
    }
  }, [isOpen, item]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isVideo = formData.mediaType === 'video';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const savedItem: GalleryItem = {
      id: item?.id || `gallery-${Date.now()}`,
      title: (formData.title || '').trim(),
      category: formData.category || 'VIP Beach Fete',
      location: (formData.location || '').trim(),
      year: (formData.year || '2027').trim(),
      imageUrl: (formData.imageUrl || '').trim() || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80',
      videoUrl: isVideo && formData.videoUrl ? formData.videoUrl.trim() : undefined,
      mediaType: formData.mediaType || (isVideo ? 'video' : 'image'),
      aspectRatio: formData.aspectRatio || 'aspect-[16/9]',
      caption: (formData.caption || '').trim(),
      likesCount: Number(formData.likesCount) || 0,
      photographer: formData.photographer?.trim() || undefined,
      uploadedAt: item?.uploadedAt || new Date().toISOString()
    };

    onSave(savedItem);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadFileToServer(file);
      if (res && res.url) {
        if (file.type.startsWith('video/')) {
          setFormData(prev => ({ ...prev, videoUrl: res.url, mediaType: 'video' }));
        } else {
          setFormData(prev => ({ ...prev, imageUrl: res.url }));
        }
      }
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenLibrary = (target: 'image' | 'video') => {
    if (onOpenMediaLibrary) {
      onOpenMediaLibrary(target, (url: string) => {
        if (target === 'video') {
          setFormData(prev => ({ ...prev, videoUrl: url, mediaType: 'video' }));
        } else {
          setFormData(prev => ({ ...prev, imageUrl: url }));
        }
      });
    }
  };

  return createPortal(
    <AnimatePresence>
      <div 
        id="edit-gallery-modal-portal"
        className="fixed inset-0 z-[990] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-[#0C0F1E] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-200 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800/80 bg-neutral-950/60 shrink-0">
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center border"
                style={{ 
                  backgroundColor: `${primaryColor}15`, 
                  borderColor: `${primaryColor}40`,
                  color: primaryColor 
                }}
              >
                {isVideo ? <Film className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-serif flex items-center gap-2">
                  {item ? 'Edit Gallery Media' : 'Add New Gallery Media'}
                  {item && (
                    <span className="text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded-full font-mono font-normal">
                      ID: {item.id}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-400 font-light">
                  {item ? 'Update photo/video showcase, caption, and tags' : 'Publish a new photo or video into the public festival media showcase'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
            {/* Media Type Toggle */}
            <div className="bg-neutral-950/80 border border-neutral-800 p-3.5 rounded-xl flex items-center justify-between gap-3">
              <div>
                <label className="text-neutral-300 font-bold uppercase block text-xs">Media Format</label>
                <p className="text-[11px] text-neutral-500 font-light">Select whether this is a photography item or video reel</p>
              </div>
              <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mediaType: 'image' }))}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    !isVideo
                      ? 'bg-amber-500 text-neutral-950 font-black shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Photo Image
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mediaType: 'video' }))}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    isVideo
                      ? 'bg-amber-500 text-neutral-950 font-black shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <VideoIcon className="w-3.5 h-3.5" /> Video Reel
                </button>
              </div>
            </div>

            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Media Title / Headline <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. Sunset Jouvert Celebrations"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Festival Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.category || 'VIP Beach Fete'}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as GalleryItem['category'] }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                >
                  {GALLERY_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Video URL (if Video) */}
            {isVideo && (
              <div className="space-y-2 bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-amber-400 font-bold uppercase text-xs flex items-center gap-1.5">
                    <VideoIcon className="w-3.5 h-3.5 text-amber-400" />
                    Video URL (YouTube, Vimeo, or MP4) <span className="text-rose-400">*</span>
                  </label>
                  {onOpenMediaLibrary && (
                    <button
                      type="button"
                      onClick={() => handleOpenLibrary('video')}
                      className="text-[10px] font-black text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/30 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <VideoIcon className="w-3 h-3" /> Select Video File
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required={isVideo}
                  value={formData.videoUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs font-mono"
                  placeholder="e.g. https://www.youtube.com/watch?v=... or .mp4 URL"
                />
              </div>
            )}

            {/* Image URL / Poster Thumbnail */}
            <div className="space-y-2 bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-neutral-400 font-bold uppercase text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  {isVideo ? (
                    <>
                      <span>Poster Thumbnail Image URL</span>
                      <span className="text-neutral-500 font-normal text-[11px] lowercase">(optional)</span>
                    </>
                  ) : (
                    <>
                      <span>Photo Image URL</span>
                      <span className="text-rose-400">*</span>
                    </>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-[10px] font-bold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 rounded border border-neutral-800 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-amber-400" />
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </button>
                  {onOpenMediaLibrary && (
                    <button
                      type="button"
                      onClick={() => handleOpenLibrary('image')}
                      className="text-[10px] font-black text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/30 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="w-3 h-3" /> Select from Library
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  required={!isVideo}
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder={isVideo ? "Optional preview poster image (e.g. https://...)" : "https://..."}
                />
                {formData.imageUrl && (
                  <div className="w-12 h-10 rounded-lg overflow-hidden border border-neutral-800 shrink-0 bg-neutral-900">
                    <img 
                      src={formData.imageUrl} 
                      alt="Thumbnail preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'; }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Location & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Location / Spot <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. Grand Anse Beach, Grenada"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> Festival Year Tag
                </label>
                <input
                  type="text"
                  required
                  value={formData.year || '2027'}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs font-mono"
                  placeholder="e.g. 2027"
                />
              </div>
            </div>

            {/* Aspect Ratio & Photographer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">Card Aspect Ratio</label>
                <select
                  value={formData.aspectRatio || 'aspect-[16/9]'}
                  onChange={(e) => setFormData(prev => ({ ...prev, aspectRatio: e.target.value as GalleryItem['aspectRatio'] }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                >
                  {ASPECT_RATIOS.map(ar => (
                    <option key={ar.value} value={ar.value}>{ar.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-amber-400" /> Photographer / Credit <span className="text-neutral-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.photographer || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, photographer: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. Grenada Tourism Media / Official"
                />
              </div>
            </div>

            {/* Caption / Description */}
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-bold uppercase block">
                Caption / Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.caption || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none text-xs leading-relaxed"
                placeholder="Share the story or moment behind this festival capture..."
              />
            </div>

            {/* Initial Likes Count */}
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" /> Initial Likes Count
              </label>
              <input
                type="number"
                min="0"
                value={formData.likesCount ?? 120}
                onChange={(e) => setFormData(prev => ({ ...prev, likesCount: Number(e.target.value) }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs font-mono"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold rounded-xl border border-neutral-800 cursor-pointer transition-colors text-xs"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5 text-xs uppercase tracking-wider"
              >
                <Save className="w-4 h-4" />
                {item ? 'Save Media Changes' : 'Publish to Gallery'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
