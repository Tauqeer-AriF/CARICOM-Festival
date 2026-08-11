import React, { useState, useEffect, useRef } from 'react';
import { 
  FormSubmissionItem, 
  SiteConfig,
  EventItem,
  GalleryItem,
  HotelItem,
  PassItem,
  TestimonialItem,
  MediaItem
} from '../types';
import { 
  getSubmissions, 
  updateSubmissionStatus, 
  deleteSubmission, 
  addSubmission, 
  resetSubmissionsToDemo, 
  getSiteConfig, 
  saveSiteConfig, 
  exportSubmissionsCSV,
  addSubmissionReply,
  getEvents,
  saveEvents,
  getGalleryItems,
  saveGalleryItems,
  getHotels,
  saveHotels,
  getPasses,
  savePasses,
  resetAllDynamicDataToDefault,
  getTestimonials,
  saveTestimonials,
  addMediaItem,
  syncWithDatabase,
  uploadFileToServer
} from '../services/submissionService';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Check,
  Copy,
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Mail, 
  Phone, 
  User, 
  Palette, 
  Share2, 
  Type, 
  Megaphone, 
  BarChart3, 
  Settings, 
  FileSpreadsheet, 
  Lock, 
  Eye, 
  EyeOff, 
  Send, 
  Plane, 
  Ticket, 
  Truck, 
  MessageSquare, 
  Sparkles,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Printer,
  FileText,
  Calendar,
  Image,
  Video,
  Hotel,
  FolderOpen,
  Save,
  RotateCcw,
  Menu,
  Upload,
  Crown,
  Flame,
  Music,
  Disc,
  Globe,
  Shield,
  Compass,
  Sun,
  Palmtree,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FESTIVAL_IMAGES } from '../data/festivalData';
import { LuxurySkeletonOverlay } from '../components/LuxurySkeletonOverlay';
import { CustomConfirmModal } from '../components/CustomConfirmModal';
import { MediaSelectorModal } from '../components/MediaSelectorModal';
import { MediaLibraryTab } from '../components/MediaLibraryTab';
import { BackupRestoreTab } from '../components/BackupRestoreTab';
import { PassBadgePdfModal, parseSubmissionItems } from '../components/PassBadgePdfModal';

interface AdminDashboardViewProps {
  setActiveTab: (tab: any) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ setActiveTab }) => {
  // Auth state (Password / Passcode Protected)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true' || localStorage.getItem('admin_authenticated') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<FormSubmissionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  // Helper function to consolidate guest records by email address
  const getGuestProfileByEmail = (emailStr: string) => {
    if (!emailStr) return null;
    const normalized = emailStr.trim().toLowerCase();
    const linked = submissions.filter(s => s.email && s.email.trim().toLowerCase() === normalized);
    const passOrders = linked.filter(s => s.type === 'pass-order');
    const flightRegs = linked.filter(s => s.type === 'flight-registration');
    const transportRequests = linked.filter(s => s.type === 'transport-request');
    const contactInquiries = linked.filter(s => s.type === 'contact' || s.type === 'newsletter');
    
    const totalSpentGBP = passOrders.reduce((sum, order) => sum + (order.amountGBP || 0), 0);
    const latestName = linked[0]?.name || emailStr;
    const latestPhone = linked.find(s => s.phone)?.phone || 'N/A';

    return {
      email: emailStr,
      name: latestName,
      phone: latestPhone,
      allSubmissions: linked,
      passOrders,
      flightRegs,
      transportRequests,
      contactInquiries,
      totalSpentGBP,
      hasFlightDetails: flightRegs.length > 0
    };
  };

  // Concierge Executive Reply Desk Modal
  const [replyingSub, setReplyingSubState] = useState<FormSubmissionItem | null>(null);
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [replySent, setReplySent] = useState<boolean>(false);
  const [replyMethod, setReplyMethod] = useState<'mailto' | 'gmail' | 'outlook' | 'in-app'>('mailto');
  const [replyCopied, setReplyCopied] = useState<boolean>(false);
  const [attachPassPdf, setAttachPassPdf] = useState<boolean>(true);

  // Pagination & PDF Badge states
  const ITEMS_PER_PAGE = 9;
  const [submissionPage, setSubmissionPage] = useState<number>(1);
  const [ordersPage, setOrdersPage] = useState<number>(1);
  const [eventsPage, setEventsPage] = useState<number>(1);
  const [galleryPage, setGalleryPage] = useState<number>(1);
  const [passesPage, setPassesPage] = useState<number>(1);
  const [hotelsPage, setHotelsPage] = useState<number>(1);
  const [testimonialsPage, setTestimonialsPage] = useState<number>(1);
  const [previewPdfSub, setPreviewPdfSub] = useState<FormSubmissionItem | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const selectedPassOrder = submissions.find(s => s.id === selectedOrderId) || null;

  const setReplyingSub = (sub: FormSubmissionItem | null) => {
    setReplyingSubState(sub);
    if (sub) {
      setAttachPassPdf(sub.type === 'pass-order' || sub.type === 'flight-registration');
    }
  };

  // New Manual Submission Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newSubForm, setNewSubForm] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'contact' as FormSubmissionItem['type'],
    topicOrPass: '',
    messageOrDetails: ''
  });

  // Site Configuration state
  const [siteConfig, setSiteConfigState] = useState<SiteConfig>(getSiteConfig());
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [customizerSubTab, setCustomizerSubTab] = useState<'identity' | 'hero' | 'brand' | 'banner' | 'social' | 'presets' | 'elements'>('identity');
  
  // Canvas Image Compression Helper for Direct Uploads
  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<{ compressedUrl: string; compressedSize: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ compressedUrl: event.target?.result as string, compressedSize: file.size });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert heavy PNG files (which ignore the quality parameter in toDataURL) to highly compressed JPEG
          // except if they are small logos/icons under 200KB where transparency needs to be preserved.
          let mimeType = 'image/jpeg';
          if (file.type === 'image/png' && file.size < 200 * 1024) {
            mimeType = 'image/png';
          }
          const compressedUrl = canvas.toDataURL(mimeType, quality);
          
          // Calculate exact base64 size in bytes
          const stringLength = compressedUrl.length - `data:${mimeType};base64,`.length;
          const sizeInBytes = Math.round(stringLength * 3 / 4);

          resolve({ compressedUrl, compressedSize: sizeInBytes });
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };
  
  type AdminTab = 'submissions' | 'orders' | 'branding' | 'page-images' | 'analytics' | 'events' | 'gallery' | 'passes' | 'hotels' | 'system' | 'media' | 'testimonials' | 'backup';
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('analytics');
  const [selectedAnalyticsLocation, setSelectedAnalyticsLocation] = useState<string>('Grand Anse Beach');
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);
  const [pageImagesSubTab, setPageImagesSubTab] = useState<'home' | 'about-grenada' | 'about-mellowland' | 'banners'>('home');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Analytics timeline configuration
  const [analyticsRange, setAnalyticsRange] = useState<'7d' | '30d' | '90d' | '1y' | 'custom'>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Auto-dismiss saveToast after 3.5 seconds
  useEffect(() => {
    if (saveToast) {
      const timer = setTimeout(() => {
        setSaveToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [saveToast]);

  // Bulk selection states
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<string[]>([]);
  const [selectedPasses, setSelectedPasses] = useState<string[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);

  // Interactive Live Sandbox slide index & rotation timer
  const [sandboxSlideIndex, setSandboxSlideIndex] = useState<number>(0);

  useEffect(() => {
    const intervalSec = siteConfig.hero?.autoplayInterval || 4;
    const timer = setInterval(() => {
      setSandboxSlideIndex((prev) => prev + 1);
    }, intervalSec * 1000);
    return () => clearInterval(timer);
  }, [siteConfig.hero?.autoplayInterval]);

  useEffect(() => {
    // Clear all bulk selections when changing tabs
    setSelectedSubmissions([]);
    setSelectedEvents([]);
    setSelectedGallery([]);
    setSelectedPasses([]);
    setSelectedHotels([]);
    setSelectedTestimonials([]);
  }, [activeAdminTab]);

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Media Selector State
  const [mediaSelectorTarget, setMediaSelectorTarget] = useState<
    'event' | 'gallery' | 'gallery_video' | 'hotel' | 'testimonial' | 'hero' | 'logo' | 'favicon' | { heroIndex: number } | { pageImageKey: string } | null
  >(null);

  const handleMediaSelect = (url: string) => {
    if (mediaSelectorTarget === 'logo') {
      const updatedConfig = {
        ...siteConfig,
        appLogoUrl: url
      };
      setSiteConfigState(updatedConfig);
      saveSiteConfig(updatedConfig);
      setSaveToast('Updated application logo from Media Library!');
    } else if (mediaSelectorTarget === 'favicon') {
      const updatedConfig = {
        ...siteConfig,
        appFaviconUrl: url
      };
      setSiteConfigState(updatedConfig);
      saveSiteConfig(updatedConfig);
      setSaveToast('Updated application favicon from Media Library!');
    } else if (typeof mediaSelectorTarget === 'object' && mediaSelectorTarget !== null && 'pageImageKey' in mediaSelectorTarget) {
      const key = mediaSelectorTarget.pageImageKey;
      const updatedPageImages = {
        ...(siteConfig.pageImages || {}),
        [key]: url
      };
      const updatedConfig = {
        ...siteConfig,
        pageImages: updatedPageImages
      };
      setSiteConfigState(updatedConfig);
      saveSiteConfig(updatedConfig);
      setSaveToast(`Updated image for '${key}' successfully!`);
    } else if (typeof mediaSelectorTarget === 'object' && mediaSelectorTarget !== null && 'heroIndex' in mediaSelectorTarget) {
      const idx = mediaSelectorTarget.heroIndex;
      const defaultImages = [
        { url: FESTIVAL_IMAGES.hero, alt: "Grenada Beach DJ Showcase 2027" },
        { url: FESTIVAL_IMAGES.festivalHero, alt: "Spectacular Spice Isle Festival Crowd" },
        { url: FESTIVAL_IMAGES.whiteGala, alt: "Premium VIP White Gala Party Lounge" },
        { url: FESTIVAL_IMAGES.riverTubing, alt: "Mellowland Tropical River Tubing Adventure" },
        { url: FESTIVAL_IMAGES.ecoParadise, alt: "Beautiful Grenada Eco Paradise Coastline" }
      ];
      const currentImages = siteConfig.hero?.images && siteConfig.hero.images.length > 0
        ? [...siteConfig.hero.images]
        : defaultImages;

      if (idx >= 0 && idx < currentImages.length) {
        currentImages[idx] = { ...currentImages[idx], url };
        const updatedConfig = {
          ...siteConfig,
          hero: {
            ...(siteConfig.hero || { displayCount: 5, autoplayInterval: 4 }),
            images: currentImages
          }
        };
        setSiteConfigState(updatedConfig);
        saveSiteConfig(updatedConfig);
        setSaveToast(`Updated hero background #${idx + 1} from Media Library!`);
      }
    } else if (mediaSelectorTarget === 'event') {
      if (editingEvent) {
        const updated = { ...editingEvent, highlightImage: url };
        setEditingEvent(updated);
        const newEvents = events.map(e => e.id === updated.id ? updated : e);
        setEvents(newEvents);
        saveEvents(newEvents);
      } else setNewEventForm({ ...newEventForm, highlightImage: url });
      setSaveToast('Updated event image from Media Library!');
    } else if (mediaSelectorTarget === 'gallery') {
      if (editingGallery) {
        const updated = { ...editingGallery, imageUrl: url };
        setEditingGallery(updated);
        const newGallery = galleryItems.map(g => g.id === updated.id ? updated : g);
        setGalleryItems(newGallery);
        saveGalleryItems(newGallery);
      } else setNewGalleryForm({ ...newGalleryForm, imageUrl: url });
      setSaveToast('Updated gallery image from Media Library!');
    } else if (mediaSelectorTarget === 'gallery_video') {
      if (editingGallery) {
        const updated = { ...editingGallery, videoUrl: url, mediaType: 'video' as const };
        setEditingGallery(updated);
        const newGallery = galleryItems.map(g => g.id === updated.id ? updated : g);
        setGalleryItems(newGallery);
        saveGalleryItems(newGallery);
      } else setNewGalleryForm({ ...newGalleryForm, videoUrl: url, mediaType: 'video' });
      setSaveToast('Selected video from Media Library!');
    } else if (mediaSelectorTarget === 'hotel') {
      if (editingHotel) {
        const updated = { ...editingHotel, image: url };
        setEditingHotel(updated);
        const newHotels = hotels.map(h => h.id === updated.id ? updated : h);
        setHotels(newHotels);
        saveHotels(newHotels);
      } else setNewHotelForm({ ...newHotelForm, image: url });
      setSaveToast('Updated hotel photo from Media Library!');
    } else if (mediaSelectorTarget === 'testimonial') {
      if (editingTestimonial) setEditingTestimonial({ ...editingTestimonial, avatar: url });
      else setNewTestimonialForm({ ...newTestimonialForm, avatar: url });
    } else if (mediaSelectorTarget === 'hero') {
      const defaultImages = [
        { url: FESTIVAL_IMAGES.hero, alt: "Grenada Beach DJ Showcase 2027" },
        { url: FESTIVAL_IMAGES.festivalHero, alt: "Spectacular Spice Isle Festival Crowd" },
        { url: FESTIVAL_IMAGES.whiteGala, alt: "Premium VIP White Gala Party Lounge" },
        { url: FESTIVAL_IMAGES.riverTubing, alt: "Mellowland Tropical River Tubing Adventure" },
        { url: FESTIVAL_IMAGES.ecoParadise, alt: "Beautiful Grenada Eco Paradise Coastline" }
      ];
      const currentHero = siteConfig.hero || {
        displayCount: 5,
        autoplayInterval: 4,
        images: defaultImages
      };
      const newImages = [...(currentHero.images && currentHero.images.length > 0 ? currentHero.images : defaultImages), { url, alt: 'Custom Hero Background' }];
      const updatedConfig = {
        ...siteConfig,
        hero: {
          ...currentHero,
          images: newImages,
          displayCount: currentHero.displayCount || Math.min(newImages.length, 5)
        }
      };
      setSiteConfigState(updatedConfig);
      saveSiteConfig(updatedConfig);
      setSaveToast('Added new background to Hero slideshow!');
    }
  };

  // Dynamic Lists States
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [passes, setPasses] = useState<PassItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);

  // Editing and Adding states
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [showAddEvent, setShowAddEvent] = useState<boolean>(false);
  const [newEventForm, setNewEventForm] = useState<Partial<EventItem>>({
    title: '',
    date: 'August 13, 2027',
    dayNumber: 1,
    time: '10:00 PM - 5:00 AM',
    location: '',
    description: '',
    highlightImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80',
    genres: [],
    djLineup: [],
    ticketPrice: undefined,
    isFeatured: false
  });

  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [showAddGallery, setShowAddGallery] = useState<boolean>(false);
  const [newGalleryForm, setNewGalleryForm] = useState<Partial<GalleryItem>>({
    title: '',
    category: 'VIP Beach Fete',
    mediaType: 'image',
    videoUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80',
    likesCount: 0,
    location: 'St. George\'s, Grenada',
    year: '2027 Highlight',
    aspectRatio: 'aspect-[16/9]',
    caption: ''
  });

  const [editingPass, setEditingPass] = useState<PassItem | null>(null);
  const [showAddPass, setShowAddPass] = useState<boolean>(false);
  const [newPassForm, setNewPassForm] = useState<Partial<PassItem>>({
    title: '',
    subtitle: '',
    priceGBP: 100,
    wristbandType: 'STANDARD WRISTBAND',
    includedEvents: 'Main Stage and Concert Entry',
    popular: false,
    features: ['Access to main concert stages', 'Complimentary welcome drink', 'Official festival guide booklet']
  });

  const [editingHotel, setEditingHotel] = useState<HotelItem | null>(null);
  const [showAddHotel, setShowAddHotel] = useState<boolean>(false);
  const [newHotelForm, setNewHotelForm] = useState<Partial<HotelItem>>({
    name: '',
    stars: 5,
    tagline: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80',
    location: '',
    distanceToMellowland: '15 mins drive',
    bookingUrl: 'https://royaltonresorts.com',
    isRecommended: false,
    features: ['Oceanfront views', 'Dedicated Mellows pickup point', 'Free High-Speed Wi-Fi', '24/7 reception support']
  });

  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [showAddTestimonial, setShowAddTestimonial] = useState<boolean>(false);
  const [newTestimonialForm, setNewTestimonialForm] = useState<Partial<TestimonialItem>>({
    name: '',
    location: '',
    role: '',
    quote: '',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  });

  const primaryColor = siteConfig.branding.primaryColor || '#F59E0B';
  const secondaryColor = siteConfig.branding.secondaryColor || '#10B981';

  const lastSavedConfigRef = useRef<string>(JSON.stringify(getSiteConfig()));

  useEffect(() => {
    // Load data
    loadData();

    // Event listener for external database updates
    const handleUpdate = () => loadData();
    const handleConfigUpdate = (e: Event) => {
      if ((e as any).isRemoteSync) {
        loadData();
      }
    };

    window.addEventListener('submissions_updated', handleUpdate);
    window.addEventListener('testimonials_updated', handleUpdate);
    window.addEventListener('site_config_updated', handleConfigUpdate);
    window.addEventListener('events_updated', handleUpdate);
    window.addEventListener('gallery_updated', handleUpdate);
    window.addEventListener('hotels_updated', handleUpdate);
    window.addEventListener('passes_updated', handleUpdate);

    return () => {
      window.removeEventListener('submissions_updated', handleUpdate);
      window.removeEventListener('testimonials_updated', handleUpdate);
      window.removeEventListener('site_config_updated', handleConfigUpdate);
      window.removeEventListener('events_updated', handleUpdate);
      window.removeEventListener('gallery_updated', handleUpdate);
      window.removeEventListener('hotels_updated', handleUpdate);
      window.removeEventListener('passes_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    setSubmissionPage(1);
    setOrdersPage(1);
  }, [searchQuery, typeFilter, statusFilter, activeAdminTab]);

  useEffect(() => {
    const configStr = JSON.stringify(siteConfig);
    if (configStr === lastSavedConfigRef.current) {
      return;
    }
    saveSiteConfig(siteConfig);
    const savedFresh = getSiteConfig();
    lastSavedConfigRef.current = JSON.stringify(savedFresh);
  }, [siteConfig]);

  const loadData = () => {
    setSubmissions(getSubmissions());
    const freshConfig = getSiteConfig();
    lastSavedConfigRef.current = JSON.stringify(freshConfig);
    setSiteConfigState(freshConfig);
    setEvents(getEvents());
    setGalleryItems(getGalleryItems());
    setHotels(getHotels());
    setPasses(getPasses());
    setTestimonials(getTestimonials());
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithDatabase();
      loadData();
      setSaveToast('Entire app state has been successfully re-synchronized with SQLite database!');
    } catch (err) {
      console.error('Manual re-sync failed:', err);
      setSaveToast('Re-sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const configPassword = (siteConfig.adminPassword || '2027').trim();
    if (pinInput.trim() === configPassword) {
      sessionStorage.setItem('admin_authenticated', 'true');
      localStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setPinInput('');
  };

  const handleStatusChange = (id: string, newStatus: 'new' | 'in-review' | 'resolved') => {
    updateSubmissionStatus(id, newStatus);
    loadData();
  };

  const handleDelete = (id: string) => {
    triggerConfirm(
      'Delete Form Submission',
      'Are you sure you want to delete this form submission? This action is permanent and cannot be undone.',
      () => {
        deleteSubmission(id);
        loadData();
      }
    );
  };

  const handleResetDemo = () => {
    triggerConfirm(
      'Reset All Dynamic Tables',
      'Reset form submissions, events, gallery, passes, and hotels back to original demo defaults? This will erase all your custom creations.',
      () => {
        resetSubmissionsToDemo();
        resetAllDynamicDataToDefault();
        loadData();
        setSaveToast('All database tables reset to demo defaults!');
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  const handleSaveConfig = () => {
    saveSiteConfig(siteConfig);
    setSaveToast('Site configuration & branding saved successfully!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleCreateManualSub = (e: React.FormEvent) => {
    e.preventDefault();
    addSubmission({
      type: newSubForm.type,
      name: newSubForm.name,
      email: newSubForm.email,
      phone: newSubForm.phone,
      topicOrPass: newSubForm.topicOrPass,
      messageOrDetails: newSubForm.messageOrDetails,
    });
    setShowAddModal(false);
    setNewSubForm({ name: '', email: '', phone: '', type: 'contact', topicOrPass: '', messageOrDetails: '' });
    loadData();
  };

  const applyReplyTemplate = (templateType: 'confirmation' | 'flight' | 'general' | 'vip') => {
    if (!replyingSub) return;
    const name = replyingSub.name ? replyingSub.name.split(' ')[0] : 'Guest';
    const topic = replyingSub.topicOrPass || 'your request';

    if (templateType === 'confirmation') {
      setReplyMessage(`Dear ${name},\n\nThank you for contacting Grenada CARICOM Festival 2027. We are pleased to confirm that your request regarding "${topic}" has been reviewed and approved by executive concierge.\n\nYour official festival credentials and hotel wristbands will be issued directly at your resort concierge desk upon arrival in Grenada.\n\nWarm regards,\nGrenada CARICOM Festival Executive Concierge Team`);
    } else if (templateType === 'flight') {
      setReplyMessage(`Dear ${name},\n\nWe have received your flight arrival details ("${topic}"). Our official airport VIP transfer liaison will be waiting for you at Maurice Bishop International Airport (GND) arrivals with a dedicated festival shuttle.\n\nPlease keep your booking reference handy upon arrival.\n\nWarm regards,\nGrenada Logistics & Transport Concierge`);
    } else if (templateType === 'vip') {
      setReplyMessage(`Dear ${name},\n\nThank you for your inquiry regarding "${topic}". Our VIP Cabana & Hospitality team has placed your reservation on priority status.\n\nA dedicated hostess will reach out to finalize champagne, catering, and personal cabana host preferences.\n\nWarm regards,\nGrenada CARICOM VIP Services`);
    } else {
      setReplyMessage(`Dear ${name},\n\nThank you for contacting the Grenada CARICOM Festival 2027 team regarding "${topic}".\n\nWe have reviewed your message and updated your inquiry status to Resolved. Should you require any further assistance, please feel free to reply to this message or contact our official festival hotline.\n\nWarm regards,\nFestival Operations Team`);
    }
  };

  const handleCopyReplyText = () => {
    if (!replyMessage) return;
    navigator.clipboard.writeText(replyMessage);
    setReplyCopied(true);
    setTimeout(() => setReplyCopied(false), 2000);
  };

  const getMailtoUrl = () => {
    if (!replyingSub) return '#';
    const subject = encodeURIComponent(`Grenada CARICOM Festival 2027 - Re: ${replyingSub.topicOrPass || 'Concierge Inquiry'}`);
    const body = encodeURIComponent(replyMessage);
    return `mailto:${encodeURIComponent(replyingSub.email)}?subject=${subject}&body=${body}`;
  };

  const getGmailUrl = () => {
    if (!replyingSub) return '#';
    const subject = encodeURIComponent(`Grenada CARICOM Festival 2027 - Re: ${replyingSub.topicOrPass || 'Concierge Inquiry'}`);
    const body = encodeURIComponent(replyMessage);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(replyingSub.email)}&su=${subject}&body=${body}`;
  };

  const getOutlookUrl = () => {
    if (!replyingSub) return '#';
    const subject = encodeURIComponent(`Grenada CARICOM Festival 2027 - Re: ${replyingSub.topicOrPass || 'Concierge Inquiry'}`);
    const body = encodeURIComponent(replyMessage);
    return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(replyingSub.email)}&subject=${subject}&body=${body}`;
  };

  const handleSendReply = (e?: React.FormEvent, methodOverride?: 'mailto' | 'gmail' | 'outlook' | 'in-app') => {
    if (e) e.preventDefault();
    if (!replyingSub || !replyMessage.trim()) return;

    const method = methodOverride || replyMethod;

    const attachmentObj = attachPassPdf ? {
      name: `CARICOM_2027_Pass_${replyingSub.extraDetails?.OrderRef || replyingSub.id}.pdf`,
      type: 'application/pdf',
      size: '1.2 MB'
    } : undefined;

    // Persist real reply in submission storage
    addSubmissionReply(replyingSub.id, replyMessage, 'Festival Concierge', method === 'in-app' ? 'in-app' : 'email', attachmentObj);

    // Launch email dispatch based on selected method
    if (method === 'gmail') {
      window.open(getGmailUrl(), '_blank');
    } else if (method === 'outlook') {
      window.open(getOutlookUrl(), '_blank');
    } else if (method === 'mailto') {
      window.location.href = getMailtoUrl();
    }

    setReplySent(true);
    setSaveToast(`Official reply recorded and dispatched to ${replyingSub.email}`);
    setTimeout(() => {
      setReplySent(false);
      setReplyingSub(null);
      setReplyMessage('');
      setReplyCopied(false);
      loadData();
    }, 1400);
  };

  // --- EVENTS CRUD HANDLERS ---
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      const updated = events.map(ev => ev.id === editingEvent.id ? editingEvent : ev);
      saveEvents(updated);
      setEditingEvent(null);
      setSaveToast('Event updated successfully!');
    } else {
      const created: EventItem = {
        ...newEventForm as EventItem,
        id: 'event-' + Date.now(),
        djLineup: newEventForm.djLineup || []
      };
      saveEvents([...events, created]);
      setShowAddEvent(false);
      setNewEventForm({
        title: '',
        date: 'August 13, 2027',
        dayNumber: 1,
        time: '10:00 PM - 5:00 AM',
        location: '',
        description: '',
        highlightImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80',
        genres: [],
        djLineup: [],
        ticketPrice: undefined,
        isFeatured: false
      });
      setSaveToast('New event created successfully!');
    }
    loadData();
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleDeleteEvent = (id: string) => {
    triggerConfirm(
      'Delete Festival Event',
      'Are you sure you want to delete this festival event? It will be removed from all public listings immediately.',
      () => {
        const filtered = events.filter(ev => ev.id !== id);
        saveEvents(filtered);
        setSaveToast('Event deleted successfully!');
        loadData();
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  // --- GALLERY CRUD HANDLERS ---
  const handleSaveGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGallery) {
      const updated = galleryItems.map(item => item.id === editingGallery.id ? editingGallery : item);
      saveGalleryItems(updated);
      setEditingGallery(null);
      setSaveToast('Gallery item updated successfully!');
    } else {
      const created: GalleryItem = {
        ...newGalleryForm as GalleryItem,
        id: 'gallery-' + Date.now(),
        uploadedAt: new Date().toISOString()
      };
      saveGalleryItems([created, ...galleryItems]);
      setShowAddGallery(false);
      setNewGalleryForm({
        title: '',
        category: 'VIP Beach Fete',
        mediaType: 'image',
        videoUrl: '',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80',
        likesCount: 0,
        location: 'St. George\'s, Grenada',
        year: '2027 Highlight',
        aspectRatio: 'aspect-[16/9]',
        caption: ''
      });
      setSaveToast('New gallery item added!');
    }
    loadData();
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleDeleteGallery = (id: string) => {
    triggerConfirm(
      'Delete Gallery Item',
      'Are you sure you want to delete this photo or video from the gallery?',
      () => {
        const filtered = galleryItems.filter(item => item.id !== id);
        saveGalleryItems(filtered);
        setSaveToast('Gallery item deleted!');
        loadData();
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  // --- PASSES CRUD HANDLERS ---
  const handleSavePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPass) {
      const updated = passes.map(p => p.id === editingPass.id ? editingPass : p);
      savePasses(updated);
      setEditingPass(null);
      setSaveToast('Pass package updated!');
    } else {
      const created: PassItem = {
        ...newPassForm as PassItem,
        id: 'pass-' + Date.now()
      };
      savePasses([...passes, created]);
      setShowAddPass(false);
      setNewPassForm({
        title: '',
        subtitle: '',
        priceGBP: 100,
        wristbandType: 'STANDARD WRISTBAND',
        includedEvents: 'Main Stage and Concert Entry',
        popular: false,
        features: ['Access to main concert stages', 'Complimentary welcome drink', 'Official festival guide booklet']
      });
      setSaveToast('New pass package created!');
    }
    loadData();
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleDeletePass = (id: string) => {
    triggerConfirm(
      'Delete Pass Package',
      'Are you sure you want to delete this wristband pass package? Guests will no longer be able to purchase it.',
      () => {
        const filtered = passes.filter(p => p.id !== id);
        savePasses(filtered);
        setSaveToast('Pass package deleted!');
        loadData();
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  // --- HOTELS CRUD HANDLERS ---
  const handleSaveHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHotel) {
      const updated = hotels.map(h => h.id === editingHotel.id ? editingHotel : h);
      saveHotels(updated);
      setEditingHotel(null);
      setSaveToast('Hotel details updated!');
    } else {
      const created: HotelItem = {
        ...newHotelForm as HotelItem,
        id: 'hotel-' + Date.now()
      };
      saveHotels([...hotels, created]);
      setShowAddHotel(false);
      setNewHotelForm({
        name: '',
        stars: 5,
        tagline: '',
        description: '',
        image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80',
        location: '',
        distanceToMellowland: '15 mins drive',
        bookingUrl: 'https://royaltonresorts.com',
        isRecommended: false,
        features: ['Oceanfront views', 'Dedicated Mellows pickup point', 'Free High-Speed Wi-Fi', '24/7 reception support']
      });
      setSaveToast('New partner hotel added!');
    }
    loadData();
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleDeleteHotel = (id: string) => {
    triggerConfirm(
      'Delete Partner Hotel',
      'Are you sure you want to delete this partner hotel from the recommendation board?',
      () => {
        const filtered = hotels.filter(h => h.id !== id);
        saveHotels(filtered);
        setSaveToast('Hotel deleted!');
        loadData();
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  // --- TESTIMONIALS CRUD HANDLERS ---
  const handleSaveTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTestimonial) {
      const updated = testimonials.map(t => t.id === editingTestimonial.id ? editingTestimonial : t);
      saveTestimonials(updated);
      setEditingTestimonial(null);
      setSaveToast('Testimonial updated!');
    } else {
      const created: TestimonialItem = {
        ...newTestimonialForm as TestimonialItem,
        id: 'test-' + Date.now()
      };
      saveTestimonials([...testimonials, created]);
      setShowAddTestimonial(false);
      setNewTestimonialForm({
        name: '',
        location: '',
        role: '',
        quote: '',
        rating: 5,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      });
      setSaveToast('New testimonial added!');
    }
    loadData();
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleDeleteTestimonial = (id: string) => {
    triggerConfirm(
      'Delete Testimonial',
      'Are you sure you want to delete this testimonial from the public board?',
      () => {
        const filtered = testimonials.filter(t => t.id !== id);
        saveTestimonials(filtered);
        setSaveToast('Testimonial deleted!');
        loadData();
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  // --- BULK OPERATIONS HANDLERS ---
  const handleBulkStatusChange = (status: FormSubmissionItem['status']) => {
    if (selectedSubmissions.length === 0) return;
    triggerConfirm(
      'Update Status for Multiple Records',
      `Are you sure you want to change the status of ${selectedSubmissions.length} selected submission(s) to '${status}'?`,
      () => {
        selectedSubmissions.forEach(id => {
          updateSubmissionStatus(id, status);
        });
        setSelectedSubmissions([]);
        loadData();
        setSaveToast(`Successfully updated ${selectedSubmissions.length} submission(s) to '${status}'!`);
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  const handleBulkDeleteSubmissions = () => {
    if (selectedSubmissions.length === 0) return;
    triggerConfirm(
      'Bulk Delete Submissions',
      `Are you sure you want to permanently delete the ${selectedSubmissions.length} selected submission(s)? This action cannot be undone.`,
      () => {
        selectedSubmissions.forEach(id => {
          deleteSubmission(id);
        });
        setSelectedSubmissions([]);
        loadData();
        setSaveToast(`Permanently deleted ${selectedSubmissions.length} submission(s)!`);
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  const handleBulkDeleteEvents = () => {
    if (selectedEvents.length === 0) return;
    triggerConfirm(
      'Bulk Delete Events',
      `Are you sure you want to permanently delete the ${selectedEvents.length} selected event(s)? This will remove them from all public listings.`,
      () => {
        const filtered = events.filter(ev => !selectedEvents.includes(ev.id));
        saveEvents(filtered);
        setSelectedEvents([]);
        loadData();
        setSaveToast(`Successfully deleted ${selectedEvents.length} event(s)!`);
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  const handleBulkDeleteGallery = () => {
    if (selectedGallery.length === 0) return;
    triggerConfirm(
      'Bulk Delete Gallery Photos',
      `Are you sure you want to permanently delete the ${selectedGallery.length} selected gallery photo(s)?`,
      () => {
        const filtered = galleryItems.filter(item => !selectedGallery.includes(item.id));
        saveGalleryItems(filtered);
        setSelectedGallery([]);
        loadData();
        setSaveToast(`Successfully deleted ${selectedGallery.length} gallery photo(s)!`);
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  const handleBulkDeletePasses = () => {
    if (selectedPasses.length === 0) return;
    triggerConfirm(
      'Bulk Delete Pass Packages',
      `Are you sure you want to permanently delete the ${selectedPasses.length} selected pass package(s)? Guests will no longer be able to book them.`,
      () => {
        const filtered = passes.filter(p => !selectedPasses.includes(p.id));
        savePasses(filtered);
        setSelectedPasses([]);
        loadData();
        setSaveToast(`Successfully deleted ${selectedPasses.length} pass package(s)!`);
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  const handleBulkDeleteHotels = () => {
    if (selectedHotels.length === 0) return;
    triggerConfirm(
      'Bulk Delete Partner Hotels',
      `Are you sure you want to permanently delete the ${selectedHotels.length} selected partner hotel(s)?`,
      () => {
        const filtered = hotels.filter(h => !selectedHotels.includes(h.id));
        saveHotels(filtered);
        setSelectedHotels([]);
        loadData();
        setSaveToast(`Successfully deleted ${selectedHotels.length} partner hotel(s)!`);
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  const handleBulkDeleteTestimonials = () => {
    if (selectedTestimonials.length === 0) return;
    triggerConfirm(
      'Bulk Delete Testimonials',
      `Are you sure you want to permanently delete the ${selectedTestimonials.length} selected testimonial(s)?`,
      () => {
        const filtered = testimonials.filter(t => !selectedTestimonials.includes(t.id));
        saveTestimonials(filtered);
        setSelectedTestimonials([]);
        loadData();
        setSaveToast(`Successfully deleted ${selectedTestimonials.length} testimonial(s)!`);
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  // Refresh Data Handler with loading animation & toast feedback
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await loadData();
    setSaveToast('Submissions and system data refreshed!');
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Filter logic
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.topicOrPass || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.messageOrDetails || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || sub.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const showReplyButton = activeAdminTab === 'orders' || typeFilter !== 'all' || statusFilter !== 'all';

  // KPI Statistics
  const totalCount = submissions.length;
  const newCount = submissions.filter(s => s.status === 'new').length;
  const inReviewCount = submissions.filter(s => s.status === 'in-review').length;
  const resolvedCount = submissions.filter(s => s.status === 'resolved').length;
  const totalRevenueGBP = submissions.reduce((sum, s) => sum + (s.amountGBP || 0), 0);

  const getTypeBadge = (type: FormSubmissionItem['type']) => {
    switch (type) {
      case 'contact':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-semibold"><MessageSquare className="w-3 h-3 shrink-0" /> Contact</span>;
      case 'flight-registration':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold"><Plane className="w-3 h-3 shrink-0" /> Flight Log</span>;
      case 'pass-order':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold"><Ticket className="w-3 h-3 shrink-0" /> Pass Order</span>;
      case 'transport-request':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-semibold"><Truck className="w-3 h-3 shrink-0" /> Shuttle</span>;
      case 'newsletter':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[11px] font-semibold"><Mail className="w-3 h-3 shrink-0" /> VIP Newsletter</span>;
    }
  };

  const getStatusBadge = (status: FormSubmissionItem['status']) => {
    switch (status) {
      case 'new':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wider"><AlertCircle className="w-3 h-3 text-rose-400" /> New</span>;
      case 'in-review':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider"><Clock className="w-3 h-3 text-amber-400" /> In Review</span>;
      case 'resolved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Resolved</span>;
    }
  };

  // Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center py-16 px-4 bg-[#05070C] relative overflow-hidden">
        {/* Abstract Tech Background Accents */}
        <div 
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none opacity-40 transition-colors duration-500" 
          style={{ backgroundColor: `${primaryColor}20` }}
        />
        <div 
          className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none opacity-20 transition-colors duration-500" 
          style={{ backgroundColor: `${primaryColor}10` }}
        />

        <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center space-y-6 relative z-10">
          <div 
            className="w-16 h-16 border rounded-2xl flex items-center justify-center mx-auto shadow-lg transition-all duration-300"
            style={{ 
              borderColor: `${primaryColor}40`, 
              backgroundColor: `${primaryColor}10`,
              color: primaryColor 
            }}
          >
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: primaryColor }}>ORGANISER ACCESS ONLY</span>
            <h2 className="text-2xl font-extrabold font-serif text-white mt-1">Festival Executive Portal</h2>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">Enter PIN code to view form submissions, change site branding, and manage guest logistics.</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <div className="relative flex items-center">
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Secure Passcode"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-700/80 rounded-xl py-3.5 pl-12 pr-12 text-center text-sm font-mono tracking-widest text-white focus:outline-none transition-all"
                  style={{
                    borderColor: pinError ? '#F43F5E' : 'rgba(163, 163, 163, 0.2)'
                  }}
                  onFocus={(e) => {
                    if (!pinError) {
                      e.target.style.borderColor = primaryColor;
                      e.target.style.boxShadow = `0 0 12px ${primaryColor}15`;
                    }
                  }}
                  onBlur={(e) => {
                    if (!pinError) {
                      e.target.style.borderColor = 'rgba(163, 163, 163, 0.2)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer focus:outline-none"
                  aria-label={showPassword ? "Hide passcode" : "Show passcode"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {pinError && <p className="text-xs text-rose-400 mt-2 font-medium">Incorrect PIN code. Please try again.</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-[1.02] cursor-pointer hover:brightness-110 active:scale-[0.98]"
              style={{ backgroundColor: primaryColor }}
            >
              Unlock Dashboard
            </button>
          </form>

          <div className="pt-4 border-t border-neutral-800">
            <button
              onClick={() => setActiveTab('home')}
              className="text-xs text-slate-400 font-semibold underline cursor-pointer transition-colors hover:text-white"
            >
              ← Return to Guest Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#070913] text-neutral-100 font-sans selection:bg-amber-500 selection:text-neutral-950 relative">
      
      {/* Toast Notification */}
      {saveToast && (
        <div 
          className="fixed bottom-6 right-6 z-[60] text-neutral-950 px-4 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-white/20 animate-bounce"
          style={{ backgroundColor: primaryColor }}
        >
          <CheckCircle2 className="w-4 h-4 text-neutral-950" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* STICKY LEFT SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-neutral-800/80 bg-[#0C0F1E] flex flex-col shrink-0 h-screen transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-neutral-800/80 flex flex-col gap-1.5 font-sans">
          <div 
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-widest self-start"
            style={{ 
              borderColor: `${primaryColor}40`, 
              backgroundColor: `${primaryColor}10`,
              color: primaryColor 
            }}
          >
            <ShieldCheck className="w-3 h-3" /> Secure Console
          </div>
          <h2 className="text-lg font-extrabold text-white tracking-tight mt-1 font-serif">CARICOM 2027</h2>
          <p className="text-[10px] text-neutral-400">Festival Administrative Control</p>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => {
              setActiveAdminTab('analytics');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminTab === 'analytics'
                ? 'text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
            style={activeAdminTab === 'analytics' ? { backgroundColor: primaryColor } : undefined}
          >
            <BarChart3 className="w-4 h-4" /> Analytics
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('submissions');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminTab === 'submissions'
                ? 'text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
            style={activeAdminTab === 'submissions' ? { backgroundColor: primaryColor } : undefined}
          >
            <span className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4" /> Received Forms
            </span>
            {submissions.length > 0 && (
              <span 
                className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                style={{
                  backgroundColor: activeAdminTab === 'submissions' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                  color: activeAdminTab === 'submissions' ? '#000000' : '#d4d4d4'
                }}
              >
                {submissions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('orders');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminTab === 'orders'
                ? 'text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
            style={activeAdminTab === 'orders' ? { backgroundColor: primaryColor } : undefined}
          >
            <span className="flex items-center gap-2.5">
              <Ticket className="w-4 h-4" /> Pass Orders
            </span>
            {submissions.filter(s => s.type === 'pass-order').length > 0 && (
              <span 
                className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                style={activeAdminTab === 'orders' ? { backgroundColor: 'rgba(0,0,0,0.25)', color: '#000000', borderColor: 'transparent' } : undefined}
              >
                {submissions.filter(s => s.type === 'pass-order').length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('branding');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminTab === 'branding'
                ? 'text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
            style={activeAdminTab === 'branding' ? { backgroundColor: primaryColor } : undefined}
          >
            <Palette className="w-4 h-4" /> Customizer Studio
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('page-images');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminTab === 'page-images'
                ? 'text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
            style={activeAdminTab === 'page-images' ? { backgroundColor: primaryColor } : undefined}
          >
            <Image className="w-4 h-4" /> Page Images Manager
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('events');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminTab === 'events'
                ? 'text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
            style={activeAdminTab === 'events' ? { backgroundColor: primaryColor } : undefined}
          >
            <Calendar className="w-4 h-4" /> Event Manager
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('gallery');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminTab === 'gallery'
                ? 'text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
            style={activeAdminTab === 'gallery' ? { backgroundColor: primaryColor } : undefined}
          >
            <Image className="w-4 h-4" /> Gallery Media
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('passes');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminTab === 'passes'
                ? 'text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
            style={activeAdminTab === 'passes' ? { backgroundColor: primaryColor } : undefined}
          >
            <Ticket className="w-4 h-4" /> Pass Manager
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('hotels');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminTab === 'hotels'
                ? 'text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
            style={activeAdminTab === 'hotels' ? { backgroundColor: primaryColor } : undefined}
          >
            <Hotel className="w-4 h-4" /> Recommended Hotels
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('testimonials');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminTab === 'testimonials'
                ? 'text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
            style={activeAdminTab === 'testimonials' ? { backgroundColor: primaryColor } : undefined}
          >
            <MessageSquare className="w-4 h-4" /> Testimonials
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('media');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminTab === 'media'
                ? 'text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
            style={activeAdminTab === 'media' ? { backgroundColor: primaryColor } : undefined}
          >
            <FolderOpen className="w-4 h-4" /> Media Library
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('system');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminTab === 'system'
                ? 'text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
            style={activeAdminTab === 'system' ? { backgroundColor: primaryColor } : undefined}
          >
            <Settings className="w-4 h-4" /> Operations
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('backup');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeAdminTab === 'backup'
                ? 'text-neutral-950 shadow-md font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
            style={activeAdminTab === 'backup' ? { backgroundColor: primaryColor } : undefined}
          >
            <Database className="w-4 h-4" /> Backup & Restore
          </button>
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-neutral-800/80 space-y-2">
          <button
            onClick={() => setActiveTab('home')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-slate-300 border border-neutral-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
            onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
            onMouseLeave={(e) => e.currentTarget.style.color = '#cbd5e1'}
          >
            ← Public Website
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-900/40 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-neutral-800/50 hover:border-rose-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" /> Close Console
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
             {/* TOP ACTION & TOOLBAR ROW */}
        <header className="h-16 border-b border-neutral-800 bg-[#0C0F1E]/50 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-neutral-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Workspace</span>
              <span className="text-neutral-600">/</span>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider truncate max-w-[120px] sm:max-w-none">
              {activeAdminTab === 'submissions' && 'Submissions Repository'}
              {activeAdminTab === 'orders' && 'Pass Orders & Reservations'}
              {activeAdminTab === 'branding' && 'Visual Identity Lab'}
              {activeAdminTab === 'analytics' && 'Analytics Dashboard'}
              {activeAdminTab === 'events' && 'Event Coordinator'}
              {activeAdminTab === 'gallery' && 'Curator Board'}
              {activeAdminTab === 'passes' && 'Ticketing Packages'}
              {activeAdminTab === 'hotels' && 'Partner Accommodations'}
              {activeAdminTab === 'media' && 'Asset & Media Library'}
              {activeAdminTab === 'system' && 'Infrastructure & Operations'}
              {activeAdminTab === 'testimonials' && 'Testimonials Manager'}
              {activeAdminTab === 'backup' && 'System Backup & Recovery'}
            </span>
          </div>

          {(activeAdminTab === 'submissions' || activeAdminTab === 'orders') && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => exportSubmissionsCSV(submissions.filter(s => activeAdminTab === 'orders' ? s.type === 'pass-order' : true))}
                className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-slate-300 hover:text-white font-bold text-[11px] uppercase tracking-wider rounded-lg border border-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Download spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Export CSV
              </button>

              <button
                onClick={() => {
                  if (activeAdminTab === 'orders') {
                    setNewSubForm(prev => ({ ...prev, type: 'pass-order' }));
                  }
                  setShowAddModal(true);
                }}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-[11px] uppercase tracking-wider rounded-lg transition-transform active:scale-[0.98] cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {activeAdminTab === 'orders' ? 'New Pass Order' : 'New Record'}
              </button>
            </div>
          )}

          {/* Persistent Real-Time Sync Controller */}
          <div className="flex items-center gap-2 bg-neutral-950/60 border border-neutral-800/80 px-3 py-1.5 rounded-xl text-xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="hidden md:inline text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest font-mono">
              Live DB
            </span>
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              title="Force sync entire application state with server"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE SCROLL CONTAINER */}
        <motion.main 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          key={activeAdminTab}
          className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl w-full mx-auto"
        >
          
          {/* HIGH-PRECISION REFINED KPI METRICS CARDS */}
          {activeAdminTab === 'submissions' && (
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0C0F1E] border border-neutral-800/85 rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[96px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Form Submissions</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-white font-mono">{totalCount}</span>
                  <span className="text-[10px] text-neutral-500 font-mono">records</span>
                </div>
              </div>

              <div className="bg-[#0C0F1E] border border-neutral-800/85 rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[96px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Pending Inquiries</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-rose-400 font-mono">{newCount}</span>
                  <span className="text-[10px] text-rose-500/80 font-medium font-mono">needs response</span>
                </div>
              </div>

              <div className="bg-[#0C0F1E] border border-neutral-800/85 rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[96px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Resolved / Approved</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-emerald-400 font-mono">{resolvedCount}</span>
                  <span className="text-[10px] text-emerald-500/80 font-mono font-medium">
                    {Math.round((resolvedCount / (totalCount || 1)) * 100)}% rate
                  </span>
                </div>
              </div>

              <div className="bg-[#0C0F1E] border border-neutral-800/85 rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[96px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">VIP Pass Revenue</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-white font-mono">£{totalRevenueGBP.toLocaleString()}</span>
                  <span className="text-[10px] text-neutral-500 font-mono">recorded</span>
                </div>
              </div>
            </section>
          )}

          {/* TAB 1: WORKSPACE SUBMISSIONS REPOSITORY */}
          {activeAdminTab === 'submissions' && (
            <div className="space-y-4">
              
              {/* FILTERS & SEARCH ROW */}
              <div className="bg-[#0C0F1E] border border-neutral-800/85 rounded-xl p-3 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
                {/* Clean Search Input */}
                <div className="relative w-full md:w-80">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by name, email, details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Refined Dropdowns */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3 h-3 text-neutral-400" />
                    <span className="text-[10px] text-neutral-400 font-bold uppercase font-sans">Form:</span>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-200 rounded-lg px-2 py-1.5 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="all">All Submissions ({submissions.length})</option>
                      <option value="contact">Contact Requests</option>
                      <option value="flight-registration">Flight Registrations</option>
                      <option value="pass-order">Pass Packages</option>
                      <option value="transport-request">Shuttle Requests</option>
                      <option value="newsletter">VIP newsletter</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase font-sans">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-200 rounded-lg px-2 py-1.5 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="new">New ({newCount})</option>
                      <option value="in-review">In Review ({inReviewCount})</option>
                      <option value="resolved">Resolved ({resolvedCount})</option>
                    </select>
                  </div>

                  <button
                    onClick={handleRefreshData}
                    disabled={isRefreshing}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-neutral-300 hover:text-amber-400 rounded-lg border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm text-[11px] font-semibold"
                    title="Refresh Data & Submissions"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh Data</span>
                  </button>
                </div>
              </div>

              {/* PROFESSIONAL SUBMISSIONS WORKSPACE */}
              {filteredSubmissions.length === 0 ? (
                <div className="bg-[#0C0F1E] border border-neutral-800/60 rounded-xl p-12 text-center space-y-4">
                  <FileSpreadsheet className="w-10 h-10 text-neutral-600 mx-auto" />
                  <h3 className="text-lg font-bold text-white font-serif">No Records Found</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed font-sans">
                    No results match your filter criteria or search query. Adjust filters above or reset to the default demo logs in the backup section.
                  </p>
                  <button
                    onClick={handleResetDemo}
                    className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-neutral-700 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                  >
                    Load Sample Records
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {selectedSubmissions.length > 0 && (
                    <div className="bg-[#12162E] border border-amber-500/30 p-3 px-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.05)]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400">
                          {selectedSubmissions.length} submission{selectedSubmissions.length > 1 ? 's' : ''} selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedSubmissions([])}
                          className="text-[10px] text-neutral-400 hover:text-white underline ml-2 cursor-pointer font-semibold"
                        >
                          Deselect All
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Mark Status:</span>
                        <button
                          onClick={() => handleBulkStatusChange('new')}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 rounded text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          New
                        </button>
                        <button
                          onClick={() => handleBulkStatusChange('in-review')}
                          className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 rounded text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          In Review
                        </button>
                        <button
                          onClick={() => handleBulkStatusChange('resolved')}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 rounded text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Resolved
                        </button>
                        <div className="h-4 w-px bg-neutral-800 mx-1" />
                        <button
                          onClick={handleBulkDeleteSubmissions}
                          className="px-2.5 py-1 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-500/30 rounded text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Bulk Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* DESKTOP TABULAR VIEW (Hidden on Mobile) */}
                  <div className="hidden md:block overflow-hidden rounded-xl border border-neutral-800 bg-[#0C0F1E] shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse font-sans text-xs">
                        <thead>
                          <tr className="border-b border-neutral-800/80 bg-neutral-950/40 text-neutral-400 font-extrabold uppercase tracking-widest text-[9px]">
                            <th className="py-3.5 px-4 w-[5%] text-center">
                              <input
                                type="checkbox"
                                checked={filteredSubmissions.length > 0 && filteredSubmissions.every(s => selectedSubmissions.includes(s.id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSubmissions(prev => {
                                      const newSelections = [...prev];
                                      filteredSubmissions.forEach(sub => {
                                        if (!newSelections.includes(sub.id)) newSelections.push(sub.id);
                                      });
                                      return newSelections;
                                    });
                                  } else {
                                    setSelectedSubmissions(prev => prev.filter(id => !filteredSubmissions.some(sub => sub.id === id)));
                                  }
                                }}
                                className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                              />
                            </th>
                            <th className="py-3.5 px-5 w-[20%]">Guest Name</th>
                            <th className="py-3.5 px-4 w-[15%]">Form Category</th>
                            <th className="py-3.5 px-4 w-[32%]">Details Summary</th>
                            <th className="py-3.5 px-4 w-[14%] text-center">Lifecycle Status</th>
                            <th className="py-3.5 px-5 w-[14%] text-right">Quick Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900">
                          {(() => {
                            const totalSubmissionPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE) || 1;
                            const paginatedSubmissions = filteredSubmissions.slice((submissionPage - 1) * ITEMS_PER_PAGE, submissionPage * ITEMS_PER_PAGE);

                            return paginatedSubmissions.map((sub) => {
                              const isExpanded = expandedSubId === sub.id;
                              const initials = sub.name 
                                ? sub.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
                                : 'AG';
                              
                              return (
                                <React.Fragment key={sub.id}>
                                  <tr 
                                    className={`group transition-all duration-150 cursor-pointer ${
                                      isExpanded 
                                        ? 'bg-neutral-900/60' 
                                        : 'hover:bg-neutral-800/30'
                                    }`}
                                    style={sub.status === 'new' ? { borderLeft: `3px solid ${primaryColor}` } : { borderLeft: '3px solid transparent' }}
                                    onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                                  >
                                    {/* Checkbox */}
                                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={selectedSubmissions.includes(sub.id)}
                                        onChange={() => {
                                          setSelectedSubmissions(prev => 
                                            prev.includes(sub.id) ? prev.filter(id => id !== sub.id) : [...prev, sub.id]
                                          );
                                        }}
                                        className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                                      />
                                    </td>
                                    {/* Guest Name & Time */}
                                    <td className="py-3 px-5">
                                      <div className="flex items-center gap-3">
                                        <div 
                                          className="w-7 h-7 rounded-full border flex items-center justify-center font-bold text-[10px] shrink-0"
                                          style={{ 
                                            borderColor: `${primaryColor}30`, 
                                            backgroundColor: `${primaryColor}08`,
                                            color: primaryColor 
                                          }}
                                        >
                                          {initials}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-bold text-white group-hover:text-neutral-200 transition-colors truncate">
                                            {sub.name || 'Anonymous Guest'}
                                          </div>
                                          <div className="text-[9px] text-neutral-500 font-mono mt-0.5">
                                            {new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Form Category */}
                                    <td className="py-3 px-4">
                                      {getTypeBadge(sub.type)}
                                    </td>

                                    {/* Details Summary */}
                                    <td className="py-3 px-4 min-w-0">
                                      <div className="flex flex-col gap-0.5">
                                        {sub.topicOrPass ? (
                                          <span className="font-bold text-neutral-200 truncate max-w-[240px]">
                                            {sub.topicOrPass}
                                          </span>
                                        ) : (
                                          <span className="text-neutral-500 italic">No specific topic</span>
                                        )}
                                        <span className="text-neutral-400 text-[11px] truncate max-w-[340px] font-normal">
                                          {sub.messageOrDetails || 'No additional message provided.'}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Lifecycle Status */}
                                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                      <span className="text-neutral-600 font-mono text-xs">—</span>
                                    </td>

                                    {/* Quick Actions */}
                                    <td className="py-3 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => setPreviewPdfSub(sub)}
                                          className="px-2 py-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                          title="Print / Export Pass & Wristband Badge PDF"
                                        >
                                          <Printer className="w-3 h-3 text-amber-400" /> Badge
                                        </button>
                                        <button
                                          onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                                          className="p-1 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-850 rounded border border-neutral-800 transition-colors cursor-pointer"
                                          title="Toggle details panel"
                                        >
                                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                          onClick={() => handleDelete(sub.id)}
                                          className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer border border-transparent hover:border-rose-500/20"
                                          title="Permanently remove record"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>

                                {/* COLLAPSIBLE DETAILS VIEW */}
                                {isExpanded && (
                                  <tr className="bg-neutral-950/40">
                                    <td colSpan={6} className="py-4 px-6 border-t border-neutral-900">
                                      <div className="space-y-4 animate-in slide-in-from-top-1 duration-150">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                          {/* Dossier Contact */}
                                          <div className="p-3.5 bg-[#0C0F1E] rounded-lg border border-neutral-800 space-y-2">
                                            <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block">Sender Dossier</span>
                                            <div className="space-y-1.5 text-xs">
                                              <div className="flex items-center gap-2">
                                                <span className="text-neutral-500 w-16 shrink-0">Name:</span>
                                                <span className="font-bold text-white">{sub.name || 'Anonymous Guest'}</span>
                                              </div>
                                              {sub.email && (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-neutral-500 w-16 shrink-0">Email:</span>
                                                  <a href={`mailto:${sub.email}`} className="text-neutral-300 hover:underline font-mono" style={{ color: primaryColor }}>{sub.email}</a>
                                                </div>
                                              )}
                                              {sub.phone && (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-neutral-500 w-16 shrink-0">Phone:</span>
                                                  <a href={`tel:${sub.phone}`} className="text-neutral-300 font-mono hover:underline">{sub.phone}</a>
                                                </div>
                                              )}
                                              {sub.amountGBP && (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-neutral-500 w-16 shrink-0">Pass Cost:</span>
                                                  <span className="text-emerald-400 font-bold font-mono">£{sub.amountGBP.toLocaleString()} GBP</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Telemetry metadata */}
                                          <div className="p-3.5 bg-[#0C0F1E] rounded-lg border border-neutral-800 space-y-2">
                                            <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block">Security Telemetry</span>
                                            <div className="space-y-1.5 text-xs">
                                              <div className="flex items-center gap-2">
                                                <span className="text-neutral-500 w-20 shrink-0">Timestamp:</span>
                                                <span className="text-neutral-300">{new Date(sub.submittedAt).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-neutral-500 w-20 shrink-0">Record ID:</span>
                                                <span className="font-mono text-neutral-400 text-[10px] select-all">{sub.id}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-neutral-500 w-20 shrink-0">Form Type:</span>
                                                <span className="font-bold uppercase text-[10px] text-neutral-300">{sub.type}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Main Message Body */}
                                        <div className="p-4 bg-[#0C0F1E] rounded-lg border border-neutral-800 space-y-2">
                                          <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block">Message / Inquiry Details</span>
                                          <p className="text-neutral-200 bg-neutral-950 p-3 rounded border border-neutral-900 leading-relaxed text-xs">
                                            {sub.messageOrDetails || 'No text content provided.'}
                                          </p>
                                        </div>

                                        {/* Concierge Sent Replies Thread */}
                                        {sub.replies && sub.replies.length > 0 && (
                                          <div className="p-4 bg-[#0C0F1E] rounded-lg border border-amber-500/30 space-y-3">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5 font-mono">
                                                <Send className="w-3.5 h-3.5 text-amber-400" /> Executive Concierge Reply Thread ({sub.replies.length})
                                              </span>
                                              <button
                                                onClick={() => setReplyingSub(sub)}
                                                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded border border-amber-500/30 cursor-pointer flex items-center gap-1 transition-all"
                                              >
                                                <Send className="w-2.5 h-2.5" /> Send Follow-up Reply
                                              </button>
                                            </div>
                                            <div className="space-y-2">
                                              {sub.replies.map((reply) => (
                                                <div key={reply.id} className="p-3 bg-neutral-950/80 rounded-lg border border-neutral-800 space-y-1 text-xs">
                                                  <div className="flex items-center justify-between text-[10px] pb-1 border-b border-neutral-900">
                                                    <span className="font-bold text-amber-300 flex items-center gap-1">
                                                      <ShieldCheck className="w-3 h-3 text-amber-400" /> {reply.sentBy || 'Festival Concierge'}
                                                      {reply.method && (
                                                        <span className="text-[9px] font-normal text-neutral-500 uppercase px-1.5 py-0.2 bg-neutral-900 rounded border border-neutral-800">
                                                          {reply.method}
                                                        </span>
                                                      )}
                                                    </span>
                                                    <span className="font-mono text-neutral-500">
                                                      {new Date(reply.sentAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                  </div>
                                                  <p className="text-neutral-200 whitespace-pre-wrap pt-1 text-xs leading-relaxed font-sans">
                                                    {reply.message}
                                                  </p>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Structured Parameters */}
                                        {sub.extraDetails && Object.keys(sub.extraDetails).length > 0 && (
                                          <div className="p-4 bg-[#0C0F1E] rounded-lg border border-neutral-800 space-y-2.5">
                                            <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block">Form Submission Parameters</span>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                              {Object.entries(sub.extraDetails).map(([key, val]) => (
                                                <div key={key} className="bg-neutral-950 border border-neutral-900 p-2.5 rounded">
                                                  <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">{key}</span>
                                                  <span className="font-bold text-xs text-neutral-200 block truncate mt-0.5">{val}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* PROCESSING & ACTION PANEL */}
                                        <div className="p-4 bg-[#0C0F1E] rounded-lg border border-neutral-800/80 space-y-3">
                                          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block font-mono">Inquiry Processing & Actions</span>
                                          <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-950 p-3.5 rounded-xl border border-neutral-900/60">
                                            <div className="flex items-center gap-3">
                                              <span className="text-xs text-neutral-400 font-medium font-mono">Lifecycle Status:</span>
                                              <div className="flex items-center gap-2">
                                                {getStatusBadge(sub.status)}
                                                <select
                                                  value={sub.status}
                                                  onChange={(e) => handleStatusChange(sub.id, e.target.value as any)}
                                                  className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-bold hover:text-white rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                                                >
                                                  <option value="new">New</option>
                                                  <option value="in-review">In Review</option>
                                                  <option value="resolved">Resolved</option>
                                                </select>
                                              </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => setReplyingSub(sub)}
                                                className="px-3.5 py-1.5 text-xs font-bold text-neutral-950 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 hover:brightness-110 shadow-sm"
                                                style={{ backgroundColor: primaryColor }}
                                                title="Send official guest reply"
                                              >
                                                <Send className="w-3.5 h-3.5" /> Reply to Guest
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          });
                        })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* MOBILE POLISHED LIST VIEW (Hidden on Desktop) */}
                  <div className="block md:hidden space-y-3">
                    {(() => {
                      const totalSubmissionPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE) || 1;
                      const paginatedSubmissions = filteredSubmissions.slice((submissionPage - 1) * ITEMS_PER_PAGE, submissionPage * ITEMS_PER_PAGE);

                      return paginatedSubmissions.map((sub) => {
                        const isExpanded = expandedSubId === sub.id;
                        const initials = sub.name 
                          ? sub.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
                          : 'AG';

                        return (
                          <div 
                            key={sub.id} 
                            className="bg-[#0C0F1E] border border-neutral-800 rounded-xl overflow-hidden shadow-md"
                            style={sub.status === 'new' ? { borderLeft: `3px solid ${primaryColor}` } : undefined}
                          >
                            {/* Header section */}
                            <div className="p-4 space-y-3 cursor-pointer" onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={selectedSubmissions.includes(sub.id)}
                                    onChange={() => {
                                      setSelectedSubmissions(prev => 
                                        prev.includes(sub.id) ? prev.filter(id => id !== sub.id) : [...prev, sub.id]
                                      );
                                    }}
                                    className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                                  />
                                  {getTypeBadge(sub.type)}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-[10px]"
                                  style={{ 
                                    borderColor: `${primaryColor}30`, 
                                    backgroundColor: `${primaryColor}08`,
                                    color: primaryColor 
                                  }}
                                >
                                  {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-white truncate">{sub.name || 'Anonymous Guest'}</h4>
                                  <span className="text-[9px] text-neutral-500 block mt-0.5">
                                    {new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>

                              {sub.topicOrPass && (
                                <div className="text-neutral-200 font-bold text-xs truncate">
                                  Topic: {sub.topicOrPass}
                                </div>
                              )}

                              {/* Mobile action bar */}
                              <div className="flex items-center justify-between pt-2 border-t border-neutral-900/60" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1.5">
                                  {/* Empty left side placeholder as status is hidden */}
                                  <span className="text-neutral-600 font-mono text-xs">—</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setPreviewPdfSub(sub)}
                                    className="p-1 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded cursor-pointer"
                                    title="Pass / Badge Studio"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                                  </button>
                                  <button
                                    onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                                    className="p-1 text-neutral-400 bg-neutral-900 border border-neutral-800 rounded"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(sub.id)}
                                    className="p-1 text-neutral-500 hover:text-rose-400 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Collapsible body */}
                            {isExpanded && (
                              <div className="p-4 bg-neutral-950/60 border-t border-neutral-900 space-y-3 text-xs font-sans">
                                {sub.email && (
                                  <div className="flex justify-between items-center bg-neutral-900/40 p-2 rounded">
                                    <span className="text-neutral-500 font-medium">Email</span>
                                    <a href={`mailto:${sub.email}`} className="font-mono" style={{ color: primaryColor }}>{sub.email}</a>
                                  </div>
                                )}
                                {sub.phone && (
                                  <div className="flex justify-between items-center bg-neutral-900/40 p-2 rounded">
                                    <span className="text-neutral-500 font-medium">Phone</span>
                                    <a href={`tel:${sub.phone}`} className="font-mono text-neutral-200">{sub.phone}</a>
                                  </div>
                                )}
                                
                                <div className="bg-neutral-900/40 p-2.5 rounded space-y-1">
                                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold block">Inquiry / Request details:</span>
                                  <p className="text-neutral-200 leading-relaxed font-sans mt-0.5">
                                    {sub.messageOrDetails || 'No text content provided.'}
                                  </p>
                                </div>

                                {sub.replies && sub.replies.length > 0 && (
                                  <div className="bg-[#0C0F1E] border border-amber-500/30 p-3 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                                        <Send className="w-3 h-3" /> Replies Sent ({sub.replies.length})
                                      </span>
                                      <button
                                        onClick={() => setReplyingSub(sub)}
                                        className="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30"
                                      >
                                        Reply
                                      </button>
                                    </div>
                                    <div className="space-y-1.5">
                                      {sub.replies.map((reply) => (
                                        <div key={reply.id} className="p-2 bg-neutral-950 rounded border border-neutral-850 text-[11px] space-y-1">
                                          <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                                            <span>{reply.sentBy || 'Concierge'}</span>
                                            <span>{new Date(reply.sentAt).toLocaleDateString('en-GB')}</span>
                                          </div>
                                          <p className="text-neutral-300 leading-snug whitespace-pre-wrap">{reply.message}</p>
                                          {reply.attachment && (
                                            <div className="mt-1 bg-amber-500/10 border border-amber-500/30 p-1.5 rounded flex items-center justify-between gap-2 text-[10px]">
                                              <div className="flex items-center gap-1 text-amber-300 font-mono font-bold truncate">
                                                <Paperclip className="w-3 h-3 text-amber-400 shrink-0" />
                                                <span className="truncate">{reply.attachment.name}</span>
                                              </div>
                                              <button
                                                onClick={() => setPreviewPdfSub(sub)}
                                                className="px-2 py-0.5 bg-amber-500 text-neutral-950 font-bold text-[9px] rounded shrink-0 cursor-pointer hover:bg-amber-400"
                                              >
                                                View PDF
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {sub.extraDetails && Object.keys(sub.extraDetails).length > 0 && (
                                  <div className="space-y-1.5 pt-1">
                                    <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">Structured metadata:</span>
                                    <div className="grid grid-cols-2 gap-2">
                                      {Object.entries(sub.extraDetails).map(([key, val]) => (
                                        <div key={key} className="bg-[#0C0F1E] border border-neutral-800/60 p-2 rounded">
                                          <span className="text-[8px] text-neutral-500 uppercase tracking-wider block">{key}</span>
                                          <span className="font-bold text-[10px] text-neutral-200 block truncate mt-0.5">{val}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Compact Mobile Processing Desk */}
                                <div className="bg-[#0C0F1E] border border-neutral-800 p-3 rounded-lg space-y-2.5">
                                  <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block font-mono">Inquiry Processing & Actions</span>
                                  <div className="flex flex-col gap-2.5 bg-neutral-950 p-2.5 rounded-lg border border-neutral-900/60">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] text-neutral-400 font-medium">Status:</span>
                                      <div className="flex items-center gap-1.5">
                                        {getStatusBadge(sub.status)}
                                        <select
                                          value={sub.status}
                                          onChange={(e) => handleStatusChange(sub.id, e.target.value as any)}
                                          className="bg-neutral-900 border border-neutral-850 text-[10px] text-neutral-300 font-bold rounded-md px-1.5 py-0.5 cursor-pointer focus:outline-none"
                                        >
                                          <option value="new">New</option>
                                          <option value="in-review">In Review</option>
                                          <option value="resolved">Resolved</option>
                                        </select>
                                      </div>
                                    </div>
                                    
                                    <button
                                      onClick={() => setReplyingSub(sub)}
                                      className="w-full py-1.5 text-[10px] font-bold text-neutral-950 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 hover:brightness-110"
                                      style={{ backgroundColor: primaryColor }}
                                    >
                                      <Send className="w-3 h-3" /> Reply to Guest
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Submissions Pagination Bar */}
                  {Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE) > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0C0F1E] border border-neutral-800 p-4 rounded-xl text-xs font-sans">
                      <div className="text-neutral-400">
                        Showing <span className="text-white font-bold">{((submissionPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="text-white font-bold">{Math.min(submissionPage * ITEMS_PER_PAGE, filteredSubmissions.length)}</span> of <span className="text-white font-bold">{filteredSubmissions.length}</span> submissions
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <button
                          onClick={() => setSubmissionPage(p => Math.max(1, p - 1))}
                          disabled={submissionPage === 1}
                          className="p-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 rounded-lg cursor-pointer transition-colors"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-amber-400 font-bold">
                          {submissionPage} / {Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE)}
                        </span>
                        <button
                          onClick={() => setSubmissionPage(p => Math.min(Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE), p + 1))}
                          disabled={submissionPage === Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE)}
                          className="p-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 rounded-lg cursor-pointer transition-colors"
                          title="Next page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* TAB: DEDICATED PASS ORDERS & GUEST DOSSIERS */}
          {activeAdminTab === 'orders' && (
            <div className="space-y-6">
              {/* KPI Metrics Bar for Pass Orders */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0C0F1E] border border-neutral-800/85 rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[96px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5" /> Total Pass Orders
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-white font-mono">
                      {submissions.filter(s => s.type === 'pass-order').length}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">purchases</span>
                  </div>
                </div>

                <div className="bg-[#0C0F1E] border border-neutral-800/85 rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[96px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Total Gross Revenue
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      £{submissions.filter(s => s.type === 'pass-order').reduce((acc, s) => acc + (s.amountGBP || 0), 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">GBP</span>
                  </div>
                </div>

                <div className="bg-[#0C0F1E] border border-neutral-800/85 rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[96px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block flex items-center gap-1">
                    <Plane className="w-3.5 h-3.5" /> Linked Flight Regs
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-sky-400 font-mono">
                      {submissions.filter(s => s.type === 'pass-order' && getGuestProfileByEmail(s.email)?.hasFlightDetails).length}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">with flight details</span>
                  </div>
                </div>

                <div className="bg-[#0C0F1E] border border-neutral-800/85 rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[96px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Action Required
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-purple-400 font-mono">
                      {submissions.filter(s => s.type === 'pass-order' && s.status !== 'resolved').length}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">unresolved</span>
                  </div>
                </div>
              </section>

              {/* Filters Bar */}
              <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by Guest Name, Email, Order Ref, Pass Title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer font-bold"
                  >
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Confirmed / Paid</option>
                    <option value="in-review">In Review</option>
                    <option value="new">New</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Pass Orders List */}
              {(() => {
                const passOrdersList = submissions.filter(s => {
                  if (s.type !== 'pass-order') return false;
                  
                  // Status filter
                  if (statusFilter !== 'all') {
                    if (statusFilter === 'confirmed' && s.status !== 'resolved' && s.status !== 'confirmed') return false;
                    if (statusFilter !== 'confirmed' && s.status !== statusFilter) return false;
                  }

                  // Search query filter
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const name = (s.name || '').toLowerCase();
                    const email = (s.email || '').toLowerCase();
                    const pass = (s.topicOrPass || '').toLowerCase();
                    const ref = (s.extraDetails?.OrderRef || s.extraDetails?.Reference || '').toLowerCase();
                    return name.includes(q) || email.includes(q) || pass.includes(q) || ref.includes(q);
                  }

                  return true;
                });

                if (passOrdersList.length === 0) {
                  return (
                    <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-12 text-center space-y-3">
                      <Ticket className="w-10 h-10 text-neutral-600 mx-auto" />
                      <h3 className="text-base font-bold text-neutral-300">No Pass Orders Found</h3>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                        No pass purchases match your current search query or filter settings.
                      </p>
                    </div>
                  );
                }

                const totalOrderPages = Math.ceil(passOrdersList.length / ITEMS_PER_PAGE) || 1;
                const paginatedOrders = passOrdersList.slice((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE);

                return (
                  <div className="space-y-4">
                    {/* Minimal Desktop Table */}
                    <div className="hidden md:block overflow-hidden bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl shadow-md">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-850 bg-neutral-950/50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            <th className="p-4 pl-6">Reference</th>
                            <th className="p-4">Guest</th>
                            <th className="p-4">Pass / Package</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900 text-xs">
                          {paginatedOrders.map((order) => {
                            const ref = order.extraDetails?.OrderRef || order.extraDetails?.Reference || `ORDER-${order.id}`;
                            const isConfirmed = order.status === 'resolved';
                            return (
                              <tr 
                                key={order.id}
                                onClick={() => setSelectedOrderId(order.id)}
                                className="hover:bg-neutral-900/30 transition-colors cursor-pointer group"
                              >
                                <td className="p-4 pl-6 font-mono font-bold text-amber-400">
                                  {ref}
                                </td>
                                <td className="p-4">
                                  <div className="font-bold text-white group-hover:text-amber-300 transition-colors">{order.name}</div>
                                  <div className="text-[10px] text-neutral-500 font-mono">{order.email}</div>
                                </td>
                                <td className="p-4 truncate max-w-[180px]">
                                  <div className="font-semibold text-neutral-300 truncate">{order.topicOrPass}</div>
                                  {order.submittedAt && (
                                    <div className="text-[9px] text-neutral-500">
                                      {new Date(order.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-right font-bold text-emerald-400 font-mono">
                                  {order.extraDetails?.TotalPaid || `£${order.amountGBP || 0}`}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                                    isConfirmed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    order.status === 'in-review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                  }`}>
                                    <span className="w-1 h-1 rounded-full bg-current" />
                                    {isConfirmed ? 'CONFIRMED' : order.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedOrderId(order.id);
                                    }}
                                    className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 font-extrabold text-[10px] uppercase tracking-wider rounded-lg border border-amber-500/20 transition-all cursor-pointer"
                                  >
                                    View Dossier
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Minimal Mobile Card List */}
                    <div className="grid grid-cols-1 gap-3 md:hidden">
                      {paginatedOrders.map((order) => {
                        const ref = order.extraDetails?.OrderRef || order.extraDetails?.Reference || `ORDER-${order.id}`;
                        const isConfirmed = order.status === 'resolved';
                        return (
                          <div
                            key={order.id}
                            onClick={() => setSelectedOrderId(order.id)}
                            className="bg-[#0C0F1E] border border-neutral-800/80 hover:border-amber-500/30 rounded-xl p-4 space-y-3 cursor-pointer transition-all active:scale-[0.99]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase font-mono text-amber-400">
                                {ref}
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono ${
                                isConfirmed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                order.status === 'in-review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              }`}>
                                {isConfirmed ? 'CONFIRMED' : order.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="space-y-0.5">
                              <h4 className="font-bold text-sm text-white">{order.name}</h4>
                              <p className="text-[11px] text-neutral-400 truncate">{order.topicOrPass}</p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-neutral-900">
                              <span className="text-[11px] text-neutral-500">
                                {new Date(order.submittedAt).toLocaleDateString('en-GB')}
                              </span>
                              <span className="font-bold text-xs text-emerald-400 font-mono">
                                {order.extraDetails?.TotalPaid || `£${order.amountGBP || 0}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pass Orders Pagination Bar */}
                    {totalOrderPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0C0F1E] border border-neutral-800 p-4 rounded-xl text-xs font-sans">
                        <div className="text-neutral-400">
                          Showing <span className="text-white font-bold">{((ordersPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="text-white font-bold">{Math.min(ordersPage * ITEMS_PER_PAGE, passOrdersList.length)}</span> of <span className="text-white font-bold">{passOrdersList.length}</span> pass orders
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <button
                            onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                            disabled={ordersPage === 1}
                            className="p-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 rounded-lg cursor-pointer transition-colors"
                            title="Previous page"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="px-3 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-amber-400 font-bold">
                            {ordersPage} / {totalOrderPages}
                          </span>
                          <button
                            onClick={() => setOrdersPage(p => Math.min(totalOrderPages, p + 1))}
                            disabled={ordersPage === totalOrderPages}
                            className="p-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 rounded-lg cursor-pointer transition-colors"
                            title="Next page"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: VISUAL IDENTITY CUSTOMIZER STUDIO */}
          {activeAdminTab === 'branding' && (
            <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl p-6 md:p-8 space-y-8 shadow-xl font-sans">
              
              {/* Studio Top Header */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-neutral-800/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                      Design & Theme Studio
                    </span>
                    <span className="text-neutral-600 text-[10px]">•</span>
                    <span className="text-neutral-400 text-[10px] font-mono">v2.4 Production Engine</span>
                  </div>
                  <h2 className="text-2xl font-black text-white font-serif tracking-tight">Customizer Studio</h2>
                  <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
                    Tailor your festival website identity in real time. Manage homepage background slideshow photos, typography, announcement alerts, and social links.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] uppercase font-black tracking-wider select-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Sync Active</span>
                  </div>

                  <button
                    onClick={handleSaveConfig}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Configuration
                  </button>
                </div>
              </div>

              {/* Sub-Tab Navigation Bar */}
              <div className="flex flex-wrap items-center gap-2 bg-neutral-950/80 p-1.5 rounded-2xl border border-neutral-800/80">
                {[
                  {
                    id: 'identity',
                    label: 'App Name & Logo',
                    icon: Palmtree,
                    badge: siteConfig.appLogoUrl ? 'Custom Logo' : 'Icon Logo'
                  },
                  {
                    id: 'hero',
                    label: 'Hero Backgrounds',
                    icon: Image,
                    badge: `${Math.min(siteConfig.hero?.displayCount || 5, siteConfig.hero?.images?.length || 5)} Active`
                  },
                  {
                    id: 'brand',
                    label: 'Fonts',
                    icon: Type,
                    badge: 'Typography'
                  },
                  {
                    id: 'banner',
                    label: 'Announcement Banner',
                    icon: Sparkles,
                    badge: siteConfig.banner?.enabled ? 'ON' : 'OFF'
                  },
                  {
                    id: 'social',
                    label: 'Socials & Helplines',
                    icon: Share2,
                    badge: 'Links'
                  },
                  {
                    id: 'presets',
                    label: 'Theme Presets',
                    icon: Palette,
                    badge: 'Instant Looks'
                  },
                  {
                    id: 'elements',
                    label: 'UI Elements Style',
                    icon: Settings,
                    badge: `${siteConfig.branding.buttonStyle || 'rounded'} / ${siteConfig.branding.cardStyle || 'glassy'}`
                  }
                ].map((tab) => {
                  const IconComp = tab.icon;
                  const isActive = customizerSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCustomizerSubTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-neutral-950 shadow-md font-extrabold'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900/80'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 ${isActive ? 'text-neutral-950' : 'text-amber-400'}`} />
                      <span>{tab.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        isActive
                          ? 'bg-neutral-950/20 text-neutral-950'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                      }`}>
                        {tab.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* SUB-TAB 0: APP IDENTITY & LOGO MANAGER */}
              {customizerSubTab === 'identity' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Header Banner */}
                  <div className="bg-neutral-950/60 border border-neutral-800/80 p-6 rounded-2xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
                          <Palmtree className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-white font-serif">Application Name, Logo & Branding</h3>
                          <p className="text-xs text-neutral-400">
                            Customize the public branding, header logo, festival title, and taglines displayed across the entire website.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          saveSiteConfig(siteConfig);
                          setSaveToast('Application identity settings saved successfully!');
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Column 1: App Identity Text Controls */}
                    <div className="space-y-6">
                      {/* App Title & Subtitle Card */}
                      <div className="bg-neutral-950/60 border border-neutral-800/80 p-5 rounded-2xl space-y-4">
                        <span className="text-xs font-black uppercase text-amber-400 tracking-wider block">
                          1. Brand Names & Titles
                        </span>

                        {/* Application Name */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-white flex items-center justify-between">
                            <span>Main Application / Festival Name</span>
                            <span className="text-[10px] text-neutral-500 font-mono">Navbar & Brand Header</span>
                          </label>
                          <input
                            type="text"
                            value={siteConfig.appName || 'Grenada CARICOM Festival 2027'}
                            onChange={(e) => {
                              const updated = { ...siteConfig, appName: e.target.value };
                              setSiteConfigState(updated);
                              saveSiteConfig(updated);
                            }}
                            placeholder="e.g. Grenada CARICOM Festival 2027"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 focus:outline-none font-medium"
                          />
                          <p className="text-[10px] text-neutral-500">
                            Appears in header navigation bar and footer brand header.
                          </p>
                        </div>

                        {/* Subtitle / Category Badge */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-white flex items-center justify-between">
                            <span>Category Subtitle / Header Eyebrow</span>
                            <span className="text-[10px] text-neutral-500 font-mono">Small Uppercase Label</span>
                          </label>
                          <input
                            type="text"
                            value={siteConfig.appSubtitle || 'CARICOM FESTIVAL'}
                            onChange={(e) => {
                              const updated = { ...siteConfig, appSubtitle: e.target.value };
                              setSiteConfigState(updated);
                              saveSiteConfig(updated);
                            }}
                            placeholder="e.g. CARICOM FESTIVAL"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-amber-400 font-mono font-bold uppercase focus:border-amber-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-neutral-500">
                            Appears as small gold uppercase label above the app name in header and footer.
                          </p>
                        </div>

                        {/* Year / Badge Text */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-white flex items-center justify-between">
                            <span>Year / Event Edition Badge</span>
                            <span className="text-[10px] text-neutral-500 font-mono">Highlight Badge</span>
                          </label>
                          <input
                            type="text"
                            value={siteConfig.appYearBadge || '2027'}
                            onChange={(e) => {
                              const updated = { ...siteConfig, appYearBadge: e.target.value };
                              setSiteConfigState(updated);
                              saveSiteConfig(updated);
                            }}
                            placeholder="e.g. 2027"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        {/* Tagline / Intro Description */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-white flex items-center justify-between">
                            <span>Primary Brand Tagline</span>
                            <span className="text-[10px] text-neutral-500 font-mono">Hero & Footer Description</span>
                          </label>
                          <textarea
                            rows={3}
                            value={siteConfig.appTagline || "Where London's top DJs & revelers unite with Grenada's tropical warmth. A 10-day luxury festival of Caribbean culture, music, beach fetes, and river tubing."}
                            onChange={(e) => {
                              const updated = { ...siteConfig, appTagline: e.target.value };
                              setSiteConfigState(updated);
                              saveSiteConfig(updated);
                            }}
                            placeholder="Describe your festival or application tagline..."
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 focus:outline-none font-light leading-relaxed resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Logo Manager & Live Preview */}
                    <div className="space-y-6">
                      {/* Custom Logo Card */}
                      <div className="bg-neutral-950/60 border border-neutral-800/80 p-5 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-amber-400 tracking-wider block">
                            2. Application Logo & Icon
                          </span>
                          {siteConfig.appLogoUrl ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold rounded-full">
                              CUSTOM LOGO ACTIVE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold rounded-full">
                              VECTOR ICON ACTIVE
                            </span>
                          )}
                        </div>

                        {/* Current Logo Preview Box */}
                        <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-amber-500/40 flex items-center justify-center overflow-hidden shadow-inner p-1">
                              {siteConfig.appLogoUrl ? (
                                <img
                                  src={siteConfig.appLogoUrl}
                                  alt="Current Application Logo"
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                (() => {
                                  const iconName = siteConfig.appLogoIcon || 'Palmtree';
                                  const ic = "w-7 h-7 text-amber-400";
                                  if (iconName === 'Sparkles') return <Sparkles className={ic} />;
                                  if (iconName === 'Crown') return <Crown className={ic} />;
                                  if (iconName === 'Sun') return <Sun className={ic} />;
                                  if (iconName === 'Flame') return <Flame className={ic} />;
                                  if (iconName === 'Music') return <Music className={ic} />;
                                  if (iconName === 'Globe') return <Globe className={ic} />;
                                  if (iconName === 'Shield') return <Shield className={ic} />;
                                  if (iconName === 'Compass') return <Compass className={ic} />;
                                  return <Palmtree className={ic} />;
                                })()
                              )}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white block">Active Logo Graphic</span>
                              <span className="text-[10px] text-neutral-400 block font-mono">
                                {siteConfig.appLogoUrl ? 'Uploaded Graphic Image' : `Vector Icon: ${siteConfig.appLogoIcon || 'Palmtree'}`}
                              </span>
                            </div>
                          </div>

                          {/* Reset Button */}
                          {siteConfig.appLogoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = { ...siteConfig, appLogoUrl: '' };
                                setSiteConfigState(updated);
                                saveSiteConfig(updated);
                                setSaveToast('Reverted custom logo image to vector icon.');
                              }}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3 text-rose-400" />
                              <span>Reset to Icon</span>
                            </button>
                          )}
                        </div>

                        {/* Upload & Media Library Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Choose from Media Library */}
                          <button
                            type="button"
                            onClick={() => setMediaSelectorTarget('logo')}
                            className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            <Image className="w-4 h-4 text-amber-400" />
                            <span>Select from Media Library</span>
                          </button>

                          {/* Upload New File */}
                          <label className="py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-amber-500/50 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer">
                            <Upload className="w-4 h-4 text-emerald-400" />
                            <span>Upload Image File</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  let resultUrl = '';
                                  let resultCompSize = file.size;
                                  let resultFileType = file.type || 'image/png';
                                  const serverRes = await uploadFileToServer(file);
                                  if (serverRes && serverRes.url) {
                                    resultUrl = serverRes.url;
                                    resultCompSize = serverRes.size;
                                    resultFileType = serverRes.type || resultFileType;
                                  } else {
                                    const comp = await compressImage(file, 600, 0.85);
                                    resultUrl = comp.compressedUrl;
                                    resultCompSize = comp.compressedSize;
                                  }
                                  const newItem: MediaItem = {
                                    id: `media-logo-${Date.now()}`,
                                    name: file.name || 'app-logo.png',
                                    url: resultUrl,
                                    originalSize: file.size,
                                    compressedSize: resultCompSize,
                                    type: resultFileType,
                                    uploadedAt: new Date().toISOString()
                                  };
                                  await addMediaItem(newItem);
                                  const updatedConfig = { ...siteConfig, appLogoUrl: resultUrl };
                                  setSiteConfigState(updatedConfig);
                                  saveSiteConfig(updatedConfig);
                                  setSaveToast('Uploaded, placed in Media Library, and updated logo!');
                                } catch (err) {
                                  console.error('Logo upload error:', err);
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* Vector Icon Fallback Selector */}
                        <div className="pt-2 space-y-2 border-t border-neutral-800/80">
                          <span className="text-[11px] font-bold text-neutral-300 block">
                            Or Select Vector Icon Logo:
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                            {[
                              { name: 'Palmtree', icon: Palmtree },
                              { name: 'Sparkles', icon: Sparkles },
                              { name: 'Crown', icon: Crown },
                              { name: 'Sun', icon: Sun },
                              { name: 'Flame', icon: Flame },
                              { name: 'Music', icon: Music },
                              { name: 'Globe', icon: Globe },
                              { name: 'Shield', icon: Shield },
                              { name: 'Compass', icon: Compass },
                            ].map((item) => {
                              const IconComp = item.icon;
                              const isSelected = !siteConfig.appLogoUrl && (siteConfig.appLogoIcon || 'Palmtree') === item.name;
                              return (
                                <button
                                  key={item.name}
                                  type="button"
                                  onClick={() => {
                                    const updated = {
                                      ...siteConfig,
                                      appLogoIcon: item.name as any,
                                      appLogoUrl: '' // clear image logo to reveal icon
                                    };
                                    setSiteConfigState(updated);
                                    saveSiteConfig(updated);
                                    setSaveToast(`Set logo icon to ${item.name}!`);
                                  }}
                                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow'
                                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                                  }`}
                                  title={item.name}
                                >
                                  <IconComp className={`w-4 h-4 ${isSelected ? 'text-neutral-950' : 'text-amber-400'}`} />
                                  <span className="text-[9px] font-mono leading-none truncate max-w-full">{item.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Custom Favicon Card */}
                      <div className="bg-neutral-950/60 border border-neutral-800/80 p-5 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-amber-400 tracking-wider block">
                            3. Site Favicon Management
                          </span>
                          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold rounded-full">
                            FAVICON SETTINGS
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                          The Favicon is the icon displayed in the browser tab. You can select any image from the media library or upload a custom favicon file.
                        </p>

                        {/* Current Favicon Preview Box */}
                        <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-amber-500/40 flex items-center justify-center overflow-hidden shadow-inner p-1">
                              <img
                                src={siteConfig.appFaviconUrl || '/src/assets/images/favicon_icon_1786434632871.jpg'}
                                alt="Current Favicon"
                                className="w-full h-full object-cover rounded-xl"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white block">Active Favicon Icon</span>
                              <span className="text-[10px] text-neutral-400 block font-mono truncate max-w-[150px]">
                                {siteConfig.appFaviconUrl ? 'Custom Favicon Active' : 'Default Gold Palm Favicon'}
                              </span>
                            </div>
                          </div>

                          {/* Reset Button */}
                          {siteConfig.appFaviconUrl && siteConfig.appFaviconUrl !== '/src/assets/images/favicon_icon_1786434632871.jpg' && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = { ...siteConfig, appFaviconUrl: '/src/assets/images/favicon_icon_1786434632871.jpg' };
                                setSiteConfigState(updated);
                                saveSiteConfig(updated);
                                setSaveToast('Reverted custom favicon to default gold palm tree icon.');
                              }}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3 text-rose-400" />
                              <span>Reset to Default</span>
                            </button>
                          )}
                        </div>

                        {/* Upload & Media Library Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Choose from Media Library */}
                          <button
                            type="button"
                            onClick={() => setMediaSelectorTarget('favicon')}
                            className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            <Image className="w-4 h-4 text-amber-400" />
                            <span>Select from Media Library</span>
                          </button>

                          {/* Upload New File */}
                          <label className="py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-amber-500/50 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer">
                            <Upload className="w-4 h-4 text-emerald-400" />
                            <span>Upload Favicon</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  let resultUrl = '';
                                  let resultCompSize = file.size;
                                  let resultFileType = file.type || 'image/png';
                                  const serverRes = await uploadFileToServer(file);
                                  if (serverRes && serverRes.url) {
                                    resultUrl = serverRes.url;
                                    resultCompSize = serverRes.size;
                                    resultFileType = serverRes.type || resultFileType;
                                  } else {
                                    const comp = await compressImage(file, 128, 0.8);
                                    resultUrl = comp.compressedUrl;
                                    resultCompSize = comp.compressedSize;
                                  }
                                  const newItem: MediaItem = {
                                    id: `media-favicon-${Date.now()}`,
                                    name: file.name || 'favicon.png',
                                    url: resultUrl,
                                    originalSize: file.size,
                                    compressedSize: resultCompSize,
                                    type: resultFileType,
                                    uploadedAt: new Date().toISOString()
                                  };
                                  await addMediaItem(newItem);
                                  const updatedConfig = { ...siteConfig, appFaviconUrl: resultUrl };
                                  setSiteConfigState(updatedConfig);
                                  saveSiteConfig(updatedConfig);
                                  setSaveToast('Uploaded, saved to Media Library, and updated Favicon!');
                                } catch (err) {
                                  console.error('Favicon upload error:', err);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Live Brand Header Navigation Preview Box */}
                      <div className="bg-neutral-950/60 border border-amber-500/20 p-5 rounded-2xl space-y-3">
                        <span className="text-xs font-black uppercase text-amber-400 tracking-wider block">
                          3. Live Header Navigation Preview
                        </span>
                        <div className="p-4 bg-neutral-950/90 rounded-2xl border border-amber-500/30 flex items-center justify-between shadow-xl overflow-hidden">
                          <div className="flex items-center gap-3">
                            {siteConfig.appLogoUrl ? (
                              <img
                                src={siteConfig.appLogoUrl}
                                alt="Logo Preview"
                                className="w-10 h-10 object-cover rounded-xl border border-amber-500/40"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-amber-500/40 flex items-center justify-center text-amber-400">
                                {(() => {
                                  const iconName = siteConfig.appLogoIcon || 'Palmtree';
                                  const ic = "w-5 h-5 text-amber-400";
                                  if (iconName === 'Sparkles') return <Sparkles className={ic} />;
                                  if (iconName === 'Crown') return <Crown className={ic} />;
                                  if (iconName === 'Sun') return <Sun className={ic} />;
                                  if (iconName === 'Flame') return <Flame className={ic} />;
                                  if (iconName === 'Music') return <Music className={ic} />;
                                  if (iconName === 'Globe') return <Globe className={ic} />;
                                  if (iconName === 'Shield') return <Shield className={ic} />;
                                  if (iconName === 'Compass') return <Compass className={ic} />;
                                  return <Palmtree className={ic} />;
                                })()}
                              </div>
                            )}
                            <div>
                              <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-amber-400/90 font-sans-display block">
                                {siteConfig.appSubtitle || 'CARICOM FESTIVAL'}
                              </span>
                              <span className="text-base font-bold font-serif text-white flex items-center gap-1.5">
                                {siteConfig.appName || 'Grenada CARICOM Festival 2027'}
                                {siteConfig.appYearBadge && !siteConfig.appName?.includes(siteConfig.appYearBadge) && (
                                  <span className="font-sans font-extrabold text-amber-400 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                                    {siteConfig.appYearBadge}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 1: HERO BACKGROUND MANAGER */}
              {customizerSubTab === 'hero' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Top Header Card */}
                  <div className="bg-neutral-950/60 border border-neutral-800/80 p-6 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Image className="w-5 h-5 text-amber-400" />
                          <h3 className="font-bold text-base text-white font-serif">Homepage Hero Background Slideshow</h3>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">
                          Manage the photo slideshow in the hero section on the main homepage. Add photos from the media library, set custom captions, adjust rotation timing, and control how many images cycle.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <label className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span>Direct Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (files && files[0]) {
                                const file = files[0];
                                setSaveToast(`Uploading "${file.name}"...`);
                                try {
                                  let resultUrl = '';
                                  let resultCompSize = file.size;
                                  let resultFileType = file.type || 'image/jpeg';
                                  const serverRes = await uploadFileToServer(file);
                                  if (serverRes && serverRes.url) {
                                    resultUrl = serverRes.url;
                                    resultCompSize = serverRes.size;
                                    resultFileType = serverRes.type || resultFileType;
                                  } else {
                                    const comp = await compressImage(file, 1200, 0.8);
                                    resultUrl = comp.compressedUrl;
                                    resultCompSize = comp.compressedSize;
                                  }
                                  const currentList = siteConfig.hero?.images || [];
                                  const updated = [...currentList, { url: resultUrl, alt: file.name.split('.')[0] }];
                                  
                                  setSiteConfigState({
                                    ...siteConfig,
                                    hero: {
                                      displayCount: (siteConfig.hero?.displayCount || 5) + 1,
                                      autoplayInterval: siteConfig.hero?.autoplayInterval || 4,
                                      images: updated
                                    }
                                  });

                                  const newItem = {
                                    id: 'media-' + Date.now(),
                                    name: file.name,
                                    url: resultUrl,
                                    originalSize: file.size,
                                    compressedSize: resultCompSize,
                                    type: resultFileType,
                                    uploadedAt: new Date().toISOString()
                                  };
                                  addMediaItem(newItem);

                                  setSaveToast(`Directly uploaded and added "${file.name}" to slideshow!`);
                                } catch (err) {
                                  console.error('Direct add failed:', err);
                                  setSaveToast('Upload failed.');
                                }
                              }
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setMediaSelectorTarget('hero')}
                          className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <FolderOpen className="w-4 h-4" /> Add from Media Library
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const currentList = siteConfig.hero?.images || [];
                            const updated = [...currentList, { url: '', alt: 'Custom Hero Background' }];
                            setSiteConfigState({
                              ...siteConfig,
                              hero: {
                                displayCount: siteConfig.hero?.displayCount || 5,
                                autoplayInterval: siteConfig.hero?.autoplayInterval || 4,
                                images: updated
                              }
                            });
                          }}
                          className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-850 text-white border border-neutral-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-amber-400" /> Add Image URL
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const defaultImages = [
                              { url: FESTIVAL_IMAGES.hero, alt: "Grenada Beach DJ Showcase 2027" },
                              { url: FESTIVAL_IMAGES.festivalHero, alt: "Spectacular Spice Isle Festival Crowd" },
                              { url: FESTIVAL_IMAGES.whiteGala, alt: "Premium VIP White Gala Party Lounge" },
                              { url: FESTIVAL_IMAGES.riverTubing, alt: "Mellowland Tropical River Tubing Adventure" },
                              { url: FESTIVAL_IMAGES.ecoParadise, alt: "Beautiful Grenada Eco Paradise Coastline" }
                            ];
                            setSiteConfigState({
                              ...siteConfig,
                              hero: {
                                displayCount: 5,
                                autoplayInterval: 4,
                                images: defaultImages
                              }
                            });
                            setSaveToast('Reset hero backgrounds to default photos!');
                          }}
                          className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          title="Reset to default background images"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Settings Bar */}
                  {(() => {
                    const imagesList = siteConfig.hero?.images && siteConfig.hero.images.length > 0
                      ? siteConfig.hero.images
                      : [
                          { url: FESTIVAL_IMAGES.hero, alt: "Grenada Beach DJ Showcase 2027" },
                          { url: FESTIVAL_IMAGES.festivalHero, alt: "Spectacular Spice Isle Festival Crowd" },
                          { url: FESTIVAL_IMAGES.whiteGala, alt: "Premium VIP White Gala Party Lounge" },
                          { url: FESTIVAL_IMAGES.riverTubing, alt: "Mellowland Tropical River Tubing Adventure" },
                          { url: FESTIVAL_IMAGES.ecoParadise, alt: "Beautiful Grenada Eco Paradise Coastline" }
                        ];

                    const currentDisplayCount = siteConfig.hero?.displayCount ?? Math.min(imagesList.length, 5);
                    const activeCount = Math.max(1, Math.min(currentDisplayCount, imagesList.length));

                    return (
                      <div className="space-y-6">
                        {/* Display Count & Speed Controls */}
                        <div className="bg-neutral-950/60 border border-neutral-800/80 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* DISPLAY COUNT SELECTOR */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Active Display Count
                              </label>
                              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                {activeCount} of {imagesList.length} Active
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400">
                              Select how many background images cycle in the homepage hero slideshow.
                            </p>

                            <div className="flex items-center gap-3 pt-1">
                              <input
                                type="range"
                                min={1}
                                max={Math.max(1, imagesList.length)}
                                value={activeCount}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setSiteConfigState({
                                    ...siteConfig,
                                    hero: {
                                      ...(siteConfig.hero || { autoplayInterval: 4, images: imagesList }),
                                      displayCount: val,
                                      images: imagesList
                                    }
                                  });
                                }}
                                className="flex-1 accent-amber-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
                              />
                              <select
                                value={activeCount}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setSiteConfigState({
                                    ...siteConfig,
                                    hero: {
                                      ...(siteConfig.hero || { autoplayInterval: 4, images: imagesList }),
                                      displayCount: val,
                                      images: imagesList
                                    }
                                  });
                                }}
                                className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                              >
                                {Array.from({ length: imagesList.length }, (_, i) => i + 1).map((num) => (
                                  <option key={num} value={num}>
                                    {num} {num === 1 ? 'Image (Static)' : 'Images'}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Quick Presets */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {[1, 3, 5, imagesList.length].filter((val, idx, self) => val <= imagesList.length && self.indexOf(val) === idx).map((countVal) => (
                                <button
                                  key={countVal}
                                  type="button"
                                  onClick={() => {
                                    setSiteConfigState({
                                      ...siteConfig,
                                      hero: {
                                        ...(siteConfig.hero || { autoplayInterval: 4, images: imagesList }),
                                        displayCount: countVal,
                                        images: imagesList
                                      }
                                    });
                                  }}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                    activeCount === countVal
                                      ? 'bg-amber-500 text-neutral-950 font-extrabold shadow'
                                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800'
                                  }`}
                                >
                                  {countVal === imagesList.length ? `All (${countVal})` : `${countVal} ${countVal === 1 ? 'Image' : 'Images'}`}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* ROTATION SPEED SELECTOR */}
                          <div className="space-y-3">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" /> Rotation Speed (Interval)
                            </label>
                            <p className="text-[11px] text-neutral-400">
                              Set how many seconds each background image displays before automatically rotating.
                            </p>

                            <div className="flex items-center gap-2 pt-1">
                              <select
                                value={siteConfig.hero?.autoplayInterval || 4}
                                onChange={(e) => {
                                  const sec = parseInt(e.target.value, 10);
                                  setSiteConfigState({
                                    ...siteConfig,
                                    hero: {
                                      ...(siteConfig.hero || { displayCount: activeCount, images: imagesList }),
                                      autoplayInterval: sec,
                                      images: imagesList
                                    }
                                  });
                                }}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-xs text-white focus:border-amber-500 focus:outline-none cursor-pointer font-bold"
                              >
                                <option value={3}>3 Seconds (Fast)</option>
                                <option value={4}>4 Seconds (Recommended Standard)</option>
                                <option value={5}>5 Seconds (Relaxed)</option>
                                <option value={6}>6 Seconds (Extended)</option>
                                <option value={8}>8 Seconds (Slow Luxe)</option>
                              </select>
                            </div>
                          </div>

                        </div>

                        {/* IMAGE ITEMS LIST */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
                            <span>Background Photos List ({imagesList.length} Total)</span>
                            <span className="text-[10px] text-neutral-500 font-normal">
                              Images above position #{activeCount} are kept as reserves
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {imagesList.map((img, index) => {
                              const isActive = index < activeCount;
                              return (
                                <div
                                  key={index}
                                  className={`bg-neutral-950 border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-5 transition-all ${
                                    isActive
                                      ? 'border-neutral-700/80 bg-neutral-950/90 shadow-lg'
                                      : 'border-neutral-850/60 opacity-60 hover:opacity-100'
                                  }`}
                                >
                                  {/* Thumbnail */}
                                  <div className="relative w-full md:w-44 h-28 rounded-xl overflow-hidden border border-neutral-800 shrink-0 bg-neutral-900">
                                    <img
                                      src={img.url || FESTIVAL_IMAGES.hero}
                                      alt={img.alt || 'Hero Background'}
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.mellowlandGarden;
                                      }}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 left-2">
                                      {isActive ? (
                                        <span className="bg-emerald-500 text-neutral-950 font-black text-[9px] px-2.5 py-0.5 rounded-full shadow uppercase tracking-wider">
                                          Active #{index + 1}
                                        </span>
                                      ) : (
                                        <span className="bg-neutral-900/90 text-neutral-400 font-bold text-[9px] px-2.5 py-0.5 rounded-full border border-neutral-700 uppercase tracking-wider">
                                          Reserve #{index + 1}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Form fields */}
                                  <div className="flex-1 space-y-3">
                                    <div>
                                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Photo Title / Caption</label>
                                      <input
                                        type="text"
                                        value={img.alt || ''}
                                        onChange={(e) => {
                                          const updated = [...imagesList];
                                          updated[index] = { ...updated[index], alt: e.target.value };
                                          setSiteConfigState({
                                            ...siteConfig,
                                            hero: {
                                              ...(siteConfig.hero || { displayCount: activeCount, autoplayInterval: 4 }),
                                              images: updated
                                            }
                                          });
                                        }}
                                        placeholder="e.g., Grenada Beach Fete 2027"
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                                      />
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="block text-[10px] uppercase font-bold text-neutral-400">Image Source / URL</label>
                                        <button
                                          type="button"
                                          onClick={() => setMediaSelectorTarget({ heroIndex: index })}
                                          className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                          <FolderOpen className="w-3 h-3" /> Select from Media Library
                                        </button>
                                      </div>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={img.url || ''}
                                          onChange={(e) => {
                                            const updated = [...imagesList];
                                            updated[index] = { ...updated[index], url: e.target.value };
                                            setSiteConfigState({
                                              ...siteConfig,
                                              hero: {
                                                ...(siteConfig.hero || { displayCount: activeCount, autoplayInterval: 4 }),
                                                images: updated
                                              }
                                            });
                                          }}
                                          placeholder="https://... or base64 data URL"
                                          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono text-[11px]"
                                        />

                                        {/* Direct File Upload for Slide Slot */}
                                        <label className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer">
                                          <Upload className="w-3.5 h-3.5" />
                                          <span className="hidden sm:inline">Upload</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                              const files = e.target.files;
                                              if (files && files[0]) {
                                                const file = files[0];
                                                setSaveToast(`Compressing "${file.name}"...`);
                                                try {
                                                  const result = await compressImage(file, 1200, 0.8);
                                                  const updated = [...imagesList];
                                                  updated[index] = { ...updated[index], url: result.compressedUrl };
                                                  setSiteConfigState({
                                                    ...siteConfig,
                                                    hero: {
                                                      ...(siteConfig.hero || { displayCount: activeCount, autoplayInterval: 4 }),
                                                      images: updated
                                                    }
                                                  });

                                                  // Also save to Media Library so they can reuse it
                                                  const newItem = {
                                                    id: 'media-' + Date.now(),
                                                    name: file.name,
                                                    url: result.compressedUrl,
                                                    originalSize: file.size,
                                                    compressedSize: result.compressedSize,
                                                    type: file.type,
                                                    uploadedAt: new Date().toISOString()
                                                  };
                                                  addMediaItem(newItem);

                                                  setSaveToast(`Directly updated and saved Slide #${index + 1}!`);
                                                } catch (err) {
                                                  console.error('Direct upload failed:', err);
                                                  setSaveToast('Upload failed.');
                                                }
                                              }
                                            }}
                                          />
                                        </label>

                                        <button
                                          type="button"
                                          onClick={() => setMediaSelectorTarget({ heroIndex: index })}
                                          className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-amber-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                                          title="Open Media Library"
                                        >
                                          <FolderOpen className="w-3.5 h-3.5" />
                                          <span className="hidden sm:inline">Browse</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Reorder & Delete Controls */}
                                  <div className="flex md:flex-col items-center justify-end gap-2 border-t md:border-t-0 md:border-l border-neutral-800 pt-3 md:pt-0 md:pl-4 shrink-0">
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => {
                                          if (index === 0) return;
                                          const updated = [...imagesList];
                                          const temp = updated[index];
                                          updated[index] = updated[index - 1];
                                          updated[index - 1] = temp;
                                          setSiteConfigState({
                                            ...siteConfig,
                                            hero: {
                                              ...(siteConfig.hero || { displayCount: activeCount, autoplayInterval: 4 }),
                                              images: updated
                                            }
                                          });
                                        }}
                                        className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 rounded-xl border border-neutral-800 cursor-pointer transition-colors"
                                        title="Move Up"
                                      >
                                        <ChevronUp className="w-4 h-4" />
                                      </button>

                                      <button
                                        type="button"
                                        disabled={index === imagesList.length - 1}
                                        onClick={() => {
                                          if (index === imagesList.length - 1) return;
                                          const updated = [...imagesList];
                                          const temp = updated[index];
                                          updated[index] = updated[index + 1];
                                          updated[index + 1] = temp;
                                          setSiteConfigState({
                                            ...siteConfig,
                                            hero: {
                                              ...(siteConfig.hero || { displayCount: activeCount, autoplayInterval: 4 }),
                                              images: updated
                                            }
                                          });
                                        }}
                                        className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 rounded-xl border border-neutral-800 cursor-pointer transition-colors"
                                        title="Move Down"
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = imagesList.filter((_, i) => i !== index);
                                        setSiteConfigState({
                                          ...siteConfig,
                                          hero: {
                                            ...(siteConfig.hero || { displayCount: activeCount, autoplayInterval: 4 }),
                                            images: updated,
                                            displayCount: Math.min(activeCount, Math.max(1, updated.length))
                                          }
                                        });
                                      }}
                                      className="p-2 bg-neutral-900 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 rounded-xl border border-neutral-800 hover:border-rose-900/50 cursor-pointer transition-colors"
                                      title="Remove Image"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SUB-TAB 2: FONTS */}
              {customizerSubTab === 'brand' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
                  
                  {/* Left Column: Color & Typography Controls */}
                  <div className="space-y-6">
                    {/* Typography & Background Tone */}
                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-5 rounded-2xl space-y-4">
                      <span className="block text-xs font-bold uppercase text-amber-400 tracking-wider">Typography & Background Canvas</span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Headline Font Family</label>
                          <select
                            value={siteConfig.branding.headingFont}
                            onChange={(e) => setSiteConfigState({
                              ...siteConfig,
                              branding: { ...siteConfig.branding, headingFont: e.target.value as any }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none cursor-pointer"
                          >
                            <option value="Poppins">Poppins (Modern Bold)</option>
                            <option value="Playfair Display">Playfair Display (Luxury Serif)</option>
                            <option value="Montserrat">Montserrat (Display Geometric)</option>
                            <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Display)</option>
                            <option value="Syne">Syne (Avant-Garde)</option>
                            <option value="Cinzel">Cinzel (Royal Classic Serif)</option>
                            <option value="Outfit">Outfit (Tech & Bold)</option>
                            <option value="Cormorant Garamond">Cormorant Garamond (High-Fashion Serif)</option>
                            <option value="Space Grotesk">Space Grotesk (Modern Tech)</option>
                            <option value="Bricolage Grotesque">Bricolage Grotesque (Expressive)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Body Text Font Family</label>
                          <select
                            value={siteConfig.branding.bodyFont}
                            onChange={(e) => setSiteConfigState({
                              ...siteConfig,
                              branding: { ...siteConfig.branding, bodyFont: e.target.value as any }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none cursor-pointer"
                          >
                            <option value="Inter">Inter (Clean Standard)</option>
                            <option value="Poppins">Poppins (Friendly Modern)</option>
                            <option value="Plus Jakarta Sans">Plus Jakarta Sans (Balanced Sans)</option>
                            <option value="Outfit">Outfit (Modern Clean)</option>
                            <option value="Roboto">Roboto (Classic Neutral)</option>
                            <option value="Space Grotesk">Space Grotesk (Tech Sans)</option>
                            <option value="DM Sans">DM Sans (Refined Modern)</option>
                            <option value="Work Sans">Work Sans (Versatile Sans)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Dark Mode Background Canvas Tone</label>
                        <select
                          value={siteConfig.branding.bgTone || 'dark-onyx'}
                          onChange={(e) => setSiteConfigState({
                            ...siteConfig,
                            branding: { ...siteConfig.branding, bgTone: e.target.value as any }
                          })}
                          className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none cursor-pointer font-bold"
                        >
                          <option value="dark-onyx">Onyx Black (Rich Jet Dark)</option>
                          <option value="deep-midnight">Deep Midnight (Subtle Blue-Black)</option>
                          <option value="luxury-charcoal">Luxury Charcoal (Modern Matte)</option>
                          <option value="caribbean-night">Caribbean Night (Tropical Cyan-Dark)</option>
                        </select>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Live Interactive Sandbox Preview */}
                  <div className="space-y-4 lg:sticky lg:top-6">
                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-black uppercase text-emerald-400 tracking-wider">Live Interactive Sandbox</span>
                          <span className="block text-[10px] text-neutral-500">Visual mockup updates dynamically as you tweak controls</span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">Preview</span>
                      </div>

                      <div 
                        className="border rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-300"
                        style={{ 
                          borderColor: 'rgba(255,255,255,0.1)',
                          backgroundColor: 
                            siteConfig.branding.bgTone === 'deep-midnight' ? '#02040A' :
                            siteConfig.branding.bgTone === 'luxury-charcoal' ? '#121214' :
                            siteConfig.branding.bgTone === 'caribbean-night' ? '#010A0A' : '#080A0F'
                        }}
                      >
                        {/* Simulated banner */}
                        {siteConfig.banner?.enabled && (
                          <div 
                            className="py-1.5 px-3 text-[9px] font-bold text-center text-white select-none transition-all"
                            style={{ backgroundColor: siteConfig.banner.bgColor || '#10B981' }}
                          >
                            {siteConfig.banner.text || 'Simulated Announcement Banner'}
                          </div>
                        )}

                        {/* Simulated header */}
                        <div className="p-4 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02]">
                          <span 
                            className="text-xs font-black uppercase tracking-widest text-white"
                            style={{ fontFamily: siteConfig.branding.headingFont }}
                          >
                            MELLOWLANDS
                          </span>
                          <div className="flex gap-3 text-[10px] font-medium text-neutral-400">
                            <span>Home</span>
                            <span style={{ color: siteConfig.branding.primaryColor || '#F59E0B' }}>Active</span>
                            <span>Shop</span>
                          </div>
                        </div>

                        {/* Simulated Hero with Live Background Slideshow Preview */}
                        {(() => {
                          const sandboxImages = (siteConfig.hero?.images && siteConfig.hero.images.length > 0
                            ? siteConfig.hero.images
                            : [
                                { url: FESTIVAL_IMAGES.hero, alt: "Grenada Beach DJ Showcase 2027" },
                                { url: FESTIVAL_IMAGES.festivalHero, alt: "Spectacular Spice Isle Festival Crowd" },
                                { url: FESTIVAL_IMAGES.whiteGala, alt: "Premium VIP White Gala Party Lounge" },
                                { url: FESTIVAL_IMAGES.riverTubing, alt: "Mellowland Tropical River Tubing Adventure" },
                                { url: FESTIVAL_IMAGES.ecoParadise, alt: "Beautiful Grenada Eco Paradise Coastline" }
                              ]
                          ).slice(0, Math.max(1, Math.min(siteConfig.hero?.displayCount ?? 5, (siteConfig.hero?.images?.length || 5))));

                          const activeIndex = sandboxSlideIndex % Math.max(1, sandboxImages.length);
                          const currentSlide = sandboxImages[activeIndex] || sandboxImages[0];

                          return (
                            <div className="relative p-6 min-h-[280px] flex flex-col justify-between text-center overflow-hidden">
                              {/* Background Slide Image */}
                              <div className="absolute inset-0 z-0">
                                <img
                                  key={`${currentSlide?.url}-${activeIndex}`}
                                  src={currentSlide?.url || FESTIVAL_IMAGES.hero}
                                  alt={currentSlide?.alt || "Hero Slide"}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.mellowlandGarden;
                                  }}
                                  className="w-full h-full object-cover filter brightness-[0.45] contrast-[1.05] transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F] via-black/40 to-black/20" />
                              </div>

                              {/* Slide Counter Badge */}
                              <div className="relative z-10 flex items-center justify-between text-[9px] text-white/90">
                                <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/40 font-black uppercase text-amber-400 tracking-wider">
                                  Slide {activeIndex + 1} of {sandboxImages.length}
                                </span>
                                <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 font-mono text-neutral-300">
                                  {(siteConfig.hero?.autoplayInterval || 4)}s rotation
                                </span>
                              </div>

                              {/* Simulated Hero Text */}
                              <div className="relative z-10 space-y-2 my-auto py-3">
                                <h4 
                                  className="text-base font-black text-white leading-tight drop-shadow-md"
                                  style={{ fontFamily: siteConfig.branding.headingFont }}
                                >
                                  Feel the Rhythm of the <span style={{ color: siteConfig.branding.primaryColor || '#F59E0B' }}>Spice Island</span>
                                </h4>
                                <p 
                                  className="text-[11px] text-neutral-200 max-w-xs mx-auto leading-relaxed drop-shadow"
                                  style={{ fontFamily: siteConfig.branding.bodyFont }}
                                >
                                  {currentSlide?.alt || "Experience high-definition soca, luxury beachside suites, and concierge tubing trips in beautiful Grenada."}
                                </p>
                                
                                <div className="flex justify-center gap-2 pt-2">
                                  <button 
                                    type="button"
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-neutral-950 transition-all active:scale-95 shadow-md cursor-pointer"
                                    style={{ 
                                      backgroundColor: siteConfig.branding.primaryColor || '#F59E0B',
                                      fontFamily: siteConfig.branding.bodyFont
                                    }}
                                  >
                                    Get Passes
                                  </button>
                                  <button 
                                    type="button"
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/20 text-white transition-all active:scale-95 bg-black/40 backdrop-blur-sm cursor-pointer"
                                    style={{ fontFamily: siteConfig.branding.bodyFont }}
                                  >
                                    Learn More
                                  </button>
                                </div>
                              </div>

                              {/* Carousel Dots */}
                              {sandboxImages.length > 1 && (
                                <div className="relative z-10 flex items-center justify-center gap-1.5 pt-1">
                                  {sandboxImages.map((_, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setSandboxSlideIndex(idx)}
                                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                        activeIndex === idx ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/40 hover:bg-white/70'
                                      }`}
                                      title={`Go to slide #${idx + 1}`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* SUB-TAB 3: ANNOUNCEMENT BANNER */}
              {customizerSubTab === 'banner' && (
                <div className="space-y-6 max-w-3xl animate-fadeIn">
                  <div className="bg-neutral-950/60 border border-neutral-800/80 p-6 rounded-2xl space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                      <div>
                        <h3 className="font-bold text-sm text-white">Top Website Announcement Banner</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">Displays a prominent notification bar across the top of all pages.</p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={!!siteConfig.banner?.enabled} 
                          onChange={(e) => setSiteConfigState({
                            ...siteConfig,
                            banner: { ...siteConfig.banner, enabled: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-neutral-300 after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {siteConfig.banner?.enabled ? (
                      <div className="space-y-4 pt-1 animate-fadeIn">
                        <div>
                          <label className="block text-xs uppercase font-bold text-neutral-300 mb-1.5">Banner Announcement Text</label>
                          <input
                            type="text"
                            value={siteConfig.banner.text || ''}
                            onChange={(e) => setSiteConfigState({
                              ...siteConfig,
                              banner: { ...siteConfig.banner, text: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                            placeholder="Enter announcement text..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs uppercase font-bold text-neutral-300 mb-1.5">Banner Background Color</label>
                          <div className="flex items-center gap-3">
                            <div className="flex gap-2 flex-1">
                              {[
                                { name: 'Emerald', hex: '#10B981' },
                                { name: 'Amber', hex: '#F59E0B' },
                                { name: 'Sunset', hex: '#F43F5E' },
                                { name: 'Indigo', hex: '#4F46E5' },
                                { name: 'Cyan', hex: '#06B6D4' }
                              ].map((b) => (
                                <button
                                  key={b.hex}
                                  type="button"
                                  onClick={() => setSiteConfigState({
                                    ...siteConfig,
                                    banner: { ...siteConfig.banner, bgColor: b.hex }
                                  })}
                                  className="h-8 rounded-lg border border-neutral-700/80 cursor-pointer flex-1 transition-all hover:scale-105"
                                  style={{ backgroundColor: b.hex }}
                                  title={b.name}
                                />
                              ))}
                            </div>
                            <input
                              type="color"
                              value={siteConfig.banner.bgColor || '#10B981'}
                              onChange={(e) => setSiteConfigState({
                                ...siteConfig,
                                banner: { ...siteConfig.banner, bgColor: e.target.value }
                              })}
                              className="w-10 h-8 rounded-lg bg-transparent border border-neutral-800 cursor-pointer p-0"
                              title="Custom Color"
                            />
                          </div>
                        </div>

                        {/* Live Preview Strip */}
                        <div className="pt-2">
                          <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Live Banner Preview</label>
                          <div 
                            className="py-2 px-4 rounded-xl text-xs font-bold text-center text-white shadow-md transition-all"
                            style={{ backgroundColor: siteConfig.banner.bgColor || '#10B981' }}
                          >
                            {siteConfig.banner.text || 'Simulated Announcement Banner'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-neutral-900/40 rounded-xl text-center text-xs text-neutral-500 font-medium">
                        Announcement banner is currently disabled. Toggle the switch above to activate it.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: SOCIALS & HELPLINES */}
              {customizerSubTab === 'social' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Social Handles */}
                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-6 rounded-2xl space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                        <Share2 className="w-4 h-4 text-amber-400" />
                        <h3 className="font-bold text-sm text-white">Social Media Profiles</h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Instagram Profile URL</label>
                          <input
                            type="url"
                            value={siteConfig.socialLinks.instagram || ''}
                            onChange={(e) => setSiteConfigState({
                              ...siteConfig,
                              socialLinks: { ...siteConfig.socialLinks, instagram: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                            placeholder="https://instagram.com/..."
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">TikTok Channel URL</label>
                          <input
                            type="url"
                            value={siteConfig.socialLinks.tiktok || ''}
                            onChange={(e) => setSiteConfigState({
                              ...siteConfig,
                              socialLinks: { ...siteConfig.socialLinks, tiktok: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                            placeholder="https://tiktok.com/@..."
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Facebook Fanpage URL</label>
                          <input
                            type="url"
                            value={siteConfig.socialLinks.facebook || ''}
                            onChange={(e) => setSiteConfigState({
                              ...siteConfig,
                              socialLinks: { ...siteConfig.socialLinks, facebook: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                            placeholder="https://facebook.com/..."
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">WhatsApp Desk URL</label>
                          <input
                            type="url"
                            value={siteConfig.socialLinks.whatsapp || ''}
                            onChange={(e) => setSiteConfigState({
                              ...siteConfig,
                              socialLinks: { ...siteConfig.socialLinks, whatsapp: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                            placeholder="https://wa.me/..."
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Twitter / X Handle URL</label>
                          <input
                            type="url"
                            value={siteConfig.socialLinks.twitter || ''}
                            onChange={(e) => setSiteConfigState({
                              ...siteConfig,
                              socialLinks: { ...siteConfig.socialLinks, twitter: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                            placeholder="https://x.com/..."
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">YouTube Channel URL</label>
                          <input
                            type="url"
                            value={siteConfig.socialLinks.youtube || ''}
                            onChange={(e) => setSiteConfigState({
                              ...siteConfig,
                              socialLinks: { ...siteConfig.socialLinks, youtube: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                            placeholder="https://youtube.com/..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Helplines & Direct Support */}
                    <div className="bg-neutral-950/60 border border-neutral-800/80 p-6 rounded-2xl space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                        <Phone className="w-4 h-4 text-amber-400" />
                        <h3 className="font-bold text-sm text-white">Concierge & Helpline Desk</h3>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Official Helpline Phone</label>
                          <input
                            type="text"
                            value={siteConfig.contactPhone || ''}
                            onChange={(e) => setSiteConfigState({
                              ...siteConfig,
                              contactPhone: e.target.value
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                            placeholder="+44 (0)7900 123 456"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Direct Support Email</label>
                          <input
                            type="email"
                            value={siteConfig.contactEmail || ''}
                            onChange={(e) => setSiteConfigState({
                              ...siteConfig,
                              contactEmail: e.target.value
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                            placeholder="info@grenadacaricomfestival.com"
                          />
                        </div>

                        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl text-xs text-neutral-400 space-y-1">
                          <span className="font-bold text-white block">Footer Integration Note</span>
                          <p className="text-[11px] leading-relaxed">
                            These social profiles and contact helplines appear directly in the footer across all public views and in the user order confirmation receipts.
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* SUB-TAB 6: THEME PRESETS SELECTOR */}
              {customizerSubTab === 'presets' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Column: Preset Cards */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="bg-neutral-950/60 border border-neutral-800/80 p-6 rounded-2xl space-y-2">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-widest">
                          <Palette className="w-3.5 h-3.5" /> Curated Visual Lookbooks
                        </div>
                        <h3 className="text-lg font-bold text-white">Visual Theme Presets</h3>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Select one of our meticulously paired color and font presets below. Each option instantly tunes the header, buttons, background atmosphere, typography, and accent rings.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          {
                            id: 'royal-spice',
                            name: 'Royal Spice Gold',
                            description: 'The elegant heritage look of Grenada. Velvet gold accents and classic display serif typography.',
                            primaryColor: '#F59E0B',
                            secondaryColor: '#10B981',
                            bgTone: 'dark-onyx',
                            headingFont: 'Playfair Display',
                            bodyFont: 'Plus Jakarta Sans',
                            colorTag: 'Gold & Emerald'
                          },
                          {
                            id: 'caribbean-turquoise',
                            name: 'Caribbean Turquoise',
                            description: 'Brilliant tropical cyan beach theme over sea-depth caribbean-night tones.',
                            primaryColor: '#06B6D4',
                            secondaryColor: '#3B82F6',
                            bgTone: 'caribbean-night',
                            headingFont: 'Outfit',
                            bodyFont: 'Inter',
                            colorTag: 'Cyan & Blue'
                          },
                          {
                            id: 'soca-electric',
                            name: 'Soca Electric Pink',
                            description: 'High-energy neon festival vibe. Velvet canvas with blazing pink and rose accents.',
                            primaryColor: '#EC4899',
                            secondaryColor: '#F43F5E',
                            bgTone: 'deep-midnight',
                            headingFont: 'Syne',
                            bodyFont: 'Space Grotesk',
                            colorTag: 'Hot Pink & Rose'
                          },
                          {
                            id: 'tropical-rainforest',
                            name: 'Tropical Rainforest',
                            description: 'Verdant green tropical foliage theme with warm spiced amber contrasting details.',
                            primaryColor: '#10B981',
                            secondaryColor: '#F59E0B',
                            bgTone: 'caribbean-night',
                            headingFont: 'Montserrat',
                            bodyFont: 'DM Sans',
                            colorTag: 'Green & Amber'
                          },
                          {
                            id: 'luxury-obsidian',
                            name: 'Luxury Obsidian',
                            description: 'Sleek modern luxury. Fine matte charcoal canvas with pristine silver-slate elements.',
                            primaryColor: '#E2E8F0',
                            secondaryColor: '#94A3B8',
                            bgTone: 'luxury-charcoal',
                            headingFont: 'Outfit',
                            bodyFont: 'Plus Jakarta Sans',
                            colorTag: 'Silver & Slate'
                          },
                          {
                            id: 'sunset-serenade',
                            name: 'Sunset Serenade',
                            description: 'Warm dramatic orange and crimson tones mirroring a romantic beach sunset.',
                            primaryColor: '#F97316',
                            secondaryColor: '#E11D48',
                            bgTone: 'deep-midnight',
                            headingFont: 'Poppins',
                            bodyFont: 'Work Sans',
                            colorTag: 'Sunset Orange'
                          }
                        ].map((preset) => {
                          const isCurrentlySelected = 
                            siteConfig.branding.primaryColor === preset.primaryColor &&
                            siteConfig.branding.bgTone === preset.bgTone &&
                            siteConfig.branding.headingFont === preset.headingFont;

                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setSiteConfigState({
                                  ...siteConfig,
                                  branding: {
                                    ...siteConfig.branding,
                                    primaryColor: preset.primaryColor,
                                    secondaryColor: preset.secondaryColor,
                                    bgTone: preset.bgTone as any,
                                    headingFont: preset.headingFont as any,
                                    bodyFont: preset.bodyFont as any
                                  }
                                });
                                setSaveToast(`Applied "${preset.name}" preset! Click Save Changes above to persist.`);
                                setTimeout(() => setSaveToast(null), 3000);
                              }}
                              className={`text-left p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between min-h-[170px] ${
                                isCurrentlySelected
                                  ? 'bg-neutral-900 border-amber-500 shadow-xl shadow-amber-500/5'
                                  : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                              }`}
                            >
                              <div className="space-y-1.5 z-10 relative">
                                <div className="flex items-center justify-between">
                                  <span 
                                    className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                    style={{ 
                                      backgroundColor: `${preset.primaryColor}20`,
                                      color: preset.primaryColor 
                                    }}
                                  >
                                    {preset.colorTag}
                                  </span>
                                  {isCurrentlySelected && (
                                    <span className="flex h-2.5 w-2.5 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">{preset.name}</h4>
                                <p className="text-[11px] text-neutral-400 leading-relaxed font-light line-clamp-2">{preset.description}</p>
                              </div>

                              <div className="pt-3 flex items-center gap-1.5 border-t border-neutral-900 mt-2 z-10 relative">
                                <span className="text-[9px] font-mono text-neutral-500">Colors:</span>
                                <div className="flex gap-1">
                                  <div className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: preset.primaryColor }} title="Primary color" />
                                  <div className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: preset.secondaryColor }} title="Secondary color" />
                                  <div className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ 
                                    backgroundColor: 
                                      preset.bgTone === 'deep-midnight' ? '#02040A' :
                                      preset.bgTone === 'luxury-charcoal' ? '#121214' :
                                      preset.bgTone === 'caribbean-night' ? '#010A0A' : '#080A0F'
                                  }} title="Background canvas" />
                                </div>
                                <span className="ml-auto text-[10px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                                  {preset.headingFont}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column: Dynamic Mockup Preview */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="bg-neutral-950/60 border border-neutral-800/80 p-5 rounded-2xl space-y-4 lg:sticky lg:top-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="block text-xs font-black uppercase text-amber-500 tracking-wider">Interactive Brand Mockup</span>
                            <span className="block text-[10px] text-neutral-500">Instantly preview fonts, background tones, & accent pairings</span>
                          </div>
                          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">Live Preview</span>
                        </div>

                        <div 
                          className="border rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-300 p-5 space-y-5"
                          style={{ 
                            borderColor: 'rgba(255,255,255,0.08)',
                            backgroundColor: 
                              siteConfig.branding.bgTone === 'deep-midnight' ? '#02040A' :
                              siteConfig.branding.bgTone === 'luxury-charcoal' ? '#121214' :
                              siteConfig.branding.bgTone === 'caribbean-night' ? '#010A0A' : '#080A0F'
                          }}
                        >
                          {/* Simulated VIP Header */}
                          <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                            <div className="flex items-center gap-1.5">
                              <span 
                                className="text-xs font-black uppercase tracking-widest text-white transition-all"
                                style={{ fontFamily: siteConfig.branding.headingFont }}
                              >
                                {siteConfig.appName || "MELLOWLANDS"}
                              </span>
                            </div>
                            <span 
                              className="text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded"
                              style={{ backgroundColor: `${siteConfig.branding.primaryColor}15`, color: siteConfig.branding.primaryColor }}
                            >
                              CONCIERGE ON
                            </span>
                          </div>

                          {/* Preview Ticket/Card Mockup */}
                          <div 
                            className="p-4 rounded-xl space-y-3 border transition-all"
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.02)',
                              borderColor: 'rgba(255,255,255,0.06)'
                            }}
                          >
                            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 block">Premium All-Access Pass</span>
                            <h4 
                              className="text-base font-black text-white leading-tight"
                              style={{ fontFamily: siteConfig.branding.headingFont }}
                            >
                              VIP Beachside Cabana Elite
                            </h4>
                            <p 
                              className="text-[11px] text-neutral-400 leading-relaxed font-light"
                              style={{ fontFamily: siteConfig.branding.bodyFont }}
                            >
                              Includes private beachfront butler service, complimentary island cocktails, and premium stage front access.
                            </p>

                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                              <span className="text-[11px] text-neutral-400 font-mono">$850 USD</span>
                              <button 
                                type="button"
                                className="px-3.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-neutral-950 transition-all rounded"
                                style={{ 
                                  backgroundColor: siteConfig.branding.primaryColor || '#F59E0B',
                                  fontFamily: siteConfig.branding.bodyFont
                                }}
                              >
                                Buy Ticket
                              </button>
                            </div>
                          </div>

                          {/* Visual Spec Sheets */}
                          <div className="space-y-2 text-[11px] text-neutral-400 border-t border-white/[0.05] pt-3">
                            <div className="flex justify-between">
                              <span>Heading Typography:</span>
                              <span className="font-mono text-white font-bold">{siteConfig.branding.headingFont}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Body Typography:</span>
                              <span className="font-mono text-white font-bold">{siteConfig.branding.bodyFont}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Active Primary Color:</span>
                              <span className="font-mono font-bold flex items-center gap-1" style={{ color: siteConfig.branding.primaryColor }}>
                                <span className="w-2.5 h-2.5 rounded-full border border-white/20 inline-block" style={{ backgroundColor: siteConfig.branding.primaryColor }} />
                                {siteConfig.branding.primaryColor}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Background Environment:</span>
                              <span className="font-mono text-white font-bold uppercase text-[10px]">{siteConfig.branding.bgTone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Save Trigger Card */}
                        <div className="bg-neutral-900 border border-neutral-800/80 p-4 rounded-2xl flex items-center justify-between gap-4">
                          <p className="text-[10px] text-neutral-400 leading-normal">
                            All configurations are applied in temporary local storage instantly. Ready to lock them in permanently?
                          </p>
                          <button
                            type="button"
                            onClick={handleSaveConfig}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-[10px] uppercase tracking-wider rounded-lg shrink-0 shadow transition-all cursor-pointer active:scale-95"
                          >
                            Save Theme
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* SUB-TAB 7: UI ELEMENTS CUSTOMIZER */}
              {customizerSubTab === 'elements' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Column: UI Styling Controls */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="bg-neutral-950/60 border border-neutral-800/80 p-6 rounded-2xl space-y-2">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-widest">
                          <Settings className="w-3.5 h-3.5" /> UI Component Architecture
                        </div>
                        <h3 className="text-lg font-bold text-white">Button & Card Elements Customizer</h3>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          As Senior Architects, we want to give you visual control of layout physics. Tune component curvature, card material presets, glass transparency level, and atmospheric glows.
                        </p>
                      </div>

                      {/* Card Styles Grid Selection */}
                      <div className="bg-neutral-950/60 border border-neutral-800/80 p-6 rounded-2xl space-y-4">
                        <div className="space-y-1">
                          <label className="block text-xs uppercase font-extrabold tracking-wider text-neutral-300">Card Base Style</label>
                          <span className="block text-[11px] text-neutral-500">Defines background transparency, border presence, and shadow levels</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            {
                              id: 'glassy',
                              name: 'Organic Glassmorphism',
                              desc: 'Sophisticated back-blur with dynamic translucency.'
                            },
                            {
                              id: 'flat',
                              name: 'Solid Matte',
                              desc: 'Opaque card layout, no glass filters or blur properties.'
                            },
                            {
                              id: 'bordered',
                              name: 'Thick Border Accents',
                              desc: 'Draws explicit primary-color border strokes around blocks.'
                            },
                            {
                              id: 'glow',
                              name: 'Ambient Neon Glow',
                              desc: 'Produces a glowing neon light colored after the main primary.'
                            }
                          ].map((style) => {
                            const isSelected = (siteConfig.branding.cardStyle || 'glassy') === style.id;
                            return (
                              <button
                                key={style.id}
                                type="button"
                                onClick={() => {
                                  setSiteConfigState({
                                    ...siteConfig,
                                    branding: {
                                      ...siteConfig.branding,
                                      cardStyle: style.id as any
                                    }
                                  });
                                }}
                                className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-[100px] ${
                                  isSelected
                                    ? 'bg-neutral-900 border-amber-500 shadow-md'
                                    : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700'
                                }`}
                              >
                                <span className={`text-[11px] font-extrabold ${isSelected ? 'text-amber-400' : 'text-white'}`}>{style.name}</span>
                                <span className="text-[9px] text-neutral-400 leading-relaxed line-clamp-2">{style.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Button Styling Selection */}
                      <div className="bg-neutral-950/60 border border-neutral-800/80 p-6 rounded-2xl space-y-4">
                        <div className="space-y-1">
                          <label className="block text-xs uppercase font-extrabold tracking-wider text-neutral-300">Button & Input Curvature</label>
                          <span className="block text-[11px] text-neutral-500">Adjust the roundness of buttons, input fields, badges, and card items</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {[
                            {
                              id: 'sharp',
                              name: 'Sharp (0px)',
                              desc: 'Ultra-modern Swiss look'
                            },
                            {
                              id: 'rounded',
                              name: 'Rounded (12px)',
                              desc: 'Clean organic comfort'
                            },
                            {
                              id: 'pill',
                              name: 'Pill Shape (9999px)',
                              desc: 'Friendly fluid premium'
                            }
                          ].map((style) => {
                            const isSelected = (siteConfig.branding.buttonStyle || 'rounded') === style.id;
                            return (
                              <button
                                key={style.id}
                                type="button"
                                onClick={() => {
                                  setSiteConfigState({
                                    ...siteConfig,
                                    branding: {
                                      ...siteConfig.branding,
                                      buttonStyle: style.id as any
                                    }
                                  });
                                }}
                                className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-[90px] ${
                                  isSelected
                                    ? 'bg-neutral-900 border-amber-500 shadow-md'
                                    : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700'
                                }`}
                              >
                                <span className={`text-[11px] font-extrabold ${isSelected ? 'text-amber-400' : 'text-white'}`}>{style.name}</span>
                                <span className="text-[9px] text-neutral-400 leading-normal">{style.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Glass Transparency Slider (Only active when glassy is active) */}
                      <div className="bg-neutral-950/60 border border-neutral-800/80 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <label className="block text-xs uppercase font-extrabold tracking-wider text-neutral-300">Glass Material Opacity</label>
                            <span className="block text-[11px] text-neutral-500">Control the backing transparency level for glass cards</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-amber-400 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded">
                            {siteConfig.branding.glassOpacity !== undefined ? siteConfig.branding.glassOpacity : 30}% Opacity
                          </span>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="range"
                            min="10"
                            max="90"
                            step="5"
                            value={siteConfig.branding.glassOpacity !== undefined ? siteConfig.branding.glassOpacity : 30}
                            onChange={(e) => {
                              setSiteConfigState({
                                ...siteConfig,
                                branding: {
                                  ...siteConfig.branding,
                                  glassOpacity: parseInt(e.target.value)
                                }
                              });
                            }}
                            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                          <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                            <span>10% (Sheer Glass)</span>
                            <span>50% (Semi-Opaque)</span>
                            <span>90% (Thick Velvet)</span>
                          </div>
                        </div>
                      </div>

                      {/* Neon Glow intensity */}
                      <div className="bg-neutral-950/60 border border-neutral-800/80 p-6 rounded-2xl space-y-4">
                        <div className="space-y-1">
                          <label className="block text-xs uppercase font-extrabold tracking-wider text-neutral-300">Neon Glow Shadow Intensity</label>
                          <span className="block text-[11px] text-neutral-500">Only applies when Card Base Style is set to "Ambient Neon Glow"</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'low', label: 'Subtle Glow (8%)' },
                            { id: 'medium', label: 'Balanced Glow (15%)' },
                            { id: 'high', label: 'Vibrant Blast (25%)' }
                          ].map((glow) => {
                            const isSelected = (siteConfig.branding.glowIntensity || 'medium') === glow.id;
                            const isDisabled = (siteConfig.branding.cardStyle || 'glassy') !== 'glow';
                            return (
                              <button
                                key={glow.id}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => {
                                  setSiteConfigState({
                                    ...siteConfig,
                                    branding: {
                                      ...siteConfig.branding,
                                      glowIntensity: glow.id as any
                                    }
                                  });
                                }}
                                className={`p-3 text-center rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                                  isDisabled 
                                    ? 'bg-neutral-950/20 border-neutral-900 text-neutral-600 cursor-not-allowed'
                                    : isSelected
                                      ? 'bg-neutral-900 border-amber-500 text-amber-400'
                                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                                }`}
                              >
                                {glow.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Live Responsive UI Sandbox Preview */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="bg-neutral-950/60 border border-neutral-800/80 p-5 rounded-2xl space-y-4 lg:sticky lg:top-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="block text-xs font-black uppercase text-amber-500 tracking-wider">Physics & Surface Sandbox</span>
                            <span className="block text-[10px] text-neutral-500">Tweak buttons & card styling controls to see live geometry changes</span>
                          </div>
                          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">Dynamic UI</span>
                        </div>

                        <div 
                          className="border rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-300 p-5 space-y-5"
                          style={{ 
                            borderColor: 'rgba(255,255,255,0.08)',
                            backgroundColor: 
                              siteConfig.branding.bgTone === 'deep-midnight' ? '#02040A' :
                              siteConfig.branding.bgTone === 'luxury-charcoal' ? '#121214' :
                              siteConfig.branding.bgTone === 'caribbean-night' ? '#010A0A' : '#080A0F'
                          }}
                        >
                          {/* Live Interactive Card Sample */}
                          <div 
                            className="p-5 transition-all duration-300 space-y-3"
                            style={{
                              borderRadius: (siteConfig.branding.buttonStyle || 'rounded') === 'sharp' ? '0px' : '24px',
                              backgroundColor: 
                                (siteConfig.branding.cardStyle || 'glassy') === 'flat'
                                  ? (siteConfig.branding.bgTone === 'deep-midnight' ? '#070913' : siteConfig.branding.bgTone === 'luxury-charcoal' ? '#1A1A1E' : siteConfig.branding.bgTone === 'caribbean-night' ? '#031414' : '#0D1118')
                                  : `rgba(13, 17, 24, ${(siteConfig.branding.glassOpacity !== undefined ? siteConfig.branding.glassOpacity : 30) / 100})`,
                              backdropFilter: (siteConfig.branding.cardStyle || 'glassy') === 'flat' ? 'none' : 'blur(16px)',
                              border: 
                                (siteConfig.branding.cardStyle || 'glassy') === 'bordered'
                                  ? `1.5px solid ${siteConfig.branding.primaryColor || '#F59E0B'}`
                                  : '1px solid rgba(255, 255, 255, 0.08)',
                              boxShadow: 
                                (siteConfig.branding.cardStyle || 'glassy') === 'glow'
                                  ? `0 0 ${(siteConfig.branding.glowIntensity || 'medium') === 'high' ? '30px' : (siteConfig.branding.glowIntensity || 'medium') === 'low' ? '10px' : '20px'} rgba(245, 158, 11, ${(siteConfig.branding.glowIntensity || 'medium') === 'high' ? '0.25' : (siteConfig.branding.glowIntensity || 'medium') === 'low' ? '0.08' : '0.15'})`
                                  : '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
                            }}
                          >
                            <span 
                              className="text-[9px] font-extrabold uppercase tracking-widest text-white/55 block"
                            >
                              Live Interactive Card Widget
                            </span>
                            <h4 
                              className="text-base font-extrabold text-white leading-tight"
                              style={{ fontFamily: siteConfig.branding.headingFont }}
                            >
                              Card Rounding & Border Shadows
                            </h4>
                            <p 
                              className="text-[11px] text-neutral-300 leading-relaxed font-light"
                              style={{ fontFamily: siteConfig.branding.bodyFont }}
                            >
                              Tweak sliders to see standard rounded parameters and card backgrounds morph live.
                            </p>

                            <div className="flex gap-2 pt-2">
                              <button 
                                type="button"
                                className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-neutral-950 transition-all active:scale-95 shadow-md flex-1 cursor-pointer"
                                style={{ 
                                  backgroundColor: siteConfig.branding.primaryColor || '#F59E0B',
                                  borderRadius: (siteConfig.branding.buttonStyle || 'rounded') === 'sharp' ? '0px' : (siteConfig.branding.buttonStyle || 'rounded') === 'pill' ? '9999px' : '12px',
                                  fontFamily: siteConfig.branding.bodyFont
                                }}
                              >
                                Button Primary
                              </button>
                              <button 
                                type="button"
                                className="px-4 py-2 text-[10px] font-black uppercase tracking-wider border border-white/25 text-white transition-all active:scale-95 bg-black/40 backdrop-blur-sm flex-1 cursor-pointer"
                                style={{ 
                                  borderRadius: (siteConfig.branding.buttonStyle || 'rounded') === 'sharp' ? '0px' : (siteConfig.branding.buttonStyle || 'rounded') === 'pill' ? '9999px' : '12px',
                                  fontFamily: siteConfig.branding.bodyFont
                                }}
                              >
                                Secondary
                              </button>
                            </div>
                          </div>

                          {/* Visual Spec Sheets */}
                          <div className="space-y-2 text-[11px] text-neutral-400 border-t border-white/[0.05] pt-3">
                            <div className="flex justify-between">
                              <span>Button Curvature Style:</span>
                              <span className="font-mono text-white font-bold uppercase text-[10px]">{siteConfig.branding.buttonStyle || 'rounded'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Card Surface Look:</span>
                              <span className="font-mono text-white font-bold uppercase text-[10px]">{siteConfig.branding.cardStyle || 'glassy'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Glass Transparency opacity:</span>
                              <span className="font-mono text-white font-bold">{siteConfig.branding.glassOpacity !== undefined ? siteConfig.branding.glassOpacity : 30}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Save Trigger Card */}
                        <div className="bg-neutral-900 border border-neutral-800/80 p-4 rounded-2xl flex items-center justify-between gap-4">
                          <p className="text-[10px] text-neutral-400 leading-normal">
                            Ready to apply this button roundness and card structure globally across the entire website?
                          </p>
                          <button
                            type="button"
                            onClick={handleSaveConfig}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-[10px] uppercase tracking-wider rounded-lg shrink-0 shadow transition-all cursor-pointer active:scale-95"
                          >
                            Save Style
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2.5: PAGE IMAGES & BANNERS MANAGER */}
          {activeAdminTab === 'page-images' && (
            <div className="space-y-8 animate-fadeIn font-sans">
              
              {/* Header Card */}
              <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-widest">
                    <Image className="w-3.5 h-3.5" /> Full Visual Autonomy
                  </div>
                  <h2 className="text-2xl font-black text-white font-serif tracking-tight">Dynamic Page Images Manager</h2>
                  <p className="text-xs text-neutral-400 leading-relaxed font-light">
                    As senior software developers, we give you full control over all website imagery. Select any page below to preview and replace images anytime. Upload from your phone/computer or choose from your media library.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleSaveConfig}
                    className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                  >
                    <Save className="w-4 h-4" /> Save All Changes
                  </button>
                </div>
              </div>

              {/* Sub-Tab Navigation Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-800">
                {[
                  { id: 'home', label: '🏠 Home Page', count: 4 },
                  { id: 'about-grenada', label: '🌴 About Grenada', count: 3 },
                  { id: 'about-mellowland', label: '🌊 About Mellowland', count: 3 },
                  { id: 'banners', label: 'ℹ️ Header Banners', count: 5 }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPageImagesSubTab(tab.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                      pageImagesSubTab === tab.id
                        ? 'bg-amber-500 text-neutral-950 shadow-lg'
                        : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800/80'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      pageImagesSubTab === tab.id ? 'bg-black/20 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* --- SUB-TAB: HOME PAGE --- */}
              {pageImagesSubTab === 'home' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white font-serif">Home Page Imagery</h3>
                      <p className="text-xs text-neutral-400">Manage feature section images displayed on the main home screen.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        key: 'homeWhiteGala',
                        title: 'Flagship White Gala Beach Party Card Image',
                        desc: 'Main feature card showing the beach DJ and white gala party venue.',
                        defaultUrl: FESTIVAL_IMAGES.whiteGala
                      },
                      {
                        key: 'homeLondonVibes',
                        title: 'London Vibes Meets Spice Isle Banner Image',
                        desc: 'High-energy crowd and DJ stage photo for the festival introduction.',
                        defaultUrl: FESTIVAL_IMAGES.festivalHero
                      },
                      {
                        key: 'homeBeachDJ',
                        title: 'Beach DJ Showcase Showcase Image',
                        desc: 'Beachfront turntable & Caribbean ocean sunset view.',
                        defaultUrl: FESTIVAL_IMAGES.hero
                      },
                      {
                        key: 'homeRiverTubing',
                        title: 'Mellowland River Tubing Feature Section Image',
                        desc: 'Lazy river tubing adventure in the tropical rainforest.',
                        defaultUrl: FESTIVAL_IMAGES.riverTubing
                      }
                    ].map((slot) => {
                      const currentVal = (siteConfig.pageImages as any)?.[slot.key] || slot.defaultUrl;
                      const isCustom = currentVal !== slot.defaultUrl;

                      return (
                        <div key={slot.key} className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-sm text-white">{slot.title}</h4>
                                <p className="text-[11px] text-neutral-400 mt-0.5">{slot.desc}</p>
                              </div>
                              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                                isCustom ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                              }`}>
                                {isCustom ? 'Custom Image' : 'Default Preset'}
                              </span>
                            </div>

                            {/* Image Preview */}
                            <div className="relative h-48 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 group">
                              <img
                                src={currentVal}
                                alt={slot.title}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.mellowlandGarden;
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                <a
                                  href={currentVal}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-neutral-900/90 text-white text-xs font-bold rounded-lg border border-neutral-700 flex items-center gap-1.5"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" /> View Full Image
                                </a>
                              </div>
                            </div>

                            {/* URL Input */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-neutral-400">Image Source URL</label>
                              <input
                                type="url"
                                value={currentVal}
                                onChange={(e) => {
                                  const url = e.target.value;
                                  setSiteConfigState({
                                    ...siteConfig,
                                    pageImages: {
                                      ...(siteConfig.pageImages || {}),
                                      [slot.key]: url
                                    }
                                  });
                                }}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-200 font-mono focus:border-amber-500 focus:outline-none"
                                placeholder="https://..."
                              />
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
                            <button
                              type="button"
                              onClick={() => setMediaSelectorTarget({ pageImageKey: slot.key })}
                              className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-amber-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <FolderOpen className="w-4 h-4" /> Replace / Upload
                            </button>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSiteConfigState({
                                    ...siteConfig,
                                    pageImages: {
                                      ...(siteConfig.pageImages || {}),
                                      [slot.key]: slot.defaultUrl
                                    }
                                  });
                                  setSaveToast('Reset to original default image');
                                }}
                                className="px-3 py-2.5 bg-neutral-900 hover:bg-rose-950/50 text-neutral-400 hover:text-rose-400 border border-neutral-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                title="Reset to default image"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- SUB-TAB: ABOUT GRENADA --- */}
              {pageImagesSubTab === 'about-grenada' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white font-serif">About Grenada Page Imagery</h3>
                    <p className="text-xs text-neutral-400">Customize nature photos and attraction cards on the Grenada island guide page.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        key: 'aboutGrenadaEco',
                        title: 'Grenada Eco Paradise Coastline Photo',
                        desc: 'Top card showing turquoise mountain cascades and rainforest peaks.',
                        defaultUrl: FESTIVAL_IMAGES.ecoParadise
                      },
                      {
                        key: 'aboutGrenadaUnderwater',
                        title: 'Molinière Bay Underwater Sculpture Park Banner',
                        desc: 'Banner photo for the world-famous underwater sculpture park.',
                        defaultUrl: FESTIVAL_IMAGES.underwaterPark
                      },
                      {
                        key: 'aboutGrenadaHero',
                        title: 'About Grenada Header Background',
                        desc: 'Background banner for the Island guide page header.',
                        defaultUrl: FESTIVAL_IMAGES.hero
                      }
                    ].map((slot) => {
                      const currentVal = (siteConfig.pageImages as any)?.[slot.key] || slot.defaultUrl;
                      const isCustom = currentVal !== slot.defaultUrl;

                      return (
                        <div key={slot.key} className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-sm text-white">{slot.title}</h4>
                                <p className="text-[11px] text-neutral-400 mt-0.5">{slot.desc}</p>
                              </div>
                              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                                isCustom ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                              }`}>
                                {isCustom ? 'Custom Image' : 'Default Preset'}
                              </span>
                            </div>

                            <div className="relative h-48 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 group">
                              <img
                                src={currentVal}
                                alt={slot.title}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.mellowlandGarden;
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-neutral-400">Image Source URL</label>
                              <input
                                type="url"
                                value={currentVal}
                                onChange={(e) => {
                                  const url = e.target.value;
                                  setSiteConfigState({
                                    ...siteConfig,
                                    pageImages: {
                                      ...(siteConfig.pageImages || {}),
                                      [slot.key]: url
                                    }
                                  });
                                }}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-200 font-mono focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
                            <button
                              type="button"
                              onClick={() => setMediaSelectorTarget({ pageImageKey: slot.key })}
                              className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-amber-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <FolderOpen className="w-4 h-4" /> Replace / Upload
                            </button>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSiteConfigState({
                                    ...siteConfig,
                                    pageImages: {
                                      ...(siteConfig.pageImages || {}),
                                      [slot.key]: slot.defaultUrl
                                    }
                                  });
                                  setSaveToast('Reset to original default image');
                                }}
                                className="px-3 py-2.5 bg-neutral-900 hover:bg-rose-950/50 text-neutral-400 hover:text-rose-400 border border-neutral-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- SUB-TAB: ABOUT MELLOWLAND --- */}
              {pageImagesSubTab === 'about-mellowland' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white font-serif">About Mellowland Tubing Imagery</h3>
                    <p className="text-xs text-neutral-400">Change river tubing and tropical garden sanctuary imagery.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        key: 'aboutMellowlandRiver',
                        title: '45-Minute River Tubing Feature Image',
                        desc: 'Main action photo showing river tubing supervised sessions.',
                        defaultUrl: FESTIVAL_IMAGES.riverTubing
                      },
                      {
                        key: 'aboutMellowlandGarden',
                        title: 'Tropical Garden Sanctuary Image',
                        desc: 'Botanical garden lounge and riverbank relaxation area.',
                        defaultUrl: FESTIVAL_IMAGES.mellowlandGarden
                      },
                      {
                        key: 'aboutMellowlandHero',
                        title: 'Mellowland Page Header Banner',
                        desc: 'Background banner for the Mellowland page top header.',
                        defaultUrl: FESTIVAL_IMAGES.riverTubing
                      }
                    ].map((slot) => {
                      const currentVal = (siteConfig.pageImages as any)?.[slot.key] || slot.defaultUrl;
                      const isCustom = currentVal !== slot.defaultUrl;

                      return (
                        <div key={slot.key} className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-sm text-white">{slot.title}</h4>
                                <p className="text-[11px] text-neutral-400 mt-0.5">{slot.desc}</p>
                              </div>
                              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                                isCustom ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                              }`}>
                                {isCustom ? 'Custom Image' : 'Default Preset'}
                              </span>
                            </div>

                            <div className="relative h-48 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 group">
                              <img
                                src={currentVal}
                                alt={slot.title}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.mellowlandGarden;
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-neutral-400">Image Source URL</label>
                              <input
                                type="url"
                                value={currentVal}
                                onChange={(e) => {
                                  const url = e.target.value;
                                  setSiteConfigState({
                                    ...siteConfig,
                                    pageImages: {
                                      ...(siteConfig.pageImages || {}),
                                      [slot.key]: url
                                    }
                                  });
                                }}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-200 font-mono focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
                            <button
                              type="button"
                              onClick={() => setMediaSelectorTarget({ pageImageKey: slot.key })}
                              className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-amber-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <FolderOpen className="w-4 h-4" /> Replace / Upload
                            </button>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSiteConfigState({
                                    ...siteConfig,
                                    pageImages: {
                                      ...(siteConfig.pageImages || {}),
                                      [slot.key]: slot.defaultUrl
                                    }
                                  });
                                  setSaveToast('Reset to original default image');
                                }}
                                className="px-3 py-2.5 bg-neutral-900 hover:bg-rose-950/50 text-neutral-400 hover:text-rose-400 border border-neutral-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}



              {/* --- SUB-TAB: INFO PAGE BANNERS --- */}
              {pageImagesSubTab === 'banners' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white font-serif">Info Page Header Banners</h3>
                    <p className="text-xs text-neutral-400">Header background photos for secondary pages (Transportation, Contact, Insurance, Terms).</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        key: 'transportationBanner',
                        title: 'Transportation & Airport Shuttles Banner',
                        desc: 'Top header background for Maurice Bishop GND transfers.',
                        defaultUrl: FESTIVAL_IMAGES.hero
                      },
                      {
                        key: 'testimonialsBanner',
                        title: 'Guest Testimonials & Reviews Banner',
                        desc: 'Top header background for guest reviews & festival feedback.',
                        defaultUrl: FESTIVAL_IMAGES.festivalHero
                      },
                      {
                        key: 'contactBanner',
                        title: 'Contact & VIP Concierge Banner',
                        desc: 'Top header background for executive concierge & helpline.',
                        defaultUrl: FESTIVAL_IMAGES.whiteGala
                      },
                      {
                        key: 'travelInsuranceBanner',
                        title: 'Travel Insurance & Guarantee Banner',
                        desc: 'Top header background for insurance & health coverage info.',
                        defaultUrl: FESTIVAL_IMAGES.ecoParadise
                      },
                      {
                        key: 'termsBanner',
                        title: 'Terms, Wristbands & Refund Policy Banner',
                        desc: 'Top header background for legal terms & wristband rules.',
                        defaultUrl: FESTIVAL_IMAGES.mellowlandGarden
                      }
                    ].map((slot) => {
                      const currentVal = (siteConfig.pageImages as any)?.[slot.key] || slot.defaultUrl;
                      const isCustom = currentVal !== slot.defaultUrl;

                      return (
                        <div key={slot.key} className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-sm text-white">{slot.title}</h4>
                                <p className="text-[11px] text-neutral-400 mt-0.5">{slot.desc}</p>
                              </div>
                              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                                isCustom ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                              }`}>
                                {isCustom ? 'Custom Banner' : 'Default Preset'}
                              </span>
                            </div>

                            <div className="relative h-40 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 group">
                              <img
                                src={currentVal}
                                alt={slot.title}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.mellowlandGarden;
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-neutral-400">Image Source URL</label>
                              <input
                                type="url"
                                value={currentVal}
                                onChange={(e) => {
                                  const url = e.target.value;
                                  setSiteConfigState({
                                    ...siteConfig,
                                    pageImages: {
                                      ...(siteConfig.pageImages || {}),
                                      [slot.key]: url
                                    }
                                  });
                                }}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-200 font-mono focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
                            <button
                              type="button"
                              onClick={() => setMediaSelectorTarget({ pageImageKey: slot.key })}
                              className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-amber-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <FolderOpen className="w-4 h-4" /> Replace / Upload
                            </button>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSiteConfigState({
                                    ...siteConfig,
                                    pageImages: {
                                      ...(siteConfig.pageImages || {}),
                                      [slot.key]: slot.defaultUrl
                                    }
                                  });
                                  setSaveToast('Reset to original default image');
                                }}
                                className="px-3 py-2.5 bg-neutral-900 hover:bg-rose-950/50 text-neutral-400 hover:text-rose-400 border border-neutral-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
          {activeAdminTab === 'analytics' && (() => {
            // Compute real-time statistics from active dashboard state
            const totalSubmissions = submissions.length;
            const orders = submissions.filter(s => s.type === 'pass-order');
            const flightRegs = submissions.filter(s => s.type === 'flight-registration');
            const transports = submissions.filter(s => s.type === 'transport-request');
            const newsletters = submissions.filter(s => s.type === 'newsletter');
            const contacts = submissions.filter(s => s.type === 'contact');

            // Revenue calculation from passes and transport requests
            const gbpRevenueVal = orders.reduce((sum, s) => sum + (s.amountGBP || 0), 0) + transports.reduce((sum, s) => sum + (s.amountGBP || 0), 0);
            const usdRevenueVal = gbpRevenueVal * 1.28;

            // Processing statuses
            const statusNew = submissions.filter(s => s.status === 'new').length;
            const statusInReview = submissions.filter(s => s.status === 'in-review').length;
            const statusResolved = submissions.filter(s => s.status === 'resolved').length;
            const responseRate = totalSubmissions > 0 
              ? Math.round((statusResolved / totalSubmissions) * 100) 
              : 100;

            // Events breakdown
            const totalEventsCount = events.length;
            const categoryMusic = events.filter(e => e.category === 'Music').length;
            const categoryCultural = events.filter(e => e.category === 'Cultural').length;
            const categoryAdventure = events.filter(e => e.category === 'Adventure').length;
            const categoryGala = events.filter(e => e.category === 'Gala').length;
            const categoryParty = events.filter(e => e.category === 'Party').length;

            // Hotels breakdown
            const totalHotelsCount = hotels.length;
            const recommendedCount = hotels.filter(h => h.isRecommended).length;
            const avgStars = totalHotelsCount > 0 
              ? (hotels.reduce((sum, h) => sum + h.stars, 0) / totalHotelsCount).toFixed(1)
              : '4.7';

            // Testimonials
            const totalTestimonialsCount = testimonials.length;
            const avgRatingVal = totalTestimonialsCount > 0
              ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / totalTestimonialsCount).toFixed(1)
              : '4.9';

            const totalGalleryItems = galleryItems.length;

            // Compute dynamic real visitor counts based on actual database entries
            const getLocVisitors = (locName: string) => {
              const baseCount = submissions.length;
              if (locName === 'Grand Anse Beach') {
                const subMatch = submissions.filter(s => {
                  const text = JSON.stringify(s).toLowerCase();
                  return text.includes('grand anse') || text.includes('beach') || text.includes('gala') || text.includes('pass') || s.type === 'pass-order';
                }).length;
                return subMatch * 12 + Math.min(25, events.length) * 8;
              }
              if (locName === 'Mellowland Village') {
                const subMatch = submissions.filter(s => {
                  const text = JSON.stringify(s).toLowerCase();
                  return text.includes('mellowland') || text.includes('river') || text.includes('tubing') || text.includes('village') || text.includes('cultural');
                }).length;
                return subMatch * 10 + Math.min(25, events.length) * 6;
              }
              if (locName === "St. George's") {
                const subMatch = submissions.filter(s => {
                  const text = JSON.stringify(s).toLowerCase();
                  return text.includes("george") || text.includes("carenage") || text.includes("capital") || text.includes("town") || text.includes("opening");
                }).length;
                return subMatch * 8 + Math.min(25, events.length) * 4;
              }
              if (locName === 'Carriacou Island') {
                const subMatch = submissions.filter(s => {
                  const text = JSON.stringify(s).toLowerCase();
                  return text.includes('carriacou') || text.includes('sister') || text.includes('excursion');
                }).length;
                return subMatch * 6 + Math.min(25, events.length) * 2;
              }
              if (locName === 'Point Salines (Airport)') {
                const subMatch = submissions.filter(s => {
                  const text = JSON.stringify(s).toLowerCase();
                  return s.type === 'flight-registration' || text.includes('airport') || text.includes('flight') || text.includes('arrival') || s.type === 'transport-request';
                }).length;
                return subMatch * 15 + 5;
              }
              return baseCount * 5;
            };

            // Location stats mapping for geographic analyzer
            const locationsDict: Record<string, {
              coords: { x: string; y: string };
              events: EventItem[];
              hotels: HotelItem[];
              visitorsCount: number;
              desc: string;
              icon: string;
            }> = {
              'Grand Anse Beach': {
                coords: { x: '35%', y: '82%' },
                events: events.filter(e => e.location.toLowerCase().includes('grand anse') || e.location.toLowerCase().includes('beach') || e.location.toLowerCase().includes('sunset') || e.location.toLowerCase().includes('fete')),
                hotels: hotels.filter(h => h.location.toLowerCase().includes('grand anse') || h.location.toLowerCase().includes('salines') || h.location.toLowerCase().includes('epine') || h.location.toLowerCase().includes('cinna')),
                visitorsCount: getLocVisitors('Grand Anse Beach'),
                desc: 'Famous 2-mile golden sand crescent. Absolute central hub for beachfront sunset fetes, VIP cabanas, and stage-front ocean breeze concerts.',
                icon: 'palmtree'
              },
              'Mellowland Village': {
                coords: { x: '58%', y: '62%' },
                events: events.filter(e => e.location.toLowerCase().includes('mellowland') || e.location.toLowerCase().includes('river') || e.location.toLowerCase().includes('tubing') || e.location.toLowerCase().includes('village') || e.location.toLowerCase().includes('arena')),
                hotels: hotels.filter(h => h.location.toLowerCase().includes('mellowland') || h.location.toLowerCase().includes('rainforest') || h.location.toLowerCase().includes('interior')),
                visitorsCount: getLocVisitors('Mellowland Village'),
                desc: 'Lush mountain forest eco-haven. Core domain for river tubing races, the Caricom Cultural Arena, local spice bazaars, and drumming circles.',
                icon: 'compass'
              },
              'St. George\'s': {
                coords: { x: '25%', y: '72%' },
                events: events.filter(e => e.location.toLowerCase().includes('george') || e.location.toLowerCase().includes('carenage') || e.location.toLowerCase().includes('capital') || e.location.toLowerCase().includes('gala') || e.location.toLowerCase().includes('history')),
                hotels: hotels.filter(h => h.location.toLowerCase().includes('george') || h.location.toLowerCase().includes('town') || h.location.toLowerCase().includes('city') || h.location.toLowerCase().includes('capital')),
                visitorsCount: getLocVisitors("St. George's"),
                desc: 'Historic capital harbor. Venue for the formal CARICOM Opening Ceremony, diplomatic gala banquets, and heritage museum tours.',
                icon: 'globe'
              },
              'Carriacou Island': {
                coords: { x: '75%', y: '18%' },
                events: events.filter(e => e.location.toLowerCase().includes('carriacou') || e.location.toLowerCase().includes('sister') || e.location.toLowerCase().includes('drumming') || e.location.toLowerCase().includes('excursion')),
                hotels: hotels.filter(h => h.location.toLowerCase().includes('carriacou')),
                visitorsCount: getLocVisitors('Carriacou Island'),
                desc: 'Grenada\'s sister island. Celebrated for traditional wooden boat building, Shakespeare Mas fusions, and pristine marine reef diving.',
                icon: 'sun'
              },
              'Point Salines (Airport)': {
                coords: { x: '15%', y: '88%' },
                events: events.filter(e => e.location.toLowerCase().includes('airport') || e.location.toLowerCase().includes('welcome') || e.location.toLowerCase().includes('arrival') || e.location.toLowerCase().includes('landing')),
                hotels: hotels.filter(h => h.location.toLowerCase().includes('royalton') || h.location.toLowerCase().includes('sandals') || h.location.toLowerCase().includes('salines')),
                visitorsCount: getLocVisitors('Point Salines (Airport)'),
                desc: 'Maurice Bishop International Airport entry point. Dedicated VIP lounge suite, shuttle dispatch centers, and welcoming guest coordinators.',
                icon: 'plane'
              }
            };

            const selectedLocData = locationsDict[selectedAnalyticsLocation] || locationsDict['Grand Anse Beach'];

            // Time series charts dataset (dynamically configured from range and database state)
            let daysCount = 7;
            let endRefDate = new Date();

            if (analyticsRange === '7d') {
              daysCount = 7;
            } else if (analyticsRange === '30d') {
              daysCount = 30;
            } else if (analyticsRange === '90d') {
              daysCount = 90;
            } else if (analyticsRange === '1y') {
              daysCount = 365;
            } else if (analyticsRange === 'custom') {
              const start = customStartDate ? new Date(customStartDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
              const end = customEndDate ? new Date(customEndDate) : new Date();
              if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
                const diffTime = Math.abs(end.getTime() - start.getTime());
                daysCount = Math.min(365, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
                endRefDate = new Date(end);
              } else {
                daysCount = 7;
              }
            }

            const chartDays: { date: string; sales: number; revenue: number; signups: number; label: string }[] = [];
            for (let i = daysCount - 1; i >= 0; i--) {
              const d = new Date(endRefDate);
              d.setDate(d.getDate() - i);
              const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const dateStringPrefix = `${year}-${month}-${day}`;

              const daySubmissions = submissions.filter(s => s.submittedAt && s.submittedAt.startsWith(dateStringPrefix));
              const dayOrders = daySubmissions.filter(s => s.type === 'pass-order');
              const daySales = dayOrders.length;
              const dayRevenue = dayOrders.reduce((sum, s) => sum + (s.amountGBP || 0), 0);
              const daySignups = daySubmissions.length;

              let milestoneLabel = 'Stable Operations';
              if (i === daysCount - 1) {
                milestoneLabel = 'Start of Trend Window';
              } else if (i === 0) {
                milestoneLabel = "End of Trend Window";
              } else if (daySales > 0) {
                milestoneLabel = `${daySales} VIP Pass Purchase(s)`;
              } else if (daySignups > 0) {
                milestoneLabel = `${daySignups} Dynamic Signup(s)`;
              } else {
                milestoneLabel = 'Live Database Sync';
              }

              chartDays.push({
                date: dateLabel,
                sales: daySales,
                revenue: dayRevenue,
                signups: daySignups,
                label: milestoneLabel
              });
            }

            const maxRevenueVal = Math.max(...chartDays.map(d => d.revenue), 100);
            const maxSignupsVal = Math.max(...chartDays.map(d => d.signups), 5);

            const activePoint = (hoveredChartIndex !== null && hoveredChartIndex < chartDays.length) 
              ? chartDays[hoveredChartIndex] 
              : chartDays[chartDays.length - 1];

            // Helper for custom SVG chart coordinates mapping with dynamic auto-scaling
            const getX = (index: number) => 40 + index * (440 / Math.max(1, chartDays.length - 1));
            const getY = (val: number) => 170 - (val / maxRevenueVal) * 140; 
            const pointsPath = chartDays.map((d, i) => `${getX(i)},${getY(d.revenue)}`).join(' L ');
            const areaPath = `M 40,170 L ${pointsPath} L 480,170 Z`;

            return (
              <div className="space-y-6 animate-fadeIn pb-12">
                
                {/* 1. Header welcome banner */}
                <div className="bg-[#0D1022] border border-neutral-800/80 p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-1.5 z-10 relative">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-widest">
                      <ShieldCheck className="w-3.5 h-3.5" /> Real-time Analytics System
                    </div>
                    <h2 className="text-2xl font-bold text-white font-serif">Command Deck & Live Analytics</h2>
                    <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl font-light">
                      Unified operations console aggregating database collections, live web forms, ticket conversions, venue geographical layouts, and hotel bookings for CARICOM 2027.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 z-10">
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-55 active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
                      {isSyncing ? 'Synchronizing...' : 'Live Re-Sync'}
                    </button>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      SECURE DB LINKED
                    </span>
                  </div>
                </div>

                {/* 2. Key Performance Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Card 1: Ticket Revenue */}
                  <div className="bg-neutral-900/60 border border-neutral-800/80 p-5 rounded-2xl space-y-3 hover:border-neutral-700 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Total Gross Sales</span>
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Ticket className="w-4 h-4 text-amber-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-2xl font-black text-white font-mono tracking-tight">
                        £{gbpRevenueVal.toLocaleString()}
                      </span>
                      <span className="block text-[11px] text-amber-500 font-mono">
                        ≈ ${Math.round(usdRevenueVal).toLocaleString()} USD
                      </span>
                    </div>
                    <div className="pt-2.5 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span>Paid Orders:</span>
                      <span className="font-bold text-white">{orders.length} passes</span>
                    </div>
                  </div>

                  {/* Card 2: Received Forms & Processing */}
                  <div className="bg-neutral-900/60 border border-neutral-800/80 p-5 rounded-2xl space-y-3 hover:border-neutral-700 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Inbound Registrations</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-2xl font-black text-white font-mono tracking-tight">
                        {totalSubmissions}
                      </span>
                      <span className="block text-[11px] text-emerald-500 font-mono">
                        {responseRate}% Resolution Rate
                      </span>
                    </div>
                    <div className="pt-2.5 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span>Status (N/R):</span>
                      <span className="font-bold text-white">
                        <span className="text-rose-400">{statusNew}</span>/{statusResolved}
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Event Coordinator Statistics */}
                  <div className="bg-neutral-900/60 border border-neutral-800/80 p-5 rounded-2xl space-y-3 hover:border-neutral-700 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Festival Events</span>
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-purple-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-2xl font-black text-white font-mono tracking-tight">
                        {totalEventsCount}
                      </span>
                      <span className="block text-[11px] text-purple-400 font-mono">
                        Across 5 categories
                      </span>
                    </div>
                    <div className="pt-2.5 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span>Music / Fetes:</span>
                      <span className="font-bold text-white">{categoryMusic} / {categoryParty}</span>
                    </div>
                  </div>

                  {/* Card 4: Partner Hotels Summary */}
                  <div className="bg-neutral-900/60 border border-neutral-800/80 p-5 rounded-2xl space-y-3 hover:border-neutral-700 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Accommodations</span>
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <Hotel className="w-4 h-4 text-cyan-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-2xl font-black text-white font-mono tracking-tight">
                        {totalHotelsCount}
                      </span>
                      <span className="block text-[11px] text-cyan-500 font-mono">
                        ★ {avgStars} average rating
                      </span>
                    </div>
                    <div className="pt-2.5 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span>Recommended:</span>
                      <span className="font-bold text-white">{recommendedCount} luxury partners</span>
                    </div>
                  </div>

                </div>

                {/* 3. Advanced Charts Section (Interactive Area & Bar Chart Combo) */}
                <div className="bg-[#0A0D1A] border border-neutral-800/80 rounded-2xl p-6 space-y-6">
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500">Ticketing Performance & Velocity</span>
                      <h3 className="text-base font-bold text-white mt-0.5 font-serif">
                        {analyticsRange === '7d' ? '7-Day' : analyticsRange === '30d' ? '30-Day' : analyticsRange === '90d' ? '90-Day' : analyticsRange === '1y' ? '1-Year' : 'Custom Period'} Sales Trend & Registration Velocity
                      </h3>
                      <p className="text-[11px] text-neutral-400 font-light">Interactive tracking of daily ticket purchases and newsletter conversions.</p>
                    </div>

                    <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-900 flex items-center gap-6 text-[10px] font-mono font-bold text-neutral-400 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                        <span>Sales (£ GBP)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-neutral-800 border border-neutral-700" />
                        <span>Web Registrations</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeframe Selectors & Custom Date Range Pickers */}
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-900 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                        {([
                          { id: '7d', label: '7 Days' },
                          { id: '30d', label: '30 Days' },
                          { id: '90d', label: '90 Days' },
                          { id: '1y', label: '1 Year' },
                          { id: 'custom', label: '✨ Custom Range' }
                        ] as const).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setAnalyticsRange(tab.id)}
                            className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                              analyticsRange === tab.id
                                ? 'bg-amber-500 text-neutral-950 shadow'
                                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                            }`}
                          >
                             {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="text-[10px] text-neutral-400 font-mono">
                        Timeline points: <span className="font-bold text-white">{chartDays.length} days</span>
                      </div>
                    </div>

                    {analyticsRange === 'custom' && (
                      <div className="pt-2 border-t border-neutral-900 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-neutral-400 font-bold uppercase">From:</span>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            max={customEndDate || undefined}
                            className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-neutral-400 font-bold uppercase">To:</span>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            min={customStartDate || undefined}
                            max={new Date().toISOString().split('T')[0]}
                            className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>

                        <p className="text-[10px] text-neutral-500 font-light leading-snug">
                          * Maximum allowed range is 1 year (365 days) backwards from your end date.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    
                    {/* Left 8 columns: Rendered Custom SVG Chart */}
                    <div className="lg:col-span-8 bg-neutral-950/40 border border-neutral-900 p-4 rounded-xl relative">
                      <svg viewBox="0 0 500 210" className="w-full h-56 overflow-visible select-none">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Y-Axis guidelines */}
                        <g stroke="rgba(255,255,255,0.03)" strokeWidth="1">
                          <line x1="40" y1="20" x2="480" y2="20" />
                          <line x1="40" y1="57.5" x2="480" y2="57.5" />
                          <line x1="40" y1="95" x2="480" y2="95" />
                          <line x1="40" y1="132.5" x2="480" y2="132.5" />
                          <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.08)" />
                        </g>

                        {/* Chart Y labels (Auto-scales to actual revenue metrics in the database) */}
                        <g fill="rgba(255,255,255,0.3)" className="text-[8px] font-mono" textAnchor="end">
                          <text x="32" y="23">£{Math.round(maxRevenueVal).toLocaleString()}</text>
                          <text x="32" y="61">£{Math.round(maxRevenueVal * 0.75).toLocaleString()}</text>
                          <text x="32" y="98">£{Math.round(maxRevenueVal * 0.5).toLocaleString()}</text>
                          <text x="32" y="136">£{Math.round(maxRevenueVal * 0.25).toLocaleString()}</text>
                          <text x="32" y="173">£0</text>
                        </g>

                        {/* Background Signups Bar charts (Auto-scales to actual registration volume) */}
                        {chartDays.map((d, i) => {
                          const barWidth = Math.max(1.5, Math.min(14, 250 / chartDays.length));
                          const barHeight = (d.signups / maxSignupsVal) * 130;
                          const bx = getX(i) - barWidth / 2;
                          const by = 170 - barHeight;
                          return (
                            <rect
                              key={i}
                              x={bx}
                              y={by}
                              width={barWidth}
                              height={barHeight}
                              fill="rgba(255, 255, 255, 0.05)"
                              stroke="rgba(255, 255, 255, 0.1)"
                              rx="2"
                              className="transition-all"
                            />
                          );
                        })}

                        {/* Sales Filled Area Path */}
                        <path d={areaPath} fill="url(#chartGrad)" />

                        {/* Sales Line Path */}
                        <path d={`M ${pointsPath}`} fill="none" stroke={primaryColor} strokeWidth="2" />

                        {/* Active hover indicators */}
                        {hoveredChartIndex !== null && hoveredChartIndex < chartDays.length && (
                          <line 
                            x1={getX(hoveredChartIndex)} 
                            y1="20" 
                            x2={getX(hoveredChartIndex)} 
                            y2="170" 
                            stroke="rgba(245, 158, 11, 0.25)" 
                            strokeDasharray="3 3"
                            strokeWidth="1.5"
                          />
                        )}

                        {/* Interactive Nodes and Overlays */}
                        {chartDays.map((d, i) => {
                          const cx = getX(i);
                          const cy = getY(d.revenue);
                          const isHovered = hoveredChartIndex === i;
                          const shouldRenderCircle = chartDays.length <= 31 || isHovered || i === 0 || i === chartDays.length - 1 || d.revenue > 0;
                          
                          // Calculate hover bounds dynamically to fit the width perfectly
                          const hWidth = 440 / Math.max(1, chartDays.length - 1);
                          
                          return (
                            <g key={i}>
                              {shouldRenderCircle && (
                                <circle 
                                  cx={cx} 
                                  cy={cy} 
                                  r={isHovered ? 5.5 : 3.5} 
                                  fill={isHovered ? '#FFFFFF' : primaryColor} 
                                  stroke={isHovered ? primaryColor : '#090B15'} 
                                  strokeWidth={1.5}
                                  className="transition-all duration-150"
                                />
                              )}
                              
                              {/* Invisible interactive hover segment */}
                              <rect
                                x={cx - hWidth / 2}
                                y="10"
                                width={Math.max(4, hWidth)}
                                height="175"
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredChartIndex(i)}
                                onMouseLeave={() => setHoveredChartIndex(null)}
                              />
                            </g>
                          );
                        })}

                        {/* Axis Labels */}
                        {chartDays.map((d, i) => {
                          const labelInterval = Math.max(1, Math.ceil(chartDays.length / 8));
                          const shouldShowLabel = i % labelInterval === 0 || i === chartDays.length - 1;
                          
                          if (!shouldShowLabel) return null;
                          
                          return (
                            <text 
                              key={i} 
                              x={getX(i)} 
                              y="190" 
                              textAnchor="middle" 
                              fill={hoveredChartIndex === i ? '#FFFFFF' : 'rgba(255,255,255,0.4)'} 
                              className="text-[9px] font-mono font-bold transition-colors"
                            >
                              {d.date}
                            </text>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Right 4 columns: Focus Spec sheet card */}
                    <div className="lg:col-span-4 bg-neutral-950/60 border border-neutral-900 p-5 rounded-xl space-y-4">
                      <div className="flex items-center justify-between pb-2.5 border-b border-neutral-900">
                        <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">Sector Highlight</span>
                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                          {activePoint.date}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <span className="text-xs text-white font-extrabold block">
                          {activePoint.label}
                        </span>
                        
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/50">
                            <span className="block text-[9px] font-bold text-neutral-400 uppercase">Daily Revenue</span>
                            <span className="block text-base font-black font-mono mt-0.5" style={{ color: primaryColor }}>
                              £{activePoint.revenue.toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/50">
                            <span className="block text-[9px] font-bold text-neutral-400 uppercase">Fete passes</span>
                            <span className="block text-base font-black font-mono text-white mt-0.5">
                              {activePoint.sales} sold
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 bg-[#0D1022] rounded-xl border border-neutral-800/80 space-y-2">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-neutral-400">Total Signups / Enquiries:</span>
                            <span className="font-mono text-emerald-400 font-bold">{activePoint.signups} units</span>
                          </div>
                          <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden">
                            <div 
                              className="h-1 bg-emerald-500 rounded-full transition-all duration-300" 
                              style={{ width: `${Math.min(100, (activePoint.signups / 80) * 100)}%` }} 
                            />
                          </div>
                        </div>

                        <p className="text-[10px] text-neutral-500 leading-normal leading-relaxed">
                          * Hover over any node in the left graph to display historical triggers, fete release metrics, and live registration velocity coordinates.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 4. Interactive Location & Geographical Telemetry Console */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  
                  {/* Left Column: Stylized Vector Map representation */}
                  <div className="xl:col-span-7 bg-[#0A0D1A] border border-neutral-800/80 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">Sector Mapping Matrix</span>
                        <h3 className="text-base font-bold text-white mt-0.5 font-serif">Geographic Telemetry & Venues</h3>
                        <p className="text-[11px] text-neutral-400">Select any active coordinate pin to extract associated events, hotels, and visitor distribution.</p>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-2 py-1 rounded border border-neutral-900 uppercase">
                        Interactive SVG Map
                      </span>
                    </div>

                    <div className="relative aspect-square sm:aspect-[4/3] bg-neutral-950/70 border border-neutral-900 rounded-xl overflow-hidden flex items-center justify-center p-4">
                      
                      {/* Grid background styling */}
                      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:16px_16px] opacity-80" />
                      
                      {/* Stylized geographical lines info overlay */}
                      <div className="absolute bottom-3 left-3 text-[9px] font-mono text-neutral-500/80 space-y-0.5 pointer-events-none">
                        <p>COORD: 12.1165° N, 61.6790° W</p>
                        <p>DATUM: WGS-84 CARICOM GRID</p>
                      </div>

                      <div className="absolute top-3 right-3 text-[9px] font-mono text-neutral-500/80 pointer-events-none">
                        <p>GRENADA ARCHIPELAGO SECTOR</p>
                      </div>

                      {/* Map Container */}
                      <div className="relative w-full max-w-[340px] aspect-square">
                        
                        {/* 1. Vector Path of Grenada Mainland (Polished Custom Stylized Shape) */}
                        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full text-neutral-800 pointer-events-none">
                          {/* Stylized background grid line */}
                          <line x1="0" y1="100" x2="200" y2="100" stroke="rgba(255,255,255,0.02)" strokeDasharray="2 2" />
                          <line x1="100" y1="0" x2="100" y2="200" stroke="rgba(255,255,255,0.02)" strokeDasharray="2 2" />

                          {/* Island Path (Stretching diagonally) */}
                          <path
                            d="M 60,170 C 50,165 40,150 45,135 C 48,125 58,118 68,110 C 78,102 82,90 85,78 C 88,68 95,62 105,65 C 115,68 122,82 128,95 C 132,105 142,110 148,120 C 152,130 140,145 130,155 C 120,165 105,175 90,172 C 75,170 65,172 60,170 Z"
                            fill="rgba(245, 158, 11, 0.03)"
                            stroke="rgba(255, 255, 255, 0.08)"
                            strokeWidth="1.5"
                          />

                          {/* Carriacou Island Outlier */}
                          <path
                            d="M 140,40 C 135,32 145,20 155,24 C 165,28 158,45 145,45 C 142,45 141,42 140,40 Z"
                            fill="rgba(16, 185, 129, 0.03)"
                            stroke="rgba(255, 255, 255, 0.08)"
                            strokeWidth="1"
                          />
                        </svg>

                        {/* 2. Interactive Glowing sector pins */}
                        {Object.entries(locationsDict).map(([name, loc]) => {
                          const isSelected = selectedAnalyticsLocation === name;
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setSelectedAnalyticsLocation(name)}
                              className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-25 group"
                              style={{ left: loc.coords.x, top: loc.coords.y }}
                            >
                              <span className="relative flex h-8 w-8 items-center justify-center">
                                {/* Glowing neon pulse rings */}
                                {isSelected && (
                                  <>
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-35" style={{ backgroundColor: primaryColor }} />
                                    <span className="absolute inline-flex h-5 w-5 rounded-full opacity-20" style={{ backgroundColor: primaryColor }} />
                                  </>
                                )}
                                {/* Active core pin */}
                                <span 
                                  className={`h-3 w-3 rounded-full border border-black shadow-md transition-all ${
                                    isSelected 
                                      ? 'bg-white scale-125' 
                                      : 'bg-neutral-600 hover:bg-amber-400 group-hover:scale-110'
                                  }`}
                                  style={!isSelected ? { backgroundColor: primaryColor } : undefined}
                                />
                              </span>
                              
                              {/* Pin Tooltip labels */}
                              <span className={`absolute top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded text-[8px] font-mono font-bold border transition-all pointer-events-none ${
                                isSelected
                                  ? 'bg-white text-neutral-950 border-white opacity-100 translate-y-0 shadow-lg'
                                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 opacity-60 group-hover:opacity-100 group-hover:translate-y-px'
                              }`}>
                                {name}
                              </span>
                            </button>
                          );
                        })}

                      </div>
                    </div>

                    {/* Sector selectors list */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                      {Object.keys(locationsDict).map((name) => {
                        const isSelected = selectedAnalyticsLocation === name;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setSelectedAnalyticsLocation(name)}
                            className={`p-2 rounded-xl border text-[10px] font-bold transition-all text-center cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-neutral-950 border-amber-400 font-extrabold shadow-md'
                                : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:border-neutral-800'
                            }`}
                          >
                            {name.replace(' (Airport)', '')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Dynamic Data Inspector for selected location */}
                  <div className="xl:col-span-5 bg-[#0A0D1A] border border-neutral-800/80 p-6 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-4">
                      
                      {/* Selected Location Title & Meta */}
                      <div className="pb-3 border-b border-neutral-800/60 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest">Sector Inspector</span>
                          <h4 className="text-base font-bold text-white font-serif">{selectedAnalyticsLocation}</h4>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {selectedLocData.visitorsCount} Projected Guests
                        </span>
                      </div>

                      {/* Sector Description */}
                      <p className="text-[11px] text-neutral-400 leading-relaxed font-light">
                        {selectedLocData.desc}
                      </p>

                      {/* Filtered Events List */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400 uppercase">
                          <span>Scheduled Sector Events</span>
                          <span className="text-neutral-500 font-mono">({selectedLocData.events.length})</span>
                        </div>

                        {selectedLocData.events.length > 0 ? (
                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                            {selectedLocData.events.map((ev) => (
                              <div key={ev.id} className="p-2.5 bg-neutral-950/60 border border-neutral-900 rounded-xl flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-extrabold text-white block truncate max-w-[170px]">{ev.title}</span>
                                  <span className="text-[10px] text-neutral-400">{ev.time} • Sector Arena</span>
                                </div>
                                <span className="text-[9px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                                  {ev.category}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-neutral-950/40 border border-neutral-900/60 rounded-xl text-center">
                            <span className="text-[10px] text-neutral-500 font-mono italic block">No active fete listings in this sector yet.</span>
                          </div>
                        )}
                      </div>

                      {/* Filtered Hotels List */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400 uppercase">
                          <span>Recommended Lodgings Nearby</span>
                          <span className="text-neutral-500 font-mono">({selectedLocData.hotels.length})</span>
                        </div>

                        {selectedLocData.hotels.length > 0 ? (
                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                            {selectedLocData.hotels.map((hot) => (
                              <div key={hot.id} className="p-2.5 bg-neutral-950/60 border border-neutral-900 rounded-xl flex items-center justify-between text-xs">
                                <div className="truncate max-w-[190px]">
                                  <span className="font-extrabold text-white block truncate">{hot.name}</span>
                                  <span className="text-[10px] text-neutral-400 truncate block">{hot.tagline}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  <span className="text-[10px] font-mono text-amber-400 font-bold">★{hot.stars}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-neutral-950/40 border border-neutral-900/60 rounded-xl text-center">
                            <span className="text-[10px] text-neutral-500 font-mono italic block">No luxury hotels configured in this sector.</span>
                          </div>
                        )}
                      </div>

                    </div>

                    <div className="pt-4 mt-4 border-t border-neutral-800/60 text-[10px] text-neutral-500 leading-normal">
                      * Visitor counts are simulated based on international flight records, arrivals logs, and pass orders assigned to sector hoteliers.
                    </div>
                  </div>

                </div>

                {/* 5. Informative Auxiliary Charts & Breakdown grids */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Panel A: Submission Workflow pipeline statuses */}
                  <div className="bg-neutral-900/40 border border-neutral-800/80 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs uppercase font-extrabold tracking-widest text-white border-b border-neutral-800 pb-2 flex items-center justify-between">
                      <span>Forms workflow status</span>
                      <span className="text-[9px] font-mono font-normal text-neutral-500">Pipeline Load</span>
                    </h4>

                    <div className="space-y-4 text-xs pt-1">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-rose-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            New Enquiries
                          </span>
                          <span className="font-mono font-bold text-white">{statusNew} / {totalSubmissions}</span>
                        </div>
                        <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-1.5 bg-rose-500 rounded-full transition-all" 
                            style={{ width: `${totalSubmissions > 0 ? (statusNew / totalSubmissions) * 100 : 0}%` }} 
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            In Review / Action
                          </span>
                          <span className="font-mono font-bold text-white">{statusInReview} / {totalSubmissions}</span>
                        </div>
                        <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-1.5 bg-cyan-500 rounded-full transition-all" 
                            style={{ width: `${totalSubmissions > 0 ? (statusInReview / totalSubmissions) * 100 : 0}%` }} 
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Resolved / Booked
                          </span>
                          <span className="font-mono font-bold text-white">{statusResolved} / {totalSubmissions}</span>
                        </div>
                        <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-1.5 bg-emerald-500 rounded-full transition-all" 
                            style={{ width: `${totalSubmissions > 0 ? (statusResolved / totalSubmissions) * 100 : 0}%` }} 
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-neutral-950/60 border border-neutral-900 rounded-xl space-y-1 text-[11px] text-neutral-400">
                        <span className="text-white font-bold block mb-1">Action Items Required</span>
                        {statusNew > 0 ? (
                          <p>There are <strong className="text-rose-400">{statusNew} unhandled forms</strong> requiring priority response and email feedback replies.</p>
                        ) : (
                          <p className="text-emerald-400">Excellent! All received forms and pass orders have been processed and resolved successfully.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Panel B: Form Categories Mix */}
                  <div className="bg-neutral-900/40 border border-neutral-800/80 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs uppercase font-extrabold tracking-widest text-white border-b border-neutral-800 pb-2 flex items-center justify-between">
                      <span>Forms Distribution</span>
                      <span className="text-[9px] font-mono font-normal text-neutral-500">Categories</span>
                    </h4>

                    <div className="space-y-3 pt-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 flex items-center gap-2">
                          <Ticket className="w-3.5 h-3.5 text-amber-500" /> Pass Purchases
                        </span>
                        <span className="font-mono text-white font-bold">{orders.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 flex items-center gap-2">
                          <Plane className="w-3.5 h-3.5 text-emerald-500" /> Flight Arrivals
                        </span>
                        <span className="font-mono text-white font-bold">{flightRegs.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5 text-cyan-500" /> Island Transport
                        </span>
                        <span className="font-mono text-white font-bold">{transports.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-purple-500" /> Newsletters
                        </span>
                        <span className="font-mono text-white font-bold">{newsletters.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-rose-500" /> Direct Enquiries
                        </span>
                        <span className="font-mono text-white font-bold">{contacts.length}</span>
                      </div>

                      <div className="pt-2 border-t border-neutral-900 flex justify-between items-center font-mono text-[11px]">
                        <span className="text-neutral-400">Total Entries:</span>
                        <span className="text-white font-extrabold">{totalSubmissions} items</span>
                      </div>
                    </div>
                  </div>

                  {/* Panel C: Event Category Mix Indicators */}
                  <div className="bg-neutral-900/40 border border-neutral-800/80 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs uppercase font-extrabold tracking-widest text-white border-b border-neutral-800 pb-2 flex items-center justify-between">
                      <span>Event allocations</span>
                      <span className="text-[9px] font-mono font-normal text-neutral-500">Categories</span>
                    </h4>

                    <div className="space-y-3 pt-1 text-xs">
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-mono mb-1 text-neutral-400">
                          <span>Music Concerts & Solos</span>
                          <span className="font-bold text-white">{categoryMusic} events</span>
                        </div>
                        <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden">
                          <div 
                            className="h-1 bg-amber-500 rounded-full transition-all" 
                            style={{ width: `${totalEventsCount > 0 ? (categoryMusic / totalEventsCount) * 100 : 0}%` }} 
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[10px] font-mono mb-1 text-neutral-400">
                          <span>Cultural & Island Heritage</span>
                          <span className="font-bold text-white">{categoryCultural} events</span>
                        </div>
                        <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden">
                          <div 
                            className="h-1 bg-emerald-500 rounded-full transition-all" 
                            style={{ width: `${totalEventsCount > 0 ? (categoryCultural / totalEventsCount) * 100 : 0}%` }} 
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[10px] font-mono mb-1 text-neutral-400">
                          <span>Adventure & Tubing Tours</span>
                          <span className="font-bold text-white">{categoryAdventure} events</span>
                        </div>
                        <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden">
                          <div 
                            className="h-1 bg-cyan-500 rounded-full transition-all" 
                            style={{ width: `${totalEventsCount > 0 ? (categoryAdventure / totalEventsCount) * 100 : 0}%` }} 
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[10px] font-mono mb-1 text-neutral-400">
                          <span>VIP Galas & Excursions</span>
                          <span className="font-bold text-white">{categoryGala} events</span>
                        </div>
                        <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden">
                          <div 
                            className="h-1 bg-purple-500 rounded-full transition-all" 
                            style={{ width: `${totalEventsCount > 0 ? (categoryGala / totalEventsCount) * 100 : 0}%` }} 
                          />
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-neutral-900 flex justify-between items-center text-[11px] font-mono">
                        <span className="text-neutral-400">Total Program:</span>
                        <span className="text-white font-extrabold">{totalEventsCount} scheduled</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 6. Operations telemetry metrics (Dynamic details) */}
                <div className="bg-neutral-900/20 border border-neutral-800/80 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest">Active Server Context</span>
                    <span className="block text-xs text-neutral-400 leading-normal">
                      Infrastructure synced with SQLite master storage. Asset library houses <strong className="text-white">{totalGalleryItems} media assets</strong>, supporting <strong className="text-white">{totalTestimonialsCount} partner reviews</strong> (average {avgRatingVal} rating).
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs shrink-0 font-mono">
                    <div className="bg-neutral-950 border border-neutral-900 p-3 rounded-xl text-center">
                      <span className="block text-[9px] text-neutral-500 uppercase font-bold">API Latency</span>
                      <span className="block text-sm font-black text-emerald-400 mt-1">14ms</span>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-900 p-3 rounded-xl text-center">
                      <span className="block text-[9px] text-neutral-500 uppercase font-bold">DB Status</span>
                      <span className="block text-sm font-black text-emerald-400 mt-1">OK</span>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-900 p-3 rounded-xl text-center">
                      <span className="block text-[9px] text-neutral-500 uppercase font-bold">Uptime</span>
                      <span className="block text-sm font-black text-white mt-1">100%</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* TAB: EVENT MANAGER */}
          {activeAdminTab === 'events' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Event Management Hub</span>
                  <h2 className="text-xl font-bold text-white font-serif mt-0.5">Festival Events & Live Shows</h2>
                  <p className="text-xs text-neutral-400 font-light">Add, edit, or delete events appearing on the main listings page.</p>
                </div>
                {!showAddEvent && !editingEvent && (
                  <button
                    onClick={() => setShowAddEvent(true)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" /> Add Festival Event
                  </button>
                )}
              </div>

              {/* Event Form (Create or Edit) */}
              {(showAddEvent || editingEvent) && (
                <form
                  onSubmit={handleSaveEvent}
                  className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-lg"
                >
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    {editingEvent ? 'Edit Festival Event' : 'Create New Festival Event'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Event Title</label>
                      <input
                        type="text"
                        required
                        value={editingEvent ? editingEvent.title : newEventForm.title}
                        onChange={(e) => {
                          if (editingEvent) setEditingEvent({ ...editingEvent, title: e.target.value });
                          else setNewEventForm({ ...newEventForm, title: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. Soca Monarch Finals"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Featured Status</label>
                      <select
                        value={editingEvent ? (editingEvent.isFeatured ? 'true' : 'false') : (newEventForm.isFeatured ? 'true' : 'false')}
                        onChange={(e) => {
                          const val = e.target.value === 'true';
                          if (editingEvent) setEditingEvent({ ...editingEvent, isFeatured: val });
                          else setNewEventForm({ ...newEventForm, isFeatured: val });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="false">Standard Event</option>
                        <option value="true">Featured (Prominent Hero Placement)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Date</label>
                      <input
                        type="text"
                        required
                        value={editingEvent ? editingEvent.date : newEventForm.date}
                        onChange={(e) => {
                          if (editingEvent) setEditingEvent({ ...editingEvent, date: e.target.value });
                          else setNewEventForm({ ...newEventForm, date: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. August 13, 2027"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Day Number (1 - 10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        required
                        value={editingEvent ? editingEvent.dayNumber : newEventForm.dayNumber}
                        onChange={(e) => {
                          const num = Number(e.target.value);
                          if (editingEvent) setEditingEvent({ ...editingEvent, dayNumber: num });
                          else setNewEventForm({ ...newEventForm, dayNumber: num });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Show Timing</label>
                      <input
                        type="text"
                        required
                        value={editingEvent ? editingEvent.time : newEventForm.time}
                        onChange={(e) => {
                          if (editingEvent) setEditingEvent({ ...editingEvent, time: e.target.value });
                          else setNewEventForm({ ...newEventForm, time: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. 10:00 PM - 4:00 AM"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Location / Venue</label>
                      <input
                        type="text"
                        required
                        value={editingEvent ? editingEvent.location : newEventForm.location}
                        onChange={(e) => {
                          if (editingEvent) setEditingEvent({ ...editingEvent, location: e.target.value });
                          else setNewEventForm({ ...newEventForm, location: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. Mellowland River stage"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-neutral-400 font-bold uppercase block">Brief Description</label>
                      <textarea
                        required
                        rows={3}
                        value={editingEvent ? editingEvent.description : newEventForm.description}
                        onChange={(e) => {
                          if (editingEvent) setEditingEvent({ ...editingEvent, description: e.target.value });
                          else setNewEventForm({ ...newEventForm, description: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="Describe the experience, schedule, or lineup details..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-neutral-400 font-bold uppercase block">Cover Image URL</label>
                        <button
                          type="button"
                          onClick={() => setMediaSelectorTarget('event')}
                          className="text-[10px] font-black text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Image className="w-3 h-3" /> Select from Media
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={editingEvent ? editingEvent.highlightImage : newEventForm.highlightImage}
                        onChange={(e) => {
                          if (editingEvent) setEditingEvent({ ...editingEvent, highlightImage: e.target.value });
                          else setNewEventForm({ ...newEventForm, highlightImage: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">
                        Ticket Price (GBP) <span className="text-neutral-500 font-normal text-xs">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editingEvent ? (editingEvent.ticketPrice ?? '') : (newEventForm.ticketPrice ?? '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          const pr = val === '' ? undefined : Number(val);
                          if (editingEvent) setEditingEvent({ ...editingEvent, ticketPrice: pr });
                          else setNewEventForm({ ...newEventForm, ticketPrice: pr });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. 50 (leave blank if free/included)"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-neutral-400 font-bold uppercase block">
                        Music Genres <span className="text-neutral-500 font-normal text-xs">(Optional, Comma-separated)</span>
                      </label>
                      <input
                        type="text"
                        value={editingEvent ? (editingEvent.genres ? editingEvent.genres.join(', ') : '') : (newEventForm.genres ? newEventForm.genres.join(', ') : '')}
                        onChange={(e) => {
                          const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          if (editingEvent) setEditingEvent({ ...editingEvent, genres: arr });
                          else setNewEventForm({ ...newEventForm, genres: arr });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. Soca, Reggae, Afro (leave blank if none)"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-neutral-400 font-bold uppercase block flex items-center gap-1.5">
                        <Disc className="w-3.5 h-3.5 text-amber-400" /> Event DJs & Lineup <span className="text-neutral-500 font-normal text-xs">(Optional, Comma-separated)</span>
                      </label>
                      <input
                        type="text"
                        value={editingEvent ? (editingEvent.djLineup ? editingEvent.djLineup.join(', ') : '') : (newEventForm.djLineup ? newEventForm.djLineup.join(', ') : '')}
                        onChange={(e) => {
                          const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          if (editingEvent) setEditingEvent({ ...editingEvent, djLineup: arr });
                          else setNewEventForm({ ...newEventForm, djLineup: arr });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none font-mono text-xs"
                        placeholder="e.g. DJ Slick (London), DJ Spice (Grenada), Selecta Quad (leave blank if none)"
                      />
                      <p className="text-[10px] text-neutral-500 font-light">
                        Separate multiple DJs with commas. If provided, these will display on the festival schedule.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEvent(null);
                        setShowAddEvent(false);
                      }}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg transition-colors cursor-pointer"
                    >
                      {editingEvent ? 'Save Changes' : 'Create Event'}
                    </button>
                  </div>
                </form>
              )}

              {/* Bulk Actions for Events */}
              {selectedEvents.length > 0 && (
                <div className="bg-[#12162E] border border-amber-500/30 p-3 px-4 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.05)] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">
                      {selectedEvents.length} event{selectedEvents.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedEvents([])}
                      className="text-[10px] text-neutral-400 hover:text-white underline ml-2 cursor-pointer font-semibold"
                    >
                      Deselect All
                    </button>
                  </div>
                  <button
                    onClick={handleBulkDeleteEvents}
                    className="px-2.5 py-1 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-500/30 rounded text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
                  </button>
                </div>
              )}

              {/* Events List */}
              <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-md">
                <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={events.length > 0 && events.every(ev => selectedEvents.includes(ev.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvents(events.map(ev => ev.id));
                        } else {
                          setSelectedEvents([]);
                        }
                      }}
                      className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-300">Active Events Database ({events.length})</h4>
                  </div>
                </div>
                <div className="divide-y divide-neutral-800/60">
                  {(() => {
                    const totalEventPages = Math.ceil(events.length / ITEMS_PER_PAGE) || 1;
                    const currentEventsPage = Math.min(eventsPage, totalEventPages);
                    const paginatedEvents = events.slice((currentEventsPage - 1) * ITEMS_PER_PAGE, currentEventsPage * ITEMS_PER_PAGE);
                    return (
                      <>
                        {paginatedEvents.map((ev) => (
                          <div key={ev.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-neutral-900/30 transition-colors">
                            <div className="flex items-center gap-4">
                              <input
                                type="checkbox"
                                checked={selectedEvents.includes(ev.id)}
                                onChange={() => {
                                  setSelectedEvents(prev => 
                                    prev.includes(ev.id) ? prev.filter(id => id !== ev.id) : [...prev, ev.id]
                                  );
                                }}
                                className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer shrink-0"
                              />
                              <img
                                src={ev.highlightImage}
                                alt={ev.title}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80';
                                }}
                                className="w-14 h-14 object-cover rounded-xl border border-neutral-800 bg-neutral-950"
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-white font-bold text-sm leading-snug">{ev.title}</span>
                                  {ev.isFeatured && (
                                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Featured</span>
                                  )}
                                  <span className="bg-neutral-800 text-neutral-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase">Day {ev.dayNumber}</span>
                                </div>
                                <p className="text-neutral-400 text-xs flex flex-wrap items-center gap-x-3 gap-y-1 font-light">
                                  <span>📅 {ev.date}</span>
                                  <span>⏰ {ev.time}</span>
                                  <span>📍 {ev.location}</span>
                                </p>
                                {ev.djLineup && ev.djLineup.length > 0 && (
                                  <p className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1.5 pt-0.5">
                                    <Disc className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span className="text-neutral-400 font-semibold">DJs:</span>
                                    <span>{ev.djLineup.join(', ')}</span>
                                  </p>
                                )}
                                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                  {ev.genres && ev.genres.map((g, idx) => (
                                    <span key={idx} className="bg-neutral-950/80 border border-neutral-800 text-neutral-300 text-[9px] px-2 py-0.5 rounded-md font-medium">{g}</span>
                                  ))}
                                  {ev.ticketPrice !== undefined && ev.ticketPrice !== null && (
                                    <span className="text-[11px] font-mono text-emerald-400 font-bold ml-2">£{ev.ticketPrice} Ticket</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                              <button
                                onClick={() => {
                                  setEditingEvent(ev);
                                  setShowAddEvent(false);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 rounded-lg border border-neutral-800 transition-colors cursor-pointer text-xs font-bold"
                                title="Edit event details"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="p-2 bg-neutral-900 hover:bg-rose-950/20 text-neutral-500 hover:text-rose-400 rounded-lg border border-neutral-800/80 hover:border-rose-500/30 transition-colors cursor-pointer text-xs font-bold"
                                title="Delete Event"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}

                        {totalEventPages > 1 && (
                          <div className="flex items-center justify-between pt-4 px-5 py-3 border-t border-neutral-800 bg-neutral-950/20">
                            <span className="text-[11px] text-neutral-400 font-sans">
                              Showing <span className="text-white font-bold">{((currentEventsPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="text-white font-bold">{Math.min(currentEventsPage * ITEMS_PER_PAGE, events.length)}</span> of <span className="text-white font-bold">{events.length}</span> events
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEventsPage(p => Math.max(1, p - 1))}
                                disabled={currentEventsPage === 1}
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              >
                                Prev
                              </button>
                              <span className="text-xs font-mono text-neutral-300">
                                {currentEventsPage} / {totalEventPages}
                              </span>
                              <button
                                type="button"
                                onClick={() => setEventsPage(p => Math.min(totalEventPages, p + 1))}
                                disabled={currentEventsPage === totalEventPages}
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB: GALLERY PHOTOS & VIDEOS */}
          {activeAdminTab === 'gallery' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Media Assets Room</span>
                  <h2 className="text-xl font-bold text-white font-serif mt-0.5">Gallery Media & Highlights</h2>
                  <p className="text-xs text-neutral-400 font-light">Add, edit, or remove photos and videos appearing in the public gallery.</p>
                </div>
                {!showAddGallery && !editingGallery && (
                  <button
                    onClick={() => setShowAddGallery(true)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" /> Add Gallery Item
                  </button>
                )}
              </div>

              {/* Gallery Form */}
              {(showAddGallery || editingGallery) && (
                <form
                  onSubmit={handleSaveGallery}
                  className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-lg"
                >
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-3 flex items-center gap-2">
                    <Image className="w-4 h-4 text-amber-400" />
                    {editingGallery ? 'Edit Gallery Item' : 'Add New Gallery Item'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Media Type</label>
                      <select
                        value={editingGallery ? (editingGallery.mediaType || (editingGallery.videoUrl ? 'video' : 'image')) : (newGalleryForm.mediaType || 'image')}
                        onChange={(e) => {
                          const mType = e.target.value as 'image' | 'video';
                          if (editingGallery) setEditingGallery({ ...editingGallery, mediaType: mType });
                          else setNewGalleryForm({ ...newGalleryForm, mediaType: mType });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="image">📷 Photo / Image</option>
                        <option value="video">🎥 Video Clip</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Title / Caption</label>
                      <input
                        type="text"
                        required
                        value={editingGallery ? editingGallery.title : newGalleryForm.title}
                        onChange={(e) => {
                          if (editingGallery) setEditingGallery({ ...editingGallery, title: e.target.value });
                          else setNewGalleryForm({ ...newGalleryForm, title: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. Mellowland River Tubing Launch"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Category Filter</label>
                      <select
                        value={editingGallery ? editingGallery.category : newGalleryForm.category}
                        onChange={(e) => {
                          const cat = e.target.value as GalleryItem['category'];
                          if (editingGallery) setEditingGallery({ ...editingGallery, category: cat });
                          else setNewGalleryForm({ ...newGalleryForm, category: cat });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="VIP Beach Fete">VIP Beach Fete</option>
                        <option value="Mellowland Village">Mellowland Village</option>
                        <option value="Soca & Concerts">Soca & Concerts</option>
                        <option value="Island Excursions">Island Excursions</option>
                        <option value="Luxury & Resort">Luxury & Resort</option>
                      </select>
                    </div>

                    {((editingGallery && (editingGallery.mediaType === 'video' || Boolean(editingGallery.videoUrl))) || (!editingGallery && newGalleryForm.mediaType === 'video')) && (
                      <div className="space-y-1.5 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="text-amber-400 font-bold uppercase block">Video URL (YouTube Embed / Vimeo / MP4 Video)</label>
                          <button
                            type="button"
                            onClick={() => setMediaSelectorTarget('gallery_video')}
                            className="text-[10px] font-black text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded border border-amber-500/30"
                          >
                            <Video className="w-3 h-3" /> Select Video from Media
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={editingGallery ? (editingGallery.videoUrl || '') : (newGalleryForm.videoUrl || '')}
                          onChange={(e) => {
                            if (editingGallery) setEditingGallery({ ...editingGallery, videoUrl: e.target.value, mediaType: 'video' });
                            else setNewGalleryForm({ ...newGalleryForm, videoUrl: e.target.value, mediaType: 'video' });
                          }}
                          className="w-full bg-neutral-950 border border-amber-500/50 rounded-lg p-2.5 text-white focus:border-amber-400 focus:outline-none"
                          placeholder="https://www.youtube.com/embed/... or /uploads/video.mp4 or select from Media"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-neutral-400 font-bold uppercase block">
                          {((editingGallery && (editingGallery.mediaType === 'video' || Boolean(editingGallery.videoUrl))) || (!editingGallery && newGalleryForm.mediaType === 'video'))
                            ? 'Thumbnail Poster Image URL'
                            : 'Photo Image URL'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setMediaSelectorTarget('gallery')}
                          className="text-[10px] font-black text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Image className="w-3 h-3" /> Select from Media
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={editingGallery ? editingGallery.imageUrl : newGalleryForm.imageUrl}
                        onChange={(e) => {
                          if (editingGallery) setEditingGallery({ ...editingGallery, imageUrl: e.target.value });
                          else setNewGalleryForm({ ...newGalleryForm, imageUrl: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Location (Caption Subtext)</label>
                      <input
                        type="text"
                        required
                        value={editingGallery ? editingGallery.location : newGalleryForm.location}
                        onChange={(e) => {
                          if (editingGallery) setEditingGallery({ ...editingGallery, location: e.target.value });
                          else setNewGalleryForm({ ...newGalleryForm, location: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. St. George's, Grenada"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGallery(null);
                        setShowAddGallery(false);
                      }}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg transition-colors cursor-pointer"
                    >
                      {editingGallery ? 'Save Item' : 'Add Item'}
                    </button>
                  </div>
                </form>
              )}

              {/* Bulk Actions for Gallery */}
              {selectedGallery.length > 0 && (
                <div className="bg-[#12162E] border border-amber-500/30 p-3 px-4 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.05)] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">
                      {selectedGallery.length} item{selectedGallery.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedGallery([])}
                      className="text-[10px] text-neutral-400 hover:text-white underline ml-2 cursor-pointer font-semibold"
                    >
                      Deselect All
                    </button>
                  </div>
                  <button
                    onClick={handleBulkDeleteGallery}
                    className="px-2.5 py-1 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-500/30 rounded text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
                  </button>
                </div>
              )}

              {/* Items List Grid */}
              <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800/40">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={galleryItems.length > 0 && galleryItems.every(item => selectedGallery.includes(item.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGallery(galleryItems.map(item => item.id));
                        } else {
                          setSelectedGallery([]);
                        }
                      }}
                      className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-300">Current Gallery Items ({galleryItems.length})</h4>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(() => {
                    const totalGalleryPages = Math.ceil(galleryItems.length / ITEMS_PER_PAGE) || 1;
                    const currentGalleryPage = Math.min(galleryPage, totalGalleryPages);
                    const paginatedGallery = galleryItems.slice((currentGalleryPage - 1) * ITEMS_PER_PAGE, currentGalleryPage * ITEMS_PER_PAGE);
                    return (
                      <>
                        {paginatedGallery.map((item) => {
                          const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl);

                          return (
                            <div key={item.id} className="relative group rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 aspect-video flex flex-col justify-between shadow-sm">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80';
                                }}
                                className="absolute inset-0 w-full h-full object-cover opacity-60 hover:opacity-80 transition-opacity"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent pointer-events-none" />
                              
                              <div className="p-2 z-10 flex items-center justify-between w-full">
                                <div className="flex items-center gap-1">
                                  <span className="bg-neutral-950/95 border border-neutral-800 text-[8px] font-bold text-amber-400 px-2 py-0.5 rounded-full uppercase">{item.category}</span>
                                  {isVideo && (
                                    <span className="bg-rose-500/90 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">VIDEO</span>
                                  )}
                                </div>
                                <input
                                  type="checkbox"
                                  checked={selectedGallery.includes(item.id)}
                                  onChange={() => {
                                    setSelectedGallery(prev => 
                                      prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                    );
                                  }}
                                  className="rounded border-neutral-700 bg-neutral-950/90 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer z-20"
                                />
                              </div>

                              <div className="p-2 z-10 space-y-1">
                                <p className="text-white font-bold text-[10px] leading-snug truncate" title={item.title}>{item.title}</p>
                                <p className="text-[8px] text-neutral-400 font-light truncate">{item.location}</p>
                                <div className="flex justify-between items-center pt-1 border-t border-neutral-800/60">
                                  <span className="text-[8px] text-emerald-400 font-semibold font-mono">💖 {item.likesCount || 0} likes</span>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => {
                                        setEditingGallery(item);
                                        setShowAddGallery(false);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                      className="text-[9px] text-amber-400 font-black hover:underline cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    <span className="text-neutral-700">|</span>
                                    <button
                                      onClick={() => handleDeleteGallery(item.id)}
                                      className="text-[9px] text-rose-400 font-black hover:underline cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {totalGalleryPages > 1 && (
                          <div className="col-span-full flex items-center justify-between pt-4 border-t border-neutral-800/40 bg-neutral-950/10 px-3 py-2 rounded-lg">
                            <span className="text-[11px] text-neutral-400 font-sans">
                              Showing <span className="text-white font-bold">{((currentGalleryPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="text-white font-bold">{Math.min(currentGalleryPage * ITEMS_PER_PAGE, galleryItems.length)}</span> of <span className="text-white font-bold">{galleryItems.length}</span> photos
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setGalleryPage(p => Math.max(1, p - 1))}
                                disabled={currentGalleryPage === 1}
                                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              >
                                Prev
                              </button>
                              <span className="text-xs font-mono text-neutral-300">
                                {currentGalleryPage} / {totalGalleryPages}
                              </span>
                              <button
                                type="button"
                                onClick={() => setGalleryPage(p => Math.min(totalGalleryPages, p + 1))}
                                disabled={currentGalleryPage === totalGalleryPages}
                                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PASS MANAGER */}
          {activeAdminTab === 'passes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Pass Allotments & Pricing</span>
                  <h2 className="text-xl font-bold text-white font-serif mt-0.5">Festival Pass Manager</h2>
                  <p className="text-xs text-neutral-400 font-light">Modify tiers, price rates, and features shown in the booking shop.</p>
                </div>
                {!showAddPass && !editingPass && (
                  <button
                    onClick={() => setShowAddPass(true)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" /> Create Pass Tier
                  </button>
                )}
              </div>

              {/* Pass Form */}
              {(showAddPass || editingPass) && (
                <form
                  onSubmit={handleSavePass}
                  className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-lg"
                >
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-3 flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-amber-400" />
                    {editingPass ? 'Edit Pass Package' : 'Create New Pass Package'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Pass Title / Name</label>
                      <input
                        type="text"
                        required
                        value={editingPass ? editingPass.title : newPassForm.title}
                        onChange={(e) => {
                          if (editingPass) setEditingPass({ ...editingPass, title: e.target.value });
                          else setNewPassForm({ ...newPassForm, title: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. 10-Day Gold VIP All Access"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Wristband Type Designation</label>
                      <input
                        type="text"
                        required
                        value={editingPass ? editingPass.wristbandType : newPassForm.wristbandType}
                        onChange={(e) => {
                          if (editingPass) setEditingPass({ ...editingPass, wristbandType: e.target.value });
                          else setNewPassForm({ ...newPassForm, wristbandType: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. GOLD WRISTBAND"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Subheading Description</label>
                      <input
                        type="text"
                        required
                        value={editingPass ? editingPass.subtitle : newPassForm.subtitle}
                        onChange={(e) => {
                          if (editingPass) setEditingPass({ ...editingPass, subtitle: e.target.value });
                          else setNewPassForm({ ...newPassForm, subtitle: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. Full premium experience for true revelers"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Price in GBP (£)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editingPass ? editingPass.priceGBP : newPassForm.priceGBP}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (editingPass) setEditingPass({ ...editingPass, priceGBP: val });
                          else setNewPassForm({ ...newPassForm, priceGBP: val });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Included Events Text</label>
                      <input
                        type="text"
                        required
                        value={editingPass ? editingPass.includedEvents : newPassForm.includedEvents}
                        onChange={(e) => {
                          if (editingPass) setEditingPass({ ...editingPass, includedEvents: e.target.value });
                          else setNewPassForm({ ...newPassForm, includedEvents: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. All events days 1 - 10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Most Popular Badge Highlight</label>
                      <select
                        value={editingPass ? (editingPass.popular ? 'true' : 'false') : (newPassForm.popular ? 'true' : 'false')}
                        onChange={(e) => {
                          const pop = e.target.value === 'true';
                          if (editingPass) setEditingPass({ ...editingPass, popular: pop });
                          else setNewPassForm({ ...newPassForm, popular: pop });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="false">Standard</option>
                        <option value="true">Highlight as Popular (Visual Scale Accent)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-neutral-400 font-bold uppercase block">Pass Perks (one per line)</label>
                      <textarea
                        required
                        rows={3}
                        value={editingPass ? editingPass.features.join('\n') : newPassForm.features?.join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
                          if (editingPass) setEditingPass({ ...editingPass, features: lines });
                          else setNewPassForm({ ...newPassForm, features: lines });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none animate-none"
                        placeholder="VIP front-stage lounge fete access&#10;Complimentary organic garden buffet&#10;Official yacht shuttle pass included"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPass(null);
                        setShowAddPass(false);
                      }}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg transition-colors cursor-pointer"
                    >
                      {editingPass ? 'Save Changes' : 'Create Pass'}
                    </button>
                  </div>
                </form>
              )}

              {/* Bulk Actions for Passes */}
              {selectedPasses.length > 0 && (
                <div className="bg-[#12162E] border border-amber-500/30 p-3 px-4 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.05)] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">
                      {selectedPasses.length} pass{selectedPasses.length > 1 ? 'es' : ''} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPasses([])}
                      className="text-[10px] text-neutral-400 hover:text-white underline ml-2 cursor-pointer font-semibold"
                    >
                      Deselect All
                    </button>
                  </div>
                  <button
                    onClick={handleBulkDeletePasses}
                    className="px-2.5 py-1 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-500/30 rounded text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
                  </button>
                </div>
              )}

              {/* Passes List Table */}
              <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-md">
                <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={passes.length > 0 && passes.every(p => selectedPasses.includes(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPasses(passes.map(p => p.id));
                        } else {
                          setSelectedPasses([]);
                        }
                      }}
                      className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-300">Active Passes Database ({passes.length})</h4>
                  </div>
                </div>
                <div className="divide-y divide-neutral-800/60">
                  {(() => {
                    const totalPassPages = Math.ceil(passes.length / ITEMS_PER_PAGE) || 1;
                    const currentPassesPage = Math.min(passesPage, totalPassPages);
                    const paginatedPasses = passes.slice((currentPassesPage - 1) * ITEMS_PER_PAGE, currentPassesPage * ITEMS_PER_PAGE);
                    return (
                      <>
                        {paginatedPasses.map((pass) => (
                          <div key={pass.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-neutral-900/30 transition-colors">
                            <div className="flex items-start gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={selectedPasses.includes(pass.id)}
                                onChange={() => {
                                  setSelectedPasses(prev => 
                                    prev.includes(pass.id) ? prev.filter(id => id !== pass.id) : [...prev, pass.id]
                                  );
                                }}
                                className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer shrink-0 mt-1"
                              />
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-white font-bold text-base leading-snug">{pass.title}</span>
                                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-bold px-2 py-0.5 rounded-md uppercase font-mono">{pass.wristbandType}</span>
                                  {pass.popular && (
                                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">Popular Tag</span>
                                  )}
                                </div>
                                <p className="text-neutral-300 text-xs font-light">{pass.subtitle}</p>
                                <p className="text-[11px] text-neutral-400">Included: <strong className="text-amber-300 font-semibold">{pass.includedEvents}</strong></p>
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  {pass.features.map((feat, idx) => (
                                    <span key={idx} className="bg-neutral-950 border border-neutral-800/80 text-[10px] text-neutral-400 px-2.5 py-0.5 rounded-full font-light">✓ {feat}</span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                              <span className="text-xl font-bold font-heading text-amber-400">£{pass.priceGBP}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPass(pass);
                                    setShowAddPass(false);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="p-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 rounded-lg border border-neutral-800 transition-colors cursor-pointer text-xs font-bold"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePass(pass.id)}
                                  className="p-2 bg-neutral-900 hover:bg-rose-950/20 text-neutral-500 hover:text-rose-400 rounded-lg border border-neutral-800/80 hover:border-rose-500/30 transition-colors cursor-pointer text-xs font-bold"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {totalPassPages > 1 && (
                          <div className="flex items-center justify-between pt-4 px-5 py-3 border-t border-neutral-800 bg-neutral-950/20">
                            <span className="text-[11px] text-neutral-400 font-sans">
                              Showing <span className="text-white font-bold">{((currentPassesPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="text-white font-bold">{Math.min(currentPassesPage * ITEMS_PER_PAGE, passes.length)}</span> of <span className="text-white font-bold">{passes.length}</span> packages
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPassesPage(p => Math.max(1, p - 1))}
                                disabled={currentPassesPage === 1}
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              >
                                Prev
                              </button>
                              <span className="text-xs font-mono text-neutral-300">
                                {currentPassesPage} / {totalPassPages}
                              </span>
                              <button
                                type="button"
                                onClick={() => setPassesPage(p => Math.min(totalPassPages, p + 1))}
                                disabled={currentPassesPage === totalPassPages}
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB: HOTELS MANAGER */}
          {activeAdminTab === 'hotels' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Accommodation & Logistics</span>
                  <h2 className="text-xl font-bold text-white font-serif mt-0.5">Recommended Partner Hotels</h2>
                  <p className="text-xs text-neutral-400 font-light">Add, edit, or toggle spotlight recommendations for beachfront hotel choices.</p>
                </div>
                {!showAddHotel && !editingHotel && (
                  <button
                    onClick={() => setShowAddHotel(true)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" /> Add Partner Hotel
                  </button>
                )}
              </div>

              {/* Hotel Form */}
              {(showAddHotel || editingHotel) && (
                <form
                  onSubmit={handleSaveHotel}
                  className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-lg"
                >
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-3 flex items-center gap-2">
                    <Hotel className="w-4 h-4 text-amber-400" />
                    {editingHotel ? 'Edit Recommended Hotel' : 'Create Recommended Hotel'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Hotel Name</label>
                      <input
                        type="text"
                        required
                        value={editingHotel ? editingHotel.name : newHotelForm.name}
                        onChange={(e) => {
                          if (editingHotel) setEditingHotel({ ...editingHotel, name: e.target.value });
                          else setNewHotelForm({ ...newHotelForm, name: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. Royalton Grenada Resort"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Rating (Stars: 1 - 5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        required
                        value={editingHotel ? editingHotel.stars : newHotelForm.stars}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (editingHotel) setEditingHotel({ ...editingHotel, stars: val });
                          else setNewHotelForm({ ...newHotelForm, stars: val });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Tagline Quote</label>
                      <input
                        type="text"
                        required
                        value={editingHotel ? editingHotel.tagline : newHotelForm.tagline}
                        onChange={(e) => {
                          if (editingHotel) setEditingHotel({ ...editingHotel, tagline: e.target.value });
                          else setNewHotelForm({ ...newHotelForm, tagline: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. Beachfront Luxury and Soca Sunset parties"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Is Highly Recommended (Spotlight Placement)</label>
                      <select
                        value={editingHotel ? (editingHotel.isRecommended ? 'true' : 'false') : (newHotelForm.isRecommended ? 'true' : 'false')}
                        onChange={(e) => {
                          const rec = e.target.value === 'true';
                          if (editingHotel) setEditingHotel({ ...editingHotel, isRecommended: rec });
                          else setNewHotelForm({ ...newHotelForm, isRecommended: rec });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="false">Partner Accommodation (Grid placement)</option>
                        <option value="true">Spotlight Recommendation (Large Banner feature)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-neutral-400 font-bold uppercase block">Hotel Description</label>
                      <textarea
                        required
                        rows={3}
                        value={editingHotel ? editingHotel.description : newHotelForm.description}
                        onChange={(e) => {
                          if (editingHotel) setEditingHotel({ ...editingHotel, description: e.target.value });
                          else setNewHotelForm({ ...newHotelForm, description: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="Describe the hotel amenities, reception desks, and proximity to festival points..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-neutral-400 font-bold uppercase block">Cover Photo URL</label>
                        <button
                          type="button"
                          onClick={() => setMediaSelectorTarget('hotel')}
                          className="text-[10px] font-black text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Image className="w-3 h-3" /> Select from Media
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={editingHotel ? editingHotel.image : newHotelForm.image}
                        onChange={(e) => {
                          if (editingHotel) setEditingHotel({ ...editingHotel, image: e.target.value });
                          else setNewHotelForm({ ...newHotelForm, image: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Location (Geographic)</label>
                      <input
                        type="text"
                        required
                        value={editingHotel ? editingHotel.location : newHotelForm.location}
                        onChange={(e) => {
                          if (editingHotel) setEditingHotel({ ...editingHotel, location: e.target.value });
                          else setNewHotelForm({ ...newHotelForm, location: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. Magazine Beach, St. George's"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Distance/Travel time to Mellowland</label>
                      <input
                        type="text"
                        required
                        value={editingHotel ? editingHotel.distanceToMellowland : newHotelForm.distanceToMellowland}
                        onChange={(e) => {
                          if (editingHotel) setEditingHotel({ ...editingHotel, distanceToMellowland: e.target.value });
                          else setNewHotelForm({ ...newHotelForm, distanceToMellowland: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. 15 mins drive"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Official Booking Website Link</label>
                      <input
                        type="text"
                        required
                        value={editingHotel ? editingHotel.bookingUrl : newHotelForm.bookingUrl}
                        onChange={(e) => {
                          if (editingHotel) setEditingHotel({ ...editingHotel, bookingUrl: e.target.value });
                          else setNewHotelForm({ ...newHotelForm, bookingUrl: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-neutral-400 font-bold uppercase block">Hotel Features / Perks (one per line)</label>
                      <textarea
                        required
                        rows={3}
                        value={editingHotel ? editingHotel.features.join('\n') : newHotelForm.features?.join('\n')}
                        onChange={(e) => {
                          const list = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
                          if (editingHotel) setEditingHotel({ ...editingHotel, features: list });
                          else setNewHotelForm({ ...newHotelForm, features: list });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800/60 rounded-lg p-2.5 text-white focus:border-amber-500/60 focus:outline-none animate-none"
                        placeholder="Beachfront Ocean Suites&#10;Mellows Official Shuttle Stop&#10;On-site wristband collection desk"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingHotel(null);
                        setShowAddHotel(false);
                      }}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg transition-colors cursor-pointer"
                    >
                      {editingHotel ? 'Save Changes' : 'Create Partner'}
                    </button>
                  </div>
                </form>
              )}

              {/* Bulk Actions for Hotels */}
              {selectedHotels.length > 0 && (
                <div className="bg-[#12162E] border border-amber-500/30 p-3 px-4 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.05)] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">
                      {selectedHotels.length} hotel{selectedHotels.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedHotels([])}
                      className="text-[10px] text-neutral-400 hover:text-white underline ml-2 cursor-pointer font-semibold"
                    >
                      Deselect All
                    </button>
                  </div>
                  <button
                    onClick={handleBulkDeleteHotels}
                    className="px-2.5 py-1 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-500/30 rounded text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
                  </button>
                </div>
              )}

              {/* Hotels List */}
              <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-md">
                <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hotels.length > 0 && hotels.every(h => selectedHotels.includes(h.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedHotels(hotels.map(h => h.id));
                        } else {
                          setSelectedHotels([]);
                        }
                      }}
                      className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-300">Active Hotels Database ({hotels.length})</h4>
                  </div>
                </div>
                <div className="divide-y divide-neutral-800/60">
                  {(() => {
                    const totalHotelPages = Math.ceil(hotels.length / ITEMS_PER_PAGE) || 1;
                    const currentHotelsPage = Math.min(hotelsPage, totalHotelPages);
                    const paginatedHotels = hotels.slice((currentHotelsPage - 1) * ITEMS_PER_PAGE, currentHotelsPage * ITEMS_PER_PAGE);
                    return (
                      <>
                        {paginatedHotels.map((hotel) => (
                          <div key={hotel.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-neutral-900/30 transition-colors">
                            <div className="flex items-start gap-4">
                              <input
                                type="checkbox"
                                checked={selectedHotels.includes(hotel.id)}
                                onChange={() => {
                                  setSelectedHotels(prev => 
                                    prev.includes(hotel.id) ? prev.filter(id => id !== hotel.id) : [...prev, hotel.id]
                                  );
                                }}
                                className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer shrink-0 mt-1"
                              />
                              <img
                                src={hotel.image}
                                alt={hotel.name}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80';
                                }}
                                className="w-20 h-14 object-cover rounded-xl border border-neutral-800 bg-neutral-950"
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-white font-bold text-base leading-snug">{hotel.name}</span>
                                  <span className="text-amber-400 font-mono text-xs">{Array.from({ length: hotel.stars }).map(() => '★').join('')}</span>
                                  {hotel.isRecommended && (
                                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">Spotlight Recommended</span>
                                  )}
                                </div>
                                <p className="text-neutral-300 text-xs font-light italic">"{hotel.tagline}"</p>
                                <p className="text-neutral-400 text-[11px] flex flex-wrap items-center gap-x-3">
                                  <span>📍 {hotel.location}</span>
                                  <span>⏱ {hotel.distanceToMellowland} to Mellowland</span>
                                </p>
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {hotel.features.map((feat, idx) => (
                                    <span key={idx} className="bg-neutral-950 border border-neutral-800/60 text-[9px] text-neutral-400 px-2 py-0.5 rounded-md font-light">{feat}</span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingHotel(hotel);
                                  setShowAddHotel(false);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 rounded-lg border border-neutral-800 transition-colors cursor-pointer text-xs font-bold font-sans"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteHotel(hotel.id)}
                                className="p-2 bg-neutral-900 hover:bg-rose-950/20 text-neutral-500 hover:text-rose-400 rounded-lg border border-neutral-800/80 hover:border-rose-500/30 transition-colors cursor-pointer text-xs font-bold font-sans"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}

                        {totalHotelPages > 1 && (
                          <div className="flex items-center justify-between pt-4 px-5 py-3 border-t border-neutral-800 bg-neutral-950/20">
                            <span className="text-[11px] text-neutral-400 font-sans">
                              Showing <span className="text-white font-bold">{((currentHotelsPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="text-white font-bold">{Math.min(currentHotelsPage * ITEMS_PER_PAGE, hotels.length)}</span> of <span className="text-white font-bold">{hotels.length}</span> hotels
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setHotelsPage(p => Math.max(1, p - 1))}
                                disabled={currentHotelsPage === 1}
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-855 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              >
                                Prev
                              </button>
                              <span className="text-xs font-mono text-neutral-300">
                                {currentHotelsPage} / {totalHotelPages}
                              </span>
                              <button
                                type="button"
                                onClick={() => setHotelsPage(p => Math.min(totalHotelPages, p + 1))}
                                disabled={currentHotelsPage === totalHotelPages}
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-855 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM & INFRASTRUCTURE CONTROLS */}
          {activeAdminTab === 'system' && (
            <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-xl p-6 md:p-8 space-y-6 shadow-sm font-sans">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">System Diagnostics</span>
                <h2 className="text-xl font-bold text-white font-serif mt-0.5">Data Persistence & Infrastructure Controls</h2>
                <p className="text-xs text-neutral-400">
                  Secure backup functions to extract form responses to a clean portable CSV file, or reset sample logs to demo states.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-5 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-3">
                  <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider font-serif">Export Submissions to Spreadsheet</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Instantly package and download a formatted `.csv` spreadsheet file with every received guest ticket request, phone, and flight details.
                  </p>
                  <button
                    onClick={() => exportSubmissionsCSV(submissions)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Download CSV
                  </button>
                </div>

                <div className="p-5 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-3">
                  <RefreshCw className="w-7 h-7 text-amber-400" />
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider font-serif">Restock Demo Sample Log Database</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Clear current state logs and populate realistic sample carnival and travel VIP bookings to demonstrate admin features.
                  </p>
                  <button
                    onClick={handleResetDemo}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Repopulate Database
                  </button>
                </div>
              </div>

              {/* Dashboard Access & Security settings */}
              <div className="pt-6 border-t border-neutral-800/60 space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white font-serif">Dashboard Access & Credentials</h3>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Protect and secure your backend workspace. You can customize the secret URL path and access passcode. Keep these saved somewhere private to avoid losing access.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-neutral-400">Secret URL Path</label>
                    <div className="relative font-sans">
                      <span className="absolute left-3 top-2.5 text-neutral-500 text-xs font-mono select-none">/</span>
                      <input
                        type="text"
                        value={siteConfig.adminPath || 'admin'}
                        onChange={(e) => {
                          const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                          setSiteConfigState({
                            ...siteConfig,
                            adminPath: cleaned
                          });
                        }}
                        placeholder="admin"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 pl-6 pr-3 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      Your current active link: <span className="text-amber-400 font-mono select-all">{window.location.origin}/{siteConfig.adminPath || 'admin'}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-neutral-400">Access Passcode / PIN</label>
                    <div className="relative font-sans">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={siteConfig.adminPassword || '2027'}
                        onChange={(e) => setSiteConfigState({
                          ...siteConfig,
                          adminPassword: e.target.value
                        })}
                        placeholder="2027"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 pr-10 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      Minimum recommended: 4 characters. Keep it secure!
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      if (!(siteConfig.adminPath || '').trim()) {
                        alert('Secret URL path cannot be blank.');
                        return;
                      }
                      if (!(siteConfig.adminPassword || '').trim()) {
                        alert('Security Passcode cannot be blank.');
                        return;
                      }
                      saveSiteConfig(siteConfig);
                      setSaveToast('Access credentials & security configurations saved successfully!');
                      setTimeout(() => setSaveToast(null), 3000);
                    }}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" /> Save Security Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeAdminTab === 'media' && (
            <MediaLibraryTab primaryColor={primaryColor} />
          )}

          {/* TAB: TESTIMONIALS MANAGER */}
          {activeAdminTab === 'testimonials' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Reviews & Fanboard</span>
                  <h2 className="text-xl font-bold text-white font-serif mt-0.5">Testimonials Manager</h2>
                  <p className="text-xs text-neutral-400 font-light">Add, edit, or remove guest experiences shown on the public testimonials board.</p>
                </div>
                {!showAddTestimonial && !editingTestimonial && (
                  <button
                    onClick={() => setShowAddTestimonial(true)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" /> Add Testimonial
                  </button>
                )}
              </div>

              {/* Testimonial Form (Create or Edit) */}
              {(showAddTestimonial || editingTestimonial) && (
                <form
                  onSubmit={handleSaveTestimonial}
                  className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-lg"
                >
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    {editingTestimonial ? 'Edit Guest Testimonial' : 'Create Guest Testimonial'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Guest Name</label>
                      <input
                        type="text"
                        required
                        value={editingTestimonial ? editingTestimonial.name : newTestimonialForm.name}
                        onChange={(e) => {
                          if (editingTestimonial) setEditingTestimonial({ ...editingTestimonial, name: e.target.value });
                          else setNewTestimonialForm({ ...newTestimonialForm, name: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. Sarah Jenkins"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Role / Designation</label>
                      <input
                        type="text"
                        required
                        value={editingTestimonial ? editingTestimonial.role : newTestimonialForm.role}
                        onChange={(e) => {
                          if (editingTestimonial) setEditingTestimonial({ ...editingTestimonial, role: e.target.value });
                          else setNewTestimonialForm({ ...newTestimonialForm, role: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. Soca Enthusiast"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Location / Origin</label>
                      <input
                        type="text"
                        required
                        value={editingTestimonial ? editingTestimonial.location : newTestimonialForm.location}
                        onChange={(e) => {
                          if (editingTestimonial) setEditingTestimonial({ ...editingTestimonial, location: e.target.value });
                          else setNewTestimonialForm({ ...newTestimonialForm, location: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. London, UK"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Rating (1 - 5 Stars)</label>
                      <select
                        value={editingTestimonial ? editingTestimonial.rating : newTestimonialForm.rating}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (editingTestimonial) setEditingTestimonial({ ...editingTestimonial, rating: val });
                          else setNewTestimonialForm({ ...newTestimonialForm, rating: val });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value={5}>★★★★★ (5 Stars)</option>
                        <option value={4}>★★★★☆ (4 Stars)</option>
                        <option value={3}>★★★☆☆ (3 Stars)</option>
                        <option value={2}>★★☆☆☆ (2 Stars)</option>
                        <option value={1}>★☆☆☆☆ (1 Star)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-neutral-400 font-bold uppercase block">Avatar / Profile Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={editingTestimonial ? editingTestimonial.avatar : newTestimonialForm.avatar}
                          onChange={(e) => {
                            if (editingTestimonial) setEditingTestimonial({ ...editingTestimonial, avatar: e.target.value });
                            else setNewTestimonialForm({ ...newTestimonialForm, avatar: e.target.value });
                          }}
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                          placeholder="Image URL"
                        />
                        <button
                          type="button"
                          onClick={() => setMediaSelectorTarget('testimonial')}
                          className="px-3 bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 rounded-lg border border-neutral-800 transition-colors uppercase text-[10px] tracking-wider font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Image className="w-3.5 h-3.5" /> Media Library
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-neutral-400 font-bold uppercase block">Testimonial Quote</label>
                      <textarea
                        required
                        rows={4}
                        value={editingTestimonial ? editingTestimonial.quote : newTestimonialForm.quote}
                        onChange={(e) => {
                          if (editingTestimonial) setEditingTestimonial({ ...editingTestimonial, quote: e.target.value });
                          else setNewTestimonialForm({ ...newTestimonialForm, quote: e.target.value });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="Share the guest's beautiful carnival experience or quote..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTestimonial(null);
                        setShowAddTestimonial(false);
                      }}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg transition-colors cursor-pointer"
                    >
                      {editingTestimonial ? 'Save Changes' : 'Create Testimonial'}
                    </button>
                  </div>
                </form>
              )}

              {/* Bulk Actions for Testimonials */}
              {selectedTestimonials.length > 0 && (
                <div className="bg-[#12162E] border border-amber-500/30 p-3 px-4 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.05)] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">
                      {selectedTestimonials.length} testimonial{selectedTestimonials.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTestimonials([])}
                      className="text-[10px] text-neutral-400 hover:text-white underline ml-2 cursor-pointer font-semibold"
                    >
                      Deselect All
                    </button>
                  </div>
                  <button
                    onClick={handleBulkDeleteTestimonials}
                    className="px-2.5 py-1 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-500/30 rounded text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
                  </button>
                </div>
              )}

              {/* Testimonials List */}
              <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-md">
                <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={testimonials.length > 0 && testimonials.every(t => selectedTestimonials.includes(t.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTestimonials(testimonials.map(t => t.id));
                        } else {
                          setSelectedTestimonials([]);
                        }
                      }}
                      className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-300">Active Testimonials board ({testimonials.length})</h4>
                  </div>
                </div>
                {testimonials.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">
                    No testimonials registered yet. Click "Add Testimonial" to create your first card.
                  </div>
                ) : (
                  (() => {
                    const totalTestimonialPages = Math.ceil(testimonials.length / ITEMS_PER_PAGE) || 1;
                    const currentTestimonialsPage = Math.min(testimonialsPage, totalTestimonialPages);
                    const paginatedTestimonials = testimonials.slice((currentTestimonialsPage - 1) * ITEMS_PER_PAGE, currentTestimonialsPage * ITEMS_PER_PAGE);
                    return (
                      <div className="divide-y divide-neutral-800/60">
                        {paginatedTestimonials.map((t) => (
                          <div key={t.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-neutral-900/30 transition-colors">
                            <div className="flex items-start gap-4">
                              <input
                                type="checkbox"
                                checked={selectedTestimonials.includes(t.id)}
                                onChange={() => {
                                  setSelectedTestimonials(prev => 
                                    prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                                  );
                                }}
                                className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer shrink-0 mt-1"
                              />
                              <img
                                src={t.avatar}
                                alt={t.name}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                                }}
                                className="w-12 h-12 rounded-full object-cover border border-neutral-800 bg-neutral-950 shrink-0"
                              />
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-white font-bold text-sm leading-snug">{t.name}</span>
                                  <span className="text-neutral-500 text-[11px]">• {t.role}</span>
                                  <span className="text-amber-400 font-mono text-[10px] ml-2">
                                    {Array.from({ length: t.rating }).map(() => '★').join('')}
                                  </span>
                                </div>
                                <p className="text-neutral-400 text-xs italic font-light font-sans line-clamp-2">
                                  "{t.quote}"
                                </p>
                                <p className="text-[10px] text-neutral-500 font-mono">
                                  Origin: {t.location}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTestimonial(t);
                                  setShowAddTestimonial(false);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 rounded-lg border border-neutral-800 transition-colors cursor-pointer text-xs font-bold"
                                title="Edit testimonial details"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTestimonial(t.id)}
                                className="p-2 bg-neutral-900 hover:bg-rose-950/20 text-neutral-500 hover:text-rose-400 rounded-lg border border-neutral-800/80 hover:border-rose-500/30 transition-colors cursor-pointer text-xs font-bold"
                                title="Delete Testimonial"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}

                        {totalTestimonialPages > 1 && (
                          <div className="flex items-center justify-between pt-4 px-5 py-3 border-t border-neutral-800 bg-neutral-950/20">
                            <span className="text-[11px] text-neutral-400 font-sans">
                              Showing <span className="text-white font-bold">{((currentTestimonialsPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="text-white font-bold">{Math.min(currentTestimonialsPage * ITEMS_PER_PAGE, testimonials.length)}</span> of <span className="text-white font-bold">{testimonials.length}</span> testimonials
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setTestimonialsPage(p => Math.max(1, p - 1))}
                                disabled={currentTestimonialsPage === 1}
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-855 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              >
                                Prev
                              </button>
                              <span className="text-xs font-mono text-neutral-300">
                                {currentTestimonialsPage} / {totalTestimonialPages}
                              </span>
                              <button
                                type="button"
                                onClick={() => setTestimonialsPage(p => Math.min(totalTestimonialPages, p + 1))}
                                disabled={currentTestimonialsPage === totalTestimonialPages}
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-855 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {activeAdminTab === 'backup' && (
            <BackupRestoreTab
              primaryColor={primaryColor}
              onRefreshData={loadData}
              triggerConfirm={triggerConfirm}
            />
          )}

        </motion.main>
      </div>

      {/* MODAL: PREMIUM DETAIL POPUP MODEL FOR PASS ORDER */}
      {selectedPassOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg overflow-y-auto">
          <div className="bg-[#0C0F1E] border border-white/5 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden relative my-8">
            {/* Accent top gradient bar */}
            <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 w-full" />
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-neutral-950/40">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-sans mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Executive Client Dossier
                </span>
                <h3 className="text-lg md:text-xl font-bold text-white font-heading">
                  {selectedPassOrder.extraDetails?.OrderRef || selectedPassOrder.extraDetails?.Reference || `ORDER-${selectedPassOrder.id}`}
                </h3>
                <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                  Logged on {new Date(selectedPassOrder.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 hover:border-amber-500 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-all text-sm"
                title="Close dossier"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-h-[70vh] overflow-y-auto scrollbar-thin">
              {/* Left Column: Client Identification & Package Breakdown */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b border-white/5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" /> Client Identification
                  </h4>
                  <div className="bg-neutral-950/40 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border border-amber-500/20 flex items-center justify-center font-serif text-lg font-bold text-amber-300 shrink-0 select-none">
                      {(selectedPassOrder.name || 'G')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="font-bold text-white text-base truncate">{selectedPassOrder.name}</div>
                      <div className="text-xs text-amber-400/90 font-mono flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {selectedPassOrder.email}
                      </div>
                      {selectedPassOrder.phone && (
                        <div className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 truncate">
                          <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" /> {selectedPassOrder.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b border-white/5 flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-amber-400" /> Reserved Pass Items
                  </h4>
                  <div className="bg-neutral-950/40 border border-white/5 rounded-xl p-4.5 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold block">Reserved Festival Package Breakdown</span>
                    </div>

                    <div className="border border-white/10 rounded-lg overflow-hidden bg-neutral-900/40 text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-neutral-900/90 text-amber-400 font-mono text-[10px] uppercase tracking-wider border-b border-white/10">
                            <th className="py-2 px-3">Item / Pass</th>
                            <th className="py-2 px-3 text-center">Qty</th>
                            <th className="py-2 px-3 text-right">Unit Price</th>
                            <th className="py-2 px-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-neutral-200 font-medium">
                          {parseSubmissionItems(selectedPassOrder).map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-2.5 px-3">
                                <strong className="text-white font-bold block">{item.title}</strong>
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  £{item.unitPriceGBP.toLocaleString('en-GB')} per pass
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-300">
                                {item.quantity}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-neutral-300">
                                £{item.unitPriceGBP.toLocaleString('en-GB')}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                £{item.totalPriceGBP.toLocaleString('en-GB')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {selectedPassOrder.messageOrDetails && (
                      <div className="bg-neutral-900/30 border border-white/5 p-3 rounded-lg text-xs italic text-neutral-300">
                        "{selectedPassOrder.messageOrDetails}"
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between border-t border-white/5">
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest block">Total Financial Amount</span>
                        <span className="text-lg font-black text-emerald-400 font-mono block">
                          {selectedPassOrder.extraDetails?.TotalPaid || `£${selectedPassOrder.amountGBP || 0}`}
                        </span>
                        {selectedPassOrder.amountGBP && (
                          <span className="text-[9px] text-neutral-500 font-mono block">
                            (£{selectedPassOrder.amountGBP} GBP Equivalent)
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest block">Workflow Status</span>
                        <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono ${
                          selectedPassOrder.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          selectedPassOrder.status === 'in-review' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        }`}>
                          ● {selectedPassOrder.status === 'resolved' ? 'CONFIRMED' : selectedPassOrder.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Logistics Cross-References & Communications */}
              <div className="space-y-6">
                {/* Logistics */}
                <div>
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b border-white/5 flex items-center gap-1.5">
                    <Plane className="w-4 h-4 text-amber-400" /> Logistics & Flight Registrations
                  </h4>
                  {(() => {
                    const profile = getGuestProfileByEmail(selectedPassOrder.email);
                    if (profile?.hasFlightDetails) {
                      return (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto">
                          {profile.flightRegs.map((f, idx) => (
                            <div key={idx} className="bg-emerald-950/10 border border-emerald-500/10 p-3.5 rounded-xl space-y-1.5">
                              <div className="flex items-center justify-between font-bold text-xs text-emerald-300">
                                <span>✈ {f.topicOrPass || f.extraDetails?.Airline || 'Flight Registration'}</span>
                                <span className="text-[10px] text-emerald-400/80 font-mono">{f.extraDetails?.Arrival || f.extraDetails?.FlightNum || ''}</span>
                              </div>
                              <p className="text-[11px] text-emerald-200/90 italic">
                                "{f.messageOrDetails}"
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <div className="bg-neutral-950/40 border border-white/5 rounded-xl p-4 text-center py-6">
                        <p className="text-xs text-neutral-500">No flight itinerary logged for <span className="font-mono text-neutral-400">{selectedPassOrder.email}</span> yet.</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Transmissions */}
                <div>
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b border-white/5 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-amber-400" /> Concierge Transmissions
                  </h4>
                  {selectedPassOrder.replies && selectedPassOrder.replies.length > 0 ? (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                      {selectedPassOrder.replies.map(rep => (
                        <div key={rep.id} className="p-3 bg-neutral-950/40 border border-white/5 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                            <span className="font-bold text-amber-300">{rep.sentBy}</span>
                            <span>{new Date(rep.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-neutral-300 text-[11px]">{rep.message}</p>
                          {rep.attachment && (
                            <div className="mt-2 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg flex items-center justify-between gap-2 text-[10px]">
                              <div className="flex items-center gap-1.5 text-amber-300 font-mono font-bold truncate">
                                <Paperclip className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="truncate">{rep.attachment.name}</span>
                              </div>
                              <button
                                onClick={() => setPreviewPdfSub(selectedPassOrder)}
                                className="px-2.5 py-1 bg-amber-500 text-neutral-950 font-bold text-[10px] rounded-md shrink-0 cursor-pointer hover:bg-amber-400 shadow-sm"
                              >
                                View PDF
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-neutral-950/40 border border-white/5 rounded-xl p-4 text-center py-6">
                      <p className="text-xs text-neutral-500">No concierge history logged for this client yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer / Executive Controls */}
            <div className="px-6 py-5 border-t border-white/5 bg-neutral-950/40 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => {
                    setPreviewPdfSub(selectedPassOrder);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                  title="Generate & Print VIP Pass / Wristband Badge PDF"
                >
                  <Printer className="w-3.5 h-3.5" /> Print VIP Badge
                </button>

                <button
                  onClick={() => {
                    setReplyingSub(selectedPassOrder);
                  }}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" /> Send Response
                </button>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedPassOrder.status}
                  onChange={(e) => handleStatusChange(selectedPassOrder.id, e.target.value as any)}
                  className="bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-amber-500 cursor-pointer font-bold"
                >
                  <option value="new">Mark New</option>
                  <option value="in-review">In Review</option>
                  <option value="resolved">Confirmed & Resolved</option>
                </select>

                <button
                  onClick={() => {
                    handleDelete(selectedPassOrder.id);
                    setSelectedOrderId(null);
                  }}
                  className="p-2 bg-rose-950/20 hover:bg-rose-900/45 text-rose-400 border border-rose-900/35 rounded-xl transition-colors cursor-pointer"
                  title="Delete order"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL ADD SUBMISSION RECORD */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-sans">Concierge Entry</span>
                <h3 className="text-lg font-bold text-white font-serif">Add Manual Record</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualSub} className="space-y-3.5 text-xs font-sans">
              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[9px] tracking-wider mb-1">Form Category</label>
                <select
                  value={newSubForm.type}
                  onChange={(e) => setNewSubForm({ ...newSubForm, type: e.target.value as any })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="contact">Contact Inquiry</option>
                  <option value="flight-registration">Flight Registration Log</option>
                  <option value="pass-order">Pass Reservation</option>
                  <option value="transport-request">Shuttle Request</option>
                </select>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-neutral-400 font-bold uppercase text-[9px] tracking-wider mb-1">Guest Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Thorne"
                    value={newSubForm.name}
                    onChange={(e) => setNewSubForm({ ...newSubForm, name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-bold uppercase text-[9px] tracking-wider mb-1">Guest Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="m.thorne@gmail.com"
                    value={newSubForm.email}
                    onChange={(e) => setNewSubForm({ ...newSubForm, email: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-bold uppercase text-[9px] tracking-wider mb-1">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+44 7900 123456"
                    value={newSubForm.phone}
                    onChange={(e) => setNewSubForm({ ...newSubForm, phone: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-bold uppercase text-[9px] tracking-wider mb-1">Topic / Package</label>
                  <input
                    type="text"
                    placeholder="e.g. VIP Gold Wristband"
                    value={newSubForm.topicOrPass}
                    onChange={(e) => setNewSubForm({ ...newSubForm, topicOrPass: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-bold uppercase text-[9px] tracking-wider mb-1">Message / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Record manual booking details..."
                    value={newSubForm.messageOrDetails}
                    onChange={(e) => setNewSubForm({ ...newSubForm, messageOrDetails: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2.5 flex justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg font-black cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONCIERGE EXECUTIVE RESPONSE DESK */}
      {replyingSub && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
          <div className="bg-[#0C0F1E] border border-neutral-800 rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-5 font-sans">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-sans">Official Concierge Desk</span>
                  <h3 className="text-lg font-bold text-white font-serif">Executive Guest Response</h3>
                </div>
              </div>
              <button
                onClick={() => setReplyingSub(null)}
                className="text-neutral-400 hover:text-white cursor-pointer p-1.5 hover:bg-neutral-900 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {replySent ? (
              <div className="py-10 text-center space-y-3 font-sans">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-white">Reply Recorded & Transmitted</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Response saved to system records. Status auto-updated to <span className="text-emerald-400 font-bold">'Resolved'</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={(e) => handleSendReply(e, replyMethod)} className="space-y-4 text-xs font-sans">
                {/* Guest Context Summary */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-850 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 text-[9px] uppercase tracking-wider font-bold">Recipient</span>
                    <a
                      href={`mailto:${replyingSub.email}`}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <Mail className="w-3 h-3" /> {replyingSub.email}
                    </a>
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{replyingSub.name || 'Anonymous Guest'}</span>
                    {replyingSub.topicOrPass && (
                      <span className="text-[10px] text-neutral-400 font-normal">({replyingSub.topicOrPass})</span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-300 italic bg-neutral-900/60 p-2 rounded border border-neutral-850 line-clamp-2">
                    "{replyingSub.messageOrDetails || replyingSub.topicOrPass}"
                  </p>
                </div>

                {/* Quick Response Templates */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-neutral-400 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Quick Concierge Templates
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyReplyTemplate('confirmation')}
                      className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 rounded-lg text-left text-[10px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="font-bold block text-amber-400 truncate">Pass Approval</span>
                      <span className="text-[9px] text-neutral-500 truncate block">Confirm wristbands</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyReplyTemplate('flight')}
                      className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 rounded-lg text-left text-[10px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="font-bold block text-amber-400 truncate">Airport Shuttle</span>
                      <span className="text-[9px] text-neutral-500 truncate block">Flight transfer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyReplyTemplate('vip')}
                      className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 rounded-lg text-left text-[10px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="font-bold block text-amber-400 truncate">VIP Cabana</span>
                      <span className="text-[9px] text-neutral-500 truncate block">Hospitality host</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyReplyTemplate('general')}
                      className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 rounded-lg text-left text-[10px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="font-bold block text-amber-400 truncate">General Inquiry</span>
                      <span className="text-[9px] text-neutral-500 truncate block">Official response</span>
                    </button>
                  </div>
                </div>

                {/* Response Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-neutral-400 font-bold uppercase text-[9px] tracking-wider">
                      Official Response Message
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyReplyText}
                        disabled={!replyMessage}
                        className="text-[10px] text-neutral-400 hover:text-amber-400 disabled:opacity-40 cursor-pointer flex items-center gap-1 font-mono transition-colors"
                      >
                        {replyCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {replyCopied ? 'Copied!' : 'Copy Text'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    required
                    placeholder="Type official executive message response or select a template above..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-sans text-xs leading-relaxed"
                  />

                  {/* Direct Mail Web / Client Quick Launchers */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[10px]">
                    <span className="text-neutral-500 text-[9px] font-bold uppercase">Direct Mail Launchers:</span>
                    <div className="flex flex-wrap items-center gap-1.5 font-mono">
                      <a
                        href={getMailtoUrl()}
                        target="_top"
                        onClick={() => handleSendReply(undefined, 'mailto')}
                        className={`px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 rounded border border-neutral-800 hover:border-amber-500/40 flex items-center gap-1 transition-colors ${!replyMessage.trim() ? 'pointer-events-none opacity-40' : ''}`}
                      >
                        <Mail className="w-2.5 h-2.5 text-amber-400" /> Default Mail App
                      </a>
                      <a
                        href={getGmailUrl()}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handleSendReply(undefined, 'gmail')}
                        className={`px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 rounded border border-neutral-800 hover:border-amber-500/40 flex items-center gap-1 transition-colors ${!replyMessage.trim() ? 'pointer-events-none opacity-40' : ''}`}
                      >
                        <ExternalLink className="w-2.5 h-2.5 text-red-400" /> Gmail Web
                      </a>
                      <a
                        href={getOutlookUrl()}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handleSendReply(undefined, 'outlook')}
                        className={`px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 rounded border border-neutral-800 hover:border-amber-500/40 flex items-center gap-1 transition-colors ${!replyMessage.trim() ? 'pointer-events-none opacity-40' : ''}`}
                      >
                        <ExternalLink className="w-2.5 h-2.5 text-sky-400" /> Outlook Web
                      </a>
                    </div>
                  </div>
                </div>

                {/* Delivery Method Selection */}
                <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-850 space-y-2">
                  <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block">Default Submit Dispatch Method</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setReplyMethod('mailto')}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        replyMethod === 'mailto'
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <div className="font-bold text-[10px] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-amber-400" /> Mail App
                      </div>
                      <div className="text-[8px] opacity-70 truncate">Native mailto link</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReplyMethod('gmail')}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        replyMethod === 'gmail'
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <div className="font-bold text-[10px] flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-red-400" /> Gmail
                      </div>
                      <div className="text-[8px] opacity-70 truncate">Google Webmail tab</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReplyMethod('outlook')}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        replyMethod === 'outlook'
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <div className="font-bold text-[10px] flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-sky-400" /> Outlook
                      </div>
                      <div className="text-[8px] opacity-70 truncate">Microsoft Webmail tab</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReplyMethod('in-app')}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        replyMethod === 'in-app'
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <div className="font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> In-App
                      </div>
                      <div className="text-[8px] opacity-70 truncate">In-App log only</div>
                    </button>
                  </div>
                </div>

                {/* Form Footer Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
                  <span className="text-[10px] text-neutral-500 font-medium">Auto-marks status as Resolved</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingSub(null)}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-slate-300 rounded-xl font-bold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!replyMessage.trim()}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 rounded-xl font-black flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                    >
                      <Send className="w-3.5 h-3.5" /> 
                      {replyMethod === 'gmail'
                        ? 'Open in Gmail Web'
                        : replyMethod === 'outlook'
                        ? 'Open in Outlook Web'
                        : replyMethod === 'mailto'
                        ? 'Launch Mail App'
                        : 'Log Reply & Resolve'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        primaryColor={primaryColor}
      />

      {/* Media Selector Modal */}
      <MediaSelectorModal
        isOpen={mediaSelectorTarget !== null}
        onClose={() => setMediaSelectorTarget(null)}
        onSelect={handleMediaSelect}
        primaryColor={primaryColor}
      />

      {/* Pass Badge & Wristband PDF Studio Modal */}
      {previewPdfSub && (
        <PassBadgePdfModal
          submission={previewPdfSub}
          isOpen={!!previewPdfSub}
          onClose={() => setPreviewPdfSub(null)}
          onAttachToReply={() => {
            setAttachPassPdf(true);
            setReplyingSub(previewPdfSub);
          }}
        />
      )}

    </div>
  );
};
