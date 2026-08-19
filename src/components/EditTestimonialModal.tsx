import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MessageSquare, 
  Save, 
  Star, 
  User, 
  MapPin, 
  Image as ImageIcon, 
  Upload, 
  Sparkles, 
  Quote 
} from 'lucide-react';
import { TestimonialItem } from '../types';
import { uploadFileToServer } from '../services/submissionService';

interface EditTestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (testimonial: TestimonialItem) => void;
  testimonial: TestimonialItem | null;
  primaryColor?: string;
  onOpenMediaLibrary?: (onSelect: (url: string) => void) => void;
}

export const EditTestimonialModal: React.FC<EditTestimonialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  testimonial,
  primaryColor = '#F59E0B',
  onOpenMediaLibrary
}) => {
  const [formData, setFormData] = useState<Partial<TestimonialItem>>({
    name: '',
    role: 'Soca Enthusiast & Reveler',
    location: 'London, UK',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80',
    quote: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (testimonial) {
        setFormData({ ...testimonial });
      } else {
        setFormData({
          name: '',
          role: 'Soca Enthusiast & Reveler',
          location: 'London, UK',
          rating: 5,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80',
          quote: ''
        });
      }
    }
  }, [isOpen, testimonial]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadFileToServer(file);
      if (res && res.url) {
        setFormData(prev => ({ ...prev, avatar: res.url }));
      }
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectMedia = () => {
    if (onOpenMediaLibrary) {
      onOpenMediaLibrary((url: string) => {
        setFormData(prev => ({ ...prev, avatar: url }));
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const savedTestimonial: TestimonialItem = {
      id: testimonial?.id || `testimonial-${Date.now()}`,
      name: (formData.name || '').trim(),
      role: (formData.role || 'Guest Reveler').trim(),
      location: (formData.location || '').trim(),
      rating: Number(formData.rating) || 5,
      avatar: (formData.avatar || '').trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80',
      quote: (formData.quote || '').trim()
    };

    onSave(savedTestimonial);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div 
        id="edit-testimonial-modal-portal"
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
          className="relative w-full max-w-xl max-h-[90vh] bg-[#0C0F1E] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-200 z-10"
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
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-serif flex items-center gap-2">
                  {testimonial ? 'Edit Guest Testimonial' : 'Create Guest Testimonial'}
                  {testimonial && (
                    <span className="text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded-full font-mono font-normal">
                      ID: {testimonial.id}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-400 font-light">
                  {testimonial ? 'Update guest review quote, rating, and avatar' : 'Publish guest experiences to the public review board'}
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
            {/* Guest Name & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-400" /> Guest Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Role / Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.role || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. VIP Reveler & Soca Enthusiast"
                />
              </div>
            </div>

            {/* Location & Star Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Origin / Location <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. London, United Kingdom"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Star Rating
                </label>
                <select
                  value={formData.rating || 5}
                  onChange={(e) => setFormData(prev => ({ ...prev, rating: Number(e.target.value) }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs font-semibold"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 Stars - Exceptional)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 Stars - Great)</option>
                  <option value={3}>⭐⭐⭐ (3 Stars - Good)</option>
                  <option value={2}>⭐⭐ (2 Stars - Fair)</option>
                  <option value={1}>⭐ (1 Star - Poor)</option>
                </select>
              </div>
            </div>

            {/* Avatar URL & Upload */}
            <div className="space-y-2 bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-neutral-400 font-bold uppercase text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  Profile / Avatar Image URL <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-[10px] font-bold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-850 px-2.5 py-1 rounded border border-neutral-800 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-amber-400" />
                    {isUploading ? 'Uploading...' : 'Upload Avatar'}
                  </button>
                  {onOpenMediaLibrary && (
                    <button
                      type="button"
                      onClick={handleSelectMedia}
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
                  required
                  value={formData.avatar || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="https://..."
                />
                {formData.avatar && (
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-neutral-800 shrink-0 bg-neutral-900">
                    <img 
                      src={formData.avatar} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'; }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                <Quote className="w-3.5 h-3.5 text-amber-400" /> Testimonial Quote <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.quote || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, quote: e.target.value }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none text-xs leading-relaxed"
                placeholder="Share the guest's carnival experience, memories, music vibe, or hospitality review..."
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 font-bold rounded-xl border border-neutral-800 cursor-pointer transition-colors text-xs"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5 text-xs uppercase tracking-wider"
              >
                <Save className="w-4 h-4" />
                {testimonial ? 'Save Testimonial Changes' : 'Create Testimonial'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
