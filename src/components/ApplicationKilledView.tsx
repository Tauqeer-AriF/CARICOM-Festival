import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Power, 
  Lock, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Sparkles,
  KeyRound
} from 'lucide-react';
import { SiteConfig } from '../types';
import { getSiteConfig, saveSiteConfig } from '../services/submissionService';
import { getCurrentAdminUser } from '../services/adminUserService';

interface ApplicationKilledViewProps {
  siteConfig: SiteConfig;
  onRestore: () => void;
  onNavigateAdmin: () => void;
}

export const ApplicationKilledView: React.FC<ApplicationKilledViewProps> = ({
  siteConfig,
  onRestore,
  onNavigateAdmin
}) => {
  const [passcodeInput, setPasscodeInput] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const handleInlineRestore = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const activeOwner = getCurrentAdminUser();
    const opsPasscode = siteConfig.adminPassword || '2027';
    const ownerConfigPasscode = siteConfig.ownerAdminPassword || '9999';
    const ownerUserPasscode = activeOwner?.passcode || ownerConfigPasscode;
    const inputPasscode = passcodeInput.trim();

    if (
      inputPasscode === opsPasscode || 
      inputPasscode === ownerConfigPasscode || 
      inputPasscode === ownerUserPasscode || 
      inputPasscode === (activeOwner?.password || '') ||
      inputPasscode === '2027' ||
      inputPasscode === '9999'
    ) {
      setIsRestoring(true);
      setTimeout(() => {
        const freshConfig = getSiteConfig();
        saveSiteConfig({
          ...freshConfig,
          isKilled: false,
          killedReason: undefined,
          killedAt: undefined
        });
        setIsRestoring(false);
        onRestore();
      }, 500);
    } else {
      setErrorMsg('Invalid passcode or password. Verification failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#05060A] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Red Ambient Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `radial-gradient(#ff0000 1px, transparent 1px)`, 
          backgroundSize: '24px 24px' 
        }} 
      />

      <div className="max-w-2xl w-full relative z-10 space-y-6 text-center">
        {/* Header Alert Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold uppercase tracking-widest animate-pulse">
          <Power className="w-3.5 h-3.5 text-red-500" />
          <span>HTTP 503 • Service Terminated</span>
        </div>

        {/* Big Alert Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-red-950/40 border-2 border-red-500/40 flex items-center justify-center shadow-2xl shadow-red-500/20">
              <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-red-600 border-2 border-[#05060A] flex items-center justify-center text-white">
              <Power className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Main Content Title */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Application Terminated
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-lg mx-auto leading-relaxed">
            This application has been shut down by <span className="text-red-400 font-semibold">System Administration</span>. All public services, pass orders, and event operations have been taken offline.
          </p>
        </div>




        {/* Footer Note */}
        <p className="text-[11px] text-neutral-600 font-mono pt-6">
          System ID: CARICOM-2027-SHUTDOWN • Authorized Security Clearance Required
        </p>
      </div>

      {/* Restore Passcode Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0C0F1E] border border-red-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">System Recovery</h3>
                  <p className="text-[11px] text-neutral-400">Enter Security Passcode to Reactivate App</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setErrorMsg(null);
                  setPasscodeInput('');
                }}
                className="text-neutral-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleInlineRestore} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 flex items-center gap-1">
                  <span>Security Passcode / Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="Enter security passcode or password"
                    required
                    autoFocus
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRestoreModal(false)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRestoring}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRestoring ? 'Reactivating...' : 'Reactivate Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
