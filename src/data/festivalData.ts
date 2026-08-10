import { EventItem, HotelItem, PassItem, TestimonialItem } from '../types';

export const FESTIVAL_DATE_STRING = '2027-05-13T18:00:00';

export const FESTIVAL_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80', // Beach DJ Showcase
  festivalHero: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80', // Spice Isle Festival Crowd
  riverTubing: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=1200&q=80', // Rainforest rapids adventure
  whiteGala: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80', // Premium VIP White Gala
  ecoParadise: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80', // Beautiful Grenada coast
  gemini1: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80', // Vibrant beach fete
  gemini2: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80', // Midnight concert fete
  gemini3: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // Sunset cruise fete
  gemini4: 'https://images.unsplash.com/photo-1501183007986-d0d080b147f9?auto=format&fit=crop&w=1200&q=80', // Rainforest island rave
  royaltonResort: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
  underwaterPark: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
  waterfall: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
  spiceMarket: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80',
  mellowlandGarden: 'https://images.unsplash.com/photo-1541976844346-f18aeac57b06?auto=format&fit=crop&w=1200&q=80', // Lush organic tropical garden path
  
  // Day-specific, 100% unique premium high-quality image mappings
  day1_welcome: 'https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&w=1200&q=80', // Unique Beach resort sunset welcome lime
  day2_beach_fete: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80', // Beach Fete Vibrance
  day3_river_tubing: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=1200&q=80', // River Tubing Adventure
  day4_karaoke: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80', // Concert Stage / Karaoke fete
  day5_white_gala: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80', // White Gala Sunset Pavilion
  day6_culture: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80', // Cultural masquerade/street fete
  day7_underwater: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80', // Underwater sculpture park
  day8_rainforest: 'https://images.unsplash.com/photo-1501183007986-d0d080b147f9?auto=format&fit=crop&w=1200&q=80', // Rainforest Island Rave
  day9_road_parade: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80', // Carnival road march
  day10_brunch: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80', // Luxurious tropical brunch
  
  // Gallery-specific, 100% unique premium high-quality image mappings
  gallery1: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80', // Resort pool deck under beautiful sky
  gallery2: 'https://images.unsplash.com/photo-1530731141654-5961b695817a?auto=format&fit=crop&w=1200&q=80', // Forest river rapids group kayaking
  gallery3: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80', // Elegant sunset soirée lighting
  gallery4: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80', // Vibrant beachfront dance party
  gallery5: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80', // Massive laser-lit DJ party
  gallery6: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1200&q=80', // Deep sea diving/snorkeling sunbeams
  gallery7: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80', // Luxury beach resort pool area
  gallery8: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80', // Waterfall cascading in rainforest
  gallery9: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1200&q=80', // Tropical fruit & spice market stall
  gallery10: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80', // Botanical lush organic garden
  gallery11: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // Sunset Cruise Horizon
  gallery12: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80' // Neon jungle night lounge
};

export const FESTIVAL_EVENTS: EventItem[] = [
  {
    id: 'day-1',
    dayNumber: 1,
    date: 'May 13, 2027',
    title: 'Spice Isle Touchdown & VIP Welcome Lime',
    category: 'Party',
    location: 'Royalton Grenada Beachfront Lounge',
    time: '18:00 - 23:00',
    description: 'Arrive in Grenada and receive your official Mellows welcome! Meet your island representatives, collect your festival wristbands, and enjoy coconut welcome cocktails while London & Grenadian DJs set the mood.',
    djLineup: ['DJ Slick (London)', 'DJ Spice (Grenada)', 'Selecta Quad'],
    dressCode: 'Resort Chic & Tropical Colours',
    wristbandRequired: true,
    highlightImage: FESTIVAL_IMAGES.day1_welcome,
    genres: ['Soca', 'Afro', 'Reggae']
  },
  {
    id: 'day-2',
    dayNumber: 2,
    date: 'May 14, 2027',
    title: 'London Meets Spice Isle Beach Fete',
    category: 'Music',
    location: 'Grand Anse Beach Club',
    time: '14:00 - 22:00',
    description: 'Bringing London’s finest sound system energy straight to the turquoise waters of Grand Anse. Non-stop dancing, barefoot in the sand with Caribbean rum punch flowing.',
    djLineup: ['DJ Likkle (UK)', 'Sound System International', 'DJ Ice (Grenada)'],
    dressCode: 'Swimwear & Beach Glam',
    wristbandRequired: true,
    highlightImage: FESTIVAL_IMAGES.day2_beach_fete,
    genres: ['Soca', 'Jungle', 'R&B']
  },
  {
    id: 'day-3',
    dayNumber: 3,
    date: 'May 15, 2027',
    title: 'Mellowland River Tubing & Farm-to-Table Garden Lime',
    category: 'Adventure',
    location: 'Mellows Entertainment Complex',
    time: '10:00 - 18:00',
    description: 'Experience the thrill of navigating Grenada’s scenic rapids! 45-minute guided river tubing sessions with safety gear provided. Afterwards, indulge in organic food straight from Mellows garden.',
    djLineup: ['DJ Roots UK', 'Mellows Resident DJs'],
    dressCode: 'Water Gear / Swimwear & Water Shoes',
    wristbandRequired: true,
    highlightImage: FESTIVAL_IMAGES.day3_river_tubing,
    genres: ['Reggae', 'Soul', 'Soca']
  },
  {
    id: 'day-4',
    dayNumber: 4,
    date: 'May 16, 2027',
    title: 'London vs Grenada Big Karaoke Clash',
    category: 'Music',
    location: 'Mellowland Outdoor Stage',
    time: '19:00 - 01:00',
    description: 'A hilarious and energetic friendly showdown comparing London classics and UK garage/grime to Grenadian Soca and Reggae anthems. Grab the mic and represent your city!',
    djLineup: ['MC Hammer (London)', 'DJ Jab Grenada', 'Guest Host UK'],
    dressCode: 'Casual & Retro UK / Island Merch',
    wristbandRequired: true,
    highlightImage: FESTIVAL_IMAGES.day4_karaoke,
    genres: ['Soul', 'R&B', 'Reggae', 'Soca']
  },
  {
    id: 'day-5',
    dayNumber: 5,
    date: 'May 17, 2027',
    title: 'The Flagship White Gala Sunset Party',
    category: 'Gala',
    location: 'Royalton Oceanfront Pavilion',
    time: '17:00 - 02:00',
    description: 'The absolute crown jewel of the festival! Dressed impeccably in all-white attire, celebrate as the sun dips below the horizon. Top-tier production, VIP cocktail service, and world-class DJs.',
    djLineup: ['London All-Star DJ Crew', 'Grenada Carnival Kings', 'Live Saxophone & Percussion'],
    dressCode: 'STRICTLY ALL-WHITE ELEGANT ATTIRE',
    wristbandRequired: true,
    highlightImage: FESTIVAL_IMAGES.day5_white_gala,
    genres: ['Soca', 'Afro', 'Soul', 'R&B']
  },
  {
    id: 'day-6',
    dayNumber: 6,
    date: 'May 18, 2027',
    title: 'CARICOM Sister Islands Cultural Showcase',
    category: 'Cultural',
    location: 'St. George’s Waterfront Cultural Park',
    time: '11:00 - 19:00',
    description: 'Celebrating our shared history, diverse Caribbean traditions, food stalls from across the CARICOM sister islands, spice market tours, and folklore performances.',
    djLineup: ['Cultural Drum Ensemble', 'CARICOM Heritage Sound'],
    dressCode: 'Cultural Print / Tropical Vibrant',
    wristbandRequired: false,
    highlightImage: FESTIVAL_IMAGES.day6_culture,
    genres: ['Reggae', 'Soul', 'Cultural Drumming']
  },
  {
    id: 'day-7',
    dayNumber: 7,
    date: 'May 19, 2027',
    title: 'Underwater Sculpture Park & Catamaran Sunset Cruise',
    category: 'Adventure',
    location: 'Molinière Bay & Spice Isle Marine',
    time: '12:00 - 19:00',
    description: 'Explore the world’s first underwater sculpture park and reef dives. Sail along the coast on a luxury catamaran with floating bar, live Soca DJ, and snorkeling.',
    djLineup: ['DJ Oceanic', 'UK Boat Party Specialists'],
    dressCode: 'Swimwear & Sunglasses',
    wristbandRequired: true,
    highlightImage: FESTIVAL_IMAGES.day7_underwater,
    genres: ['Soca', 'Afro', 'Reggae']
  },
  {
    id: 'day-8',
    dayNumber: 8,
    date: 'May 20, 2027',
    title: 'Jungle & Afrobeat Rainforest Rave',
    category: 'Music',
    location: 'Annandale Rainforest Estate',
    time: '20:00 - 03:00',
    description: 'Immerse in pure bass under the illuminated rainforest canopy. Deep Jungle beats, UK garage, and cutting-edge Afrobeat rhythms echo through the tropical forest.',
    djLineup: ['London Underground Jungle DJ Crew', 'Afrobeat Selectors', 'Drums of Grenada'],
    dressCode: 'Neon & Rave Tropical',
    wristbandRequired: true,
    highlightImage: FESTIVAL_IMAGES.day8_rainforest,
    genres: ['Jungle', 'Afro', 'Soca']
  },
  {
    id: 'day-9',
    dayNumber: 9,
    date: 'May 21, 2027',
    title: 'CARICOM Carnival Road Parade & Jouvert Energy',
    category: 'Cultural',
    location: 'St. George’s Parade Route to Mellowland',
    time: '08:00 - 20:00',
    description: 'The ultimate climax! Jump on the road with colourful mas costumes, paint, powder, and high-energy music trucks bringing London and Grenadian revelers together in unity.',
    djLineup: ['All Festival DJs Combined', 'Live Soca Artists'],
    dressCode: 'Festival T-Shirt / Costume / Jouvert Wear',
    wristbandRequired: true,
    highlightImage: FESTIVAL_IMAGES.day9_road_parade,
    genres: ['Soca', 'Afro', 'Reggae']
  },
  {
    id: 'day-10',
    dayNumber: 10,
    date: 'May 22, 2027',
    title: 'Farewell Spice Island Brunch & Thank-You Lyme',
    category: 'Party',
    location: 'Mellowland Garden & River Bank',
    time: '11:00 - 17:00',
    description: 'Wrap up your 10-day dream vacation with a heartwarming farewell brunch. Organic farm dishes, group photo ops, live acoustic soul, and souvenir wristband exchange.',
    djLineup: ['Chill Acoustic Trio', 'DJ Slow Wine'],
    dressCode: 'Casual Island Chic',
    wristbandRequired: true,
    highlightImage: FESTIVAL_IMAGES.day10_brunch,
    genres: ['Soul', 'Reggae', 'R&B']
  }
];

export const FESTIVAL_HOTELS: HotelItem[] = [
  {
    id: 'royalton-grenada',
    name: 'Royalton Grenada Resort & Spa',
    stars: 5,
    tagline: 'Official Festival Recommended Resort - Pure Luxury & Zero Stress',
    description: 'Nestled on two pristine white-sand beaches along Magazine Beach and Tamarind Bay. The Royalton is our highly recommended hub for festival guests with direct access to Mellows representatives at reception.',
    location: 'Magazine Beach, St. George’s',
    distanceToMellowland: '15 mins transport',
    features: [
      'All-Inclusive Luxury Dining & Premium Drinks',
      'Dedicated Mellows Event Desk at Reception',
      'Direct Airport Pick-up Shuttle Included',
      'Infinity Pool Overlooking Turquoise Bay',
      'Exclusive White Gala Access Point'
    ],
    image: FESTIVAL_IMAGES.royaltonResort,
    isRecommended: true,
    bookingUrl: 'https://www.royaltonresorts.com/resorts/grenada'
  },
  {
    id: 'radisson-grenada',
    name: 'Radisson Grenada Beach Resort',
    stars: 4,
    tagline: 'Prime Grand Anse Beachfront Location',
    description: 'Located in the heart of Grand Anse Beach, offering 20 acres of lush tropical gardens and easy walking distance to beachfront fete spots.',
    location: 'Grand Anse Beach, St. George’s',
    distanceToMellowland: '20 mins transport',
    features: [
      '300-ft Lagoon Pool with Waterfalls',
      'Direct Sand Access to Grand Anse Beach',
      'Multiple On-site Restaurants & Bars',
      'Daily Shuttle Connections'
    ],
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'coyaba-beach-resort',
    name: 'Coyaba Beach Resort',
    stars: 4,
    tagline: 'Authentic Caribbean Charm & Warmth',
    description: 'A cozy and charming oceanfront property featuring traditional Arawak-inspired architecture and lush gardens on Grand Anse.',
    location: 'Grand Anse Beach',
    distanceToMellowland: '18 mins transport',
    features: [
      'Oceanview Dining',
      'Water Sports Center',
      'Quiet Relaxing Ambiance',
      'Mellows Representative Pickup Point'
    ],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'silversands-grenada',
    name: 'Silversands Grenada',
    stars: 5,
    tagline: 'Ultra-Modern Architectural Luxury',
    description: 'Boasting the longest infinity pool in the Caribbean (100 meters), Silversands delivers sleek design and sophisticated oceanfront suites.',
    location: 'Grand Anse Beach',
    distanceToMellowland: '22 mins transport',
    features: [
      '100m Infinity Pool',
      'World-class Spa',
      'Private Butler Service Option',
      'Fine Dining Restaurants'
    ],
    image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80'
  }
];

export const FESTIVAL_PASSES: PassItem[] = [
  {
    id: 'pass-10-day-vip',
    title: '10-Day VIP All-Access Pass',
    subtitle: 'The Complete Grenada CARICOM Experience',
    priceGBP: 349,
    priceUSD: 449,
    popular: true,
    wristbandType: 'Gold VIP Holographic Wristband',
    includedEvents: 'Access to ALL 10 Days of events, White Gala VIP Lounge, Mellowland River Tubing Session with lunch, Airport Transfers & Hotel Reception Wristband Service.',
    features: [
      'Access to all 10 Days & Night Fetes',
      'Includes White Gala VIP Reserved Zone',
      'Complimentary River Tubing Session at Mellowland',
      'Organic Farm Lunch & Welcome Rum Punch',
      'Confidential Airport Pick-up & Drop-off Shuttle',
      'Exclusive Festival Merch Pack & Lanyard'
    ]
  },
  {
    id: 'pass-white-gala',
    title: 'White Gala & Weekend Pass',
    subtitle: 'The Flagship Party Experience',
    priceGBP: 169,
    priceUSD: 219,
    wristbandType: 'Silver Gala Wristband',
    includedEvents: 'White Gala Sunset Party, London vs Grenada Karaoke Clash, and Weekend Beach Fete.',
    features: [
      'Entry to Flagship White Gala Sunset Party',
      'London vs Grenada Karaoke Clash Ticket',
      'Beach Fete Access',
      'Complimentary Welcome Cocktail'
    ]
  },
  {
    id: 'pass-mellowland-tubing',
    title: 'Mellowland Adventure & Party Pass',
    subtitle: 'River Tubing + Farm Lunch + River Lyme',
    priceGBP: 89,
    priceUSD: 115,
    wristbandType: 'Green Adventure Wristband',
    includedEvents: '45-Min Supervised River Tubing, Safety Gear (Helmet, Vest, Tube), Garden Lunch, River Lyme Party.',
    features: [
      '45-Min Supervised River Tubing Session',
      'Professional River Guides & Full Safety Gear',
      'Organic Garden Lunch at Mellows Restaurant',
      'Access to Outdoor River Lyme Party'
    ]
  }
];

export const FESTIVAL_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'test-1',
    name: 'Marcus & Sarah Sterling',
    location: 'London, UK (Brixton)',
    role: 'Carnival Enthusiasts',
    quote: 'Bringing London DJs to Grenada was absolute magic! The White Gala sunset fete was hands-down the best party we have ever attended in our lives. Mellowland river tubing was an amazing thrill!',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'test-2',
    name: 'DJ Kev UK',
    location: 'London / Trinidad',
    role: 'Guest DJ',
    quote: 'The synergy between London sound system culture and Spice Isle energy is unmatched. The crowds were on fire every single night for 10 straight days!',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'test-3',
    name: 'Janelle Mitchell',
    location: 'Brooklyn, NY',
    role: 'CARICOM Visitor',
    quote: 'The airport transfer team from Mellows made everything seamless from the moment we touched down. Staying at the Royalton with the Mellows rep on site made us feel like royalty.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80'
  }
];
