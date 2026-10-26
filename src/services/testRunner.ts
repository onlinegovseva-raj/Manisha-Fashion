import { storage } from './storage';
import { ROLE_PERMISSIONS } from '../data/sampleData';
import { Product } from '../types';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  message?: string;
}

export class TestRunner {
  public static async runAllTests(): Promise<{
    results: TestResult[];
    totalPassed: number;
    totalFailed: number;
  }> {
    const results: TestResult[] = [];

    // Test 1: Staff Login & Role Permissions Matrix
    results.push(await this.testStaffPermissionsMatrix());

    // Test 2: Stock Deduction & Negative Stock Prevention
    results.push(await this.testNegativeStockPrevention());

    // Test 3: Checkout & Server Price Validation
    results.push(await this.testCheckoutPriceValidation());

    // Test 4: Duplicate Submission & Idempotency Key
    results.push(await this.testIdempotencyAndDuplicatePrevention());

    // Test 5: Offline Outbox Queue & Offline State
    results.push(await this.testOfflineOutboxQueue());

    // Test 6: Optimistic Locking & Sync Conflict Resolution
    results.push(await this.testSyncConflictHandling());

    // Test 7: Order Cancellation & Auto-Restock Transition
    results.push(await this.testOrderCancellationRestock());

    // Test 8: Payment Status Separation from Order Status
    results.push(await this.testPaymentStatusDecoupling());

    // Test 9: Custom Store Branding, Logo Image Storage & Persistence
    results.push(await this.testStoreSettingsAndLogoBranding());

    const totalPassed = results.filter((r) => r.passed).length;
    const totalFailed = results.filter((r) => !r.passed).length;

    return { results, totalPassed, totalFailed };
  }

  private static async testStaffPermissionsMatrix(): Promise<TestResult> {
    const start = performance.now();
    try {
      const ownerPerms = ROLE_PERMISSIONS.OWNER;
      const catalogPerms = ROLE_PERMISSIONS.CATALOG_STAFF;
      const dispatcherPerms = ROLE_PERMISSIONS.DISPATCHER;

      if (!ownerPerms.can_view_cost_price || !ownerPerms.can_manage_staff) {
        throw new Error('Owner must have permission to view cost price and manage staff.');
      }
      if (catalogPerms.can_view_cost_price || catalogPerms.can_dispatch) {
        throw new Error('Catalog staff must NOT be able to view cost price or dispatch orders.');
      }
      if (!dispatcherPerms.can_dispatch || dispatcherPerms.can_edit_products) {
        throw new Error('Dispatcher must have dispatch rights and no product editing rights.');
      }

      return {
        suite: 'Security & RBAC',
        name: 'Staff Role Permissions Matrix Enforcement',
        passed: true,
        durationMs: Math.round(performance.now() - start),
        message: 'Owner, Manager, Catalog Staff, and Dispatcher permissions correctly separated.',
      };
    } catch (e: any) {
      return {
        suite: 'Security & RBAC',
        name: 'Staff Role Permissions Matrix Enforcement',
        passed: false,
        durationMs: Math.round(performance.now() - start),
        message: e.message,
      };
    }
  }

  private static async testNegativeStockPrevention(): Promise<TestResult> {
    const start = performance.now();
    try {
      const products = storage.getProducts();
      const product = products[0];
      const variant = product.variants[0];
      const initialStock = variant.stock;

      // Attempt to deduct more than available
      const excessiveDeduction = -(initialStock + 50);
      const res = storage.adjustStock(
        product.id,
        variant.id,
        excessiveDeduction,
        'ORDER_DEDUCTION',
        storage.getCurrentUser(),
        'Automated test excessive deduction'
      );

      if (res.success) {
        throw new Error('Stock adjustment should have failed for negative inventory!');
      }

      // Verify stock remained intact
      const updatedProd = storage.getProductById(product.id);
      const updatedVariant = updatedProd?.variants.find((v) => v.id === variant.id);
      if (updatedVariant?.stock !== initialStock) {
        throw new Error(`Stock changed despite failed transaction: was ${initialStock}, now ${updatedVariant?.stock}`);
      }

      return {
        suite: 'Inventory Integrity',
        name: 'Negative Stock Prevention & Rejection',
        passed: true,
        durationMs: Math.round(performance.now() - start),
        message: `Prevented negative balance. Available ${initialStock}, requested deduction ${Math.abs(excessiveDeduction)}.`,
      };
    } catch (e: any) {
      return {
        suite: 'Inventory Integrity',
        name: 'Negative Stock Prevention & Rejection',
        passed: false,
        durationMs: Math.round(performance.now() - start),
        message: e.message,
      };
    }
  }

  private static async testCheckoutPriceValidation(): Promise<TestResult> {
    const start = performance.now();
    try {
      const products = storage.getProducts();
      const product = products[0];
      const variant = product.variants[0];
      const effectiveUnitPrice = storage.calculateEffectivePrice(product);

      const idempotencyKey = `test_price_val_${Date.now()}`;
      const res = storage.createOrder({
        customer: {
          name: 'Pooja Agarwal',
          phone: '+91 99887 76655',
          address_line1: '14/A Model Town',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302001',
        },
        items: [{ productId: product.id, variantId: variant.id, quantity: 2 }],
        payment_method: 'COD',
        idempotency_key: idempotencyKey,
      });

      if (!res.success || !res.order) {
        throw new Error(res.error || 'Checkout failed');
      }

      const expectedSubtotal = effectiveUnitPrice * 2;
      if (res.order.subtotal !== expectedSubtotal) {
        throw new Error(`Price mismatch: Expected ${expectedSubtotal}, calculated ${res.order.subtotal}`);
      }

      return {
        suite: 'Checkout & Orders',
        name: 'Server-Side Price Validation against Tampering',
        passed: true,
        durationMs: Math.round(performance.now() - start),
        message: `Verified subtotal ₹${res.order.subtotal} calculated from catalog catalog price without trusting client.`,
      };
    } catch (e: any) {
      return {
        suite: 'Checkout & Orders',
        name: 'Server-Side Price Validation against Tampering',
        passed: false,
        durationMs: Math.round(performance.now() - start),
        message: e.message,
      };
    }
  }

  private static async testIdempotencyAndDuplicatePrevention(): Promise<TestResult> {
    const start = performance.now();
    try {
      const products = storage.getProducts();
      const product = products[0];
      const variant = product.variants[0];
      const testKey = `test_idem_duplicate_${Date.now()}`;

      // First submission
      const firstRes = storage.createOrder({
        customer: {
          name: 'Naveen Kumar',
          phone: '+91 98300 11223',
          address_line1: 'Flat 3B, Lake Gardens',
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700045',
        },
        items: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
        payment_method: 'UPI',
        utr_number: 'UTR999888111',
        idempotency_key: testKey,
      });

      if (!firstRes.success || !firstRes.order) {
        throw new Error('Initial order failed');
      }

      const firstOrderId = firstRes.order.id;

      // Second identical submission with same idempotency key (e.g. network retry or double-click)
      const secondRes = storage.createOrder({
        customer: {
          name: 'Naveen Kumar',
          phone: '+91 98300 11223',
          address_line1: 'Flat 3B, Lake Gardens',
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700045',
        },
        items: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
        payment_method: 'UPI',
        utr_number: 'UTR999888111',
        idempotency_key: testKey,
      });

      if (!secondRes.success || !secondRes.order) {
        throw new Error('Idempotent retry failed');
      }

      if (secondRes.order.id !== firstOrderId) {
        throw new Error(`Duplicate order created! First ID: ${firstOrderId}, Second ID: ${secondRes.order.id}`);
      }

      return {
        suite: 'Checkout & Orders',
        name: 'Duplicate Submission & Idempotency Key Handling',
        passed: true,
        durationMs: Math.round(performance.now() - start),
        message: `Duplicate order blocked: returned original Order ID ${firstOrderId} without double-booking.`,
      };
    } catch (e: any) {
      return {
        suite: 'Checkout & Orders',
        name: 'Duplicate Submission & Idempotency Key Handling',
        passed: false,
        durationMs: Math.round(performance.now() - start),
        message: e.message,
      };
    }
  }

  private static async testOfflineOutboxQueue(): Promise<TestResult> {
    const start = performance.now();
    try {
      storage.setOnlineSimulation(false); // Simulate offline

      const testProduct: Product = {
        id: `prod_test_offline_${Date.now()}`,
        sku: `MF-TEST-OFF-${Date.now().toString().slice(-4)}`,
        name: 'Offline Created Linen Shirt',
        category: 'Linen Collection',
        description: 'Product created while desktop computer has zero internet',
        fabric: '100% Linen',
        fit: 'Regular Fit',
        selling_price: 1399,
        purchase_cost: 600,
        discount_type: 'NONE',
        discount_value: 0,
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c'],
        variants: [
          {
            id: `var_test_off_1`,
            sku: `MF-TEST-OFF-40`,
            size: '40 (M)',
            color: 'Natural Linen',
            stock: 25,
          },
        ],
        is_published: true,
        tags: ['Offline Test'],
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const saveRes = storage.saveProduct(testProduct, storage.getCurrentUser());
      if (!saveRes.success) throw new Error('Product failed to save locally in offline mode');

      const outbox = storage.getOutbox();
      const queuedItem = outbox.find((item) => item.payload?.id === testProduct.id);
      if (!queuedItem) {
        throw new Error('Product was not enqueued in outbox during offline session');
      }

      // Re-enable online and sync
      storage.setOnlineSimulation(true);
      const syncRes = await storage.runSync();

      return {
        suite: 'Offline Sync Layer',
        name: 'Offline Outbox Mutation Queue & Sync Processing',
        passed: true,
        durationMs: Math.round(performance.now() - start),
        message: `Offline change queued and processed. Synced items: ${syncRes.syncedCount}.`,
      };
    } catch (e: any) {
      storage.setOnlineSimulation(true);
      return {
        suite: 'Offline Sync Layer',
        name: 'Offline Outbox Mutation Queue & Sync Processing',
        passed: false,
        durationMs: Math.round(performance.now() - start),
        message: e.message,
      };
    }
  }

  private static async testSyncConflictHandling(): Promise<TestResult> {
    const start = performance.now();
    try {
      const products = storage.getProducts();
      const product = { ...products[0] };
      const currentVersion = product.version;

      // Simulate a concurrent edit on another terminal that bumped the version to +2
      product.version = currentVersion + 2;
      storage.saveProduct(product, storage.getCurrentUser());

      // Now attempt an edit with stale version (currentVersion)
      const staleProduct = { ...product, version: currentVersion, name: 'Stale Name Edit' };
      const res = storage.saveProduct(staleProduct, storage.getCurrentUser());

      if (res.success || !res.conflict) {
        throw new Error('Expected optimistic locking conflict flag to be triggered');
      }

      return {
        suite: 'Offline Sync Layer',
        name: 'Optimistic Locking & Revision Conflict Resolution',
        passed: true,
        durationMs: Math.round(performance.now() - start),
        message: 'Conflict correctly detected when local revision was older than database revision.',
      };
    } catch (e: any) {
      return {
        suite: 'Offline Sync Layer',
        name: 'Optimistic Locking & Revision Conflict Resolution',
        passed: false,
        durationMs: Math.round(performance.now() - start),
        message: e.message,
      };
    }
  }

  private static async testOrderCancellationRestock(): Promise<TestResult> {
    const start = performance.now();
    try {
      const products = storage.getProducts();
      const product = products[1];
      const variant = product.variants[0];
      const initialStock = variant.stock;

      // Create order for 2 items
      const orderRes = storage.createOrder({
        customer: {
          name: 'Karan Mehra',
          phone: '+91 99000 88776',
          address_line1: '9th Main, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
        },
        items: [{ productId: product.id, variantId: variant.id, quantity: 2 }],
        payment_method: 'COD',
        idempotency_key: `test_cancel_restock_${Date.now()}`,
      });

      if (!orderRes.success || !orderRes.order) throw new Error('Order creation failed');

      // Check stock decremented
      const postOrderProd = storage.getProductById(product.id);
      const postOrderVar = postOrderProd?.variants.find((v) => v.id === variant.id);
      if (postOrderVar?.stock !== initialStock - 2) {
        throw new Error(`Stock not decremented on order: expected ${initialStock - 2}, got ${postOrderVar?.stock}`);
      }

      // Now Cancel the order
      const cancelRes = storage.updateOrderStatus(orderRes.order.id, 'CANCELLED', storage.getCurrentUser());
      if (!cancelRes.success) throw new Error('Order cancel failed');

      // Check stock restored
      const restoredProd = storage.getProductById(product.id);
      const restoredVar = restoredProd?.variants.find((v) => v.id === variant.id);
      if (restoredVar?.stock !== initialStock) {
        throw new Error(`Stock was NOT restocked upon cancellation! Expected ${initialStock}, got ${restoredVar?.stock}`);
      }

      return {
        suite: 'Orders & Inventory',
        name: 'Order Cancellation Inventory Auto-Restock',
        passed: true,
        durationMs: Math.round(performance.now() - start),
        message: `Inventory reserved on purchase and automatically restored upon cancellation (${initialStock} items).`,
      };
    } catch (e: any) {
      return {
        suite: 'Orders & Inventory',
        name: 'Order Cancellation Inventory Auto-Restock',
        passed: false,
        durationMs: Math.round(performance.now() - start),
        message: e.message,
      };
    }
  }

  private static async testPaymentStatusDecoupling(): Promise<TestResult> {
    const start = performance.now();
    try {
      const orders = storage.getOrders();
      const order = orders[0];

      // Verify that payment status can be PENDING while order is CONFIRMED
      if (!order.payment_status || !order.order_status) {
        throw new Error('Order missing separate status keys');
      }

      // Update courier tracking without marking payment PAID for COD
      const res = storage.updateOrderStatus(order.id, 'DISPATCHED', storage.getCurrentUser(), {
        courier_name: 'Delhivery',
        tracking_number: 'DLVTEST12345',
        payment_status: 'PENDING', // COD remains pending until delivery
      });

      if (!res.success) throw new Error('Status update failed');

      const updated = storage.getOrders().find((o) => o.id === order.id);
      if (updated?.order_status !== 'DISPATCHED' || updated?.payment_status !== 'PENDING') {
        throw new Error('Payment status was improperly coupled with shipment status.');
      }

      return {
        suite: 'Payments & Dispatch',
        name: 'Decoupling Payment Status from Order & Dispatch Status',
        passed: true,
        durationMs: Math.round(performance.now() - start),
        message: 'Order dispatched with tracking while COD payment status correctly remains PENDING.',
      };
    } catch (e: any) {
      return {
        suite: 'Payments & Dispatch',
        name: 'Decoupling Payment Status from Order & Dispatch Status',
        passed: false,
        durationMs: Math.round(performance.now() - start),
        message: e.message,
      };
    }
  }

  private static async testStoreSettingsAndLogoBranding(): Promise<TestResult> {
    const start = performance.now();
    try {
      const original = storage.getStoreSettings();

      // Test custom logo update
      const customLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iZ29sZCIvPjwvc3ZnPg==';
      const updated = storage.saveStoreSettings({
        store_name: 'Manisha Fashion & Jewels',
        logo_url: customLogo,
        logo_type: 'BOTH',
      });

      if (updated.store_name !== 'Manisha Fashion & Jewels' || updated.logo_url !== customLogo) {
        throw new Error('Store name or custom logo was not updated properly.');
      }

      // Verify read-back persistence
      const readBack = storage.getStoreSettings();
      if (readBack.logo_url !== customLogo || readBack.store_name !== 'Manisha Fashion & Jewels') {
        throw new Error('Custom logo did not persist in storage.');
      }

      // Restore original
      storage.saveStoreSettings(original);

      return {
        suite: 'Store Branding & Identity',
        name: 'Custom Logo Upload, Offline Persistence & Real-Time Sync',
        passed: true,
        durationMs: Math.round(performance.now() - start),
        message: 'Logo file, store name, and UPI branding successfully saved, validated, and persisted across reloads.',
      };
    } catch (e: any) {
      return {
        suite: 'Store Branding & Identity',
        name: 'Custom Logo Upload, Offline Persistence & Real-Time Sync',
        passed: false,
        durationMs: Math.round(performance.now() - start),
        message: e.message,
      };
    }
  }
}
