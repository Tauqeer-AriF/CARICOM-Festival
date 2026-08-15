import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck,
  RefreshCw,
  Info,
  Filter,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { motion } from 'motion/react';
import { FormSubmissionItem } from '../types';
import { 
  parseSubmissionsCSV, 
  importSubmissionsCSV, 
  downloadSampleCSV, 
  ParsedCsvResult 
} from '../services/submissionService';
import { 
  ALL_SUBMISSION_TYPE_TAGS, 
  ALL_SUBMISSION_STATUS_TAGS,
  SubmissionTypeBadge, 
  SubmissionStatusBadge 
} from '../utils/submissionTags';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
  defaultType?: FormSubmissionItem['type'];
  primaryColor: string;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultType,
  primaryColor
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<ParsedCsvResult | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [targetTypeMode, setTargetTypeMode] = useState<string>(defaultType || 'auto');
  const [mergeStrategy, setMergeStrategy] = useState<'append' | 'upsert'>('append');
  const [previewFilter, setPreviewFilter] = useState<string>('all');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Please select a valid .csv spreadsheet file.');
      setSelectedFile(null);
      setParsedResult(null);
      setCsvRawText('');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setCsvRawText(text);
      
      const typeArg = targetTypeMode === 'auto' ? undefined : (targetTypeMode as FormSubmissionItem['type']);
      const result = parseSubmissionsCSV(text, typeArg);
      setParsedResult(result);
    };
    reader.readAsText(file);
  };

  const handleTypeModeChange = (newMode: string) => {
    setTargetTypeMode(newMode);
    if (csvRawText) {
      const typeArg = newMode === 'auto' ? undefined : (newMode as FormSubmissionItem['type']);
      const result = parseSubmissionsCSV(csvRawText, typeArg);
      setParsedResult(result);
    }
  };

  const handleExecuteImport = async () => {
    if (!csvRawText || !parsedResult || parsedResult.validItems.length === 0) {
      setErrorMessage('No valid records found to import.');
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const typeArg = targetTypeMode === 'auto' ? undefined : (targetTypeMode as FormSubmissionItem['type']);
      const res = await importSubmissionsCSV(csvRawText, {
        defaultType: typeArg,
        mergeStrategy
      });

      if (res.success) {
        onSuccess(res.importedCount);
        handleResetAndClose();
      } else {
        setErrorMessage(res.errors.join(' | ') || 'Failed to import CSV records.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Import error occurred.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetAndClose = () => {
    setSelectedFile(null);
    setCsvRawText('');
    setParsedResult(null);
    setErrorMessage(null);
    setPreviewFilter('all');
    setTargetTypeMode(defaultType || 'auto');
    onClose();
  };

  // Filter items for preview
  const filteredPreviewItems = parsedResult ? parsedResult.validItems.filter(item => {
    if (previewFilter === 'all') return true;
    return item.type === previewFilter;
  }) : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-serif">
                  Import CSV Data & Synchronize Tags
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Full Parity
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Seamlessly import and normalize Pass Orders, Contact Inquiries, Flight Logs, Shuttles, and VIP Subscribers.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleResetAndClose} 
            className="text-neutral-400 hover:text-white p-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Error notification banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Import Notice</span>
                <span className="text-rose-300/90">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Quick template download helper */}
          <div className="bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Pre-Structured CSV Templates</span>
                <p className="text-[11px] text-neutral-400">
                  All export & import tags are fully synchronized. Download formatted templates matching your workflow:
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => downloadSampleCSV('all')}
                className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Unified CSV template containing samples of all 5 tag types"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>All 5 Tags Unified</span>
              </button>

              <button
                type="button"
                onClick={() => downloadSampleCSV('orders')}
                className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Pass Orders and Ticket Wristbands CSV template"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>Pass Orders (£)</span>
              </button>

              <button
                type="button"
                onClick={() => downloadSampleCSV('forms')}
                className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Contact inquiries, flights, and shuttle transfers CSV template"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Received Forms</span>
              </button>
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver 
                ? 'border-sky-500 bg-sky-500/10 scale-[0.99]' 
                : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/40 hover:bg-neutral-950/70'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".csv,text/csv" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-semibold text-white text-sm block">{selectedFile.name}</span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; {parsedResult?.validItems.length || 0} valid records detected
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="text-xs text-sky-400 hover:underline pt-1 cursor-pointer"
                >
                  Choose a different file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2 py-2">
                <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-semibold text-white text-sm block">Drag & drop your CSV file here</span>
                  <span className="text-xs text-neutral-400">or click to browse your local computer</span>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">Supports standard .csv with full automatic tag normalization</span>
              </div>
            )}
          </div>

          {/* Synchronized Tag Detection & Statistics Cards */}
          {parsedResult && parsedResult.validItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Synchronized Tag Distribution ({parsedResult.validItems.length} Total Records)</span>
                </span>
                {parsedResult.totalRevenueGBP > 0 && (
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Total Revenue: £{parsedResult.totalRevenueGBP.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(Object.keys(ALL_SUBMISSION_TYPE_TAGS) as FormSubmissionItem['type'][]).map(tagKey => {
                  const tagMeta = ALL_SUBMISSION_TYPE_TAGS[tagKey];
                  const Icon = tagMeta.icon;
                  const count = parsedResult.tagCounts[tagKey] || 0;
                  const isActive = previewFilter === tagKey;

                  return (
                    <button
                      key={tagKey}
                      type="button"
                      onClick={() => setPreviewFilter(isActive ? 'all' : tagKey)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isActive 
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm' 
                          : count > 0 
                            ? 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700' 
                            : 'border-neutral-900 bg-neutral-950/20 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-3.5 h-3.5 ${tagMeta.badgeText}`} />
                        <span className="font-mono text-xs font-bold text-white">{count}</span>
                      </div>
                      <div className="mt-1.5">
                        <span className="text-[11px] font-semibold text-neutral-200 block truncate">
                          {tagMeta.shortLabel}
                        </span>
                        <span className="text-[9px] text-neutral-500 block truncate">
                          {count > 0 ? `${Math.round((count / parsedResult.validItems.length) * 100)}% of total` : '0 detected'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Import Settings / Options */}
          {selectedFile && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl text-xs">
              <div>
                <label className="text-[11px] font-semibold text-neutral-300 block mb-1.5">
                  Tag Classification Rule:
                </label>
                <select
                  value={targetTypeMode}
                  onChange={(e) => handleTypeModeChange(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 cursor-pointer font-sans"
                >
                  <option value="auto">Auto-detect from CSV 'Type' / 'Category' columns (Recommended)</option>
                  <option value="pass-order">Force all as Pass Orders & Ticketing (£)</option>
                  <option value="contact">Force all as General Contact Requests</option>
                  <option value="flight-registration">Force all as Flight Registrations</option>
                  <option value="transport-request">Force all as Shuttle / Transport Requests</option>
                  <option value="newsletter">Force all as VIP Newsletter Subscribers</option>
                </select>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Auto-detect uses uniform alias matching to categorize rows identically.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-300 block mb-1.5">
                  Database Merge Strategy:
                </label>
                <select
                  value={mergeStrategy}
                  onChange={(e) => setMergeStrategy(e.target.value as 'append' | 'upsert')}
                  className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 cursor-pointer font-sans"
                >
                  <option value="append">Append as New Records (generate fresh unique IDs)</option>
                  <option value="upsert">Merge / Overwrite existing IDs (Synchronize duplicates)</option>
                </select>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Append preserves all current records while adding new entries safely.
                </p>
              </div>
            </div>
          )}

          {/* Parsed Data Preview Table */}
          {parsedResult && parsedResult.validItems.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-white">
                    Preview Data ({filteredPreviewItems.length} {previewFilter !== 'all' ? `${ALL_SUBMISSION_TYPE_TAGS[previewFilter as FormSubmissionItem['type']]?.shortLabel} ` : ''}records)
                  </span>
                </div>
                {previewFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('all')}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Filter className="w-3 h-3" />
                    <span>Reset filter (Show all {parsedResult.validItems.length})</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-neutral-800 rounded-xl bg-neutral-950/60 max-h-56">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/90 text-neutral-400 text-[10px] uppercase font-mono font-semibold sticky top-0 backdrop-blur-xs">
                    <tr>
                      <th className="py-2.5 px-3">Type Tag</th>
                      <th className="py-2.5 px-3">Status Tag</th>
                      <th className="py-2.5 px-3">Guest Name</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Topic / Pass</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Extra Meta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {filteredPreviewItems.slice(0, 8).map((item, idx) => (
                      <tr key={idx} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="py-2 px-3">
                          <SubmissionTypeBadge type={item.type} size="sm" />
                        </td>
                        <td className="py-2 px-3">
                          <SubmissionStatusBadge status={item.status} size="sm" />
                        </td>
                        <td className="py-2 px-3 font-medium text-white max-w-[130px] truncate">{item.name}</td>
                        <td className="py-2 px-3 text-neutral-400 font-mono text-[11px] max-w-[150px] truncate">{item.email}</td>
                        <td className="py-2 px-3 text-neutral-300 text-[11px] max-w-[140px] truncate">{item.topicOrPass || '-'}</td>
                        <td className="py-2 px-3 font-mono text-emerald-400 text-[11px] font-semibold">
                          {item.amountGBP !== undefined && item.amountGBP > 0 ? `£${item.amountGBP.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-neutral-500 font-mono text-[10px] max-w-[120px] truncate">
                          {item.extraDetails ? JSON.stringify(item.extraDetails) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredPreviewItems.length > 8 && (
                <p className="text-[10px] text-neutral-500 text-right">
                  Showing first 8 of {filteredPreviewItems.length} matching rows
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedFile || !parsedResult || parsedResult.validItems.length === 0 || isImporting}
            onClick={handleExecuteImport}
            className="px-5 py-2.5 text-neutral-950 font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importing & Synchronizing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>
                  Import {parsedResult?.validItems.length ? `${parsedResult.validItems.length} Synchronized Records` : 'CSV'}
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
