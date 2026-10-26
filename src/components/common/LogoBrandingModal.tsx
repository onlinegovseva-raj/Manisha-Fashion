import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Link as LinkIcon, 
  Building2, 
  Phone, 
  MapPin, 
  CreditCard,
  Eye
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { storage } from '../../services/storage';

interface LogoBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (newSettings: StoreSettings) => void;
}

// Preset luxury logos that merchants can choose with 1 click
const PRESET_LOGOS = [
  {
    id: 'preset_gold_m',
    name: 'Royal Gold Monogram',
    url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=300&q=80',
    type: 'IMAGE' as const,
  },
  {
    id: 'preset_minimal_diamond',
    name: 'Atelier Diamond',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    type: 'IMAGE' as const,
  },
  {
    id: 'preset_luxury_silk',
    name: 'Silk Loom Emblem',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80',
    type: 'IMAGE' as const,
  },
  {
    id: 'preset_heritage_peacock',
    name: 'Heritage Motif',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80',
    type: 'IMAGE' as const,
  },
];

export const LogoBrandingModal: React.FC<LogoBrandingModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  if (!isOpen) return null;

  const current = storage.getStoreSettings();

  const [storeName, setStoreName] = useState(current.store_name);
  const [tagline, setTagline] = useState(current.tagline);
  const [logoUrl, setLogoUrl] = useState(current.logo_url || '');
  const [logoType, setLogoType] = useState<StoreSettings['logo_type']>(current.logo_type || 'BOTH');
  const [phone, setPhone] = useState(current.phone);
  const [whatsapp, setWhatsapp] = useState(current.whatsapp_number);
  const [address, setAddress] = useState(current.address);
  const [city, setCity] = useState(current.city);
  const [upiId, setUpiId] = useState(current.upi_id || 'manishafashion@okaxis');

  const [activeSubTab, setActiveSubTab] = useState<'UPLOAD' | 'URL' | 'PRESETS'>('UPLOAD');
  const [urlInput, setUrlInput] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP, SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Logo file must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setLogoUrl(urlInput.trim());
    setUrlInput('');
  };

  const handleSave = () => {
    if (!storeName.trim()) {
      setErrorMsg('Store name cannot be empty');
      return;
    }

    const updated = storage.saveStoreSettings({
      store_name: storeName.trim(),
      tagline: tagline.trim(),
      logo_url: logoUrl.trim(),
      logo_type: logoType,
      phone: phone.trim(),
      whatsapp_number: whatsapp.trim().replace(/\D/g, ''),
      address: address.trim(),
      city: city.trim(),
      upi_id: upiId.trim(),
    });

    if (onSettingsSaved) {
      onSettingsSaved(updated);
    }

    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 700);
  };

  const handleResetDefaults = () => {
    const def = storage.resetStoreSettings();
    setStoreName(def.store_name);
    setTagline(def.tagline);
    setLogoUrl(def.logo_url || '');
    setLogoType(def.logo_type);
    setPhone(def.phone);
    setWhatsapp(def.whatsapp_number);
    setAddress(def.address);
    setCity(def.city);
    setUpiId(def.upi_id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 leading-tight">
                Logo & Store Branding
              </h3>
              <p className="text-[11px] text-stone-500">
                Change your brand logo, name, and contact details across the storefront and invoices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-stone-800 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Real-time Live Preview Card */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-stone-600" />
                <span>Live Header & Invoice Preview</span>
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                Instant Update
              </span>
            </div>

            {/* Mobile Mockup Header Preview */}
            <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={storeName}
                    className="w-9 h-9 rounded-lg object-contain border border-stone-200 bg-stone-50 p-0.5"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-stone-900 to-stone-800 text-white font-serif font-black text-base flex items-center justify-center shadow-xs">
                    {storeName.charAt(0) || 'M'}
                  </div>
                )}
                <div>
                  <h4 className="font-serif font-bold text-stone-950 text-sm leading-tight">
                    {storeName || 'Manisha Fashion'}
                  </h4>
                  <p className="text-[10px] text-stone-500 truncate max-w-xs">
                    {tagline || 'Artisanal Menswear, Fashion Jewellery & Bridal Accessories'}
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                {city}
              </div>
            </div>
          </div>

          {/* Section 1: Logo Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                1. Brand Logo
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="text-[11px] text-red-600 font-semibold hover:underline"
                >
                  Remove Logo (Use Default Monogram)
                </button>
              )}
            </div>

            {/* Logo Options Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveSubTab('UPLOAD')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeSubTab === 'UPLOAD'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload From Device</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('PRESETS')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeSubTab === 'PRESETS'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Choose Designer Preset</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('URL')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeSubTab === 'URL'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Image Link</span>
              </button>
            </div>

            {/* Sub Tab: Upload File */}
            {activeSubTab === 'UPLOAD' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-stone-50/50 hover:bg-amber-50/20"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center mx-auto text-amber-700 mb-2">
                  <Upload className="w-6 h-6 stroke-[1.8]" />
                </div>
                <p className="font-bold text-stone-800 text-xs">
                  Click to Browse Logo File from Phone or Computer
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Supports transparent PNG, JPG, WebP, SVG (Square or Rectangular)
                </p>
              </div>
            )}

            {/* Sub Tab: Preset Logos */}
            {activeSubTab === 'PRESETS' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_LOGOS.map((preset) => {
                  const isSelected = logoUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setLogoUrl(preset.url)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 group ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20'
                          : 'border-stone-200 bg-white hover:border-stone-400'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-stone-700 truncate w-full">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sub Tab: Web Image URL */}
            {activeSubTab === 'URL' && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/my-shop-logo.png"
                  className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
                >
                  Use URL
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Store Name & Tagline */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <label className="font-bold text-stone-900 text-xs uppercase tracking-wider">
              2. Store Name & Brand Text
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Store / Brand Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Manisha Fashion"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Display Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Artisanal Menswear & Jewellery"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            {/* Logo Display Mode */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                Header Presentation Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'BOTH', label: 'Logo + Store Name' },
                  { id: 'IMAGE', label: 'Logo Image Only' },
                  { id: 'TEXT', label: 'Stylized Text Logo' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setLogoType(mode.id as StoreSettings['logo_type'])}
                    className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                      logoType === mode.id
                        ? 'border-stone-950 bg-stone-950 text-white shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Business & Contact Information */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <label className="font-bold text-stone-900 text-xs uppercase tracking-wider">
              3. Store Location & WhatsApp Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  WhatsApp Contact Number
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="e.g. 919820112345"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  UPI ID for Direct QR Payments
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. manishafashion@okaxis"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Workshop / Shop Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shop 14, Fashion Street Market, Kalbadevi"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-stone-100 bg-stone-50 flex items-center justify-between sticky bottom-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-stone-500 hover:text-stone-800 text-xs font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-stone-950 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save & Apply Logo</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
