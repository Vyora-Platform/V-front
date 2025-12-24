import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql, eq } from 'drizzle-orm';
import { vendors, vendorSubscriptions, subscriptionPlans } from '@shared/schema';

async function addDummySubscriptions() {
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
    console.log('🔄 Adding dummy subscriptions for vendors...\n');

    // Step 1: Fetch all vendors
    console.log('📋 Step 1: Fetching all vendors...');
    const allVendors = await db.select().from(vendors);
    console.log(`   Found ${allVendors.length} vendors\n`);

    if (allVendors.length === 0) {
      console.log('⚠️  No vendors found. Please create vendors first.');
      process.exit(0);
    }

    // Step 2: Get or create a default subscription plan
    console.log('📋 Step 2: Checking for subscription plans...');
    let defaultPlan = await db.select().from(subscriptionPlans).limit(1);
    
    if (defaultPlan.length === 0) {
      console.log('   No plans found. Creating a default plan...');
      const newPlan = await db.insert(subscriptionPlans).values({
        name: 'Basic Plan',
        displayName: 'Basic',
        description: 'Basic subscription plan',
        price: 999,
        billingInterval: 'monthly',
        maxOrders: 100,
        maxBookings: 50,
        maxAppointments: 50,
        maxProducts: 100,
        maxEmployees: 5,
        maxCustomers: 200,
        isActive: true,
      }).returning();
      defaultPlan = newPlan;
      console.log(`   ✅ Created default plan: ${newPlan[0].name} (ID: ${newPlan[0].id})\n`);
    } else {
      console.log(`   ✅ Using existing plan: ${defaultPlan[0].displayName} (ID: ${defaultPlan[0].id})\n`);
    }

    const planId = defaultPlan[0].id;

    // Step 3: Check existing subscriptions
    console.log('📋 Step 3: Checking existing subscriptions...');
    const existingSubscriptions = await db.select().from(vendorSubscriptions);
    const vendorsWithSubscriptions = new Set(existingSubscriptions.map(s => s.vendorId));
    console.log(`   Found ${existingSubscriptions.length} existing subscriptions\n`);

    // Step 4: Create subscriptions for vendors without one
    console.log('📋 Step 4: Creating subscriptions for vendors without one...');
    const vendorsNeedingSubscriptions = allVendors.filter(v => !vendorsWithSubscriptions.has(v.id));
    console.log(`   ${vendorsNeedingSubscriptions.length} vendors need subscriptions\n`);

    if (vendorsNeedingSubscriptions.length === 0) {
      console.log('✅ All vendors already have subscriptions!');
      process.exit(0);
    }

    // Create subscriptions with different statuses for variety
    const statuses = ['active', 'trial', 'active', 'active', 'trial']; // Mix of statuses
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < vendorsNeedingSubscriptions.length; i++) {
      const vendor = vendorsNeedingSubscriptions[i];
      const status = statuses[i % statuses.length];
      
      // Calculate dates
      const now = new Date();
      const startDate = new Date(now);
      const currentPeriodStart = new Date(now);
      const currentPeriodEnd = new Date(now);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1 month from now
      
      const trialEndDate = status === 'trial' ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : null; // 14 days trial

      try {
        await db.insert(vendorSubscriptions).values({
          vendorId: vendor.id,
          planId: planId,
          status: status,
          startDate: startDate,
          currentPeriodStart: currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd,
          trialEndDate: trialEndDate,
          autoRenew: true,
        });

        console.log(`   ✅ Created ${status} subscription for vendor: ${vendor.businessName}`);
        created++;
      } catch (error: any) {
        console.error(`   ❌ Failed to create subscription for ${vendor.businessName}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n✅ Summary:`);
    console.log(`   Created: ${created} subscriptions`);
    console.log(`   Skipped: ${skipped} subscriptions`);
    console.log(`   Total vendors: ${allVendors.length}`);
    console.log(`   Vendors with subscriptions: ${existingSubscriptions.length + created}`);

    // Verify
    console.log('\n🔍 Verifying subscriptions...');
    const finalSubscriptions = await db.select().from(vendorSubscriptions);
    console.log(`   Total subscriptions in database: ${finalSubscriptions.length}`);
    
    const statusCounts = finalSubscriptions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('   Status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`     ${status}: ${count}`);
    });

  } catch (error: any) {
    console.error('\n❌ Error:', error);
    console.error('   Message:', error.message);
    console.error('   Detail:', error.detail);
    console.error('   Code:', error.code);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

addDummySubscriptions();

