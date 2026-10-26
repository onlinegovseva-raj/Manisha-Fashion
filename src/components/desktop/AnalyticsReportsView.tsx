import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Download, 
  Coins, 
  Users, 
  Layers, 
  Eye, 
  ShoppingBag, 
  ShieldCheck 
} from 'lucide-react';
import { Product, Order, StaffUser } from '../../types';
import { storage } from '../../services/storage';

interface AnalyticsReportsViewProps {
  products: Product[];
  orders: Order[];
  currentUser: StaffUser;
}

export const AnalyticsReportsView: React.FC<AnalyticsReportsViewProps> = ({
  products,
  orders,
  currentUser,
}) => {
  const permissions = storage.getUserPermissions(currentUser.role);
  const analyticsEvents = storage.getAnalyticsEvents();

  // Campaign URL Generator State
  const [utmSource, setUtmSource] = useState('whatsapp');
  const [utmCampaign, setUtmCampaign] = useState('diwali_festive_sale');
  const [copiedLink, setCopiedLink] = useState(false);

  const baseUrl = window.location.origin;
  const generatedCampaignUrl = `${baseUrl}/?utm_source=${encodeURIComponent(
    utmSource
  )}&utm_campaign=${encodeURIComponent(utmCampaign)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedCampaignUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Funnel Metrics
  const totalSessions = Math.max(1, new Set(analyticsEvents.map((e) => e.session_id)).size);
  const productViews = analyticsEvents.filter((e) => e.event_type === 'PRODUCT_VIEW').length;
  const cartAdds = analyticsEvents.filter((e) => e.event_type === 'ADD_TO_CART').length;
  const checkoutsStarted = analyticsEvents.filter((e) => e.event_type === 'CHECKOUT_START').length;
  const completedOrders = orders.filter((o) => o.order_status !== 'CANCELLED');

  // Conversion rates
  const viewToCartRate = productViews > 0 ? Math.round((cartAdds / productViews) * 100) : 0;
  const cartToOrderRate = cartAdds > 0 ? Math.round((completedOrders.length / cartAdds) * 100) : 0;

  // Financial P&L
  let totalSales = 0;
  let totalCogs = 0; // Cost of Goods Sold
  let totalShippingIncome = 0;

  completedOrders.forEach((o) => {
    totalSales += o.subtotal;
    totalShippingIncome += o.shipping_fee;
    o.items.forEach((item) => {
      totalCogs += item.purchase_cost * item.quantity;
    });
  });

  const estimatedGrossProfit = Math.max(0, totalSales - totalCogs);
  const grossProfitMargin = totalSales > 0 ? Math.round((estimatedGrossProfit / totalSales) * 100) : 0;

  // Inventory Valuation
  let totalUnits = 0;
  let totalInventoryCostValue = 0;
  let totalInventoryRetailValue = 0;

  products.forEach((p) => {
    p.variants.forEach((v) => {
      totalUnits += v.stock;
      totalInventoryCostValue += v.stock * p.purchase_cost;
      totalInventoryRetailValue += v.stock * p.selling_price;
    });
  });

  // Top Selling Products
  const productSalesMap: Record<string, { name: string; sku: string; qty: number; revenue: number }> = {};
  completedOrders.forEach((o) => {
    o.items.forEach((item) => {
      if (!productSalesMap[item.product_id]) {
        productSalesMap[item.product_id] = {
          name: item.product_name,
          sku: item.variant_sku,
          qty: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.product_id].qty += item.quantity;
      productSalesMap[item.product_id].revenue += item.unit_price * item.quantity;
    });
  });

  const topSellingList = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty);

  // CSV Export for Reports
  const handleExportReportsCSV = () => {
    const lines = [
      'Manisha Fashion - Executive Management Report',
      `Generated Date,${new Date().toISOString()}`,
      `Total Completed Orders,${completedOrders.length}`,
      `Total Net Revenue (INR),${totalSales}`,
      `Total COGS (INR),${permissions.can_view_cost_price ? totalCogs : 'RESTRICTED'}`,
      `Estimated Gross Profit (INR),${permissions.can_view_cost_price ? estimatedGrossProfit : 'RESTRICTED'}`,
      `Gross Profit Margin (%),${permissions.can_view_cost_price ? grossProfitMargin : 'RESTRICTED'}%`,
      `Total Units in Inventory,${totalUnits}`,
      `Total Inventory Cost Value (INR),${permissions.can_view_cost_price ? totalInventoryCostValue : 'RESTRICTED'}`,
      `Total Inventory Retail Value (INR),${totalInventoryRetailValue}`,
      '',
      'Top Selling Products by Volume:',
      'Product Name,SKU,Units Sold,Gross Revenue (INR)',
      ...topSellingList.map((item) => `"${item.name}","${item.sku}",${item.qty},${item.revenue}`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Manisha_Fashion_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-stone-900">Analytics & Financial Reports</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Privacy-safe storefront funnel tracking, campaign UTM generator, and gross profit accounting.
          </p>
        </div>

        <button
          onClick={handleExportReportsCSV}
          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Financial CSV</span>
        </button>
      </div>

      {/* Marketing UTM Link Generator for WhatsApp, Instagram, Facebook */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent p-5 rounded-lg border border-amber-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-amber-700" />
          <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
            Omnichannel Campaign Link Generator
          </h3>
        </div>
        <p className="text-xs text-stone-600">
          Create tagged links for WhatsApp broadcasts, Instagram bio, and Facebook promotions to measure real conversion without invasive user tracking.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Marketing Channel
            </label>
            <select
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              className="w-full border border-stone-300 rounded p-1.5 bg-white font-medium focus:outline-none"
            >
              <option value="whatsapp">WhatsApp Broadcast / Catalog</option>
              <option value="instagram">Instagram Bio / Story Link</option>
              <option value="facebook">Facebook Group / Post</option>
              <option value="sms">Direct SMS Notification</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Campaign Tag / Occasion
            </label>
            <input
              type="text"
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              placeholder="e.g. diwali_festive_sale"
              className="w-full border border-stone-300 rounded p-1.5 bg-white font-mono focus:outline-none"
            />
          </div>

          <div className="sm:col-span-1 flex flex-col justify-end">
            <button
              onClick={handleCopyLink}
              className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied to Clipboard!' : 'Copy Campaign Link'}</span>
            </button>
          </div>
        </div>

        <div className="p-2 bg-white/80 rounded border border-amber-200/80 font-mono text-[11px] text-stone-700 truncate select-all">
          {generatedCampaignUrl}
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Revenue */}
        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
          <span className="text-[11px] font-semibold text-stone-500 uppercase">Net Product Revenue</span>
          <p className="text-2xl font-bold text-stone-900 mt-2">
            ₹{totalSales.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-stone-500 mt-1 block">
            From {completedOrders.length} confirmed orders
          </span>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
          <span className="text-[11px] font-semibold text-stone-500 uppercase">Estimated Gross Profit</span>
          {permissions.can_view_cost_price ? (
            <>
              <p className="text-2xl font-bold text-emerald-800 mt-2">
                ₹{estimatedGrossProfit.toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
                {grossProfitMargin}% Profit Margin on Goods Sold
              </span>
            </>
          ) : (
            <div className="text-xs text-stone-400 mt-4 italic">Restricted by Role</div>
          )}
        </div>

        {/* Inventory Cost Valuation */}
        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
          <span className="text-[11px] font-semibold text-stone-500 uppercase">Stock Valuation (Cost)</span>
          {permissions.can_view_cost_price ? (
            <>
              <p className="text-2xl font-bold text-stone-900 mt-2">
                ₹{totalInventoryCostValue.toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-stone-500 mt-1 block">
                Capital tied in {totalUnits} clothing units
              </span>
            </>
          ) : (
            <div className="text-xs text-stone-400 mt-4 italic">Restricted by Role</div>
          )}
        </div>

        {/* Inventory Retail Potential */}
        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
          <span className="text-[11px] font-semibold text-stone-500 uppercase">Stock Valuation (Retail)</span>
          <p className="text-2xl font-bold text-stone-900 mt-2">
            ₹{totalInventoryRetailValue.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Potential gross realized upon sell-through
          </span>
        </div>
      </div>

      {/* Two Columns: Conversion Funnel & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storefront Conversion Funnel */}
        <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
              Storefront Shopping Funnel
            </h3>
            <span className="text-[10px] text-stone-500">100% Privacy-Preserving (No PII)</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700">1. Storefront Visitors / Sessions</span>
                <span className="font-mono font-bold text-stone-900">{totalSessions} sessions</span>
              </div>
              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                <div className="bg-stone-800 h-full w-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700">2. Product Views</span>
                <span className="font-mono font-bold text-stone-900">{productViews} views</span>
              </div>
              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(15, (productViews / totalSessions) * 100))}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700">3. Items Added to Cart</span>
                <span className="font-mono font-bold text-stone-900">{cartAdds} cart events</span>
              </div>
              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(10, viewToCartRate))}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700">4. Purchases Completed</span>
                <span className="font-mono font-bold text-stone-900">{completedOrders.length} orders</span>
              </div>
              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-800 h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, (completedOrders.length / totalSessions) * 100))}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Shirts */}
        <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
              Best-Selling Clothing Items
            </h3>
            <span className="text-[11px] text-stone-500">By sales volume</span>
          </div>

          <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto text-xs">
            {topSellingList.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                No completed orders yet.
              </div>
            ) : (
              topSellingList.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-stone-50">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-stone-400 w-5 text-center">#{idx + 1}</span>
                    <div>
                      <p className="font-bold text-stone-900">{item.name}</p>
                      <p className="text-[10px] text-stone-500 font-mono">SKU: {item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-900 block">{item.qty} sold</span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      ₹{item.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
