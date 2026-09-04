import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  CalendarRange, 
  Clock, 
  MapPin, 
  Sparkles, 
  Disc, 
  Image as ImageIcon, 
  Upload, 
  Save, 
  Tag, 
  DollarSign, 
  ShieldCheck, 
  Music, 
  Shirt, 
  Check, 
  Plus, 
  Trash2 
} from 'lucide-react';
import { EventItem } from '../types';
import { 
  formatEventDateRange, 
  calculateDurationDays, 
  formatIsoDate, 
  parseTextDateToIso 
} from '../utils/dateUtils';
import { uploadFileToServer } from '../services/submissionService';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: EventItem) => void;
  event: EventItem | null;
  festivalStartDate?: string;
  festivalEndDate?: string;
  primaryColor?: string;
  onOpenMediaLibrary?: (onSelect: (url: string) => void) => void;
}

const CATEGORY_PRESETS = [
  'Party',
  'Music',
  'Adventure',
  'Cultural',
  'Culture',
  'Meet and Greet',
  'Gala',
  'VIP Beach Fete',
  'Boat Cruise',
  'Street Carnival',
  'After Party'
];

export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
  festivalStartDate = '2027-05-22',
  festivalEndDate = '2027-05-31',
  primaryColor = '#F59E0B',
  onOpenMediaLibrary
}) => {
  const [formData, setFormData] = useState<Partial<EventItem>>({
    title: '',
    category: 'Party',
    startDate: festivalStartDate,
    endDate: festivalStartDate,
    isSingleDay: true,
    date: formatIsoDate(festivalStartDate),
    dayNumber: 1,
    time: '18:00 - 23:00',
    location: "St. George's, Grenada",
    description: '',
    highlightImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80',
    genres: ['Soca', 'Calypso'],
    djLineup: [],
    dressCode: '',
    wristbandRequired: true,
    ticketPrice: undefined,
    isFeatured: false
  });

  const [genresInput, setGenresInput] = useState('');
  const [djInput, setDjInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (event) {
        const isSingle = event.isSingleDay !== undefined 
          ? event.isSingleDay 
          : (!event.endDate || event.startDate === event.endDate);
        const start = event.startDate || parseTextDateToIso(event.date) || festivalStartDate;
        const end = isSingle ? start : (event.endDate || start);

        setFormData({
          ...event,
          startDate: start,
          endDate: end,
          isSingleDay: isSingle,
          category: event.category || 'Party',
          genres: event.genres || [],
          djLineup: event.djLineup || []
        });
        setGenresInput(event.genres ? event.genres.join(', ') : '');
        setDjInput(event.djLineup ? event.djLineup.join(', ') : '');
      } else {
        setFormData({
          title: '',
          category: 'Party',
          startDate: festivalStartDate,
          endDate: festivalStartDate,
          isSingleDay: true,
          date: formatIsoDate(festivalStartDate),
          dayNumber: 1,
          time: '18:00 - 23:00',
          location: "St. George's, Grenada",
          description: '',
          highlightImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80',
          genres: ['Soca', 'Calypso'],
          djLineup: [],
          dressCode: '',
          wristbandRequired: true,
          ticketPrice: undefined,
          isFeatured: false
        });
        setGenresInput('Soca, Calypso');
        setDjInput('');
      }
    }
  }, [isOpen, event, festivalStartDate]);

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

  const isSingle = formData.isSingleDay ?? true;
  const curStart = formData.startDate || festivalStartDate;
  const curEnd = isSingle ? curStart : (formData.endDate || curStart);
  const curDuration = isSingle ? 1 : calculateDurationDays(curStart, curEnd);
  const curFormattedRange = formatEventDateRange(curStart, isSingle ? curStart : curEnd);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedDate = formatEventDateRange(curStart, curEnd, formData.date);
    const parsedGenres = genresInput.split(',').map(s => s.trim()).filter(Boolean);
    const parsedDjs = djInput.split(',').map(s => s.trim()).filter(Boolean);

    const savedEvent: EventItem = {
      id: event?.id || `event-${Date.now()}`,
      title: (formData.title || '').trim(),
      category: (formData.category || 'Party').trim(),
      startDate: curStart,
      endDate: curEnd,
      isSingleDay: isSingle,
      date: formData.date?.trim() || formattedDate,
      dayNumber: Number(formData.dayNumber) || 1,
      time: (formData.time || '').trim(),
      location: (formData.location || '').trim(),
      description: (formData.description || '').trim(),
      highlightImage: formData.highlightImage || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80',
      genres: parsedGenres,
      djLineup: parsedDjs,
      dressCode: formData.dressCode?.trim() || undefined,
      wristbandRequired: formData.wristbandRequired ?? true,
      ticketPrice: formData.ticketPrice !== undefined && formData.ticketPrice !== null && !isNaN(Number(formData.ticketPrice))
        ? Number(formData.ticketPrice) 
        : undefined,
      isFeatured: Boolean(formData.isFeatured)
    };

    onSave(savedEvent);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadFileToServer(file);
      if (res && res.url) {
        setFormData(prev => ({ ...prev, highlightImage: res.url }));
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
        setFormData(prev => ({ ...prev, highlightImage: url }));
      });
    }
  };

  return createPortal(
    <AnimatePresence>
      <div 
        id="edit-event-modal-portal"
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
          className="relative w-full max-w-3xl max-h-[90vh] bg-[#0C0F1E] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-200 z-10"
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
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-serif flex items-center gap-2">
                  {event ? 'Edit Festival Event' : 'Add New Festival Event'}
                  {event && (
                    <span className="text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded-full font-mono font-normal">
                      ID: {event.id}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-400 font-light">
                  {event ? 'Update event schedule, pricing, artists, and media assets' : 'Configure details for the public festival calendar schedule'}
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
            {/* Title & Featured Placement */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase tracking-wider block">
                  Event Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. Soca Monarch Finals & Sunset Fete"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase tracking-wider block">
                  Spotlight Placement
                </label>
                <select
                  value={formData.isFeatured ? 'true' : 'false'}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.value === 'true' }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none text-xs"
                >
                  <option value="false">Standard Listing</option>
                  <option value="true">Featured (Hero Badge Spotlight)</option>
                </select>
              </div>
            </div>

            {/* Date Schedule & Duration Box */}
            <div className="bg-neutral-950/80 border border-neutral-800/80 p-4 sm:p-5 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-neutral-800/60 pb-3">
                <div>
                  <label className="text-amber-400 font-bold uppercase block text-xs flex items-center gap-1.5">
                    <CalendarRange className="w-4 h-4 text-amber-400" />
                    Event Schedule & Dates
                  </label>
                  <p className="text-[11px] text-neutral-400 font-light mt-0.5">
                    Choose between a single-day event or multi-day range.
                  </p>
                </div>

                {/* Duration mode pills */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        isSingleDay: true,
                        endDate: curStart,
                        date: formatEventDateRange(curStart, curStart)
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSingle
                        ? 'bg-amber-500 text-neutral-950 font-black shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    <span>⚡ Single-Day</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const end = formData.endDate && formData.endDate >= curStart ? formData.endDate : curStart;
                      setFormData(prev => ({
                        ...prev,
                        isSingleDay: false,
                        endDate: end,
                        date: formatEventDateRange(curStart, end)
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      !isSingle
                        ? 'bg-emerald-500 text-neutral-950 font-black shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    <span>🗓️ Multi-Day Span</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-bold uppercase text-[11px] block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={curStart}
                    onChange={(e) => {
                      const val = e.target.value;
                      const end = isSingle ? val : (formData.endDate && formData.endDate >= val ? formData.endDate : val);
                      setFormData(prev => ({
                        ...prev,
                        startDate: val,
                        endDate: end,
                        date: formatEventDateRange(val, end)
                      }));
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {!isSingle ? (
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-bold uppercase text-[11px] block">
                      End Date (Inclusive)
                    </label>
                    <input
                      type="date"
                      required
                      min={curStart}
                      value={curEnd}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          endDate: val,
                          date: formatEventDateRange(curStart, val)
                        }));
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-bold uppercase text-[11px] block">Schedule Type</label>
                    <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono text-amber-400 font-bold flex items-center gap-1.5 h-[38px]">
                      <span>⚡ 1-Day Showcase</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-bold uppercase text-[11px] block">Festival Day #</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.dayNumber || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, dayNumber: Number(e.target.value) }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Schedule Live Preview */}
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 font-mono uppercase font-bold">Display:</span>
                  <span className="text-amber-300 font-bold font-serif text-xs sm:text-sm">
                    📅 {curFormattedRange}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-neutral-950 text-neutral-300 border border-neutral-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                    Day {formData.dayNumber || 1}
                  </span>
                  <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black font-mono px-2 py-0.5 rounded uppercase">
                    {curDuration === 1 ? '1 Day Event' : `${curDuration}-Day Span`}
                  </span>
                </div>
              </div>
            </div>

            {/* Timing, Venue & Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Show Timing <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.time || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. 10:00 PM - 4:00 AM"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Location / Venue <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. Grand Anse Beach"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Ticket Price (£ GBP) <span className="text-neutral-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.ticketPrice ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      ticketPrice: val === '' ? undefined : Number(val)
                    }));
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs font-mono"
                  placeholder="e.g. 50 (or leave blank if free)"
                />
              </div>
            </div>

            {/* Category / Badge Tags */}
            <div className="bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-amber-400 font-bold uppercase block text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  Event Category Badge
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-neutral-500 font-mono">Live Preview:</span>
                  <span className="bg-amber-500 text-neutral-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wider">
                    {formData.category || 'Party'}
                  </span>
                </div>
              </div>

              <input
                type="text"
                required
                value={formData.category || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs font-semibold"
                placeholder="Type custom badge tag or pick below"
              />

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-neutral-500 font-mono uppercase mr-1">Presets:</span>
                {CATEGORY_PRESETS.map((preset) => {
                  const isSelected = (formData.category || '').toLowerCase() === preset.toLowerCase();
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: preset }))}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 font-black shadow-sm'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-bold uppercase block">
                Brief Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none text-xs leading-relaxed"
                placeholder="Describe the experience, schedule, or lineup highlights..."
              />
            </div>

            {/* Cover Image & Upload */}
            <div className="space-y-2 bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-neutral-400 font-bold uppercase text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  Cover Image URL <span className="text-rose-400">*</span>
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
                    className="text-[10px] font-bold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 rounded border border-neutral-800 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
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
                  value={formData.highlightImage || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, highlightImage: e.target.value }))}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="https://..."
                />
                {formData.highlightImage && (
                  <div className="w-12 h-10 rounded-lg overflow-hidden border border-neutral-800 shrink-0 bg-neutral-900">
                    <img 
                      src={formData.highlightImage} 
                      alt="Cover preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80'; }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Dress Code, Wristband Policy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Dress Code <span className="text-neutral-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.dressCode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dressCode: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. All White Luxury, Beach Chic, Tropical Glam"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">Access Policy</label>
                <select
                  value={formData.wristbandRequired !== false ? 'true' : 'false'}
                  onChange={(e) => setFormData(prev => ({ ...prev, wristbandRequired: e.target.value === 'true' }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                >
                  <option value="true">Wristband / Pass Required</option>
                  <option value="false">Open Entry / Free Admission</option>
                </select>
              </div>
            </div>

            {/* Music Genres & DJ Lineup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-amber-400" />
                  Music Genres <span className="text-neutral-500 font-normal">(Comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={genresInput}
                  onChange={(e) => setGenresInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. Soca, Reggae, Dancehall, Afrobeat"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1">
                  <Disc className="w-3.5 h-3.5 text-amber-400" />
                  DJs & Artists <span className="text-neutral-500 font-normal">(Comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={djInput}
                  onChange={(e) => setDjInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. DJ Slick, Selecta Quad, DJ Spice"
                />
              </div>
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
                {event ? 'Save Event Changes' : 'Create Festival Event'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
