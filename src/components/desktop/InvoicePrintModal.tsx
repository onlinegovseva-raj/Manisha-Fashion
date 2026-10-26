import React from 'react';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { Order } from '../../types';
import { storage } from '../../services/storage';

interface InvoicePrintModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const storeSettings = storage.getStoreSettings();

  const handlePrint = () => {
    window.print();
  };

  // Indian GST calculations (Assuming 5% GST standard on apparel <= ₹1,000 and 12% > ₹1,000)
  const gstRate = 5; // Apparel GST standard rate
  const taxableAmount = Math.round((order.subtotal * 100) / (100 + gstRate));
  const totalGst = order.subtotal - taxableAmount;
  const isInterstate = order.customer.state.toLowerCase() !== 'maharashtra'; // Assuming Manisha Fashion base is Maharashtra (Mumbai)
  const cgst = isInterstate ? 0 : Math.round(totalGst / 2);
  const sgst = isInterstate ? 0 : Math.round(totalGst / 2);
  const igst = isInterstate ? totalGst : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-lg max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto print:border-none print:shadow-none print:max-w-none">
        {/* Modal Toolbar (hidden on print) */}
        <div className="px-6 py-3 border-b border-stone-200 flex items-center justify-between bg-stone-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-stone-900">
              Tax Invoice & Packing Slip: {order.order_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 text-stone-800 text-xs space-y-6 bg-white">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-stone-300 pb-5">
            <div className="flex items-start gap-3">
              {storeSettings.logo_url ? (
                <img
                  src={storeSettings.logo_url}
                  alt={storeSettings.store_name}
                  className="w-14 h-14 rounded object-contain border border-stone-200 p-0.5 bg-white shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-stone-900 text-white font-serif font-black text-xl flex items-center justify-center shrink-0">
                  {storeSettings.store_name.charAt(0) || 'M'}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold font-serif text-stone-900 tracking-wide">
                  {storeSettings.store_name.toUpperCase()}
                </h1>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  {storeSettings.tagline}
                </p>
                <p className="text-[11px] text-stone-500">
                  {storeSettings.address}, {storeSettings.city}, {storeSettings.state} {storeSettings.pincode}
                </p>
                <p className="text-[11px] text-stone-500">
                  GSTIN: <span className="font-mono font-semibold text-stone-800">27AABCM9102K1ZP</span> · Contact: {storeSettings.phone}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-stone-100 text-stone-800 font-bold uppercase tracking-wider text-[11px] rounded mb-2">
                ORIGINAL TAX INVOICE
              </span>
              <p className="font-bold text-sm text-stone-900">Invoice: {order.order_number}</p>
              <p className="text-stone-500 text-[11px]">
                Date:{' '}
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <p className="text-stone-500 text-[11px]">
                Payment: <strong className="text-stone-800">{order.payment_method}</strong> ({order.payment_status})
              </p>
            </div>
          </div>

          {/* Billed To / Shipped To */}
          <div className="grid grid-cols-2 gap-6 bg-stone-50/60 p-4 rounded border border-stone-200">
            <div>
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-stone-500 mb-1">
                BILLED TO / CUSTOMER DETAILS
              </h4>
              <p className="font-bold text-stone-900 text-sm">{order.customer.name}</p>
              <p className="text-stone-600">Phone: {order.customer.phone}</p>
              {order.customer.email && <p className="text-stone-600">Email: {order.customer.email}</p>}
            </div>

            <div>
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-stone-500 mb-1">
                DELIVERY SHIPPING ADDRESS
              </h4>
              <p className="text-stone-800">{order.customer.address_line1}</p>
              {order.customer.address_line2 && <p className="text-stone-800">{order.customer.address_line2}</p>}
              <p className="font-semibold text-stone-900">
                {order.customer.city}, {order.customer.state} — {order.customer.pincode}
              </p>
              {order.courier_name && (
                <p className="text-[11px] text-stone-600 mt-1">
                  Courier: <strong>{order.courier_name}</strong> (AWB:{' '}
                  <span className="font-mono">{order.tracking_number || 'Pending'}</span>)
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse border border-stone-200 text-xs">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px]">
                <th className="p-2.5 border border-stone-200">#</th>
                <th className="p-2.5 border border-stone-200">Description of Goods</th>
                <th className="p-2.5 border border-stone-200">HSN</th>
                <th className="p-2.5 border border-stone-200">Size / Color</th>
                <th className="p-2.5 border border-stone-200 text-center">Qty</th>
                <th className="p-2.5 border border-stone-200 text-right">Unit Rate (₹)</th>
                <th className="p-2.5 border border-stone-200 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} className="border-b border-stone-200">
                  <td className="p-2.5 border border-stone-200 text-stone-500">{idx + 1}</td>
                  <td className="p-2.5 border border-stone-200 font-semibold text-stone-900">
                    {item.product_name}
                    <span className="block text-[10px] font-mono text-stone-500 font-normal">
                      SKU: {item.variant_sku}
                    </span>
                  </td>
                  <td className="p-2.5 border border-stone-200 font-mono text-stone-600">6205</td>
                  <td className="p-2.5 border border-stone-200 text-stone-600">
                    {item.size} · {item.color}
                  </td>
                  <td className="p-2.5 border border-stone-200 text-center font-bold">{item.quantity}</td>
                  <td className="p-2.5 border border-stone-200 text-right font-mono">₹{item.unit_price}</td>
                  <td className="p-2.5 border border-stone-200 text-right font-bold font-mono">
                    ₹{item.unit_price * item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Summary & Totals */}
          <div className="flex justify-between items-start pt-2">
            <div className="text-[11px] text-stone-500 max-w-sm space-y-1">
              <p className="font-bold text-stone-700">Tax Breakdown ({gstRate}% GST Inclusive):</p>
              {isInterstate ? (
                <p>IGST ({gstRate}%): ₹{igst.toLocaleString('en-IN')}</p>
              ) : (
                <>
                  <p>CGST (2.5%): ₹{cgst.toLocaleString('en-IN')}</p>
                  <p>SGST (2.5%): ₹{sgst.toLocaleString('en-IN')}</p>
                </>
              )}
              <p className="pt-2 text-[10px] text-stone-400">
                Declarations: Goods sold are intended for end customer use. Subject to Mumbai jurisdiction.
              </p>
            </div>

            <div className="w-64 space-y-1.5 text-right">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping Charges:</span>
                <span className="font-mono">
                  {order.shipping_fee === 0 ? 'FREE' : `₹${order.shipping_fee}`}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{order.discount_amount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-stone-900 border-t border-stone-300 pt-2">
                <span>Grand Total:</span>
                <span className="text-base text-amber-900">₹{order.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-10 flex justify-between items-end border-t border-stone-200">
            <div className="text-center">
              <div className="w-32 border-b border-stone-400 mb-1"></div>
              <span className="text-[10px] text-stone-500">Customer Signature / Stamp</span>
            </div>
            <div className="text-right">
              <p className="font-bold text-stone-900 text-xs">For MANISHA FASHION</p>
              <div className="h-10 flex items-center justify-end">
                <span className="font-serif italic text-amber-800 text-sm">Manisha Sharma</span>
              </div>
              <span className="text-[10px] text-stone-500">Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
