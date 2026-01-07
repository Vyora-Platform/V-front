import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function disableVendorsRLS() {
  const databaseUrl = process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Database URL is not set!');
    console.error('   Please set NEW_DATABASE_URL or DATABASE_URL environment variable');
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
    console.log('🔄 Disabling RLS on vendors table...\n');
    console.log('⚠️  Note: Make sure no active queries are running on vendors table\n');

    // Check for active connections first
    console.log('🔍 Checking for active connections...');
    const activeConnections = await db.execute(sql`
      SELECT count(*) as active_queries
      FROM pg_stat_activity 
      WHERE datname = current_database() 
      AND state = 'active'
      AND query NOT LIKE '%pg_stat_activity%'
    `);
    
    if (activeConnections.rows && activeConnections.rows[0]?.active_queries > 0) {
      console.log(`   ⚠️  Found ${activeConnections.rows[0].active_queries} active queries`);
      console.log('   Waiting 2 seconds for queries to complete...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('   ✅ No active queries found\n');
    }

    // Read migration file
    const migrationPath = path.join(import.meta.dirname, '..', 'migrations', 'disable_vendors_rls.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute migration with retry logic
    console.log('📝 Executing migration...');
    let retries = 3;
    let lastError: any = null;
    
    while (retries > 0) {
      try {
        await db.execute(sql.raw(migrationSQL));
        break; // Success
      } catch (error: any) {
        lastError = error;
        if (error.code === '40P01') { // Deadlock
          retries--;
          console.log(`   ⚠️  Deadlock detected, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          throw error; // Other error, don't retry
        }
      }
    }
    
    if (retries === 0 && lastError) {
      throw lastError;
    }

    console.log('✅ Successfully disabled RLS on vendors table\n');

    // Verify RLS is disabled
    console.log('🔍 Verifying RLS status...');
    const result = await db.execute(sql`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'vendors'
    `);

    if (result.rows && result.rows.length > 0) {
      const rowsecurity = result.rows[0].rowsecurity;
      console.log(`   RLS Status: ${rowsecurity ? 'ENABLED ❌' : 'DISABLED ✅'}`);
      
      if (rowsecurity) {
        console.log('\n⚠️  Warning: RLS is still enabled. Check for errors above.');
      } else {
        console.log('\n✅ RLS successfully disabled on vendors table!');
        console.log('   Vendors queries should now be faster.');
      }
    }

    // Check for remaining policies
    console.log('\n🔍 Checking for remaining policies...');
    const policiesResult = await db.execute(sql`
      SELECT policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'vendors'
    `);

    if (policiesResult.rows && policiesResult.rows.length > 0) {
      console.log(`   Found ${policiesResult.rows.length} remaining policies:`);
      policiesResult.rows.forEach((row: any) => {
        console.log(`     - ${row.policyname}`);
      });
      console.log('   These should be automatically dropped when RLS is disabled.');
    } else {
      console.log('   ✅ No policies found (as expected)');
    }

  } catch (error: any) {
    console.error('\n❌ Error disabling RLS:', error);
    console.error('   Message:', error.message);
    console.error('   Detail:', error.detail);
    console.error('   Code:', error.code);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

disableVendorsRLS();

