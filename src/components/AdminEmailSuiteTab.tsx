import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, 
  Send, 
  Settings, 
  FileText, 
  Inbox, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  RefreshCw, 
  Eye, 
  EyeOff,
  Key,
  Zap,
  Trash2, 
  Copy, 
  ExternalLink, 
  Smartphone, 
  Monitor, 
  Sparkles, 
  Search, 
  Filter, 
  Download, 
  RotateCcw,
  ShieldCheck,
  Building,
  UserCheck,
  ArrowRight,
  Globe,
  Sliders,
  Check
} from 'lucide-react';
import { 
  EmailLog, 
  EmailSettings, 
  EmailTemplate, 
  EmailCategory, 
  FormSubmissionItem 
} from '../types';
import { 
  getEmailLogs, 
  saveEmailLogs, 
  deleteEmailLog, 
  clearEmailLogs,
  getEmailSettings, 
  saveEmailSettings, 
  DEFAULT_EMAIL_SETTINGS,
  getEmailTemplates, 
  saveEmailTemplates, 
  resetEmailTemplates,
  dispatchEmail,
  renderFestivalHtmlEmail
} from '../services/emailService';

interface AdminEmailSuiteTabProps {
  primaryColor?: string;
  submissions: FormSubmissionItem[];
  onToast: (msg: string) => void;
}

type SubTab = 'outbox' | 'compose' | 'templates' | 'settings';

export const AdminEmailSuiteTab: React.FC<AdminEmailSuiteTabProps> = ({
  primaryColor = '#F59E0B',
  submissions,
  onToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('outbox');
  const [logs, setLogs] = useState<EmailLog[]>(() => getEmailLogs());
  const [settings, setSettings] = useState<EmailSettings>(() => getEmailSettings());
  const [templates, setTemplates] = useState<EmailTemplate[]>(() => getEmailTemplates());

  // Filters for Outbox
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Preview Modal
  const [viewingLog, setViewingLog] = useState<EmailLog | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showRawHtml, setShowRawHtml] = useState(false);

  // Template Editing State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(templates[0] || null);

  // Compose State
  const [composeRecipientType, setComposeRecipientType] = useState<'individual' | 'pass-holders' | 'registered' | 'custom'>('individual');
  const [composeEmail, setComposeEmail] = useState('');
  const [composeName, setComposeName] = useState('');
  const [composeSubject, setComposeSubject] = useState('Important Programme Update — Grenada CARICOM Festival 2027');
  const [composeHeadline, setComposeHeadline] = useState('Official Festival Announcement');
  const [composeIntro, setComposeIntro] = useState('Dear Festival Delegate, please take note of this updated schedule and venue advisory.');
  const [composeBody, setComposeBody] = useState('We are delighted to confirm that all main festival stages at Grand Anse and Mellowland Village will open at 16:00 BST. VIP transport shuttles will operate continuously from official partner accommodation.');
  const [composeCtaLabel, setComposeCtaLabel] = useState('View Festival Programme');
  const [composeCtaUrl, setComposeCtaUrl] = useState('https://grenadacaricom2027.com');
  const [isSending, setIsSending] = useState(false);

  // Settings State & Testing
  const [testRecipient, setTestRecipient] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const toggleShowKey = (provider: string) => {
    setShowApiKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const getEngineModeLabel = (mode: string) => {
    switch (mode) {
      case 'resend':
        return 'Resend API (Live SaaS)';
      case 'sendgrid':
        return 'Twilio SendGrid API';
      case 'mailchimp':
        return 'Mailchimp Transactional (Mandrill)';
      case 'smtp':
        return 'Custom SMTP Gateway';
      default:
        return 'Resend API';
    }
  };

  const isEngineConfigured = useMemo(() => {
    if (settings.engineMode === 'resend') return Boolean(settings.resendApiKey && settings.resendApiKey.trim());
    if (settings.engineMode === 'sendgrid') return Boolean(settings.sendgridApiKey && settings.sendgridApiKey.trim());
    if (settings.engineMode === 'mailchimp') return Boolean(settings.mailchimpApiKey && settings.mailchimpApiKey.trim());
    if (settings.engineMode === 'smtp') return Boolean(settings.smtpUser && settings.smtpPassword);
    return false;
  }, [settings]);

  // Refresh logs from storage or events
  const refreshData = () => {
    setLogs(getEmailLogs());
    setSettings(getEmailSettings());
    setTemplates(getEmailTemplates());
  };

  useEffect(() => {
    const handleLogsUpdate = () => setLogs(getEmailLogs());
    const handleSettingsUpdate = () => setSettings(getEmailSettings());
    const handleTemplatesUpdate = () => setTemplates(getEmailTemplates());

    window.addEventListener('grenada_email_logs_updated', handleLogsUpdate);
    window.addEventListener('grenada_email_settings_updated', handleSettingsUpdate);
    window.addEventListener('grenada_email_templates_updated', handleTemplatesUpdate);

    return () => {
      window.removeEventListener('grenada_email_logs_updated', handleLogsUpdate);
      window.removeEventListener('grenada_email_settings_updated', handleSettingsUpdate);
      window.removeEventListener('grenada_email_templates_updated', handleTemplatesUpdate);
    };
  }, []);

  // Update editing template when selectedTemplateId changes
  useEffect(() => {
    const found = templates.find(t => t.id === selectedTemplateId);
    if (found) {
      setEditingTemplate({ ...found });
    }
  }, [selectedTemplateId, templates]);

  // Derived counts
  const stats = useMemo(() => {
    return {
      total: logs.length,
      orders: logs.filter(l => l.category === 'order_confirmation').length,
      registrations: logs.filter(l => l.category === 'welcome_registration').length,
      replies: logs.filter(l => l.category === 'enquiry_reply').length,
      broadcasts: logs.filter(l => l.category === 'broadcast_campaign').length
    };
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !search ||
        item.recipientEmail.toLowerCase().includes(search) ||
        (item.recipientName && item.recipientName.toLowerCase().includes(search)) ||
        item.subject.toLowerCase().includes(search) ||
        (item.referenceId && item.referenceId.toLowerCase().includes(search));
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [logs, selectedCategory, selectedStatus, searchTerm]);

  // Handlers
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailSettings(settings);
    onToast('Communications and mailbox configuration successfully saved.');
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    const updated = templates.map(t => t.id === editingTemplate.id ? { ...editingTemplate, updatedAt: new Date().toISOString() } : t);
    saveEmailTemplates(updated);
    setTemplates(updated);
    onToast(`Template "${editingTemplate.name}" updated successfully.`);
  };

  const handleResetTemplates = () => {
    if (window.confirm('Are you sure you wish to restore all email templates to the official British English defaults? Custom edits will be overwritten.')) {
      const def = resetEmailTemplates();
      setTemplates(def);
      if (def.length > 0) setEditingTemplate({ ...def[0] });
      onToast('Email templates restored to official festival defaults.');
    }
  };

  const handleDispatchCommuniqué = async () => {
    if (!composeSubject.trim() || !composeBody.trim()) {
      onToast('Please ensure the subject line and communiqué body are filled.');
      return;
    }

    setIsSending(true);
    try {
      let targetEmails: { email: string; name?: string }[] = [];

      if (composeRecipientType === 'individual') {
        if (!composeEmail.trim()) {
          onToast('Please provide a valid recipient email address.');
          setIsSending(false);
          return;
        }
        targetEmails.push({ email: composeEmail.trim(), name: composeName.trim() || 'Festival Patron' });
      } else if (composeRecipientType === 'pass-holders') {
        const passOrders = submissions.filter(s => s.type === 'pass-order' && s.email);
        targetEmails = passOrders.map(p => ({ email: p.email!, name: p.name || 'Pass Holder' }));
        if (targetEmails.length === 0) {
          targetEmails.push({ email: 'passes@grenadacaricom2027.com', name: 'Sample Pass Holder' });
        }
      } else if (composeRecipientType === 'registered') {
        const registered = submissions.filter(s => (s.type === 'flight-registration' || s.type === 'contact') && s.email);
        targetEmails = registered.map(r => ({ email: r.email!, name: r.name || 'Registered Delegate' }));
        if (targetEmails.length === 0) {
          targetEmails.push({ email: 'delegates@grenadacaricom2027.com', name: 'Sample Delegate' });
        }
      } else if (composeRecipientType === 'custom') {
        const split = composeEmail.split(',').map(s => s.trim()).filter(s => s.includes('@'));
        if (split.length === 0) {
          onToast('Please enter at least one valid recipient email address.');
          setIsSending(false);
          return;
        }
        targetEmails = split.map(e => ({ email: e, name: 'Festival Delegate' }));
      }

      // Dispatch to each target
      for (const target of targetEmails) {
        await dispatchEmail({
          recipientEmail: target.email,
          recipientName: target.name,
          subject: composeSubject,
          category: 'broadcast_campaign',
          headline: composeHeadline,
          introText: composeIntro,
          bodyText: composeBody,
          ctaLabel: composeCtaLabel,
          ctaUrl: composeCtaUrl,
          referenceId: `BCT-${Date.now().toString().slice(-6)}`,
          primaryColor
        });
      }

      onToast(`Communiqué successfully dispatched to ${targetEmails.length} recipient${targetEmails.length > 1 ? 's' : ''}.`);
      setActiveSubTab('outbox');
      setLogs(getEmailLogs());
    } catch (err: any) {
      onToast(`Dispatch failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleTestDispatch = async () => {
    if (!testRecipient.trim()) {
      onToast('Please enter an email address for testing.');
      return;
    }
    setIsTestingSmtp(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testRecipient: testRecipient.trim(),
          settings
        })
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Dispatch verification successful.' : 'Dispatch test encountered an error.')
      });
      if (data.success) {
        onToast('Test communiqué dispatched successfully!');
        setLogs(getEmailLogs());
      } else {
        onToast(`Notice: ${data.message}`);
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Connection test failed to reach server endpoint.'
      });
      onToast('Error running test dispatch.');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleResend = async (log: EmailLog) => {
    try {
      await dispatchEmail({
        recipientEmail: log.recipientEmail,
        recipientName: log.recipientName,
        subject: log.subject,
        category: log.category,
        bodyText: log.contentText || log.subject,
        referenceId: log.referenceId,
        metadata: log.metadata,
        primaryColor
      });
      onToast(`Re-dispatched copy to ${log.recipientEmail}.`);
      setLogs(getEmailLogs());
    } catch (e) {
      onToast('Could not re-dispatch email.');
    }
  };

  const handleDeleteLog = (id: string) => {
    deleteEmailLog(id);
    setLogs(getEmailLogs());
    onToast('Dispatched log entry removed.');
    if (viewingLog?.id === id) setViewingLog(null);
  };

  const handleClearAllLogs = () => {
    if (window.confirm('Are you sure you wish to clear all dispatched communication logs? This action cannot be undone.')) {
      clearEmailLogs();
      setLogs([]);
      onToast('Outbox logs cleared successfully.');
    }
  };

  const handleExportCsv = () => {
    if (logs.length === 0) {
      onToast('No email records available to export.');
      return;
    }
    const headers = ['Reference ID', 'Date & Time', 'Recipient Email', 'Recipient Name', 'Subject', 'Category', 'Delivery Status', 'Dispatched By'];
    const rows = logs.map(l => [
      `"${l.referenceId || l.id}"`,
      `"${new Date(l.dispatchedAt).toLocaleString('en-GB')}"`,
      `"${l.recipientEmail}"`,
      `"${l.recipientName || ''}"`,
      `"${l.subject.replace(/"/g, '""')}"`,
      `"${l.category}"`,
      `"${l.status}"`,
      `"${l.senderName}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Grenada_Festival_Email_Outbox_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Email outbox exported to CSV.');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800/80 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 relative z-10">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Mail className="w-3 h-3" /> Live Transactional Dispatch
              </span>
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" /> UK Standard English
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white tracking-tight">
              Communications &amp; Email Suite
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl font-light leading-relaxed">
              Production transactional email infrastructure. Dispatch branded pass confirmations, welcome dossiers, and concierge announcements directly via Resend, SendGrid, Mailchimp, or SMTP.
            </p>
          </div>

          {/* Quick Engine Indicator & Top Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full xl:w-auto shrink-0">
            <div className="px-3.5 py-2 bg-neutral-950/80 border border-neutral-800 rounded-xl flex items-center gap-3">
              <div className="relative shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${isEngineConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isEngineConfigured && (
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400/40 animate-ping" />
                )}
              </div>
              <div className="text-left min-w-0">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block truncate">
                  {isEngineConfigured ? 'Live Provider Connected' : 'Setup Required'}
                </span>
                <span className="text-xs font-semibold text-neutral-200 truncate block">
                  {getEngineModeLabel(settings.engineMode)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubTab('compose')}
              className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-neutral-950 cursor-pointer flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shrink-0 whitespace-nowrap"
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Dispatch Communiqué</span>
            </button>
          </div>
        </div>

        {/* Statistical Overview Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-neutral-800/60">
          <div className="bg-neutral-950/50 p-3 sm:p-3.5 rounded-xl border border-neutral-800/40">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1">Total Dispatched</span>
            <div className="text-lg sm:text-xl font-bold text-white font-mono">{stats.total}</div>
          </div>
          <div className="bg-neutral-950/50 p-3 sm:p-3.5 rounded-xl border border-neutral-800/40">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block mb-1">Pass Orders</span>
            <div className="text-lg sm:text-xl font-bold text-amber-300 font-mono">{stats.orders}</div>
          </div>
          <div className="bg-neutral-950/50 p-3 sm:p-3.5 rounded-xl border border-neutral-800/40">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block mb-1">Registrations</span>
            <div className="text-lg sm:text-xl font-bold text-emerald-300 font-mono">{stats.registrations}</div>
          </div>
          <div className="bg-neutral-950/50 p-3 sm:p-3.5 rounded-xl border border-neutral-800/40">
            <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block mb-1">Concierge Replies</span>
            <div className="text-lg sm:text-xl font-bold text-sky-300 font-mono">{stats.replies}</div>
          </div>
        </div>
      </div>

      {/* Main Sub-Navigation Bar */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 border-b border-neutral-800 pb-1.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('outbox')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeSubTab === 'outbox'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
            style={activeSubTab === 'outbox' ? { borderBottom: `2px solid ${primaryColor}` } : undefined}
          >
            <Inbox className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 
            <span>Outbox</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-neutral-900 text-neutral-300 border border-neutral-750">
              {logs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('compose')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeSubTab === 'compose'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
            style={activeSubTab === 'compose' ? { borderBottom: `2px solid ${primaryColor}` } : undefined}
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Compose</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('templates')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeSubTab === 'templates'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
            style={activeSubTab === 'templates' ? { borderBottom: `2px solid ${primaryColor}` } : undefined}
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Templates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('settings')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeSubTab === 'settings'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
            style={activeSubTab === 'settings' ? { borderBottom: `2px solid ${primaryColor}` } : undefined}
          >
            <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Setup &amp; Mailbox</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={refreshData}
            title="Refresh logs from SQLite"
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DISPATCHED OUTBOX & LOGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'outbox' && (
        <div className="space-y-4">
          {/* Controls & Filter Strip */}
          <div className="bg-neutral-900/80 border border-neutral-800/80 p-3.5 sm:p-4 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search recipient, subject, reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto flex-wrap">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-xs text-neutral-300 w-full focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-neutral-900">All Categories</option>
                    <option value="order_confirmation" className="bg-neutral-900">Pass Orders</option>
                    <option value="welcome_registration" className="bg-neutral-900">Registrations</option>
                    <option value="contact_acknowledgement" className="bg-neutral-900">Contact Inquiries</option>
                    <option value="transport_confirmation" className="bg-neutral-900">Transport Requests</option>
                    <option value="newsletter_welcome" className="bg-neutral-900">VIP Newsletter</option>
                    <option value="enquiry_reply" className="bg-neutral-900">Concierge Replies</option>
                    <option value="vendor_application" className="bg-neutral-900">Vendor Notices</option>
                    <option value="vip_invitation" className="bg-neutral-900">VIP Protocol</option>
                    <option value="broadcast_campaign" className="bg-neutral-900">Broadcasts</option>
                  </select>
                </div>

                <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-transparent text-xs text-neutral-300 w-full focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-neutral-900">All Statuses</option>
                    <option value="delivered" className="bg-neutral-900">Delivered (Live)</option>
                    <option value="dispatched" className="bg-neutral-900">Dispatched</option>
                    <option value="queued" className="bg-neutral-900">Queued</option>
                    <option value="failed" className="bg-neutral-900">Failed Delivery</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex-1 sm:flex-none px-3 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  title="Export Outbox to CSV"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" /> Export CSV
                </button>

                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllLogs}
                    className="flex-1 sm:flex-none px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    title="Clear all outbox logs"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" /> Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Outbox Table & Mobile Card View */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden">
            {filteredLogs.length === 0 ? (
              <div className="py-12 sm:py-16 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-neutral-800/60 flex items-center justify-center mx-auto mb-3 text-neutral-500">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-300">No Dispatched Communiqués Found</h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 leading-relaxed">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'No email records matched your current query or category filter.' 
                    : 'Your outbox is currently clear. New pass purchases and registrations will generate branded festival emails automatically.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('compose')}
                  className="mt-4 px-4 py-2 bg-amber-500 text-neutral-950 text-xs font-bold uppercase rounded-xl cursor-pointer hover:bg-amber-400 inline-flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" /> Compose New Communiqué
                </button>
              </div>
            ) : (
              <>
                {/* Mobile Cards View (Visible on screens < md) */}
                <div className="md:hidden divide-y divide-neutral-800/60">
                  {filteredLogs.map((log) => {
                    const dateObj = new Date(log.dispatchedAt);
                    const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                    const formattedTime = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                    const categoryBadge = {
                      order_confirmation: { label: 'Pass Order', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
                      welcome_registration: { label: 'Registration', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
                      contact_acknowledgement: { label: 'Contact Enquiry', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
                      transport_confirmation: { label: 'Transport Booking', color: 'bg-teal-500/10 text-teal-300 border-teal-500/30' },
                      newsletter_welcome: { label: 'VIP Newsletter', color: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30' },
                      enquiry_reply: { label: 'Concierge Reply', color: 'bg-sky-500/10 text-sky-300 border-sky-500/30' },
                      vendor_application: { label: 'Vendor Notice', color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
                      vip_invitation: { label: 'VIP Protocol', color: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
                      broadcast_campaign: { label: 'Broadcast', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' },
                      test_dispatch: { label: 'Test Dispatch', color: 'bg-neutral-800 text-neutral-300 border-neutral-700' },
                      system_alert: { label: 'System Notice', color: 'bg-neutral-800 text-neutral-400 border-neutral-700' }
                    }[log.category] || { label: log.category, color: 'bg-neutral-800 text-neutral-400 border-neutral-700' };

                    return (
                      <div key={log.id} className="p-4 space-y-3">
                        {/* Reference & Status */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-amber-400 text-xs block truncate">
                              {log.referenceId || log.id.slice(0, 12)}
                            </span>
                            <span className="text-[10px] text-neutral-500 block truncate">
                              {log.senderName}
                            </span>
                          </div>
                          <div>
                            {log.status === 'delivered' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Delivered
                              </span>
                            )}
                            {log.status === 'dispatched' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                <Send className="w-3 h-3" /> Dispatched
                              </span>
                            )}
                            {log.status === 'queued' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Clock className="w-3 h-3" /> Queued
                              </span>
                            )}
                            {log.status === 'failed' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <AlertTriangle className="w-3 h-3" /> Failed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Recipient Box */}
                        <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5">Recipient</div>
                          <div className="font-semibold text-white text-xs">{log.recipientName || 'Patron'}</div>
                          <div className="text-neutral-400 text-xs flex items-center justify-between gap-1 mt-0.5">
                            <span className="truncate text-[11px]">{log.recipientEmail}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(log.recipientEmail, log.id)}
                              className="text-neutral-400 hover:text-white p-1 shrink-0 cursor-pointer"
                              title="Copy Email Address"
                            >
                              {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Subject & Category */}
                        <div>
                          <div className="text-xs font-semibold text-neutral-200 leading-snug line-clamp-2">{log.subject}</div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${categoryBadge.color}`}>
                              {categoryBadge.label}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {formattedDate} • {formattedTime} BST
                            </span>
                          </div>
                        </div>

                        {/* Touch Actions Bar */}
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-800/50">
                          <button
                            type="button"
                            onClick={() => setViewingLog(log)}
                            className="py-2 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResend(log)}
                            className="py-2 px-2 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-sky-400" /> Resend
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log.id)}
                            className="py-2 px-2 bg-neutral-800 hover:bg-rose-500/20 hover:text-rose-400 text-neutral-400 text-xs font-semibold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop & Tablet Table View (Hidden on screens < md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-950/40 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4">Recipient</th>
                        <th className="py-3 px-4">Subject &amp; Category</th>
                        <th className="py-3 px-4">Dispatched Time</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50 text-xs text-neutral-300">
                      {filteredLogs.map((log) => {
                        const dateObj = new Date(log.dispatchedAt);
                        const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                        const formattedTime = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                        const categoryBadge = {
                          order_confirmation: { label: 'Pass Order', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
                          welcome_registration: { label: 'Registration', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
                          contact_acknowledgement: { label: 'Contact Enquiry', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
                          transport_confirmation: { label: 'Transport Booking', color: 'bg-teal-500/10 text-teal-300 border-teal-500/30' },
                          newsletter_welcome: { label: 'VIP Newsletter', color: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30' },
                          enquiry_reply: { label: 'Concierge Reply', color: 'bg-sky-500/10 text-sky-300 border-sky-500/30' },
                          vendor_application: { label: 'Vendor Notice', color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
                          vip_invitation: { label: 'VIP Protocol', color: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
                          broadcast_campaign: { label: 'Broadcast', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' },
                          test_dispatch: { label: 'Test Dispatch', color: 'bg-neutral-800 text-neutral-300 border-neutral-700' },
                          system_alert: { label: 'System Notice', color: 'bg-neutral-800 text-neutral-400 border-neutral-700' }
                        }[log.category] || { label: log.category, color: 'bg-neutral-800 text-neutral-400 border-neutral-700' };

                        return (
                          <tr key={log.id} className="hover:bg-neutral-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-amber-400 text-[11px] block">
                                {log.referenceId || log.id.slice(0, 12)}
                              </span>
                              <span className="text-[10px] text-neutral-500 block mt-0.5">
                                {log.senderName}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{log.recipientName || 'Patron'}</div>
                              <div className="text-neutral-400 text-[11px] flex items-center gap-1">
                                {log.recipientEmail}
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(log.recipientEmail, log.id)}
                                  className="text-neutral-500 hover:text-neutral-300 p-0.5"
                                  title="Copy Email Address"
                                >
                                  {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-medium text-neutral-200 truncate" title={log.subject}>
                                {log.subject}
                              </div>
                              <div className="mt-1">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${categoryBadge.color}`}>
                                  {categoryBadge.label}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-neutral-400">
                              <div>{formattedDate}</div>
                              <div className="text-[10px] text-neutral-500 font-mono">{formattedTime} BST</div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {log.status === 'delivered' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                                </span>
                              )}
                              {log.status === 'dispatched' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                  <Send className="w-3.5 h-3.5" /> Dispatched
                                </span>
                              )}
                              {log.status === 'queued' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <Clock className="w-3.5 h-3.5" /> Queued
                                </span>
                              )}
                              {log.status === 'failed' && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  title={log.errorDetails || 'Email delivery failed. Check credentials.'}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" /> Failed
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingLog(log)}
                                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg cursor-pointer transition-colors"
                                  title="View Rendered Email"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResend(log)}
                                  className="p-1.5 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 rounded-lg cursor-pointer transition-colors"
                                  title="Re-dispatch Copy"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLog(log.id)}
                                  className="p-1.5 bg-neutral-800 hover:bg-rose-500/20 hover:text-rose-400 text-neutral-400 rounded-lg cursor-pointer transition-colors"
                                  title="Delete Log Record"
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
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: NEW COMMUNIQUÉ / BROADCAST COMPOSER */}
      {/* ========================================================================= */}
      {activeSubTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Left Form: Composer Controls */}
          <div className="lg:col-span-6 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">Broadcaster Studio</span>
              <h2 className="text-lg sm:text-xl font-bold text-white font-serif">Compose Official Communiqué</h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Dispatch an announcement, schedule notice, or bespoke message directly to individual or grouped festival delegates.
              </p>
            </div>

            {/* Recipient Audience Selector */}
            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                Target Audience Group
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setComposeRecipientType('individual')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    composeRecipientType === 'individual'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-bold text-xs">Individual Delegate</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Send to specific recipient</div>
                </button>

                <button
                  type="button"
                  onClick={() => setComposeRecipientType('pass-holders')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    composeRecipientType === 'pass-holders'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-bold text-xs">All Pass Holders</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    {submissions.filter(s => s.type === 'pass-order').length} active pass orders
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setComposeRecipientType('registered')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    composeRecipientType === 'registered'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-bold text-xs">All Registered Delegates</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    {submissions.filter(s => s.type === 'flight-registration' || s.type === 'contact').length} registered delegates
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setComposeRecipientType('custom')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    composeRecipientType === 'custom'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-bold text-xs">Custom Distribution</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Comma-separated email list</div>
                </button>
              </div>
            </div>

            {/* Individual / Custom Recipient Inputs */}
            {(composeRecipientType === 'individual' || composeRecipientType === 'custom') && (
              <div className="space-y-3 bg-neutral-950/60 p-3.5 sm:p-4 rounded-xl border border-neutral-800/80">
                {composeRecipientType === 'individual' ? (
                  <>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Recipient Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Eleanor Vance"
                        value={composeName}
                        onChange={(e) => setComposeName(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Recipient Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. eleanor.vance@example.co.uk"
                        value={composeEmail}
                        onChange={(e) => setComposeEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                      Recipient Email Addresses (Separated by commas)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="patron1@example.com, patron2@outlook.co.uk"
                      value={composeEmail}
                      onChange={(e) => setComposeEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Subject Line */}
            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                Subject Line
              </label>
              <input
                type="text"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Headline & Intro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                  Email Headline
                </label>
                <input
                  type="text"
                  value={composeHeadline}
                  onChange={(e) => setComposeHeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                  Opening Salutation
                </label>
                <input
                  type="text"
                  value={composeIntro}
                  onChange={(e) => setComposeIntro(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Body Content */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Message Content (UK English)
                </label>
                <span className="text-[10px] text-neutral-500">Supports line breaks</span>
              </div>
              <textarea
                rows={4}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                className="w-full p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 leading-relaxed focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* CTA Button Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                  Action Button Label
                </label>
                <input
                  type="text"
                  value={composeCtaLabel}
                  onChange={(e) => setComposeCtaLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                  Action Destination URL
                </label>
                <input
                  type="text"
                  value={composeCtaUrl}
                  onChange={(e) => setComposeCtaUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Dispatch Action */}
            <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[11px] text-neutral-400 truncate">
                Dispatched via {getEngineModeLabel(settings.engineMode)}.
              </span>
              <button
                type="button"
                disabled={isSending}
                onClick={handleDispatchCommuniqué}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-neutral-950 cursor-pointer flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Dispatch Communiqué
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Preview: Real-Time Live HTML Render Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Template Preview</span>
                <span className="text-xs font-bold text-white">Live Branded Email Render</span>
              </div>
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg cursor-pointer ${previewDevice === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                  title="Desktop Preview"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg cursor-pointer ${previewDevice === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                  title="Mobile Preview"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Rendered Frame */}
            <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-2 sm:p-4 flex justify-center overflow-hidden min-h-[440px] sm:min-h-[560px]">
              <div
                className={`transition-all duration-300 w-full ${
                  previewDevice === 'mobile' ? 'max-w-xs sm:max-w-sm shadow-2xl border-2 sm:border-4 border-neutral-800 rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 bg-neutral-900' : 'max-w-xl'
                }`}
              >
                <iframe
                  title="Live Email Preview"
                  className="w-full h-[460px] sm:h-[580px] rounded-xl bg-transparent border-0"
                  srcDoc={renderFestivalHtmlEmail({
                    recipientName: composeName || 'Eleanor Vance',
                    recipientEmail: composeEmail || 'eleanor.vance@example.co.uk',
                    subject: composeSubject,
                    headline: composeHeadline,
                    introText: composeIntro,
                    bodyText: composeBody,
                    ctaLabel: composeCtaLabel,
                    ctaUrl: composeCtaUrl,
                    referenceId: 'BCT-2027-LIVE',
                    primaryColor
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: TEMPLATE STUDIO */}
      {/* ========================================================================= */}
      {activeSubTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Left Column: Template Selection List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Application Templates ({templates.length})
              </span>
              <button
                type="button"
                onClick={handleResetTemplates}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Restore Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedTemplateId === tpl.id
                      ? 'border-amber-500 bg-amber-500/10 shadow-md'
                      : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <h4 className="font-bold text-xs text-white truncate">{tpl.name}</h4>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase shrink-0">
                      {tpl.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                  <div className="mt-2 text-[10px] text-neutral-500 truncate">
                    Subject: <span className="text-neutral-300">{tpl.subject.slice(0, 45)}...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Template Editor & Live Preview */}
          <div className="lg:col-span-8 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
            {editingTemplate ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-0.5">
                      Template Customiser
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white">{editingTemplate.name}</h3>
                    <p className="text-xs text-neutral-400">{editingTemplate.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-md shrink-0"
                  >
                    <Check className="w-4 h-4" /> Save Template
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                        Header Title
                      </label>
                      <input
                        type="text"
                        value={editingTemplate.headline}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, headline: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                        Introduction Phrase
                      </label>
                      <input
                        type="text"
                        value={editingTemplate.introText}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, introText: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                      Body Copy (UK Grammar)
                    </label>
                    <textarea
                      rows={4}
                      value={editingTemplate.bodyText}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, bodyText: e.target.value })}
                      className="w-full p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 leading-relaxed focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={editingTemplate.ctaLabel || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, ctaLabel: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                        Button URL Destination
                      </label>
                      <input
                        type="text"
                        value={editingTemplate.ctaUrl || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, ctaUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                      Secretariat Legal &amp; Footer Note
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.footerNote}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, footerNote: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Live Preview of Selected Template */}
                <div className="pt-4 border-t border-neutral-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      Instant Render Preview
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const win = window.open('', '_blank');
                        if (win) {
                          win.document.write(renderFestivalHtmlEmail({
                            recipientName: 'Sarah Jenkins',
                            recipientEmail: 'sarah.j@outlook.com',
                            subject: editingTemplate.subject,
                            headline: editingTemplate.headline.replace('{name}', 'Sarah Jenkins'),
                            introText: editingTemplate.introText.replace('{name}', 'Sarah Jenkins'),
                            bodyText: editingTemplate.bodyText,
                            ctaLabel: editingTemplate.ctaLabel,
                            ctaUrl: editingTemplate.ctaUrl,
                            footerNote: editingTemplate.footerNote,
                            referenceId: 'GCF-2027-TPL',
                            primaryColor
                          }));
                        }
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Full-Page Preview
                    </button>
                  </div>

                  <div className="h-64 sm:h-72 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
                    <iframe
                      title="Template Preview"
                      className="w-full h-full border-0"
                      srcDoc={renderFestivalHtmlEmail({
                        recipientName: 'Sarah Jenkins',
                        recipientEmail: 'sarah.j@outlook.com',
                        subject: editingTemplate.subject,
                        headline: editingTemplate.headline.replace('{name}', 'Sarah Jenkins'),
                        introText: editingTemplate.introText.replace('{name}', 'Sarah Jenkins'),
                        bodyText: editingTemplate.bodyText,
                        ctaLabel: editingTemplate.ctaLabel,
                        ctaUrl: editingTemplate.ctaUrl,
                        footerNote: editingTemplate.footerNote,
                        referenceId: 'GCF-2027-TPL',
                        primaryColor
                      })}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-neutral-500">
                Select a template from the catalogue to begin customisation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: ZERO-FUSS SETUP & MAILBOX CONFIGURATION */}
      {/* ========================================================================= */}
      {activeSubTab === 'settings' && (
        <div className="space-y-5 sm:space-y-6">
          {/* Engine Mode Selection Cards */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6">
            <div className="max-w-2xl mb-5 sm:mb-6">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
                Dispatch Engine Provider
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white font-serif">Select Outgoing Mail Mechanism</h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Select your authenticated email delivery provider. All pass order confirmations, welcome dossiers, and concierge announcements are transmitted through your configured provider.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              {/* Option 1: Resend (Recommended) */}
              <div
                onClick={() => setSettings({ ...settings, engineMode: 'resend' })}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  settings.engineMode === 'resend'
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-800 text-neutral-200 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">Resend</h3>
                        <span className="text-[10px] text-amber-400 font-semibold block">Recommended SaaS</span>
                      </div>
                    </div>
                    {settings.engineMode === 'resend' && (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                    Connect your Resend account via REST API. Provides modern developer email infrastructure, high-speed worldwide delivery, and live analytics.
                  </p>
                </div>

                <div className="bg-neutral-950/80 rounded-xl p-3 border border-neutral-800/80 space-y-1.5 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> <span className="truncate">Uses Resend API Key (<code className="text-amber-400 font-mono">re_...</code>)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> <span>Real-time HTTP dispatch</span>
                  </div>
                </div>
              </div>

              {/* Option 2: Twilio SendGrid */}
              <div
                onClick={() => setSettings({ ...settings, engineMode: 'sendgrid' })}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  settings.engineMode === 'sendgrid'
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-800 text-neutral-200 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">Twilio SendGrid</h3>
                        <span className="text-[10px] text-amber-400 font-semibold block">Enterprise Cloud SaaS</span>
                      </div>
                    </div>
                    {settings.engineMode === 'sendgrid' && (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                    Enterprise cloud email deliverability platform. Ideal for large-scale festival broadcasts and transactional notifications via SendGrid v3 Mail API.
                  </p>
                </div>

                <div className="bg-neutral-950/80 rounded-xl p-3 border border-neutral-800/80 space-y-1.5 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> <span className="truncate">Uses SendGrid Key (<code className="text-amber-400 font-mono">SG....</code>)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> <span>Requires Single Sender</span>
                  </div>
                </div>
              </div>

              {/* Option 3: Mailchimp Transactional / Mandrill */}
              <div
                onClick={() => setSettings({ ...settings, engineMode: 'mailchimp' })}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  settings.engineMode === 'mailchimp'
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-800 text-neutral-200 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">Mailchimp</h3>
                        <span className="text-[10px] text-amber-400 font-semibold block">Transactional Mandrill</span>
                      </div>
                    </div>
                    {settings.engineMode === 'mailchimp' && (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                    Connect Mailchimp Transactional (Mandrill) to dispatch one-to-one passes and notices alongside your regular marketing lists.
                  </p>
                </div>

                <div className="bg-neutral-950/80 rounded-xl p-3 border border-neutral-800/80 space-y-1.5 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> <span>Uses Mandrill API Key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> <span>Transactional relay</span>
                  </div>
                </div>
              </div>

              {/* Option 4: Custom SMTP Gateway */}
              <div
                onClick={() => setSettings({ ...settings, engineMode: 'smtp' })}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  settings.engineMode === 'smtp'
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-800 text-neutral-200 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">Custom SMTP</h3>
                        <span className="text-[10px] text-neutral-400 font-semibold block">Mailbox Relay Hook</span>
                      </div>
                    </div>
                    {settings.engineMode === 'smtp' && (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                    Connect your organisation's real mailbox (e.g. Google Workspace, Gmail, Microsoft 365, or private UK domain SMTP server).
                  </p>
                </div>

                <div className="bg-neutral-950/80 rounded-xl p-3 border border-neutral-800/80 space-y-1.5 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> <span>Google &amp; Microsoft accounts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> <span>Port 587/465 TLS Relay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Settings */}
          <form onSubmit={handleSaveSettings} className="space-y-5 sm:space-y-6">

            {/* Mode 2 Details: Resend API Configuration */}
            {settings.engineMode === 'resend' && (
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Resend API Configuration</h3>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">Optional SaaS connection — enter your Resend account credentials.</p>
                  </div>
                  <a 
                    href="https://resend.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 shrink-0"
                  >
                    Resend Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                    Resend API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys['resend'] ? 'text' : 'password'}
                      value={settings.resendApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, resendApiKey: e.target.value })}
                      placeholder="e.g. re_123456789_abcdefg"
                      className="w-full pl-3 pr-10 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('resend')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                    >
                      {showApiKeys['resend'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                    Note: If you have not yet verified a custom domain on Resend, test communiqués will automatically use Resend's onboarding address (<code className="text-amber-400 font-mono">onboarding@resend.dev</code>).
                  </p>
                </div>
              </div>
            )}

            {/* Mode 3 Details: Twilio SendGrid Configuration */}
            {settings.engineMode === 'sendgrid' && (
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Twilio SendGrid API Configuration</h3>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">Optional SaaS connection — enter your SendGrid credentials.</p>
                  </div>
                  <a 
                    href="https://app.sendgrid.com/settings/api_keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 shrink-0"
                  >
                    SendGrid Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                    SendGrid API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys['sendgrid'] ? 'text' : 'password'}
                      value={settings.sendgridApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, sendgridApiKey: e.target.value })}
                      placeholder="e.g. SG.xxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyy"
                      className="w-full pl-3 pr-10 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('sendgrid')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                    >
                      {showApiKeys['sendgrid'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                    Ensure your "Official Outgoing Email Address" below matches an authenticated Single Sender or Domain in your Twilio SendGrid account.
                  </p>
                </div>
              </div>
            )}

            {/* Mode 4 Details: Mailchimp Mandrill Configuration */}
            {settings.engineMode === 'mailchimp' && (
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mailchimp Transactional (Mandrill) Configuration</h3>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">Optional SaaS connection — enter your Mailchimp Mandrill key.</p>
                  </div>
                  <a 
                    href="https://mandrillapp.com/settings" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 shrink-0"
                  >
                    Mandrill Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                    Mailchimp Mandrill API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys['mailchimp'] ? 'text' : 'password'}
                      value={settings.mailchimpApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, mailchimpApiKey: e.target.value })}
                      placeholder="e.g. md-xxxxxxxxxxxxxxxx"
                      className="w-full pl-3 pr-10 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('mailchimp')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                    >
                      {showApiKeys['mailchimp'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                    Generate an API key in Mailchimp Transactional &gt; Settings &gt; API Keys to authenticate outgoing communiqués.
                  </p>
                </div>
              </div>
            )}

            {/* Mode 5 Details: SMTP Details (if enabled) */}
            {settings.engineMode === 'smtp' && (
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mailbox Connection Parameters</h3>
                    <p className="text-xs text-neutral-400">Standard outgoing mail configuration for Gmail or Microsoft 365.</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSettings({
                        ...settings,
                        smtpHost: 'smtp.gmail.com',
                        smtpPort: 587,
                        smtpSecure: false
                      })}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 cursor-pointer"
                    >
                      Gmail Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({
                        ...settings,
                        smtpHost: 'smtp.office365.com',
                        smtpPort: 587,
                        smtpSecure: false
                      })}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 cursor-pointer"
                    >
                      Outlook 365 Preset
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={settings.smtpHost || ''}
                      onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                      placeholder="e.g. smtp.gmail.com"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                      Port Number
                    </label>
                    <input
                      type="number"
                      value={settings.smtpPort || 587}
                      onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value, 10) || 587 })}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                      Mailbox Username or Email Address
                    </label>
                    <input
                      type="text"
                      value={settings.smtpUser || ''}
                      onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                      placeholder="e.g. concierge@grenadacaricom2027.com"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                      Mailbox Password or App Password
                    </label>
                    <input
                      type="password"
                      value={settings.smtpPassword || ''}
                      onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                      placeholder="App-specific 16-character password"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Secretariat & Sender Identity */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-3">
                Secretariat Sender Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                    Display Sender Name
                  </label>
                  <input
                    type="text"
                    value={settings.senderName}
                    onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                    Official Outgoing Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.senderEmail}
                    onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                    Reply-To Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.replyToEmail}
                    onChange={(e) => setSettings({ ...settings, replyToEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                    Official Festival Website URL
                  </label>
                  <input
                    type="url"
                    value={settings.festivalWebsiteUrl}
                    onChange={(e) => setSettings({ ...settings, festivalWebsiteUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1">
                  Secretariat Postal &amp; Organisation Address
                </label>
                <input
                  type="text"
                  value={settings.organisationAddress}
                  onChange={(e) => setSettings({ ...settings, organisationAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Automated Dispatch Triggers */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-3">
                Automated Trigger Rules
              </h3>

              <div className="space-y-3">
                <label className="flex items-start sm:items-center justify-between p-3 sm:p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/80 cursor-pointer gap-3">
                  <div>
                    <span className="font-bold text-xs text-white block">Auto-dispatch Pass Order Confirmation</span>
                    <span className="text-[11px] text-neutral-400">
                      Dispatches official digital pass dossier and barcode upon purchase completion.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSendOrderConfirmation}
                    onChange={(e) => setSettings({ ...settings, autoSendOrderConfirmation: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 cursor-pointer mt-0.5 sm:mt-0 shrink-0"
                  />
                </label>

                <label className="flex items-start sm:items-center justify-between p-3 sm:p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/80 cursor-pointer gap-3">
                  <div>
                    <span className="font-bold text-xs text-white block">Auto-dispatch Welcome Registration Dossier</span>
                    <span className="text-[11px] text-neutral-400">
                      Sends welcome greetings and cultural preview when a visitor registers flight or travel details.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSendWelcomeRegistration}
                    onChange={(e) => setSettings({ ...settings, autoSendWelcomeRegistration: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 cursor-pointer mt-0.5 sm:mt-0 shrink-0"
                  />
                </label>

                <label className="flex items-start sm:items-center justify-between p-3 sm:p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/80 cursor-pointer gap-3">
                  <div>
                    <span className="font-bold text-xs text-white block">Auto-dispatch Contact Enquiry Acknowledgement</span>
                    <span className="text-[11px] text-neutral-400">
                      Instantly sends a branded confirmation with reference tracking code when a visitor submits the contact form.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSendContactAcknowledgement !== false}
                    onChange={(e) => setSettings({ ...settings, autoSendContactAcknowledgement: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 cursor-pointer mt-0.5 sm:mt-0 shrink-0"
                  />
                </label>

                <label className="flex items-start sm:items-center justify-between p-3 sm:p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/80 cursor-pointer gap-3">
                  <div>
                    <span className="font-bold text-xs text-white block">Auto-dispatch Airport &amp; Shuttle Transport Confirmation</span>
                    <span className="text-[11px] text-neutral-400">
                      Dispatches official mobility dossier, pickup instructions, and booking reference upon transfer request.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSendTransportConfirmation !== false}
                    onChange={(e) => setSettings({ ...settings, autoSendTransportConfirmation: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 cursor-pointer mt-0.5 sm:mt-0 shrink-0"
                  />
                </label>

                <label className="flex items-start sm:items-center justify-between p-3 sm:p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/80 cursor-pointer gap-3">
                  <div>
                    <span className="font-bold text-xs text-white block">Auto-dispatch VIP Newsletter &amp; Insider Welcome</span>
                    <span className="text-[11px] text-neutral-400">
                      Welcomes new subscribers with VIP ticket perks, early access passes, and secret lineup alerts.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSendNewsletterWelcome !== false}
                    onChange={(e) => setSettings({ ...settings, autoSendNewsletterWelcome: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 cursor-pointer mt-0.5 sm:mt-0 shrink-0"
                  />
                </label>

                <label className="flex items-start sm:items-center justify-between p-3 sm:p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/80 cursor-pointer gap-3">
                  <div>
                    <span className="font-bold text-xs text-white block">Auto-dispatch Concierge Enquiry Response</span>
                    <span className="text-[11px] text-neutral-400">
                      Dispatches branded formal email whenever an administrator replies to an attendee enquiry.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSendEnquiryReply}
                    onChange={(e) => setSettings({ ...settings, autoSendEnquiryReply: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 cursor-pointer mt-0.5 sm:mt-0 shrink-0"
                  />
                </label>

                <label className="flex items-start sm:items-center justify-between p-3 sm:p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/80 cursor-pointer gap-3">
                  <div>
                    <span className="font-bold text-xs text-white block">Bcc Secretariat Records on All Pass Orders</span>
                    <span className="text-[11px] text-neutral-400">
                      Keeps festival archive synchronised with customer transactions.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.bccSecretariatOnOrders}
                    onChange={(e) => setSettings({ ...settings, bccSecretariatOnOrders: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 cursor-pointer mt-0.5 sm:mt-0 shrink-0"
                  />
                </label>
              </div>
            </div>

            {/* Save Button Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-neutral-950 cursor-pointer flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-transform"
                style={{ backgroundColor: primaryColor }}
              >
                <Check className="w-4 h-4" /> Save Configuration Settings
              </button>
            </div>
          </form>

          {/* Test Dispatch Diagnostic Card */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Test Dispatch Diagnostic</h3>
            </div>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Enter an email address to send a real-time verification test through your selected engine mode.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="email"
                placeholder="Enter email (e.g. director@grenadacaricom2027.com)"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="w-full sm:w-80 px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                disabled={isTestingSmtp}
                onClick={handleTestDispatch}
                className="w-full sm:w-auto px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0"
              >
                {isTestingSmtp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Running Diagnostic...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Test {
                      settings.engineMode === 'resend' ? 'Resend API' :
                      settings.engineMode === 'sendgrid' ? 'SendGrid API' :
                      settings.engineMode === 'mailchimp' ? 'Mailchimp API' :
                      'SMTP Gateway'
                    }
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-4 p-3.5 sm:p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div>
                  <div className="font-bold mb-0.5">{testResult.success ? 'Diagnostic Passed' : 'Diagnostic Warning'}</div>
                  <div className="leading-relaxed">{testResult.message}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW RENDERED EMAIL */}
      {/* ========================================================================= */}
      {viewingLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[96vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-3 sm:px-6 sm:py-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/60">
              <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate">{viewingLog.subject}</h3>
                  <div className="text-[10px] sm:text-[11px] text-neutral-400 flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                    <span className="truncate">To: <strong className="text-neutral-200">{viewingLog.recipientName || 'Patron'}</strong> &lt;{viewingLog.recipientEmail}&gt;</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="font-mono text-amber-400 truncate">{viewingLog.referenceId}</span>
                  </div>
                </div>
              </div>

              {/* View Switchers */}
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                <button
                  type="button"
                  onClick={() => setShowRawHtml(!showRawHtml)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                    showRawHtml
                      ? 'bg-amber-500 text-neutral-950 border-amber-500'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                  }`}
                >
                  {showRawHtml ? 'Rendered View' : 'HTML Code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const printWin = window.open('', '_blank');
                    if (printWin) {
                      printWin.document.write(viewingLog.contentHtml || viewingLog.contentText || '');
                      printWin.document.close();
                      printWin.focus();
                      printWin.print();
                    }
                  }}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700 cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Print / </span>Save
                </button>

                <button
                  type="button"
                  onClick={() => setViewingLog(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 cursor-pointer ml-auto sm:ml-0"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-neutral-950">
              {showRawHtml ? (
                <div className="bg-neutral-900 p-3 sm:p-4 rounded-xl font-mono text-[11px] sm:text-xs text-neutral-300 border border-neutral-800 whitespace-pre-wrap select-all overflow-x-auto max-h-[500px] sm:max-h-[600px]">
                  {viewingLog.contentHtml || renderFestivalHtmlEmail({
                    recipientName: viewingLog.recipientName,
                    recipientEmail: viewingLog.recipientEmail,
                    subject: viewingLog.subject,
                    bodyText: viewingLog.contentText || viewingLog.subject,
                    referenceId: viewingLog.referenceId,
                    metadata: viewingLog.metadata,
                    primaryColor
                  })}
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl min-h-[400px] sm:min-h-[500px]">
                    <iframe
                      title="Dispatched Email View"
                      className="w-full h-[450px] sm:h-[580px] border-0"
                      srcDoc={viewingLog.contentHtml || renderFestivalHtmlEmail({
                        recipientName: viewingLog.recipientName,
                        recipientEmail: viewingLog.recipientEmail,
                        subject: viewingLog.subject,
                        bodyText: viewingLog.contentText || viewingLog.subject,
                        referenceId: viewingLog.referenceId,
                        metadata: viewingLog.metadata,
                        primaryColor
                      })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:px-6 sm:py-3 border-t border-neutral-800 bg-neutral-950/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs text-neutral-400">
              <div className="text-[11px] sm:text-xs truncate">
                Dispatched: <strong className="text-neutral-200">{new Date(viewingLog.dispatchedAt).toLocaleString('en-GB')}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleResend(viewingLog);
                    setViewingLog(null);
                  }}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-amber-500 text-neutral-950 font-bold rounded-xl cursor-pointer hover:bg-amber-400 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-dispatch
                </button>
                <button
                  type="button"
                  onClick={() => setViewingLog(null)}
                  className="flex-1 sm:flex-none px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
