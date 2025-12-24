import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

async function checkRLSStatus() {
  const databaseUrl = process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Database URL is not set!');
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
    console.log('🔍 Checking RLS status on vendors table...\n');

    // Check RLS status
    const rlsStatus = await db.execute(sql`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'vendors'
    `);

    if (rlsStatus.rows && rlsStatus.rows.length > 0) {
      const rowsecurity = rlsStatus.rows[0].rowsecurity;
      console.log(`RLS Status: ${rowsecurity ? '✅ ENABLED' : '❌ DISABLED'}\n`);
    }

    // Check policies
    const policies = await db.execute(sql`
      SELECT policyname, cmd, qual, with_check
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'vendors'
    `);

    if (policies.rows && policies.rows.length > 0) {
      console.log(`Found ${policies.rows.length} RLS policies:`);
      policies.rows.forEach((row: any) => {
        console.log(`  - ${row.policyname} (${row.cmd})`);
      });
    } else {
      console.log('No RLS policies found (RLS is disabled or no policies exist)');
    }

    // Test query performance
    console.log('\n⏱️  Testing query performance...');
    const startTime = Date.now();
    const testResult = await db.execute(sql`SELECT COUNT(*) as count FROM vendors`);
    const queryTime = Date.now() - startTime;
    
    if (testResult.rows && testResult.rows.length > 0) {
      console.log(`  Vendors count: ${testResult.rows[0].count}`);
    }
    console.log(`  Query time: ${queryTime}ms`);
    
    if (queryTime > 1000) {
      console.log('  ⚠️  Query is slow - RLS might be causing overhead');
    } else {
      console.log('  ✅ Query is fast');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkRLSStatus();

