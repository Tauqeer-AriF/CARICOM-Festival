import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  FileJson, 
  Archive,
  Clock, 
  CheckCircle2, 
  Trash2, 
  Layers, 
  RotateCcw,
  Sparkles,
  FileCheck,
  XCircle,
  Sliders,
  Cloud,
  CloudUpload,
  ExternalLink,
  LogOut,
  FolderArchive,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initAuth, googleSignIn, getAccessToken, logout as authLogout } from '../services/authService';
import { googleDriveService, GoogleDriveBackupFile, GoogleDriveConfig } from '../services/googleDriveService';
import { User } from 'firebase/auth';

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

  // Custom timer state (number + unit: minutes, hours, days)
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customValue, setCustomValue] = useState<number>(12);
  const [customUnit, setCustomUnit] = useState<'minutes' | 'hours' | 'days'>('hours');

  // Google Drive Cloud Backup State
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig>({
    autoUploadEnabled: false,
    folderName: 'Grenada CARICOM Festival Backups 2027',
    syncedSnapshotNames: []
  });
  const [driveBackups, setDriveBackups] = useState<GoogleDriveBackupFile[]>([]);
  const [isLoadingDriveBackups, setIsLoadingDriveBackups] = useState<boolean>(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState<boolean>(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState<boolean>(false);
  const [uploadingFilename, setUploadingFilename] = useState<string | null>(null);
  const [isBackingUpAndUploading, setIsBackingUpAndUploading] = useState<boolean>(false);
  const [authDomainError, setAuthDomainError] = useState<string | null>(null);
  const [hasCopiedDomain, setHasCopiedDomain] = useState<boolean>(false);

  // Load Drive settings and initialize auth listener
  useEffect(() => {
    fetchSnapshots();
    fetchSchedule();
    loadDriveSettings();

    const unsubscribe = initAuth(
      (user, token) => {
        setDriveUser(user);
        setDriveToken(token);
        fetchDriveBackups(token);
      },
      () => {
        setDriveUser(null);
        setDriveToken(null);
      }
    );

    const pollInterval = setInterval(() => {
      fetchSnapshots(true);
      fetchSchedule();
      loadDriveSettings();
    }, 12000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  // Fetch Google Drive configuration from server
  const loadDriveSettings = async () => {
    try {
      const config = await googleDriveService.getSettings();
      setDriveConfig(config);
    } catch (e) {
      console.warn('Failed to load drive settings:', e);
    }
  };

  // Fetch backups from Google Drive folder
  const fetchDriveBackups = async (token?: string) => {
    const activeToken = token || driveToken || await getAccessToken();
    if (!activeToken) return;

    setIsLoadingDriveBackups(true);
    try {
      // Ensure folder first
      const folder = await googleDriveService.ensureFolder(activeToken);
      setDriveConfig(prev => ({
        ...prev,
        folderId: folder.folderId,
        folderName: folder.folderName,
        folderWebViewLink: folder.webViewLink
      }));

      const files = await googleDriveService.listBackups(activeToken, folder.folderId);
      setDriveBackups(files);
    } catch (e: any) {
      console.warn('Could not fetch Google Drive backups:', e);
    } finally {
      setIsLoadingDriveBackups(false);
    }
  };

  // Handle Google Drive connect / sign in
  const handleConnectGoogleDrive = async () => {
    setIsSigningInGoogle(true);
    setAuthDomainError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setDriveUser(result.user);
        setDriveToken(result.accessToken);
        setAuthDomainError(null);
        showToast(`Connected to Google Drive as ${result.user.email}`);

        // Provision folder and enable auto-upload by default
        const folder = await googleDriveService.ensureFolder(result.accessToken);
        await googleDriveService.saveSettings({
          autoUploadEnabled: true,
          folderId: folder.folderId,
          folderName: folder.folderName,
          folderWebViewLink: folder.webViewLink,
          userEmail: result.user.email || undefined
        });

        setDriveConfig(prev => ({
          ...prev,
          autoUploadEnabled: true,
          folderId: folder.folderId,
          folderName: folder.folderName,
          folderWebViewLink: folder.webViewLink,
          userEmail: result.user.email || undefined
        }));

        fetchDriveBackups(result.accessToken);
      }
    } catch (e: any) {
      const isUnauthorizedDomain = e?.code === 'auth/unauthorized-domain' || e?.message?.includes('unauthorized-domain');
      const isCancelled = e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request';
      if (isCancelled) {
        return;
      }
      if (isUnauthorizedDomain) {
        const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
        setAuthDomainError(currentHostname);
        showToast('Domain not authorized in Firebase Auth settings', 'error');
      } else {
        console.error('Google Drive sign in failed:', e);
        showToast(e.message || 'Failed to connect Google Drive', 'error');
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  // Handle Google Drive disconnect
  const handleDisconnectGoogleDrive = async () => {
    try {
      await authLogout();
      setDriveUser(null);
      setDriveToken(null);
      await googleDriveService.saveSettings({ autoUploadEnabled: false });
      setDriveConfig(prev => ({ ...prev, autoUploadEnabled: false }));
      setDriveBackups([]);
      showToast('Google Drive disconnected');
    } catch (e: any) {
      showToast(e.message || 'Failed to disconnect', 'error');
    }
  };

  // Toggle auto-upload to Google Drive
  const handleToggleAutoUpload = async (enabled: boolean) => {
    try {
      await googleDriveService.saveSettings({ autoUploadEnabled: enabled });
      setDriveConfig(prev => ({ ...prev, autoUploadEnabled: enabled }));
      showToast(enabled ? 'Google Drive auto-upload activated!' : 'Google Drive auto-upload disabled');

      // If turning on and we have unsynced snapshots, auto-sync latest
      if (enabled && driveToken && snapshots.length > 0) {
        const latest = snapshots[0];
        if (!driveConfig.syncedSnapshotNames?.includes(latest.filename)) {
          handleUploadSnapshotToDrive(latest.filename);
        }
      }
    } catch (e: any) {
      showToast('Failed to update Google Drive auto-upload setting', 'error');
    }
  };

  // Upload a specific snapshot to Google Drive
  const handleUploadSnapshotToDrive = async (filename: string) => {
    let token = driveToken || await getAccessToken();
    if (!token) {
      showToast('Please connect your Google Drive account first', 'error');
      return;
    }

    setIsUploadingToDrive(true);
    setUploadingFilename(filename);
    try {
      const res = await googleDriveService.uploadSnapshot(token, filename, driveConfig.folderId);
      if (res.success) {
        showToast(`Uploaded ${filename} to Google Drive!`);
        setDriveConfig(prev => ({
          ...prev,
          lastSyncTime: new Date().toISOString(),
          syncedSnapshotNames: [...(prev.syncedSnapshotNames || []), filename]
        }));
        fetchDriveBackups(token);
      }
    } catch (e: any) {
      console.error('Drive upload failed:', e);
      showToast(e.message || 'Failed to upload backup to Google Drive', 'error');
    } finally {
      setIsUploadingToDrive(false);
      setUploadingFilename(null);
    }
  };

  // One-click Backup & Upload to Google Drive
  const handleBackupAndUploadToDrive = async () => {
    let token = driveToken || await getAccessToken();
    if (!token) {
      showToast('Please connect your Google Drive account first', 'error');
      return;
    }

    setIsBackingUpAndUploading(true);
    try {
      const result = await googleDriveService.createAndUpload(token, 'Cloud Backup', driveConfig.folderId);
      if (result.success) {
        showToast(`Created & uploaded snapshot '${result.filename}' to Google Drive!`);
        fetchSnapshots(true);
        fetchDriveBackups(token);
      }
    } catch (e: any) {
      console.error('Drive instant backup failed:', e);
      showToast(e.message || 'Failed to create cloud backup', 'error');
    } finally {
      setIsBackingUpAndUploading(false);
    }
  };

  // Restore directly from a Google Drive backup file
  const handleRestoreFromDrive = (file: GoogleDriveBackupFile) => {
    triggerConfirm(
      'Restore from Google Drive',
      `Restore system from Google Drive snapshot '${file.name}'? This will download the archive and replace current database records.`,
      async () => {
        let token = driveToken || await getAccessToken();
        if (!token) {
          showToast('Google Drive authentication session expired. Please re-connect.', 'error');
          return;
        }

        setIsRestoring(true);
        setIsRebooting(true);
        setRebootMessage(`Downloading & extracting backup from Google Drive...`);

        try {
          const res = await googleDriveService.restoreFromDrive(token, file.id);
          if (res.success) {
            await runStateSyncAnimation(res.message || 'System restored successfully from Google Drive!');
          }
        } catch (e: any) {
          setIsRestoring(false);
          setIsRebooting(false);
          showToast(e.message || 'Google Drive restore failed', 'error');
        }
      }
    );
  };

  // Delete a backup from Google Drive
  const handleDeleteFromDrive = (file: GoogleDriveBackupFile) => {
    triggerConfirm(
      'Delete from Google Drive',
      `Permanently remove backup file '${file.name}' from your Google Drive?`,
      async () => {
        let token = driveToken || await getAccessToken();
        if (!token) return;

        try {
          await googleDriveService.deleteFromDrive(token, file.id);
          showToast(`Deleted '${file.name}' from Google Drive`);
          fetchDriveBackups(token);
        } catch (e: any) {
          showToast(e.message || 'Failed to delete file from Google Drive', 'error');
        }
      }
    );
  };

  // Check for auto-uploading newly created snapshots
  useEffect(() => {
    if (driveConfig.autoUploadEnabled && driveToken && snapshots.length > 0) {
      const unSynced = snapshots.filter(s => !driveConfig.syncedSnapshotNames?.includes(s.filename));
      if (unSynced.length > 0 && !isUploadingToDrive && !uploadingFilename) {
        // Auto sync newest unsynced
        const target = unSynced[0];
        handleUploadSnapshotToDrive(target.filename);
      }
    }
  }, [snapshots, driveConfig.autoUploadEnabled, driveToken]);

  const fetchSchedule = async () => {
    try {
      const res = await fetch('/api/admin/backup/schedule');
      if (res.ok) {
        const data = await res.json();
        const hrs = data.intervalHours || 0;
        setIntervalHours(hrs);
        setLastBackupTime(data.lastBackupTime || '');
        setExcludeMedia(data.excludeMedia || false);

        // Check if current hours matches a preset (0, 1, 6, 12, 24, 48, 168)
        const presets = [0, 1, 6, 12, 24, 48, 168];
        if (!presets.includes(hrs) && hrs > 0) {
          setIsCustomMode(true);
          if (hrs < 1) {
            setCustomValue(Math.round(hrs * 60));
            setCustomUnit('minutes');
          } else if (hrs % 24 === 0 && hrs >= 24) {
            setCustomValue(hrs / 24);
            setCustomUnit('days');
          } else {
            setCustomValue(hrs);
            setCustomUnit('hours');
          }
        }
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
        showToast('Backup schedule updated successfully!');
        fetchSnapshots(true);
      } else {
        throw new Error('Failed to update schedule');
      }
    } catch (e: any) {
      showToast(e.message || 'Error updating backup settings', 'error');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const applyCustomTimer = () => {
    let hours = customValue;
    if (customUnit === 'minutes') {
      hours = customValue / 60;
    } else if (customUnit === 'days') {
      hours = customValue * 24;
    }
    if (hours <= 0) {
      showToast('Please enter a positive duration', 'error');
      return;
    }
    handleSaveScheduleSettings(hours, excludeMedia);
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
        }
      }
    } catch (e) {
      console.error('Failed to load snapshots:', e);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

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
        ? 'Full system backup (.zip archive) exported!' 
        : 'Database backup (.json) exported!');
      fetchSnapshots(true);
    } catch (e: any) {
      showToast(e.message || 'Failed to generate export package', 'error');
    } finally {
      setIsExporting(false);
    }
  };

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

  const executeRestore = async (backupPayload?: any) => {
    const payload = backupPayload || parsedBackup;
    if (!selectedFile && !payload) return;

    setIsRestoring(true);
    setIsRebooting(true);
    setRebootMessage('Verifying schema integrity & restoring data...');

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
      const successMsg = resData.message || 'Backup restored successfully!';
      await runStateSyncAnimation(successMsg);

    } catch (e: any) {
      setIsRestoring(false);
      setIsRebooting(false);
      showToast(e.message || 'Failed to apply restore backup', 'error');
    }
  };

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
          fetchSnapshots(true);
          showToast(successMsg, 'success');
          resolve();
        }
      }, 350);
    });
  };

  const handleRestoreSnapshot = (filename: string) => {
    triggerConfirm(
      'Restore From Snapshot',
      `Restore system state from snapshot '${filename}'? This will replace current records.`,
      async () => {
        setIsRestoring(true);
        setIsRebooting(true);
        setRebootMessage(`Loading snapshot '${filename}'...`);

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

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSnapshot(true);
    try {
      const res = await fetch('/api/admin/backup/create-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: snapshotLabel || 'Manual Snapshot' })
      });

      if (!res.ok) throw new Error('Failed to create snapshot');

      const data = await res.json();
      showToast('Snapshot created successfully!');
      setSnapshotLabel('');
      fetchSnapshots(true);

      // Auto upload to Google Drive if connected and active
      if (driveConfig.autoUploadEnabled && driveToken && data.filename) {
        handleUploadSnapshotToDrive(data.filename);
      }
    } catch (e: any) {
      showToast(e.message || 'Error creating snapshot', 'error');
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const handleDeleteSnapshot = (filename: string) => {
    triggerConfirm(
      'Delete Snapshot',
      `Permanently delete snapshot '${filename}'?`,
      async () => {
        try {
          const res = await fetch(`/api/admin/backup/snapshots/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            showToast('Snapshot deleted');
            fetchSnapshots(true);
          }
        } catch (e: any) {
          showToast('Failed to delete snapshot', 'error');
        }
      }
    );
  };

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

      await runStateSyncAnimation('Factory reset completed! Baseline state restored.');

    } catch (e: any) {
      setIsRestoring(false);
      setIsRebooting(false);
      showToast(e.message || 'Factory reset error', 'error');
    }
  };

  const formatIntervalLabel = (hrs: number) => {
    if (hrs <= 0) return 'Disabled';
    if (hrs < 1) {
      const mins = Math.round(hrs * 60);
      return `Every ${mins} min${mins > 1 ? 's' : ''}`;
    }
    if (hrs >= 24 && hrs % 24 === 0) {
      const days = hrs / 24;
      return `Every ${days} day${days > 1 ? 's' : ''}`;
    }
    return `Every ${hrs} hour${hrs > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto">
      
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed bottom-6 right-6 z-[999] px-4 py-2.5 rounded-xl shadow-2xl font-medium text-xs flex items-center gap-2 animate-fade-in ${
            toast.type === 'success' 
              ? 'bg-emerald-500 text-neutral-950' 
              : 'bg-rose-600 text-white'
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
            className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin mb-4" />
            <div className="max-w-sm space-y-3">
              <h3 className="text-lg font-semibold text-white">Restoring System State</h3>
              <p className="text-xs text-neutral-400 font-mono bg-neutral-900/90 px-4 py-2.5 rounded-lg">
                {rebootMessage}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsRebooting(false);
                  setIsRestoring(false);
                  onRefreshData();
                }}
                className="text-[11px] text-neutral-500 hover:text-neutral-300 pt-2 cursor-pointer transition-colors"
              >
                Dismiss overlay
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HEADER & MANUAL EXPORTS */}
      <div className="bg-[#0C0F1E] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white font-serif">Backup & Restore</h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md font-semibold">
              SQLite Active
            </span>
            {driveUser && (
              <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1">
                <Cloud className="w-3 h-3" /> Drive Connected
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Export system data, manage Google Drive cloud auto-sync, and restore point-in-time snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleExportBackup('zip')}
            disabled={isExporting}
            className="px-4 py-2.5 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer hover:opacity-95 active:scale-[0.98] flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Archive className={`w-3.5 h-3.5 ${isExporting ? 'animate-spin' : ''}`} />
            <span>{isExporting ? 'Exporting...' : 'Export Backup (.zip)'}</span>
          </button>

          <button
            onClick={() => handleExportBackup('json')}
            disabled={isExporting}
            className="px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-medium text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Export JSON records without media"
          >
            <FileJson className="w-3.5 h-3.5 text-sky-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* 2. GOOGLE DRIVE AUTOMATED CLOUD BACKUP PANEL */}
      <div className="bg-[#0C0F1E] rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Google Drive Automated Cloud Backups</h3>
                {driveUser ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 font-mono px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Auto-Sync {driveConfig.autoUploadEnabled ? 'On' : 'Ready'}
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-400 bg-neutral-900 font-mono px-2 py-0.5 rounded font-medium">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Automatically save snapshot archives directly into your private Google Drive folder for safe off-site disaster recovery.
              </p>
            </div>
          </div>

          {/* Connect or Disconnect CTA */}
          <div>
            {!driveUser ? (
              <button
                type="button"
                onClick={handleConnectGoogleDrive}
                disabled={isSigningInGoogle}
                className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs rounded-xl transition-all cursor-pointer shadow flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningInGoogle ? 'Connecting...' : 'Connect Google Drive'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBackupAndUploadToDrive}
                  disabled={isBackingUpAndUploading}
                  className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  title="Create a fresh snapshot and upload to Google Drive immediately"
                >
                  <CloudUpload className={`w-3.5 h-3.5 ${isBackingUpAndUploading ? 'animate-bounce' : ''}`} />
                  <span>{isBackingUpAndUploading ? 'Uploading...' : 'Backup & Upload Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDisconnectGoogleDrive}
                  className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 rounded-xl transition-colors cursor-pointer"
                  title="Disconnect Google Drive"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Connected account & Auto-upload toggles */}
        {driveUser ? (
          <div className="space-y-3 pt-2">
            <div className="bg-neutral-950 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                {driveUser.photoURL ? (
                  <img 
                    src={driveUser.photoURL} 
                    alt="User avatar" 
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-neutral-800 object-cover" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-white">
                    {driveUser.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span>{driveUser.displayName || driveUser.email}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">({driveUser.email})</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                    <span>Folder: <strong>{driveConfig.folderName || 'Grenada CARICOM Festival Backups 2027'}</strong></span>
                    {driveConfig.folderWebViewLink && (
                      <a
                        href={driveConfig.folderWebViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-0.5 hover:underline"
                      >
                        <span>Open in Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Toggle switch for auto upload */}
              <div className="flex items-center gap-3 self-end md:self-center">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <span className="text-xs text-neutral-300 font-medium">Auto-upload backups to Drive:</span>
                  <div 
                    onClick={() => handleToggleAutoUpload(!driveConfig.autoUploadEnabled)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      driveConfig.autoUploadEnabled ? 'bg-sky-500' : 'bg-neutral-800'
                    }`}
                  >
                    <div 
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        driveConfig.autoUploadEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Google Drive cloud snapshots list */}
            <div className="pt-2">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-sky-400" />
                  <span>Google Drive Cloud Backups ({driveBackups.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => fetchDriveBackups()}
                  disabled={isLoadingDriveBackups}
                  className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingDriveBackups ? 'animate-spin' : ''}`} />
                  <span>Refresh Cloud List</span>
                </button>
              </div>

              {isLoadingDriveBackups ? (
                <div className="text-center py-5 text-neutral-500 text-xs font-mono flex items-center justify-center gap-2 bg-neutral-950/60 rounded-xl">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking Google Drive folder...
                </div>
              ) : driveBackups.length === 0 ? (
                <div className="text-center py-6 text-neutral-500 text-xs bg-neutral-950/60 rounded-xl">
                  <p>No backups uploaded to Google Drive yet.</p>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Click "Backup & Upload Now" above or upload an existing snapshot below.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-neutral-950/70 rounded-xl p-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-neutral-500 text-[10px] font-semibold uppercase tracking-wider">
                        <th className="py-2 px-3">Google Drive Backup File</th>
                        <th className="py-2 px-3">Size</th>
                        <th className="py-2 px-3">Uploaded At</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {driveBackups.map((f) => (
                        <tr key={f.id} className="hover:bg-neutral-900/40 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                            <Archive className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="truncate max-w-[280px] font-sans text-xs">{f.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-neutral-400">{f.sizeFormatted || 'Unknown'}</td>
                          <td className="py-2.5 px-3 text-neutral-400 font-sans text-[11px]">
                            {new Date(f.createdTime).toLocaleDateString()} {new Date(f.createdTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {f.webViewLink && (
                                <a
                                  href={f.webViewLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                                  title="View inside Google Drive"
                                >
                                  <ExternalLink className="w-3 h-3 text-sky-400" />
                                  <span>View</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRestoreFromDrive(f)}
                                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors flex items-center gap-1"
                                title="Download and restore this Google Drive backup to the festival database"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFromDrive(f)}
                                className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md cursor-pointer transition-colors"
                                title="Delete from Google Drive"
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
          </div>
        ) : (
          <div className="space-y-3">
            {authDomainError && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 text-xs space-y-2.5 text-amber-200">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-amber-300">Firebase Auth: Domain Authorization Required</span>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      Firebase blocked the Google OAuth popup because this Cloud Run domain has not been added to your Firebase Authorized Domains list yet.
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-950/90 border border-neutral-800 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px]">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-neutral-500 shrink-0">Domain to add:</span>
                    <span className="text-amber-300 font-bold truncate">{authDomainError || window.location.hostname}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const domain = authDomainError || window.location.hostname;
                      navigator.clipboard.writeText(domain);
                      setHasCopiedDomain(true);
                      setTimeout(() => setHasCopiedDomain(false), 3000);
                    }}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer flex items-center gap-1 self-start sm:self-center"
                  >
                    {hasCopiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                    <span>{hasCopiedDomain ? 'Copied!' : 'Copy Domain'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-neutral-400 bg-neutral-950/60 rounded-lg p-2.5 space-y-1.5">
                  <p className="font-semibold text-neutral-300">Quick fix in Firebase Console:</p>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                    <li>
                      Go directly to{' '}
                      <a
                        href="https://console.firebase.google.com/project/gen-lang-client-0460038713/authentication/settings"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 underline hover:text-sky-300 inline-flex items-center gap-1 font-semibold"
                      >
                        Firebase Auth Settings <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    </li>
                    <li>Scroll down to the <strong>Authorized domains</strong> list.</li>
                    <li>Click <strong>Add domain</strong> and add:
                      <div className="mt-1 pl-4 space-y-1 font-mono text-[10px] text-amber-300">
                        <div>• <code className="bg-neutral-900 px-1 py-0.5 rounded">caricomfestival.co.uk</code></div>
                        <div>• <code className="bg-neutral-900 px-1 py-0.5 rounded">www.caricomfestival.co.uk</code></div>
                        <div>• <code className="bg-neutral-900 px-1 py-0.5 rounded">run.app</code> <span className="text-neutral-500 font-sans text-[9px]">(for Cloud Run previews)</span></div>
                      </div>
                    </li>
                    <li>Click <strong>Save</strong> and wait ~10 seconds for Firebase to propagate the changes.</li>
                  </ol>
                </div>
              </div>
            )}

            <div className="bg-neutral-950/70 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-neutral-400">
              <div className="space-y-1">
                <p className="font-semibold text-neutral-200">How Google Drive Auto-Upload works:</p>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Connect your account once, and every automated schedule or manual backup will be silently and securely uploaded to a private folder in your Google Drive.
                </p>
              </div>
              <button
                type="button"
                onClick={handleConnectGoogleDrive}
                disabled={isSigningInGoogle}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-xs rounded-xl cursor-pointer shrink-0 transition-transform active:scale-95 shadow-sm disabled:opacity-50"
              >
                {isSigningInGoogle ? 'Connecting...' : authDomainError ? 'Try Connecting Again' : 'Connect Now'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. AUTOMATED BACKUP SCHEDULE (WITH CUSTOM TIMER) */}
      <div className="bg-[#0C0F1E] rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Automated Snapshot Schedule</h3>
              <p className="text-xs text-neutral-400">Set scheduled background snapshots or configure a custom timer.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md ${
              intervalHours > 0 
                ? 'text-emerald-400 bg-emerald-500/10' 
                : 'text-neutral-500 bg-neutral-900'
            }`}>
              {formatIntervalLabel(intervalHours)}
            </span>
          </div>
        </div>

        {/* Schedule Selector & Custom Timer Control */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4">
            <label className="text-[11px] text-neutral-400 block mb-1.5">Preset Interval:</label>
            <select
              value={isCustomMode ? 'custom' : intervalHours}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                  setIsCustomMode(true);
                } else {
                  setIsCustomMode(false);
                  handleSaveScheduleSettings(parseFloat(val), excludeMedia);
                }
              }}
              disabled={isSavingSchedule}
              className="w-full bg-neutral-950 text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="0">Disabled (Manual Only)</option>
              <option value="1">Every 1 Hour</option>
              <option value="6">Every 6 Hours</option>
              <option value="12">Every 12 Hours</option>
              <option value="24">Every 24 Hours (Daily)</option>
              <option value="48">Every 2 Days</option>
              <option value="168">Every 7 Days (Weekly)</option>
              <option value="custom">⏱️ Custom Timer...</option>
            </select>
          </div>

          {/* Custom Timer Input Area */}
          {isCustomMode && (
            <div className="md:col-span-8 bg-neutral-950/90 p-3.5 rounded-xl flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                <Sliders className="w-3.5 h-3.5 text-amber-400" /> Custom:
              </span>
              <input
                type="number"
                min="1"
                max="999"
                value={customValue}
                onChange={(e) => setCustomValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-neutral-900 text-xs text-white rounded-lg px-2.5 py-2 text-center font-mono focus:outline-none"
              />
              <select
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value as 'minutes' | 'hours' | 'days')}
                className="bg-neutral-900 text-xs text-white rounded-lg px-2.5 py-2 focus:outline-none cursor-pointer"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
              <button
                type="button"
                disabled={isSavingSchedule}
                onClick={applyCustomTimer}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                {isSavingSchedule ? 'Saving...' : 'Apply Schedule'}
              </button>
            </div>
          )}
        </div>

        {/* Lightweight meta strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-neutral-400 font-mono">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={excludeMedia}
              onChange={(e) => {
                const val = e.target.checked;
                setExcludeMedia(val);
                handleSaveScheduleSettings(intervalHours, val);
              }}
              disabled={isSavingSchedule}
              className="rounded bg-neutral-950 text-amber-500 accent-amber-500 cursor-pointer"
            />
            <span className="text-neutral-300">Exclude media files in auto-snapshots (database only)</span>
          </label>

          {lastBackupTime && (
            <span className="text-neutral-500">
              Last snapshot: {new Date(lastBackupTime).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* 4. LOCAL SNAPSHOTS & RECOVERY POINTS */}
      <div className="bg-[#0C0F1E] rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Local System Snapshots ({snapshots.length})</h3>
              <p className="text-xs text-neutral-400">Restore, download, or sync point-in-time snapshots to Google Drive.</p>
            </div>
          </div>

          <form onSubmit={handleCreateSnapshot} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Snapshot label..."
              value={snapshotLabel}
              onChange={(e) => setSnapshotLabel(e.target.value)}
              className="bg-neutral-950 text-xs text-white rounded-xl px-3.5 py-2 focus:outline-none w-36"
            />
            <button
              type="submit"
              disabled={isCreatingSnapshot}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1 shrink-0 transition-transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isCreatingSnapshot ? 'Saving...' : 'New Snapshot'}</span>
            </button>
          </form>
        </div>

        {/* Snapshots Table */}
        {isLoadingSnapshots ? (
          <div className="text-center py-6 text-neutral-500 text-xs font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading snapshots...
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-6 text-neutral-500 text-xs italic">
            No snapshots created yet. Create a snapshot above or wait for the automatic scheduler.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-neutral-500 text-[10px] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">File / Label</th>
                  <th className="py-2.5 px-3">Records</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {snapshots.map((snap) => {
                  const isSyncedToDrive = driveConfig.syncedSnapshotNames?.includes(snap.filename);
                  const isCurrentlyUploading = uploadingFilename === snap.filename && isUploadingToDrive;

                  return (
                    <tr key={snap.filename} className="hover:bg-neutral-900/40 transition-colors rounded-xl">
                      <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                        <Archive className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[220px] font-sans text-xs">{snap.filename}</span>
                            {isSyncedToDrive && (
                              <span className="text-[9px] text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded font-sans flex items-center gap-0.5">
                                <Cloud className="w-2.5 h-2.5" /> Synced
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-500">{snap.systemTag}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-300">
                        {snap.recordCount ? `${snap.recordCount} rows` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-400">{snap.sizeFormatted}</td>
                      <td className="py-2.5 px-3 text-neutral-400 font-sans text-[11px]">
                        {new Date(snap.createdTime).toLocaleDateString()} {new Date(snap.createdTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Sync to Google Drive button */}
                          {driveUser && (
                            <button
                              type="button"
                              onClick={() => handleUploadSnapshotToDrive(snap.filename)}
                              disabled={isCurrentlyUploading || isUploadingToDrive}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                                isSyncedToDrive 
                                  ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' 
                                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                              }`}
                              title={isSyncedToDrive ? 'Upload snapshot again to Google Drive' : 'Upload snapshot to Google Drive'}
                            >
                              <CloudUpload className={`w-3 h-3 ${isCurrentlyUploading ? 'animate-bounce text-sky-400' : 'text-sky-400'}`} />
                              <span>{isCurrentlyUploading ? 'Uploading...' : isSyncedToDrive ? 'Re-Sync' : 'To Drive'}</span>
                            </button>
                          )}

                          {/* Direct Download button */}
                          <a
                            href={`/api/admin/backup/snapshots/download/${encodeURIComponent(snap.filename)}`}
                            download={snap.filename}
                            className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-sky-400 rounded-lg text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1"
                            title="Download snapshot archive to your computer"
                          >
                            <Download className="w-3 h-3 text-sky-400" />
                            <span>Download</span>
                          </a>

                          {/* Restore button */}
                          <button
                            onClick={() => handleRestoreSnapshot(snap.filename)}
                            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1"
                            title="Restore database from this snapshot"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteSnapshot(snap.filename)}
                            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md cursor-pointer transition-colors"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. RESTORE UPLOAD & DROPZONE */}
      <div className="bg-[#0C0F1E] rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex items-center gap-2.5 pb-2">
          <Upload className="w-4 h-4 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Restore from Upload</h3>
            <p className="text-xs text-neutral-400">Upload a `.zip` full backup or `.json` dataset to restore.</p>
          </div>
        </div>

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
          className={`rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
            dragOver 
              ? 'bg-amber-500/10 scale-[1.01]' 
              : 'bg-neutral-950/70 hover:bg-neutral-950'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept=".zip,.json"
            className="hidden"
          />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-white">
              {selectedFile ? selectedFile.name : 'Click to browse or drop a .zip / .json backup file here'}
            </p>
            <p className="text-[11px] text-neutral-500">
              Supports full ZIP packages (database + media binaries) or JSON exports
            </p>
          </div>
        </div>

        {parseError && (
          <div className="bg-rose-500/10 p-3 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Parsed confirmation banner */}
        {parsedBackup && (
          <div className="bg-neutral-950 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
              <FileCheck className="w-4 h-4" />
              <span>Ready to restore: {selectedFile?.name || 'Uploaded Backup'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setSelectedFile(null); setParsedBackup(null); }}
                className="px-3.5 py-2 bg-neutral-900 text-neutral-400 text-xs font-medium rounded-xl hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeRestore(parsedBackup)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Apply Restore</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. FACTORY RESET */}
      <div className="bg-rose-950/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-rose-300">Factory Reset Database</h4>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Permanently wipe all tables and reset the database to initial festival seed data.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFactoryResetModal(true)}
          className="px-3.5 py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors shrink-0"
        >
          Factory Reset...
        </button>
      </div>

      {/* Factory Reset Modal */}
      {showFactoryResetModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0C0F1E] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Confirm Factory Reset</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  This action is irreversible. All current submissions, event modifications, and uploaded media references will be reset to factory defaults.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[11px] text-neutral-400 block font-mono">
                Type <strong>RESET</strong> to authorize:
              </label>
              <input
                type="text"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                placeholder="RESET"
                className="w-full bg-neutral-950 text-xs text-white rounded-xl px-3.5 py-2.5 font-mono focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowFactoryResetModal(false); setResetConfirmInput(''); }}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetConfirmInput.trim() !== 'RESET'}
                onClick={handleExecuteFactoryReset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Execute Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
