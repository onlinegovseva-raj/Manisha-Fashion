import React, { useState } from 'react';
import { 
  Truck, 
  Search, 
  Printer, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Package, 
  XCircle, 
  ExternalLink, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { Order, OrderStatus, StaffUser } from '../../types';
import { storage } from '../../services/storage';
import { InvoicePrintModal } from './InvoicePrintModal';

interface OrdersDispatchViewProps {
  orders: Order[];
  currentUser: StaffUser;
  onRefresh: () => void;
}

const ORDER_STATUS_LIST: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'DISPATCHED',
  'DELIVERED',
  'CANCELLED',
  'RETURN_REQUESTED',
  'RETURNED',
];

export const OrdersDispatchView: React.FC<OrdersDispatchViewProps> = ({
  orders,
  currentUser,
  onRefresh,
}) => {
  const permissions = storage.getUserPermissions(currentUser.role);
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  // Dispatch Assignment Modal
  const [dispatchModalOrder, setDispatchModalOrder] = useState<Order | null>(null);
  const [courierName, setCourierName] = useState<Order['courier_name']>('Delhivery');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      o.order_number.toLowerCase().includes(s) ||
      o.customer.name.toLowerCase().includes(s) ||
      o.customer.phone.includes(s) ||
      o.customer.city.toLowerCase().includes(s) ||
      (o.tracking_number && o.tracking_number.toLowerCase().includes(s));

    const matchesStatus = selectedStatusTab === 'ALL' || o.order_status === selectedStatusTab;

    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = (
    orderId: string,
    newStatus: OrderStatus,
    details?: { courier_name?: Order['courier_name']; tracking_number?: string; payment_status?: Order['payment_status'] }
  ) => {
    if (!permissions.can_manage_orders && !permissions.can_dispatch) return;

    if (newStatus === 'CANCELLED') {
      if (!confirm('Cancelling this order will automatically RESTOCK all reserved items back into inventory with an audit log entry. Proceed?')) {
        return;
      }
    }

    const res = storage.updateOrderStatus(orderId, newStatus, currentUser, details);
    if (res.success) {
      onRefresh();
      setDispatchModalOrder(null);
    } else {
      alert(`Status update error: ${res.error}`);
    }
  };

  const handleOpenDispatchModal = (order: Order) => {
    setDispatchModalOrder(order);
    setCourierName(order.courier_name || 'Delhivery');
    setTrackingNumber(order.tracking_number || `AWB${Date.now().toString().slice(-8)}`);
  };

  const handleSaveDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModalOrder) return;

    let trackingUrl = '';
    if (courierName === 'Delhivery') {
      trackingUrl = `https://www.delhivery.com/track/package/${trackingNumber}`;
    } else if (courierName === 'BlueDart') {
      trackingUrl = `https://www.bluedart.com/tracking?trackNumber=${trackingNumber}`;
    } else if (courierName === 'India Post' || courierName === 'Speed Post') {
      trackingUrl = `https://www.indiapost.gov.in/_layouts/15/dpt.cpt.tracking/trackconsignment.aspx`;
    }

    handleUpdateStatus(dispatchModalOrder.id, 'DISPATCHED', {
      courier_name: courierName,
      tracking_number: trackingNumber,
      // If COD, payment status stays PENDING until delivered
      payment_status: dispatchModalOrder.payment_status,
    });
  };

  const generateWhatsAppTrackingLink = (order: Order) => {
    const cleanPhone = order.customer.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const message = encodeURIComponent(
      `Namaste ${order.customer.name}! Thank you for shopping with Manisha Fashion. Your order ${order.order_number} has been dispatched via ${order.courier_name || 'Courier'}. Tracking AWB: ${order.tracking_number || 'N/A'}. Track here: ${order.tracking_url || 'https://manishafashion.in'}. Feel free to message us here if you have any questions!`
    );
    return `https://wa.me/${phoneWithCode}?text=${message}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Orders & Dispatch Management</h2>
          <p className="text-xs text-stone-500">
            {orders.length} total orders · Multi-carrier manual dispatch & printable GST invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-stone-600 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Stock auto-released upon order cancellation</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-3">
        <div className="flex flex-wrap gap-1 border-b border-stone-100 pb-2">
          <button
            onClick={() => setSelectedStatusTab('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              selectedStatusTab === 'ALL'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            All Orders ({orders.length})
          </button>
          {['CONFIRMED', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'].map((status) => {
            const count = orders.filter((o) => o.order_status === status).length;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatusTab(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  selectedStatusTab === status
                    ? 'bg-amber-600 text-white'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order #, customer name, mobile phone number, city, or tracking AWB..."
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Orders List / Cards */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-stone-200 p-10 text-center text-stone-400 text-xs">
            No orders found matching the selected filter.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isDispatched = order.order_status === 'DISPATCHED';
            const isDelivered = order.order_status === 'DELIVERED';
            const isCancelled = order.order_status === 'CANCELLED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-stone-200 p-4 shadow-xs hover:border-stone-300 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-stone-900">{order.order_number}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : isDispatched
                          ? 'bg-blue-100 text-blue-800'
                          : isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.order_status}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Placed:{' '}
                      {new Date(order.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-stone-500">Payment:</span>
                    <span className="font-semibold text-stone-800 bg-stone-100 px-2 py-0.5 rounded">
                      {order.payment_method}
                    </span>
                    <span
                      className={`font-semibold text-[11px] ${
                        order.payment_status === 'PAID'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      ({order.payment_status})
                    </span>
                    <span className="font-bold text-sm text-stone-900 ml-2">
                      ₹{order.total_amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Customer & Items Content */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3 text-xs">
                  {/* Customer Information */}
                  <div className="md:col-span-4 space-y-1">
                    <p className="font-bold text-stone-900">{order.customer.name}</p>
                    <p className="text-stone-600 font-mono">{order.customer.phone}</p>
                    <p className="text-stone-500 text-[11px]">
                      {order.customer.address_line1}, {order.customer.city}, {order.customer.state} —{' '}
                      <span className="font-semibold">{order.customer.pincode}</span>
                    </p>
                    {order.utr_number && (
                      <p className="text-[10px] bg-stone-100 text-stone-700 p-1 rounded font-mono">
                        UPI Ref: {order.utr_number}
                      </p>
                    )}
                  </div>

                  {/* Items Ordered */}
                  <div className="md:col-span-5 space-y-1.5 border-l border-stone-100 pl-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf'}
                          alt={item.product_name}
                          className="w-8 h-8 rounded object-cover border border-stone-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-800 truncate">{item.product_name}</p>
                          <p className="text-[10px] text-stone-500">
                            Size: <span className="font-semibold">{item.size}</span> · {item.color} · Qty: {item.quantity} × ₹{item.unit_price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Courier & Tracking Info */}
                  <div className="md:col-span-3 border-l border-stone-100 pl-3 space-y-1">
                    <p className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">
                      Logistics / Courier
                    </p>
                    {order.courier_name ? (
                      <div className="space-y-0.5">
                        <p className="font-semibold text-stone-900">{order.courier_name}</p>
                        <p className="text-[11px] font-mono text-stone-600">AWB: {order.tracking_number}</p>
                        {order.tracking_url && (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 font-semibold"
                          >
                            <span>Live Tracking</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-stone-400 italic text-[11px]">No courier assigned yet</p>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Status Changer */}
                    <span className="text-[11px] text-stone-500">Update Status:</span>
                    <select
                      value={order.order_status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className="text-xs border border-stone-300 rounded px-2 py-1 bg-white font-medium"
                    >
                      {ORDER_STATUS_LIST.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>

                    {/* Quick Payment Status Toggle for COD delivery */}
                    {order.payment_status === 'PENDING' && (
                      <button
                        onClick={() =>
                          storage.updateOrderStatus(order.id, order.order_status, currentUser, {
                            payment_status: 'PAID',
                          }) && onRefresh()
                        }
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[11px] font-semibold"
                      >
                        Mark Payment Paid
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Customer WhatsApp Notification button */}
                    <a
                      href={generateWhatsAppTrackingLink(order)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Customer</span>
                    </a>

                    {/* Dispatch Courier Booking */}
                    {permissions.can_dispatch && !isDispatched && !isDelivered && !isCancelled && (
                      <button
                        onClick={() => handleOpenDispatchModal(order)}
                        className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Book / Assign Courier</span>
                      </button>
                    )}

                    {/* Invoice Print */}
                    <button
                      onClick={() => setSelectedOrderForInvoice(order)}
                      className="px-2.5 py-1 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Tax Invoice</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invoice Print Modal */}
      {selectedOrderForInvoice && (
        <InvoicePrintModal
          order={selectedOrderForInvoice}
          isOpen={!!selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}

      {/* Courier Assignment Modal */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">
              Assign Courier & Generate Dispatch Label
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Order: {dispatchModalOrder.order_number} · Customer: {dispatchModalOrder.customer.name} ({dispatchModalOrder.customer.pincode})
            </p>

            <form onSubmit={handleSaveDispatch} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 uppercase mb-1">
                  Logistics Carrier
                </label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value as any)}
                  className="w-full border border-stone-300 rounded p-2 focus:outline-none"
                >
                  <option value="Delhivery">Delhivery Express</option>
                  <option value="BlueDart">Blue Dart Express</option>
                  <option value="DTDC">DTDC Courier</option>
                  <option value="India Post">India Post Speed Post</option>
                  <option value="Speed Post">Speed Post</option>
                  <option value="Local Pickup">Local Mumbai Store Pickup</option>
                  <option value="Other">Other Carrier</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 uppercase mb-1">
                  Air Waybill (AWB) / Tracking Number
                </label>
                <input
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. DLV8492019482"
                  className="w-full font-mono border border-stone-300 rounded p-2 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalOrder(null)}
                  className="px-3 py-1.5 border border-stone-300 rounded text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded shadow"
                >
                  Confirm Dispatch & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
