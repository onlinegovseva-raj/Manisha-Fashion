import React from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  Truck, 
  CheckCircle2, 
  ArrowUpRight, 
  Clock, 
  Coins, 
  Layers 
} from 'lucide-react';
import { Product, Order, StaffUser } from '../../types';
import { storage } from '../../services/storage';

interface DashboardViewProps {
  products: Product[];
  orders: Order[];
  currentUser: StaffUser;
  onNavigateTab: (tabId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  orders,
  currentUser,
  onNavigateTab,
}) => {
  const permissions = storage.getUserPermissions(currentUser.role);

  // Calculate metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.payment_status === 'PAID' || o.payment_method === 'COD' ? o.total_amount : 0), 0);
  
  // Gross Profit calculation (only if authorized)
  let totalCost = 0;
  let totalSalesForProfit = 0;
  orders.forEach((o) => {
    if (o.order_status !== 'CANCELLED' && o.order_status !== 'RETURNED') {
      o.items.forEach((item) => {
        totalCost += item.purchase_cost * item.quantity;
        totalSalesForProfit += item.unit_price * item.quantity;
      });
    }
  });
  const estimatedGrossProfit = Math.max(0, totalSalesForProfit - totalCost);
  const profitMarginPercent = totalSalesForProfit > 0 ? Math.round((estimatedGrossProfit / totalSalesForProfit) * 100) : 0;

  // Inventory stats
  const totalUnitsInStock = products.reduce(
    (sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stock, 0),
    0
  );

  // Low stock variants (<= 5 units)
  const lowStockItems: { productName: string; variantSku: string; size: string; color: string; stock: number }[] = [];
  products.forEach((p) => {
    p.variants.forEach((v) => {
      if (v.stock <= 5) {
        lowStockItems.push({
          productName: p.name,
          variantSku: v.sku,
          size: v.size,
          color: v.color,
          stock: v.stock,
        });
      }
    });
  });

  // Pending dispatches
  const pendingDispatches = orders.filter((o) => o.order_status === 'CONFIRMED' || o.order_status === 'PACKED');

  return (
    <div className="space-y-6">
      {/* Top Banner & Welcome */}
      <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-amber-700 font-semibold">
            Manisha Fashion · Desktop Operations
          </span>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">
            Namaste, {currentUser.name}
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Role: <span className="font-medium text-stone-800">{currentUser.role}</span> · All desktop operations run 100% offline with local storage sync.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('orders')}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Process Dispatches ({pendingDispatches.length})</span>
          </button>
          {permissions.can_edit_products && (
            <button
              onClick={() => onNavigateTab('products')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span>Add New Shirt</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white rounded-lg p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Gross Sales</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-900 mt-2">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
            <span>{totalOrders} total orders recorded</span>
          </div>
        </div>

        {/* Estimated Gross Profit (Protected for Owner/Manager) */}
        <div className="bg-white rounded-lg p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Est. Gross Profit</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          {permissions.can_view_cost_price ? (
            <>
              <p className="text-2xl font-bold text-stone-900 mt-2">
                ₹{estimatedGrossProfit.toLocaleString('en-IN')}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>~{profitMarginPercent}% Margin on Goods Sold</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-stone-400 mt-3 italic">
                Restricted by Role ({currentUser.role})
              </p>
              <p className="text-xs text-stone-400 mt-1">Requires Owner or Manager privileges</p>
            </>
          )}
        </div>

        {/* Inventory Stock Count */}
        <div className="bg-white rounded-lg p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Total Units in Stock</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-900 mt-2">
            {totalUnitsInStock} <span className="text-sm font-normal text-stone-500">pieces</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
            <span>Across {products.length} active clothing SKUs</span>
          </div>
        </div>

        {/* Pending Dispatches */}
        <div className="bg-white rounded-lg p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Dispatch Queue</span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-900 mt-2">
            {pendingDispatches.length} <span className="text-sm font-normal text-stone-500">pending</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
            <span>Ready for courier label generation</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Low Stock Warnings & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-stone-900">Low Stock Variant Alerts</h3>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
            >
              Open Inventory Ledger →
            </button>
          </div>
          <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
            {lowStockItems.length === 0 ? (
              <div className="p-6 text-center text-stone-400 text-sm">
                No low stock variants. All inventory levels healthy!
              </div>
            ) : (
              lowStockItems.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-stone-900">{item.productName}</p>
                    <p className="text-[11px] text-stone-500">
                      SKU: {item.variantSku} · Size: <span className="font-medium text-stone-700">{item.size}</span> · Color: {item.color}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {item.stock} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders Overview */}
        <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-stone-700" />
              <h3 className="text-sm font-bold text-stone-900">Recent Customer Orders</h3>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-stone-700 hover:text-stone-900 font-semibold"
            >
              View All Orders →
            </button>
          </div>
          <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">{order.order_number}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-stone-100 text-stone-600">
                      {order.payment_method}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {order.customer.name} ({order.customer.city}) · {order.items.length} item(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-stone-900">₹{order.total_amount.toLocaleString('en-IN')}</p>
                  <span className={`text-[10px] font-semibold uppercase ${
                    order.order_status === 'DELIVERED' ? 'text-emerald-600' :
                    order.order_status === 'DISPATCHED' ? 'text-blue-600' :
                    order.order_status === 'CANCELLED' ? 'text-rose-600' : 'text-amber-600'
                  }`}>
                    {order.order_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
