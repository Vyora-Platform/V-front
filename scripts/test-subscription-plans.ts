import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { subscriptionPlans } from '../shared/schema';

async function testSubscriptionPlans() {
  const databaseUrl = process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Database URL not found');
    return;
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
    console.log('🧪 Testing subscription plans fetch...');

    // Test getAllSubscriptionPlans method (simulating what SupabaseStorage does)
    const allPlans = await db.select().from(subscriptionPlans);
    allPlans.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log(`✅ Found ${allPlans.length} plans in database:`);
    allPlans.forEach(plan => {
      console.log(`   - ${plan.displayName} (${plan.id}) - ₹${plan.price}/${plan.billingInterval}`);
    });

    // Test getSubscriptionPlan method
    const testPlanId = 'plan-monthly';
    const singlePlan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, testPlanId)).limit(1);

    if (singlePlan[0]) {
      console.log(`\n✅ Found plan by ID '${testPlanId}': ${singlePlan[0].displayName}`);
    } else {
      console.log(`\n❌ Plan '${testPlanId}' not found`);
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testSubscriptionPlans();
