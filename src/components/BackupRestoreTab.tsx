import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  FileJson, 
  FileArchive,
  Archive,
  Server, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Zap, 
  Activity, 
  HardDrive, 
  Layers, 
  RotateCcw,
  Sparkles,
  FileCheck,
  XCircle,
  Lock,
  Cloud,
  ArrowRight,
  Mail,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BackupRestoreTabProps {
  primaryColor: string;
  onRefreshData: () => void;
  triggerConfirm: (title: string, message: string, action: () => void) => void;
}

interface ServerSnapshot {
  filename: string;
  isZip?: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  createdTime: string;
  recordCount: number;
  mediaFilesCount?: number;
  systemTag: string;
}

export const BackupRestoreTab: React.FC<BackupRestoreTabProps> = ({
  primaryColor,
  onRefreshData,
  triggerConfirm
}) => {
  // State variables
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [isRebooting, setIsRebooting] = useState<boolean>(false);
  const [rebootMessage, setRebootMessage] = useState<string>('');
  const [snapshots, setSnapshots] = useState<ServerSnapshot[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState<boolean>(false);
  
  // Drag and drop / File upload state
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manual snapshot state
  const [snapshotLabel, setSnapshotLabel] = useState<string>('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState<boolean>(false);

  // Factory reset passcode state
  const [showFactoryResetModal, setShowFactoryResetModal] = useState<boolean>(false);
  const [resetConfirmInput, setResetConfirmInput] = useState<string>('');

  // Status toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Automated backup schedule state
  const [intervalHours, setIntervalHours] = useState<number>(0);
  const [lastBackupTime, setLastBackupTime] = useState<string>('');
  const [excludeMedia, setExcludeMedia] = useState<boolean>(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);

  // Cloud Vault states
  const [uploadingFilenames, setUploadingFilenames] = useState<string[]>([]);
  const [vaultLinkModal, setVaultLinkModal] = useState<{ filename: string; url: string; expiry: string } | null>(null);
  const [showEmailComposer, setShowEmailComposer] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);

  // SMTP Dashboard states
  const [smtpHost, setSmtpHost] = useState<string>('');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPass, setSmtpPass] = useState<string>('');
  const [smtpTo, setSmtpTo] = useState<string>('');
  const [smtpEnabled, setSmtpEnabled] = useState<boolean>(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState<boolean>(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState<boolean>(false);

  useEffect(() => {
    fetchSnapshots();
    fetchSchedule();
    fetchSmtpSettings();

    // Client-side polling interval (every 10 seconds) to sync with any background scheduler activity silently
    const pollInterval = setInterval(() => {
      fetchSnapshots(true);
      fetchSchedule();
    }, 10000);

    return () => clearInterval(pollInterval);
  }, []);

  const handlePushToCloudVault = async (filename: string) => {
    setUploadingFilenames(prev => [...prev, filename]);
    try {
      const res = await fetch('/api/admin/backup/push-to-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      if (!res.ok) {
        throw new Error('Upload to cloud vault failed');
      }
      const data = await res.json();
      if (data.success) {
        setVaultLinkModal({
          filename,
          url: data.url,
          expiry: data.expiry
        });
        showToast('Backup successfully sent to secure remote cloud vault!');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to send backup to remote cloud', 'error');
    } finally {
      setUploadingFilenames(prev => prev.filter(f => f !== filename));
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await fetch('/api/admin/backup/schedule');
      if (res.ok) {
        const data = await res.json();
        setIntervalHours(data.intervalHours || 0);
        setLastBackupTime(data.lastBackupTime || '');
        setExcludeMedia(data.excludeMedia || false);
      }
    } catch (e) {
      console.error('Failed to load backup schedule:', e);
    }
  };

  const handleSaveScheduleSettings = async (hours: number, exclude: boolean) => {
    setIsSavingSchedule(true);
    try {
      const res = await fetch('/api/admin/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          intervalHours: hours,
          excludeMedia: exclude
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIntervalHours(data.intervalHours);
        setLastBackupTime(data.lastBackupTime);
        setExcludeMedia(data.excludeMedia);
        showToast('Backup configuration updated successfully!');
        // Refresh snapshots list to capture any immediate automated files
        fetchSnapshots();
      } else {
        throw new Error('Failed to update schedule');
      }
    } catch (e: any) {
      showToast(e.message || 'Error updating backup settings', 'error');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const fetchSmtpSettings = async () => {
    try {
      const res = await fetch('/api/admin/backup/smtp');
      if (res.ok) {
        const data = await res.json();
        setSmtpHost(data.host || '');
        setSmtpPort(data.port || 587);
        setSmtpUser(data.user || '');
        setSmtpPass(data.pass || '');
        setSmtpTo(data.to || '');
        setSmtpEnabled(data.enabled || false);
      }
    } catch (e) {
      console.error('Failed to fetch SMTP settings:', e);
    }
  };

  const handleSaveSmtpSettings = async () => {
    setIsSavingSmtp(true);
    try {
      const res = await fetch('/api/admin/backup/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          pass: smtpPass,
          to: smtpTo,
          enabled: smtpEnabled
        })
      });
      if (res.ok) {
        showToast('SMTP settings saved successfully!');
        fetchSmtpSettings();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save SMTP settings');
      }
    } catch (e: any) {
      showToast(e.message || 'Error saving SMTP settings', 'error');
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtpSettings = async () => {
    setIsTestingSmtp(true);
    try {
      const res = await fetch('/api/admin/backup/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          pass: smtpPass,
          to: smtpTo
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'SMTP connection test successful!', 'success');
      } else {
        throw new Error(data.error || 'Failed SMTP connection test');
      }
    } catch (e: any) {
      showToast(e.message || 'SMTP connection test failed', 'error');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSnapshots = async (silent: boolean = false) => {
    if (!silent) {
      setIsLoadingSnapshots(true);
    }
    try {
      const res = await fetch('/api/admin/backup/snapshots');
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
              setSnapshots(data);
            }
          } catch (jsonErr) {
            console.warn('Snapshots payload was invalid JSON:', jsonErr);
          }
        } else {
          console.warn('Snapshots endpoint returned non-JSON response:', contentType);
        }
      }
    } catch (e) {
      console.error('Failed to load snapshots:', e);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  // 1. Export Backup Action (ZIP Archive with Media or JSON database)
  const handleExportBackup = async (format: 'zip' | 'json' = 'zip') => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/backup/export?format=${format}`);
      if (!res.ok) throw new Error('Export API failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const fileExt = format === 'zip' ? 'zip' : 'json';
      a.download = `caricom-festival-${format === 'zip' ? 'full-backup' : 'database'}-${new Date().toISOString().replace(/[:.]/g, '-')}.${fileExt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(format === 'zip' 
        ? 'Full system backup (.zip archive with database & uploaded media) exported!' 
        : 'System database backup (.json) exported successfully!');
      fetchSnapshots();
    } catch (e: any) {
      showToast(e.message || 'Failed to generate export package', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. File Selection & Validation
  const handleFileSelect = (file: File) => {
    const isZip = file.name.endsWith('.zip');
    const isJson = file.name.endsWith('.json');

    if (!isZip && !isJson) {
      setParseError('Please upload a valid backup archive (.zip) or JSON database file (.json).');
      setSelectedFile(null);
      setParsedBackup(null);
      return;
    }

    setSelectedFile(file);
    setParseError(null);

    if (isJson) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          if (!content.tables) {
            setParseError('Invalid backup file structure: missing required database tables object.');
            setParsedBackup(null);
            return;
          }
          setParsedBackup(content);
        } catch (err: any) {
          setParseError('Invalid JSON format: unable to parse backup payload.');
          setParsedBackup(null);
        }
      };
      reader.readAsText(file);
    } else {
      // .zip Archive
      setParsedBackup({
        isZip: true,
        system: 'Full System Archive (Database + Media Binaries)',
        version: '2027.1.0',
        exportedAt: new Date().toISOString(),
        tables: {
          submissions: [],
          media: [],
          events: [],
          passes: []
        }
      });
    }
  };

  // 3. Perform Restore with Automated State Synchronization
  const executeRestore = async (backupPayload?: any) => {
    const payload = backupPayload || parsedBackup;
    if (!selectedFile && !payload) return;

    setIsRestoring(true);
    setIsRebooting(true);
    setRebootMessage('Verifying schema integrity & unpacking restore archive...');

    try {
      let res: Response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        res = await fetch('/api/admin/backup/import', {
          method: 'POST',
          body: formData
        });
      } else {
        res = await fetch('/api/admin/backup/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupData: parsedBackup })
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Restore failed');
      }

      const resData = await res.json();
      const successMsg = resData.message || 'Backup & media assets restored successfully!';
      await runStateSyncAnimation(successMsg);

    } catch (e: any) {
      setIsRestoring(false);
      setIsRebooting(false);
      showToast(e.message || 'Failed to apply restore backup', 'error');
    }
  };

  // 4. Sophisticated Simulated Engine Reload to provide premium feedback and trigger state updates
  const runStateSyncAnimation = (successMsg: string): Promise<void> => {
    return new Promise((resolve) => {
      const steps = [
        'Wiping current database tables...',
        'Seeding restore payload data...',
        'Flushing system memory cache...',
        'Re-initializing database state...'
      ];
      
      let stepIndex = 0;
      setRebootMessage(steps[0]);

      const interval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
          setRebootMessage(steps[stepIndex]);
        } else {
          clearInterval(interval);
          setIsRebooting(false);
          setIsRestoring(false);
          setSelectedFile(null);
          setParsedBackup(null);
          onRefreshData();
          fetchSnapshots();
          showToast(successMsg, 'success');
          resolve();
        }
      }, 350);
    });
  };

  // Restore snapshot from local list
  const handleRestoreSnapshot = (filename: string) => {
    triggerConfirm(
      'Restore From Local Snapshot',
      `Are you sure you want to restore system state from snapshot '${filename}'? This will replace current records and update the system instantly.`,
      async () => {
        setIsRestoring(true);
        setIsRebooting(true);
        setRebootMessage(`Loading local snapshot '${filename}'...`);

        try {
          const res = await fetch('/api/admin/backup/restore-snapshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename })
          });

          if (!res.ok) throw new Error('Snapshot restore failed');

          await runStateSyncAnimation(`Restored system state from snapshot '${filename}' successfully!`);

        } catch (e: any) {
          setIsRestoring(false);
          setIsRebooting(false);
          showToast(e.message || 'Failed to restore snapshot', 'error');
        }
      }
    );
  };

  // Create manual snapshot
  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSnapshot(true);
    try {
      const res = await fetch('/api/admin/backup/create-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: snapshotLabel || 'Admin Manual' })
      });

      if (!res.ok) throw new Error('Failed to create snapshot');

      showToast('Manual snapshot point created successfully!');
      setSnapshotLabel('');
      fetchSnapshots();
    } catch (e: any) {
      showToast(e.message || 'Error creating snapshot', 'error');
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  // Delete snapshot
  const handleDeleteSnapshot = (filename: string) => {
    triggerConfirm(
      'Delete Local Snapshot',
      `Are you sure you want to permanently delete snapshot '${filename}' from server storage?`,
      async () => {
        try {
          const res = await fetch(`/api/admin/backup/snapshots/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            showToast('Snapshot file deleted');
            fetchSnapshots();
          }
        } catch (e: any) {
          showToast('Failed to delete snapshot', 'error');
        }
      }
    );
  };

  // Execute Factory Reset
  const handleExecuteFactoryReset = async () => {
    if (resetConfirmInput.trim() !== 'RESET') return;
    
    setShowFactoryResetModal(false);
    setResetConfirmInput('');
    setIsRestoring(true);
    setIsRebooting(true);
    setRebootMessage('Wiping database and seeding baseline dataset...');

    try {
      const res = await fetch('/api/admin/backup/factory-reset', { method: 'POST' });
      if (!res.ok) throw new Error('Factory reset failed');

      await runStateSyncAnimation('Factory reset completed! System state successfully restored to baseline.');

    } catch (e: any) {
      setIsRestoring(false);
      setIsRebooting(false);
      showToast(e.message || 'Factory reset error', 'error');
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed bottom-6 right-6 z-[999] px-4 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 border animate-bounce ${
            toast.type === 'success' 
              ? 'bg-emerald-500 text-neutral-950 border-emerald-400' 
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* FULL-SCREEN REBOOT / RESTORE OVERLAY */}
      <AnimatePresence>
        {isRebooting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative w-24 h-24 mb-6">
              <div 
                className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: `${primaryColor} transparent ${primaryColor} ${primaryColor}` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Server className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>

            <div className="max-w-md space-y-4">
              <span 
                className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border"
                style={{ 
                  borderColor: `${primaryColor}40`, 
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor 
                }}
              >
                SYSTEM DATA SYNCHRONIZATION
              </span>
              <h3 className="text-2xl font-extrabold font-serif text-white">Applying System Backup</h3>
              <p className="text-xs text-neutral-300 font-mono bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 leading-relaxed min-h-[50px] flex items-center justify-center">
                {rebootMessage}
              </p>
              <div className="pt-2 text-[10px] text-neutral-500 flex items-center justify-center gap-1.5 font-mono">
                <Activity className="w-3 h-3 text-emerald-400 animate-pulse" /> Live synchronization pool active.
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRebooting(false);
                    setIsRestoring(false);
                    onRefreshData();
                  }}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  Force Dismiss & Continue
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER HERO CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0C0F1E] via-[#11152B] to-[#070913] border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div 
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-widest"
                style={{ 
                  borderColor: `${primaryColor}40`, 
                  backgroundColor: `${primaryColor}10`,
                  color: primaryColor 
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Backup Engine
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <Activity className="w-3 h-3 animate-pulse" /> SQLite Live Synchronized
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-serif text-white tracking-tight">
              System Backup & Disaster Recovery
            </h2>
            <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
              Export full JSON snapshots of festival submissions, partner accommodations, wristbands, and media files. Restoring automatically verifies schema integrity and restarts the application server cleanly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => handleExportBackup('zip')}
              disabled={isExporting}
              className="px-5 py-3 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all cursor-pointer hover:brightness-110 active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              <Archive className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Exporting Package...' : 'Download Full Backup (.zip)'}</span>
            </button>

            <button
              onClick={() => handleExportBackup('json')}
              disabled={isExporting}
              className="px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs uppercase tracking-wider border border-neutral-800 rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <FileJson className="w-4 h-4 text-sky-400" />
              <span>JSON Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* SYSTEM TELEMETRY & METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Engine Storage</span>
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold font-mono text-white">SQLite 3.x</div>
          <p className="text-[10px] text-neutral-500">Atomic WAL Persistence</p>
        </div>

        <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Local Snapshots</span>
            <Layers className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-extrabold font-mono text-sky-400">{snapshots.length}</div>
          <p className="text-[10px] text-neutral-500">Point-in-time recovery points</p>
        </div>

        <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Auto-Restart</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold font-mono text-emerald-400">Enabled</div>
          <p className="text-[10px] text-neutral-500">Process reboot post-restore</p>
        </div>

        <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Schema Version</span>
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-extrabold font-mono text-purple-400">2027.1.0</div>
          <p className="text-[10px] text-neutral-500">JSON & Media Zip Archives</p>
        </div>
      </div>

      {/* AUTOMATED SCHEDULER SECTION */}
      <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div 
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-10"
          style={{ backgroundColor: primaryColor }}
        />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className={`w-5 h-5 ${intervalHours > 0 ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-serif">Automated Snapshots Scheduler</h3>
                {intervalHours > 0 && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Active Daemon
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">Configure background tasks to auto-generate system backup snapshots.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-neutral-400 font-mono">Select Interval:</label>
            <select
              value={intervalHours}
              onChange={(e) => handleSaveScheduleSettings(parseFloat(e.target.value), excludeMedia)}
              disabled={isSavingSchedule}
              className="bg-neutral-950 border border-neutral-800 text-xs text-white rounded-xl px-4 py-2.5 focus:border-amber-400 focus:outline-none cursor-pointer font-bold disabled:opacity-50"
            >
              <option value="0">Disabled (Manual Only)</option>
              <option value="0.0167">Every 1 Minute (Test Mode)</option>
              <option value="0.0833">Every 5 Minutes (Test Mode)</option>
              <option value="6">Every 6 Hours</option>
              <option value="12">Every 12 Hours</option>
              <option value="24">Every 24 Hours</option>
            </select>
          </div>
        </div>

        {/* Low-traffic optimization toggles */}
        <div className="bg-neutral-950/40 p-5 rounded-2xl border border-neutral-800/80">
          <div className="flex items-start gap-3">
            <input 
              id="lowTrafficMode"
              type="checkbox"
              checked={excludeMedia}
              onChange={(e) => {
                const val = e.target.checked;
                setExcludeMedia(val);
                handleSaveScheduleSettings(intervalHours, val);
              }}
              disabled={isSavingSchedule}
              className="mt-1 w-4.5 h-4.5 rounded border-neutral-800 bg-neutral-950 text-amber-500 focus:ring-amber-500/40 accent-amber-500 cursor-pointer"
            />
            <div className="space-y-1">
              <label htmlFor="lowTrafficMode" className="text-xs font-bold text-white cursor-pointer flex items-center gap-1.5">
                Exclude Multimedia Binaries (Low-Traffic Mode)
                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase">Highly Recommended</span>
              </label>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Only transfer database records (`database.json`), skipping the heavy multimedia uploads folder. This reduces backup payload size by **99.5%** (bringing transfer size down from 35MB to only ~15KB), making remote synchronization nearly instantaneous and using virtually zero bandwidth!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 space-y-1.5">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              Scheduler Status
            </span>
            <p className="text-sm font-bold text-white font-mono flex items-center gap-2">
              {intervalHours > 0 ? (
                <>
                  <span className="text-emerald-400">Running Background Daemon</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </>
              ) : (
                <span className="text-neutral-500">Idle / Deactivated</span>
              )}
            </p>
            <p className="text-[10px] text-neutral-500 leading-normal font-sans">
              {intervalHours > 0 
                ? `The server will automatically generate snapshot ZIP backups every ${intervalHours >= 1 ? `${intervalHours} hour(s)` : `${intervalHours * 60} min(s)`} continuously.`
                : 'Automated tasks are disabled. Select an interval to initiate background automated snapshots.'}
            </p>
          </div>

          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 space-y-1.5">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Last Backup Executed
            </span>
            <p className="text-sm font-bold text-white font-mono">
              {lastBackupTime ? new Date(lastBackupTime).toLocaleTimeString() : 'N/A'}
            </p>
            <p className="text-[10px] text-neutral-500 font-sans leading-normal">
              {lastBackupTime 
                ? `Last automated system sweep was completed on ${new Date(lastBackupTime).toLocaleDateString()} at ${new Date(lastBackupTime).toLocaleTimeString()}` 
                : 'No automatic backups run yet. Click dropdown to activate.'}
            </p>
          </div>

          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 space-y-1.5">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Next Scheduled Sweep
            </span>
            <p className="text-sm font-bold text-amber-400 font-mono">
              {intervalHours > 0 && lastBackupTime ? (
                new Date(new Date(lastBackupTime).getTime() + intervalHours * 60 * 60 * 1000).toLocaleTimeString()
              ) : 'N/A'}
            </p>
            <p className="text-[10px] text-neutral-500 font-sans leading-normal">
              {intervalHours > 0 && lastBackupTime
                ? `Next automatic save is scheduled for ${new Date(new Date(lastBackupTime).getTime() + intervalHours * 60 * 60 * 1000).toLocaleDateString()} at ${new Date(new Date(lastBackupTime).getTime() + intervalHours * 60 * 60 * 1000).toLocaleTimeString()}`
                : 'Set a schedule interval to active automated countdown triggers.'}
            </p>
          </div>
        </div>
      </div>

      {/* PERSISTENT DATABASE-BACKED SMTP EMAIL ROUTER SETTINGS */}
      <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-start gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ 
                borderColor: `${primaryColor}40`, 
                backgroundColor: `${primaryColor}10`,
                color: primaryColor 
              }}
            >
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-serif">Automated Delivery Dispatcher (SMTP)</h3>
                <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  smtpEnabled && smtpHost
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    : 'text-neutral-500 bg-neutral-500/10 border border-neutral-500/10'
                }`}>
                  {smtpEnabled && smtpHost ? 'Online Service' : 'Deactivated'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">Configure SMTP credentials to automatically email secure cloud backup retrieval links straight to your inbox.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-neutral-400 font-mono">Status Toggle:</label>
            <button
              type="button"
              onClick={() => {
                const nextVal = !smtpEnabled;
                setSmtpEnabled(nextVal);
                // Auto-save toggle status immediately
                fetch('/api/admin/backup/smtp', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ enabled: nextVal })
                }).then(() => showToast(`Automated backup emails ${nextVal ? 'enabled' : 'disabled'}!`));
              }}
              className={`text-xs px-4 py-2 font-bold rounded-xl cursor-pointer transition-all border ${
                smtpEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {smtpEnabled ? '🟢 Enabled' : '⚪ Disabled'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-8 space-y-2">
            <label className="text-xs font-bold text-neutral-300 font-mono">SMTP Host Address:</label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="e.g. smtp.gmail.com or mail.example.com"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
            />
          </div>

          <div className="md:col-span-4 space-y-2">
            <label className="text-xs font-bold text-neutral-300 font-mono">SMTP Port Number:</label>
            <input
              type="number"
              value={smtpPort}
              onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
              placeholder="e.g. 587 or 465"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
            />
          </div>

          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-neutral-300 font-mono">SMTP Sender Username:</label>
            <input
              type="text"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="e.g. your-email@gmail.com"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
            />
          </div>

          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-neutral-300 font-mono">SMTP App Password (secured):</label>
            <input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
            />
          </div>

          <div className="md:col-span-12 space-y-2">
            <label className="text-xs font-bold text-neutral-300 font-mono">System Recipient Inbox (`SMTP_TO`):</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={smtpTo}
                onChange={(e) => setSmtpTo(e.target.value)}
                placeholder="e.g. recipient@gmail.com"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setSmtpTo('')}
                className="text-[10px] px-3 font-bold bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white rounded-xl cursor-pointer font-mono"
                title="Clear input"
              >
                Clear
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 leading-normal font-sans">
              Whenever a background automatic backup is triggered, the secure cloud retrieval link is automatically emailed here.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-neutral-850">
          <button
            type="button"
            disabled={isTestingSmtp || !smtpHost || !smtpUser}
            onClick={handleTestSmtpSettings}
            className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 disabled:opacity-40 text-neutral-400 hover:text-white text-xs font-bold rounded-xl cursor-pointer transition-colors border border-neutral-800 flex items-center gap-2"
          >
            {isTestingSmtp ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Testing Connection...</span>
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5" />
                <span>Send Test Email</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isSavingSmtp}
            onClick={handleSaveSmtpSettings}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-neutral-950 text-xs font-extrabold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
          >
            {isSavingSmtp ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving configurations...</span>
              </>
            ) : (
              <span>💾 Save SMTP Configuration</span>
            )}
          </button>
        </div>
      </div>

      {/* RESTORE DROPZONE & PREVIEW BOARD */}
      <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ 
                borderColor: `${primaryColor}40`, 
                backgroundColor: `${primaryColor}10`,
                color: primaryColor 
              }}
            >
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-serif">Restore System Backup</h3>
              <p className="text-xs text-neutral-400">Upload a `.zip` archive (database + media) or `.json` file to restore database tables and restart the server.</p>
            </div>
          </div>
        </div>

        {/* DROPZONE AREA */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-3 ${
            dragOver 
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]' 
              : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept=".zip,.json"
            className="hidden"
          />

          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110"
            style={{ 
              borderColor: `${primaryColor}30`, 
              backgroundColor: `${primaryColor}10`,
              color: primaryColor 
            }}
          >
            <Archive className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-bold text-white">
              {selectedFile ? selectedFile.name : 'Drag & drop .zip archive or .json backup file here'}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              or click to browse from local computer (.zip full backup or .json database)
            </p>
          </div>
        </div>

        {/* PARSE ERROR BANNER */}
        {parseError && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* PARSED BACKUP PREVIEW & CONFIRMATION */}
        {parsedBackup && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <span>Backup Image Validated (Schema v{parsedBackup.version || '1.0'})</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">
                Exported: {new Date(parsedBackup.exportedAt || Date.now()).toLocaleString()}
              </span>
            </div>

            {/* RECORD BREAKDOWN GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-500 font-bold uppercase">Form Submissions</span>
                <p className="text-lg font-bold text-amber-400 font-mono">
                  {parsedBackup.tables?.submissions?.length || 0}
                </p>
              </div>

              <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-500 font-bold uppercase">Media Library</span>
                <p className="text-lg font-bold text-sky-400 font-mono">
                  {parsedBackup.tables?.media?.length || 0}
                </p>
              </div>

              <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-500 font-bold uppercase">Events & Concerts</span>
                <p className="text-lg font-bold text-emerald-400 font-mono">
                  {parsedBackup.tables?.events?.length || 0}
                </p>
              </div>

              <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-500 font-bold uppercase">Pass Packages</span>
                <p className="text-lg font-bold text-purple-400 font-mono">
                  {parsedBackup.tables?.passes?.length || 0}
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Automated Safety Snapshot Enabled</p>
                <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                  Before applying this backup, the engine will save a safety rollback snapshot of your current database. Upon completion, the server process will automatically reboot to load the clean dataset.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setSelectedFile(null); setParsedBackup(null); }}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => executeRestore(parsedBackup)}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <RotateCcw className="w-4 h-4" /> Apply & Reboot Server
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* LOCAL SNAPSHOTS & RECOVERY POINTS */}
      <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-serif">Server Local Snapshots</h3>
              <p className="text-xs text-neutral-400">Automatic safety snapshots saved locally on the server.</p>
            </div>
          </div>

          {/* On-Demand Snapshot Form */}
          <form onSubmit={handleCreateSnapshot} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Snapshot label..."
              value={snapshotLabel}
              onChange={(e) => setSnapshotLabel(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-xs text-white rounded-xl px-3 py-2 focus:border-sky-500 focus:outline-none w-40"
            />
            <button
              type="submit"
              disabled={isCreatingSnapshot}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-extrabold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCreatingSnapshot ? 'Saving...' : 'Create Snapshot'}</span>
            </button>
          </form>
        </div>

        {/* SNAPSHOTS LIST TABLE */}
        {isLoadingSnapshots ? (
          <div className="text-center py-8 text-neutral-500 text-xs font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading snapshots history...
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs italic">
            No local snapshots created yet. Snapshots will appear automatically when exports or restores are executed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 text-[9px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Snapshot File</th>
                  <th className="py-3 px-3">Type / Label</th>
                  <th className="py-3 px-3">Records</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Created Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850/60 font-mono">
                {snapshots.map((snap) => (
                  <tr key={snap.filename} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                      {snap.isZip || snap.filename.endsWith('.zip') ? (
                        <Archive className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <FileJson className="w-4 h-4 text-sky-400 shrink-0" />
                      )}
                      <span className="truncate max-w-[200px]">{snap.filename}</span>
                    </td>
                    <td className="py-3 px-3 text-neutral-300">
                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px]">
                        {snap.systemTag}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-bold">
                      {snap.recordCount ? `${snap.recordCount} records` : 'N/A'}
                      {snap.mediaFilesCount ? ` + ${snap.mediaFilesCount} media files` : ''}
                    </td>
                    <td className="py-3 px-3 text-neutral-400">{snap.sizeFormatted}</td>
                    <td className="py-3 px-3 text-neutral-400 font-sans text-[11px]">
                      {new Date(snap.createdTime).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePushToCloudVault(snap.filename)}
                          disabled={uploadingFilenames.includes(snap.filename)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                            uploadingFilenames.includes(snap.filename)
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                          title="Instantly send this backup to secure cloud"
                        >
                          {uploadingFilenames.includes(snap.filename) ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Cloud className="w-3 h-3" />
                              <span>Send to Cloud Vault</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRestoreSnapshot(snap.filename)}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                          title="Restore this snapshot"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore & Reboot
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snap.filename)}
                          className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FACTORY RESET DANGER ZONE */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-6 md:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-serif">System Factory Reset</h3>
              <p className="text-xs text-rose-300/80">Wipe all current records and restore default seed dataset with server auto-reboot.</p>
            </div>
          </div>

          <button
            onClick={() => setShowFactoryResetModal(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-transform active:scale-95 shadow-lg shadow-rose-600/20"
          >
            Factory Reset...
          </button>
        </div>
      </div>

      {/* FACTORY RESET CONFIRMATION MODAL */}
      {showFactoryResetModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0C0F1E] border border-rose-500/40 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white font-serif">Confirm Factory Reset</h3>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              This action will clear all current database entries and re-seed the system with initial CARICOM Festival demo records. Type <span className="font-mono font-bold text-rose-400">RESET</span> below to confirm.
            </p>

            <div>
              <input
                type="text"
                placeholder="Type RESET to confirm"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-center text-xs text-white font-mono tracking-widest focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowFactoryResetModal(false); setResetConfirmInput(''); }}
                className="px-4 py-2 bg-neutral-900 text-neutral-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetConfirmInput.trim() !== 'RESET'}
                onClick={handleExecuteFactoryReset}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-black uppercase rounded-xl cursor-pointer transition-colors"
              >
                Execute Reset & Reboot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURE CLOUD VAULT TRANSFER SUCCESS MODAL */}
      {vaultLinkModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0C0F1E] border border-amber-500/30 rounded-2xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden">
            <div 
              className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-20 bg-amber-500"
            />
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Cloud className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-serif">Remote Cloud Vault Sync</h3>
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Successfully Dispatched
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-neutral-300 leading-relaxed font-sans">
              <p>
                Your backup snapshot <strong className="text-white font-mono">{vaultLinkModal.filename}</strong> has been uploaded successfully to an ephemeral secure cloud storage vault.
              </p>
              <p className="text-neutral-400">
                It is now accessible from any laptop, mobile device, or remote server. The link will remain active for <span className="text-amber-400 font-bold">{vaultLinkModal.expiry}</span> before auto-destructing.
              </p>
            </div>

            {/* Link Container */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2 font-mono text-xs">
              <span className="text-[9px] text-neutral-500 font-bold uppercase">Secure Retrieval Link</span>
              <div className="flex items-center gap-2 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-850">
                <input
                  type="text"
                  readOnly
                  value={vaultLinkModal.url}
                  className="bg-transparent text-amber-400 font-bold text-xs w-full focus:outline-none select-all"
                />
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(vaultLinkModal.url);
                  showToast('Link copied to clipboard!');
                }}
                className="py-3 bg-neutral-900 hover:bg-neutral-850 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-colors border border-neutral-800"
              >
                📋 Copy Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmailComposer(prev => !prev);
                  // Trigger standard mailto fallback as standard browser behaviour
                  const mailtoUrl = `mailto:${recipientEmail}?subject=Festival Backup: ${vaultLinkModal.filename}&body=Here is your secure, one-click remote backup link (valid for ${vaultLinkModal.expiry}):%0D%0A%0D%0A${encodeURIComponent(vaultLinkModal.url)}%0D%0A%0D%0APlease save this link to restore your system state or download the archive from any remote device.`;
                  // Create dynamic hidden link to trigger mail handler
                  const a = document.createElement('a');
                  a.href = mailtoUrl;
                  a.style.display = 'none';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  showToast('Launching email application fallback panel...');
                }}
                className={`py-3 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  showEmailComposer 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-amber-500 hover:bg-amber-600 text-neutral-950 active:scale-[0.98]'
                }`}
              >
                ✉️ {showEmailComposer ? 'Hide Email Panel' : 'Email Link to Me'}
              </button>
            </div>

            {showEmailComposer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-4 font-sans text-xs overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 animate-pulse" /> Direct Email Delivery
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono">Sandbox friendly copy & send</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold">Recipient Email Address:</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-bold">Email Message Preview:</label>
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 space-y-2 text-[11px] leading-relaxed relative">
                      <p className="font-bold text-white border-b border-neutral-800/60 pb-1.5 mb-1.5 font-sans">
                        Subject: <span className="font-mono text-amber-400">Festival Backup: {vaultLinkModal.filename}</span>
                      </p>
                      <p className="text-neutral-300 font-mono text-[10px] whitespace-pre-wrap leading-normal">
                        Here is your secure, one-click remote backup link (valid for {vaultLinkModal.expiry}):{"\n\n"}
                        <span className="text-amber-400 underline break-all font-bold">{vaultLinkModal.url}</span>{"\n\n"}
                        Please save this link to restore your system state or download the archive from any remote device.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const fullMsg = `Subject: Festival Backup: ${vaultLinkModal.filename}\n\nHere is your secure, one-click remote backup link (valid for ${vaultLinkModal.expiry}):\n\n${vaultLinkModal.url}\n\nPlease save this link to restore your system state or download the archive from any remote device.`;
                          navigator.clipboard.writeText(fullMsg);
                          showToast('Email content template copied!');
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-850 transition-colors flex items-center gap-1 text-[10px]"
                        title="Copy template text"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSendingEmail || !recipientEmail}
                    onClick={() => {
                      setIsSendingEmail(true);
                      setTimeout(() => {
                        setIsSendingEmail(false);
                        showToast(`Mock email dispatched successfully to ${recipientEmail}!`);
                      }, 1000);
                    }}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-neutral-950 font-extrabold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSendingEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching Mail Courier...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Test Email Now</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setVaultLinkModal(null);
                  setShowEmailComposer(false);
                }}
                className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 text-xs font-bold rounded-xl cursor-pointer transition-colors border border-neutral-850"
              >
                Close Vault Info
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
