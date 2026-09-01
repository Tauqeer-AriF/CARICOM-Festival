import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  KeyRound, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Sparkles, 
  Layers, 
  Check, 
  RefreshCw,
  Fingerprint,
  FileKey,
  ShieldAlert,
  Power,
  AlertTriangle,
  RotateCcw,
  ShieldOff,
  Link
} from 'lucide-react';
import { AdminUser } from '../types';
import { 
  getAdminUsers, 
  getCurrentAdminUser, 
  updateAdminUser, 
  setCurrentAdminUser,
  ROLE_PERMISSIONS 
} from '../services/adminUserService';
import { getSiteConfig, saveSiteConfig } from '../services/submissionService';

interface OwnerControlTabProps {
  primaryColor: string;
  onToast: (msg: string) => void;
  triggerConfirm: (title: string, message: string, action: () => void) => void;
  onUserUpdated?: () => void;
}

export const OwnerControlTab: React.FC<OwnerControlTabProps> = ({
  primaryColor,
  onToast,
  triggerConfirm,
  onUserUpdated
}) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => getCurrentAdminUser());
  const [ownerUser, setOwnerUser] = useState<AdminUser | null>(null);

  // Form fields for credential change
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [ownerAdminPath, setOwnerAdminPath] = useState<string>('owner-console');
  const [passcode, setPasscode] = useState<string>('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Kill Switch states
  const [isKilled, setIsKilled] = useState<boolean>(() => !!getSiteConfig().isKilled);
  const [showKillModal, setShowKillModal] = useState<boolean>(false);
  const [killReasonInput, setKillReasonInput] = useState<string>('');
  const [killConfirmPassword, setKillConfirmPassword] = useState<string>('');
  const [killErrorMsg, setKillErrorMsg] = useState<string | null>(null);

  const handleExecuteKill = (e: React.FormEvent) => {
    e.preventDefault();
    setKillErrorMsg(null);
    if (!ownerUser) {
      setKillErrorMsg('Owner profile not found.');
      return;
    }
    if (!killConfirmPassword) {
      setKillErrorMsg('Please enter your Owner password to confirm emergency system shutdown.');
      return;
    }
    if (killConfirmPassword !== ownerUser.password) {
      setKillErrorMsg('Incorrect owner password. Termination rejected.');
      return;
    }

    const currentConfig = getSiteConfig();
    const updated = {
      ...currentConfig,
      isKilled: true,
      killedReason: killReasonInput.trim() || 'System shutdown initiated by emergency override.',
      killedAt: new Date().toISOString()
    };
    saveSiteConfig(updated);
    setIsKilled(true);
    setShowKillModal(false);
    setKillConfirmPassword('');
    setKillReasonInput('');
    onToast('APPLICATION TERMINATED — Whole system is now offline');
    window.dispatchEvent(new CustomEvent('site_config_updated', { detail: updated }));
  };

  const handleRestoreApp = () => {
    triggerConfirm(
      'Reactivate Application Infrastructure?',
      'Are you sure you want to restore public access to the application? All pages, pass bookings, and forms will become active immediately.',
      () => {
        const currentConfig = getSiteConfig();
        const updated = {
          ...currentConfig,
          isKilled: false,
          killedReason: undefined,
          killedAt: undefined
        };
        saveSiteConfig(updated);
        setIsKilled(false);
        onToast('APPLICATION REACTIVATED — System restored successfully');
        window.dispatchEvent(new CustomEvent('site_config_updated', { detail: updated }));
      }
    );
  };

  // Load Owner account
  const refreshOwnerData = () => {
    const allUsers = getAdminUsers();
    // Look for user with role === 'Owner' or fallback to currently logged in if Owner, or username === 'owner'
    const foundOwner = allUsers.find(u => u.role === 'Owner') || 
      allUsers.find(u => u.username.toLowerCase() === 'owner') ||
      (currentUser?.role === 'Owner' ? currentUser : null);

    const siteConfig = getSiteConfig();
    const currentPasscode = foundOwner?.passcode || siteConfig.ownerAdminPassword || siteConfig.adminPassword || '9999';
    const currentOwnerPath = siteConfig.ownerAdminPath || 'owner-console';

    setOwnerAdminPath(currentOwnerPath);
    if (foundOwner) {
      setOwnerUser(foundOwner);
      setUsername(foundOwner.username);
      setDisplayName(foundOwner.name);
      setEmail(foundOwner.email || '');
      setPasscode(currentPasscode);
    } else {
      setPasscode(currentPasscode);
    }
  };

  useEffect(() => {
    refreshOwnerData();
  }, [currentUser]);

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!ownerUser) {
      setErrorMsg('Owner profile not found in system database.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMsg('Owner username is required.');
      return;
    }

    if (!displayName.trim()) {
      setErrorMsg('Owner display name is required.');
      return;
    }

    const cleanOwnerPath = ownerAdminPath.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '') || 'owner-console';
    const cleanPasscode = passcode.trim();
    if (!cleanPasscode) {
      setErrorMsg('Access passcode / PIN cannot be blank.');
      return;
    }

    // Verify current password if user is currently logged in as Owner or wants to change password/passcode/path
    const siteConfig = getSiteConfig();
    const isPasscodeChanged = cleanPasscode !== (ownerUser.passcode || siteConfig.ownerAdminPassword || siteConfig.adminPassword || '9999');
    const isPathChanged = cleanOwnerPath !== (siteConfig.ownerAdminPath || 'owner-console');

    if (newPassword || cleanUsername !== ownerUser.username.toLowerCase() || isPasscodeChanged || isPathChanged) {
      if (!currentPasswordInput) {
        setErrorMsg('Please enter the current Owner password to confirm this security credential update.');
        return;
      }
      if (currentPasswordInput !== ownerUser.password) {
        setErrorMsg('Current password verification failed. Please check and re-enter.');
        return;
      }
    }

    if (newPassword) {
      if (newPassword.length < 4) {
        setErrorMsg('New password must be at least 4 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and confirmation do not match.');
        return;
      }
    }

    triggerConfirm(
      'Update Owner Credentials & Security Access Settings?',
      `Are you sure you want to save the new credentials, secret path "/${cleanOwnerPath}" and passcode "${cleanPasscode}" for Owner "${cleanUsername}"? Ensure you record these details securely.`,
      () => {
        setIsSaving(true);

        // Update siteConfig ownerAdminPath and ownerAdminPassword
        const currentConfig = getSiteConfig();
        const updatedConfig = {
          ...currentConfig,
          ownerAdminPath: cleanOwnerPath,
          ownerAdminPassword: cleanPasscode
        };
        saveSiteConfig(updatedConfig);

        const updates: Partial<AdminUser> = {
          username: cleanUsername,
          name: displayName.trim(),
          email: email.trim() || undefined,
          passcode: cleanPasscode,
          role: 'Owner',
          status: 'active'
        };

        if (newPassword) {
          updates.password = newPassword;
        }

        const res = updateAdminUser(ownerUser.id, updates);
        setIsSaving(false);

        if (res.success && res.user) {
          setOwnerUser(res.user);
          setCurrentPasswordInput('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg('Owner credentials, secret URL path & passcode updated successfully and active immediately.');
          onToast('Owner credentials & security configuration updated');
          window.dispatchEvent(new CustomEvent('site_config_updated', { detail: updatedConfig }));
          
          if (currentUser?.id === res.user.id) {
            setCurrentUser(res.user);
            setCurrentAdminUser(res.user);
          }

          if (onUserUpdated) {
            onUserUpdated();
          }
        } else {
          setErrorMsg(res.error || 'Failed to update owner credentials.');
        }
      }
    );
  };

  const ownerTabs = ROLE_PERMISSIONS['Owner'] || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-white">
      {/* Header Banner */}
      <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div 
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
          style={{ backgroundColor: primaryColor }}
        />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Supreme Application Authority</span>
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Owner Control & Credentials
              </h2>
              {isKilled ? (
                <button
                  type="button"
                  onClick={handleRestoreApp}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 border border-emerald-400 active:scale-[0.98] shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Application</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setKillErrorMsg(null);
                    setKillConfirmPassword('');
                    setKillReasonInput('');
                    setShowKillModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center gap-2 border border-red-500/50 active:scale-[0.98] shrink-0"
                >
                  <Power className="w-4 h-4" />
                  <span>Kill Application</span>
                </button>
              )}
            </div>
            <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
              As the application owner, you have unrestricted master clearance across all festival infrastructure, 
              RBAC authorization overrides, financial controls, and credential management.
            </p>
          </div>
        </div>

        {/* Quick Privilege Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-neutral-800">
          <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-neutral-200">Unrestricted Full Access</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Authorized for all 15 console modules without limitation</div>
            </div>
          </div>

          <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800 flex items-start gap-3">
            <KeyRound className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-neutral-200">Credential Autonomy</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Modify owner username, secure passkey, and email anytime</div>
            </div>
          </div>

          <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800 flex items-start gap-3">
            <Fingerprint className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-neutral-200">RBAC Governance</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Create, suspend, and govern all operator staff clearances</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Owner Credentials Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Owner Credentials Management</h3>
                  <p className="text-xs text-neutral-400">Update your username and master access password</p>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Owner Username</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-mono">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="owner"
                      required
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/80 font-mono font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500">Unique handle used to sign into the Secure Console</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <span>Display / Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Executive Owner"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/80 font-semibold"
                  />
                  <p className="text-[10px] text-neutral-500">Name displayed in the console header</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <span>Recovery / Contact Email</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@grenadacaricom2027.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/80 font-mono"
                />
                <p className="text-[10px] text-neutral-500">Used for important notifications and audit logs</p>
              </div>

              {/* Owner Secret Console URL Path */}
              <div className="pt-4 border-t border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Link className="w-4 h-4 text-amber-400" />
                    <span>Owner Secret Console URL Path</span>
                  </label>
                  <span className="text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    Owner URL Route
                  </span>
                </div>
                <div className="relative font-mono">
                  <span className="absolute left-3.5 top-2.5 text-neutral-500 text-xs font-bold select-none">/</span>
                  <input
                    type="text"
                    value={ownerAdminPath}
                    onChange={(e) => {
                      const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                      setOwnerAdminPath(cleaned);
                    }}
                    placeholder="owner-console"
                    required
                    className="w-full bg-neutral-950 border border-amber-500/40 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 font-bold"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 leading-normal">
                  Dedicated secret URL for Owner access: <span className="text-amber-400 font-mono select-all">{window.location.origin}/{ownerAdminPath || 'owner-console'}</span>. 
                  Navigating to either this path or the Operations path (<span className="text-amber-300 font-mono">/{getSiteConfig().adminPath || 'admin'}</span>) will open the console.
                </p>
              </div>

              {/* Console Access Passcode / PIN Section */}
              <div className="pt-4 border-t border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Owner Access Passcode / PIN</span>
                  </label>
                  <span className="text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    Step 1 Gate PIN
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPasscode ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter owner passcode (e.g. 9999)"
                    required
                    className="w-full bg-neutral-950 border border-amber-500/40 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 font-mono font-bold tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                    aria-label={showPasscode ? "Hide passcode" : "Show passcode"}
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400 leading-normal">
                  Dedicated passcode for Owner access. Entering either this passcode or the Operations passcode (<span className="text-amber-300 font-mono">{getSiteConfig().adminPassword || '2027'}</span>) will unlock the Step 1 PIN gate.
                </p>
              </div>

              {/* Password Section */}
              <div className="pt-4 border-t border-neutral-800 space-y-4">
                <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Security & Password Update</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">
                    Current Password <span className="text-[10px] text-neutral-500">(Required to authorize changes)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Enter current owner password"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/80 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-400">
                      New Password <span className="text-[10px] text-neutral-500">(Leave blank to keep unchanged)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/80 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-400">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/80 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={refreshOwnerData}
                  className="px-3.5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Form</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Owner Credentials'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Full Access Clearances Overview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-neutral-800 pb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Full Access Clearance Matrix</h3>
                <p className="text-xs text-neutral-400">All 15 console modules accessible to Owner</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Owner Control Center</div>
                    <div className="text-[10px] text-neutral-400">Master credentials & security</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded text-[10px] font-bold">
                  Exclusive
                </span>
              </div>

              <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Fingerprint className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Console Users & RBAC</div>
                    <div className="text-[10px] text-neutral-400">Staff clearances & accounts</div>
                  </div>
                </div>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileKey className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Backup, Restore & Reset</div>
                    <div className="text-[10px] text-neutral-400">Database snapshots & recovery</div>
                  </div>
                </div>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">All Event & Operational Tabs</div>
                    <div className="text-[10px] text-neutral-400">Events, passes, orders, media, hotels...</div>
                  </div>
                </div>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Crown className="w-4 h-4" />
                <span>Supreme Hierarchy Note</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                The Owner account cannot be restricted or locked out by standard Admin operators. 
                Any credential changes made here take effect immediately across all active browser sessions.
              </p>
            </div>

            {/* Dual Access Credentials Matrix */}
            <div className="p-4 bg-neutral-950/90 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Dual Security Access Matrix</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold rounded">
                  Dual Active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-neutral-900/80 rounded-lg border border-neutral-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Operations Control</div>
                  <div className="text-white font-mono text-[11px] truncate">Path: /{getSiteConfig().adminPath || 'admin'}</div>
                  <div className="text-amber-400 font-mono text-[10px]">PIN: {getSiteConfig().adminPassword || '2027'}</div>
                </div>
                <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/30 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-300">Owner Control</div>
                  <div className="text-white font-mono text-[11px] truncate">Path: /{ownerAdminPath || 'owner-console'}</div>
                  <div className="text-amber-400 font-mono text-[10px]">PIN: {passcode || '9999'}</div>
                </div>
              </div>
              <p className="text-[10px] text-neutral-400 leading-tight">
                Both Secret URL Paths and Access Passcodes operate independently and are accepted universally by the security subsystem.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kill Switch Authorization Modal */}
      {showKillModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0C0F1E] border border-red-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Confirm System Termination</h3>
                  <p className="text-[11px] text-red-400">High-Risk Executive Action</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKillModal(false)}
                className="text-neutral-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {killErrorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{killErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleExecuteKill} className="space-y-4">
              <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-neutral-300 leading-relaxed">
                ⚠️ <strong className="text-white">Warning:</strong> This action will take the entire festival app offline immediately for all users.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">
                  Shutdown Reason <span className="text-[10px] text-neutral-500 font-normal">(Optional public message)</span>
                </label>
                <input
                  type="text"
                  value={killReasonInput}
                  onChange={(e) => setKillReasonInput(e.target.value)}
                  placeholder="e.g. System Maintenance & Security Override"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-red-500 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                  <span>Enter Owner Password to Authorize</span>
                  <span className="text-[10px] text-red-400">Required</span>
                </label>
                <input
                  type="password"
                  value={killConfirmPassword}
                  onChange={(e) => setKillConfirmPassword(e.target.value)}
                  placeholder="Enter Owner password"
                  required
                  autoFocus
                  className="w-full bg-neutral-950 border border-red-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-red-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKillModal(false)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Power className="w-4 h-4" />
                  <span>AUTHORIZE KILL SWITCH NOW</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
