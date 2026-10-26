import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Sparkles, 
  Truck, 
  CreditCard, 
  Users, 
  BarChart3, 
  RefreshCw, 
  ExternalLink,
  Settings 
} from 'lucide-react';
import { Product, Order, StaffUser } from '../../types';
import { storage } from '../../services/storage';

import { DashboardView } from './DashboardView';
import { ProductManagementView } from './ProductManagementView';
import { InventoryLedgerView } from './InventoryLedgerView';
import { AIImageStudioView } from './AIImageStudioView';
import { OrdersDispatchView } from './OrdersDispatchView';
import { PaymentsUpiView } from './PaymentsUpiView';
import { StaffRbacView } from './StaffRbacView';
import { AnalyticsReportsView } from './AnalyticsReportsView';
import { SyncBackupView } from './SyncBackupView';
import { StoreSettingsView } from './StoreSettingsView';

interface DesktopLayoutProps {
  products: Product[];
  orders: Order[];
  currentUser: StaffUser;
  staffList: StaffUser[];
  isOnline: boolean;
  onRefresh: () => void;
  onOpenStorefront: () => void;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  products,
  orders,
  currentUser,
  staffList,
  isOnline,
  onRefresh,
  onOpenStorefront,
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [aiStudioInitialImage, setAiStudioInitialImage] = useState<string | undefined>(undefined);

  const [storeSettings, setStoreSettings] = useState(storage.getStoreSettings());

  const outboxCount = storage.getOutbox().length;
  const pendingOrdersCount = orders.filter(
    (o) => o.order_status === 'CONFIRMED' || o.order_status === 'PACKED'
  ).length;

  const handleOpenAIStudio = (imageUrl: string) => {
    setAiStudioInitialImage(imageUrl);
    setActiveTab('ai_studio');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'products', label: 'Catalogue', icon: Package, badge: products.length },
    { id: 'inventory', label: 'Inventory', icon: Layers, badge: null },
    { id: 'ai_studio', label: 'AI Studio', icon: Sparkles, badge: 'AI', highlight: true },
    { id: 'orders', label: 'Dispatch', icon: Truck, badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: null },
    { id: 'staff', label: 'Staff', icon: Users, badge: null },
    { id: 'analytics', label: 'Reports', icon: BarChart3, badge: null },
    { id: 'sync', label: 'Sync & Backup', icon: RefreshCw, badge: outboxCount > 0 ? outboxCount : null },
    { id: 'settings', label: 'Store & Logo', icon: Settings, badge: null },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)] bg-stone-100">
      {/* Mobile Top Horizontal Scroll Tab Bar (Visible on mobile/tablet) */}
      <div className="md:hidden bg-white border-b border-stone-200 px-2 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none shadow-xs sticky top-12 z-30">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge !== null && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded-full font-extrabold ${
                    isActive ? 'bg-amber-900 text-white' : 'bg-stone-200 text-stone-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop Left Sidebar (Visible on Desktop md+) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-stone-200 flex-col shrink-0">
        <div className="p-4 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              {storeSettings.logo_url ? (
                <img
                  src={storeSettings.logo_url}
                  alt={storeSettings.store_name}
                  className="w-8 h-8 rounded-lg object-contain bg-stone-50 border border-stone-200 shrink-0 p-0.5"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-white font-serif font-black flex items-center justify-center shrink-0 text-sm">
                  {storeSettings.store_name.charAt(0) || 'M'}
                </div>
              )}
              <div className="truncate">
                <p className="font-bold text-xs text-stone-900 uppercase tracking-wider truncate">
                  {storeSettings.store_name}
                </p>
                <p className="text-[10px] text-stone-500 truncate">{storeSettings.city} • ERP POS</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              title="Change Store Logo & Brand"
              className="p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : item.highlight ? 'text-amber-600' : 'text-stone-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-amber-800 text-white'
                        : item.highlight
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick link to Open Public Storefront in new tab / view */}
        <div className="p-3 border-t border-stone-200 bg-stone-50/70">
          <button
            onClick={onOpenStorefront}
            className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <span>Preview Public Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <div className="mt-2 text-center text-[10px] text-stone-500">
            Current User: <span className="font-semibold text-stone-800">{currentUser.name}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area: Responsive Padding */}
      <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            products={products}
            orders={orders}
            currentUser={currentUser}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'products' && (
          <ProductManagementView
            products={products}
            currentUser={currentUser}
            onRefresh={onRefresh}
            onOpenAIStudioWithImage={handleOpenAIStudio}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryLedgerView
            products={products}
            currentUser={currentUser}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === 'ai_studio' && (
          <AIImageStudioView
            products={products}
            initialImageUrl={aiStudioInitialImage}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersDispatchView
            orders={orders}
            currentUser={currentUser}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsUpiView
            orders={orders}
            currentUser={currentUser}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === 'staff' && (
          <StaffRbacView
            staffList={staffList}
            currentUser={currentUser}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsReportsView
            products={products}
            orders={orders}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'sync' && (
          <SyncBackupView
            currentUser={currentUser}
            isOnline={isOnline}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === 'settings' && (
          <StoreSettingsView
            currentUser={currentUser}
            onRefresh={() => {
              setStoreSettings(storage.getStoreSettings());
              onRefresh();
            }}
            onOpenStorefront={onOpenStorefront}
          />
        )}
      </main>
    </div>
  );
};
