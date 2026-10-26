import { Product, Order, StaffUser, StockAuditLog, SyncOutboxItem, AnalyticsEvent, UserRole, UserPermission, StoreSettings } from '../types';
import { SAMPLE_PRODUCTS, SAMPLE_STAFF, SAMPLE_ORDERS, ROLE_PERMISSIONS, DEFAULT_CATEGORIES } from '../data/sampleData';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  store_name: 'Manisha Fashion',
  tagline: 'Artisanal Menswear, Fashion Jewellery & Bridal Accessories',
  logo_url: '',
  logo_type: 'BOTH',
  primary_color: '#d97706',
  phone: '+91 98201 12345',
  whatsapp_number: '919820112345',
  email: 'orders@manishafashion.com',
  address: 'Shop 14, Fashion Street Market, Kalbadevi',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400002',
  upi_id: 'manishafashion@okaxis',
  currency_symbol: '₹',
};

const STORAGE_KEYS = {
  PRODUCTS: 'manisha_products_v1',
  ORDERS: 'manisha_orders_v1',
  STAFF: 'manisha_staff_v1',
  AUDIT_LOGS: 'manisha_stock_audit_v1',
  OUTBOX: 'manisha_sync_outbox_v1',
  ANALYTICS: 'manisha_analytics_events_v1',
  CURRENT_USER: 'manisha_current_user_v1',
  OFFLINE_SIM: 'manisha_offline_sim_mode',
  LAST_SYNC: 'manisha_last_sync_timestamp',
  CATEGORIES: 'manisha_categories_v1',
  WISHLIST: 'manisha_wishlist_v1',
  SETTINGS: 'manisha_store_settings_v1',
};

class StorageService {
  private isOnlineSimulated: boolean = true;

  constructor() {
    this.initDefaults();
    const sim = localStorage.getItem(STORAGE_KEYS.OFFLINE_SIM);
    if (sim !== null) {
      this.isOnlineSimulated = sim === 'true';
    }
  }

  private initDefaults() {
    // 1. Categories
    const existingCatsRaw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!existingCatsRaw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    } else {
      try {
        const existingCats: string[] = JSON.parse(existingCatsRaw);
        // Merge any new default categories (Fashion Jewellery, Bangles, Purses) if missing
        let updated = false;
        for (const cat of DEFAULT_CATEGORIES) {
          if (!existingCats.includes(cat)) {
            existingCats.push(cat);
            updated = true;
          }
        }
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(existingCats));
        }
      } catch (e) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      }
    }

    // 2. Products - Merge any new sample products (Jewellery, Purses, Bangles)
    const storedProdsRaw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!storedProdsRaw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SAMPLE_PRODUCTS));
    } else {
      try {
        const storedProds: Product[] = JSON.parse(storedProdsRaw);
        let prodsAdded = false;
        for (const sample of SAMPLE_PRODUCTS) {
          if (!storedProds.some((p) => p.id === sample.id)) {
            storedProds.push(sample);
            prodsAdded = true;
          }
        }
        if (prodsAdded) {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(storedProds));
        }
      } catch (e) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SAMPLE_PRODUCTS));
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(SAMPLE_STAFF));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(SAMPLE_ORDERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      // Create initial audit log records
      const initialLogs: StockAuditLog[] = SAMPLE_PRODUCTS.flatMap((p) =>
        p.variants.map((v) => ({
          id: `aud_init_${v.id}`,
          product_id: p.id,
          product_name: p.name,
          variant_sku: v.sku,
          size: v.size,
          color: v.color,
          change_qty: v.stock,
          balance_qty: v.stock,
          reason: 'PURCHASE_RECEIPT' as const,
          performed_by_name: 'Rajesh Sharma (Owner)',
          notes: 'Initial opening stock entry',
          created_at: p.created_at,
        }))
      );
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OUTBOX)) {
      localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANALYTICS)) {
      localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_STORE_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(SAMPLE_STAFF[0])); // Owner by default
    }
    if (!localStorage.getItem(STORAGE_KEYS.LAST_SYNC)) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    }
  }

  // Store & Branding Settings
  public getStoreSettings(): StoreSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_STORE_SETTINGS;
    try {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STORE_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_STORE_SETTINGS;
    }
  }

  public saveStoreSettings(updates: Partial<StoreSettings>): StoreSettings {
    const current = this.getStoreSettings();
    const merged: StoreSettings = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    
    // Dispatch custom window event so all open views update instantly
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: merged }));
    }

    if (!this.isOnline()) {
      this.queueOutbox('PRODUCT', 'UPDATE', { action: 'UPDATE_STORE_SETTINGS', settings: merged });
    }
    return merged;
  }

  public resetStoreSettings(): StoreSettings {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_STORE_SETTINGS));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: DEFAULT_STORE_SETTINGS }));
    }
    return DEFAULT_STORE_SETTINGS;
  }

  // Dynamic Categories Management
  public getCategories(): string[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) return DEFAULT_CATEGORIES;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  public addCategory(newCategory: string): { success: boolean; categories: string[]; error?: string } {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      return { success: false, categories: this.getCategories(), error: 'Category name cannot be empty.' };
    }
    const categories = this.getCategories();
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, categories, error: `Category "${trimmed}" already exists.` };
    }
    categories.push(trimmed);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

    if (!this.isOnline()) {
      this.queueOutbox('PRODUCT', 'UPDATE', { action: 'ADD_CATEGORY', category: trimmed });
    }

    return { success: true, categories };
  }

  public deleteCategory(categoryToDelete: string): { success: boolean; categories: string[]; error?: string } {
    const categories = this.getCategories();
    if (categories.length <= 1) {
      return { success: false, categories, error: 'Cannot delete the only remaining category.' };
    }
    const filtered = categories.filter((c) => c.toLowerCase() !== categoryToDelete.toLowerCase());
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));

    if (!this.isOnline()) {
      this.queueOutbox('PRODUCT', 'UPDATE', { action: 'DELETE_CATEGORY', category: categoryToDelete });
    }

    return { success: true, categories: filtered };
  }

  // Wishlist
  public getWishlist(): string[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WISHLIST);
    return raw ? JSON.parse(raw) : [];
  }

  public toggleWishlist(productId: string): string[] {
    const list = this.getWishlist();
    const idx = list.indexOf(productId);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(productId);
    }
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(list));
    return list;
  }

  public isWishlisted(productId: string): boolean {
    return this.getWishlist().includes(productId);
  }

  public clearWishlist(): void {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify([]));
  }

  // Connectivity
  public isOnline(): boolean {
    return navigator.onLine && this.isOnlineSimulated;
  }

  public setOnlineSimulation(online: boolean) {
    this.isOnlineSimulated = online;
    localStorage.setItem(STORAGE_KEYS.OFFLINE_SIM, String(online));
  }

  public getLastSyncTime(): string {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || new Date().toISOString();
  }

  public setLastSyncTime(isoString: string) {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, isoString);
  }

  // Staff & Auth
  public getStaff(): StaffUser[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    return raw ? JSON.parse(raw) : SAMPLE_STAFF;
  }

  public getCurrentUser(): StaffUser {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : SAMPLE_STAFF[0];
  }

  public setCurrentUser(user: StaffUser) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  public getUserPermissions(role: UserRole): UserPermission {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.CASHIER;
  }

  public saveStaffUser(user: StaffUser) {
    const staff = this.getStaff();
    const idx = staff.findIndex((s) => s.id === user.id);
    if (idx >= 0) {
      staff[idx] = user;
    } else {
      staff.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  }

  // Products
  public getProducts(): Product[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return raw ? JSON.parse(raw) : [];
  }

  public getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  public calculateEffectivePrice(product: Product): number {
    if (product.discount_type === 'PERCENTAGE' && product.discount_value > 0) {
      const discount = Math.round((product.selling_price * product.discount_value) / 100);
      return Math.max(0, product.selling_price - discount);
    }
    if (product.discount_type === 'FLAT' && product.discount_value > 0) {
      return Math.max(0, product.selling_price - product.discount_value);
    }
    return product.selling_price;
  }

  public saveProduct(product: Product, user: StaffUser): { success: boolean; conflict?: boolean; message?: string } {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === product.id);

    if (idx >= 0) {
      const existing = products[idx];
      // Optimistic locking conflict check
      if (existing.version > product.version) {
        // Record conflict in outbox if offline
        this.queueOutbox('PRODUCT', 'UPDATE', product, 'CONFLICT', 'Server has a newer revision of this product');
        return {
          success: false,
          conflict: true,
          message: `Conflict detected: Product was updated by another user (Server v${existing.version} vs Local v${product.version}).`,
        };
      }
      product.version += 1;
      product.updated_at = new Date().toISOString();
      products[idx] = product;
    } else {
      product.version = 1;
      product.created_at = new Date().toISOString();
      product.updated_at = product.created_at;
      products.unshift(product);
    }

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    // If offline, queue to outbox
    if (!this.isOnline()) {
      this.queueOutbox('PRODUCT', idx >= 0 ? 'UPDATE' : 'CREATE', product);
    }

    return { success: true };
  }

  public deleteProduct(productId: string): boolean {
    const products = this.getProducts();
    const filtered = products.filter((p) => p.id !== productId);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));

    if (!this.isOnline()) {
      this.queueOutbox('PRODUCT', 'DELETE', { id: productId });
    }
    return true;
  }

  // Stock Management with Strict Negative Stock Prevention & Audit Logging
  public adjustStock(
    productId: string,
    variantId: string,
    changeQty: number,
    reason: StockAuditLog['reason'],
    performedBy: StaffUser,
    notes?: string
  ): { success: boolean; newStock?: number; error?: string } {
    const products = this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      return { success: false, error: 'Product variant not found' };
    }

    const projectedStock = variant.stock + changeQty;
    // Strict business rule: Never allow negative stock
    if (projectedStock < 0) {
      return {
        success: false,
        error: `Insufficient stock for ${product.name} (${variant.size} - ${variant.color}). Available: ${variant.stock}, Requested change: ${changeQty}`,
      };
    }

    variant.stock = projectedStock;
    product.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    // Append to audit log
    const auditLog: StockAuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      product_id: product.id,
      product_name: product.name,
      variant_sku: variant.sku,
      size: variant.size,
      color: variant.color,
      change_qty: changeQty,
      balance_qty: variant.stock,
      reason,
      performed_by_name: performedBy.name,
      notes,
      created_at: new Date().toISOString(),
    };
    this.addAuditLog(auditLog);

    if (!this.isOnline()) {
      this.queueOutbox('STOCK', 'UPDATE', {
        productId,
        variantId,
        changeQty,
        reason,
        balance_qty: variant.stock,
      });
    }

    return { success: true, newStock: variant.stock };
  }

  public getAuditLogs(): StockAuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  }

  private addAuditLog(log: StockAuditLog) {
    const logs = this.getAuditLogs();
    logs.unshift(log);
    // Keep last 1,000 logs locally
    if (logs.length > 1000) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  // Orders & Safe Checkout (Idempotency, Price Validation, Reservation)
  public getOrders(): Order[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return raw ? JSON.parse(raw) : [];
  }

  public createOrder(orderInput: {
    customer: Order['customer'];
    items: { productId: string; variantId: string; quantity: number }[];
    payment_method: Order['payment_method'];
    utr_number?: string;
    idempotency_key: string;
    utm_source?: string;
    utm_campaign?: string;
  }): { success: boolean; order?: Order; error?: string } {
    const orders = this.getOrders();

    // 1. Idempotency Check: Prevent duplicate submissions
    const existing = orders.find((o) => o.idempotency_key === orderInput.idempotency_key);
    if (existing) {
      return {
        success: true,
        order: existing, // Return existing order idempotently
      };
    }

    const products = this.getProducts();
    const verifiedItems: Order['items'] = [];
    let calculatedSubtotal = 0;

    // 2. Validate Items, Stock Availability & Server-Calculated Price
    for (const item of orderInput.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        return { success: false, error: `Product ID ${item.productId} no longer exists.` };
      }
      const variant = prod.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        return { success: false, error: `Variant for ${prod.name} not found.` };
      }
      if (variant.stock < item.quantity) {
        return {
          success: false,
          error: `Item "${prod.name} - ${variant.size}" only has ${variant.stock} left in stock.`,
        };
      }

      const unitPrice = this.calculateEffectivePrice(prod);
      calculatedSubtotal += unitPrice * item.quantity;

      verifiedItems.push({
        product_id: prod.id,
        variant_id: variant.id,
        variant_sku: variant.sku,
        product_name: prod.name,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        unit_price: unitPrice,
        purchase_cost: prod.purchase_cost,
        image_url: prod.images[0] || '',
      });
    }

    // 3. Atomically Deduct Inventory & Create Audit Logs
    const systemUser: StaffUser = {
      id: 'usr_storefront',
      name: 'Online Storefront / Checkout',
      email: 'system@manishafashion.com',
      role: 'CASHIER',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    for (const item of verifiedItems) {
      const res = this.adjustStock(
        item.product_id,
        item.variant_id,
        -item.quantity,
        'ORDER_DEDUCTION',
        systemUser,
        `Stock reserved for new checkout order`
      );
      if (!res.success) {
        return { success: false, error: res.error || 'Failed to allocate stock.' };
      }
    }

    // 4. Construct Order Record
    const orderNumber = `MF-${new Date().getFullYear()}-${1000 + orders.length + 1}`;
    const shippingFee = calculatedSubtotal >= 999 ? 0 : 79; // Free shipping above ₹999 across India

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order_number: orderNumber,
      customer: orderInput.customer,
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      discount_amount: 0,
      shipping_fee: shippingFee,
      total_amount: calculatedSubtotal + shippingFee,
      payment_method: orderInput.payment_method,
      payment_status: orderInput.payment_method === 'UPI' && orderInput.utr_number ? 'PENDING' : 'PENDING',
      utr_number: orderInput.utr_number,
      order_status: 'CONFIRMED',
      idempotency_key: orderInput.idempotency_key,
      utm_source: orderInput.utm_source,
      utm_campaign: orderInput.utm_campaign,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced_to_cloud: this.isOnline(),
    };

    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    if (!this.isOnline()) {
      this.queueOutbox('ORDER', 'CREATE', newOrder);
    }

    // Record purchase analytics event
    this.recordAnalyticsEvent({
      event_type: 'PURCHASE_COMPLETED',
      value: newOrder.total_amount,
      utm_source: orderInput.utm_source,
      utm_campaign: orderInput.utm_campaign,
    });

    return { success: true, order: newOrder };
  }

  public updateOrderStatus(
    orderId: string,
    newStatus: Order['order_status'],
    performedBy: StaffUser,
    details?: {
      payment_status?: Order['payment_status'];
      courier_name?: Order['courier_name'];
      tracking_number?: string;
      tracking_url?: string;
    }
  ): { success: boolean; error?: string } {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    const previousStatus = order.order_status;
    order.order_status = newStatus;
    order.updated_at = new Date().toISOString();

    if (details?.payment_status) order.payment_status = details.payment_status;
    if (details?.courier_name) order.courier_name = details.courier_name;
    if (details?.tracking_number) order.tracking_number = details.tracking_number;
    if (details?.tracking_url) order.tracking_url = details.tracking_url;

    // Critical Indian eCommerce rule: If order is cancelled, release reserved inventory back!
    if ((newStatus === 'CANCELLED' || newStatus === 'RETURNED') && previousStatus !== 'CANCELLED' && previousStatus !== 'RETURNED') {
      for (const item of order.items) {
        this.adjustStock(
          item.product_id,
          item.variant_id,
          item.quantity,
          'ORDER_CANCELLED',
          performedBy,
          `Restocked due to order status changed to ${newStatus}`
        );
      }
    }

    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    if (!this.isOnline()) {
      this.queueOutbox('ORDER', 'UPDATE', { id: orderId, newStatus, details });
    }

    return { success: true };
  }

  // Offline Sync Outbox Queue
  public getOutbox(): SyncOutboxItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.OUTBOX);
    return raw ? JSON.parse(raw) : [];
  }

  public queueOutbox(
    entity_type: SyncOutboxItem['entity_type'],
    action: SyncOutboxItem['action'],
    payload: any,
    status: SyncOutboxItem['status'] = 'QUEUED',
    error_message?: string
  ) {
    const outbox = this.getOutbox();
    const item: SyncOutboxItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      entity_type,
      action,
      payload,
      timestamp: new Date().toISOString(),
      status,
      retry_count: 0,
      error_message,
    };
    outbox.push(item);
    localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(outbox));
  }

  public async runSync(): Promise<{ syncedCount: number; conflictCount: number; errors: string[] }> {
    if (!this.isOnline()) {
      return { syncedCount: 0, conflictCount: 0, errors: ['Cannot sync while in offline mode.'] };
    }

    const outbox = this.getOutbox();
    let syncedCount = 0;
    let conflictCount = 0;
    const errors: string[] = [];

    const remainingOutbox: SyncOutboxItem[] = [];

    for (const item of outbox) {
      if (item.status === 'CONFLICT') {
        remainingOutbox.push(item);
        conflictCount++;
        continue;
      }

      // Simulate network sync roundtrip to server
      try {
        item.status = 'SYNCING';
        // In this implementation, local changes are committed cleanly
        item.status = 'SUCCESS';
        syncedCount++;
      } catch (err: any) {
        item.status = 'FAILED';
        item.retry_count += 1;
        item.error_message = err.message || 'Network sync error';
        remainingOutbox.push(item);
        errors.push(`Failed to sync ${item.entity_type} (${item.id}): ${item.error_message}`);
      }
    }

    localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(remainingOutbox));
    this.setLastSyncTime(new Date().toISOString());

    return { syncedCount, conflictCount, errors };
  }

  public resolveConflict(outboxId: string, resolution: 'KEEP_LOCAL' | 'OVERWRITE_WITH_SERVER') {
    const outbox = this.getOutbox();
    const updated = outbox.filter((item) => item.id !== outboxId);
    localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(updated));
  }

  public clearOutbox() {
    localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify([]));
  }

  // Analytics
  public recordAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'session_id' | 'timestamp'>) {
    let sessionId = sessionStorage.getItem('mf_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      sessionStorage.setItem('mf_session_id', sessionId);
    }

    const raw = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
    const events: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];

    const fullEvent: AnalyticsEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    };

    events.push(fullEvent);
    if (events.length > 2000) events.shift();
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(events));
  }

  public getAnalyticsEvents(): AnalyticsEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
    return raw ? JSON.parse(raw) : [];
  }

  // Backup & Restore
  public createBackupJSON(): string {
    const backupData = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      exported_by: this.getCurrentUser().name,
      products: this.getProducts(),
      orders: this.getOrders(),
      staff: this.getStaff(),
      audit_logs: this.getAuditLogs(),
    };
    return JSON.stringify(backupData, null, 2);
  }

  public restoreFromJSON(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data.products) || !Array.isArray(data.orders)) {
        return { success: false, message: 'Invalid backup structure. Missing products or orders.' };
      }

      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
      if (Array.isArray(data.staff)) localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(data.staff));
      if (Array.isArray(data.audit_logs)) localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.audit_logs));

      return {
        success: true,
        message: `Successfully restored ${data.products.length} products, ${data.orders.length} orders, and audit logs.`,
      };
    } catch (e: any) {
      return { success: false, message: `Failed to restore: ${e.message}` };
    }
  }
}

export const storage = new StorageService();
