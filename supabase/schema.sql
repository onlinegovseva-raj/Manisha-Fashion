-- =============================================================================
-- MANISHA FASHION - PRODUCTION DATABASE SCHEMA (POSTGRESQL / SUPABASE FREE TIER)
-- Designed for zero-cost deployment with Row Level Security (RLS),
-- optimistic concurrency, unique idempotency keys, and strict constraints.
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. STAFF & ROLES TABLE
CREATE TABLE IF NOT EXISTS public.staff_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'CATALOG_STAFF', 'DISPATCHER', 'CASHIER')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(64) PRIMARY KEY,
    sku VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT,
    fabric VARCHAR(150),
    fit VARCHAR(50) DEFAULT 'Regular Fit',
    selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0),
    purchase_cost NUMERIC(10, 2) NOT NULL CHECK (purchase_cost >= 0),
    discount_type VARCHAR(20) DEFAULT 'NONE' CHECK (discount_type IN ('PERCENTAGE', 'FLAT', 'NONE')),
    discount_value NUMERIC(10, 2) DEFAULT 0 CHECK (discount_value >= 0),
    images JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT TRUE,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(is_published);

-- 4. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_variants (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku VARCHAR(80) UNIQUE NOT NULL,
    size VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    color_code VARCHAR(20),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0), -- Strict rule: Never negative
    barcode VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_barcode ON public.product_variants(barcode);

-- 5. STOCK AUDIT LEDGER
CREATE TABLE IF NOT EXISTS public.stock_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    variant_sku VARCHAR(80) NOT NULL,
    size VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    change_qty INTEGER NOT NULL,
    balance_qty INTEGER NOT NULL CHECK (balance_qty >= 0),
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('PURCHASE_RECEIPT', 'ORDER_DEDUCTION', 'ORDER_CANCELLED', 'MANUAL_AUDIT', 'DAMAGED_RETURN')),
    performed_by_name VARCHAR(150) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_product ON public.stock_audit_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.stock_audit_logs(created_at DESC);

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id VARCHAR(64) PRIMARY KEY,
    order_number VARCHAR(64) UNIQUE NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    shipping_address JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    shipping_fee NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('COD', 'UPI', 'MANUAL_VERIFIED')),
    payment_status VARCHAR(30) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED')),
    utr_number VARCHAR(100),
    order_status VARCHAR(40) DEFAULT 'CONFIRMED' CHECK (order_status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED')),
    courier_name VARCHAR(50),
    tracking_number VARCHAR(100),
    tracking_url TEXT,
    notes TEXT,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL, -- CRITICAL: Prevents duplicate order placement
    utm_source VARCHAR(80),
    utm_campaign VARCHAR(80),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 7. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(64) NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL,
    variant_id VARCHAR(64) NOT NULL,
    variant_sku VARCHAR(80) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    size VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    purchase_cost NUMERIC(10, 2) NOT NULL,
    image_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 8. ANALYTICS EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(80) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    product_id VARCHAR(64),
    product_name VARCHAR(255),
    utm_source VARCHAR(80),
    utm_campaign VARCHAR(80),
    value NUMERIC(10, 2),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON public.analytics_events(timestamp DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 1. Public Storefront Access: Anyone can view active published products
CREATE POLICY "Public can view published products"
    ON public.products FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "Public can view variants for published products"
    ON public.product_variants FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_variants.product_id AND products.is_published = TRUE
    ));

-- 2. Public Storefront: Can insert new orders and order items
CREATE POLICY "Public can create new orders"
    ON public.orders FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Public can create order items"
    ON public.order_items FOR INSERT
    WITH CHECK (TRUE);

-- 3. Anonymous Analytics Events
CREATE POLICY "Public can log privacy-safe analytics events"
    ON public.analytics_events FOR INSERT
    WITH CHECK (TRUE);

-- 4. Staff authenticated users can manage products, orders, audit logs
CREATE POLICY "Authenticated staff can manage products"
    ON public.products FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Authenticated staff can manage orders"
    ON public.orders FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Authenticated staff can manage variants"
    ON public.product_variants FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Authenticated staff can view audit logs"
    ON public.stock_audit_logs FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);
