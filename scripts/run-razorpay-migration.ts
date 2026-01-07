import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const databaseUrl = process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ No database URL found. Set DATABASE_URL or NEW_DATABASE_URL environment variable.');
    process.exit(1);
  }

  let urlWithSsl = databaseUrl;
  if (!urlWithSsl.includes('sslmode=')) {
    urlWithSsl += (urlWithSsl.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  const pool = new Pool({
    connectionString: urlWithSsl,
    ssl: { rejectUnauthorized: false }
  });

  const db = drizzle(pool);

  try {
    console.log('🔄 Running Razorpay fields migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/add_razorpay_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration SQL...');
    await db.execute(sql.raw(migrationSQL));

    console.log('✅ Migration completed successfully!');
    console.log('📋 Added fields:');
    console.log('   - razorpay_order_id');
    console.log('   - razorpay_payment_id');
    console.log('   - payment_status (default: pending)');

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
    });
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();
