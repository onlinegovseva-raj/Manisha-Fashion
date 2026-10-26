import React from 'react';
import { CheckCircle2, MessageSquare, Truck, Package, ArrowRight, Printer } from 'lucide-react';
import { Order } from '../../types';

interface OrderSuccessModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const generateWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Namaste Manisha Fashion! I have placed order ${order.order_number} for ₹${order.total_amount}. Customer: ${order.customer.name}, Mobile: ${order.customer.phone}. Please confirm dispatch timeline.`
    );
    return `https://wa.me/919820112345?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 text-center space-y-5 my-auto animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs uppercase tracking-wider text-amber-700 font-bold">
            Order Confirmed & Inventory Reserved
          </span>
          <h2 className="text-2xl font-bold text-stone-900 mt-1 font-serif">
            Dhanyawad, {order.customer.name}!
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Order Reference: <strong className="font-mono text-stone-800">{order.order_number}</strong>
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-stone-50 rounded-lg p-4 text-xs text-left border border-stone-200 space-y-2">
          <div className="flex justify-between pb-2 border-b border-stone-200">
            <span className="text-stone-500">Payment Status:</span>
            <span className="font-bold text-stone-900">
              {order.payment_method} ({order.payment_status})
            </span>
          </div>

          <div className="flex justify-between pb-2 border-b border-stone-200">
            <span className="text-stone-500">Delivering To:</span>
            <span className="font-medium text-stone-800 text-right max-w-[200px] truncate">
              {order.customer.city}, {order.customer.state} ({order.customer.pincode})
            </span>
          </div>

          <div className="flex justify-between font-bold pt-1">
            <span className="text-stone-900">Total Amount:</span>
            <span className="font-mono text-amber-900 text-sm">
              ₹{order.total_amount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Dispatch promise */}
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200/80 text-left text-xs text-amber-950">
          <Truck className="w-5 h-5 text-amber-700 shrink-0" />
          <p className="text-[11px] leading-relaxed">
            Your tailored shirts will be packed with care and dispatched via <strong>Delhivery / BlueDart</strong> within 24 hours. Estimated delivery: 3–5 business days.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <a
            href={generateWhatsAppShare()}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Notify Store on WhatsApp</span>
          </a>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
