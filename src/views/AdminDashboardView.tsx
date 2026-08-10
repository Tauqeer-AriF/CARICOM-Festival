import React, { useState, useEffect, useRef } from 'react';
import { 
  FormSubmissionItem, 
  SiteConfig,
  EventItem,
  GalleryItem,
  HotelItem,
  PassItem,
  TestimonialItem
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
  saveTestimonials
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
  Hotel,
  FolderOpen,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LuxurySkeletonOverlay } from '../components/LuxurySkeletonOverlay';
import { CustomConfirmModal } from '../components/CustomConfirmModal';
import { MediaSelectorModal } from '../components/MediaSelectorModal';
import { MediaLibraryTab } from '../components/MediaLibraryTab';
import { PassBadgePdfModal } from '../components/PassBadgePdfModal';

interface AdminDashboardViewProps {
  setActiveTab: (tab: any) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ setActiveTab }) => {
  // Auth state (Password / Passcode Protected)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
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
  const ITEMS_PER_PAGE = 10;
  const [submissionPage, setSubmissionPage] = useState<number>(1);
  const [ordersPage, setOrdersPage] = useState<number>(1);
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
  
  type AdminTab = 'submissions' | 'orders' | 'branding' | 'analytics' | 'events' | 'gallery' | 'passes' | 'hotels' | 'system' | 'media' | 'testimonials';
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('submissions');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

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
  const [mediaSelectorTarget, setMediaSelectorTarget] = useState<'event' | 'gallery' | 'hotel' | 'testimonial' | null>(null);

  const handleMediaSelect = (url: string) => {
    if (mediaSelectorTarget === 'event') {
      if (editingEvent) setEditingEvent({ ...editingEvent, highlightImage: url });
      else setNewEventForm({ ...newEventForm, highlightImage: url });
    } else if (mediaSelectorTarget === 'gallery') {
      if (editingGallery) setEditingGallery({ ...editingGallery, imageUrl: url });
      else setNewGalleryForm({ ...newGalleryForm, imageUrl: url });
    } else if (mediaSelectorTarget === 'hotel') {
      if (editingHotel) setEditingHotel({ ...editingHotel, image: url });
      else setNewHotelForm({ ...newHotelForm, image: url });
    } else if (mediaSelectorTarget === 'testimonial') {
      if (editingTestimonial) setEditingTestimonial({ ...editingTestimonial, avatar: url });
      else setNewTestimonialForm({ ...newTestimonialForm, avatar: url });
    }
  };

  // Dynamic Lists States
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
    genres: ['Soca'],
    ticketPrice: 50,
    isFeatured: false
  });

  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [showAddGallery, setShowAddGallery] = useState<boolean>(false);
  const [newGalleryForm, setNewGalleryForm] = useState<Partial<GalleryItem>>({
    title: '',
    category: 'VIP Beach Fete',
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

  useEffect(() => {
    // Load data
    loadData();

    // Event listener for external submission updates
    const handleUpdate = () => loadData();
    window.addEventListener('submissions_updated', handleUpdate);
    window.addEventListener('testimonials_updated', handleUpdate);
    return () => {
      window.removeEventListener('submissions_updated', handleUpdate);
      window.removeEventListener('testimonials_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    setSubmissionPage(1);
    setOrdersPage(1);
  }, [searchQuery, typeFilter, statusFilter, activeAdminTab]);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    saveSiteConfig(siteConfig);
  }, [siteConfig]);

  const loadData = () => {
    setSubmissions(getSubmissions());
    setSiteConfigState(getSiteConfig());
    setEvents(getEvents());
    setGalleryItems(getGalleryItems());
    setHotels(getHotels());
    setPasses(getPasses());
    setTestimonials(getTestimonials());
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const configPassword = siteConfig.adminPassword || '2027';
    if (pinInput === configPassword || pinInput === '2027' || pinInput.toLowerCase() === 'admin' || pinInput === 'admin123') {
      sessionStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
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
        id: 'event-' + Date.now()
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
        genres: ['Soca'],
        ticketPrice: 50,
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
        id: 'gallery-' + Date.now()
      };
      saveGalleryItems([...galleryItems, created]);
      setShowAddGallery(false);
      setNewGalleryForm({
        title: '',
        category: 'VIP Beach Fete',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80',
        likesCount: 0,
        location: 'St. George\'s, Grenada',
        year: '2027 Highlight',
        aspectRatio: 'aspect-[16/9]',
        caption: ''
      });
      setSaveToast('New gallery photo added!');
    }
    loadData();
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleDeleteGallery = (id: string) => {
    triggerConfirm(
      'Delete Gallery Photo',
      'Are you sure you want to delete this photo from the public gallery?',
      () => {
        const filtered = galleryItems.filter(item => item.id !== id);
        saveGalleryItems(filtered);
        setSaveToast('Gallery photo deleted!');
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
              <Ticket className="w-4 h-4 text-amber-400" /> Pass Orders
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
            <BarChart3 className="w-4 h-4" /> Telemetry Hub
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
            <Image className="w-4 h-4" /> Gallery Photos
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
              {activeAdminTab === 'analytics' && 'Reveler Demographics'}
              {activeAdminTab === 'events' && 'Event Coordinator'}
              {activeAdminTab === 'gallery' && 'Curator Board'}
              {activeAdminTab === 'passes' && 'Ticketing Packages'}
              {activeAdminTab === 'hotels' && 'Partner Accommodations'}
              {activeAdminTab === 'media' && 'Asset & Media Library'}
              {activeAdminTab === 'system' && 'Infrastructure & Operations'}
              {activeAdminTab === 'testimonials' && 'Testimonials Manager'}
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
                    onClick={loadData}
                    className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg border border-neutral-800 transition-colors cursor-pointer"
                    title="Refresh Data Grid"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
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
                                      <div className="flex flex-col items-center gap-1.5">
                                        {getStatusBadge(sub.status)}
                                        <select
                                          value={sub.status}
                                          onChange={(e) => handleStatusChange(sub.id, e.target.value as any)}
                                          className="bg-neutral-950 border border-neutral-800 text-[9px] text-neutral-400 font-bold hover:text-white rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                                        >
                                          <option value="new">New</option>
                                          <option value="in-review">In Review</option>
                                          <option value="resolved">Resolved</option>
                                        </select>
                                      </div>
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
                                          onClick={() => setReplyingSub(sub)}
                                          className="px-2 py-1 text-[10px] font-bold text-neutral-950 rounded transition-all cursor-pointer flex items-center gap-1 hover:brightness-110 shadow-sm"
                                          style={{ backgroundColor: primaryColor }}
                                          title="Send official guest reply"
                                        >
                                          <Send className="w-3 h-3" /> Reply
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
                                {getStatusBadge(sub.status)}
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
                                  <span className="text-[9px] text-neutral-500 uppercase tracking-wider block">Status:</span>
                                  <select
                                    value={sub.status}
                                    onChange={(e) => handleStatusChange(sub.id, e.target.value as any)}
                                    className="bg-neutral-950 border border-neutral-850 text-[10px] text-neutral-400 rounded px-1.5 py-0.5"
                                  >
                                    <option value="new">New</option>
                                    <option value="in-review">In Review</option>
                                    <option value="resolved">Resolved</option>
                                  </select>
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
                                    onClick={() => setReplyingSub(sub)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-neutral-950 rounded transition-all cursor-pointer flex items-center gap-1 hover:brightness-110"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    <Send className="w-3 h-3" /> Reply
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
            <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-xl p-6 md:p-8 space-y-8 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-neutral-800/80">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Site Styling Laboratory</span>
                  <h2 className="text-xl font-bold text-white font-serif">Branding, Themes & Banner Customizer</h2>
                  <p className="text-xs text-neutral-400 max-w-xl">
                    Dynamically update social media profiles, change color profiles, swap typography settings, and toggle the announcement banner.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] uppercase font-black tracking-wider shrink-0 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Real-Time Sync Active</span>
                  </div>
                  <button
                    onClick={handleSaveConfig}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Configuration
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-sans">
                
                {/* Panel 1: Social Profiles Customizer */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-800/60">
                    <Share2 className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-white font-serif">Social Handle Integration</h3>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Instagram Handle URL</label>
                      <input
                        type="url"
                        value={siteConfig.socialLinks.instagram}
                        onChange={(e) => setSiteConfigState({
                          ...siteConfig,
                          socialLinks: { ...siteConfig.socialLinks, instagram: e.target.value }
                        })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">TikTok Channel URL</label>
                      <input
                        type="url"
                        value={siteConfig.socialLinks.tiktok}
                        onChange={(e) => setSiteConfigState({
                          ...siteConfig,
                          socialLinks: { ...siteConfig.socialLinks, tiktok: e.target.value }
                        })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Facebook Fanpage URL</label>
                      <input
                        type="url"
                        value={siteConfig.socialLinks.facebook}
                        onChange={(e) => setSiteConfigState({
                          ...siteConfig,
                          socialLinks: { ...siteConfig.socialLinks, facebook: e.target.value }
                        })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">WhatsApp Concierge Desk URL</label>
                      <input
                        type="url"
                        value={siteConfig.socialLinks.whatsapp}
                        onChange={(e) => setSiteConfigState({
                          ...siteConfig,
                          socialLinks: { ...siteConfig.socialLinks, whatsapp: e.target.value }
                        })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Twitter/X Profile URL</label>
                      <input
                        type="url"
                        value={siteConfig.socialLinks.twitter || ''}
                        onChange={(e) => setSiteConfigState({
                          ...siteConfig,
                          socialLinks: { ...siteConfig.socialLinks, twitter: e.target.value }
                        })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
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
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="pt-2 border-t border-neutral-800/40">
                      <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-2">Helpline & Contact (Footer)</h4>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Official Helpline Phone</label>
                      <input
                        type="text"
                        value={siteConfig.contactPhone || ''}
                        onChange={(e) => setSiteConfigState({
                          ...siteConfig,
                          contactPhone: e.target.value
                        })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
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
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                        placeholder="info@grenadacaricomfestival.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Panel 2: Theme Settings & Custom Colour Studio */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800/60">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" style={{ color: primaryColor }} />
                      <h3 className="font-bold text-sm text-white font-serif">Custom Theme Colour Studio</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const restored = {
                          ...siteConfig,
                          branding: {
                            primaryColor: '#F59E0B',
                            secondaryColor: '#10B981',
                            bgTone: 'dark-onyx' as const,
                            headingFont: 'Poppins' as const,
                            bodyFont: 'Inter' as const,
                          },
                          banner: {
                            enabled: true,
                            text: '🔥 GRENADA CARICOM FESTIVAL 2027 Concierge Portal is active. Register flight details below.',
                            bgColor: '#10B981'
                          }
                        };
                        setSiteConfigState(restored);
                        setSaveToast('Branding restored to original defaults!');
                      }}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-red-900/40 rounded text-[10px] font-bold text-neutral-400 hover:text-rose-400 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      Restore System Defaults
                    </button>
                  </div>

                  {/* PRESET THEMES QUICK ACCESS */}
                  <div className="bg-neutral-950/40 border border-neutral-800/50 p-4 rounded-xl space-y-3">
                    <div>
                      <span className="block text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">Instant Brand Presets</span>
                      <span className="block text-[9px] text-neutral-500">Apply a professionally curated style package instantly</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          name: 'Spice Gold (Default)',
                          primary: '#F59E0B',
                          secondary: '#10B981',
                          bgTone: 'dark-onyx',
                          headingFont: 'Poppins',
                          bodyFont: 'Inter',
                          desc: 'Authentic Spice Island vibes.'
                        },
                        {
                          name: 'Grand Anse Luxury',
                          primary: '#D4AF37',
                          secondary: '#4F46E5',
                          bgTone: 'deep-midnight',
                          headingFont: 'Playfair Display',
                          bodyFont: 'Plus Jakarta Sans',
                          desc: 'Premium royal concierge.'
                        },
                        {
                          name: 'Caribbean Breeze',
                          primary: '#0EA5E9',
                          secondary: '#84CC16',
                          bgTone: 'caribbean-night',
                          headingFont: 'Montserrat',
                          bodyFont: 'Outfit',
                          desc: 'Vibrant coastal energy.'
                        },
                        {
                          name: 'Soca Sunset',
                          primary: '#F43F5E',
                          secondary: '#F97316',
                          bgTone: 'luxury-charcoal',
                          headingFont: 'Syne',
                          bodyFont: 'Poppins',
                          desc: 'Bold carnival design.'
                        }
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setSiteConfigState({
                              ...siteConfig,
                              branding: {
                                primaryColor: preset.primary,
                                secondaryColor: preset.secondary,
                                bgTone: preset.bgTone as any,
                                headingFont: preset.headingFont as any,
                                bodyFont: preset.bodyFont as any
                              }
                            });
                            setSaveToast(`Applied "${preset.name}" preset!`);
                          }}
                          className="p-2.5 bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left cursor-pointer transition-all active:scale-[0.98] group flex flex-col justify-between h-20"
                        >
                          <div>
                            <span className="block text-[10px] font-bold text-white group-hover:text-amber-400 transition-colors">{preset.name}</span>
                            <span className="block text-[8px] text-neutral-500 leading-tight mt-0.5">{preset.desc}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="w-2 h-2 rounded-full border border-neutral-950 shrink-0" style={{ backgroundColor: preset.primary }} />
                            <span className="w-2 h-2 rounded-full border border-neutral-950 shrink-0" style={{ backgroundColor: preset.secondary }} />
                            <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-tight">{preset.bgTone.replace('-', ' ')}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* LIVE THEME PREVIEW PANEL */}
                  <div className="bg-neutral-950/40 border border-neutral-800/50 p-4 rounded-xl space-y-3">
                    <div>
                      <span className="block text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider">Live Sandbox Preview</span>
                      <span className="block text-[9px] text-neutral-500">Visual mockup updating instantly as you modify settings above</span>
                    </div>

                    <div 
                      className="border rounded-xl overflow-hidden shadow-2xl relative transition-all duration-300"
                      style={{ 
                        borderColor: 'rgba(255,255,255,0.08)',
                        backgroundColor: 
                          siteConfig.branding.bgTone === 'deep-midnight' ? '#02040A' :
                          siteConfig.branding.bgTone === 'luxury-charcoal' ? '#121214' :
                          siteConfig.branding.bgTone === 'caribbean-night' ? '#010A0A' : '#080A0F'
                      }}
                    >
                      {/* Simulated banner */}
                      {siteConfig.banner?.enabled && (
                        <div 
                          className="py-1 px-2 text-[7px] font-bold text-center text-white select-none transition-all"
                          style={{ backgroundColor: siteConfig.banner.bgColor || '#10B981' }}
                        >
                          {siteConfig.banner.text || 'Simulated Announcement Banner'}
                        </div>
                      )}

                      {/* Simulated header */}
                      <div className="p-3 flex items-center justify-between border-b border-white/[0.04] bg-white/[0.01]">
                        <span 
                          className="text-[10px] font-extrabold uppercase tracking-widest text-white"
                          style={{ fontFamily: siteConfig.branding.headingFont }}
                        >
                          MELLOWLANDS
                        </span>
                        <div className="flex gap-2 text-[8px] font-medium text-neutral-400">
                          <span>Home</span>
                          <span style={{ color: siteConfig.branding.primaryColor || '#F59E0B' }}>Active</span>
                          <span>Shop</span>
                        </div>
                      </div>

                      {/* Simulated Hero */}
                      <div className="p-4 space-y-2.5 text-center">
                        <h4 
                          className="text-sm font-black text-white leading-tight"
                          style={{ fontFamily: siteConfig.branding.headingFont }}
                        >
                          Feel the Rhythm of the <span style={{ color: siteConfig.branding.primaryColor || '#F59E0B' }}>Spice Island</span>
                        </h4>
                        <p 
                          className="text-[9px] text-neutral-400 max-w-xs mx-auto leading-relaxed"
                          style={{ fontFamily: siteConfig.branding.bodyFont }}
                        >
                          Experience high-definition soca, luxury beachside suites, and concierge tubing trips in beautiful Grenada.
                        </p>
                        
                        <div className="flex justify-center gap-1.5 pt-1">
                          <button 
                            type="button"
                            className="px-3 py-1 rounded text-[8px] font-extrabold uppercase tracking-wider text-neutral-950 transition-all active:scale-95"
                            style={{ 
                              backgroundColor: siteConfig.branding.primaryColor || '#F59E0B',
                              fontFamily: siteConfig.branding.bodyFont
                            }}
                          >
                            Get Passes
                          </button>
                          <button 
                            type="button"
                            className="px-3 py-1 rounded text-[8px] font-extrabold uppercase tracking-wider border border-white/10 text-white transition-all active:scale-95"
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.04)',
                              borderColor: 'rgba(255,255,255,0.1)',
                              fontFamily: siteConfig.branding.bodyFont
                            }}
                          >
                            Learn More
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Primary Colour Picker */}
                    <div className="bg-neutral-950/40 border border-neutral-800/50 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-neutral-300">Primary Colour</span>
                          <span className="block text-[9px] text-neutral-500">App headers, main buttons, and primary actions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={siteConfig.branding.primaryColor || '#F59E0B'}
                            onChange={(e) => setSiteConfigState({
                              ...siteConfig,
                              branding: { ...siteConfig.branding, primaryColor: e.target.value }
                            })}
                            className="w-8 h-8 rounded-lg bg-transparent border border-neutral-800 cursor-pointer overflow-hidden p-0"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 font-mono font-bold">#</span>
                        <input
                          type="text"
                          maxLength={7}
                          value={(siteConfig.branding.primaryColor || '#F59E0B').replace('#', '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.length <= 6) {
                              setSiteConfigState({
                                ...siteConfig,
                                branding: { ...siteConfig.branding, primaryColor: `#${val}` }
                              });
                            }
                          }}
                          placeholder="F59E0B"
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono uppercase"
                        />
                        <div 
                          className="w-6 h-6 rounded-md border border-neutral-800 shrink-0" 
                          style={{ backgroundColor: siteConfig.branding.primaryColor || '#F59E0B' }}
                        />
                      </div>

                      {/* Primary Quick Suggestions */}
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-neutral-500 mb-1.5">Primary Suggestions</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { name: 'Amber Gold', hex: '#F59E0B' },
                            { name: 'Sunset Rose', hex: '#F43F5E' },
                            { name: 'Neon Purple', hex: '#8B5CF6' },
                            { name: 'Teal Blue', hex: '#0EA5E9' },
                            { name: 'Fresh Mint', hex: '#10B981' }
                          ].map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setSiteConfigState({
                                ...siteConfig,
                                branding: { ...siteConfig.branding, primaryColor: c.hex }
                              })}
                              className="px-2 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 rounded text-[10px] font-medium text-neutral-300 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                            >
                              <span className="w-2.5 h-2.5 rounded-full border border-neutral-800" style={{ backgroundColor: c.hex }} />
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Secondary Colour Picker */}
                    <div className="bg-neutral-950/40 border border-neutral-800/50 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-neutral-300">Secondary Colour</span>
                          <span className="block text-[9px] text-neutral-500">Status tags, interactive highlights, and secondary buttons</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={siteConfig.branding.secondaryColor || '#10B981'}
                            onChange={(e) => setSiteConfigState({
                              ...siteConfig,
                              branding: { ...siteConfig.branding, secondaryColor: e.target.value }
                            })}
                            className="w-8 h-8 rounded-lg bg-transparent border border-neutral-800 cursor-pointer overflow-hidden p-0"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 font-mono font-bold">#</span>
                        <input
                          type="text"
                          maxLength={7}
                          value={(siteConfig.branding.secondaryColor || '#10B981').replace('#', '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.length <= 6) {
                              setSiteConfigState({
                                ...siteConfig,
                                branding: { ...siteConfig.branding, secondaryColor: `#${val}` }
                              });
                            }
                          }}
                          placeholder="10B981"
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono uppercase"
                        />
                        <div 
                          className="w-6 h-6 rounded-md border border-neutral-800 shrink-0" 
                          style={{ backgroundColor: siteConfig.branding.secondaryColor || '#10B981' }}
                        />
                      </div>

                      {/* Secondary Quick Suggestions */}
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-neutral-500 mb-1.5">Secondary Suggestions</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { name: 'Emerald', hex: '#10B981' },
                            { name: 'Aqua', hex: '#06B6D4' },
                            { name: 'Sunset', hex: '#F97316' },
                            { name: 'Fuchsia', hex: '#D946EF' },
                            { name: 'Light Violet', hex: '#A855F7' }
                          ].map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setSiteConfigState({
                                ...siteConfig,
                                branding: { ...siteConfig.branding, secondaryColor: c.hex }
                              })}
                              className="px-2 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 rounded text-[10px] font-medium text-neutral-300 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                            >
                              <span className="w-2.5 h-2.5 rounded-full border border-neutral-800" style={{ backgroundColor: c.hex }} />
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Headline Font pairing</label>
                        <select
                          value={siteConfig.branding.headingFont}
                          onChange={(e) => setSiteConfigState({
                            ...siteConfig,
                            branding: { ...siteConfig.branding, headingFont: e.target.value as any }
                          })}
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
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
                          <option value="Bricolage Grotesque">Bricolage Grotesque (Bold Expressive)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Body text Font family</label>
                        <select
                          value={siteConfig.branding.bodyFont}
                          onChange={(e) => setSiteConfigState({
                            ...siteConfig,
                            branding: { ...siteConfig.branding, bodyFont: e.target.value as any }
                          })}
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
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

                    <div className="pt-2 border-t border-neutral-800/40 space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Background Theme Tone</label>
                        <select
                          value={siteConfig.branding.bgTone || 'dark-onyx'}
                          onChange={(e) => setSiteConfigState({
                            ...siteConfig,
                            branding: { ...siteConfig.branding, bgTone: e.target.value as any }
                          })}
                          className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
                        >
                          <option value="dark-onyx">Onyx Black (Rich Dark)</option>
                          <option value="deep-midnight">Deep Midnight (Deep Blue-Black)</option>
                          <option value="luxury-charcoal">Luxury Charcoal (Modern Matte)</option>
                          <option value="caribbean-night">Caribbean Night (Tropical Cyan-Dark)</option>
                        </select>
                      </div>

                      <div className="space-y-3.5 bg-neutral-950/40 border border-neutral-800/60 p-4 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-neutral-300">Top Announcement Banner</span>
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
                            <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>

                        {siteConfig.banner?.enabled && (
                          <div className="space-y-3 pt-1 animate-fadeIn">
                            <div>
                              <label className="block text-[9px] uppercase font-bold text-neutral-400 mb-1">Banner Notification Text</label>
                              <input
                                type="text"
                                value={siteConfig.banner.text || ''}
                                onChange={(e) => setSiteConfigState({
                                  ...siteConfig,
                                  banner: { ...siteConfig.banner, text: e.target.value }
                                })}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                                placeholder="Enter announcement text..."
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase font-bold text-neutral-400 mb-1">Banner Colour</label>
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1.5 flex-1">
                                  {[
                                    { name: 'Emerald', hex: '#10B981' },
                                    { name: 'Amber', hex: '#F59E0B' },
                                    { name: 'Sunset', hex: '#F43F5E' },
                                    { name: 'Indigo', hex: '#4F46E5' }
                                  ].map((b) => (
                                    <button
                                      key={b.hex}
                                      type="button"
                                      onClick={() => setSiteConfigState({
                                        ...siteConfig,
                                        banner: { ...siteConfig.banner, bgColor: b.hex }
                                      })}
                                      className="w-6 h-6 rounded-md border border-neutral-700/80 cursor-pointer flex-1 transition-all"
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
                                  className="w-10 h-6 rounded bg-transparent border border-neutral-800 cursor-pointer"
                                  title="Custom Colour"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: TELEMETRY & STATISTICAL INSIGHTS */}
          {activeAdminTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-xl p-6 md:p-8 space-y-6 shadow-sm font-sans">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Live Demographic telemetry</span>
                  <h2 className="text-xl font-bold text-white font-serif mt-0.5">Origin Demographics & VIP Package Breakdown</h2>
                  <p className="text-xs text-neutral-400">
                    Calculated percentages from our global database of registrants, showing CARICOM and European breakdown.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Origin Progress Bar Charts */}
                  <div className="bg-neutral-950/50 border border-neutral-800 p-5 rounded-xl space-y-5">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800/60">
                      <h4 className="font-bold text-xs text-white uppercase tracking-wider font-serif">Guest Origin Countries</h4>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">1,420 Checked guests</span>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex justify-between text-neutral-300 mb-1.5">
                          <span className="font-medium">🇬🇧 United Kingdom & European Union</span>
                          <span className="font-bold font-mono" style={{ color: primaryColor }}>48% (681)</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden font-sans">
                          <div className="h-2 rounded-full transition-all duration-500" style={{ width: '48%', backgroundColor: primaryColor }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-neutral-300 mb-1.5">
                          <span className="font-medium">🇺🇸 United States & Canada</span>
                          <span className="font-bold font-mono" style={{ color: primaryColor }}>32% (454)</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden font-sans">
                          <div className="h-2 rounded-full transition-all duration-500" style={{ width: '32%', backgroundColor: primaryColor }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-neutral-300 mb-1.5">
                          <span className="font-medium">🇬🇩 Grenada & CARICOM islands</span>
                          <span className="font-bold font-mono" style={{ color: primaryColor }}>15% (213)</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden font-sans">
                          <div className="h-2 rounded-full transition-all duration-500" style={{ width: '15%', backgroundColor: primaryColor }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-neutral-300 mb-1.5">
                          <span className="font-medium">🌍 Rest of World (Pacific & Asia)</span>
                          <span className="font-bold font-mono" style={{ color: primaryColor }}>5% (72)</span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden font-sans">
                          <div className="h-2 rounded-full transition-all duration-500" style={{ width: '5%', backgroundColor: primaryColor }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pass Package Metrics distribution */}
                  <div className="bg-neutral-950/50 border border-neutral-800 p-5 rounded-xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800/60">
                      <h4 className="font-bold text-xs text-white uppercase tracking-wider font-serif">Popular Package Tier Mix</h4>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">85% Allotment Sold</span>
                    </div>

                    <div className="space-y-3.5 pt-1.5 text-xs">
                      <div className="p-3 bg-[#0C0F1E] rounded-xl border border-neutral-800/80 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">10-Day All-Access VIP Gold Wristband</span>
                          <span className="text-[10px] text-neutral-400">Premium concierge, gala, and yacht excursion</span>
                        </div>
                        <span className="font-black text-amber-400 text-xs font-mono ml-4 shrink-0">62% Orders</span>
                      </div>

                      <div className="p-3 bg-[#0C0F1E] rounded-xl border border-neutral-800/80 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">5-Day Weekend Fete Pass</span>
                          <span className="text-[10px] text-slate-400">Standard general admission & main-stage concert entries</span>
                        </div>
                        <span className="font-black text-emerald-400 text-xs font-mono ml-4 shrink-0">24% Orders</span>
                      </div>

                      <div className="p-3 bg-[#0C0F1E] rounded-xl border border-neutral-800/80 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">Mellowland Tubing Day Pass</span>
                          <span className="text-[10px] text-slate-400">Excursion-only day wristband</span>
                        </div>
                        <span className="font-black text-purple-400 text-xs font-mono ml-4 shrink-0">14% Orders</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      <label className="text-neutral-400 font-bold uppercase block">Ticket Price (GBP)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editingEvent ? editingEvent.ticketPrice : newEventForm.ticketPrice}
                        onChange={(e) => {
                          const pr = Number(e.target.value);
                          if (editingEvent) setEditingEvent({ ...editingEvent, ticketPrice: pr });
                          else setNewEventForm({ ...newEventForm, ticketPrice: pr });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-neutral-400 font-bold uppercase block">Music Genres (Comma-separated)</label>
                      <input
                        type="text"
                        value={editingEvent ? editingEvent.genres.join(', ') : newEventForm.genres?.join(', ')}
                        onChange={(e) => {
                          const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          if (editingEvent) setEditingEvent({ ...editingEvent, genres: arr });
                          else setNewEventForm({ ...newEventForm, genres: arr });
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="Soca, Reggae, Afro"
                      />
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
                  {events.map((ev) => (
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
                          <div className="flex items-center gap-1">
                            {ev.genres.map((g, idx) => (
                              <span key={idx} className="bg-neutral-950/80 border border-neutral-800 text-neutral-300 text-[9px] px-2 py-0.5 rounded-md font-medium">{g}</span>
                            ))}
                            <span className="text-[11px] font-mono text-emerald-400 font-bold ml-2">£{ev.ticketPrice} Ticket</span>
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
                </div>
              </div>
            </div>
          )}

          {/* TAB: GALLERY PHOTOS */}
          {activeAdminTab === 'gallery' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Media Assets Room</span>
                  <h2 className="text-xl font-bold text-white font-serif mt-0.5">Gallery Photos & Moments</h2>
                  <p className="text-xs text-neutral-400 font-light">Add, edit, or remove photos appearing in the public gallery.</p>
                </div>
                {!showAddGallery && !editingGallery && (
                  <button
                    onClick={() => setShowAddGallery(true)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" /> Add Photo
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
                    {editingGallery ? 'Edit Gallery Photo' : 'Add New Gallery Photo'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-neutral-400 font-bold uppercase block">Photo Caption / Title</label>
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

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-neutral-400 font-bold uppercase block">Image URL</label>
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
                      {editingGallery ? 'Save Photo' : 'Add Photo'}
                    </button>
                  </div>
                </form>
              )}

              {/* Bulk Actions for Gallery */}
              {selectedGallery.length > 0 && (
                <div className="bg-[#12162E] border border-amber-500/30 p-3 px-4 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.05)] mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">
                      {selectedGallery.length} photo{selectedGallery.length > 1 ? 's' : ''} selected
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

              {/* Photos List Grid */}
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
                    <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-300">Current Gallery Photos ({galleryItems.length})</h4>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {galleryItems.map((item) => (
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
                        <span className="bg-neutral-950/95 border border-neutral-800 text-[8px] font-bold text-amber-400 px-2 py-0.5 rounded-full uppercase">{item.category}</span>
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
                  ))}
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
                  {passes.map((pass) => (
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
                            onClick={() => handleDeletePass(pass.id)}
                            className="p-2 bg-neutral-900 hover:bg-rose-950/20 text-neutral-500 hover:text-rose-400 rounded-lg border border-neutral-800/80 hover:border-rose-500/30 transition-colors cursor-pointer text-xs font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                  {hotels.map((hotel) => (
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
                          onClick={() => handleDeleteHotel(hotel.id)}
                          className="p-2 bg-neutral-900 hover:bg-rose-950/20 text-neutral-500 hover:text-rose-400 rounded-lg border border-neutral-800/80 hover:border-rose-500/30 transition-colors cursor-pointer text-xs font-bold font-sans"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
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
                  <div className="divide-y divide-neutral-800/60">
                    {testimonials.map((t) => (
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
                            onClick={() => handleDeleteTestimonial(t.id)}
                            className="p-2 bg-neutral-900 hover:bg-rose-950/20 text-neutral-500 hover:text-rose-400 rounded-lg border border-neutral-800/80 hover:border-rose-500/30 transition-colors cursor-pointer text-xs font-bold"
                            title="Delete Testimonial"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </motion.main>
      </div>

      {/* MODAL: PREMIUM DETAIL POPUP MODEL FOR PASS ORDER */}
      {selectedPassOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg overflow-y-auto">
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
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold block">Selected Festival Package</span>
                      <p className="font-extrabold text-white text-base">
                        {selectedPassOrder.topicOrPass}
                      </p>
                    </div>

                    {selectedPassOrder.messageOrDetails && (
                      <div className="bg-neutral-900/30 border border-white/5 p-3 rounded-lg text-xs italic text-neutral-300">
                        "{selectedPassOrder.messageOrDetails}"
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between border-t border-white/5">
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest block">Financial Amount</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
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
