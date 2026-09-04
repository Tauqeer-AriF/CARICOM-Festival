import React, { useState } from 'react';
import { 
  Image as ImageIcon, Sparkles, Upload, Save, Check, RefreshCw, Eye, 
  Trash2, Globe, Layers, Compass, ExternalLink, HelpCircle, FolderOpen, RotateCcw
} from 'lucide-react';
import { FESTIVAL_IMAGES } from '../data/festivalData';

interface AdminPageImagesTabProps {
  siteConfig: any;
  setSiteConfigState: React.Dispatch<React.SetStateAction<any>>;
  primaryColor: string;
  handleSaveConfig: () => void;
  setSaveToast: React.Dispatch<React.SetStateAction<string | null>>;
  saveToast: string | null;
  setMediaSelectorTarget: (target: string | null) => void;
}

export const AdminPageImagesTab: React.FC<AdminPageImagesTabProps> = ({
  siteConfig,
  setSiteConfigState,
  primaryColor,
  handleSaveConfig,
  setSaveToast,
  saveToast,
  setMediaSelectorTarget
}) => {
  const [pageImagesSubTab, setPageImagesSubTab] = useState<'home' | 'about-grenada' | 'about-mellowland' | 'banners'>('home');

  return (
    <div className="space-y-6">
      {/* Main Sub-Navigation Bar matching Email Suite */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-neutral-800 pb-1.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'home', label: 'Home Page', count: 4, icon: '🏠' },
          { id: 'about-grenada', label: 'About Grenada', count: 3, icon: '🌴' },
          { id: 'about-mellowland', label: 'About Mellowland', count: 3, icon: '🌊' },
          { id: 'banners', label: 'Header Banners', count: 5, icon: 'ℹ️' }
        ].map((tab) => {
          const isActive = pageImagesSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPageImagesSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                isActive
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
              style={isActive ? { borderBottom: `2px solid ${primaryColor}` } : undefined}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-neutral-900 text-neutral-300 border border-neutral-750">
                {tab.count}
              </span>
            </button>
          );
        })}
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
                    <p className="text-xs text-neutral-400">Customise nature photos and attraction cards on the Grenada island guide page.</p>
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
  );
};