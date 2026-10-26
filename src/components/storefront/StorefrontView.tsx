import React, { useState, useRef, useMemo } from 'react';
import { 
  Search, 
  ShoppingBag, 
  SlidersHorizontal, 
  Heart, 
  Star, 
  ArrowRight, 
  ArrowLeft, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Lock, 
  Home, 
  LayoutGrid, 
  Package, 
  User, 
  Menu, 
  X, 
  ChevronRight, 
  MessageSquare, 
  Check, 
  Smartphone, 
  Monitor,
  Sparkles,
  PhoneCall,
  MapPin
} from 'lucide-react';
import { Product, ProductVariant, StoreSettings } from '../../types';
import { storage } from '../../services/storage';
import { ProductDetailModal } from './ProductDetailModal';
import { LogoBrandingModal } from '../common/LogoBrandingModal';

interface StorefrontViewProps {
  products: Product[];
  onAddToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  onOpenCart: () => void;
  cartCount: number;
}

type TabType = 'HOME' | 'CATEGORIES' | 'WISHLIST' | 'ORDERS' | 'ACCOUNT';
type ViewMode = 'HOME_FEED' | 'LISTING';
type SortOption = 'FEATURED' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RATING';

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  products,
  onAddToCart,
  onOpenCart,
  cartCount,
}) => {
  const dynamicCategories: string[] = storage.getCategories();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [viewMode, setViewMode] = useState<ViewMode>('HOME_FEED');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('FEATURED');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(storage.getStoreSettings());
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  React.useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      setStoreSettings(e.detail || storage.getStoreSettings());
    };
    window.addEventListener('store_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('store_settings_updated', handleSettingsUpdate);
  }, []);
  
  // Frame toggle for desktop users to preview exact mobile screen
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Modals & Detail
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Wishlist state trigger
  const [wishlistVersion, setWishlistVersion] = useState(0);

  // Filter only published products
  const publishedProducts = useMemo(() => {
    return products.filter((p) => p.is_published);
  }, [products]);

  // Wishlist items
  const wishlistedProducts = useMemo(() => {
    const list = storage.getWishlist();
    return publishedProducts.filter((p) => list.includes(p.id));
  }, [publishedProducts, wishlistVersion]);

  // Filtered & Sorted products for listing
  const filteredProducts = useMemo(() => {
    let list = [...publishedProducts];

    if (selectedCategory !== 'ALL') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (onlyInStock) {
      list = list.filter((p) => p.variants.some((v) => v.stock > 0));
    }

    if (sortBy === 'PRICE_LOW') {
      list.sort((a, b) => storage.calculateEffectivePrice(a) - storage.calculateEffectivePrice(b));
    } else if (sortBy === 'PRICE_HIGH') {
      list.sort((a, b) => storage.calculateEffectivePrice(b) - storage.calculateEffectivePrice(a));
    }

    return list;
  }, [publishedProducts, selectedCategory, searchQuery, onlyInStock, sortBy]);

  // Best sellers collection
  const bestSellers = useMemo(() => {
    return publishedProducts.slice(0, 6);
  }, [publishedProducts]);

  // Category Icon/Image mapping for "Shop By Category" row
  const getCategoryMeta = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes('formal')) {
      return {
        label: 'Formal',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80',
      };
    }
    if (lower.includes('casual')) {
      return {
        label: 'Casual',
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=300&q=80',
      };
    }
    if (lower.includes('print')) {
      return {
        label: 'Printed',
        image: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&w=300&q=80',
      };
    }
    if (lower.includes('linen')) {
      return {
        label: 'Linen',
        image: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=300&q=80',
      };
    }
    if (lower.includes('denim')) {
      return {
        label: 'Denim',
        image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=300&q=80',
      };
    }
    if (lower.includes('jewel') || lower.includes('nekles') || lower.includes('necklace')) {
      return {
        label: 'Jewellery',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=300&q=80',
      };
    }
    if (lower.includes('bangle') || lower.includes('bengel') || lower.includes('kada')) {
      return {
        label: 'Bangles',
        image: 'https://images.unsplash.com/photo-1611591475879-11939ef2a297?auto=format&fit=crop&w=300&q=80',
      };
    }
    if (lower.includes('purse') || lower.includes('bag') || lower.includes('ledius') || lower.includes('clutch')) {
      return {
        label: 'Purses',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80',
      };
    }
    return {
      label: cat,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80',
    };
  };

  const handleProductCardClick = (product: Product) => {
    storage.recordAnalyticsEvent({
      event_type: 'PRODUCT_VIEW',
      product_id: product.id,
      product_name: product.name,
      value: product.selling_price,
    });
    setDetailProduct(product);
  };

  const handleToggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    storage.toggleWishlist(productId);
    setWishlistVersion((v) => v + 1);
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setViewMode('LISTING');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Color Swatch Generator for card
  const getColorDots = (product: Product) => {
    const colors: { [key: string]: string } = {
      blue: '#93c5fd',
      sky: '#38bdf8',
      navy: '#1e293b',
      olive: '#365314',
      green: '#15803d',
      white: '#f8fafc',
      black: '#0f172a',
      beige: '#d6c7a1',
      cream: '#fef3c7',
      gold: '#eab308',
      pink: '#f472b6',
      maroon: '#881337',
      red: '#dc2626',
    };

    const uniqueColors = Array.from(new Set(product.variants.map((v) => v.color.toLowerCase())));
    const dots = uniqueColors.slice(0, 3).map((col) => {
      const match = Object.keys(colors).find((k) => col.includes(k));
      return match ? colors[match] : '#cbd5e1';
    });

    const remainder = uniqueColors.length > 3 ? `+${uniqueColors.length - 2}` : null;
    return { dots, remainder };
  };

  return (
    <div className="w-full flex flex-col items-center justify-start pb-24 text-stone-900">
      {/* Top Controls: Frame switch for desktop preview */}
      <div className="w-full max-w-5xl mb-3 hidden sm:flex items-center justify-between px-2 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-800">Mobile Interface Preview</span>
          <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
            Matches Reference Layout (Omarkô Style)
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-stone-200/80 p-0.5 rounded-lg">
          <button
            onClick={() => setIsPhoneFrame(true)}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition-all ${
              isPhoneFrame ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Device (420px)</span>
          </button>
          <button
            onClick={() => setIsPhoneFrame(false)}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition-all ${
              !isPhoneFrame ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Responsive Grid</span>
          </button>
        </div>
      </div>

      {/* Main Container - Mobile Shell or Full Width */}
      <div
        className={`w-full bg-[#fbfbfb] transition-all duration-300 relative ${
          isPhoneFrame
            ? 'max-w-[440px] sm:rounded-[40px] sm:shadow-2xl sm:border-[10px] sm:border-stone-900 min-h-[860px] overflow-hidden'
            : 'max-w-6xl rounded-2xl shadow-sm border border-stone-200'
        }`}
      >
        {/* Mobile Status Bar Decorator (Phone Frame Only) */}
        {isPhoneFrame && (
          <div className="px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-stone-900 bg-white select-none">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-stone-800" />
              <span className="w-3 h-2 rounded-xs border border-stone-800 bg-stone-800" />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SCREEN 1 / SCREEN 2 DYNAMIC HEADER                           */}
        {/* ============================================================ */}
        {viewMode === 'HOME_FEED' && activeTab === 'HOME' ? (
          // Screen 1 Header (Hamburger, Centered Brand Logo, Cart Badge)
          <header className="px-4 py-3 bg-white flex items-center justify-between sticky top-0 z-30 border-b border-stone-100">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-1.5 -ml-1 text-stone-800 hover:text-stone-950 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Brand Logo matching Omarkô typography with Custom Logo support */}
            <div 
              onClick={() => setIsLogoModalOpen(true)}
              className="flex items-center gap-1.5 cursor-pointer group"
              title="Click to Change Logo & Brand"
            >
              {storeSettings.logo_url ? (
                <div className="flex items-center gap-2">
                  <img
                    src={storeSettings.logo_url}
                    alt={storeSettings.store_name}
                    className="h-8 max-w-[130px] object-contain rounded"
                  />
                  {storeSettings.logo_type !== 'IMAGE' && (
                    <h1 className="text-lg sm:text-xl font-serif font-black tracking-tight text-stone-950 group-hover:text-amber-700 transition-colors">
                      {storeSettings.store_name}
                    </h1>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-stone-950 group-hover:text-amber-700 transition-colors">
                    {storeSettings.store_name}
                  </h1>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mb-1" />
                </div>
              )}
            </div>

            {/* Cart Icon with badge */}
            <button
              onClick={onOpenCart}
              className="p-1.5 -mr-1 text-stone-800 hover:text-stone-950 relative transition-transform active:scale-95"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-stone-950 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </header>
        ) : (
          // Screen 2 Header (Back Arrow, Centered Category Title, Search & Filter)
          <header className="px-4 py-3 bg-white flex items-center justify-between sticky top-0 z-30 border-b border-stone-100">
            <button
              onClick={() => {
                if (viewMode === 'LISTING' && activeTab === 'HOME') {
                  setViewMode('HOME_FEED');
                } else {
                  setActiveTab('HOME');
                  setViewMode('HOME_FEED');
                }
              }}
              className="p-1.5 -ml-1 text-stone-800 hover:text-stone-950 transition-colors"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>

            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 tracking-tight">
              {activeTab === 'WISHLIST'
                ? 'My Wishlist'
                : activeTab === 'CATEGORIES'
                ? 'All Categories'
                : activeTab === 'ORDERS'
                ? 'My Orders'
                : activeTab === 'ACCOUNT'
                ? 'Account & Support'
                : selectedCategory === 'ALL'
                ? 'All Styles'
                : selectedCategory}
            </h2>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  searchInputRef.current?.focus();
                }}
                className="p-1.5 text-stone-800 hover:text-stone-950"
              >
                <Search className="w-4 h-4 stroke-[2.2]" />
              </button>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="p-1.5 text-stone-800 hover:text-stone-950"
              >
                <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          </header>
        )}

        {/* Content Body Based on Tab and ViewMode */}
        <div className="p-3.5 sm:p-5 space-y-5">
          {/* ============================================================ */}
          {/* TAB: WISHLIST                                                */}
          {/* ============================================================ */}
          {activeTab === 'WISHLIST' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">
                  {wishlistedProducts.length} Saved Items
                </span>
                {wishlistedProducts.length > 0 && (
                  <button
                    onClick={() => {
                      storage.clearWishlist();
                      setWishlistVersion((v) => v + 1);
                    }}
                    className="text-[11px] text-red-600 font-semibold hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {wishlistedProducts.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-stone-200 p-6">
                  <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-500">
                    <Heart className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">Your Wishlist is Empty</h3>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    Tap the heart icon on any shirt, jewellery, or purse to save your favorites here.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('HOME');
                      setViewMode('LISTING');
                    }}
                    className="mt-2 px-5 py-2.5 bg-stone-950 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Explore Catalog
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {wishlistedProducts.map((product) => renderProductCard(product))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB: CATEGORIES DIRECTORY                                    */}
          {/* ============================================================ */}
          {activeTab === 'CATEGORIES' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-500">
                Browse our artisanal shirts, royal fashion jewellery, and bridal accessories.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {dynamicCategories.map((cat) => {
                  const meta = getCategoryMeta(cat);
                  const count = publishedProducts.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleSelectCategory(cat)}
                      className="bg-white rounded-2xl border border-stone-200 overflow-hidden text-left group hover:border-stone-900 transition-all shadow-2xs"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
                        <img
                          src={meta.image}
                          alt={cat}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="font-serif font-bold text-xs text-stone-900 truncate">
                          {cat}
                        </h4>
                        <p className="text-[10px] text-stone-400 mt-0.5">{count} Styles</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB: ORDERS & TRACKING                                       */}
          {/* ============================================================ */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
                <h3 className="font-serif font-bold text-sm text-stone-900">Track an Order</h3>
                <p className="text-xs text-stone-500">
                  Enter your Mobile Number or Order ID to view live dispatch status.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 9820112345 or ORD-2026-..."
                    className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <button className="px-4 py-2 bg-stone-950 text-white rounded-xl text-xs font-bold">
                    Track
                  </button>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <PhoneCall className="w-4 h-4 text-amber-700" />
                  <span>Doorstep Support & WhatsApp</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Need an exchange or update on your Delhivery / BlueDart parcel? Contact our Mumbai workshop directly.
                </p>
                <a
                  href="https://wa.me/919820112345?text=Namaste%20Manisha%20Fashion,%20I%20need%20help%20with%20my%20order."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Concierge</span>
                </a>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB: ACCOUNT & STORE INFO                                    */}
          {/* ============================================================ */}
          {activeTab === 'ACCOUNT' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {storeSettings.logo_url ? (
                      <img
                        src={storeSettings.logo_url}
                        alt={storeSettings.store_name}
                        className="w-12 h-12 rounded-xl object-contain bg-stone-50 border border-stone-200 p-1"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white font-serif font-black text-xl flex items-center justify-center shadow-xs">
                        {storeSettings.store_name.charAt(0) || 'M'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-serif font-bold text-stone-950 text-sm leading-tight">
                        {storeSettings.store_name}
                      </h3>
                      <p className="text-[11px] text-stone-500">{storeSettings.tagline}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsLogoModalOpen(true)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Change Logo</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-stone-100 space-y-2 text-xs text-stone-700">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                    <span>{storeSettings.address}, {storeSettings.city} {storeSettings.pincode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>Free Shipping on prepaid orders above ₹999</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>7-Day Doorstep Size Exchange Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB: HOME FEED (SCREEN 1 OF MOCKUP)                          */}
          {/* ============================================================ */}
          {activeTab === 'HOME' && viewMode === 'HOME_FEED' && (
            <div className="space-y-5">
              {/* Search Bar matching Screen 1 (Rounded input + Filter slider icon) */}
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setViewMode('LISTING');
                    }}
                    placeholder="Search for shirts, brands, jewellery..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-full text-xs text-stone-900 placeholder-stone-400 shadow-2xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-950 shadow-2xs shrink-0"
                  aria-label="Filters"
                >
                  <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>

              {/* Hero Promotional Card (Screen 1 Omarkô Banner) */}
              <section className="relative rounded-2xl overflow-hidden bg-[#e9e8e3] p-5 shadow-xs border border-stone-200 flex items-center justify-between min-h-[160px]">
                <div className="space-y-1.5 max-w-[58%] z-10">
                  <span className="text-[9px] font-bold tracking-widest text-stone-600 uppercase">
                    PREMIUM QUALITY
                  </span>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-950 leading-tight">
                    Shirts for Every Moment
                  </h2>
                  <p className="text-[11px] text-stone-600 font-light leading-snug">
                    Modern styles. Timeless comfort.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setSelectedCategory('ALL');
                        setViewMode('LISTING');
                      }}
                      className="px-4 py-2 bg-stone-950 hover:bg-stone-800 text-white rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
                    >
                      <span>Shop Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Model Image on right */}
                <div className="absolute right-0 bottom-0 top-0 w-[42%] flex items-end justify-center pointer-events-none">
                  <img
                    src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80"
                    alt="Manisha Menswear Model"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
              </section>

              {/* 4 Trust Badges Row (Screen 1) */}
              <section className="grid grid-cols-4 gap-2 py-1 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-stone-800">
                    <ShieldCheck className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-semibold text-stone-700 leading-tight">
                    Premium Quality
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-stone-800">
                    <RotateCcw className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-semibold text-stone-700 leading-tight">
                    Easy Returns
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-stone-800">
                    <Truck className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-semibold text-stone-700 leading-tight">
                    Fast Delivery
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-stone-800">
                    <Lock className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-semibold text-stone-700 leading-tight">
                    Secure Payment
                  </span>
                </div>
              </section>

              {/* Section: Shop By Category (Screen 1 Squircle Row) */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-black text-sm sm:text-base text-stone-900 tracking-tight">
                    Shop By Category
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setViewMode('LISTING');
                    }}
                    className="text-xs font-semibold text-stone-500 hover:text-stone-900 inline-flex items-center gap-0.5"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Horizontal scroll squircle items */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                  {dynamicCategories.map((cat) => {
                    const meta = getCategoryMeta(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleSelectCategory(cat)}
                        className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-white border border-stone-200/90 shadow-2xs overflow-hidden p-1 group-hover:border-stone-900 transition-all flex items-center justify-center">
                          <img
                            src={meta.image}
                            alt={cat}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                        <span className="text-[11px] font-medium text-stone-700 group-hover:text-stone-950 max-w-[68px] truncate">
                          {meta.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Section: Best Sellers (Screen 1 Carousel) */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-black text-sm sm:text-base text-stone-900 tracking-tight">
                    Best Sellers
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setViewMode('LISTING');
                    }}
                    className="text-xs font-semibold text-stone-500 hover:text-stone-900 inline-flex items-center gap-0.5"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                  {bestSellers.map((product) => {
                    const isLiked = storage.isWishlisted(product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductCardClick(product)}
                        className="w-36 shrink-0 bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="relative aspect-square w-full bg-[#f6f6f6] p-2 flex items-center justify-center">
                          <button
                            onClick={(e) => handleToggleWishlist(e, product.id)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-stone-700 hover:text-red-500 transition-colors shadow-2xs z-10"
                            aria-label="Wishlist"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                isLiked ? 'fill-red-500 text-red-500' : 'stroke-[2]'
                              }`}
                            />
                          </button>
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        <div className="p-2.5">
                          <h4 className="font-serif font-bold text-[11px] text-stone-900 truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-mono font-bold text-xs text-stone-950">
                              ₹{storage.calculateEffectivePrice(product).toLocaleString('en-IN')}
                            </span>
                            <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>4.6</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* WhatsApp Direct Fast Inquiry Card */}
              <section className="bg-emerald-50 rounded-2xl border border-emerald-200/70 p-4 flex items-center justify-between shadow-2xs">
                <div className="space-y-0.5 max-w-[70%]">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Looking for custom bulk or bridal?</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Chat directly with our Mumbai master craftsmen on WhatsApp.
                  </p>
                </div>
                <a
                  href="https://wa.me/919820112345?text=Namaste%20Manisha%20Fashion,%20I%20want%20to%20inquire%20about%20your%20collection."
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </a>
              </section>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB / SUBVIEW: LISTING VIEW (SCREEN 2 OF MOCKUP)             */}
          {/* ============================================================ */}
          {((activeTab === 'HOME' && viewMode === 'LISTING') ||
            (activeTab !== 'WISHLIST' && activeTab !== 'CATEGORIES' && activeTab !== 'ORDERS' && activeTab !== 'ACCOUNT' && viewMode === 'LISTING')) && (
            <div className="space-y-4">
              {/* Category Filter Pills (Screen 2: 'All', 'Formal', 'Casual', 'Printed', etc.) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    selectedCategory === 'ALL'
                      ? 'bg-stone-950 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  All
                </button>
                {dynamicCategories.map((cat) => {
                  const meta = getCategoryMeta(cat);
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                        isSelected
                          ? 'bg-stone-950 text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>

              {/* 2-Column Product Grid (Screen 2 Exact Match) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-200 p-6">
                    <ShoppingBag className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-700 text-sm">No items found</p>
                    <p className="text-xs text-stone-400 mt-1">Try another category or search term.</p>
                  </div>
                ) : (
                  filteredProducts.map((product, idx) => renderProductCard(product, idx))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SCREEN 1 & 2 FIXED BOTTOM 5-TAB NAVIGATION                   */}
        {/* ============================================================ */}
        <nav className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 py-2 px-3 flex items-center justify-around shadow-lg">
          {/* 1. Home */}
          <button
            onClick={() => {
              setActiveTab('HOME');
              setViewMode('HOME_FEED');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'HOME' ? 'text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px]">Home</span>
          </button>

          {/* 2. Categories */}
          <button
            onClick={() => {
              setActiveTab('CATEGORIES');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'CATEGORIES' ? 'text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <LayoutGrid className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px]">Categories</span>
          </button>

          {/* 3. Wishlist */}
          <button
            onClick={() => {
              setActiveTab('WISHLIST');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-1 relative transition-colors ${
              activeTab === 'WISHLIST' ? 'text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <Heart className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px]">Wishlist</span>
            {wishlistedProducts.length > 0 && (
              <span className="absolute -top-1 right-2 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {wishlistedProducts.length}
              </span>
            )}
          </button>

          {/* 4. Orders */}
          <button
            onClick={() => {
              setActiveTab('ORDERS');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'ORDERS' ? 'text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <Package className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px]">Orders</span>
          </button>

          {/* 5. Account */}
          <button
            onClick={() => {
              setActiveTab('ACCOUNT');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'ACCOUNT' ? 'text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <User className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px]">Account</span>
          </button>
        </nav>
      </div>

      {/* ============================================================ */}
      {/* FILTER DRAWER / MODAL (Sliders Icon)                         */}
      {/* ============================================================ */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/60 p-0 sm:p-4 backdrop-blur-2xs">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl border border-stone-200 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-stone-900" />
                <h3 className="font-serif font-bold text-base text-stone-900">Filters & Sort</h3>
              </div>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'FEATURED', label: 'Featured Styles' },
                  { id: 'PRICE_LOW', label: 'Price: Low to High' },
                  { id: 'PRICE_HIGH', label: 'Price: High to Low' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSortBy(s.id as SortOption)}
                    className={`p-2.5 rounded-xl border text-left font-medium transition-colors ${
                      sortBy === s.id
                        ? 'border-stone-950 bg-stone-950 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Availability */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-stone-800">In-Stock Only</h4>
                <p className="text-[11px] text-stone-500">Hide sold-out sizes and models</p>
              </div>
              <button
                type="button"
                onClick={() => setOnlyInStock(!onlyInStock)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  onlyInStock ? 'bg-stone-950' : 'bg-stone-200'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 left-0.5 transition-transform ${
                    onlyInStock ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSortBy('FEATURED');
                  setOnlyInStock(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
              >
                Reset
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-950 text-white text-xs font-bold shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* HAMBURGER SIDE DRAWER                                        */}
      {/* ============================================================ */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex bg-stone-950/60 backdrop-blur-2xs">
          <div className="w-72 bg-white h-full p-5 space-y-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-1">
                  <h3 className="font-serif font-black text-lg text-stone-950">Manisha Fashion</h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mb-1" />
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-1 text-stone-400 hover:text-stone-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 text-xs font-medium text-stone-700">
                <button
                  onClick={() => {
                    setActiveTab('HOME');
                    setViewMode('HOME_FEED');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-100 flex items-center justify-between"
                >
                  <span>Home</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setViewMode('LISTING');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-100 flex items-center justify-between"
                >
                  <span>All Menswear</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory('Fashion Jewellery');
                    setViewMode('LISTING');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-100 flex items-center justify-between"
                >
                  <span>Fashion Jewellery & Chokers</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory('Bangles & Kada');
                    setViewMode('LISTING');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-100 flex items-center justify-between"
                >
                  <span>Bangles & Kada</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory('Ladies Purses');
                    setViewMode('LISTING');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-100 flex items-center justify-between"
                >
                  <span>Ladies Purses & Clutches</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsLogoModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold flex items-center justify-between border border-amber-200 mt-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Change Brand Logo</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-600" />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 space-y-2 text-xs">
              <a
                href={`https://wa.me/${storeSettings.whatsapp_number}?text=Namaste%20${encodeURIComponent(storeSettings.store_name)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Helpline</span>
              </a>
              <p className="text-[10px] text-stone-400 text-center">
                {storeSettings.address}, {storeSettings.city} • All India COD
              </p>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMenuOpen(false)} />
        </div>
      )}

      {/* ============================================================ */}
      {/* SCREEN 3: PRODUCT DETAIL MODAL                               */}
      {/* ============================================================ */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          isOpen={!!detailProduct}
          onClose={() => setDetailProduct(null)}
          onAddToCart={(prod, variant, qty) => {
            onAddToCart(prod, variant, qty);
          }}
          onInstantBuy={(prod, variant, qty) => {
            onAddToCart(prod, variant, qty);
            onOpenCart();
          }}
        />
      )}

      {/* Logo & Store Branding Modal */}
      <LogoBrandingModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        onSettingsSaved={(newSettings) => setStoreSettings(newSettings)}
      />
    </div>
  );

  // Helper function to render a product card matching Screen 2
  function renderProductCard(product: Product, idx: number = 0) {
    const effectivePrice = storage.calculateEffectivePrice(product);
    const hasDiscount = effectivePrice < product.selling_price;
    const isLiked = storage.isWishlisted(product.id);
    const badgeLabel = idx % 2 === 0 ? 'New' : 'Bestseller';
    const { dots, remainder } = getColorDots(product);

    return (
      <div
        key={product.id}
        onClick={() => handleProductCardClick(product)}
        className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer"
      >
        {/* Top Image area with Top-Left Badge & Top-Right Wishlist Heart */}
        <div className="relative aspect-square w-full bg-[#f6f6f6] p-2 flex items-center justify-center overflow-hidden">
          {/* Top-Left Pill Badge: 'New' or 'Bestseller' (Screen 2) */}
          <span className="absolute top-2 left-2 bg-stone-800/85 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
            {badgeLabel}
          </span>

          {/* Top-Right Heart Wishlist Button */}
          <button
            onClick={(e) => handleToggleWishlist(e, product.id)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-stone-700 hover:text-red-500 transition-colors shadow-2xs z-10"
            aria-label="Wishlist"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isLiked ? 'fill-red-500 text-red-500' : 'stroke-[2]'
              }`}
            />
          </button>

          {/* Product Center Photo */}
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf'}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Product Details Area (Screen 2 Typography) */}
        <div className="p-3 flex flex-col flex-1 justify-between space-y-1.5">
          <div>
            <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-1">
              {product.name}
            </h4>
            <p className="text-[10px] text-stone-500 truncate mt-0.5">
              {product.fit} • {product.fabric}
            </p>
          </div>

          {/* Price, Discount & Star Rating (Screen 2) */}
          <div className="pt-1 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-bold font-mono text-stone-950">
                ₹{effectivePrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="text-[10px] text-stone-400 line-through font-mono">
                  ₹{product.selling_price.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Star Rating e.g. 4.6 ★ */}
            <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold shrink-0">
              <span>4.6</span>
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            </div>
          </div>

          {/* Color Dots Swatch Row (Screen 2) */}
          <div className="pt-1 border-t border-stone-100 flex items-center gap-1">
            {dots.map((dotColor, dIdx) => (
              <span
                key={dIdx}
                className="w-2.5 h-2.5 rounded-full border border-stone-300"
                style={{ backgroundColor: dotColor }}
              />
            ))}
            {remainder && (
              <span className="text-[9px] text-stone-400 font-medium ml-0.5">
                {remainder}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
};
