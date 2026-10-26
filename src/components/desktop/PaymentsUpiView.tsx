import React, { useState } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Search, 
  CreditCard, 
  AlertCircle, 
  Smartphone, 
  ShieldCheck 
} from 'lucide-react';
import { Order, StaffUser } from '../../types';
import { storage } from '../../services/storage';

interface PaymentsUpiViewProps {
  orders: Order[];
  currentUser: StaffUser;
  onRefresh: () => void;
}

export const PaymentsUpiView: React.FC<PaymentsUpiViewProps> = ({
  orders,
  currentUser,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'ALL' | 'UPI' | 'COD'>('ALL');
  
  // Custom UPI test generator
  const [testAmount, setTestAmount] = useState<number>(1499);
  const upiId = 'manishafashion@okhdfcbank';
  const payeeName = 'Manisha Fashion';

  const upiIntentString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${testAmount}&tn=Direct+UPI+Payment`;

  const filteredOrders = orders.filter((o) => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      o.order_number.toLowerCase().includes(s) ||
      o.customer.name.toLowerCase().includes(s) ||
      (o.utr_number && o.utr_number.toLowerCase().includes(s));

    const matchMethod = selectedMethod === 'ALL' || o.payment_method === selectedMethod;

    return matchSearch && matchMethod;
  });

  const handleVerifyPayment = (orderId: string, markAs: 'PAID' | 'FAILED') => {
    const res = storage.updateOrderStatus(orderId, orders.find((o) => o.id === orderId)?.order_status || 'CONFIRMED', currentUser, {
      payment_status: markAs,
    });
    if (res.success) {
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Payments & Manual UPI Verification Desk</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manual verification workflow for zero transaction fees. Payment status is decoupled from shipment status.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-stone-700">Zero Gateway Commission (0% Fee)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Direct UPI QR Code Generator Preview */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <QrCode className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-stone-900 uppercase">Live Storefront UPI QR Preview</h3>
            </div>

            <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 flex flex-col items-center text-center space-y-3">
              <div className="w-40 h-40 bg-white p-2 rounded-lg border border-stone-300 shadow-xs flex items-center justify-center">
                {/* Dynamic QR SVG */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    upiIntentString
                  )}`}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <p className="font-bold text-stone-900 text-sm">{payeeName}</p>
                <p className="font-mono text-stone-600 text-[11px] select-all bg-white px-2 py-0.5 rounded border border-stone-200 mt-1 inline-block">
                  {upiId}
                </p>
              </div>

              <div className="w-full pt-2 border-t border-stone-200">
                <label className="block text-[11px] text-stone-500 mb-1 text-left">
                  Test QR Amount (₹):
                </label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Number(e.target.value))}
                  className="w-full border border-stone-300 rounded px-2 py-1 text-xs font-bold text-stone-800"
                />
              </div>

              <p className="text-[10px] text-stone-500 leading-relaxed">
                Customers scan this using Google Pay, PhonePe, Paytm, or BHIM, and enter the 12-digit UTR reference upon completion.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Order Payment Ledger & Verification Queue */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-3 rounded-lg border border-stone-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Order #, customer name, or 12-digit UTR number..."
                className="w-full pl-9 pr-4 py-1.5 text-xs border border-stone-300 rounded-md focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedMethod('ALL')}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${
                  selectedMethod === 'ALL' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedMethod('UPI')}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${
                  selectedMethod === 'UPI' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'
                }`}
              >
                UPI Only
              </button>
              <button
                onClick={() => setSelectedMethod('COD')}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${
                  selectedMethod === 'COD' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'
                }`}
              >
                COD Only
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3">UTR / Ref #</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                    <th className="px-3 py-3 text-center">Payment Status</th>
                    <th className="px-4 py-3 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-stone-400">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50/50">
                        <td className="px-4 py-3 font-bold text-stone-900">{order.order_number}</td>
                        <td className="px-3 py-3">
                          <span className="font-semibold text-stone-800">{order.customer.name}</span>
                          <span className="block text-[10px] text-stone-500">{order.customer.phone}</span>
                        </td>
                        <td className="px-3 py-3 font-semibold text-stone-700">{order.payment_method}</td>
                        <td className="px-3 py-3 font-mono text-[11px] text-stone-600">
                          {order.utr_number ? (
                            <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-800 font-medium">
                              {order.utr_number}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-stone-900 font-mono">
                          ₹{order.total_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              order.payment_status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.payment_status === 'FAILED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {order.payment_status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleVerifyPayment(order.id, 'PAID')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                                title="Confirm funds received in bank account"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verify</span>
                              </button>
                              <button
                                onClick={() => handleVerifyPayment(order.id, 'FAILED')}
                                className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded text-[11px] font-semibold flex items-center gap-1"
                                title="Mark payment as unverified / bounced"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
