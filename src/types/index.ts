export type UserRole = 'OWNER' | 'MANAGER' | 'CATALOG_STAFF' | 'DISPATCHER' | 'CASHIER';

export interface UserPermission {
  can_edit_products: boolean;
  can_view_cost_price: boolean;
  can_edit_stock: boolean;
  can_manage_orders: boolean;
  can_dispatch: boolean;
  can_view_reports: boolean;
  can_manage_staff: boolean;
  can_export_backup: boolean;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string; // 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44'
  color: string;
  color_code?: string;
  stock: number;
  barcode?: string;
}

export type ProductCategory = string;

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  description: string;
  fabric: string; // e.g., '100% Giza Cotton', 'Pure Linen', 'Oxford Cotton'
  fit: 'Slim Fit' | 'Regular Fit' | 'Comfort Fit' | 'Relaxed Fit';
  selling_price: number;
  purchase_cost: number; // Protected: only owner/manager can view
  discount_type: 'PERCENTAGE' | 'FLAT' | 'NONE';
  discount_value: number;
  images: string[];
  variants: ProductVariant[];
  is_published: boolean;
  tags: string[];
  version: number; // For optimistic locking & offline sync conflict detection
  created_at: string;
  updated_at: string;
}

export interface StockAuditLog {
  id: string;
  product_id: string;
  product_name: string;
  variant_sku: string;
  size: string;
  color: string;
  change_qty: number;
  balance_qty: number;
  reason: 'PURCHASE_RECEIPT' | 'ORDER_DEDUCTION' | 'ORDER_CANCELLED' | 'MANUAL_AUDIT' | 'DAMAGED_RETURN';
  performed_by_name: string;
  notes?: string;
  created_at: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED';

export type PaymentMethod = 'COD' | 'UPI' | 'MANUAL_VERIFIED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

export interface OrderItem {
  product_id: string;
  variant_id: string;
  variant_sku: string;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  purchase_cost: number; // for reporting gross profit
  image_url: string;
}

export interface CustomerShippingDetails {
  name: string;
  phone: string;
  email?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  order_number: string; // e.g. MF-2026-1042
  customer: CustomerShippingDetails;
  items: OrderItem[];
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  utr_number?: string;
  upi_reference_note?: string;
  order_status: OrderStatus;
  courier_name?: 'Delhivery' | 'BlueDart' | 'DTDC' | 'India Post' | 'Speed Post' | 'Local Pickup' | 'Other';
  tracking_number?: string;
  tracking_url?: string;
  notes?: string;
  idempotency_key: string;
  utm_source?: string;
  utm_campaign?: string;
  created_at: string;
  updated_at: string;
  synced_to_cloud?: boolean;
}

export interface AnalyticsEvent {
  id: string;
  session_id: string;
  event_type: 'SESSION_START' | 'PRODUCT_VIEW' | 'ADD_TO_CART' | 'CHECKOUT_START' | 'PURCHASE_COMPLETED';
  product_id?: string;
  product_name?: string;
  utm_source?: string;
  utm_campaign?: string;
  value?: number;
  timestamp: string;
}

export interface SyncOutboxItem {
  id: string;
  entity_type: 'PRODUCT' | 'STOCK' | 'ORDER';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: string;
  status: 'QUEUED' | 'SYNCING' | 'SUCCESS' | 'CONFLICT' | 'FAILED';
  retry_count: number;
  error_message?: string;
  conflict_details?: {
    server_version: any;
    local_version: any;
  };
}

export interface AIProcessedImage {
  id: string;
  filename: string;
  original_data_url: string;
  processed_data_url: string;
  bg_mode: 'TRANSPARENT' | 'WHITE' | 'STUDIO_GREY' | 'WOOD_SHOWROOM' | 'ROYAL_NAVY';
  brightness: number;
  contrast: number;
  sharpness: number;
  is_square_cropped: boolean;
  width: number;
  height: number;
  created_at: string;
}

export interface StoreSettings {
  store_name: string;
  tagline: string;
  logo_url?: string; // Image URL or Base64 uploaded data URL
  logo_type: 'IMAGE' | 'TEXT' | 'BOTH';
  primary_color?: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  upi_id: string;
  currency_symbol: string;
}
