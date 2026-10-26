import React, { useState } from 'react';
import { 
  Monitor, 
  ShoppingBag, 
  CheckCircle2, 
  BookOpen, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  User, 
  ShieldCheck, 
  Menu, 
  X, 
  Layers,
  Sparkles 
} from 'lucide-react';
import { StaffUser, StoreSettings } from '../types';
import { storage } from '../services/storage';
import { LogoBrandingModal } from './common/LogoBrandingModal';

export type AppMode = 'DESKTOP' | 'STOREFRONT' | 'TESTS' | 'DOCS';

interface NavbarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  currentUser: StaffUser;
  onUserChange: (user: StaffUser) => void;
  staffList: StaffUser[];
  isOnline: boolean;
  onToggleOnline: () => void;
  outboxCount: number;
  onTriggerSync: () => void;
  isSyncing: boolean;
  cartCount: number;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onModeChange,
  currentUser,
  onUserChange,
  staffList,
  isOnline,
  onToggleOnline,
  outboxCount,
  onTriggerSync,
  isSyncing,
  cartCount,
  onOpenCart,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(storage.getStoreSettings());
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  React.useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      setStoreSettings(e.detail || storage.getStoreSettings());
    };
    window.addEventListener('store_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('store_settings_updated', handleSettingsUpdate);
  }, []);

  const handleSelectMode = (mode: AppMode) => {
    onModeChange(mode);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      {/* Top Status Bar: Responsive & Compact on Mobile */}
      <div className="bg-stone-950 px-3 sm:px-4 py-1 text-[11px] sm:text-xs text-stone-400 flex items-center justify-between border-b border-stone-800/60">
        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0 animate-pulse"></span>
          <span className="font-bold text-stone-200 truncate">MANISHA FASHION</span>
          <span className="text-stone-600 hidden sm:inline">·</span>
          <span className="text-stone-400 hidden sm:inline truncate">Zero-License ERP & Storefront</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Offline / Online Toggle */}
          <button
            onClick={onToggleOnline}
            title="Toggle Cloud Online vs Offline Storage Mode"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold transition-colors ${
              isOnline
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden xs:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={onTriggerSync}
            disabled={!isOnline || isSyncing}
            className="flex items-center gap-1 text-[10px] sm:text-xs text-stone-400 hover:text-stone-200 disabled:opacity-50"
            title="Sync with cloud"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            {outboxCount > 0 && (
              <span className="bg-amber-500 text-stone-950 px-1 py-0.2 rounded-full text-[9px] font-extrabold">
                {outboxCount}
              </span>
            )}
          </button>

          {/* Staff Switcher: Hidden on tiny screens, accessible in mobile menu */}
          <div className="hidden md:flex items-center gap-1.5 border-l border-stone-800 pl-2.5">
            <User className="w-3 h-3 text-stone-400" />
            <select
              value={currentUser.id}
              onChange={(e) => {
                const found = staffList.find((s) => s.id === e.target.value);
                if (found) onUserChange(found);
              }}
              className="bg-stone-800 text-stone-200 text-[11px] rounded px-1.5 py-0.5 border border-stone-700 focus:outline-none"
            >
              {staffList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name.split(' ')[0]} ({user.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-13 sm:h-14 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div 
          onClick={() => onModeChange('STOREFRONT')} 
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          {storeSettings.logo_url ? (
            <img
              src={storeSettings.logo_url}
              alt={storeSettings.store_name}
              className="w-8 h-8 rounded-lg object-contain bg-white border border-stone-700 shrink-0 p-0.5"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center font-serif text-base font-bold text-white shadow shrink-0">
              {storeSettings.store_name.charAt(0) || 'M'}
            </div>
          )}
          <div>
            <span className="text-sm sm:text-base font-bold tracking-tight text-white block leading-tight group-hover:text-amber-400 transition-colors">
              {storeSettings.store_name}
            </span>
            <span className="text-[10px] text-amber-400 font-medium block">
              {storeSettings.city.toUpperCase()} · ₹ INR
            </span>
          </div>
        </div>

        {/* Desktop Navigation Mode Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-stone-800/80 p-1 rounded-lg border border-stone-700/80">
          <button
            onClick={() => handleSelectMode('DESKTOP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              currentMode === 'DESKTOP'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop ERP</span>
          </button>

          <button
            onClick={() => handleSelectMode('STOREFRONT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              currentMode === 'STOREFRONT'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>

          <button
            onClick={() => handleSelectMode('TESTS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              currentMode === 'TESTS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tests</span>
          </button>

          <button
            onClick={() => handleSelectMode('DOCS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              currentMode === 'DOCS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Docs</span>
          </button>
        </nav>

        {/* Right side controls: Change Logo, Cart & Mobile Hamburger */}
        <div className="flex items-center gap-2">
          {/* Change Logo Quick Button */}
          <button
            onClick={() => setIsLogoModalOpen(true)}
            title="Change Store Logo & Branding"
            className="hidden sm:flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 px-2.5 py-1.5 rounded-md text-xs font-semibold border border-stone-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Change Logo</span>
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="bg-stone-900 text-amber-400 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ml-0.5">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu Modal */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-stone-900 border-t border-stone-800 p-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Select Application View:
            </span>
            <button
              onClick={() => handleSelectMode('STOREFRONT')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
                currentMode === 'STOREFRONT' ? 'bg-amber-600 text-white' : 'text-stone-200 hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>📱 Public Shopping Storefront</span>
              </div>
              {cartCount > 0 && (
                <span className="bg-stone-950 text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {cartCount} items
                </span>
              )}
            </button>

            <button
              onClick={() => handleSelectMode('DESKTOP')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
                currentMode === 'DESKTOP' ? 'bg-amber-600 text-white' : 'text-stone-200 hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4" />
                <span>🖥️ Desktop Management ERP</span>
              </div>
              <span className="text-[10px] text-stone-400">Products, Stock, Orders</span>
            </button>

            <button
              onClick={() => handleSelectMode('TESTS')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
                currentMode === 'TESTS' ? 'bg-amber-600 text-white' : 'text-stone-200 hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>🧪 Automated Test Suite</span>
              </div>
              <span className="text-[10px] text-stone-400">8 Assertions</span>
            </button>

            <button
              onClick={() => handleSelectMode('DOCS')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
                currentMode === 'DOCS' ? 'bg-amber-600 text-white' : 'text-stone-200 hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>📚 Architecture & EXE Guide</span>
              </div>
              <span className="text-[10px] text-stone-400">Runbooks</span>
            </button>
          </div>

          {/* Mobile Staff User Switcher */}
          <div className="pt-3 border-t border-stone-800 space-y-2">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              Active Staff Role:
            </span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const found = staffList.find((s) => s.id === e.target.value);
                if (found) onUserChange(found);
              }}
              className="w-full bg-stone-800 text-stone-200 text-xs rounded-lg p-2.5 border border-stone-700 focus:outline-none"
            >
              {staffList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsLogoModalOpen(true);
            }}
            className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border border-stone-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Change Store Logo & Brand</span>
          </button>
        </div>
      )}

      {/* Logo & Store Branding Modal */}
      <LogoBrandingModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        onSettingsSaved={(newSettings) => setStoreSettings(newSettings)}
      />
    </header>
  );
};
