import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const databaseUrl = process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ [MIGRATION ERROR] Database URL is not set!');
  console.error('   Please set NEW_DATABASE_URL or DATABASE_URL environment variable');
  process.exit(1);
}

// Add sslmode=require if not already present (Supabase requirement)
let urlWithSsl = databaseUrl;
if (!urlWithSsl.includes('sslmode=')) {
  urlWithSsl += (urlWithSsl.includes('?') ? '&' : '?') + 'sslmode=require';
}

async function runMigration() {
  const pool = new Pool({
    connectionString: urlWithSsl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔍 [MIGRATION] Reading migration file...');
    const migrationPath = join(process.cwd(), 'migrations', 'add_additional_services.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📊 [MIGRATION] Connecting to database...');
    const client = await pool.connect();

    try {
      console.log('🚀 [MIGRATION] Running migration...');
      await client.query(migrationSQL);
      console.log('✅ [MIGRATION] Migration completed successfully!');
      console.log('   Tables created:');
      console.log('   - additional_services');
      console.log('   - additional_service_inquiries');
      console.log('   - Indexes created');
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ [MIGRATION ERROR] Failed to run migration:');
    console.error('   Error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

