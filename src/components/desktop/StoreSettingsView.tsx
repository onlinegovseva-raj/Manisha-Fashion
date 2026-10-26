import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Upload, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Link as LinkIcon, 
  Eye, 
  Smartphone, 
  Receipt, 
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { StoreSettings, StaffUser } from '../../types';
import { storage } from '../../services/storage';

interface StoreSettingsViewProps {
  currentUser: StaffUser;
  onRefresh?: () => void;
  onOpenStorefront?: () => void;
}

const PRESET_LOGOS = [
  {
    id: 'preset_gold_m',
    name: 'Royal Gold Monogram',
    url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'preset_minimal_diamond',
    name: 'Atelier Diamond',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'preset_luxury_silk',
    name: 'Silk Loom Emblem',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'preset_heritage_peacock',
    name: 'Heritage Motif',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80',
  },
];

export const StoreSettingsView: React.FC<StoreSettingsViewProps> = ({
  currentUser,
  onRefresh,
  onOpenStorefront,
}) => {
  const [settings, setSettings] = useState<StoreSettings>(storage.getStoreSettings());
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'PRESETS' | 'URL'>('UPLOAD');
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
      setSettings((prev) => ({ ...prev, logo_url: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!settings.store_name.trim()) {
      setErrorMsg('Store name cannot be empty');
      return;
    }

    const saved = storage.saveStoreSettings(settings);
    setSettings(saved);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
    if (onRefresh) onRefresh();
  };

  const handleReset = () => {
    if (confirm('Reset store branding and logo to factory defaults?')) {
      const def = storage.resetStoreSettings();
      setSettings(def);
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            Store Branding & Logo Settings
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Customize the shop logo, store name, WhatsApp helpline, and invoice details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenStorefront && (
            <button
              onClick={onOpenStorefront}
              className="px-3.5 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 flex items-center gap-1.5"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleSave}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
          >
            {savedNotice ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Live Preview Cards (Mobile Header & Printed Invoice) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mobile Header Preview */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-stone-700" />
              <span>Mobile Header Preview</span>
            </span>
            <span className="text-emerald-700 font-mono text-[10px]">Real-Time</span>
          </div>

          <div className="bg-[#fbfbfb] p-3 rounded-xl border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.store_name}
                  className="w-8 h-8 rounded-lg object-contain border border-stone-200 bg-white p-0.5"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-stone-950 text-white font-serif font-black text-sm flex items-center justify-center">
                  {settings.store_name.charAt(0) || 'M'}
                </div>
              )}
              <div>
                <h4 className="font-serif font-bold text-stone-900 text-sm leading-tight">
                  {settings.store_name || 'Manisha Fashion'}
                </h4>
                <p className="text-[10px] text-stone-500 truncate max-w-[180px]">
                  {settings.tagline}
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full font-bold">
              Cart (2)
            </span>
          </div>
        </div>

        {/* Invoice Header Preview */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase">
            <span className="flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-stone-700" />
              <span>Printed Invoice Header</span>
            </span>
            <span className="text-stone-400 font-mono text-[10px]">TAX INVOICE</span>
          </div>

          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.store_name}
                  className="w-8 h-8 rounded object-contain border border-stone-300 bg-white"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-stone-800 text-white font-bold flex items-center justify-center text-xs">
                  {settings.store_name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-[11px]">
                <p className="font-bold text-stone-900">{settings.store_name}</p>
                <p className="text-[9px] text-stone-500">{settings.address}, {settings.city}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-stone-600">₹ INR</span>
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-6">
        {/* Section 1: Logo Upload & Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider">
              1. Brand Logo Image
            </h3>
            {settings.logo_url && (
              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, logo_url: '' }))}
                className="text-xs text-red-600 font-semibold hover:underline"
              >
                Remove Current Logo
              </button>
            )}
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('UPLOAD')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'UPLOAD'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image File</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PRESETS')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'PRESETS'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Designer Presets</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('URL')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'URL'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Image URL</span>
            </button>
          </div>

          {/* Sub Tab: Upload Image */}
          {activeTab === 'UPLOAD' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-stone-50/50 hover:bg-amber-50/20"
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
                Click to browse logo image from your device
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                Supports PNG with transparent background, JPG, SVG, WebP up to 5MB
              </p>
            </div>
          )}

          {/* Sub Tab: Presets */}
          {activeTab === 'PRESETS' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_LOGOS.map((preset) => {
                const isSelected = settings.logo_url === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, logo_url: preset.url }))}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-500/20'
                        : 'border-stone-200 bg-white hover:border-stone-400'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-stone-800 truncate w-full">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Sub Tab: URL */}
          {activeTab === 'URL' && (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (urlInput.trim()) {
                    setSettings((prev) => ({ ...prev, logo_url: urlInput.trim() }));
                    setUrlInput('');
                  }
                }}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Section 2: Store Name & Tagline */}
        <div className="space-y-4 pt-4 border-t border-stone-100">
          <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider">
            2. Brand Identity & Copy
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Store / Business Name
              </label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Store Subtitle / Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                WhatsApp Orders Helpline
              </label>
              <input
                type="text"
                value={settings.whatsapp_number}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                UPI ID for Direct QR Codes
              </label>
              <input
                type="text"
                value={settings.upi_id}
                onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Physical Shop / Workshop Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-stone-500 hover:text-stone-800 text-xs font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Factory Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            {savedNotice ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved & Live!</span>
              </>
            ) : (
              <span>Save & Apply Settings</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
