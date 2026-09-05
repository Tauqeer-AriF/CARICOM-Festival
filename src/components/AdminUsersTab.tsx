import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Mail, 
  KeyRound, 
  Lock, 
  RotateCcw, 
  ShieldAlert,
  UserCheck,
  UserX,
  Sparkles,
  Info,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminUser, AdminRole } from '../types';
import { EditAdminUserModal } from './EditAdminUserModal';
import { 
  getAdminUsers, 
  createAdminUser, 
  updateAdminUser, 
  deleteAdminUser, 
  getCurrentAdminUser, 
  resetAdminUsersToDefault,
  ROLE_PERMISSIONS,
  AdminTabId
} from '../services/adminUserService';

interface AdminUsersTabProps {
  primaryColor: string;
  triggerConfirm: (title: string, message: string, action: () => void) => void;
  onToast: (msg: string) => void;
}

const ROLE_BADGES: Record<Exclude<AdminRole, 'Owner'>, { bg: string; text: string; border: string }> = {
  'Admin': { bg: 'bg-yellow-500/10', text: 'text-yellow-300', border: 'border-yellow-500/30' },
  'Executive Lead': { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  'Event Coordinator': { bg: 'bg-sky-500/10', text: 'text-sky-300', border: 'border-sky-500/30' },
  'Ticketing & Passes': { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/30' },
  'Concierge Lead': { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500/30' },
  'Curator': { bg: 'bg-indigo-500/10', text: 'text-indigo-300', border: 'border-indigo-500/30' },
  'Logistics Lead': { bg: 'bg-teal-500/10', text: 'text-teal-300', border: 'border-teal-500/30' },
};

const TAB_LABELS: Record<AdminTabId, string> = {
  'owner': 'Owner Control',
  'analytics': 'Analytics',
  'submissions': 'Received Forms',
  'orders': 'Pass Orders',
  'payments': 'Payment Gateway',
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

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  primaryColor,
  triggerConfirm,
  onToast
}) => {
  const [users, setUsers] = useState<AdminUser[]>(() => getAdminUsers().filter(u => u.role !== 'Owner' && u.username.toLowerCase() !== 'owner'));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showMatrix, setShowMatrix] = useState<boolean>(false);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const currentUser = getCurrentAdminUser();

  const refreshUsers = () => {
    setUsers(getAdminUsers().filter(u => u.role !== 'Owner' && u.username.toLowerCase() !== 'owner'));
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleSaveUser = (userData: {
    username: string;
    password?: string;
    name: string;
    role: AdminRole;
    email?: string;
    status: 'active' | 'suspended';
    notes?: string;
  }) => {
    if (editingUser) {
      // Update existing
      const res = updateAdminUser(editingUser.id, userData);
      if (!res.success) {
        onToast(res.error || 'Failed to update user.');
        return;
      }
      onToast(`Successfully updated user @${userData.username}`);
    } else {
      // Create new
      if (!userData.password) {
        onToast('Password is required for new users.');
        return;
      }
      const res = createAdminUser({
        username: userData.username,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        email: userData.email,
        status: userData.status,
        notes: userData.notes
      });
      if (!res.success) {
        onToast(res.error || 'Failed to create user.');
        return;
      }
      onToast(`Successfully created new console user @${userData.username}`);
    }

    setModalOpen(false);
    refreshUsers();
  };

  const handleDeleteUser = (user: AdminUser) => {
    triggerConfirm(
      `Delete User @${user.username}`,
      `Are you sure you want to permanently remove administrator account "${user.name}" (@${user.username})? They will no longer be able to access the Secure Console.`,
      () => {
        const res = deleteAdminUser(user.id);
        if (!res.success) {
          onToast(res.error || 'Failed to delete user.');
          return;
        }
        onToast(`User @${user.username} has been removed.`);
        refreshUsers();
      }
    );
  };

  const handleToggleStatus = (user: AdminUser) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const actionLabel = nextStatus === 'active' ? 'Reactivate' : 'Suspend';

    triggerConfirm(
      `${actionLabel} Account @${user.username}`,
      `Are you sure you want to ${actionLabel.toLowerCase()} user "${user.name}"? ${nextStatus === 'suspended' ? 'They will be locked out of the Secure Console immediately.' : 'Their access will be restored.'}`,
      () => {
        updateAdminUser(user.id, { status: nextStatus });
        onToast(`User @${user.username} is now ${nextStatus}.`);
        refreshUsers();
      }
    );
  };

  const handleResetDefaults = () => {
    triggerConfirm(
      'Reset Console Users to Defaults',
      'Reset all console users back to standard festival demo administrators (admin, coordinator, concierge)? Any newly created users will be erased.',
      () => {
        resetAdminUsersToDefault();
        onToast('Console users restored to initial demo configurations.');
        refreshUsers();
      }
    );
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.notes && user.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = users.filter(u => u.status === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Sub-navigation bar matching Email Suite */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-neutral-800 pb-1.5 overflow-x-auto scrollbar-none w-full">
        {[
          { id: 'all', label: 'All Accounts', icon: Users, count: users.length },
          { id: 'active', label: 'Active Operators', icon: UserCheck, count: activeCount },
          { id: 'suspended', label: 'Suspended', icon: UserX, count: suspendedCount },
          { id: 'matrix', label: 'Role Matrix', icon: ShieldCheck, count: (Object.keys(ROLE_PERMISSIONS) as AdminRole[]).length }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = tab.id === 'matrix' ? showMatrix : (statusFilter === tab.id && !showMatrix);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'matrix') {
                  setShowMatrix(!showMatrix);
                } else {
                  setShowMatrix(false);
                  setStatusFilter(tab.id);
                }
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                isActive
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
              style={isActive ? { borderBottom: `2px solid ${primaryColor}` } : undefined}
            >
              <IconComp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-neutral-900 text-neutral-300 border border-neutral-750">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* HEADER HERO BAR */}
      <div className="bg-[#0C0F1E] border border-neutral-800/70 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> Role-Based Access Control (RBAC)
              </span>
              {currentUser && (
                <span className="text-[10px] text-neutral-400 font-mono">
                  Signed in as <strong className="text-white">@{currentUser.username}</strong> ({currentUser.role})
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white font-serif tracking-tight">
              Console Users & Role-Based Clearance
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Create and manage administrative accounts. Console navigation and permissions are conditionally enforced based on each user's assigned role clearance.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setShowMatrix(!showMatrix)}
              className="px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              Role Matrix {showMatrix ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <UserPlus className="w-4 h-4" /> Add New User
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Reset accounts to factory demo defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Defaults
            </button>
          </div>
        </div>

        {/* ROLE CLEARANCES MATRIX COLLAPSIBLE */}
        <AnimatePresence>
          {showMatrix && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 pt-5 border-t border-neutral-800/70 overflow-hidden"
            >
              <div className="bg-neutral-950/80 border border-neutral-800/70 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                    Conditional Access & Role Permission Matrix
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Tabs automatically adapt in the sidebar based on login
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {((Object.keys(ROLE_PERMISSIONS) as AdminRole[]).filter(r => r !== 'Owner') as Exclude<AdminRole, 'Owner'>[]).map((roleKey) => {
                    const tabs = ROLE_PERMISSIONS[roleKey];
                    const badge = ROLE_BADGES[roleKey];
                    return (
                      <div key={roleKey} className="p-3 bg-[#0C0F1E] border border-neutral-800/70 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {roleKey}
                          </span>
                          <span className="text-[9px] text-neutral-500 font-mono font-bold">
                            {tabs.length} Tabs Allowed
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tabs.map((t) => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono">
                              {TAB_LABELS[t] || t}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* METRIC BADGES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-neutral-800/70">
          <div className="p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/70">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Total Accounts</span>
            <span className="text-xl font-black text-white font-mono mt-0.5 block">{users.length}</span>
          </div>

          <div className="p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/70">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Operators
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">{activeCount}</span>
          </div>

          <div className="p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/70">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Suspended</span>
            <span className="text-xl font-black text-rose-400 font-mono mt-0.5 block">{suspendedCount}</span>
          </div>

          <div className="p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/70">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Access Engine</span>
            <span className="text-xs font-bold text-neutral-200 mt-1 block truncate">Conditional RBAC Active</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-[#0C0F1E] border border-neutral-800/70 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3.5 shadow-lg">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by username, name, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800/70 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/80"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800/70 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-500/80 cursor-pointer font-semibold"
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Executive Lead">Executive Lead</option>
              <option value="Event Coordinator">Event Coordinator</option>
              <option value="Ticketing & Passes">Ticketing & Passes</option>
              <option value="Concierge Lead">Concierge Lead</option>
              <option value="Curator">Curator</option>
              <option value="Logistics Lead">Logistics Lead</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800/70 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-500/80 cursor-pointer font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* USERS LIST TABLE (Desktop) */}
      <div className="hidden md:block bg-[#0C0F1E] border border-neutral-800/70 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-neutral-800/70 bg-neutral-950/60 text-neutral-400 font-extrabold uppercase tracking-widest text-[9px]">
                <th className="py-3.5 px-5">Console Operator</th>
                <th className="py-3.5 px-4">Role & Clearance</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Activity</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                    <p className="font-bold text-neutral-400">No console users match your filters.</p>
                    <p className="text-xs text-neutral-600 mt-1">Try clearing search keywords or create a new user profile.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initials = u.name 
                    ? u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
                    : u.username.substring(0, 2).toUpperCase();
                  
                  const roleStyle = ROLE_BADGES[u.role] || { bg: 'bg-neutral-800', text: 'text-neutral-300', border: 'border-neutral-700' };
                  const isCurrent = currentUser?.id === u.id;
                  const allowedTabsCount = (ROLE_PERMISSIONS[u.role] || []).length;

                  return (
                    <tr key={u.id} className="hover:bg-neutral-900/40 transition-colors group">
                      {/* Operator Details */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-sm"
                            style={{ 
                              borderColor: `${primaryColor}40`, 
                              backgroundColor: `${primaryColor}10`,
                              color: primaryColor 
                            }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white group-hover:text-neutral-100 transition-colors truncate">
                                {u.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-amber-400/90 font-mono">
                              @{u.username}
                            </div>
                            {u.email && (
                              <div className="text-[10px] text-neutral-500 font-mono truncate">
                                {u.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                            <ShieldCheck className="w-3 h-3" />
                            {u.role}
                          </span>
                          <span className="text-[9px] text-neutral-500 block font-mono">
                            {allowedTabsCount} console tabs accessible
                          </span>
                          {u.notes && (
                            <span className="text-[10px] text-neutral-500 block truncate max-w-[200px] italic">
                              {u.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Suspended
                          </span>
                        )}
                      </td>

                      {/* Activity */}
                      <td className="py-3.5 px-4">
                        <div className="text-[10px] text-neutral-400 space-y-0.5 font-mono">
                          <div>
                            <span className="text-neutral-500">Created:</span> {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div>
                            <span className="text-neutral-500">Last login:</span> {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-sky-400 hover:text-sky-300 border border-neutral-800 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Edit user profile & password"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                              u.status === 'active'
                                ? 'bg-neutral-900 hover:bg-amber-950/20 text-neutral-400 hover:text-amber-400 border-neutral-800 hover:border-amber-500/30'
                                : 'bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 border-emerald-500/30'
                            }`}
                            title={u.status === 'active' ? 'Suspend user account' : 'Reactivate user account'}
                          >
                            {u.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            disabled={users.length <= 1}
                            className="p-1.5 bg-neutral-900 hover:bg-rose-950/20 text-neutral-500 hover:text-rose-400 border border-neutral-800 hover:border-rose-500/30 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete administrator account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USERS LIST CARDS (Mobile) */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="bg-[#0C0F1E] border border-neutral-800/70 rounded-2xl p-8 text-center text-neutral-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
            <p className="font-bold text-neutral-400">No console users found.</p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const roleStyle = ROLE_BADGES[u.role] || { bg: 'bg-neutral-800', text: 'text-neutral-300', border: 'border-neutral-700' };
            const isCurrent = currentUser?.id === u.id;

            return (
              <div key={u.id} className="bg-[#0C0F1E] border border-neutral-800/70 rounded-xl p-4 space-y-3 shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-white text-sm">{u.name}</h4>
                      {isCurrent && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-amber-400 font-mono block">@{u.username}</span>
                    {u.email && <span className="text-[10px] text-neutral-500 font-mono block">{u.email}</span>}
                  </div>

                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                    {u.role}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-2 border-t border-neutral-800/70">
                  <span>Status: {u.status === 'active' ? '🟢 Active' : '🔴 Suspended'}</span>
                  <span>Joined: {new Date(u.createdAt).toLocaleDateString('en-GB')}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(u)}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-sky-400 border border-neutral-800 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(u)}
                    className="p-1.5 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded-lg text-xs cursor-pointer"
                  >
                    {u.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(u)}
                    disabled={users.length <= 1}
                    className="p-1.5 bg-neutral-900 text-rose-400 border border-neutral-800 rounded-lg text-xs cursor-pointer disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL */}
      <EditAdminUserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveUser}
        user={editingUser}
        primaryColor={primaryColor}
      />
    </div>
  );
};

