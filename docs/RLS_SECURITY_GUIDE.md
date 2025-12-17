# Row-Level Security (RLS) Implementation Guide

## Overview

Vyora implements PostgreSQL Row-Level Security (RLS) to ensure complete data isolation between vendors in the multi-tenant B2B marketplace platform. This guide explains how the RLS system works and how to use it correctly.

## Security Model

### 1. **Vendor Data Isolation**
- Each vendor can ONLY access their own data (bookings, orders, customers, employees, etc.)
- Data is scoped by `vendorId` in the database
- Attempting to access another vendor's data returns zero rows

### 2. **Admin Full Access**
- Platform administrators with `role='admin'` can access all data
- Admins bypass vendor-scoped restrictions
- Required for platform management, analytics, and support

### 3. **Shared Master Data**
- Master products, services, categories, subcategories, and units are shared
- All users can READ master data
- Only admins can CREATE, UPDATE, or DELETE master data

## Architecture Components

### 1. Database Connection Layer (`server/db.ts`)

The `withSecurityContext` function wraps all database operations with security context:

```typescript
import { withSecurityContext } from './db';

// Vendor accessing their bookings
const bookings = await withSecurityContext(
  { vendorId: 'vendor-123', role: 'vendor' },
  async (db) => {
    return await db.select().from(bookingsTable);
  }
);
// Returns only bookings for vendor-123

// Admin accessing all bookings
const allBookings = await withSecurityContext(
  { vendorId: null, role: 'admin' },
  async (db) => {
    return await db.select().from(bookingsTable);
  }
);
// Returns all bookings from all vendors
```

### 2. Session Variables

The system uses PostgreSQL session variables to track the current security context:

- `app.vendor_id` - The current vendor's ID (empty for admins)
- `app.role` - Either 'vendor' or 'admin'
- `app.user_id` - Optional user ID for audit trails

### 3. RLS Policies

Each table has RLS policies that reference these session variables:

```sql
-- Example policy for bookings table
CREATE POLICY vendor_isolation_policy ON bookings
  FOR ALL
  USING (
    is_admin() OR "vendorId" = current_vendor_id()
  )
  WITH CHECK (
    is_admin() OR "vendorId" = current_vendor_id()
  );
```

## Usage in Routes

### Pattern 1: Vendor-Scoped Endpoints

```typescript
import { withSecurityContext } from './db';
import { bookings } from '@shared/schema';

router.get('/api/bookings', async (req, res) => {
  // Get vendorId from authenticated session
  const vendorId = req.user?.vendorId;
  
  if (!vendorId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const results = await withSecurityContext(
    { vendorId, role: 'vendor' },
    async (db) => {
      return await db.select().from(bookings);
    }
  );
  
  res.json(results);
});
```

### Pattern 2: Admin Endpoints

```typescript
router.get('/api/admin/all-bookings', async (req, res) => {
  // Verify admin role
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const results = await withSecurityContext(
    { vendorId: null, role: 'admin' },
    async (db) => {
      return await db.select().from(bookings);
    }
  );
  
  res.json(results);
});
```

### Pattern 3: Master Data Access

```typescript
// Read master products (available to all)
router.get('/api/master-products', async (req, res) => {
  const vendorId = req.user?.vendorId;
  
  const products = await withSecurityContext(
    { vendorId, role: 'vendor' },
    async (db) => {
      return await db.select().from(masterProducts);
    }
  );
  
  res.json(products);
});

// Create master product (admin only)
router.post('/api/admin/master-products', async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const newProduct = await withSecurityContext(
    { vendorId: null, role: 'admin' },
    async (db) => {
      return await db.insert(masterProducts).values(req.body).returning();
    }
  );
  
  res.json(newProduct);
});
```

## Security Best Practices

### ✅ DO:

1. **Always use `withSecurityContext`** for all database operations
2. **Extract vendorId from authenticated session** (never from request body/query params)
3. **Validate user role** before granting admin access
4. **Test cross-vendor access** to ensure isolation
5. **Use transactions** - `withSecurityContext` automatically wraps operations in transactions

### ❌ DON'T:

1. **Never use raw `db` instance** directly - always use `withSecurityContext`
2. **Never trust client-provided vendorId** - always use server-side authentication
3. **Don't skip role validation** for admin endpoints
4. **Don't expose admin endpoints** without proper authorization checks
5. **Don't manually manage connections** - the wrapper handles pooling and cleanup

## Migration Guide

### Applying RLS Policies

Run the migration to enable RLS on all tables:

```bash
# Apply the RLS migration
npm run db:push
```

This will:
1. Enable RLS on all vendor-scoped, admin, and master data tables
2. Create helper functions (`current_vendor_id()`, `is_admin()`)
3. Create policies for vendor isolation and admin access

### Testing RLS

Test vendor isolation using SQL:

```sql
-- Test as vendor-1
SET app.vendor_id = 'vendor-1';
SET app.role = 'vendor';
SELECT * FROM bookings; -- Should only see vendor-1's bookings

-- Test as vendor-2
SET app.vendor_id = 'vendor-2';
SET app.role = 'vendor';
SELECT * FROM bookings; -- Should only see vendor-2's bookings

-- Test as admin
SET app.vendor_id = '';
SET app.role = 'admin';
SELECT * FROM bookings; -- Should see all bookings
```

## Tables Covered by RLS

### Vendor-Scoped Tables (Isolated by vendorId)
- vendors, bookings, appointments, orders, order_items
- customers, customer_visits, leads, lead_communications, lead_tasks
- quotations, quotation_items, employees, suppliers, expenses
- vendor_catalogue, vendor_products, coupons, notifications
- greeting_templates, greeting_template_usage, payroll, holidays
- transactions, ledger_transactions, inventory_locations
- stock_batches, stock_movements, stock_configs, stock_alerts
- attendance, customer_attendance, leaves, leave_balances
- bills, bill_items, bill_payments

### Admin-Only Tables
- subscription_plans
- vendor_subscriptions
- subscription_transactions

### Master Data Tables (Read-all, Write-admin)
- master_categories
- master_subcategories
- master_units
- master_services
- master_products

## Troubleshooting

### Issue: Getting zero rows when querying

**Cause**: Session variables not set or set incorrectly

**Solution**: Ensure you're using `withSecurityContext` and passing the correct vendorId and role

### Issue: Admin can't access data

**Cause**: `role` not set to 'admin'

**Solution**: Verify `role: 'admin'` is passed to `withSecurityContext`

### Issue: Cross-vendor data visible

**Cause**: RLS policies not enabled or session variables bypassed

**Solution**: Verify RLS is enabled with `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'bookings';`

## Performance Considerations

1. **Connection Pooling**: The system uses connection pooling for efficiency
2. **Transactions**: All operations are wrapped in transactions for consistency
3. **Index on vendorId**: Ensure all vendor-scoped tables have indexes on `vendorId` column
4. **Policy Caching**: PostgreSQL caches policy evaluation results

## Monitoring

Log security context for debugging:

```typescript
import { getCurrentSecurityContext } from './db';

const context = await getCurrentSecurityContext();
console.log('Current security context:', context);
// { vendorId: 'vendor-123', role: 'vendor', userId: null }
```

## Future Enhancements

- [ ] Add audit logging for sensitive operations
- [ ] Implement fine-grained permissions (read-only users, managers, etc.)
- [ ] Add automated security tests in CI/CD pipeline
- [ ] Monitor RLS policy performance with query explain plans
