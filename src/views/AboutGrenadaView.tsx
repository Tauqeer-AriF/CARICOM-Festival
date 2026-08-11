import React from 'react';
import { ActiveTab } from '../types';
import { getPageImage } from '../services/submissionService';
import { GrenadaWeatherWidget } from '../components/GrenadaWeatherWidget';
import { motion } from 'motion/react';
import { 
  Palmtree, 
  Sparkles, 
  Sun, 
  Waves, 
  Compass, 
  ArrowRight
} from 'lucide-react';

interface AboutGrenadaViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const AboutGrenadaView: React.FC<AboutGrenadaViewProps> = ({ setActiveTab }) => {
  const heroImg = getPageImage('aboutGrenadaHero', 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80');
  const ecoImg = getPageImage('aboutGrenadaEco', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80');
  const underwaterImg = getPageImage('aboutGrenadaUnderwater', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80');
  const spiceImg = getPageImage('aboutGrenadaSpiceMarket', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80');

  const islandHighlights = [
    {
      title: "The Isle of Spice",
      description: "Famous worldwide for nutmeg, cinnamon, and organic dark chocolate, filling the island air with rich aromatic sweetness.",
      icon: Sparkles,
      image: spiceImg
    },
    {
      title: "World-Famous Grand Anse Beach",
      description: "2 miles of pristine white sand and crystal-clear turquoise waters, perfect for beachfront fetes and sunset relaxation.",
      icon: Waves,
      image: heroImg
    },
    {
      title: "Molinere Underwater Sculpture Park",
      description: "The world's first underwater sculpture park, an ecological masterpiece ideal for snorkeling and diving.",
      icon: Compass,
      image: underwaterImg
    },
    {
      title: "Cascading Rainforest Waterfalls",
      description: "Lush tropical rainforests with cascading natural waterfalls like Annandale and Concord, fed by natural mountain springs.",
      icon: Palmtree,
      image: ecoImg
    }
  ];

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Hero Banner */}
      <div data-no-invert className="relative rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl min-h-[300px] sm:min-h-[380px] flex items-center p-6 sm:p-12">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-transparent" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono tracking-wider uppercase inline-flex items-center gap-1.5">
            <Palmtree className="w-3.5 h-3.5" /> Welcome to Pure Grenada
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-serif tracking-tight leading-tight">
            Discover the <span className="text-gold-gradient">Spice Isle</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed">
            Grenada is a lush, vibrant paradise in the southern Caribbean known for warm island hospitality, tranquil turquoise waters, and rich cultural traditions.
          </p>
        </div>
      </div>

      {/* Weather & Quick Facts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-xl font-bold text-white font-serif flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-400" />
            <span>Tropical Island Climate</span>
          </h3>
          <p className="text-neutral-300 text-xs sm:text-sm font-light leading-relaxed">
            In May, Grenada enjoys warm, tropical sunshine with average temperatures ranging between 27°C and 30°C (80°F - 86°F), accompanied by soothing ocean trade breezes — ideal conditions for outdoor beach fetes and river adventure.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-500 font-mono block">Avg Temp</span>
              <span className="text-sm font-bold text-amber-400">29°C / 84°F</span>
            </div>
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-500 font-mono block">Water Temp</span>
              <span className="text-sm font-bold text-emerald-400">27°C / 80°F</span>
            </div>
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-500 font-mono block">Currency</span>
              <span className="text-sm font-bold text-white">XCD (ECD) / USD</span>
            </div>
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-500 font-mono block">Language</span>
              <span className="text-sm font-bold text-white">English</span>
            </div>
          </div>
        </div>

        {/* Live Weather Widget Card */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-xs font-bold uppercase text-amber-400 tracking-wider block">Live Weather Feed</span>
          <GrenadaWeatherWidget />
        </div>
      </div>

      {/* Island Highlights Grid */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif">
            Why You’ll Fall in Love with Grenada
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-light">
            An unbeatable destination combining luxury island relaxation, vibrant soca culture, and unspoiled natural wonder.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {islandHighlights.map((highlight, index) => {
            const IconComp = highlight.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/30 rounded-2xl overflow-hidden shadow-xl flex flex-col sm:flex-row group"
              >
                <div className="sm:w-2/5 relative h-48 sm:h-auto overflow-hidden">
                  <img 
                    src={highlight.image} 
                    alt={highlight.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-neutral-950/20" />
                </div>
                <div className="sm:w-3/5 p-5 space-y-2 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-amber-400">
                    <IconComp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">Highlight</span>
                  </div>
                  <h3 className="text-base font-bold text-white font-serif">{highlight.title}</h3>
                  <p className="text-neutral-400 text-xs leading-relaxed font-light">
                    {highlight.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-amber-500/20 via-neutral-900 to-emerald-500/20 border border-amber-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-serif">
          Ready for Your 2027 Spice Isle Getaway?
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto font-light leading-relaxed">
          Secure your festival passes now and get ready to experience Grenada CARICOM Festival 2027 in pure style!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setActiveTab('events')}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Explore 10-Day Events</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Buy Festival Passes
          </button>
        </div>
      </div>
    </div>
  );
};
