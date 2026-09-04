import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Save, 
  User, 
  Lock, 
  ShieldCheck, 
  Mail, 
  FileText, 
  Sparkles, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  RefreshCw,
  Check
} from 'lucide-react';
import { AdminUser, AdminRole } from '../types';
import { ROLE_PERMISSIONS, AdminTabId } from '../services/adminUserService';

interface EditAdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: {
    username: string;
    password?: string;
    name: string;
    role: AdminRole;
    email?: string;
    status: 'active' | 'suspended';
    notes?: string;
  }) => void;
  user: AdminUser | null; // null for "Add User", object for "Edit User"
  primaryColor?: string;
}

const AVAILABLE_ROLES: { role: AdminRole; description: string; badgeColor: string }[] = [
  { role: 'Admin', description: 'Full administrative clearance to all standard console features & security operations', badgeColor: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' },
  { role: 'Executive Lead', description: 'Strategic analytics, executive exports, forms, orders and high-level festival oversight', badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  { role: 'Event Coordinator', description: 'Manages festival itinerary, DJ lineups, locations, timings and schedule', badgeColor: 'border-sky-500/30 bg-sky-500/10 text-sky-300' },
  { role: 'Ticketing & Passes', description: 'Oversees pass tiers, pricing configurations, orders, and inquiries', badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
  { role: 'Concierge Lead', description: 'Handles guest inquiries, flight registration dossiers and VIP hotels', badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-300' },
  { role: 'Curator', description: 'Curates gallery imagery, promotional media, artwork and video teasers', badgeColor: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' },
  { role: 'Logistics Lead', description: 'Coordinates hotel accommodations, airport transfers, events and logistics', badgeColor: 'border-teal-500/30 bg-teal-500/10 text-teal-300' },
];

const TAB_LABELS: Record<AdminTabId, string> = {
  'owner': 'Owner Control',
  'analytics': 'Analytics',
  'submissions': 'Received Forms',
  'orders': 'Pass Orders',
  'emails': 'Email Suite',
  'branding': 'Customiser Studio',
  'page-images': 'Page Images',
  'events': 'Event Manager',
  'gallery': 'Gallery Media',
  'passes': 'Pass Manager',
  'hotels': 'Hotels',
  'testimonials': 'Testimonials',
  'media': 'Media Library',
  'users': 'Console Users',
  'system': 'Operations',
  'backup': 'Backup & Restore'
};

export const EditAdminUserModal: React.FC<EditAdminUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  primaryColor = '#E6CA65'
}) => {
  const isEditing = !!user;

  const [username, setUsername] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<AdminRole>('Executive Lead');
  const [email, setEmail] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [notes, setNotes] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state when opening or switching target user
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setName(user.name);
      setPassword(''); // Keep blank unless user wants to change it
      setRole(user.role);
      setEmail(user.email || '');
      setStatus(user.status);
      setNotes(user.notes || '');
    } else {
      setUsername('');
      setName('');
      setPassword('');
      setRole('Executive Lead');
      setEmail('');
      setStatus('active');
      setNotes('');
    }
    setShowPassword(false);
    setValidationError(null);
  }, [user, isOpen]);

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setValidationError('Username is required.');
      return;
    }

    if (!name.trim()) {
      setValidationError('Full Name / Display Name is required.');
      return;
    }

    if (!isEditing && (!password || password.length < 3)) {
      setValidationError('Password must be at least 3 characters for new user accounts.');
      return;
    }

    if (isEditing && password && password.length < 3) {
      setValidationError('New password must be at least 3 characters long.');
      return;
    }

    onSave({
      username: cleanUsername,
      password: password || undefined,
      name: name.trim(),
      role,
      email: email.trim() || undefined,
      status,
      notes: notes.trim() || undefined
    });
  };

  if (!isOpen) return null;

  const allowedTabs = ROLE_PERMISSIONS[role] || [];

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-[#0C0F1E] border border-neutral-800/70 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden relative my-6 text-white font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top accent bar */}
          <div 
            className="h-1.5 w-full bg-gradient-to-r"
            style={{
              backgroundImage: `linear-gradient(to right, ${primaryColor}, #F59E0B, #D97706)`
            }}
          />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/70 bg-neutral-950/60">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                style={{ 
                  backgroundColor: `${primaryColor}15`, 
                  borderColor: `${primaryColor}35`, 
                  color: primaryColor 
                }}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block font-mono">
                  {isEditing ? 'Console Access Control' : 'New Administrator Profile'}
                </span>
                <h3 className="text-base md:text-lg font-bold text-white font-serif">
                  {isEditing ? `Edit User: @${user?.username}` : 'Add Console User'}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-7 space-y-4 max-h-[75vh] overflow-y-auto">
            {validationError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Row 1: Username and Full Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" /> Username *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-neutral-500 text-xs font-mono select-none">@</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jsmith"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    className="w-full bg-neutral-950 border border-neutral-800/70 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/80 font-mono font-bold"
                  />
                </div>
                <span className="text-[9px] text-neutral-500 mt-1 block">Used to sign in to the Secure Console</span>
              </div>

              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" /> Full Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800/70 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/80 font-semibold"
                />
                <span className="text-[9px] text-neutral-500 mt-1 block">Displayed on executive signatures & audits</span>
              </div>
            </div>

            {/* Row 2: Role Selection & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Role & Clearance Level *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="w-full bg-neutral-950 border border-neutral-800/70 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/80 font-semibold cursor-pointer"
                >
                  {AVAILABLE_ROLES.map(r => (
                    <option key={r.role} value={r.role}>
                      {r.role}
                    </option>
                  ))}
                </select>
                <span className="text-[9px] text-neutral-400 mt-1 block leading-tight">
                  {AVAILABLE_ROLES.find(r => r.role === role)?.description}
                </span>
              </div>

              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Account Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')}
                  className="w-full bg-neutral-950 border border-neutral-800/70 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/80 font-semibold cursor-pointer"
                >
                  <option value="active">🟢 Active (Access Granted)</option>
                  <option value="suspended">🔴 Suspended (Access Locked)</option>
                </select>
                <span className="text-[9px] text-neutral-500 mt-1 block">
                  Suspended accounts cannot log in to the console
                </span>
              </div>
            </div>

            {/* Role Permissions Box */}
            <div className="p-3 bg-neutral-950/60 border border-neutral-800/70 rounded-xl">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Authorized Features for {role}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {allowedTabs.map(tab => (
                  <span 
                    key={tab} 
                    className="text-[9px] px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono"
                  >
                    {TAB_LABELS[tab] || tab}
                  </span>
                ))}
              </div>
            </div>

            {/* Row 3: Password Configuration */}
            <div className="bg-neutral-950/80 border border-neutral-800/70 p-3.5 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  {isEditing ? 'Update User Password' : 'Account Password *'}
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3 h-3" /> Generate Strong Pass
                </button>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isEditing ? 'Leave blank to keep existing password...' : 'Enter password (min 3 chars)...'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0C0F1E] border border-neutral-800/70 rounded-lg pl-3.5 pr-11 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/80 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[9px] text-neutral-500 block">
                {isEditing 
                  ? 'Only fill this field if you wish to reset or change this user\'s password.' 
                  : 'Required for this administrator to log into the Secure Console.'}
              </span>
            </div>

            {/* Row 4: Email (Optional) */}
            <div>
              <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" /> Executive Email (Optional)
              </label>
              <input
                type="email"
                placeholder="e.g. officer@grenadacaricom2027.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800/70 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/80 font-mono"
              />
            </div>

            {/* Row 5: Notes & Responsibility */}
            <div>
              <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" /> Administrative Notes & Responsibilities
              </label>
              <textarea
                rows={2}
                placeholder="Describe assigned festival tasks, coverage dates, or administrative permissions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800/70 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/80 leading-relaxed"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-neutral-800/70 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold rounded-xl border border-neutral-800/70 cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                style={{ backgroundColor: primaryColor }}
              >
                <Save className="w-4 h-4" /> {isEditing ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
