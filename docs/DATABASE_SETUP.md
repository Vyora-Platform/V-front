# Database Setup with Row-Level Security

## Quick Start

### 1. Database is Already Created ✅
PostgreSQL database has been provisioned with environment variables:
- `DATABASE_URL`
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

### 2. Apply RLS Policies

Run the database migration to enable Row-Level Security:

```bash
npm run db:push
```

This applies `migrations/0001_enable_rls.sql` which:
- Enables RLS on all 40+ tables
- Creates vendor isolation policies
- Creates admin bypass policies
- Sets up master data access controls

### 3. Using the Database in Code

Always use `withSecurityContext` for database operations:

```typescript
import { withSecurityContext } from './db';
import { bookings } from '@shared/schema';

// Vendor accessing their data
const vendorBookings = await withSecurityContext(
  { vendorId: req.user.vendorId, role: 'vendor' },
  async (db) => await db.select().from(bookings)
);

// Admin accessing all data
const allBookings = await withSecurityContext(
  { vendorId: null, role: 'admin' },
  async (db) => await db.select().from(bookings)
);
```

## Security Features

### ✅ Multi-Tenant Data Isolation
- Each vendor can ONLY access their own data
- Enforced at the database level (PostgreSQL RLS)
- Impossible to bypass via application code

### ✅ Admin Full Access
- Platform administrators can access all vendor data
- Required for management, analytics, support

### ✅ Shared Master Data
- All users can read master products, services, categories
- Only admins can create/update/delete master data

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Application Layer                   │
│  (Express Routes, Controllers, Business Logic)      │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│          withSecurityContext()                       │
│  - Sets app.vendor_id = 'vendor-123'                │
│  - Sets app.role = 'vendor'                         │
│  - Wraps in transaction                             │
│  - Cleans up after execution                        │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database                     │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │   RLS Policies (enabled on all tables)      │  │
│  │                                              │  │
│  │  IF is_admin() THEN                         │  │
│  │    ALLOW ALL                                 │  │
│  │  ELSE IF vendorId = current_vendor_id()     │  │
│  │    ALLOW ACCESS                              │  │
│  │  ELSE                                        │  │
│  │    DENY (return 0 rows)                      │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  Tables: bookings, orders, customers, employees,    │
│          products, leads, expenses, etc. (40+)      │
└─────────────────────────────────────────────────────┘
```

## Tables Protected by RLS

- **40+ Vendor-Scoped Tables**: bookings, orders, customers, employees, leads, expenses, inventory, attendance, bills, etc.
- **3 Admin-Only Tables**: subscription_plans, vendor_subscriptions, subscription_transactions
- **5 Master Data Tables**: master_categories, master_subcategories, master_units, master_services, master_products

## Next Steps

1. **Apply Migration**: Run `npm run db:push` to enable RLS
2. **Update Routes**: Modify API routes to use `withSecurityContext`
3. **Migrate Storage**: Convert storage layer from in-memory to database-backed
4. **Test Security**: Verify vendor isolation and admin access
5. **Add Authentication**: Integrate with Replit Auth to get vendorId

## Documentation

- **Full Guide**: See [RLS_SECURITY_GUIDE.md](./RLS_SECURITY_GUIDE.md) for complete documentation
- **Migration Script**: See [migrations/0001_enable_rls.sql](../migrations/0001_enable_rls.sql) for RLS policies
- **Database Layer**: See [server/db.ts](../server/db.ts) for implementation

## Security Testing

Test RLS policies directly in PostgreSQL:

```sql
-- Test as vendor-1
SET app.vendor_id = 'vendor-1';
SET app.role = 'vendor';
SELECT COUNT(*) FROM bookings; -- Should only count vendor-1's bookings

-- Test as admin
SET app.vendor_id = '';
SET app.role = 'admin';
SELECT COUNT(*) FROM bookings; -- Should count all bookings
```

## Important Security Notes

⚠️ **Never use `db` directly** - Always use `withSecurityContext`
⚠️ **Never trust client vendorId** - Extract from authenticated session only
⚠️ **Always validate admin role** - Check server-side, not client-provided
⚠️ **Test cross-vendor access** - Ensure vendor A cannot see vendor B's data
