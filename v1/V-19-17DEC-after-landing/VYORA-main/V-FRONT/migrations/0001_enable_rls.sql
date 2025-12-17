-- Migration: Enable Row-Level Security (RLS) for Multi-Tenant Data Isolation
-- Purpose: Enforce vendor data isolation and admin access control across all tables
-- Security Model:
--   - Vendors can only access their own data (vendorId scoped)
--   - Admins can access all data (role='admin' bypass)
--   - Master data is read-accessible to all, write-restricted to admins

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

-- Vendor-Scoped Operational Tables (Vendors can only see their own data)
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE greeting_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE greeting_template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

-- Admin-Managed Tables (Only admins can access)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;

-- Master Data Tables (Shared read access, admin-only write)
ALTER TABLE master_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_products ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================================================

-- Get current vendor ID from session variable
CREATE OR REPLACE FUNCTION current_vendor_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.vendor_id', true), '')::TEXT;
$$ LANGUAGE SQL STABLE;

-- Get current role from session variable
CREATE OR REPLACE FUNCTION current_role() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.role', true), '')::TEXT;
$$ LANGUAGE SQL STABLE;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT current_role() = 'admin';
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- RLS POLICIES FOR VENDOR-SCOPED TABLES
-- Pattern: Vendors can only access rows where vendor_id matches their session
--          Admins can access all rows
-- ============================================================================

-- VENDORS TABLE
-- Vendors can view/update their own vendor record, admins can see all
CREATE POLICY vendor_isolation_policy ON vendors
  FOR ALL
  USING (
    is_admin() OR id = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR id = current_vendor_id()
  );

-- BOOKINGS TABLE
CREATE POLICY vendor_isolation_policy ON bookings
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- APPOINTMENTS TABLE
CREATE POLICY vendor_isolation_policy ON appointments
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- ORDERS TABLE
CREATE POLICY vendor_isolation_policy ON orders
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- ORDER_ITEMS TABLE (scoped via orders relationship)
CREATE POLICY vendor_isolation_policy ON order_items
  FOR ALL
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items."orderId" AND orders."vendorId" = current_vendor_id()
    )
  )
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items."orderId" AND orders."vendorId" = current_vendor_id()
    )
  );

-- CUSTOMERS TABLE
CREATE POLICY vendor_isolation_policy ON customers
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- CUSTOMER_VISITS TABLE
CREATE POLICY vendor_isolation_policy ON customer_visits
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- LEADS TABLE
CREATE POLICY vendor_isolation_policy ON leads
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- LEAD_COMMUNICATIONS TABLE
CREATE POLICY vendor_isolation_policy ON lead_communications
  FOR ALL
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM leads WHERE leads.id = lead_communications."leadId" AND leads."vendorId" = current_vendor_id()
    )
  )
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM leads WHERE leads.id = lead_communications."leadId" AND leads."vendorId" = current_vendor_id()
    )
  );

-- LEAD_TASKS TABLE
CREATE POLICY vendor_isolation_policy ON lead_tasks
  FOR ALL
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM leads WHERE leads.id = lead_tasks."leadId" AND leads."vendorId" = current_vendor_id()
    )
  )
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM leads WHERE leads.id = lead_tasks."leadId" AND leads."vendorId" = current_vendor_id()
    )
  );

-- QUOTATIONS TABLE
CREATE POLICY vendor_isolation_policy ON quotations
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- QUOTATION_ITEMS TABLE
CREATE POLICY vendor_isolation_policy ON quotation_items
  FOR ALL
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM quotations WHERE quotations.id = quotation_items."quotationId" AND quotations."vendorId" = current_vendor_id()
    )
  )
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM quotations WHERE quotations.id = quotation_items."quotationId" AND quotations."vendorId" = current_vendor_id()
    )
  );

-- EMPLOYEES TABLE
CREATE POLICY vendor_isolation_policy ON employees
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- SUPPLIERS TABLE
CREATE POLICY vendor_isolation_policy ON suppliers
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- EXPENSES TABLE
CREATE POLICY vendor_isolation_policy ON expenses
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- VENDOR_CATALOGUE TABLE
CREATE POLICY vendor_isolation_policy ON vendor_catalogue
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- VENDOR_PRODUCTS TABLE
CREATE POLICY vendor_isolation_policy ON vendor_products
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- COUPONS TABLE
CREATE POLICY vendor_isolation_policy ON coupons
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- NOTIFICATIONS TABLE
CREATE POLICY vendor_isolation_policy ON notifications
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- GREETING_TEMPLATES TABLE
CREATE POLICY vendor_isolation_policy ON greeting_templates
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- GREETING_TEMPLATE_USAGE TABLE
CREATE POLICY vendor_isolation_policy ON greeting_template_usage
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- PAYROLL TABLE
CREATE POLICY vendor_isolation_policy ON payroll
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- HOLIDAYS TABLE
CREATE POLICY vendor_isolation_policy ON holidays
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- TRANSACTIONS TABLE
CREATE POLICY vendor_isolation_policy ON transactions
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- LEDGER_TRANSACTIONS TABLE
CREATE POLICY vendor_isolation_policy ON ledger_transactions
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- INVENTORY_LOCATIONS TABLE
CREATE POLICY vendor_isolation_policy ON inventory_locations
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- STOCK_BATCHES TABLE
CREATE POLICY vendor_isolation_policy ON stock_batches
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- STOCK_MOVEMENTS TABLE
CREATE POLICY vendor_isolation_policy ON stock_movements
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- STOCK_CONFIGS TABLE
CREATE POLICY vendor_isolation_policy ON stock_configs
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- STOCK_ALERTS TABLE
CREATE POLICY vendor_isolation_policy ON stock_alerts
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- ATTENDANCE TABLE
CREATE POLICY vendor_isolation_policy ON attendance
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- CUSTOMER_ATTENDANCE TABLE
CREATE POLICY vendor_isolation_policy ON customer_attendance
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- LEAVES TABLE
CREATE POLICY vendor_isolation_policy ON leaves
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- LEAVE_BALANCES TABLE
CREATE POLICY vendor_isolation_policy ON leave_balances
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- BILLS TABLE
CREATE POLICY vendor_isolation_policy ON bills
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );

-- BILL_ITEMS TABLE
CREATE POLICY vendor_isolation_policy ON bill_items
  FOR ALL
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM bills WHERE bills.id = bill_items."billId" AND bills."vendorId" = current_vendor_id()
    )
  )
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM bills WHERE bills.id = bill_items."billId" AND bills."vendorId" = current_vendor_id()
    )
  );

-- BILL_PAYMENTS TABLE
CREATE POLICY vendor_isolation_policy ON bill_payments
  FOR ALL
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM bills WHERE bills.id = bill_payments."billId" AND bills."vendorId" = current_vendor_id()
    )
  )
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM bills WHERE bills.id = bill_payments."billId" AND bills."vendorId" = current_vendor_id()
    )
  );

-- ============================================================================
-- RLS POLICIES FOR ADMIN-ONLY TABLES
-- Pattern: Only admins can access these tables
-- ============================================================================

-- SUBSCRIPTION_PLANS TABLE (Admin only)
CREATE POLICY admin_only_policy ON subscription_plans
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- VENDOR_SUBSCRIPTIONS TABLE (Admin only)
CREATE POLICY admin_only_policy ON vendor_subscriptions
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- SUBSCRIPTION_TRANSACTIONS TABLE (Admin only)
CREATE POLICY admin_only_policy ON subscription_transactions
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- RLS POLICIES FOR MASTER DATA TABLES
-- Pattern: All authenticated users can READ, only admins can WRITE
-- ============================================================================

-- MASTER_CATEGORIES TABLE
CREATE POLICY master_data_read_policy ON master_categories
  FOR SELECT
  USING (true); -- All can read

CREATE POLICY master_data_write_policy ON master_categories
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- MASTER_SUBCATEGORIES TABLE
CREATE POLICY master_data_read_policy ON master_subcategories
  FOR SELECT
  USING (true); -- All can read

CREATE POLICY master_data_write_policy ON master_subcategories
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- MASTER_UNITS TABLE
CREATE POLICY master_data_read_policy ON master_units
  FOR SELECT
  USING (true); -- All can read

CREATE POLICY master_data_write_policy ON master_units
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- MASTER_SERVICES TABLE
CREATE POLICY master_data_read_policy ON master_services
  FOR SELECT
  USING (true); -- All can read

CREATE POLICY master_data_write_policy ON master_services
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- MASTER_PRODUCTS TABLE
CREATE POLICY master_data_read_policy ON master_products
  FOR SELECT
  USING (true); -- All can read

CREATE POLICY master_data_write_policy ON master_products
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on helper functions to all database users
GRANT EXECUTE ON FUNCTION current_vendor_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION current_role() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO PUBLIC;

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Example: Test vendor isolation
-- SET app.vendor_id = 'vendor-1';
-- SET app.role = 'vendor';
-- SELECT * FROM bookings; -- Should only return vendor-1's bookings

-- Example: Test admin access
-- SET app.vendor_id = '';
-- SET app.role = 'admin';
-- SELECT * FROM bookings; -- Should return all bookings

-- Example: Test master data access
-- SET app.vendor_id = 'vendor-1';
-- SET app.role = 'vendor';
-- SELECT * FROM master_products; -- Should return all products (read access)
-- INSERT INTO master_products (...) VALUES (...); -- Should fail (admin only)
