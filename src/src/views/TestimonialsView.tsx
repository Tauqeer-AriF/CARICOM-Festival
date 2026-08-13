import React from 'react';
import { ActiveTab, TestimonialItem } from '../types';
import { getSiteConfig, getPageImage } from '../services/submissionService';
import { motion } from 'motion/react';
import { Star, Quote, Sparkles, Heart } from 'lucide-react';

interface TestimonialsViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  testimonials: TestimonialItem[];
}

export const TestimonialsView: React.FC<TestimonialsViewProps> = ({ setActiveTab, testimonials }) => {
  const siteConfig = getSiteConfig();
  const bannerImg = getPageImage('testimonialsBanner', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80');

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Hero Banner */}
      <div data-no-invert className="relative rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl min-h-[300px] sm:min-h-[380px] flex items-center p-6 sm:p-12">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono tracking-wider uppercase inline-flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" /> Attendee Stories
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif tracking-tight leading-tight">
            Guest <span className="text-gold-gradient">Testimonials & Reviews</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed">
            Hear directly from festival revelers, UK DJs, and Grenadian locals who experienced the euphoria of our past island celebrations.
          </p>
        </div>
      </div>

      {/* Reviews Grid */}
      {testimonials && testimonials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((rev, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/30 p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <Quote className="w-8 h-8 text-amber-500/40" />
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-neutral-300 font-light italic leading-relaxed">
                  "{rev.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-neutral-800">
                <img src={rev.avatar} alt={rev.name} className="w-10 h-10 rounded-full object-cover border border-amber-500/40" />
                <div>
                  <h4 className="text-xs font-bold text-white font-serif">{rev.name}</h4>
                  <p className="text-[10px] text-amber-400/90 font-mono">{rev.role} • {rev.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-neutral-900/50 border border-neutral-800 rounded-2xl space-y-3">
          <Heart className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Testimonials Yet</h3>
          <p className="text-xs text-neutral-400">Check back soon for stories and reviews from our festival attendees.</p>
        </div>
      )}
    </div>
  );
};
