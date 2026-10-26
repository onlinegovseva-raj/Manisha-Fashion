import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { Product, ProductVariant } from '../../types';

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (variantId: string, delta: number) => void;
  onRemoveItem: (variantId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.selling_price * item.quantity,
    0
  );
  const freeShippingThreshold = 999;
  const shippingFee = subtotal >= freeShippingThreshold || items.length === 0 ? 0 : 79;
  const grandTotal = subtotal + shippingFee;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-stone-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-stone-900 text-sm">
              Your Shopping Cart ({items.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        {subtotal < freeShippingThreshold && items.length > 0 && (
          <div className="bg-amber-50 px-4 py-2 text-[11px] text-amber-900 border-b border-amber-100 flex items-center justify-between">
            <span>Add ₹{(freeShippingThreshold - subtotal).toLocaleString('en-IN')} more for <strong>FREE India Shipping</strong>!</span>
            <span className="font-bold">₹{subtotal} / ₹{freeShippingThreshold}</span>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-stone-100 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <ShoppingBag className="w-12 h-12 text-stone-300 mb-3" />
              <p className="text-sm font-semibold text-stone-700">Your cart is currently empty</p>
              <p className="text-xs text-stone-400 mt-1 max-w-xs">
                Explore our fine cotton & linen menswear collection to add shirts to your bag.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-stone-900 text-white rounded text-xs font-bold"
              >
                Start Browsing
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.variant.id} className="pt-3 flex gap-3">
                <img
                  src={item.product.images[0] || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf'}
                  alt={item.product.name}
                  className="w-16 h-16 rounded object-cover border border-stone-200 shrink-0 bg-stone-100"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Size: <span className="font-semibold text-stone-800">{item.variant.size}</span> · {item.variant.color}
                  </p>
                  <p className="text-xs font-bold text-stone-900 mt-1 font-mono">
                    ₹{item.product.selling_price.toLocaleString('en-IN')}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-stone-200 rounded">
                      <button
                        onClick={() => onUpdateQty(item.variant.id, -1)}
                        className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-stone-900">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(item.variant.id, 1)}
                        disabled={item.quantity >= item.variant.stock}
                        className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 text-xs font-bold disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.variant.id)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {items.length > 0 && (
          <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-mono text-stone-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Delivery:</span>
                <span className="font-mono text-emerald-700">
                  {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-stone-900 border-t border-stone-200 pt-1.5">
                <span>Total Amount:</span>
                <span className="text-amber-900 font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow transition-colors"
            >
              <span>Proceed to Fast Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-stone-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cash on Delivery (COD) & Direct UPI Available</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
