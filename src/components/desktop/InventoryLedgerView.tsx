import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Minus, 
  History, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowUpDown 
} from 'lucide-react';
import { Product, StaffUser, StockAuditLog } from '../../types';
import { storage } from '../../services/storage';

interface InventoryLedgerViewProps {
  products: Product[];
  currentUser: StaffUser;
  onRefresh: () => void;
}

export const InventoryLedgerView: React.FC<InventoryLedgerViewProps> = ({
  products,
  currentUser,
  onRefresh,
}) => {
  const permissions = storage.getUserPermissions(currentUser.role);
  const auditLogs = storage.getAuditLogs();

  const [activeTab, setActiveTab] = useState<'STOCK_MATRIX' | 'AUDIT_LOGS'>('STOCK_MATRIX');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stock adjustment modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<StockAuditLog['reason']>('MANUAL_AUDIT');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const handleOpenAdjust = (prod: Product, variantId?: string) => {
    setSelectedProduct(prod);
    setSelectedVariantId(variantId || prod.variants[0]?.id || '');
    setAdjustQty(0);
    setAdjustReason('MANUAL_AUDIT');
    setAdjustNotes('');
    setModalError(null);
    setModalSuccess(null);
  };

  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setModalError(null);
    setModalSuccess(null);

    if (adjustQty === 0) {
      setModalError('Adjustment quantity cannot be 0.');
      return;
    }

    const res = storage.adjustStock(
      selectedProduct.id,
      selectedVariantId,
      adjustQty,
      adjustReason,
      currentUser,
      adjustNotes.trim() || undefined
    );

    if (!res.success) {
      setModalError(res.error || 'Stock adjustment rejected.');
      return;
    }

    setModalSuccess(`Stock updated! New balance: ${res.newStock} units.`);
    setTimeout(() => {
      setSelectedProduct(null);
      onRefresh();
    }, 1200);
  };

  // Filter audit logs
  const filteredLogs = auditLogs.filter((log) => {
    const s = searchTerm.toLowerCase();
    return (
      log.product_name.toLowerCase().includes(s) ||
      log.variant_sku.toLowerCase().includes(s) ||
      log.performed_by_name.toLowerCase().includes(s) ||
      log.reason.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Inventory & Stock Audit Ledger</h2>
          <p className="text-xs text-stone-500">
            Real-time variant stock tracking with immutable audit trail and zero negative-stock tolerance
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('STOCK_MATRIX')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'STOCK_MATRIX'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Variant Stock Matrix
          </button>
          <button
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'AUDIT_LOGS'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit History ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'STOCK_MATRIX' ? (
        /* Variant Stock Matrix Table */
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase">
              Current Available Inventory by SKU & Size
            </span>
            <span className="text-xs text-stone-500">
              Rule: System strictly prevents negative inventory allocations
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {products.map((product) => (
              <div key={product.id} className="p-4 hover:bg-stone-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-10 h-10 rounded object-cover border border-stone-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{product.name}</h4>
                      <p className="text-xs text-stone-500">
                        Base SKU: <span className="font-mono text-stone-700">{product.sku}</span> · {product.category}
                      </p>
                    </div>
                  </div>

                  {permissions.can_edit_stock && (
                    <button
                      onClick={() => handleOpenAdjust(product)}
                      className="px-2.5 py-1 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded transition-colors self-start sm:self-auto"
                    >
                      Adjust Stock
                    </button>
                  )}
                </div>

                {/* Variants grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                  {product.variants.map((v) => (
                    <div
                      key={v.id}
                      className={`p-2 rounded border text-center ${
                        v.stock === 0
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : v.stock <= 5
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-stone-50 border-stone-200 text-stone-900'
                      }`}
                    >
                      <span className="text-[11px] font-bold block">{v.size}</span>
                      <span className="text-[10px] text-stone-500 block truncate">{v.color}</span>
                      <span className="text-sm font-extrabold mt-1 block">
                        {v.stock} <span className="text-[10px] font-normal">units</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Audit Logs History View */
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-lg border border-stone-200 flex items-center gap-3">
            <Search className="w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit ledger by shirt name, variant SKU, user, or reason..."
              className="w-full text-xs border-none focus:outline-none"
            />
          </div>

          <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-3 py-3">Product / SKU</th>
                    <th className="px-3 py-3">Size / Color</th>
                    <th className="px-3 py-3 text-center">Change</th>
                    <th className="px-3 py-3 text-center">New Balance</th>
                    <th className="px-3 py-3">Reason Code</th>
                    <th className="px-3 py-3">Performed By</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-400">
                        No stock audit entries found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50/60">
                        <td className="px-4 py-3 text-stone-500 font-mono text-[11px]">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-3 py-3 font-medium text-stone-900">
                          {log.product_name}
                          <span className="block text-[10px] font-mono text-stone-500">{log.variant_sku}</span>
                        </td>
                        <td className="px-3 py-3 text-stone-600">
                          {log.size} · {log.color}
                        </td>
                        <td className="px-3 py-3 text-center font-bold">
                          <span
                            className={log.change_qty > 0 ? 'text-emerald-700' : 'text-rose-700'}
                          >
                            {log.change_qty > 0 ? `+${log.change_qty}` : log.change_qty}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-stone-900">
                          {log.balance_qty}
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-[10px] font-semibold bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                            {log.reason}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-stone-700">{log.performed_by_name}</td>
                        <td className="px-4 py-3 text-stone-500 text-[11px] max-w-xs truncate">
                          {log.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">
              Adjust Stock: {selectedProduct.name}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Strict audit log entry will be created. Negative inventory is automatically rejected.
            </p>

            <form onSubmit={handleExecuteAdjustment} className="mt-4 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}
              {modalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Select Variant
                </label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full text-xs border border-stone-300 rounded p-2 focus:outline-none"
                >
                  {selectedProduct.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.size} ({v.color}) — Currently {v.stock} in stock
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Qty Change (+ / -)
                  </label>
                  <input
                    type="number"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                    placeholder="e.g. +10 or -2"
                    className="w-full text-sm font-bold border border-stone-300 rounded p-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Reason Code
                  </label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value as any)}
                    className="w-full text-xs border border-stone-300 rounded p-2 focus:outline-none"
                  >
                    <option value="PURCHASE_RECEIPT">Purchase Receipt (Stock-In)</option>
                    <option value="MANUAL_AUDIT">Manual Physical Audit</option>
                    <option value="DAMAGED_RETURN">Damaged / Write-off</option>
                    <option value="ORDER_CANCELLED">Order Restock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Audit Notes / Supplier Invoice Ref
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Surat textile mill shipment invoice #8491"
                  className="w-full text-xs border border-stone-300 rounded p-2 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs rounded hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded shadow"
                >
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
