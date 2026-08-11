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
  };
  pageImages?: PageImagesConfig;
  adminPath?: string;
  adminPassword?: string;
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
  aspectRatio: 'aspect-square' | 'aspect-[3/4]' | 'aspect-[4/3]' | 'aspect-[9/16]' | 'aspect-[16/9]';
  caption: string;
  likesCount: number;
  photographer?: string;
}

export interface EventItem {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  category: 'Music' | 'Cultural' | 'Adventure' | 'Gala' | 'Party';
  location: string;
  time: string;
  description: string;
  djLineup: string[];
  dressCode?: string;
  wristbandRequired: boolean;
  highlightImage: string;
  genres: string[];
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

