import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Ticket, 
  Save, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  DollarSign, 
  Tag, 
  ShieldCheck, 
  Star 
} from 'lucide-react';
import { PassItem } from '../types';

interface EditPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pass: PassItem) => void;
  pass: PassItem | null;
  primaryColor?: string;
}

export const EditPassModal: React.FC<EditPassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  pass,
  primaryColor = '#F59E0B'
}) => {
  const [formData, setFormData] = useState<Partial<PassItem>>({
    title: '',
    subtitle: '',
    priceGBP: 350,
    priceUSD: 455,
    wristbandType: 'GOLD WRISTBAND',
    includedEvents: 'All events days 1 - 10',
    popular: false,
    features: [
      'VIP front-stage lounge fete access',
      'Complimentary organic garden buffet',
      'Official yacht shuttle pass included'
    ]
  });

  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (pass) {
        setFormData({
          ...pass,
          features: pass.features || []
        });
      } else {
        setFormData({
          title: '',
          subtitle: '',
          priceGBP: 350,
          priceUSD: 455,
          wristbandType: 'GOLD WRISTBAND',
          includedEvents: 'All events days 1 - 10',
          popular: false,
          features: [
            'VIP front-stage lounge fete access',
            'Complimentary organic garden buffet',
            'Official yacht shuttle pass included'
          ]
        });
      }
      setNewFeature('');
    }
  }, [isOpen, pass]);

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

  const handlePriceGBPChange = (val: number) => {
    setFormData(prev => ({
      ...prev,
      priceGBP: val,
      priceUSD: Math.round(val * 1.3)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const gbp = Number(formData.priceGBP) || 0;
    const usd = Number(formData.priceUSD) || Math.round(gbp * 1.3);

    const savedPass: PassItem = {
      id: pass?.id || `pass-${Date.now()}`,
      title: (formData.title || '').trim(),
      subtitle: (formData.subtitle || '').trim(),
      priceGBP: gbp,
      priceUSD: usd,
      wristbandType: (formData.wristbandType || 'STANDARD WRISTBAND').trim(),
      includedEvents: (formData.includedEvents || '').trim(),
      popular: Boolean(formData.popular),
      features: (formData.features || []).filter(f => f.trim().length > 0)
    };

    onSave(savedPass);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div 
        id="edit-pass-modal-portal"
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
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-serif flex items-center gap-2">
                  {pass ? 'Edit Festival Pass Tier' : 'Create New Pass Tier'}
                  {pass && (
                    <span className="text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded-full font-mono font-normal">
                      ID: {pass.id}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-400 font-light">
                  {pass ? 'Modify pricing, wristband badge, perks, and event access' : 'Configure a new wristband tier for the public pass shop'}
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
            {/* Title & Wristband Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Pass Title / Package Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. 10-Day Gold VIP All Access"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Wristband Designation <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.wristbandType || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, wristbandType: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs font-mono"
                  placeholder="e.g. GOLD WRISTBAND"
                />
              </div>
            </div>

            {/* Subtitle / Description */}
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-bold uppercase block">
                Subheading Description <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.subtitle || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                placeholder="e.g. Full premium experience for true revelers"
              />
            </div>

            {/* Pricing (GBP & USD) & Included Events */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Price in GBP (£) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.priceGBP ?? 0}
                  onChange={(e) => handlePriceGBPChange(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Price in USD ($) <span className="text-neutral-500 font-normal">(Auto-calc)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.priceUSD ?? 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceUSD: Number(e.target.value) }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-bold uppercase block">
                  Included Events Text <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.includedEvents || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, includedEvents: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  placeholder="e.g. All events days 1 - 10"
                />
              </div>
            </div>

            {/* Popular Highlight Badge */}
            <div className="bg-neutral-950/80 border border-neutral-800 p-3.5 rounded-xl flex items-center justify-between gap-3">
              <div>
                <label className="text-neutral-300 font-bold uppercase block text-xs flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Most Popular Spotlight Highlight
                </label>
                <p className="text-[11px] text-neutral-500 font-light">Enables visual scaling, glow accent, and "Most Popular" ribbon in the booking shop</p>
              </div>
              <select
                value={formData.popular ? 'true' : 'false'}
                onChange={(e) => setFormData(prev => ({ ...prev, popular: e.target.value === 'true' }))}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:border-amber-500 focus:outline-none text-xs font-semibold"
              >
                <option value="false">Standard Tier</option>
                <option value="true">⭐ Highlight as Popular</option>
              </select>
            </div>

            {/* Pass Perks & Features */}
            <div className="space-y-2 bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl">
              <label className="text-neutral-400 font-bold uppercase text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Pass Perks & Inclusions ({formData.features?.length || 0})
              </label>

              {/* Add Perk Input */}
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
                  placeholder="e.g. VIP front-stage lounge fete access"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3.5 bg-neutral-900 hover:bg-neutral-850 text-amber-400 border border-neutral-800 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Perk
                </button>
              </div>

              {/* Perks List */}
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
                      title="Remove perk"
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
                {pass ? 'Save Pass Changes' : 'Create Pass Tier'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
