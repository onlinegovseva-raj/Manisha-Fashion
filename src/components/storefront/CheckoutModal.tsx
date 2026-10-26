import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Truck, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Smartphone 
} from 'lucide-react';
import { CartItem } from './CartDrawer';
import { Order, PaymentMethod } from '../../types';
import { storage } from '../../services/storage';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
}) => {
  if (!isOpen) return null;

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Status & Error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable Idempotency Key per checkout attempt
  const [idempotencyKey] = useState<string>(
    () => `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  const subtotal = items.reduce(
    (sum, item) => sum + storage.calculateEffectivePrice(item.product) * item.quantity,
    0
  );
  const shippingFee = subtotal >= 999 ? 0 : 79;
  const grandTotal = subtotal + shippingFee;

  const upiId = 'manishafashion@okhdfcbank';
  const upiPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    'Manisha Fashion'
  )}&am=${grandTotal}&tn=Order+${idempotencyKey.slice(-6)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit Indian mobile number.');
      return;
    }
    const cleanPincode = pincode.replace(/[^0-9]/g, '');
    if (cleanPincode.length !== 6) {
      setError('Please provide a valid 6-digit Indian delivery Pincode.');
      return;
    }
    if (paymentMethod === 'UPI' && !utrNumber.trim()) {
      setError('Please enter the 12-digit UPI UTR transaction reference number from your payment app.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Extract UTM parameters if present in URL
      const urlParams = new URLSearchParams(window.location.search);
      const utm_source = urlParams.get('utm_source') || 'direct';
      const utm_campaign = urlParams.get('utm_campaign') || undefined;

      const orderPayload = {
        customer: {
          name: name.trim(),
          phone: cleanPhone,
          email: email.trim() || undefined,
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() || undefined,
          city: city.trim(),
          state: stateName.trim(),
          pincode: cleanPincode,
        },
        items: items.map((i) => ({
          productId: i.product.id,
          variantId: i.variant.id,
          quantity: i.quantity,
        })),
        payment_method: paymentMethod,
        utr_number: paymentMethod === 'UPI' ? utrNumber.trim() : undefined,
        idempotency_key: idempotencyKey,
        utm_source,
        utm_campaign,
      };

      const result = storage.createOrder(orderPayload);
      if (!result.success || !result.order) {
        setError(result.error || 'Failed to place order.');
        setIsSubmitting(false);
        return;
      }

      onOrderSuccess(result.order);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-stone-900 font-serif">
              Secure Delivery & Payment Checkout
            </h3>
            <p className="text-[10px] sm:text-[11px] text-stone-500">
              Manisha Fashion · Factory-direct quality shirts delivered across India
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitOrder} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Customer Contact & Shipping Address */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-stone-700 text-[11px] flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-700" />
              <span>1. Shipping & Customer Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anand Kulkarni"
                  className="w-full border border-stone-300 rounded p-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">
                  10-Digit Mobile Number (For Order Updates) *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-2.5 rounded-l border border-r-0 border-stone-300 bg-stone-100 text-stone-600 font-mono text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9820123456"
                    className="w-full border border-stone-300 rounded-r p-2 text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-stone-600 font-semibold mb-1">
                Flat / House / Apartment / Building Address *
              </label>
              <input
                type="text"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Flat 301, Shree Ganesh Heights, 2nd Cross"
                className="w-full border border-stone-300 rounded p-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">City / Town *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full border border-stone-300 rounded p-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">State *</label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full border border-stone-300 rounded p-2 text-xs bg-white focus:outline-none"
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Delhi">Delhi NCR</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Other">Other State</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">6-Digit Pincode *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 411001"
                  className="w-full border border-stone-300 rounded p-2 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="space-y-3 pt-3 border-t border-stone-200">
            <h4 className="font-bold uppercase tracking-wider text-stone-700 text-[11px] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-700" />
              <span>2. Choose Payment Method</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* COD Option */}
              <label
                className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  paymentMethod === 'COD'
                    ? 'border-amber-600 bg-amber-50/50 text-amber-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs">Cash on Delivery (COD)</span>
                  </div>
                </div>
                <p className="text-[10px] text-stone-500 font-normal pl-5">
                  Pay cash or UPI directly to delivery courier upon receiving your parcel.
                </p>
              </label>

              {/* Direct UPI Option */}
              <label
                className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  paymentMethod === 'UPI'
                    ? 'border-amber-600 bg-amber-50/50 text-amber-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs">Direct UPI Payment</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                    Instant
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 font-normal pl-5">
                  Scan QR code with GPay, PhonePe, Paytm, or BHIM. Zero gateway fee.
                </p>
              </label>
            </div>

            {/* If Direct UPI chosen, show live dynamic QR & UTR field */}
            {paymentMethod === 'UPI' && (
              <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-32 h-32 bg-white p-1.5 rounded-lg border border-stone-300 shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                        upiPayload
                      )}`}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <p className="font-bold text-stone-900 text-sm">
                      Scan & Pay ₹{grandTotal.toLocaleString('en-IN')}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-stone-300 select-all">
                        {upiId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="text-[10px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1"
                      >
                        {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-500">
                      Open any UPI App (GPay / PhonePe / Paytm), scan the code above, complete transfer, and paste the 12-digit UTR transaction number below:
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    12-Digit UTR / Transaction Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 428192830192"
                    className="w-full border border-stone-300 rounded p-2 text-xs font-mono bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Order Summary & Submit */}
          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
            <div className="flex justify-between text-stone-600">
              <span>{items.reduce((s, i) => s + i.quantity, 0)} Items Subtotal:</span>
              <span className="font-mono text-stone-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Delivery Shipping:</span>
              <span className="font-mono text-emerald-700">
                {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm text-stone-900 border-t border-stone-200 pt-2">
              <span>Final Payable:</span>
              <span className="text-amber-900 font-mono text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 rounded text-stone-700 text-xs font-semibold hover:bg-stone-50"
            >
              Back to Cart
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-xs shadow flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Securing Order...' : 'Confirm Order Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
