import React, { useState, useRef, useMemo } from 'react';
import { DjBioItem, DjBioSocialLinks } from '../types';
import { getDjBios, saveDjBios, uploadFileToServer } from '../services/submissionService';
import { 
  Music, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Upload, 
  Image as ImageIcon, 
  Instagram, 
  Facebook, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  MapPin, 
  ExternalLink,
  Video,
  Eye,
  Copy
} from 'lucide-react';

interface DjBiosAdminTabProps {
  primaryColor?: string;
  onOpenMediaSelector?: (callback: (url: string) => void) => void;
  triggerConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

const COMMON_GENRES = [
  'Soca',
  'Calypso',
  'Afrobeats',
  'Dancehall',
  'Reggae',
  'UK Garage',
  'Amapiano',
  'Bashment',
  'Soul',
  'Hip-Hop',
  'House',
  'Caribbean Fusion',
  'Jab Jab',
  'Bouyon',
  'Zouk'
];

export const DjBiosAdminTab: React.FC<DjBiosAdminTabProps> = ({
  primaryColor = '#F59E0B',
  onOpenMediaSelector,
  triggerConfirm
}) => {
  const [djs, setDjs] = useState<DjBioItem[]>(() => getDjBios());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDjs, setSelectedDjs] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDj, setEditingDj] = useState<DjBioItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewDj, setPreviewDj] = useState<DjBioItem | null>(null);

  // Custom genre state
  const [customGenreInput, setCustomGenreInput] = useState('');
  const [extraGenres, setExtraGenres] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState<Partial<DjBioItem>>({
    name: '',
    stageName: '',
    roleOrTitle: '',
    genres: ['Soca', 'Afrobeats'],
    country: 'United Kingdom',
    city: 'London',
    photo: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&w=800&q=80',
    bio: '',
    socialLinks: {
      instagram: '',
      facebook: '',
      tiktok: ''
    },
    featured: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingDj(null);
    setFormData({
      name: '',
      stageName: '',
      roleOrTitle: 'Festival Resident Selector',
      genres: ['Soca', 'Afrobeats'],
      country: 'United Kingdom',
      city: 'London',
      photo: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&w=800&q=80',
      bio: '',
      socialLinks: {
        instagram: '',
        facebook: '',
        tiktok: ''
      },
      featured: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dj: DjBioItem) => {
    setEditingDj(dj);
    setFormData({
      ...dj,
      socialLinks: {
        instagram: dj.socialLinks?.instagram || '',
        facebook: dj.socialLinks?.facebook || '',
        tiktok: dj.socialLinks?.tiktok || '',
        soundcloud: dj.socialLinks?.soundcloud || '',
        spotify: dj.socialLinks?.spotify || ''
      }
    });
    setIsModalOpen(true);
  };

  const allAvailableGenres = useMemo(() => {
    const set = new Set<string>(COMMON_GENRES);
    // Include genres from all saved DJs
    djs.forEach(dj => {
      dj.genres?.forEach(g => {
        if (g && g.trim()) set.add(g.trim());
      });
    });
    // Include genres currently selected in the form
    formData.genres?.forEach(g => {
      if (g && g.trim()) set.add(g.trim());
    });
    // Include any custom genres added in the session
    extraGenres.forEach(g => {
      if (g && g.trim()) set.add(g.trim());
    });
    return Array.from(set);
  }, [djs, formData.genres, extraGenres]);

  const handleGenreToggle = (genre: string) => {
    const current = formData.genres || [];
    if (current.includes(genre)) {
      setFormData({ ...formData, genres: current.filter(g => g !== genre) });
    } else {
      setFormData({ ...formData, genres: [...current, genre] });
    }
  };

  const handleAddCustomGenre = () => {
    const trimmed = customGenreInput.trim();
    if (!trimmed) return;

    // Clean formatting (capitalize words)
    const formatted = trimmed.replace(/\b\w/g, char => char.toUpperCase());

    if (!extraGenres.includes(formatted)) {
      setExtraGenres(prev => [...prev, formatted]);
    }

    const current = formData.genres || [];
    if (!current.includes(formatted)) {
      setFormData(prev => ({
        ...prev,
        genres: [...current, formatted]
      }));
      showToast(`Added and selected custom genre: "${formatted}"`);
    } else {
      showToast(`"${formatted}" is already in your selected genres.`);
    }

    setCustomGenreInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadRes = await uploadFileToServer(file);
      if (uploadRes?.url) {
        setFormData(prev => ({ ...prev, photo: uploadRes.url }));
        showToast('DJ photo uploaded successfully!');
      } else {
        // Fallback to FileReader base64
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setFormData(prev => ({ ...prev, photo: event.target.result as string }));
            showToast('DJ photo loaded from local device!');
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Failed to upload DJ photo:', err);
      showToast('Photo upload failed. Please verify image file format.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChooseFromMediaLibrary = () => {
    if (onOpenMediaSelector) {
      onOpenMediaSelector((url: string) => {
        setFormData(prev => ({ ...prev, photo: url }));
        showToast('Selected photo from Media Library!');
      });
    } else {
      showToast('Media Library selector is accessible via the top navigation.');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stageName && !formData.name) {
      alert('Please provide either a Stage Name or Performer Name.');
      return;
    }
    if (!formData.photo?.trim()) {
      alert('Please provide a photo URL or upload an image.');
      return;
    }
    if (!formData.bio?.trim()) {
      alert('Please write a biography write-up for the DJ.');
      return;
    }

    const cleanSocialLinks: DjBioSocialLinks = {
      instagram: formData.socialLinks?.instagram?.trim() || undefined,
      facebook: formData.socialLinks?.facebook?.trim() || undefined,
      tiktok: formData.socialLinks?.tiktok?.trim() || undefined,
      soundcloud: formData.socialLinks?.soundcloud?.trim() || undefined,
      spotify: formData.socialLinks?.spotify?.trim() || undefined
    };

    if (editingDj) {
      const updated: DjBioItem = {
        ...editingDj,
        name: (formData.name || formData.stageName || '').trim(),
        stageName: formData.stageName?.trim() || formData.name?.trim() || '',
        roleOrTitle: formData.roleOrTitle?.trim() || 'Resident Selector',
        genres: formData.genres && formData.genres.length > 0 ? formData.genres : ['Soca'],
        country: formData.country?.trim() || 'United Kingdom',
        city: formData.city?.trim() || 'London',
        photo: formData.photo.trim(),
        bio: formData.bio.trim(),
        socialLinks: cleanSocialLinks,
        featured: Boolean(formData.featured)
      };

      const newDjs = djs.map(item => item.id === editingDj.id ? updated : item);
      setDjs(newDjs);
      saveDjBios(newDjs);
      showToast(`Updated DJ profile for ${updated.stageName}!`);
    } else {
      const newDj: DjBioItem = {
        id: `dj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: (formData.name || formData.stageName || '').trim(),
        stageName: formData.stageName?.trim() || formData.name?.trim() || '',
        roleOrTitle: formData.roleOrTitle?.trim() || 'Festival Selector',
        genres: formData.genres && formData.genres.length > 0 ? formData.genres : ['Soca'],
        country: formData.country?.trim() || 'United Kingdom',
        city: formData.city?.trim() || 'London',
        photo: formData.photo.trim(),
        bio: formData.bio.trim(),
        socialLinks: cleanSocialLinks,
        featured: Boolean(formData.featured)
      };

      const newDjs = [newDj, ...djs];
      setDjs(newDjs);
      saveDjBios(newDjs);
      showToast(`Added new DJ bio for ${newDj.stageName}!`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteDj = (id: string, stageName: string) => {
    const doDelete = () => {
      const newDjs = djs.filter(d => d.id !== id);
      setDjs(newDjs);
      saveDjBios(newDjs);
      setSelectedDjs(prev => prev.filter(item => item !== id));
      showToast(`Removed DJ bio for ${stageName}.`);
    };

    if (triggerConfirm) {
      triggerConfirm('Delete DJ Bio', `Are you sure you want to delete the profile for "${stageName}"? This will remove them from the public line-up.`, doDelete);
    } else if (window.confirm(`Are you sure you want to delete the profile for "${stageName}"?`)) {
      doDelete();
    }
  };

  const handleBulkDelete = () => {
    if (selectedDjs.length === 0) return;
    const doBulkDelete = () => {
      const count = selectedDjs.length;
      const newDjs = djs.filter(d => !selectedDjs.includes(d.id));
      setDjs(newDjs);
      saveDjBios(newDjs);
      setSelectedDjs([]);
      showToast(`Permanently deleted ${count} DJ profile(s).`);
    };

    if (triggerConfirm) {
      triggerConfirm('Bulk Delete DJs', `Are you sure you want to remove ${selectedDjs.length} selected DJ profile(s)?`, doBulkDelete);
    } else if (window.confirm(`Delete ${selectedDjs.length} DJ profiles?`)) {
      doBulkDelete();
    }
  };

  const filteredList = useMemo(() => {
    return djs.filter(dj => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (dj.stageName || '').toLowerCase().includes(q) ||
        (dj.name || '').toLowerCase().includes(q) ||
        (dj.bio || '').toLowerCase().includes(q) ||
        (dj.city || '').toLowerCase().includes(q) ||
        (dj.country || '').toLowerCase().includes(q) ||
        (dj.genres || []).some(g => g.toLowerCase().includes(q))
      );
    });
  }, [djs, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-amber-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
            Sound Lineup & Talent Roster
          </span>
          <h2 className="text-xl font-bold text-white font-serif mt-0.5">
            DJ Bios & Artiste Write-ups
          </h2>
          <p className="text-xs text-neutral-400 font-light">
            Manage public DJ photos, detailed written biographies, musical genres, and social links (Instagram, Facebook, and TikTok).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-transform hover:scale-105 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add DJ Bio
          </button>
        </div>
      </div>

      {/* Controls: Search and Bulk Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search DJs by name, genre, city, or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {selectedDjs.length > 0 && (
          <div className="bg-[#12162E] border border-amber-500/30 p-2 px-3 rounded-xl flex items-center justify-between gap-3 shadow-md">
            <span className="text-xs font-bold text-amber-400">
              {selectedDjs.length} DJ{selectedDjs.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDjs([])}
                className="text-[10px] text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-2.5 py-1 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-500/30 rounded text-[10px] font-black cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DJs Table / Cards Grid */}
      <div className="bg-[#0C0F1E] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-md">
        {/* Table Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-950/40">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={djs.length > 0 && djs.every(d => selectedDjs.includes(d.id))}
              onChange={(e) => {
                if (e.target.checked) setSelectedDjs(djs.map(d => d.id));
                else setSelectedDjs([]);
              }}
              className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
            />
            <span className="font-bold text-xs uppercase tracking-wider text-neutral-300">
              Current DJ Profiles ({djs.length})
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            {djs.filter(d => d.featured).length} Featured Headline Acts
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Music className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-xs text-neutral-400">No DJ bios found matching your criteria.</p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold hover:bg-amber-500/30 cursor-pointer"
            >
              Add First DJ Profile
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/60">
            {filteredList.map((dj) => {
              const hasInstagram = Boolean(dj.socialLinks?.instagram);
              const hasFacebook = Boolean(dj.socialLinks?.facebook);
              const hasTiktok = Boolean(dj.socialLinks?.tiktok);

              return (
                <div 
                  key={dj.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-neutral-900/30 transition-colors"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedDjs.includes(dj.id)}
                      onChange={() => {
                        setSelectedDjs(prev => 
                          prev.includes(dj.id) ? prev.filter(id => id !== dj.id) : [...prev, dj.id]
                        );
                      }}
                      className="mt-1 rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer shrink-0"
                    />

                    {/* DJ Thumbnail */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                      <img
                        src={dj.photo}
                        alt={dj.stageName || dj.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {dj.featured && (
                        <div className="absolute top-1 right-1 bg-amber-500 text-neutral-950 p-1 rounded-md shadow">
                          <Sparkles className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    {/* DJ Info */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-white font-bold text-sm sm:text-base truncate">
                          {dj.stageName || dj.name}
                        </h4>
                        {dj.name && dj.name !== dj.stageName && (
                          <span className="text-[11px] text-neutral-400 font-mono">
                            ({dj.name})
                          </span>
                        )}
                        {dj.featured && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-[9px] uppercase tracking-wider">
                            Headline Act
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400 font-light">
                        {dj.roleOrTitle && (
                          <span className="text-amber-300/80 font-medium">{dj.roleOrTitle}</span>
                        )}
                        {dj.city && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-neutral-500" /> {dj.city}, {dj.country}
                          </span>
                        )}
                      </div>

                      {/* Bio Snippet */}
                      <p className="text-neutral-400 text-xs line-clamp-2 font-light leading-relaxed max-w-2xl">
                        {dj.bio}
                      </p>

                      {/* Genres & Social Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {dj.genres?.slice(0, 3).map((g, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-bold">
                            {g}
                          </span>
                        ))}
                        {(dj.genres?.length || 0) > 3 && (
                          <span className="text-[10px] text-neutral-500">
                            +{(dj.genres?.length || 0) - 3} more
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-neutral-800">
                          {hasInstagram && (
                            <span className="text-[10px] font-bold text-rose-400 flex items-center gap-0.5" title={dj.socialLinks.instagram}>
                              <Instagram className="w-3 h-3" /> Insta
                            </span>
                          )}
                          {hasFacebook && (
                            <span className="text-[10px] font-bold text-blue-400 flex items-center gap-0.5" title={dj.socialLinks.facebook}>
                              <Facebook className="w-3 h-3" /> FB
                            </span>
                          )}
                          {hasTiktok && (
                            <span className="text-[10px] font-bold text-rose-300 flex items-center gap-0.5" title={dj.socialLinks.tiktok}>
                              <Video className="w-3 h-3" /> TikTok
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDj(dj)}
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
                      title="Preview write-up"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(dj)}
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 rounded-xl border border-neutral-800 hover:border-amber-500/30 transition-colors cursor-pointer text-xs flex items-center gap-1"
                      title="Edit DJ Bio"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDj(dj.id, dj.stageName || dj.name)}
                      className="p-2 bg-neutral-900 hover:bg-rose-950/30 text-neutral-500 hover:text-rose-400 rounded-xl border border-neutral-800 hover:border-rose-500/30 transition-colors cursor-pointer text-xs"
                      title="Delete DJ Bio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                  {editingDj ? 'Edit Sound Profile' : 'New Sound Curator'}
                </span>
                <h3 className="text-xl font-bold text-white font-serif">
                  {editingDj ? `Edit Bio: ${editingDj.stageName || editingDj.name}` : 'Add New DJ Bio'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-800 hover:bg-neutral-750 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5 text-left">
              {/* Names & Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Stage Name / Moniker <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DJ CJ, Selector Spice"
                    value={formData.stageName || ''}
                    onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Real / Legal Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chris Jenkins"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Title & Origin */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UK Headline Resident"
                    value={formData.roleOrTitle || ''}
                    onChange={(e) => setFormData({ ...formData, roleOrTitle: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    City / Base
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. London"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. United Kingdom"
                    value={formData.country || ''}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* DJ Photo Section */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                  DJ Photo / Image <span className="text-amber-400">*</span>
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                    {formData.photo ? (
                      <img
                        src={formData.photo}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={formData.photo || ''}
                      onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold rounded-lg border border-neutral-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {isUploading ? 'Uploading...' : 'Upload from Device'}
                      </button>
                      <button
                        type="button"
                        onClick={handleChooseFromMediaLibrary}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30 flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Choose from Media Library
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Musical Genres Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                    Musical Genres & Sound Styles
                  </label>
                  <span className="text-[10px] font-mono text-amber-400">
                    {(formData.genres || []).length} selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {allAvailableGenres.map((genre) => {
                    const isSelected = (formData.genres || []).includes(genre);
                    const isCustom = !COMMON_GENRES.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleGenreToggle(genre)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-500 text-neutral-950 shadow-sm ring-1 ring-amber-400'
                            : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                        }`}
                      >
                        <span>{genre}</span>
                        {isSelected && (
                          <span className="text-[10px] opacity-70">✓</span>
                        )}
                        {isCustom && !isSelected && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-400 uppercase font-mono">Custom</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Genre Input Box */}
                <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-xl p-2.5 space-y-2 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={customGenreInput}
                        onChange={(e) => setCustomGenreInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomGenre();
                          }
                        }}
                        placeholder="Add custom genre (e.g. Jab Jab, Zouk, UK Bass, Bouyon)..."
                        className="w-full bg-neutral-900/90 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-sans"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomGenre}
                      disabled={!customGenreInput.trim()}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Genre</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    Type any custom musical style or Caribbean sound and click &ldquo;Add Custom Genre&rdquo; (or press Enter).
                  </p>
                </div>
              </div>

              {/* Bio Write-up (Crucial User Requirement) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                    Biography Write-up <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    {(formData.bio || '').length} characters
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  placeholder="Put write-up under the DJ's photo here: covering their musical background, residency status, carnival experience, signature sound, and what fans can expect..."
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                />
                <p className="text-[10px] text-neutral-500">
                  Tip: Write in full British English grammar (e.g., &ldquo;specialises in high-tempo soca&rdquo;, &ldquo;revered selector&rdquo;).
                </p>
              </div>

              {/* Social Media Links: Instagram, Facebook, TikTok (Crucial User Requirement) */}
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Social Media Channels
                  </h4>
                </div>
                <p className="text-[11px] text-neutral-400 font-light">
                  Add links for Instagram, Facebook, and TikTok. These will appear as clickable links under the DJ photo and write-up on the public page.
                </p>

                <div className="space-y-3">
                  {/* Instagram Link */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 text-rose-400 flex items-center justify-center shrink-0">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        placeholder="https://instagram.com/djhandle"
                        value={formData.socialLinks?.instagram || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          socialLinks: {
                            ...formData.socialLinks,
                            instagram: e.target.value
                          }
                        })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {/* Facebook Link */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 text-blue-400 flex items-center justify-center shrink-0">
                      <Facebook className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        placeholder="https://facebook.com/djpage"
                        value={formData.socialLinks?.facebook || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          socialLinks: {
                            ...formData.socialLinks,
                            facebook: e.target.value
                          }
                        })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* TikTok Link */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 text-rose-300 flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        placeholder="https://tiktok.com/@djhandle"
                        value={formData.socialLinks?.tiktok || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          socialLinks: {
                            ...formData.socialLinks,
                            tiktok: e.target.value
                          }
                        })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Headline / Featured Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-white block">Featured Headline Act</span>
                  <span className="text-[10px] text-neutral-400">
                    Display special gold badge and top priority placement on the DJ page.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(formData.featured)}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-lg transition-transform hover:scale-105"
                >
                  {editingDj ? 'Save Changes' : 'Publish DJ Bio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PREVIEW MODAL */}
      {previewDj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewDj(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-neutral-950/80 text-white hover:bg-neutral-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="h-60 overflow-hidden bg-neutral-950 relative">
              <img
                src={previewDj.photo}
                alt={previewDj.stageName || previewDj.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/30 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-2xl font-bold text-white font-serif">{previewDj.stageName || previewDj.name}</h3>
                <p className="text-xs text-amber-400 font-semibold">{previewDj.roleOrTitle}</p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Biography Write-up</span>
                <p className="text-neutral-200 text-xs leading-relaxed whitespace-pre-line">
                  {previewDj.bio}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Socials:</span>
                {previewDj.socialLinks?.instagram && (
                  <a href={previewDj.socialLinks.instagram} target="_blank" rel="noreferrer" className="text-rose-400 text-xs font-bold hover:underline flex items-center gap-1">
                    <Instagram className="w-3 h-3" /> Insta
                  </a>
                )}
                {previewDj.socialLinks?.facebook && (
                  <a href={previewDj.socialLinks.facebook} target="_blank" rel="noreferrer" className="text-blue-400 text-xs font-bold hover:underline flex items-center gap-1">
                    <Facebook className="w-3 h-3" /> Facebook
                  </a>
                )}
                {previewDj.socialLinks?.tiktok && (
                  <a href={previewDj.socialLinks.tiktok} target="_blank" rel="noreferrer" className="text-rose-300 text-xs font-bold hover:underline flex items-center gap-1">
                    <Video className="w-3 h-3" /> TikTok
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
