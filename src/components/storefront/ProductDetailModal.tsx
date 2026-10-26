import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  ShoppingBag, 
  Star, 
  Check, 
  MessageSquare, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  X 
} from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { storage } from '../../services/storage';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  onInstantBuy?: (product: Product, variant: ProductVariant, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onInstantBuy,
}) => {
  if (!isOpen || !product) return null;

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id || ''
  );
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(() =>
    storage.isWishlisted(product.id)
  );
  const [shareNotice, setShareNotice] = useState(false);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const effectivePrice = storage.calculateEffectivePrice(product);
  const hasDiscount = effectivePrice < product.selling_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.selling_price - effectivePrice) / product.selling_price) * 100)
    : 0;

  const handleToggleWishlist = () => {
    storage.toggleWishlist(product.id);
    setIsWishlisted(!isWishlisted);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on Manisha Fashion for ₹${effectivePrice}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareNotice(true);
      setTimeout(() => setShareNotice(false), 2000);
    }
  };

  const handleAddToCartClick = () => {
    if (!selectedVariant || selectedVariant.stock <= 0) return;
    onAddToCart(product, selectedVariant, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleBuyNowClick = () => {
    if (!selectedVariant || selectedVariant.stock <= 0) return;
    if (onInstantBuy) {
      onInstantBuy(product, selectedVariant, quantity);
    } else {
      onAddToCart(product, selectedVariant, quantity);
      // Fallback: direct WhatsApp buy
      const text = encodeURIComponent(
        `Namaste Manisha Fashion! I want to BUY NOW:\n*${product.name}*\nSize: ${selectedVariant.size}\nColor: ${selectedVariant.color}\nPrice: ₹${effectivePrice}\nQuantity: ${quantity}`
      );
      window.open(`https://wa.me/919820112345?text=${text}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-0 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl min-h-screen sm:min-h-0 sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-screen sm:max-h-[94vh]">
        {/* Top Navigation Bar: Back, Title, Share & Wishlist (Reference Screen 3) */}
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <span className="font-bold text-xs uppercase tracking-widest text-stone-500 truncate max-w-[180px]">
            {product.category}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors"
              title="Share product"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleWishlist}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isWishlisted ? 'text-rose-600 bg-rose-50' : 'text-stone-700 hover:bg-stone-100'
              }`}
              title="Add to wishlist"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
            </button>
          </div>
        </div>

        {shareNotice && (
          <div className="bg-stone-900 text-white text-[11px] text-center py-1.5 animate-in fade-in">
            Product link copied to clipboard!
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Visual Display (Vertical Thumbnails on left + Hero Canvas) */}
          <div className="flex gap-3">
            {/* Left Vertical Thumbnail Strip (Reference Screen 3) */}
            {product.images.length > 1 && (
              <div className="flex flex-col gap-2 shrink-0">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all bg-stone-50 ${
                      selectedImageIdx === idx
                        ? 'border-stone-900 shadow-xs'
                        : 'border-stone-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Big Main Image Container with Studio Backdrop */}
            <div className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-stone-100 to-stone-200/80 border border-stone-200 flex items-center justify-center p-3">
              <img
                src={product.images[selectedImageIdx] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300"
              />

              {/* Floating Quality Stamp (Top Right - Reference Screen 3) */}
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs border border-stone-200 rounded-full px-2.5 py-1 flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-800">
                  {product.category.includes('Jewellery') || product.category.includes('Bangles')
                    ? 'HANDCRAFTED'
                    : 'PREMIUM COTTON'}
                </span>
              </div>

              {/* Pagination Dots (Reference Screen 3) */}
              <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1.5">
                {(product.images.length > 1 ? product.images : [0, 1, 2]).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === selectedImageIdx ? 'w-4 bg-stone-900' : 'bg-stone-400/60'
                    }`}
                  ></span>
                ))}
              </div>
            </div>
          </div>

          {/* Product Title & Rating */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 leading-snug">
                {product.name}
              </h2>
              {/* Star Rating Badge (Reference Screen 3) */}
              <div className="flex items-center gap-1 shrink-0 bg-stone-50 px-2 py-1 rounded-lg border border-stone-200">
                <span className="font-bold text-xs text-stone-900">4.6</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </div>
            </div>

            <p className="text-xs text-stone-500">
              {product.fit} · {product.fabric}
            </p>
            <p className="text-[11px] text-stone-400">
              (523 verified buyer ratings)
            </p>
          </div>

          {/* Pricing Row with Discount Pill (Reference Screen 3) */}
          <div className="flex items-baseline gap-2.5 pt-1">
            <span className="text-2xl font-extrabold text-stone-900 font-mono">
              ₹{effectivePrice.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-stone-400 line-through font-mono">
                  ₹{product.selling_price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold bg-emerald-900 text-emerald-100 px-2 py-0.5 rounded-md">
                  {discountPercent}% OFF
                </span>
              </>
            )}
            <span className="text-[11px] text-stone-500 ml-auto">
              (All GST Taxes Included)
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-stone-600 leading-relaxed pt-1">
            {product.description}
          </p>

          {/* Select Size Section (Reference Screen 3) */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-900">Select Size</span>
              <button
                type="button"
                onClick={() => setShowSizeGuide(!showSizeGuide)}
                className="text-stone-500 hover:text-stone-900 text-[11px] font-semibold underline"
              >
                Size guide →
              </button>
            </div>

            {/* Size guide popup */}
            {showSizeGuide && (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] space-y-1 text-stone-700">
                <p className="font-bold text-stone-900">Standard Measurements (Inches):</p>
                <p>· S / 38: Chest 38"-40", Shoulder 17.5", Length 29"</p>
                <p>· M / 40: Chest 40"-42", Shoulder 18.2", Length 29.5"</p>
                <p>· L / 42: Chest 42"-44", Shoulder 19.0", Length 30"</p>
                <p>· XL / 44: Chest 44"-46", Shoulder 19.8", Length 30.5"</p>
                <p>· Bangles: 2.4 (Small), 2.6 (Medium), 2.8 (Large)</p>
              </div>
            )}

            {/* Size Buttons (Exact style from Reference Screen 3: S, M, L active solid dark) */}
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const isSelected = v.id === selectedVariantId;
                const isOutOfStock = v.stock <= 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`min-w-12 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isOutOfStock
                        ? 'bg-stone-100 text-stone-300 border border-stone-200 line-through cursor-not-allowed'
                        : isSelected
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-white border border-stone-300 text-stone-800 hover:border-stone-500'
                    }`}
                  >
                    {v.size.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Color Swatches (Reference Screen 3) */}
          <div className="space-y-2 pt-1">
            <span className="font-bold text-xs text-stone-900 block">Select Color</span>
            <div className="flex items-center gap-2">
              {product.variants.map((v) => {
                const isSelected = v.id === selectedVariantId;
                const colorCode = v.color_code || '#1e3a8a';

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-stone-900 ring-offset-2' : 'hover:scale-105'
                    }`}
                    title={`${v.color} (${v.size})`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-stone-300 block shadow-2xs"
                      style={{ backgroundColor: colorCode }}
                    ></span>
                  </button>
                );
              })}
              {product.variants.length > 3 && (
                <span className="text-[11px] text-stone-500 font-medium ml-1">
                  +{product.variants.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Delivery & Guarantees */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1 text-stone-600">
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-amber-700" />
              <span><strong>Free Pan-India Delivery</strong> on orders over ₹999</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Cash on Delivery (COD) & Direct UPI Available</span>
            </div>
          </div>

          {addedNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center text-xs font-semibold animate-pulse">
              ✓ Added to cart successfully!
            </div>
          )}
        </div>

        {/* Bottom Dual Action Bar: Add to Cart (White/Border) & Buy Now (Solid Dark) (Reference Screen 3) */}
        <div className="p-4 border-t border-stone-200 bg-white grid grid-cols-2 gap-3 sticky bottom-0 z-10 shadow-lg">
          <button
            type="button"
            disabled={!selectedVariant || selectedVariant.stock <= 0}
            onClick={handleAddToCartClick}
            className="py-3 px-4 border border-stone-900 rounded-xl text-stone-900 font-bold text-xs flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>

          <button
            type="button"
            disabled={!selectedVariant || selectedVariant.stock <= 0}
            onClick={handleBuyNowClick}
            className="py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors disabled:opacity-50"
          >
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
