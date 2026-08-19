import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Hotel, 
  Save, 
  Star, 
  MapPin, 
  Clock, 
  Globe, 
  Image as ImageIcon, 
  Upload, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check 
} from 'lucide-react';
import { HotelItem } from '../types';
import { uploadFileToServer } from '../services/submissionService';

interface EditHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (hotel: HotelItem) => void;
  hotel: HotelItem | null;
  primaryColor?: string;
  onOpenMediaLibrary?: (onSelect: (url: string) => void) => void;
}

export const EditHotelModal: React.FC<EditHotelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  hotel,
  primaryColor = '#F59E0B',
  onOpenMediaLibrary
}) => {
  const [formData, setFormData] = useState<Partial<HotelItem>>({
    name: '',
    stars: 5,
    tagline: '',
    description: '',
    location: "Magazine Beach, St. George's",
    distanceToMellowland: '15 mins drive',
    features: [
      'Beachfront Ocean Suites',
      'Mellows Official Shuttle Stop',
      'On-site wristband collection desk'
    ],
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
    isRecommended: false,
    bookingUrl: 'https://www.royaltonresorts.com'
  });

  const [newFeature, setNewFeature] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (hotel) {
        setFormData({
          ...hotel,
          features: hotel.features || []
        });
      } else {
        setFormData({
          name: '',
          stars: 5,
          tagline: '',
          description: '',
          location: "Magazine Beach, St. George's",
          distanceToMellowland: '15 mins drive',
          features: [
            'Beachfront Ocean Suites',
            'Mellows Official Shuttle Stop',
            'On-site wristband collection desk'
          ],
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
          isRecommended: false,
          bookingUrl: 'https://www.royaltonresorts.com'
        });
      }
      setNewFeature('');
    }
  }, [isOpen, hotel]);

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

  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    setFormData(prev => ({
      ...prev,
      features: [...(prev.features || []), trimmed]
    }));
    setNewFeature('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== idx)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadFileToServer(file);
      if (res && res.url) {
        setFormData(prev => ({ ...prev, image: res.url }));
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
        setFormData(prev => ({ ...prev, image: url }));
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const savedHotel: HotelItem = {
      id: hotel?.id || `hotel-${Date.now()}`,
      name: (formData.name || '').trim(),
      stars: Number(formData.stars) || 5,
      tagline: (formData.tagline || '').trim(),
      description: (formData.description || '').trim(),
      location: (formData.location || '').trim(),
      distanceToMellowland: (formData.distanceToMellowland || '').trim(),
      features: (formData.features || []).filter(f => f.trim().length > 0),
      image: (formData.image || '').trim() || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
      isRecommended: Boolean(formData.isRecommended),
      bookingUrl: (formData.bookingUrl || '').trim()
    };

    onSave(savedHotel);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div 
        id="edit-hotel-modal-portal"
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
                <Hotel className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-serif flex items-center gap-2">
                  {hotel ? 'Edit Recommended Hotel' : 'Add Partner Hotel'}
                  {hotel && (
                    <span className="text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded-full font-mono font-normal">
                      ID: {hotel.id}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-400 font-light">
                  {hotel ? 'Update hotel amenities, star rating, booking link, and photos' : 'Add a partner hotel recommendation for festival guests'}
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
            {/* Name & Star Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Hotel Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. Royalton Grenada Resort & Spa"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Star Rating
                </label>
                <select
                  value={formData.stars || 5}
                  onChange={(e) => setFormData(prev => ({ ...prev, stars: Number(e.target.value) }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                  <option value={3}>⭐⭐⭐ (3 Stars)</option>
                  <option value={2}>⭐⭐ (2 Stars)</option>
                  <option value={1}>⭐ (1 Star)</option>
                </select>
              </div>
            </div>

            {/* Tagline & Spotlight Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Tagline Quote <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. Beachfront Luxury and Soca Sunset parties"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">Spotlight Placement</label>
                <select
                  value={formData.isRecommended ? 'true' : 'false'}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRecommended: e.target.value === 'true' }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                >
                  <option value="false">Standard Partner Grid</option>
                  <option value="true">⭐ Spotlight Recommendation (Hero Feature)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-bold uppercase block">
                Hotel Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none text-xs leading-relaxed"
                placeholder="Describe hotel amenities, beach access, restaurants, and festival shuttles..."
              />
            </div>

            {/* Cover Photo & Upload */}
            <div className="space-y-2 bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-neutral-400 font-bold uppercase text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  Cover Photo URL <span className="text-rose-400">*</span>
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
                    {isUploading ? 'Uploading...' : 'Upload Image'}
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
                  value={formData.image || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="https://..."
                />
                {formData.image && (
                  <div className="w-12 h-10 rounded-lg overflow-hidden border border-neutral-800 shrink-0 bg-neutral-900">
                    <img 
                      src={formData.image} 
                      alt="Hotel preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80'; }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Location, Distance & Booking Website */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Geographic Location <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. Magazine Beach, St. George's"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Distance to Mellowland <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.distanceToMellowland || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, distanceToMellowland: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. 15 mins drive"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-amber-400" /> Booking Website Link
                </label>
                <input
                  type="text"
                  value={formData.bookingUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookingUrl: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Hotel Amenities & Features */}
            <div className="space-y-2 bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl">
              <label className="text-neutral-400 font-bold uppercase text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Hotel Amenities & Features ({formData.features?.length || 0})
              </label>

              {/* Add Amenity Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. Beachfront Ocean Suites"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3.5 bg-neutral-900 hover:bg-neutral-850 text-amber-400 border border-neutral-800 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Amenity
                </button>
              </div>

              {/* Amenities List */}
              <div className="space-y-2 pt-2 max-h-48 overflow-y-auto pr-1">
                {(formData.features || []).map((feat, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between gap-2 bg-neutral-900/80 border border-neutral-800/80 px-3 py-2 rounded-lg text-xs text-neutral-300"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => {
                          const updated = [...(formData.features || [])];
                          updated[idx] = e.target.value;
                          setFormData(prev => ({ ...prev, features: updated }));
                        }}
                        className="w-full bg-transparent border-0 text-white focus:outline-none focus:ring-0 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1 text-neutral-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                      title="Remove amenity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
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
                {hotel ? 'Save Hotel Changes' : 'Create Partner Hotel'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
