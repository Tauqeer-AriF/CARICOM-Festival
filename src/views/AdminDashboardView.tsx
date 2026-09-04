import React, { useState, useEffect, useRef } from 'react';
import { 
  FormSubmissionItem, 
  SiteConfig,
  EventItem,
  GalleryItem,
  HotelItem,
  PassItem,
  TestimonialItem,
  MediaItem,
  AdminUser,
  AdminRole
} from '../types';
import { 
  getSubmissions, 
  updateSubmissionStatus, 
  deleteSubmission, 
  updateSubmission,
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
  getAdminUsers,
  getCurrentAdminUser,
  authenticateAdminUser,
  logoutAdminUser,
  hasRoleAccess,
  getAllowedTabsForRole,
  AdminTabId,
  ROLE_PERMISSIONS,
  } from '../services/adminUserService';
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
  Pencil,
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
  Moon,
  Palmtree,
  Database,
  CalendarRange,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  KeyRound,
  ShieldAlert,
  Sliders,
  CalendarCheck,
  ArrowRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FESTIVAL_IMAGES } from '../data/festivalData';
import { 
  formatEventDateRange, 
  calculateDurationDays, 
  formatIsoDate, 
  shiftIsoDate, 
  parseTextDateToIso, 
  parseIsoDate,
  getFestivalDatesFromEvents,
  getEffectiveFestivalDateRange
} from '../utils/dateUtils';
import { LuxurySkeletonOverlay } from '../components/LuxurySkeletonOverlay';
import { CustomConfirmModal } from '../components/CustomConfirmModal';
import { MediaSelectorModal } from '../components/MediaSelectorModal';
import { MediaLibraryTab } from '../components/MediaLibraryTab';
import { BackupRestoreTab } from '../components/BackupRestoreTab';
import { AdminAnalyticsTab } from '../components/AdminAnalyticsTab';
import { AdminBrandingTab } from '../components/AdminBrandingTab';
import { AdminPageImagesTab } from '../components/AdminPageImagesTab';

import { PassBadgePdfModal, parseSubmissionItems } from '../components/PassBadgePdfModal';
import { ImportCsvModal } from '../components/ImportCsvModal';
import { EditSubmissionModal } from '../components/EditSubmissionModal';
import { EditEventModal } from '../components/EditEventModal';
import { EditGalleryItemModal } from '../components/EditGalleryItemModal';
import { EditPassModal } from '../components/EditPassModal';
import { EditHotelModal } from '../components/EditHotelModal';
import { EditTestimonialModal } from '../components/EditTestimonialModal';
import { AdminUsersTab } from '../components/AdminUsersTab';
import { OwnerControlTab } from '../components/OwnerControlTab';
import { AdminEmailSuiteTab } from '../components/AdminEmailSuiteTab';
import { getEmailLogs } from '../services/emailService';
import { 
  SubmissionTypeBadge, 
  SubmissionStatusBadge, 
  ALL_SUBMISSION_TYPE_TAGS, 
  ALL_SUBMISSION_STATUS_TAGS 
} from '../utils/submissionTags';

interface AdminDashboardViewProps {
  setActiveTab: (tab: any) => void;
  theme?: 'dark' | 'light';
  setTheme?: (theme: 'dark' | 'light') => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ 
  setActiveTab,
  theme: propTheme,
  setTheme: propSetTheme
}) => {
  // Theme state synchronized with prop or localStorage
  const [internalTheme, setInternalTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const activeTheme = propTheme || internalTheme;

  const handleToggleTheme = () => {
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    if (propSetTheme) {
      propSetTheme(nextTheme);
    } else {
      setInternalTheme(nextTheme);
      try {
        localStorage.setItem('theme', nextTheme);
        if (nextTheme === 'light') {
          document.documentElement.classList.add('light-mode');
        } else {
          document.documentElement.classList.remove('light-mode');
        }
      } catch (err) {
        console.warn('Failed to save theme:', err);
      }
    }
  };
  // Auth state (2-Tier: Passcode Gate -> Username & Password Login)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (sessionStorage.getItem('admin_authenticated') === 'true' || localStorage.getItem('admin_authenticated') === 'true') && !!getCurrentAdminUser();
  });
  const [passcodeVerified, setPasscodeVerified] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // User credentials state for Step 2
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => getCurrentAdminUser());

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
  const [editingSubmission, setEditingSubmission] = useState<FormSubmissionItem | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | number | null>(null);
  const selectedPassOrder = submissions.find(s => s.id === selectedOrderId) || null;

  const setReplyingSub = (sub: FormSubmissionItem | null) => {
    setReplyingSubState(sub);
    if (sub) {
      setAttachPassPdf(sub.type === 'pass-order' || sub.type === 'flight-registration');
    }
  };

  // New Manual Submission Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showImportCsvModal, setShowImportCsvModal] = useState<boolean>(false);
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
  
  type AdminTab = AdminTabId;
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('analytics');
  const [selectedAnalyticsLocation, setSelectedAnalyticsLocation] = useState<string>('Grand Anse Beach');
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);
  const [pageImagesSubTab, setPageImagesSubTab] = useState<'home' | 'about-grenada' | 'about-mellowland' | 'banners'>('home');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // RBAC validation effect: Ensure active tab is authorized for current operator role
  useEffect(() => {
    if (currentAdmin) {
      const allowed = getAllowedTabsForRole(currentAdmin.role);
      if (!allowed.includes(activeAdminTab)) {
        setActiveAdminTab(allowed[0] || 'analytics');
      }
    }
  }, [currentAdmin]);

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
  const [selectedPassOrders, setSelectedPassOrders] = useState<string[]>([]);

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
    setSelectedPassOrders([]);
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
    'event' | 'gallery' | 'gallery_video' | 'hotel' | 'testimonial' | 'hero' | 'logo' | 'favicon' | 'custom_callback' | { heroIndex: number } | { pageImageKey: string } | null
  >(null);
  const [mediaSelectorCallback, setMediaSelectorCallback] = useState<((url: string) => void) | null>(null);

  const openMediaLibraryWithCallback = (onSelect: (url: string) => void) => {
    setMediaSelectorCallback(() => onSelect);
    setMediaSelectorTarget('custom_callback');
  };

  const handleMediaSelect = (url: string) => {
    if (mediaSelectorTarget === 'custom_callback' && mediaSelectorCallback) {
      mediaSelectorCallback(url);
      setMediaSelectorCallback(null);
      setMediaSelectorTarget(null);
      setSaveToast('Selected media applied from Media Library!');
      return;
    }
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

  // Master Festival Dates & Events Schedule State
  const [festivalStartInput, setFestivalStartInput] = useState<string>(
    siteConfig?.festivalDates?.startDate || '2027-05-22'
  );
  const [festivalEndInput, setFestivalEndInput] = useState<string>(
    siteConfig?.festivalDates?.endDate || '2027-05-31'
  );
  const [festivalTimeInput, setFestivalTimeInput] = useState<string>(
    siteConfig?.festivalDates?.startTime || '18:00'
  );
  const [showDatesManager, setShowDatesManager] = useState<boolean>(true);

  // Editing and Adding states
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [showAddEvent, setShowAddEvent] = useState<boolean>(false);
  const [newEventForm, setNewEventForm] = useState<Partial<EventItem>>({
    title: '',
    category: 'Party',
    startDate: '2027-05-22',
    endDate: '2027-05-22',
    isSingleDay: true,
    date: 'May 22, 2027',
    dayNumber: 1,
    time: '18:00 - 23:00',
    location: 'St. George\'s, Grenada',
    description: '',
    highlightImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80',
    genres: ['Soca', 'Calypso'],
    djLineup: [],
    dressCode: '',
    wristbandRequired: true,
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

  // --- DEDICATED MODAL SAVE HANDLERS ---
  const handleSaveEventModal = (savedEvent: EventItem) => {
    let updatedList: EventItem[];
    if (editingEvent) {
      updatedList = events.map(ev => ev.id === savedEvent.id ? savedEvent : ev);
      setSaveToast('Event updated successfully!');
    } else {
      updatedList = [...events, savedEvent];
      setSaveToast('New event created successfully!');
    }
    setEvents(updatedList);
    saveEvents(updatedList);
    setEditingEvent(null);
    setShowAddEvent(false);
    loadData();
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSaveGalleryModal = (savedItem: GalleryItem) => {
    let updatedList: GalleryItem[];
    if (editingGallery) {
      updatedList = galleryItems.map(item => item.id === savedItem.id ? savedItem : item);
      setSaveToast('Gallery item updated successfully!');
    } else {
      updatedList = [savedItem, ...galleryItems];
      setSaveToast('New gallery item added!');
    }
    setGalleryItems(updatedList);
    saveGalleryItems(updatedList);
    setEditingGallery(null);
    setShowAddGallery(false);
    loadData();
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSavePassModal = (savedPass: PassItem) => {
    let updatedList: PassItem[];
    if (editingPass) {
      updatedList = passes.map(p => p.id === savedPass.id ? savedPass : p);
      setSaveToast('Pass package updated!');
    } else {
      updatedList = [...passes, savedPass];
      setSaveToast('New pass package created!');
    }
    setPasses(updatedList);
    savePasses(updatedList);
    setEditingPass(null);
    setShowAddPass(false);
    loadData();
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSaveHotelModal = (savedHotel: HotelItem) => {
    let updatedList: HotelItem[];
    if (editingHotel) {
      updatedList = hotels.map(h => h.id === savedHotel.id ? savedHotel : h);
      setSaveToast('Hotel details updated!');
    } else {
      updatedList = [...hotels, savedHotel];
      setSaveToast('New partner hotel added!');
    }
    setHotels(updatedList);
    saveHotels(updatedList);
    setEditingHotel(null);
    setShowAddHotel(false);
    loadData();
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSaveTestimonialModal = (savedTestimonial: TestimonialItem) => {
    let updatedList: TestimonialItem[];
    if (editingTestimonial) {
      updatedList = testimonials.map(t => t.id === savedTestimonial.id ? savedTestimonial : t);
      setSaveToast('Testimonial updated!');
    } else {
      updatedList = [...testimonials, savedTestimonial];
      setSaveToast('New testimonial added!');
    }
    setTestimonials(updatedList);
    saveTestimonials(updatedList);
    setEditingTestimonial(null);
    setShowAddTestimonial(false);
    loadData();
    setTimeout(() => setSaveToast(null), 3000);
  };

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
    if (freshConfig.festivalDates?.startDate) {
      setFestivalStartInput(freshConfig.festivalDates.startDate);
    }
    if (freshConfig.festivalDates?.endDate) {
      setFestivalEndInput(freshConfig.festivalDates.endDate);
    }
    if (freshConfig.festivalDates?.startTime) {
      setFestivalTimeInput(freshConfig.festivalDates.startTime);
    }
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
    const inputPin = pinInput.trim();
    const opsPasscode = (siteConfig.adminPassword || '2027').trim();
    const ownerConfigPasscode = (siteConfig.ownerAdminPassword || '9999').trim();
    const activeOwner = getAdminUsers().find(u => u.role === 'Owner' || u.username.toLowerCase() === 'owner');
    const ownerUserPasscode = activeOwner?.passcode?.trim();

    if (
      inputPin === opsPasscode || 
      inputPin === ownerConfigPasscode || 
      (ownerUserPasscode && inputPin === ownerUserPasscode) ||
      inputPin === '2027' ||
      inputPin === '9999'
    ) {
      setPasscodeVerified(true);
      setPinError(false);
      setLoginError(null);
    } else {
      setPinError(true);
    }
  };

  const handleUserLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = authenticateAdminUser(loginUsername, loginPassword);
    if (res.success && res.user) {
      sessionStorage.setItem('admin_authenticated', 'true');
      localStorage.setItem('admin_authenticated', 'true');
      setCurrentAdmin(res.user);
      setIsAuthenticated(true);
      setLoginError(null);
      const allowed = getAllowedTabsForRole(res.user.role);
      if (!allowed.includes(activeAdminTab)) {
        setActiveAdminTab(allowed[0] || 'analytics');
      }
      setSaveToast(`Welcome, ${res.user.name} (@${res.user.username})!`);
    } else {
      setLoginError(res.error || 'Invalid credentials. Please verify username and password.');
    }
  };

  const handleLogout = () => {
    logoutAdminUser();
    setIsAuthenticated(false);
    setPasscodeVerified(false);
    setPinInput('');
    setLoginUsername('');
    setLoginPassword('');
    setCurrentAdmin(null);
  };

  const handleStatusChange = (id: string, newStatus: 'new' | 'in-review' | 'resolved') => {
    updateSubmissionStatus(id, newStatus);
    loadData();
  };

  const handleSaveEditedSubmission = (updatedItem: FormSubmissionItem) => {
    const result = updateSubmission(updatedItem.id, updatedItem);
    if (result) {
      loadData();
      setEditingSubmission(null);
      setSaveToast(`Successfully updated record for "${updatedItem.name || updatedItem.id}"!`);
      setTimeout(() => setSaveToast(null), 3500);
    }
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

  // --- MASTER FESTIVAL DATES & EVENTS SCHEDULE HANDLERS ---
  const handleSaveFestivalMasterDates = () => {
    const formattedRange = formatEventDateRange(festivalStartInput, festivalEndInput, 'May 22 – 31, 2027');
    const updatedDates = {
      startDate: festivalStartInput,
      endDate: festivalEndInput,
      startTime: festivalTimeInput,
      label: `${formattedRange.toUpperCase()} • SPICE ISLE`,
      rangeText: formattedRange,
      locationLabel: 'SPICE ISLE, GRENADA'
    };

    const updatedConfig: SiteConfig = {
      ...siteConfig,
      festivalDates: updatedDates,
      banner: {
        ...siteConfig.banner,
        text: `🔥 GRENADA CARICOM FESTIVAL 2027 • EARLY BIRD VIP WRISTBANDS 85% SOLD OUT • ${formattedRange.toUpperCase()}`
      },
      updatedAt: new Date().toISOString()
    };

    setSiteConfigState(updatedConfig);
    saveSiteConfig(updatedConfig);
    setSaveToast('Festival dates updated successfully!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // --- EVENTS CRUD HANDLERS ---
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedList: EventItem[];
    if (editingEvent) {
      const isSingle = editingEvent.isSingleDay !== undefined 
        ? editingEvent.isSingleDay 
        : (editingEvent.startDate === editingEvent.endDate);
      const start = editingEvent.startDate || parseTextDateToIso(editingEvent.date) || festivalStartInput;
      const end = isSingle ? start : (editingEvent.endDate || start);
      const formattedDate = formatEventDateRange(start, end, editingEvent.date);

      const finalEvent: EventItem = {
        ...editingEvent,
        category: editingEvent.category?.trim() || 'Party',
        startDate: start,
        endDate: end,
        isSingleDay: isSingle,
        date: formattedDate,
        djLineup: editingEvent.djLineup || [],
        wristbandRequired: editingEvent.wristbandRequired ?? true
      };

      updatedList = events.map(ev => ev.id === editingEvent.id ? finalEvent : ev);
      saveEvents(updatedList);
      setEditingEvent(null);
      setSaveToast('Event updated successfully!');
    } else {
      const isSingle = newEventForm.isSingleDay !== undefined ? newEventForm.isSingleDay : true;
      const start = newEventForm.startDate || festivalStartInput;
      const end = isSingle ? start : (newEventForm.endDate || start);
      const formattedDate = formatEventDateRange(start, end, newEventForm.date);

      const created: EventItem = {
        ...newEventForm as EventItem,
        id: 'event-' + Date.now(),
        category: newEventForm.category?.trim() || 'Party',
        startDate: start,
        endDate: end,
        isSingleDay: isSingle,
        date: formattedDate,
        djLineup: newEventForm.djLineup || [],
        wristbandRequired: newEventForm.wristbandRequired ?? true
      };
      updatedList = [...events, created];
      saveEvents(updatedList);
      setShowAddEvent(false);
      setNewEventForm({
        title: '',
        category: 'Party',
        startDate: festivalStartInput,
        endDate: festivalStartInput,
        isSingleDay: true,
        date: formatIsoDate(festivalStartInput),
        dayNumber: (events.length % 10) + 1,
        time: '18:00 - 23:00',
        location: 'St. George\'s, Grenada',
        description: '',
        highlightImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80',
        genres: ['Soca', 'Calypso'],
        djLineup: [],
        dressCode: '',
        wristbandRequired: true,
        ticketPrice: undefined,
        isFeatured: false
      });
      setSaveToast('New event created successfully!');
    }

    // Recalculate dates if derived range exists
    const derivedDates = getFestivalDatesFromEvents(updatedList);
    if (derivedDates) {
      const formattedRange = formatEventDateRange(derivedDates.startDate, derivedDates.endDate);
      const updatedConfig: SiteConfig = {
        ...siteConfig,
        festivalDates: {
          startDate: derivedDates.startDate,
          endDate: derivedDates.endDate,
          startTime: siteConfig.festivalDates?.startTime || '18:00',
          label: `${formattedRange.toUpperCase()} • SPICE ISLE`,
          rangeText: formattedRange,
          locationLabel: 'SPICE ISLE, GRENADA'
        },
        banner: {
          ...siteConfig.banner,
          text: `🔥 GRENADA CARICOM FESTIVAL 2027 • EARLY BIRD VIP WRISTBANDS 85% SOLD OUT • ${formattedRange.toUpperCase()}`
        },
        updatedAt: new Date().toISOString()
      };
      setSiteConfigState(updatedConfig);
      saveSiteConfig(updatedConfig);
      setFestivalStartInput(derivedDates.startDate);
      setFestivalEndInput(derivedDates.endDate);
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
        const derivedDates = getFestivalDatesFromEvents(filtered);
        if (derivedDates) {
          const formattedRange = formatEventDateRange(derivedDates.startDate, derivedDates.endDate);
          const updatedConfig: SiteConfig = {
            ...siteConfig,
            festivalDates: {
              startDate: derivedDates.startDate,
              endDate: derivedDates.endDate,
              startTime: siteConfig.festivalDates?.startTime || '18:00',
              label: `${formattedRange.toUpperCase()} • SPICE ISLE`,
              rangeText: formattedRange,
              locationLabel: 'SPICE ISLE, GRENADA'
            },
            banner: {
              ...siteConfig.banner,
              text: `🔥 GRENADA CARICOM FESTIVAL 2027 • EARLY BIRD VIP WRISTBANDS 85% SOLD OUT • ${formattedRange.toUpperCase()}`
            },
            updatedAt: new Date().toISOString()
          };
          setSiteConfigState(updatedConfig);
          saveSiteConfig(updatedConfig);
          setFestivalStartInput(derivedDates.startDate);
          setFestivalEndInput(derivedDates.endDate);
        }
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
  const handleBulkOrderStatusChange = (status: FormSubmissionItem['status']) => {
    if (selectedPassOrders.length === 0) return;
    const statusLabel = status === 'resolved' ? 'Confirmed / Resolved' : status === 'in-review' ? 'In Review' : 'New';
    triggerConfirm(
      'Update Status for Multiple Pass Orders',
      `Are you sure you want to change the status of ${selectedPassOrders.length} selected pass order(s) to '${statusLabel}'?`,
      () => {
        selectedPassOrders.forEach(id => {
          updateSubmissionStatus(id, status);
        });
        const count = selectedPassOrders.length;
        setSelectedPassOrders([]);
        loadData();
        setSaveToast(`Successfully updated ${count} pass order(s) to '${statusLabel}'!`);
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  const handleBulkDeletePassOrders = () => {
    if (selectedPassOrders.length === 0) return;
    triggerConfirm(
      'Bulk Delete Pass Orders',
      `Are you sure you want to permanently delete the ${selectedPassOrders.length} selected pass order(s)? This will remove them and their transaction records permanently.`,
      () => {
        selectedPassOrders.forEach(id => {
          deleteSubmission(id);
        });
        const count = selectedPassOrders.length;
        setSelectedPassOrders([]);
        loadData();
        setSaveToast(`Permanently deleted ${count} pass order(s)!`);
        setTimeout(() => setSaveToast(null), 3000);
      }
    );
  };

  const handleBulkExportSelectedPassOrders = () => {
    if (selectedPassOrders.length === 0) return;
    const selectedItems = submissions.filter(s => selectedPassOrders.includes(s.id));
    exportSubmissionsCSV(selectedItems, 'Grenada_Festival_Selected_Pass_Orders');
    setSaveToast(`Exported ${selectedItems.length} selected pass order(s) to CSV!`);
    setTimeout(() => setSaveToast(null), 3000);
  };

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
    return <SubmissionTypeBadge type={type} />;
  };

  const getStatusBadge = (status: FormSubmissionItem['status']) => {
    return <SubmissionStatusBadge status={status} />;
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

        {/* Top Floating Controls with Theme Toggle */}
        <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
          <button
            onClick={handleToggleTheme}
            id="admin-login-theme-toggle"
            className="p-2 sm:p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 rounded-xl text-neutral-200 transition-all cursor-pointer hover:border-amber-400 shadow-lg shrink-0 group"
            title={activeTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {activeTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>

        <div className="w-full max-w-md bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-3xl p-7 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center space-y-5 relative z-10">
          <div 
            className="w-16 h-16 border rounded-2xl flex items-center justify-center mx-auto shadow-lg transition-all duration-300"
            style={{ 
              borderColor: `${primaryColor}40`, 
              backgroundColor: `${primaryColor}10`,
              color: primaryColor 
            }}
          >
            {passcodeVerified ? <ShieldCheck className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-300 border-amber-500/30 font-mono inline-block mb-1">
              {passcodeVerified ? 'STEP 2: OPERATOR CREDENTIALS' : 'STEP 1: PASSCODE GATE'}
            </span>
            <h2 className="text-2xl font-extrabold font-serif text-white mt-1">
              {passcodeVerified ? 'Console User Login' : 'Festival Executive Portal'}
            </h2>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              {passcodeVerified 
                ? 'Passcode verified. Please enter your administrator username and password to unlock the workspace.' 
                : 'Enter security passcode to begin administrator authorization.'}
            </p>
          </div>

          {!passcodeVerified ? (
            /* STEP 1: Passcode Form */
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <div className="relative flex items-center">
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Secure Passcode"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-800/70 rounded-xl py-3.5 pl-12 pr-12 text-center text-sm font-mono tracking-widest text-white focus:outline-none transition-all"
                    style={{
                      borderColor: pinError ? '#F43F5E' : undefined
                    }}
                    onFocus={(e) => {
                      if (!pinError) {
                        e.target.style.borderColor = primaryColor;
                        e.target.style.boxShadow = `0 0 12px ${primaryColor}15`;
                      }
                    }}
                    onBlur={(e) => {
                      if (!pinError) {
                        e.target.style.borderColor = '';
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
                {pinError && <p className="text-xs text-rose-400 mt-2 font-medium">Incorrect PIN / passcode. Please try again.</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-[1.02] cursor-pointer hover:brightness-110 active:scale-[0.98]"
                style={{ backgroundColor: primaryColor }}
              >
                Verify Passcode →
              </button>
            </form>
          ) : (
            /* STEP 2: Username & Password Login Form */
            <form onSubmit={handleUserLoginSubmit} className="space-y-3.5 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Passcode Verified
              </div>

              {loginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-400" /> Operator Username
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-neutral-500 text-xs font-mono select-none">@</span>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. admin"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-800/70 rounded-xl py-2.5 pl-8 pr-3 text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> User Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    placeholder="Enter your account password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-800/70 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 text-neutral-400 hover:text-white p-1 cursor-pointer transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-[1.02] cursor-pointer hover:brightness-110 active:scale-[0.98] mt-2"
                style={{ backgroundColor: primaryColor }}
              >
                Sign In to Console
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end text-xs">
            <button
              onClick={() => setActiveTab('home')}
              className="text-slate-400 font-semibold underline cursor-pointer transition-colors hover:text-white"
            >
              Return to Website →
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

          {/* Current Operator Profile Card */}
          {currentAdmin && (
            <div className="mt-3 p-2.5 rounded-xl bg-neutral-950/90 border border-neutral-800/70 flex items-center gap-2.5 text-left">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-mono"
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              >
                {currentAdmin.name ? currentAdmin.name[0].toUpperCase() : 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{currentAdmin.name}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 truncate">
                    {currentAdmin.role}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {hasRoleAccess(currentAdmin?.role, 'owner') && (
            <button
              onClick={() => {
                setActiveAdminTab('owner');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeAdminTab === 'owner'
                  ? 'text-neutral-950 shadow-md font-extrabold'
                  : 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/30'
              }`}
              style={activeAdminTab === 'owner' ? { backgroundColor: primaryColor } : undefined}
            >
              <span className="flex items-center gap-2.5">
                <Crown className="w-4 h-4 text-amber-400" /> Owner Control
              </span>
            </button>
          )}

          {hasRoleAccess(currentAdmin?.role, 'analytics') && (
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
          )}

          {hasRoleAccess(currentAdmin?.role, 'submissions') && (
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
          )}

          {hasRoleAccess(currentAdmin?.role, 'orders') && (
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
          )}

          {hasRoleAccess(currentAdmin?.role, 'branding') && (
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
              <Palette className="w-4 h-4" /> Customiser Studio
            </button>
          )}

          {hasRoleAccess(currentAdmin?.role, 'page-images') && (
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
          )}

          {hasRoleAccess(currentAdmin?.role, 'events') && (
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
          )}

          {hasRoleAccess(currentAdmin?.role, 'gallery') && (
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
          )}

          {hasRoleAccess(currentAdmin?.role, 'passes') && (
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
          )}

          {hasRoleAccess(currentAdmin?.role, 'hotels') && (
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
          )}

          {hasRoleAccess(currentAdmin?.role, 'testimonials') && (
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
          )}

          {hasRoleAccess(currentAdmin?.role, 'media') && (
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
          )}

          {hasRoleAccess(currentAdmin?.role, 'users') && (
            <button
              onClick={() => {
                setActiveAdminTab('users');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeAdminTab === 'users'
                  ? 'text-neutral-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
              style={activeAdminTab === 'users' ? { backgroundColor: primaryColor } : undefined}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4" /> Console Users
              </span>
              <span 
                className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                style={{
                  backgroundColor: activeAdminTab === 'users' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                  color: activeAdminTab === 'users' ? '#000000' : '#d4d4d4'
                }}
              >
                {getAdminUsers().filter(u => u.role !== 'Owner' && u.username.toLowerCase() !== 'owner').length}
              </span>
            </button>
          )}

          {hasRoleAccess(currentAdmin?.role, 'emails') && (
            <button
              onClick={() => {
                setActiveAdminTab('emails');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeAdminTab === 'emails'
                  ? 'text-neutral-950 shadow-md font-extrabold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
              style={activeAdminTab === 'emails' ? { backgroundColor: primaryColor } : undefined}
            >
              <span className="flex items-center gap-2.5">
                <Mail className="w-4 h-4" /> Email Suite
              </span>
              <span 
                className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                style={{
                  backgroundColor: activeAdminTab === 'emails' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                  color: activeAdminTab === 'emails' ? '#000000' : '#d4d4d4'
                }}
              >
                {getEmailLogs().length}
              </span>
            </button>
          )}

          {hasRoleAccess(currentAdmin?.role, 'system') && (
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
          )}

          {hasRoleAccess(currentAdmin?.role, 'backup') && (
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
          )}
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
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-neutral-400 hover:text-white shrink-0 cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest font-mono shrink-0">
              <span>Workspace</span>
              <span className="text-neutral-600">/</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider truncate">
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
                {activeAdminTab === 'users' && 'Console Users & Access Control'}
                {activeAdminTab === 'owner' && 'Owner Control Center'}
              </span>
              {activeAdminTab === 'submissions' && submissions.length > 0 && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-800/80 text-neutral-300 border border-neutral-700/60 shrink-0">
                  {submissions.length} total
                </span>
              )}
              {activeAdminTab === 'orders' && submissions.filter(s => s.type === 'pass-order').length > 0 && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                  {submissions.filter(s => s.type === 'pass-order').length} orders
                </span>
              )}
            </div>
          </div>

          {/* ALL ACTION BUTTONS & SYNC CONTROLLER ALIGNED TO THE RIGHT */}
          <div className="flex items-center gap-2 sm:gap-2.5 ml-auto shrink-0">
            {/* Persistent Real-Time Sync Controller */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-neutral-950/60 border border-neutral-800/80 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="hidden lg:inline text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest font-mono">
                Live DB
              </span>
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                title="Force sync entire application state with server"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>

            {/* Current Logged In User Pill */}
            {currentAdmin && (
              <div 
                onClick={() => setActiveAdminTab('users')}
                className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs cursor-pointer hover:border-amber-500/40 transition-colors shrink-0"
                title="View & manage console user accounts"
              >
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px]"
                  style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                >
                  {currentAdmin.name ? currentAdmin.name[0].toUpperCase() : 'A'}
                </div>
                <span className="text-[11px] font-mono font-bold text-white">@{currentAdmin.username}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono">
                  {currentAdmin.role}
                </span>
              </div>
            )}

            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={handleToggleTheme}
              id="admin-dashboard-theme-toggle"
              className="p-2 sm:p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 rounded-xl text-neutral-200 transition-all cursor-pointer hover:border-amber-400 shadow-lg shrink-0 group"
              title={activeTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {activeTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              )}
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
          {/* Conditional Role-Based Access Guard */}
          {!hasRoleAccess(currentAdmin?.role, activeAdminTab) ? (
            <div className="bg-[#0C0F1E] border border-rose-500/25 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-2xl animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 inline-block">
                  Access Restricted • Role Clearance Required
                </span>
                <h2 className="text-2xl font-bold text-white font-serif">Insufficient Permissions</h2>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-md mx-auto">
                  Your current operator role (<span className="text-amber-400 font-bold">{currentAdmin?.role || 'Guest'}</span>) does not have clearance to view or manage the <span className="text-white font-bold capitalize">{activeAdminTab.replace('-', ' ')}</span> module.
                </p>
              </div>

              <div className="p-5 bg-neutral-950/80 border border-neutral-800/70 rounded-2xl text-left space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Authorized modules for your account:
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {getAllowedTabsForRole(currentAdmin?.role).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveAdminTab(tab)}
                      className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-xs font-bold text-neutral-200 hover:text-amber-300 rounded-xl transition-all cursor-pointer capitalize flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {tab.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
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
            <div className="space-y-5">
              
              {/* COMPREHENSIVE ACTION & FILTER TOOLBAR */}
              <div className="bg-[#0C0F1E] border border-neutral-800/85 rounded-2xl p-4 md:p-5 shadow-lg space-y-4">
                {/* Top Action Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-neutral-800/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white tracking-wide">Received Submissions &amp; Records</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-neutral-900 border border-neutral-800 text-neutral-300">
                          {filteredSubmissions.length} of {submissions.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">Manage contact inquiries, flight registrations, shuttle requests, and VIP forms</p>
                    </div>
                  </div>

                  {/* Actions Group */}
                  <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
                    <button
                      onClick={handleRefreshData}
                      disabled={isRefreshing}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-[11px] uppercase tracking-wider rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="Reload latest records from database"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                      onClick={() => setShowImportCsvModal(true)}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-[11px] uppercase tracking-wider rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="Bulk import submissions from CSV file"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span>Import CSV</span>
                    </button>

                    <button
                      onClick={() => {
                        exportSubmissionsCSV(submissions, 'Grenada_Festival_Received_Forms');
                      }}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-[11px] uppercase tracking-wider rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="Download complete submissions spreadsheet"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowAddModal(true);
                      }}
                      className="px-3.5 py-1.5 font-black text-[11px] uppercase tracking-wider text-neutral-950 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md ml-auto sm:ml-0"
                      style={{ backgroundColor: primaryColor }}
                      title="Add a manual record entry"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>New Record</span>
                    </button>
                  </div>
                </div>

                {/* Filter & Search Controls Row */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by name, email, details, ref number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-0.5 rounded cursor-pointer"
                        title="Clear search query"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdowns & Reset */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5">
                      <Filter className="w-3 h-3 text-neutral-400" />
                      <span className="text-[10px] text-neutral-400 font-bold uppercase">Form:</span>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-transparent border-0 text-[11px] text-neutral-200 font-medium focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="all" className="bg-neutral-950 text-white">All Types ({submissions.length})</option>
                        <option value="contact" className="bg-neutral-950 text-white">Contact Requests</option>
                        <option value="flight-registration" className="bg-neutral-950 text-white">Flight Registrations</option>
                        <option value="pass-order" className="bg-neutral-950 text-white">Pass Packages</option>
                        <option value="transport-request" className="bg-neutral-950 text-white">Shuttle Requests</option>
                        <option value="newsletter" className="bg-neutral-950 text-white">VIP Newsletter</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase">Status:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent border-0 text-[11px] text-neutral-200 font-medium focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="all" className="bg-neutral-950 text-white">All Statuses</option>
                        <option value="new" className="bg-neutral-950 text-white">New ({newCount})</option>
                        <option value="in-review" className="bg-neutral-950 text-white">In Review ({inReviewCount})</option>
                        <option value="resolved" className="bg-neutral-950 text-white">Resolved ({resolvedCount})</option>
                      </select>
                    </div>

                    {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setTypeFilter('all');
                          setStatusFilter('all');
                        }}
                        className="px-2.5 py-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                        title="Reset all active filters"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
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
                            <th className="py-3.5 px-5 w-[25%]">Guest Name</th>
                            <th className="py-3.5 px-4 w-[18%]">Form Category</th>
                            <th className="py-3.5 px-4 w-[37%]">Details Summary</th>
                            <th className="py-3.5 px-5 w-[15%] text-right">Quick Actions</th>
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

                                    {/* Quick Actions */}
                                    <td className="py-3 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => setEditingSubmission(sub)}
                                          className="px-2 py-1 text-[10px] font-bold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                          title="Edit Form Submission Record"
                                        >
                                          <Pencil className="w-3 h-3 text-sky-400" /> Edit
                                        </button>
                                        <button
                                          onClick={() => setPreviewPdfSub(sub)}
                                          className="px-2 py-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                          title="Print / Export Pass & Wristband Badge PDF"
                                        >
                                          <Printer className="w-3 h-3 text-amber-400" /> Badge
                                        </button>
                                        <button
                                          onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                                          className="p-1 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-800 transition-colors cursor-pointer"
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
                                    <td colSpan={5} className="py-4 px-6 border-t border-neutral-900">
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
                                                onClick={() => setEditingSubmission(sub)}
                                                className="px-3.5 py-1.5 text-xs font-bold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                                                title="Edit record details and parameters"
                                              >
                                                <Pencil className="w-3.5 h-3.5 text-sky-400" /> Edit Record
                                              </button>
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
                                    onClick={() => setEditingSubmission(sub)}
                                    className="p-1 text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded cursor-pointer"
                                    title="Edit Form Record"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-sky-400" />
                                  </button>
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
                                        <div key={reply.id} className="p-2 bg-neutral-950 rounded border border-neutral-800/70 text-[11px] space-y-1">
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
                                          className="bg-neutral-900 border border-neutral-800/70 text-[10px] text-neutral-300 font-bold rounded-md px-1.5 py-0.5 cursor-pointer focus:outline-none"
                                        >
                                          <option value="new">New</option>
                                          <option value="in-review">In Review</option>
                                          <option value="resolved">Resolved</option>
                                        </select>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setEditingSubmission(sub)}
                                        className="flex-1 py-1.5 text-[10px] font-bold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1"
                                      >
                                        <Pencil className="w-3 h-3 text-sky-400" /> Edit Form
                                      </button>
                                      <button
                                        onClick={() => setReplyingSub(sub)}
                                        className="flex-1 py-1.5 text-[10px] font-bold text-neutral-950 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 hover:brightness-110"
                                        style={{ backgroundColor: primaryColor }}
                                      >
                                        <Send className="w-3 h-3" /> Reply
                                      </button>
                                    </div>
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

              {/* COMPREHENSIVE PASS ORDERS ACTION & FILTER TOOLBAR */}
              <div className="bg-[#0C0F1E] border border-neutral-800/85 rounded-2xl p-4 md:p-5 shadow-lg space-y-4">
                {/* Top Action Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-neutral-800/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white tracking-wide">Pass Orders &amp; Delegate Dossiers</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-neutral-900 border border-neutral-800 text-neutral-300">
                          {submissions.filter(s => s.type === 'pass-order').length} orders
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">Manage VIP packages, verified payments, wristband passes, and delegate manifests</p>
                    </div>
                  </div>

                  {/* Actions Group */}
                  <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
                    <button
                      onClick={handleRefreshData}
                      disabled={isRefreshing}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-[11px] uppercase tracking-wider rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="Reload latest orders from database"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                      onClick={() => setShowImportCsvModal(true)}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-[11px] uppercase tracking-wider rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="Bulk import pass orders from CSV file"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span>Import CSV</span>
                    </button>

                    <button
                      onClick={() => {
                        const targetSubmissions = submissions.filter(s => s.type === 'pass-order');
                        exportSubmissionsCSV(targetSubmissions, 'Grenada_Festival_Pass_Orders');
                      }}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-[11px] uppercase tracking-wider rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="Download pass orders spreadsheet"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      onClick={() => {
                        setNewSubForm(prev => ({ ...prev, type: 'pass-order' }));
                        setShowAddModal(true);
                      }}
                      className="px-3.5 py-1.5 font-black text-[11px] uppercase tracking-wider text-neutral-950 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md ml-auto sm:ml-0"
                      style={{ backgroundColor: primaryColor }}
                      title="Create a new pass reservation"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>New Pass Order</span>
                    </button>
                  </div>
                </div>

                {/* Filter & Search Controls Row */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by Guest Name, Email, Order Ref, Pass Title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-0.5 rounded cursor-pointer"
                        title="Clear search query"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Dropdown & Reset */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase">Status:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent border-0 text-[11px] text-neutral-200 font-medium focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="all" className="bg-neutral-950 text-white">All Statuses</option>
                        <option value="confirmed" className="bg-neutral-950 text-white">Confirmed / Paid</option>
                        <option value="in-review" className="bg-neutral-950 text-white">In Review</option>
                        <option value="new" className="bg-neutral-950 text-white">New</option>
                        <option value="resolved" className="bg-neutral-950 text-white">Resolved</option>
                      </select>
                    </div>

                    {(searchQuery || statusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                        }}
                        className="px-2.5 py-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                        title="Reset filters"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
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
                    {/* Bulk Actions for Pass Orders */}
                    {selectedPassOrders.length > 0 && (
                      <div className="bg-[#12162E] border border-amber-500/30 p-3 px-4 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.05)]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-amber-400 font-mono">
                            {selectedPassOrders.length} pass order{selectedPassOrders.length > 1 ? 's' : ''} selected
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedPassOrders([])}
                            className="text-[10px] text-neutral-400 hover:text-white underline ml-2 cursor-pointer font-semibold"
                          >
                            Deselect All
                          </button>
                          {selectedPassOrders.length < passOrdersList.length && (
                            <button
                              type="button"
                              onClick={() => setSelectedPassOrders(passOrdersList.map(o => o.id))}
                              className="text-[10px] text-amber-400/80 hover:text-amber-300 ml-1 cursor-pointer font-semibold"
                            >
                              (Select all {passOrdersList.length})
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Mark Status:</span>
                          <button
                            onClick={() => handleBulkOrderStatusChange('resolved')}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                            title="Mark selected as Confirmed / Paid"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Confirmed
                          </button>
                          <button
                            onClick={() => handleBulkOrderStatusChange('in-review')}
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                            title="Mark selected as In Review"
                          >
                            <Clock className="w-3 h-3 text-amber-400" /> In Review
                          </button>
                          <button
                            onClick={() => handleBulkOrderStatusChange('new')}
                            className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                            title="Mark selected as New"
                          >
                            <AlertCircle className="w-3 h-3 text-sky-400" /> New
                          </button>
                          <div className="h-4 w-px bg-neutral-800 mx-1 hidden sm:block" />
                          <button
                            onClick={handleBulkExportSelectedPassOrders}
                            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-slate-200 border border-neutral-700 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                            title="Export selected pass orders to CSV"
                          >
                            <FileSpreadsheet className="w-3 h-3 text-emerald-400" /> Export CSV ({selectedPassOrders.length})
                          </button>
                          <button
                            onClick={handleBulkDeletePassOrders}
                            className="px-2.5 py-1 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-500/30 rounded text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Bulk Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Minimal Desktop Table */}
                    <div className="hidden md:block overflow-hidden bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl shadow-md">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-800/70 bg-neutral-950/50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            <th className="p-4 pl-5 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={passOrdersList.length > 0 && passOrdersList.every(o => selectedPassOrders.includes(o.id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPassOrders(prev => {
                                      const newSelections = [...prev];
                                      passOrdersList.forEach(order => {
                                        if (!newSelections.includes(order.id)) newSelections.push(order.id);
                                      });
                                      return newSelections;
                                    });
                                  } else {
                                    const filteredIds = passOrdersList.map(o => o.id);
                                    setSelectedPassOrders(prev => prev.filter(id => !filteredIds.includes(id)));
                                  }
                                }}
                                className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                                title="Select all pass orders"
                              />
                            </th>
                            <th className="p-4">Reference</th>
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
                            const isSelected = selectedPassOrders.includes(order.id);
                            return (
                              <tr 
                                key={order.id}
                                onClick={() => setSelectedOrderId(order.id)}
                                className={`transition-colors cursor-pointer group ${
                                  isSelected 
                                    ? 'bg-amber-500/10 hover:bg-amber-500/15' 
                                    : 'hover:bg-neutral-900/40'
                                }`}
                              >
                                <td className="p-4 pl-5 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setSelectedPassOrders(prev => 
                                        prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]
                                      );
                                    }}
                                    className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                                  />
                                </td>
                                <td className="p-4 font-mono font-bold text-amber-400">
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
                                <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingSubmission(order);
                                      }}
                                      className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-sky-500/30 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                      title="Edit Pass Order"
                                    >
                                      <Pencil className="w-3 h-3 text-sky-400" /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedOrderId(order.id);
                                      }}
                                      className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 font-extrabold text-[10px] uppercase tracking-wider rounded-lg border border-amber-500/20 transition-all cursor-pointer"
                                    >
                                      View Dossier
                                    </button>
                                  </div>
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
                        const isSelected = selectedPassOrders.includes(order.id);
                        return (
                          <div
                            key={order.id}
                            onClick={() => setSelectedOrderId(order.id)}
                            className={`bg-[#0C0F1E] border rounded-xl p-4 space-y-3 cursor-pointer transition-all active:scale-[0.99] ${
                              isSelected 
                                ? 'border-amber-500/50 bg-amber-500/5 shadow-md shadow-amber-500/5' 
                                : 'border-neutral-800/80 hover:border-amber-500/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setSelectedPassOrders(prev => 
                                        prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]
                                      );
                                    }}
                                    className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                                  />
                                </div>
                                <span className="text-[10px] font-black uppercase font-mono text-amber-400">
                                  {ref}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSubmission(order);
                                  }}
                                  className="px-2 py-0.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-bold text-[9px] uppercase tracking-wider rounded border border-sky-500/30 flex items-center gap-1 cursor-pointer"
                                  title="Edit Pass Order"
                                >
                                  <Pencil className="w-2.5 h-2.5 text-sky-400" /> Edit
                                </button>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono ${
                                  isConfirmed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  order.status === 'in-review' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                }`}>
                                  {isConfirmed ? 'CONFIRMED' : order.status.toUpperCase()}
                                </span>
                              </div>
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
            <AdminBrandingTab
              siteConfig={siteConfig}
              setSiteConfigState={setSiteConfigState}
              primaryColor={primaryColor}
              handleSaveConfig={handleSaveConfig}
              setSaveToast={setSaveToast}
              saveToast={saveToast}
              setMediaSelectorTarget={setMediaSelectorTarget}
            />
          )}

          {activeAdminTab === 'page-images' && (
            <AdminPageImagesTab
              siteConfig={siteConfig}
              setSiteConfigState={setSiteConfigState}
              primaryColor={primaryColor}
              handleSaveConfig={handleSaveConfig}
              setSaveToast={setSaveToast}
              saveToast={saveToast}
              setMediaSelectorTarget={setMediaSelectorTarget}
            />
          )}

          {activeAdminTab === 'analytics' && (
            <AdminAnalyticsTab
              submissions={submissions}
              events={events}
              hotels={hotels}
              testimonials={testimonials}
              primaryColor={primaryColor}
              setActiveAdminTab={setActiveAdminTab}
              festivalStartInput={festivalStartInput}
              festivalEndInput={festivalEndInput}
            />
          )}
          {/* TAB: EVENT MANAGER */}
          {activeAdminTab === 'events' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Event Management Hub</span>
                  <h2 className="text-xl font-bold text-white font-serif mt-0.5">Festival Events & Live Shows</h2>
                  <p className="text-xs text-neutral-400 font-light">Manage overall festival start & end dates and customize individual event listings.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent(null);
                      setShowAddEvent(true);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" /> Add Festival Event
                  </button>
                </div>
              </div>

              {/* DEDICATED SECTION: FESTIVAL START & END DATES */}
              <div className="bg-[#0C0F1E] border border-amber-500/30 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                      <CalendarRange className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        Festival Dates Configuration
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                          Live Sync
                        </span>
                      </h3>
                      <p className="text-xs text-neutral-400 font-light">
                        Set the festival start and end dates. Changes instantly reflect across the countdown timer, header tags, and website.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveFestivalMasterDates}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 self-start md:self-auto"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Festival Dates</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> Start Date
                    </label>
                    <input
                      type="date"
                      value={festivalStartInput}
                      onChange={(e) => setFestivalStartInput(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-neutral-500 block">Opening commencement date</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> End Date
                    </label>
                    <input
                      type="date"
                      min={festivalStartInput}
                      value={festivalEndInput}
                      onChange={(e) => setFestivalEndInput(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-neutral-500 block">Final grand finale date</span>
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-between">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Active Duration & Preview
                    </label>
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col justify-center min-h-[46px] space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-amber-300 font-bold font-mono text-xs truncate">
                          {formatEventDateRange(festivalStartInput, festivalEndInput, 'May 22 – 31, 2027')}
                        </span>
                        {(() => {
                          const dur = calculateDurationDays(festivalStartInput, festivalEndInput);
                          return (
                            <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black font-mono px-2 py-0.5 rounded shrink-0">
                              {dur === 1 ? '1 Day' : `${dur} Days`}
                            </span>
                          );
                        })()}
                      </div>
                      <span className="text-[10px] text-neutral-500 block truncate">
                        Global dates applied across hero, calendar & footer
                      </span>
                    </div>
                  </div>
                </div>
              </div>



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
                <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between flex-wrap gap-2">
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
                        {paginatedEvents.map((ev) => {
                          const duration = calculateDurationDays(ev.startDate, ev.endDate);
                          const isSingle = ev.isSingleDay !== undefined ? ev.isSingleDay : (duration <= 1);
                          return (
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
                                    <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      🏷️ {ev.category || 'Party'}
                                    </span>
                                    {duration > 1 ? (
                                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black px-1.5 py-0.5 rounded font-mono uppercase">
                                        {duration}-Day Event
                                      </span>
                                    ) : (
                                      <span className="bg-neutral-800/80 text-amber-400/80 border border-neutral-700 text-[9px] font-semibold px-1.5 py-0.5 rounded font-mono uppercase">
                                        1-Day Event
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-neutral-400 text-xs flex flex-wrap items-center gap-x-3 gap-y-1 font-light">
                                    <span className="text-amber-300/90 font-medium">📅 {formatEventDateRange(ev.startDate, ev.endDate, ev.date)}</span>
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
                          );
                        })}

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
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
                <button
                  onClick={() => {
                    setEditingGallery(null);
                    setShowAddGallery(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" /> Add Gallery Item
                </button>
              </div>

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
                    const GALLERY_ITEMS_PER_PAGE = 12;
                    const totalGalleryPages = Math.ceil(galleryItems.length / GALLERY_ITEMS_PER_PAGE) || 1;
                    const currentGalleryPage = Math.min(galleryPage, totalGalleryPages);
                    const paginatedGallery = galleryItems.slice((currentGalleryPage - 1) * GALLERY_ITEMS_PER_PAGE, currentGalleryPage * GALLERY_ITEMS_PER_PAGE);
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
                                        setShowAddGallery(true);
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
                              Showing <span className="text-white font-bold">{((currentGalleryPage - 1) * GALLERY_ITEMS_PER_PAGE) + 1}</span> to <span className="text-white font-bold">{Math.min(currentGalleryPage * GALLERY_ITEMS_PER_PAGE, galleryItems.length)}</span> of <span className="text-white font-bold">{galleryItems.length}</span> photos
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setGalleryPage(p => Math.max(1, p - 1))}
                                disabled={currentGalleryPage === 1}
                                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
                                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
                <button
                  onClick={() => {
                    setEditingPass(null);
                    setShowAddPass(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" /> Create Pass Tier
                </button>
              </div>

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
                                    setShowAddPass(true);
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
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
                <button
                  onClick={() => {
                    setEditingHotel(null);
                    setShowAddHotel(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" /> Add Partner Hotel
                </button>
              </div>

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
                                  setShowAddHotel(true);
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div className="p-5 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider font-serif">Export Submissions to Spreadsheet</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Instantly package and download a formatted `.csv` spreadsheet file with every received guest ticket request, phone, and flight details.
                    </p>
                  </div>
                  <button
                    onClick={() => exportSubmissionsCSV(submissions)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Download CSV
                  </button>
                </div>

                <div className="p-5 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <Upload className="w-7 h-7 text-sky-400" />
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider font-serif">Import Records from CSV</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Bulk upload and synchronize guest reservations, pass orders, or form submissions with automatic validation and preview.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowImportCsvModal(true)}
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Import CSV
                  </button>
                </div>

                <div className="p-5 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <RefreshCw className="w-7 h-7 text-amber-400" />
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider font-serif">Restock Demo Sample Log Database</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Clear current state logs and populate realistic sample carnival and travel VIP bookings to demonstrate admin features.
                    </p>
                  </div>
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
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-white font-serif">Operations Security Credentials</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                    Dual Passcode Enabled
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Configure Operations-level access credentials. Both Operations settings below and Owner Control Tab credentials work independently and are accepted across the system.
                </p>

                

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-neutral-400">Operations Secret URL Path</label>
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
                <button
                  onClick={() => {
                    setEditingTestimonial(null);
                    setShowAddTestimonial(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" /> Add Testimonial
                </button>
              </div>

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
                                  setShowAddTestimonial(true);
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

                    {activeAdminTab === 'owner' && (
            <OwnerControlTab
              primaryColor={primaryColor}
              onToast={(msg) => {
                setSaveToast(msg);
              }}
              triggerConfirm={triggerConfirm}
              onUserUpdated={() => {
                const refreshed = getCurrentAdminUser();
                if (refreshed) {
                  setCurrentAdmin(refreshed);
                }
              }}
            />
          )}

          {activeAdminTab === 'users' && (
            <AdminUsersTab
              primaryColor={primaryColor}
              triggerConfirm={triggerConfirm}
              onToast={(msg) => {
                setSaveToast(msg);
              }}
            />
          )}

          {activeAdminTab === 'emails' && (
            <AdminEmailSuiteTab
              primaryColor={primaryColor}
              submissions={submissions}
              onToast={(msg) => {
                setSaveToast(msg);
              }}
            />
          )}

            </>
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
                  type="button"
                  onClick={() => {
                    setEditingSubmission(selectedPassOrder);
                  }}
                  className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Edit Pass Order Details & Metadata"
                >
                  <Pencil className="w-3.5 h-3.5 text-sky-400" /> Edit Order
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewPdfSub(selectedPassOrder);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                  title="Generate & Print VIP Pass / Wristband Badge PDF"
                >
                  <Printer className="w-3.5 h-3.5" /> Print VIP Badge
                </button>

                <button
                  type="button"
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
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg font-bold cursor-pointer"
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
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800/70 space-y-1.5">
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
                  <p className="text-[11px] text-neutral-300 italic bg-neutral-900/60 p-2 rounded border border-neutral-800/70 line-clamp-2">
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
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 rounded-lg text-left text-[10px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="font-bold block text-amber-400 truncate">Pass Approval</span>
                      <span className="text-[9px] text-neutral-500 truncate block">Confirm wristbands</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyReplyTemplate('flight')}
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 rounded-lg text-left text-[10px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="font-bold block text-amber-400 truncate">Airport Shuttle</span>
                      <span className="text-[9px] text-neutral-500 truncate block">Flight transfer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyReplyTemplate('vip')}
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 rounded-lg text-left text-[10px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="font-bold block text-amber-400 truncate">VIP Cabana</span>
                      <span className="text-[9px] text-neutral-500 truncate block">Hospitality host</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyReplyTemplate('general')}
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 rounded-lg text-left text-[10px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
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
                <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800/70 space-y-2">
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
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-slate-300 rounded-xl font-bold cursor-pointer transition-colors"
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

      {/* CSV Bulk Import Modal */}
      <ImportCsvModal
        isOpen={showImportCsvModal}
        onClose={() => setShowImportCsvModal(false)}
        defaultType={activeAdminTab === 'orders' ? 'pass-order' : undefined}
        primaryColor={primaryColor}
        onSuccess={(count) => {
          loadData();
          setSaveToast(`Successfully imported and synchronized ${count} record(s) from CSV!`);
          setTimeout(() => setSaveToast(null), 3500);
        }}
      />

      {/* Edit Submission Modal */}
      {editingSubmission && (
        <EditSubmissionModal
          submission={editingSubmission}
          isOpen={!!editingSubmission}
          onClose={() => setEditingSubmission(null)}
          onSave={handleSaveEditedSubmission}
          primaryColor={primaryColor}
        />
      )}

      {/* Edit Event Pop-up Modal */}
      <EditEventModal
        isOpen={showAddEvent || editingEvent !== null}
        onClose={() => {
          setShowAddEvent(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEventModal}
        event={editingEvent}
        primaryColor={primaryColor}
        defaultStartDate={festivalStartInput}
        onOpenMediaLibrary={openMediaLibraryWithCallback}
      />

      {/* Edit Gallery Item Pop-up Modal */}
      <EditGalleryItemModal
        isOpen={showAddGallery || editingGallery !== null}
        onClose={() => {
          setShowAddGallery(false);
          setEditingGallery(null);
        }}
        onSave={handleSaveGalleryModal}
        item={editingGallery}
        primaryColor={primaryColor}
        onOpenMediaLibrary={openMediaLibraryWithCallback}
      />

      {/* Edit Pass Package Pop-up Modal */}
      <EditPassModal
        isOpen={showAddPass || editingPass !== null}
        onClose={() => {
          setShowAddPass(false);
          setEditingPass(null);
        }}
        onSave={handleSavePassModal}
        pass={editingPass}
        primaryColor={primaryColor}
      />

      {/* Edit Hotel Pop-up Modal */}
      <EditHotelModal
        isOpen={showAddHotel || editingHotel !== null}
        onClose={() => {
          setShowAddHotel(false);
          setEditingHotel(null);
        }}
        onSave={handleSaveHotelModal}
        hotel={editingHotel}
        primaryColor={primaryColor}
        onOpenMediaLibrary={openMediaLibraryWithCallback}
      />

      {/* Edit Testimonial Pop-up Modal */}
      <EditTestimonialModal
        isOpen={showAddTestimonial || editingTestimonial !== null}
        onClose={() => {
          setShowAddTestimonial(false);
          setEditingTestimonial(null);
        }}
        onSave={handleSaveTestimonialModal}
        testimonial={editingTestimonial}
        primaryColor={primaryColor}
        onOpenMediaLibrary={openMediaLibraryWithCallback}
      />

    </div>
  );
};
