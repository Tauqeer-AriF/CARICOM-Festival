import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  X, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  ExternalLink, 
  Sparkles, 
  KeyRound, 
  ShieldCheck, 
  CreditCard, 
  Calendar, 
  Ticket, 
  FolderOpen, 
  Mail, 
  Bed, 
  Camera, 
  Sliders, 
  MessageSquare, 
  Download, 
  Maximize2, 
  Minimize2,
  Bookmark,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminTabId } from '../services/adminUserService';

interface AdminGuideWidgetProps {
  primaryColor?: string;
  activeAdminTab?: string;
  onNavigateTab?: (tab: AdminTabId) => void;
  onOpenFullDocumentation?: () => void;
}

interface GuideArticle {
  id: string;
  tabId?: AdminTabId;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  summary: string;
  tips: string[];
  faqs: { q: string; a: string }[];
}

const GUIDE_ARTICLES: GuideArticle[] = [
  {
    id: 'payments',
    tabId: 'payments',
    category: 'Finance & Verification',
    icon: CreditCard,
    title: 'Payment Receipts & Bank Proofs',
    summary: 'Manage Monzo & UK Bank Transfer proofs, approve payments, and confirm guest pass allocations.',
    tips: [
      'Orders with uploaded receipts appear with amber counter badges.',
      'Click "Verify & Confirm Paid" to mark an order PAID and enable instant PDF badge generation.',
      'Use the bulk checkboxes to verify or reject multiple receipts at once.',
      'Attendees can re-upload their receipt if flagged as rejected.'
    ],
    faqs: [
      {
        q: 'How does receipt verification work?',
        a: 'When an attendee uploads a payment screenshot, it appears in the Payment Receipts tab. Approving it automatically marks the order as Confirmed Paid.'
      },
      {
        q: 'Can I delete a faulty receipt?',
        a: 'Yes! Use the trash icon on the receipt card or the Bulk Delete tool. The guest reservation remains safe and returns to awaiting proof.'
      }
    ]
  },
  {
    id: 'orders',
    tabId: 'orders',
    category: 'Ticketing & Passes',
    icon: Ticket,
    title: 'Orders, Passes & PDF Badges',
    summary: 'Track ticket sales, view guest details, print official VIP Pass Badges with QR codes, and edit reservations.',
    tips: [
      'Click the printer or PDF icon on any order to download a high-resolution printable VIP Badge.',
      'Use the filter dropdown to switch between All, Confirmed Paid, and Pending Payment Proofs.',
      'Export full CSV reports anytime for logistics and gate staff.'
    ],
    faqs: [
      {
        q: 'How do guests receive their pass badges?',
        a: 'Confirmed guests can download their pass PDF directly, or you can send it via the Concierge Email Suite.'
      },
      {
        q: 'What if a customer changes their name or hotel?',
        a: 'Click "Edit" on their order row to update their guest name, dietary needs, or pass allocation.'
      }
    ]
  },
  {
    id: 'events',
    tabId: 'events',
    category: 'Itinerary & Schedule',
    icon: Calendar,
    title: 'Festival Event Lineup Schedule',
    summary: 'Control the 10-day festival event schedule, dates, venues, categories, and cover banners.',
    tips: [
      'Events automatically calculate festival day offsets based on global festival dates.',
      'Assign categories (Music, Beach Fete, Culture) to enable public filter pills.',
      'Pick imagery directly from your Media Library for crisp event covers.'
    ],
    faqs: [
      {
        q: 'How do I change the festival start and end dates?',
        a: 'Update the master dates in the Customiser Studio or Event Manager. All event dates and the countdown clock sync automatically.'
      }
    ]
  },
  {
    id: 'gallery',
    tabId: 'gallery',
    category: 'Media & Visuals',
    icon: Camera,
    title: 'Gallery Media & Video Clips',
    summary: 'Upload festival photos, YouTube video clips, and direct MP4 stage highlights.',
    tips: [
      'The public gallery defaults to a horizontal row grid layout.',
      'Enter any standard YouTube link or direct video URL to display an interactive video player.',
      'Assign categories like "VIP Beach Fete" or "Mellowland Village" for smart filtering.'
    ],
    faqs: [
      {
        q: 'What image formats and sizes are supported?',
        a: 'JPEG, PNG, WebP, and direct video links. Images are automatically compressed to ensure lightning-fast loading.'
      }
    ]
  },
  {
    id: 'email_suite',
    tabId: 'emails',
    category: 'Communications',
    icon: Mail,
    title: 'Concierge Email Suite & Auto-Responders',
    summary: 'Send branded HTML confirmation emails, dispatch ticket receipts, and configure automated responders.',
    tips: [
      'Select pre-built templates for VIP Pass Confirmations, Payment Reminders, and Welcome Packs.',
      'Supports live simulated SMTP preview and Webhook integrations.',
      'View dispatch history logs in the Email Logs view.'
    ],
    faqs: [
      {
        q: 'Can I attach PDF passes to customer emails?',
        a: 'Yes, check "Attach Official Pass PDF" in the reply desk to auto-generate and embed their credentials.'
      }
    ]
  },
  {
    id: 'media_library',
    tabId: 'media',
    category: 'Assets & Media',
    icon: FolderOpen,
    title: 'Central Media Library',
    summary: 'Store reusable assets, logos, artist photos, and banners in one place.',
    tips: [
      'Upload assets once and reuse them across Events, Hotels, Testimonials, and Page Images.',
      'Supports drag-and-drop batch file uploads with automatic image optimization.'
    ],
    faqs: [
      {
        q: 'How do I reuse an image from the library?',
        a: 'When editing any item across the dashboard, click "Select from Library" to pick an uploaded asset.'
      }
    ]
  },
  {
    id: 'branding',
    tabId: 'branding',
    category: 'Styling & Customizer',
    icon: Sliders,
    title: 'Customiser Studio (Theme & Branding)',
    summary: 'Customize the master brand accent color, festival titles, hero banners, and typography presets.',
    tips: [
      'Click any color preset (Gold, Amber, Emerald, Coral) for an instant live re-skin.',
      'Always click "Save Customisation" at the bottom to publish changes to the live site.'
    ],
    faqs: [
      {
        q: 'Will changing branding affect mobile devices?',
        a: 'Yes! The entire application is 100% responsive and adapts instantly across all screen sizes.'
      }
    ]
  },
  {
    id: 'security',
    tabId: 'users',
    category: 'Security & Access',
    icon: ShieldCheck,
    title: 'Multi-Role Access & Team Security',
    summary: 'Manage admin user accounts, roles (Super Admin, Concierge, Media Manager), and access permissions.',
    tips: [
      'Assign granular roles so staff only access their relevant tabs.',
      'Ensure the 2-Tier Master Passcode is kept confidential.'
    ],
    faqs: [
      {
        q: 'Can I create accounts for gate staff?',
        a: 'Yes! Create a Concierge / Scanner account with access restricted strictly to Orders and Verification.'
      }
    ]
  }
];

export const AdminGuideWidget: React.FC<AdminGuideWidgetProps> = ({
  primaryColor = '#F59E0B',
  activeAdminTab = 'analytics',
  onNavigateTab,
  onOpenFullDocumentation
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('payments');
  const [isExpanded, setIsExpanded] = useState(false);

  // Automatically select relevant guide article when activeAdminTab changes
  React.useEffect(() => {
    if (activeAdminTab) {
      const match = GUIDE_ARTICLES.find(a => a.tabId === activeAdminTab);
      if (match) {
        setSelectedArticleId(match.id);
      }
    }
  }, [activeAdminTab]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return GUIDE_ARTICLES;
    const q = searchQuery.toLowerCase();
    return GUIDE_ARTICLES.filter(a => 
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.tips.some(t => t.toLowerCase().includes(q)) ||
      a.faqs.some(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const currentArticle = useMemo(() => {
    return GUIDE_ARTICLES.find(a => a.id === selectedArticleId) || GUIDE_ARTICLES[0];
  }, [selectedArticleId]);

  return (
    <>
      {/* Floating Action Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden flex items-center gap-2">
        <motion.button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl backdrop-blur-md border transition-all cursor-pointer ${
            isOpen 
              ? 'bg-amber-500 text-neutral-950 border-amber-300 font-black ring-4 ring-amber-500/20' 
              : 'bg-neutral-900/95 hover:bg-neutral-800 text-amber-400 border-amber-500/40 hover:border-amber-400 font-bold shadow-amber-500/10'
          }`}
          title="Open Admin Handover & Quick Guide"
        >
          <div className="relative">
            <BookOpen className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <span className="text-xs tracking-wide">
            {isOpen ? 'Close Guide' : 'Admin Guide'}
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-neutral-950/20 font-extrabold">
            ?
          </span>
        </motion.button>
      </div>

      {/* Slide-out / Floating Guide Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed z-50 print:hidden shadow-2xl rounded-3xl overflow-hidden border border-amber-500/30 bg-neutral-950/95 backdrop-blur-xl flex flex-col transition-all duration-300 ${
              isExpanded 
                ? 'inset-4 sm:inset-10 lg:inset-20' 
                : 'bottom-20 right-4 sm:right-6 w-[94vw] sm:w-[500px] h-[580px] max-h-[85vh]'
            }`}
          >
            {/* Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-amber-950/40 border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <span>Admin Handover Guide</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                      Interactive
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-light truncate">
                    Instant walkthroughs &amp; operating instructions
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsExpanded(prev => !prev)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  title={isExpanded ? "Minimize" : "Expand to Full"}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Close Guide Widget"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Search */}
            <div className="p-3 bg-neutral-900/60 border-b border-neutral-800/80 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search topics (e.g. payments, passes, events, pdf)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 bg-neutral-950 border border-neutral-800 focus:border-amber-500/60 rounded-xl text-xs text-white placeholder-neutral-500 outline-none transition-all font-light"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Main Content Split (or Tab list + Reader) */}
            <div className={`flex-1 overflow-hidden grid ${isExpanded ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'} divide-y md:divide-y-0 md:divide-x divide-neutral-800/80`}>
              
              {/* Category / Topic Selector */}
              <div className={`${isExpanded ? 'overflow-y-auto max-h-full' : 'max-h-40 overflow-y-auto border-b border-neutral-800/80'} p-2 space-y-1 bg-neutral-950/60 scrollbar-thin`}>
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                  Topics ({filteredArticles.length})
                </div>
                {filteredArticles.map(article => {
                  const Icon = article.icon;
                  const isSelected = article.id === currentArticle.id;
                  const isCurrentTabMatch = article.tabId === activeAdminTab;

                  return (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => setSelectedArticleId(article.id)}
                      className={`w-full p-2 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected 
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold shadow-sm' 
                          : 'hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-900 text-neutral-400'}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate leading-tight">
                            {article.title}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-light truncate">
                            {article.category}
                          </div>
                        </div>
                      </div>

                      {isCurrentTabMatch && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 font-bold">
                          Active Tab
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Article Reader */}
              <div className={`${isExpanded ? 'md:col-span-2' : ''} flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-neutral-950/40 scrollbar-thin`}>
                
                {/* Header info */}
                <div className="space-y-2 pb-3 border-b border-neutral-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                      {currentArticle.category}
                    </span>

                    {currentArticle.tabId && onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateTab(currentArticle.tabId!);
                          setIsOpen(false);
                        }}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer underline hover:no-underline transition-colors"
                      >
                        <span>Go to {currentArticle.title} Tab</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h2 className="text-base sm:text-lg font-black text-white font-serif">
                    {currentArticle.title}
                  </h2>
                  
                  <p className="text-xs text-neutral-300 leading-relaxed font-light">
                    {currentArticle.summary}
                  </p>
                </div>

                {/* Quick Pro Tips */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Operating Tips</span>
                  </h4>
                  <div className="space-y-1.5">
                    {currentArticle.tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80 font-light">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQs */}
                {currentArticle.faqs.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Frequently Asked Questions</span>
                    </h4>
                    <div className="space-y-2">
                      {currentArticle.faqs.map((faq, idx) => (
                        <div key={idx} className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-3 space-y-1">
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="text-amber-400 font-mono">Q:</span> {faq.q}
                          </p>
                          <p className="text-xs text-neutral-400 leading-relaxed font-light pl-4">
                            {faq.a}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Footer Quick Link to Full Manual */}
            <div className="px-4 py-2.5 bg-neutral-900/90 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
              <span className="text-[11px] truncate">
                Need a printable offline manual?
              </span>

              {onOpenFullDocumentation && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenFullDocumentation();
                    setIsOpen(false);
                  }}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3 h-3" />
                  <span>Full PDF Manual</span>
                </button>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
