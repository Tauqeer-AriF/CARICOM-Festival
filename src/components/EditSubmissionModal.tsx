import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Ticket, 
  Plane, 
  MessageSquare, 
  Truck, 
  DollarSign, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Layers
} from 'lucide-react';
import { FormSubmissionItem } from '../types';
import { ALL_SUBMISSION_TYPE_TAGS, ALL_SUBMISSION_STATUS_TAGS } from '../utils/submissionTags';

interface EditSubmissionModalProps {
  submission: FormSubmissionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: FormSubmissionItem) => void;
  primaryColor?: string;
}

export const EditSubmissionModal: React.FC<EditSubmissionModalProps> = ({
  submission,
  isOpen,
  onClose,
  onSave,
  primaryColor = '#E6CA65'
}) => {
  if (!isOpen || !submission) return null;

  const isPassOrder = submission.type === 'pass-order';

  const [formData, setFormData] = useState<{
    type: FormSubmissionItem['type'];
    name: string;
    email: string;
    phone: string;
    topicOrPass: string;
    messageOrDetails: string;
    status: FormSubmissionItem['status'];
    amountGBP: number | string;
    extraDetails: Array<{ key: string; value: string }>;
  }>({
    type: submission.type,
    name: submission.name || '',
    email: submission.email || '',
    phone: submission.phone || '',
    topicOrPass: submission.topicOrPass || '',
    messageOrDetails: submission.messageOrDetails || '',
    status: submission.status,
    amountGBP: submission.amountGBP !== undefined ? submission.amountGBP : '',
    extraDetails: Object.entries(submission.extraDetails || {}).map(([key, value]) => ({ key, value }))
  });

  const [newMetaKey, setNewMetaKey] = useState('');
  const [newMetaValue, setNewMetaValue] = useState('');
  const [showAddMeta, setShowAddMeta] = useState(false);

  // Sync state if submission changes
  useEffect(() => {
    if (submission) {
      setFormData({
        type: submission.type,
        name: submission.name || '',
        email: submission.email || '',
        phone: submission.phone || '',
        topicOrPass: submission.topicOrPass || '',
        messageOrDetails: submission.messageOrDetails || '',
        status: submission.status,
        amountGBP: submission.amountGBP !== undefined ? submission.amountGBP : '',
        extraDetails: Object.entries(submission.extraDetails || {}).map(([key, value]) => ({ key, value }))
      });
    }
  }, [submission]);

  const handleExtraDetailChange = (index: number, field: 'key' | 'value', val: string) => {
    setFormData(prev => {
      const updated = [...prev.extraDetails];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, extraDetails: updated };
    });
  };

  const handleRemoveExtraDetail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      extraDetails: prev.extraDetails.filter((_, i) => i !== index)
    }));
  };

  const handleAddExtraDetail = () => {
    if (!newMetaKey.trim()) return;
    setFormData(prev => ({
      ...prev,
      extraDetails: [...prev.extraDetails, { key: newMetaKey.trim(), value: newMetaValue.trim() }]
    }));
    setNewMetaKey('');
    setNewMetaValue('');
    setShowAddMeta(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Reconstruct extraDetails record
    const metaRecord: Record<string, string> = {};
    formData.extraDetails.forEach(({ key, value }) => {
      if (key.trim()) {
        metaRecord[key.trim()] = value;
      }
    });

    const parsedAmount = formData.amountGBP !== '' ? Number(formData.amountGBP) : undefined;

    // If it's a pass order and TotalPaid isn't explicitly set in extraDetails, format it
    if (formData.type === 'pass-order' && parsedAmount !== undefined && !metaRecord['TotalPaid']) {
      metaRecord['TotalPaid'] = `£${parsedAmount}`;
    }

    const updatedItem: FormSubmissionItem = {
      ...submission,
      type: formData.type,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      topicOrPass: formData.topicOrPass.trim(),
      messageOrDetails: formData.messageOrDetails.trim(),
      status: formData.status,
      ...(parsedAmount !== undefined && !isNaN(parsedAmount) ? { amountGBP: parsedAmount } : { amountGBP: undefined }),
      extraDetails: Object.keys(metaRecord).length > 0 ? metaRecord : undefined
    };

    onSave(updatedItem);
  };

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden relative my-6 text-white font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent top gradient bar */}
        <div 
          className="h-1.5 w-full bg-gradient-to-r"
          style={{
            backgroundImage: isPassOrder 
              ? 'linear-gradient(to right, #F59E0B, #FBBF24, #D97706)' 
              : 'linear-gradient(to right, #3B82F6, #60A5FA, #2563EB)'
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-neutral-800/80 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
              style={{
                backgroundColor: isPassOrder ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                borderColor: isPassOrder ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                color: isPassOrder ? '#FBBF24' : '#60A5FA'
              }}
            >
              {isPassOrder ? <Ticket className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block font-mono">
                {isPassOrder ? 'Pass Order Editor' : 'Received Form Editor'}
              </span>
              <h3 className="text-base md:text-lg font-bold text-white font-serif">
                Edit Record: <span className="text-neutral-300 font-mono text-xs">{submission.id}</span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-7 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Form Type & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" /> Category / Record Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-neutral-950 border border-neutral-800/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
              >
                <option value="contact">Contact Inquiry</option>
                <option value="pass-order">Pass Order</option>
                <option value="flight-registration">Flight Registration Log</option>
                <option value="transport-request">Shuttle & Transport Request</option>
                <option value="newsletter">VIP Newsletter Signup</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Workflow Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-neutral-950 border border-neutral-800/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
              >
                <option value="new">🔴 New (Unreviewed)</option>
                <option value="in-review">🟡 In Review</option>
                <option value="resolved">🟢 Resolved / Confirmed</option>
              </select>
            </div>
          </div>

          {/* Guest Identity Information */}
          <div className="bg-neutral-950/60 border border-neutral-800/70 rounded-xl p-4 space-y-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 border-b border-neutral-900 pb-2">
              <User className="w-3.5 h-3.5 text-amber-400" /> Guest Contact Profile
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-neutral-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0C0F1E] border border-neutral-800/70 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="guest@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#0C0F1E] border border-neutral-800/70 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+44 7700 900123"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#0C0F1E] border border-neutral-800/70 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Package / Topic / Financial Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-amber-400" />
                {formData.type === 'pass-order' ? 'Pass / Package Name' : 'Subject / Topic / Flight'}
              </label>
              <input
                type="text"
                placeholder={formData.type === 'pass-order' ? '2x 10-Day VIP Gold Pass' : 'VIP Cabana Inquiry'}
                value={formData.topicOrPass}
                onChange={(e) => setFormData({ ...formData, topicOrPass: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800/70 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Amount in GBP (£)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 450"
                value={formData.amountGBP}
                onChange={(e) => setFormData({ ...formData, amountGBP: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800/70 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Inquiry Details / Message Notes */}
          <div>
            <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              {formData.type === 'pass-order' ? 'Order Notes & Booking Breakdown' : 'Inquiry Message / Notes'}
            </label>
            <textarea
              rows={3}
              placeholder="Enter message text, breakdown, or administrative notes..."
              value={formData.messageOrDetails}
              onChange={(e) => setFormData({ ...formData, messageOrDetails: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800/70 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Structured Parameters / Extra Metadata Key-Value Editor */}
          <div className="bg-neutral-950/60 border border-neutral-800/70 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" /> Structured Parameters & Metadata ({formData.extraDetails.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAddMeta(!showAddMeta)}
                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-amber-400 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-neutral-800/70"
              >
                <Plus className="w-3 h-3" /> Add Custom Field
              </button>
            </div>

            {/* Quick add custom field form */}
            {showAddMeta && (
              <div className="p-3 bg-[#0C0F1E] border border-neutral-800/70 rounded-xl space-y-2 animate-in fade-in">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Add Structured Parameter:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Field name (e.g. OrderRef, Hotel, Airline)"
                    value={newMetaKey}
                    onChange={(e) => setNewMetaKey(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800/70 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Field value (e.g. GCF-2027-1002, Royalton Resort)"
                    value={newMetaValue}
                    onChange={(e) => setNewMetaValue(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800/70 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddMeta(false)}
                    className="px-2.5 py-1 bg-neutral-900 text-neutral-400 text-[10px] font-bold rounded hover:text-white cursor-pointer border border-neutral-800/70"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddExtraDetail}
                    disabled={!newMetaKey.trim()}
                    className="px-3 py-1 bg-amber-500 text-neutral-950 text-[10px] font-black rounded hover:bg-amber-400 disabled:opacity-40 cursor-pointer border border-neutral-800/70"
                  >
                    Add Parameter
                  </button>
                </div>
              </div>
            )}

            {/* Existing Metadata List */}
            {formData.extraDetails.length > 0 ? (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {formData.extraDetails.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#0C0F1E] border border-neutral-800/70 p-2 rounded-lg">
                    <input
                      type="text"
                      placeholder="Field Name"
                      value={item.key}
                      onChange={(e) => handleExtraDetailChange(idx, 'key', e.target.value)}
                      className="w-1/3 bg-neutral-950 border border-neutral-800/70 rounded px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-neutral-600 text-xs font-bold">:</span>
                    <input
                      type="text"
                      placeholder="Value"
                      value={item.value}
                      onChange={(e) => handleExtraDetailChange(idx, 'value', e.target.value)}
                      className="flex-1 bg-neutral-950 border border-neutral-800/70 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraDetail(idx)}
                      className="p-1 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer rounded hover:bg-rose-500/10 border-0"
                      title="Remove field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-neutral-500 italic text-center py-2">
                No custom parameters attached. Click "Add Custom Field" to attach OrderRef, hotel, flights, etc.
              </p>
            )}
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold rounded-xl border border-neutral-800 cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
