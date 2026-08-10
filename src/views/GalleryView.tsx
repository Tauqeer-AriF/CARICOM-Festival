import React, { useState } from 'react';
import { GalleryItem, ActiveTab } from '../types';
import { GalleryModal } from '../components/GalleryModal';
import { FESTIVAL_IMAGES } from '../data/festivalData';
import { 
  Sparkles, 
  MapPin, 
  Heart, 
  ZoomIn, 
  Camera, 
  Ticket, 
  Palmtree,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GalleryViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  galleryItems?: GalleryItem[];
}

type CategoryFilter = 'All' | 'VIP Beach Fete' | 'Mellowland Village' | 'Soca & Concerts' | 'Island Excursions' | 'Luxury & Resort';

// Custom animation presets for a premium aesthetic
const fadeInUp = {
  hidden: { opacity: 0, y: 35 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

export const GalleryView: React.FC<GalleryViewProps> = ({ setActiveTab, galleryItems = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const activeItems = galleryItems;

  const categories: CategoryFilter[] = [
    'All',
    'VIP Beach Fete',
    'Mellowland Village',
    'Soca & Concerts',
    'Island Excursions',
    'Luxury & Resort'
  ];

  const filteredItems = selectedCategory === 'All' 
    ? activeItems 
    : activeItems.filter((item) => item.category === selectedCategory);

  const currentPhoto = selectedPhotoIndex !== null ? filteredItems[selectedPhotoIndex] : null;

  const handleNext = () => {
    if (selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % filteredItems.length);
    }
  };

  const handlePrev = () => {
    if (selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* View Header */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="text-center space-y-4 max-w-3xl mx-auto pt-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
          <Palmtree className="w-3.5 h-3.5 text-amber-400" />
          <span>Exclusive Festival Gallery</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold font-serif text-white tracking-tight">
          Visual Memories of <span className="text-amber-400">Paradise</span>
        </h1>

        <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-light">
          Explore previous festival highlights, VIP beach fetes, river tubing adventures, and the luxury atmosphere awaiting you at Grenada CARICOM 2027.
        </p>
      </motion.div>

      {/* Category Filter Pills */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="flex items-center justify-center flex-wrap gap-2 pt-2"
      >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                isActive 
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/30 border border-amber-300/40 scale-105' 
                  : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              {cat === 'All' ? 'All Highlights' : cat}
            </button>
          );
        })}
      </motion.div>

      {/* Masonry Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-neutral-900/40 rounded-3xl border border-neutral-800">
          <Camera className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Photos Found</h3>
          <p className="text-sm text-slate-400 font-light max-w-sm mx-auto">There are no photos matching this category or stored in our database.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedCategory}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                variants={fadeInUp}
                onClick={() => setSelectedPhotoIndex(index)}
                className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-amber-500/10"
              >
                {/* Image Container */}
                <div className={`w-full ${item.aspectRatio} relative overflow-hidden bg-neutral-950`}>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FESTIVAL_IMAGES.mellowlandGarden;
                    }}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />

                  {/* Hover Dark Overlay with Zoom Indicator */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-between">
                    
                    {/* Category Badge Top Right */}
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 bg-amber-500/80 backdrop-blur-md text-neutral-950 text-[10px] font-extrabold uppercase tracking-wider rounded-lg shadow-md">
                        {item.category}
                      </span>

                      <div className="w-8 h-8 rounded-full bg-amber-500/90 text-neutral-950 flex items-center justify-center shadow-lg">
                        <ZoomIn className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Bottom Overlay Text */}
                    <div className="space-y-1 text-left">
                      <h4 className="text-sm font-bold text-white font-serif line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-amber-300/90 flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{item.location}</span>
                      </p>
                    </div>

                  </div>
                </div>

                {/* Static Card Footer Info */}
                <div className="p-3 bg-neutral-950/90 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 font-medium">
                  <span className="truncate pr-2 font-serif text-neutral-200">{item.title}</span>
                  <div className="flex items-center gap-1 text-amber-400 shrink-0">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span className="font-mono text-[10px] font-bold">{item.likesCount}</span>
                  </div>
                </div>

              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Bottom CTA Banner */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-amber-600/10 border border-amber-500/30 text-center space-y-4 max-w-4xl mx-auto shadow-2xl"
      >
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
        <h3 className="text-2xl font-bold font-serif text-white">
          Ready to Create Your Own Unforgettable Memories in Grenada?
        </h3>
        <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto leading-relaxed">
          Reserve your 10-day Grenada CARICOM 2027 VIP Wristband today for guaranteed access to all official fetes, Mellowland river tubing, and luxury resort events.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setActiveTab('shop')}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <Ticket className="w-4 h-4 fill-neutral-950" />
            <span>View Passes & VIP Tiers</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 border border-neutral-700"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Explore 10-Day Event Itinerary</span>
          </button>
        </div>
      </motion.div>

      {/* Zoom / Lightbox Modal */}
      <GalleryModal
        item={currentPhoto}
        isOpen={selectedPhotoIndex !== null}
        onClose={() => setSelectedPhotoIndex(null)}
        onNext={handleNext}
        onPrev={handlePrev}
        onNavigateShop={() => setActiveTab('shop')}
      />

    </div>
  );
};
