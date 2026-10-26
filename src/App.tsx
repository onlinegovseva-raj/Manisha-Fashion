import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { Product, ProductVariant, Order, StaffUser } from './types';
import { Navbar, AppMode } from './components/Navbar';
import { DesktopLayout } from './components/desktop/DesktopLayout';
import { StorefrontView } from './components/storefront/StorefrontView';
import { CartDrawer, CartItem } from './components/storefront/CartDrawer';
import { CheckoutModal } from './components/storefront/CheckoutModal';
import { OrderSuccessModal } from './components/storefront/OrderSuccessModal';
import { TestRunnerView } from './components/tests/TestRunnerView';
import { DocumentationView } from './components/docs/DocumentationView';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('DESKTOP');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [currentUser, setCurrentUser] = useState<StaffUser>(storage.getCurrentUser());
  const [isOnline, setIsOnline] = useState<boolean>(storage.isOnline());
  const [outboxCount, setOutboxCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Storefront shopping cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const loadData = () => {
    setProducts(storage.getProducts());
    setOrders(storage.getOrders());
    setStaffList(storage.getStaff());
    setCurrentUser(storage.getCurrentUser());
    setIsOnline(storage.isOnline());
    setOutboxCount(storage.getOutbox().length);
  };

  useEffect(() => {
    loadData();

    // Listen to online/offline browser events
    const handleNetworkChange = () => {
      setIsOnline(storage.isOnline());
    };
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, []);

  const handleToggleOnline = () => {
    const newState = !isOnline;
    storage.setOnlineSimulation(newState);
    setIsOnline(newState);
  };

  const handleTriggerSync = async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    try {
      await storage.runSync();
      loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUserChange = (user: StaffUser) => {
    storage.setCurrentUser(user);
    setCurrentUser(user);
  };

  // Cart operations
  const handleAddToCart = (product: Product, variant: ProductVariant, quantity: number) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.variant.id === variant.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = Math.min(variant.stock, updated[existingIdx].quantity + quantity);
        updated[existingIdx] = { ...updated[existingIdx], quantity: newQty };
        return updated;
      } else {
        return [...prev, { product, variant, quantity }];
      }
    });

    // Record analytics event
    storage.recordAnalyticsEvent({
      event_type: 'ADD_TO_CART',
      product_id: product.id,
      product_name: product.name,
      value: product.selling_price * quantity,
    });
  };

  const handleUpdateCartQty = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variant.id === variantId) {
            const newQty = item.quantity + delta;
            return {
              ...item,
              quantity: Math.min(item.variant.stock, Math.max(0, newQty)),
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variant.id !== variantId));
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    storage.recordAnalyticsEvent({
      event_type: 'CHECKOUT_START',
      value: cart.reduce((s, i) => s + i.product.selling_price * i.quantity, 0),
    });
  };

  const handleOrderSuccess = (newOrder: Order) => {
    setConfirmedOrder(newOrder);
    setCart([]);
    loadData();
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Global Navigation with Mode Switching */}
      <Navbar
        currentMode={currentMode}
        onModeChange={(m) => setCurrentMode(m)}
        currentUser={currentUser}
        onUserChange={handleUserChange}
        staffList={staffList}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        outboxCount={outboxCount}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Mode View */}
      <div className="flex-1">
        {currentMode === 'DESKTOP' && (
          <DesktopLayout
            products={products}
            orders={orders}
            currentUser={currentUser}
            staffList={staffList}
            isOnline={isOnline}
            onRefresh={loadData}
            onOpenStorefront={() => setCurrentMode('STOREFRONT')}
          />
        )}

        {currentMode === 'STOREFRONT' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
            <StorefrontView
              products={products}
              onAddToCart={handleAddToCart}
              onOpenCart={() => setIsCartOpen(true)}
              cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
            />
          </div>
        )}

        {currentMode === 'TESTS' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
            <TestRunnerView />
          </div>
        )}

        {currentMode === 'DOCS' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
            <DocumentationView />
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Success Confirmation Modal */}
      <OrderSuccessModal
        isOpen={!!confirmedOrder}
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
      />
    </div>
  );
}
