export type ActiveTab = 
  | 'home'
  | 'events'
  | 'gallery'
  | 'about-grenada'
  | 'about-mellowland'
  | 'transportation'
  | 'hotels'
  | 'testimonials'
  | 'shop'
  | 'register'
  | 'travel-insurance'
  | 'contact'
  | 'terms'
  | 'admin'
  | 'not-found';

export interface SubmissionReply {
  id: string;
  message: string;
  sentAt: string;
  sentBy: string;
  method?: 'email' | 'mailto' | 'in-app';
  attachment?: {
    name: string;
    type: string;
    size?: string;
    pdfDataUrl?: string;
  };
}

export interface FormSubmissionItem {
  id: string;
  type: 'contact' | 'flight-registration' | 'pass-order' | 'transport-request' | 'newsletter';
  name: string;
  email: string;
  phone?: string;
  topicOrPass?: string;
  messageOrDetails?: string;
  status: 'new' | 'in-review' | 'resolved';
  submittedAt: string;
  amountGBP?: number;
  extraDetails?: Record<string, string>;
  replies?: SubmissionReply[];
}

export interface HeroImageConfig {
  url: string;
  alt?: string;
}

export interface PageImagesConfig {
  // Home Page
  homeWhiteGala?: string;
  homeLondonVibes?: string;
  homeBeachDJ?: string;
  homeRiverTubing?: string;
  
  // Events Page
  eventsBanner?: string;
  
  // Gallery Page
  galleryBanner?: string;
  
  // About Grenada Page
  aboutGrenadaHero?: string;
  aboutGrenadaEco?: string;
  aboutGrenadaUnderwater?: string;
  aboutGrenadaWaterfall?: string;
  aboutGrenadaSpiceMarket?: string;
  
  // About Mellowland Page
  aboutMellowlandHero?: string;
  aboutMellowlandRiver?: string;
  aboutMellowlandGarden?: string;
  
  // Hotels Page
  hotelsBanner?: string;
  
  // Passes / Shop Page
  passesBanner?: string;
  
  // Transportation Page
  transportationBanner?: string;
  
  // Testimonials Page
  testimonialsBanner?: string;
  
  // Contact Page
  contactBanner?: string;
  
  // Travel Insurance Page
  travelInsuranceBanner?: string;
  
  // Terms Page
  termsBanner?: string;

  // Custom key-value pairs
  customPageImages?: Record<string, string>;
}

export interface SiteConfig {
  appName?: string;
  appSubtitle?: string;
  appLogoUrl?: string;
  appFaviconUrl?: string;
  appLogoIcon?: 'Palmtree' | 'Sparkles' | 'Crown' | 'Sun' | 'Flame' | 'Music' | 'Globe' | 'Shield' | 'Compass';
  appTagline?: string;
  appYearBadge?: string;
  socialLinks: {
    instagram: string;
    tiktok: string;
    facebook: string;
    whatsapp: string;
    youtube: string;
    twitter: string;
  };
  branding: {
    primaryColor: string; // hex or tailwind name
    secondaryColor?: string; // custom secondary color hex
    bgTone: 'dark-onyx' | 'deep-midnight' | 'luxury-charcoal' | 'caribbean-night';
    headingFont: 'Poppins' | 'Playfair Display' | 'Montserrat' | 'Plus Jakarta Sans' | 'Syne' | 'Cinzel' | 'Outfit' | 'Cormorant Garamond' | 'Space Grotesk' | 'Bricolage Grotesque';
    bodyFont: 'Inter' | 'Poppins' | 'Plus Jakarta Sans' | 'Outfit' | 'Roboto' | 'Space Grotesk' | 'DM Sans' | 'Work Sans';
    buttonStyle?: 'sharp' | 'rounded' | 'pill';
    cardStyle?: 'flat' | 'bordered' | 'glassy' | 'glow';
    glowIntensity?: 'low' | 'medium' | 'high';
    glassOpacity?: number;
  };
  banner: {
    enabled: boolean;
    text: string;
    bgColor: string;
  };
  hero?: {
    images: HeroImageConfig[];
    displayCount: number;
    autoplayInterval?: number; // rotation speed in seconds
    videoUrl?: string;
  };
  footer?: {
    logoUrl?: string;
    text?: string;
  };
  pageImages?: PageImagesConfig;
  festivalDates?: {
    startDate: string; // '2027-05-22'
    endDate: string;   // '2027-05-31'
    startTime?: string;// '18:00'
    label?: string;    // 'MAY 22 - 31, 2027'
    rangeText?: string;// 'May 22 – 31, 2027'
    locationLabel?: string; // 'SPICE ISLE, GRENADA'
  };
  adminPath?: string;
  adminPassword?: string;
  ownerAdminPath?: string;
  ownerAdminPassword?: string;
  isKilled?: boolean;
  killedReason?: string;
  killedAt?: string;
  contactEmail?: string;
  contactPhone?: string;
  updatedAt?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'VIP Beach Fete' | 'Mellowland Village' | 'Soca & Concerts' | 'Island Excursions' | 'Luxury & Resort';
  location: string;
  year: string;
  imageUrl: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  uploadedAt?: string;
  aspectRatio: 'aspect-square' | 'aspect-[3/4]' | 'aspect-[4/3]' | 'aspect-[9/16]' | 'aspect-[16/9]';
  caption: string;
  likesCount: number;
  photographer?: string;
}

export interface EventItem {
  id: string;
  dayNumber: number;
  date: string;
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD' (same as startDate for one-day events)
  isSingleDay?: boolean; // true if event is a single day
  title: string;
  category: 'Music' | 'Cultural' | 'Adventure' | 'Gala' | 'Party' | string;
  location: string;
  time: string;
  description: string;
  djLineup?: string[];
  dressCode?: string;
  wristbandRequired: boolean;
  highlightImage: string;
  genres?: string[];
  ticketPrice?: number;
  isFeatured?: boolean;
}

export interface HotelItem {
  id: string;
  name: string;
  stars: number;
  tagline: string;
  description: string;
  location: string;
  distanceToMellowland: string;
  features: string[];
  image: string;
  isRecommended?: boolean;
  bookingUrl?: string;
}

export interface PassItem {
  id: string;
  title: string;
  subtitle: string;
  priceGBP: number;
  priceUSD: number;
  features: string[];
  popular?: boolean;
  wristbandType: string;
  includedEvents: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  location: string;
  role: string;
  quote: string;
  rating: number;
  avatar: string;
}

export interface FlightRegistration {
  id: string;
  fullName: string;
  email: string;
  phoneWhatsApp: string;
  airline: string;
  flightNumber: string;
  arrivalDate: string;
  arrivalTime: string;
  departureDate: string;
  departureTime: string;
  chosenHotel: string;
  specialRequests?: string;
  registeredAt: string;
}

export interface CartItem {
  pass: PassItem;
  quantity: number;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string; // Base64 data URL
  originalSize: number; // in bytes
  compressedSize: number; // in bytes
  type: string; // mime type
  uploadedAt: string;
}

export type AdminRole = 
  | 'Owner'
  | 'Admin' 
  | 'Executive Lead' 
  | 'Event Coordinator' 
  | 'Ticketing & Passes' 
  | 'Concierge Lead' 
  | 'Curator' 
  | 'Logistics Lead';

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  passcode?: string;
  name: string;
  role: AdminRole;
  email?: string;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  notes?: string;
}

export type EmailDeliveryStatus = 'delivered' | 'dispatched' | 'queued' | 'failed';

export type EmailCategory = 
  | 'order_confirmation' 
  | 'welcome_registration' 
  | 'enquiry_reply' 
  | 'vendor_application' 
  | 'vip_invitation' 
  | 'broadcast_campaign' 
  | 'test_dispatch' 
  | 'system_alert';

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  category: EmailCategory;
  contentHtml: string;
  contentText?: string;
  status: EmailDeliveryStatus;
  dispatchedAt: string;
  senderName: string;
  senderEmail: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  errorDetails?: string;
  openedAt?: string;
}

export interface EmailTemplate {
  id: string;
  category: EmailCategory;
  name: string;
  description: string;
  subject: string;
  headline: string;
  introText: string;
  bodyText: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote: string;
  updatedAt: string;
}

export type EmailEngineMode = 'resend' | 'sendgrid' | 'mailchimp' | 'smtp';

export interface EmailSettings {
  engineMode: EmailEngineMode;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  organisationAddress: string;
  festivalWebsiteUrl: string;
  // Optional External SaaS accounts
  resendApiKey?: string;
  sendgridApiKey?: string;
  mailchimpApiKey?: string;
  // Optional Custom SMTP gateway
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  // Automation triggers
  autoSendOrderConfirmation: boolean;
  autoSendWelcomeRegistration: boolean;
  autoSendEnquiryReply: boolean;
  bccSecretariatOnOrders: boolean;
  secretariatBccEmail?: string;
}



