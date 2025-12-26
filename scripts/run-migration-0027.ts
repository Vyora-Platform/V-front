import { Pool } from 'pg';

const DATABASE_URL = 'postgresql://postgres.abizuwqnqkbicrhorcig:8819%401464%23piyaA@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔄 Running migration: Add warranty and guaranty columns...');

  try {
    // Add warranty fields
    await pool.query(`
      ALTER TABLE vendor_products 
        ADD COLUMN IF NOT EXISTS has_warranty BOOLEAN DEFAULT false;
    `);
    console.log('✅ Added has_warranty column');

    await pool.query(`
      ALTER TABLE vendor_products 
        ADD COLUMN IF NOT EXISTS warranty_duration INTEGER;
    `);
    console.log('✅ Added warranty_duration column');

    await pool.query(`
      ALTER TABLE vendor_products 
        ADD COLUMN IF NOT EXISTS warranty_unit TEXT;
    `);
    console.log('✅ Added warranty_unit column');

    // Add guaranty fields
    await pool.query(`
      ALTER TABLE vendor_products 
        ADD COLUMN IF NOT EXISTS has_guarantee BOOLEAN DEFAULT false;
    `);
    console.log('✅ Added has_guarantee column');

    await pool.query(`
      ALTER TABLE vendor_products 
        ADD COLUMN IF NOT EXISTS guarantee_duration INTEGER;
    `);
    console.log('✅ Added guarantee_duration column');

    await pool.query(`
      ALTER TABLE vendor_products 
        ADD COLUMN IF NOT EXISTS guarantee_unit TEXT;
    `);
    console.log('✅ Added guarantee_unit column');

    console.log('');
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);


