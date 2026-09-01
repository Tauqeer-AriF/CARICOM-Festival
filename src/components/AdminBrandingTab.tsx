import React, { useState } from 'react';
import { 
  Sparkles, Sliders, Palette, Image as ImageIcon, Layout, Globe, Share2, Settings, 
  Eye, Check, Save, Upload, RotateCcw, Monitor, Smartphone, Type, Layers, 
  HelpCircle, ChevronRight, Wand2, ShieldCheck, Sun, Moon, Maximize2, Move,
  Compass, Flame, Plus, Trash2, Edit3, Lock, ExternalLink, FolderOpen,
  Crown, Music, Shield, Palmtree, Clock, ChevronUp, ChevronDown, Phone, Settings as SettingsIcon, RefreshCw
} from 'lucide-react';
import { saveSiteConfig, uploadFileToServer, addMediaItem } from '../services/submissionService';
import { MediaItem } from '../types';
import { FESTIVAL_IMAGES } from '../data/festivalData';

interface AdminBrandingTabProps {
  siteConfig: any;
  setSiteConfigState: React.Dispatch<React.SetStateAction<any>>;
  primaryColor: string;
  handleSaveConfig: () => void;
  setSaveToast: React.Dispatch<React.SetStateAction<string | null>>;
  saveToast: string | null;
  setMediaSelectorTarget: (target: string | null) => void;
}

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
        
        let mimeType = 'image/jpeg';
        if (file.type === 'image/png' && file.size < 200 * 1024) {
          mimeType = 'image/png';
        }
        const compressedUrl = canvas.toDataURL(mimeType, quality);
        
        const stringLength = compressedUrl.length - `data:${mimeType};base64,`.length;
        const sizeInBytes = Math.round(stringLength * 3 / 4);

        resolve({ compressedUrl, compressedSize: sizeInBytes });
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const AdminBrandingTab: React.FC<AdminBrandingTabProps> = ({
  siteConfig,
  setSiteConfigState,
  primaryColor,
  handleSaveConfig,
  setSaveToast,
  saveToast,
  setMediaSelectorTarget
}) => {
  const [customizerSubTab, setCustomizerSubTab] = useState<'identity' | 'hero' | 'brand' | 'banner' | 'social' | 'presets' | 'elements'>('identity');
  const [sandboxSlideIndex, setSandboxSlideIndex] = useState<number>(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 p-1.5 bg-neutral-950/80 border border-neutral-800/80 rounded-xl overflow-x-auto no-scrollbar">
        {[
          { id: 'identity', label: 'Brand Identity', icon: Sparkles, badge: undefined },
          { id: 'hero', label: 'Hero Section', icon: ImageIcon, badge: undefined },
          { id: 'brand', label: 'Brand Colors', icon: Palette, badge: undefined },
          { id: 'banner', label: 'Top Banner', icon: Sliders, badge: undefined },
          { id: 'social', label: 'Social & Metadata', icon: Globe, badge: undefined },
          { id: 'presets', label: 'Presets', icon: Layout, badge: undefined },
          { id: 'elements', label: 'UI Elements', icon: Settings, badge: undefined }
        ].map((tab) => {
                    const IconComp = tab.icon;
                    const isActive = customizerSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCustomizerSubTab(tab.id as any)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-amber-500 text-neutral-950 shadow-md font-extrabold'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-900/90'
                        }`}
                      >
                        <IconComp className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-neutral-950' : 'text-amber-400'}`} />
                        <span>{tab.label}</span>
                        {tab.badge && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black leading-none shrink-0 ${
                            isActive
                              ? 'bg-neutral-950/25 text-neutral-950'
                              : tab.badge === 'ON'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                          }`}>
                            {tab.badge}
                          </span>
                        )}
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
                            Customise the public branding, header logo, festival title, and taglines displayed across the entire website.
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
                            value={siteConfig.appName || 'Grenada'}
                            onChange={(e) => {
                              const updated = { ...siteConfig, appName: e.target.value };
                              setSiteConfigState(updated);
                              saveSiteConfig(updated);
                            }}
                            placeholder="e.g. Grenada"
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
                            <ImageIcon className="w-4 h-4 text-amber-400" />
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
                            <ImageIcon className="w-4 h-4 text-amber-400" />
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
                                {siteConfig.appName || 'Grenada'}
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
                          <ImageIcon className="w-5 h-5 text-amber-400" />
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
                          className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
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
                                      : 'border-neutral-800/70/60 opacity-60 hover:opacity-100'
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
                          <label className="block text-xs uppercase font-bold text-neutral-300 mb-1.5">Banner Background Colour</label>
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
                                <span className="text-[9px] font-mono text-neutral-500">Colours:</span>
                                <div className="flex gap-1">
                                  <div className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: preset.primaryColor }} title="Primary colour" />
                                  <div className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: preset.secondaryColor }} title="Secondary colour" />
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
                              <span>Active Primary Colour:</span>
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

              {/* SUB-TAB 7: UI ELEMENTS CUSTOMISER */}
              {customizerSubTab === 'elements' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Column: UI Styling Controls */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="bg-neutral-950/60 border border-neutral-800/80 p-6 rounded-2xl space-y-2">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-widest">
                          <Settings className="w-3.5 h-3.5" /> UI Component Architecture
                        </div>
                        <h3 className="text-lg font-bold text-white">Button & Card Elements Customiser</h3>
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
                              desc: 'Produces a glowing neon light coloured after the main primary.'
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
  );
};