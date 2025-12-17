-- ============================================================================
-- Supabase RLS and Security Migration for Vyora Platform
-- This migration applies Row-Level Security, Helper Functions, and Triggers
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Get current user's role from users table
CREATE OR REPLACE FUNCTION app_user_role() RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()::text;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get current user's vendor ID
CREATE OR REPLACE FUNCTION app_vendor_id() RETURNS TEXT AS $$
  SELECT id FROM vendors WHERE user_id = auth.uid()::text;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION app_is_admin() RETURNS BOOLEAN AS $$
  SELECT COALESCE(app_user_role() = 'admin', false);
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

-- Core identity tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Vendor-scoped tables (38 tables with vendor_id)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE greeting_template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mini_website_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mini_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_catalogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;

-- Child/join tables (no vendor_id, join to parent)
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- Master/global tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE greeting_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Stock management tables
ALTER TABLE stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_configs ENABLE ROW LEVEL SECURITY;

-- Public tables
ALTER TABLE mini_website_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: DROP EXISTING POLICIES (if any)
-- ============================================================================

-- This ensures clean slate for policy creation
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS vendor_isolation ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS admin_all_access ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS public_read ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS public_insert ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS users_read_own ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS users_update_own ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS vendors_read_own ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS vendors_update_own ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS vendors_insert ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 4: CREATE RLS POLICIES FOR USERS TABLE
-- ============================================================================

CREATE POLICY users_read_own ON users
  FOR SELECT
  USING (app_is_admin() OR id = auth.uid()::text);

CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (app_is_admin() OR id = auth.uid()::text)
  WITH CHECK (app_is_admin() OR id = auth.uid()::text);

CREATE POLICY users_insert ON users
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES FOR VENDORS TABLE
-- ============================================================================

CREATE POLICY vendors_read_own ON vendors
  FOR SELECT
  USING (app_is_admin() OR user_id = auth.uid()::text);

CREATE POLICY vendors_update_own ON vendors
  FOR UPDATE
  USING (app_is_admin() OR user_id = auth.uid()::text)
  WITH CHECK (app_is_admin() OR user_id = auth.uid()::text);

CREATE POLICY vendors_insert ON vendors
  FOR INSERT
  WITH CHECK (auth.uid()::text IS NOT NULL);

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES FOR VENDOR-SCOPED TABLES (38 tables)
-- Pattern: Admin sees all, vendors see only their data
-- ============================================================================

-- Appointments
CREATE POLICY vendor_isolation ON appointments
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Attendance
CREATE POLICY vendor_isolation ON attendance
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Billing History
CREATE POLICY vendor_isolation ON billing_history
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Bills
CREATE POLICY vendor_isolation ON bills
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Bookings
CREATE POLICY vendor_isolation ON bookings
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Coupons
CREATE POLICY vendor_isolation ON coupons
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Custom Service Requests
CREATE POLICY vendor_isolation ON custom_service_requests
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Customer Attendance
CREATE POLICY vendor_isolation ON customer_attendance
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Customer Tasks
CREATE POLICY vendor_isolation ON customer_tasks
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Customer Visits
CREATE POLICY vendor_isolation ON customer_visits
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Customers
CREATE POLICY vendor_isolation ON customers
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Employees
CREATE POLICY vendor_isolation ON employees
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Expenses
CREATE POLICY vendor_isolation ON expenses
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Greeting Template Usage
CREATE POLICY vendor_isolation ON greeting_template_usage
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Holidays
CREATE POLICY vendor_isolation ON holidays
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Inventory Locations
CREATE POLICY vendor_isolation ON inventory_locations
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Lead Communications
CREATE POLICY vendor_isolation ON lead_communications
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Lead Tasks
CREATE POLICY vendor_isolation ON lead_tasks
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Leads
CREATE POLICY vendor_isolation ON leads
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Leave Balances
CREATE POLICY vendor_isolation ON leave_balances
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Leaves
CREATE POLICY vendor_isolation ON leaves
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Ledger Transactions
CREATE POLICY vendor_isolation ON ledger_transactions
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Mini Website Leads
CREATE POLICY vendor_isolation ON mini_website_leads
  FOR SELECT
  USING (app_is_admin() OR vendor_id = app_vendor_id());

CREATE POLICY public_insert ON mini_website_leads
  FOR INSERT
  WITH CHECK (true);

-- Mini Websites
CREATE POLICY vendor_isolation ON mini_websites
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

CREATE POLICY public_read ON mini_websites
  FOR SELECT
  USING (status = 'active');

-- Notifications
CREATE POLICY vendor_isolation ON notifications
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Orders
CREATE POLICY vendor_isolation ON orders
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Payroll
CREATE POLICY vendor_isolation ON payroll
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Quotations
CREATE POLICY vendor_isolation ON quotations
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Stock Alerts
CREATE POLICY vendor_isolation ON stock_alerts
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Stock Movements
CREATE POLICY vendor_isolation ON stock_movements
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Supplier Payments
CREATE POLICY vendor_isolation ON supplier_payments
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Suppliers
CREATE POLICY vendor_isolation ON suppliers
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Tasks
CREATE POLICY vendor_isolation ON tasks
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Transactions
CREATE POLICY vendor_isolation ON transactions
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Usage Logs
CREATE POLICY vendor_isolation ON usage_logs
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Vendor Catalogues
CREATE POLICY vendor_isolation ON vendor_catalogues
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Vendor Products
CREATE POLICY vendor_isolation ON vendor_products
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- Vendor Subscriptions
CREATE POLICY vendor_isolation ON vendor_subscriptions
  FOR ALL
  USING (app_is_admin() OR vendor_id = app_vendor_id())
  WITH CHECK (app_is_admin() OR vendor_id = app_vendor_id());

-- ============================================================================
-- STEP 7: CREATE RLS POLICIES FOR CHILD/JOIN TABLES (5 tables)
-- Pattern: Access via parent table relationship
-- ============================================================================

-- Bill Items (joins to bills)
CREATE POLICY vendor_isolation ON bill_items
  FOR ALL
  USING (
    app_is_admin() OR 
    EXISTS (
      SELECT 1 FROM bills 
      WHERE id = bill_items.bill_id 
      AND vendor_id = app_vendor_id()
    )
  );

-- Bill Payments (joins to bills)
CREATE POLICY vendor_isolation ON bill_payments
  FOR ALL
  USING (
    app_is_admin() OR 
    EXISTS (
      SELECT 1 FROM bills 
      WHERE id = bill_payments.bill_id 
      AND vendor_id = app_vendor_id()
    )
  );

-- Coupon Usages (joins to coupons)
CREATE POLICY vendor_isolation ON coupon_usages
  FOR ALL
  USING (
    app_is_admin() OR 
    EXISTS (
      SELECT 1 FROM coupons 
      WHERE id = coupon_usages.coupon_id 
      AND vendor_id = app_vendor_id()
    )
  );

-- Order Items (joins to orders)
CREATE POLICY vendor_isolation ON order_items
  FOR ALL
  USING (
    app_is_admin() OR 
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = order_items.order_id 
      AND vendor_id = app_vendor_id()
    )
  );

-- Quotation Items (joins to quotations)
CREATE POLICY vendor_isolation ON quotation_items
  FOR ALL
  USING (
    app_is_admin() OR 
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE id = quotation_items.quotation_id 
      AND vendor_id = app_vendor_id()
    )
  );

-- ============================================================================
-- STEP 8: CREATE RLS POLICIES FOR MASTER/GLOBAL TABLES (7 tables)
-- Pattern: Everyone can read, only admins can write
-- ============================================================================

-- Categories
CREATE POLICY public_read ON categories FOR SELECT USING (true);
CREATE POLICY admin_all_access ON categories FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Subcategories
CREATE POLICY public_read ON subcategories FOR SELECT USING (true);
CREATE POLICY admin_all_access ON subcategories FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Units
CREATE POLICY public_read ON units FOR SELECT USING (true);
CREATE POLICY admin_all_access ON units FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Greeting Templates
CREATE POLICY public_read ON greeting_templates FOR SELECT USING (true);
CREATE POLICY admin_all_access ON greeting_templates FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Master Services
CREATE POLICY public_read ON master_services FOR SELECT USING (true);
CREATE POLICY admin_all_access ON master_services FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Master Products
CREATE POLICY public_read ON master_products FOR SELECT USING (true);
CREATE POLICY admin_all_access ON master_products FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Subscription Plans
CREATE POLICY public_read ON subscription_plans FOR SELECT USING (true);
CREATE POLICY admin_all_access ON subscription_plans FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- ============================================================================
-- STEP 9: CREATE RLS POLICIES FOR STOCK TABLES
-- ============================================================================

-- Stock Batches (vendor-specific via vendor_products)
CREATE POLICY vendor_isolation ON stock_batches
  FOR ALL
  USING (
    app_is_admin() OR 
    EXISTS (
      SELECT 1 FROM vendor_products 
      WHERE id = stock_batches.vendor_product_id 
      AND vendor_id = app_vendor_id()
    )
  );

-- Stock Configs (vendor-specific via vendor_products)
CREATE POLICY vendor_isolation ON stock_configs
  FOR ALL
  USING (
    app_is_admin() OR 
    EXISTS (
      SELECT 1 FROM vendor_products 
      WHERE id = stock_configs.vendor_product_id 
      AND vendor_id = app_vendor_id()
    )
  );

-- ============================================================================
-- STEP 10: CREATE RLS POLICIES FOR PUBLIC TABLES
-- ============================================================================

-- Mini Website Reviews (public can read approved, vendors moderate)
CREATE POLICY public_read ON mini_website_reviews
  FOR SELECT
  USING (
    approved_at IS NOT NULL OR 
    app_is_admin() OR 
    EXISTS (
      SELECT 1 FROM mini_websites 
      WHERE id = mini_website_reviews.mini_website_id 
      AND vendor_id = app_vendor_id()
    )
  );

CREATE POLICY public_insert ON mini_website_reviews
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY vendor_isolation ON mini_website_reviews
  FOR UPDATE
  USING (
    app_is_admin() OR 
    EXISTS (
      SELECT 1 FROM mini_websites 
      WHERE id = mini_website_reviews.mini_website_id 
      AND vendor_id = app_vendor_id()
    )
  );

-- ============================================================================
-- STEP 11: CREATE TRIGGERS FOR AUTO-SETTING VENDOR_ID
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_set_vendor_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vendor_id IS NULL AND NOT app_is_admin() THEN
    NEW.vendor_id := app_vendor_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to all vendor-scoped tables
CREATE TRIGGER auto_vendor_id BEFORE INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION auto_set_vendor_id();
CREATE TRIGGER auto_vendor_id BEFORE INSERT ON appointments FOR EACH ROW EXECUTE FUNCTION auto_set_vendor_id();
CREATE TRIGGER auto_vendor_id BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION auto_set_vendor_id();
CREATE TRIGGER auto_vendor_id BEFORE INSERT ON customers FOR EACH ROW EXECUTE FUNCTION auto_set_vendor_id();
CREATE TRIGGER auto_vendor_id BEFORE INSERT ON leads FOR EACH ROW EXECUTE FUNCTION auto_set_vendor_id();
CREATE TRIGGER auto_vendor_id BEFORE INSERT ON employees FOR EACH ROW EXECUTE FUNCTION auto_set_vendor_id();
CREATE TRIGGER auto_vendor_id BEFORE INSERT ON suppliers FOR EACH ROW EXECUTE FUNCTION auto_set_vendor_id();
CREATE TRIGGER auto_vendor_id BEFORE INSERT ON vendor_catalogues FOR EACH ROW EXECUTE FUNCTION auto_set_vendor_id();
CREATE TRIGGER auto_vendor_id BEFORE INSERT ON vendor_products FOR EACH ROW EXECUTE FUNCTION auto_set_vendor_id();
CREATE TRIGGER auto_vendor_id BEFORE INSERT ON mini_websites FOR EACH ROW EXECUTE FUNCTION auto_set_vendor_id();
CREATE TRIGGER auto_vendor_id BEFORE INSERT ON coupons FOR EACH ROW EXECUTE FUNCTION auto_set_vendor_id();

-- ============================================================================
-- STEP 12: CREATE NOTIFICATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION send_notification()
RETURNS TRIGGER AS $$
DECLARE
  owner_user_id TEXT;
  notification_message TEXT;
BEGIN
  -- Get the vendor owner's user_id
  SELECT user_id INTO owner_user_id 
  FROM vendors 
  WHERE id = NEW.vendor_id;
  
  -- Skip if no owner found
  IF owner_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Determine notification message based on table
  CASE TG_TABLE_NAME
    WHEN 'bookings' THEN
      notification_message := 'New booking received from ' || NEW.patient_name;
    WHEN 'orders' THEN
      notification_message := 'New order placed - Order #' || NEW.id;
    WHEN 'leads' THEN
      notification_message := 'New lead: ' || NEW.name;
    WHEN 'appointments' THEN
      notification_message := 'New appointment scheduled with ' || NEW.patient_name;
    ELSE
      notification_message := 'New ' || TG_TABLE_NAME || ' created';
  END CASE;
  
  -- Insert notification
  INSERT INTO notifications (
    vendor_id,
    user_id,
    title,
    message,
    type,
    reference_type,
    reference_id,
    created_at
  ) VALUES (
    NEW.vendor_id,
    owner_user_id,
    'New ' || initcap(TG_TABLE_NAME),
    notification_message,
    'info',
    TG_TABLE_NAME,
    NEW.id,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply notification triggers
CREATE TRIGGER notify_new_booking AFTER INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION send_notification();
CREATE TRIGGER notify_new_order AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION send_notification();
CREATE TRIGGER notify_new_lead AFTER INSERT ON leads FOR EACH ROW EXECUTE FUNCTION send_notification();
CREATE TRIGGER notify_new_appointment AFTER INSERT ON appointments FOR EACH ROW EXECUTE FUNCTION send_notification();

-- ============================================================================
-- STEP 13: CREATE AUDIT TRAIL TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION log_usage()
RETURNS TRIGGER AS $$
DECLARE
  vendor_id_val TEXT;
BEGIN
  -- Get vendor_id from the row if it exists
  IF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME IN ('users', 'vendors', 'categories', 'subcategories', 'units', 
                          'greeting_templates', 'master_services', 'master_products', 
                          'subscription_plans', 'mini_website_reviews', 'bill_items', 
                          'bill_payments', 'order_items', 'quotation_items', 'coupon_usages',
                          'stock_batches', 'stock_configs') THEN
      -- Tables without vendor_id - skip logging
      RETURN OLD;
    END IF;
    vendor_id_val := OLD.vendor_id;
  ELSE
    IF TG_TABLE_NAME IN ('users', 'vendors', 'categories', 'subcategories', 'units', 
                          'greeting_templates', 'master_services', 'master_products', 
                          'subscription_plans', 'mini_website_reviews', 'bill_items', 
                          'bill_payments', 'order_items', 'quotation_items', 'coupon_usages',
                          'stock_batches', 'stock_configs') THEN
      -- Tables without vendor_id - skip logging
      RETURN NEW;
    END IF;
    vendor_id_val := NEW.vendor_id;
  END IF;
  
  -- Skip if no vendor_id
  IF vendor_id_val IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  -- Insert audit log
  INSERT INTO usage_logs (
    vendor_id, 
    feature, 
    action, 
    resource_id, 
    metadata, 
    log_date
  ) VALUES (
    vendor_id_val,
    TG_TABLE_NAME,
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id::text 
      ELSE NEW.id::text 
    END,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', NOW()
    ),
    CURRENT_DATE
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_log AFTER INSERT OR UPDATE OR DELETE ON bookings FOR EACH ROW EXECUTE FUNCTION log_usage();
CREATE TRIGGER audit_log AFTER INSERT OR UPDATE OR DELETE ON orders FOR EACH ROW EXECUTE FUNCTION log_usage();
CREATE TRIGGER audit_log AFTER INSERT OR UPDATE OR DELETE ON customers FOR EACH ROW EXECUTE FUNCTION log_usage();
CREATE TRIGGER audit_log AFTER INSERT OR UPDATE OR DELETE ON appointments FOR EACH ROW EXECUTE FUNCTION log_usage();

-- ============================================================================
-- STEP 14: CREATE STATS AGGREGATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vendor_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily order count
  IF TG_TABLE_NAME = 'orders' THEN
    UPDATE vendor_subscriptions
    SET 
      current_month_orders = current_month_orders + 1,
      updated_at = NOW()
    WHERE vendor_id = NEW.vendor_id;
  END IF;
  
  -- Update daily booking count
  IF TG_TABLE_NAME = 'bookings' THEN
    UPDATE vendor_subscriptions
    SET 
      current_month_bookings = current_month_bookings + 1,
      updated_at = NOW()
    WHERE vendor_id = NEW.vendor_id;
  END IF;
  
  -- Update daily appointment count
  IF TG_TABLE_NAME = 'appointments' THEN
    UPDATE vendor_subscriptions
    SET 
      current_month_appointments = current_month_appointments + 1,
      updated_at = NOW()
    WHERE vendor_id = NEW.vendor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER stats_update AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION update_vendor_stats();
CREATE TRIGGER stats_update AFTER INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION update_vendor_stats();
CREATE TRIGGER stats_update AFTER INSERT ON appointments FOR EACH ROW EXECUTE FUNCTION update_vendor_stats();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
