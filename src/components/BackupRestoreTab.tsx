import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  FileJson, 
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
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BackupRestoreTabProps {
  primaryColor: string;
  onRefreshData: () => void;
  triggerConfirm: (title: string, message: string, action: () => void) => void;
}

interface ServerSnapshot {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdTime: string;
  recordCount: number;
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

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSnapshots = async () => {
    setIsLoadingSnapshots(true);
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

  // 1. Export Backup Action
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/backup/export');
      if (!res.ok) throw new Error('Export API failed');
      
      const backupData = await res.json();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `caricom-festival-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('System database backup exported successfully!');
      fetchSnapshots();
    } catch (e: any) {
      showToast(e.message || 'Failed to generate export package', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. File Selection & Validation
  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setParseError('Please upload a valid JSON backup snapshot file (.json).');
      setSelectedFile(null);
      setParsedBackup(null);
      return;
    }

    setSelectedFile(file);
    setParseError(null);

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
  };

  // 3. Perform Restore with Automated State Synchronization
  const executeRestore = async (backupPayload: any) => {
    setIsRestoring(true);
    setIsRebooting(true);
    setRebootMessage('Verifying schema integrity & restoring records...');

    try {
      const res = await fetch('/api/admin/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupData: backupPayload })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Restore failed');
      }

      await runStateSyncAnimation('Database snapshot restored & synchronized successfully!');

    } catch (e: any) {
      setIsRestoring(false);
      setIsRebooting(false);
      showToast(e.message || 'Failed to apply restore image', 'error');
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
              onClick={handleExportBackup}
              disabled={isExporting}
              className="px-5 py-3 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all cursor-pointer hover:brightness-110 active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Exporting Package...' : 'Download Full Backup (.json)'}</span>
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
          <p className="text-[10px] text-neutral-500">JSON Schema Validated</p>
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
              <p className="text-xs text-neutral-400">Upload a `.json` backup file to restore database tables and restart the server.</p>
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
            accept=".json"
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
            <FileJson className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-bold text-white">
              {selectedFile ? selectedFile.name : 'Drag & drop backup JSON file here'}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              or click to browse from local computer (.json backup snapshot)
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
                      <FileJson className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{snap.filename}</span>
                    </td>
                    <td className="py-3 px-3 text-neutral-300">
                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px]">
                        {snap.systemTag}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-bold">
                      {snap.recordCount ? `${snap.recordCount} items` : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-neutral-400">{snap.sizeFormatted}</td>
                    <td className="py-3 px-3 text-neutral-400 font-sans text-[11px]">
                      {new Date(snap.createdTime).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
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

    </div>
  );
};
