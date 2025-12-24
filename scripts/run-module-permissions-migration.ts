/**
 * Script to add module_permissions column to users table
 * Run with: npx tsx scripts/run-module-permissions-migration.ts
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

async function runMigration() {
  // Get database URL from environment
  const databaseUrl = process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Database URL is not set!');
    console.error('   Please set NEW_DATABASE_URL or DATABASE_URL environment variable');
    process.exit(1);
  }

  // Add sslmode=require if not already present
  let urlWithSsl = databaseUrl;
  if (!urlWithSsl.includes('sslmode=')) {
    urlWithSsl += (urlWithSsl.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  // Create pool with SSL configuration for Supabase
  const pool = new Pool({
    connectionString: urlWithSsl,
    ssl: {
      rejectUnauthorized: false  // Required for Supabase pooler connections
    }
  });

  const db = drizzle(pool);

  try {
    console.log('🔄 Adding module_permissions column to users table...\n');
    
    // Add password_hash column if it doesn't exist
    console.log('📝 Checking password_hash column...');
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'users' 
          AND column_name = 'password_hash'
        ) THEN
          ALTER TABLE users 
          ADD COLUMN password_hash text;
          RAISE NOTICE 'Added password_hash column';
        ELSE
          RAISE NOTICE 'password_hash column already exists';
        END IF;
      END $$;
    `);
    console.log('✅ password_hash column check complete\n');
    
    // Add module_permissions column if it doesn't exist
    console.log('📝 Checking module_permissions column...');
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'users' 
          AND column_name = 'module_permissions'
        ) THEN
          ALTER TABLE users 
          ADD COLUMN module_permissions jsonb DEFAULT '[]'::jsonb NOT NULL;
          
          UPDATE users 
          SET module_permissions = '[]'::jsonb 
          WHERE module_permissions IS NULL;
          
          RAISE NOTICE 'Added module_permissions column';
        ELSE
          RAISE NOTICE 'module_permissions column already exists';
        END IF;
      END $$;
    `);
    console.log('✅ module_permissions column check complete\n');
    
    // Verify columns exist
    console.log('🔍 Verifying columns...');
    const result = await db.execute(sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'users' 
      AND column_name IN ('module_permissions', 'password_hash')
      ORDER BY column_name;
    `);
    
    console.log('\n📊 Column Status:');
    if (result.rows.length === 0) {
      console.log('❌ No columns found (this should not happen)');
    } else {
      result.rows.forEach((row: any) => {
        console.log(`   ✅ ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'none'})`);
      });
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('   You can now create employees with module permissions.');
    
  } catch (error: any) {
    console.error('\n❌ Error running migration:', error);
    console.error('   Message:', error?.message);
    console.error('   Detail:', error?.detail);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();

