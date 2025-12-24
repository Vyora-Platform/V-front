import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { subscriptionPlans } from '../shared/schema';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addSubscriptionPlans() {
  const databaseUrl = process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Database URL not found in environment variables');
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
    console.log('🚀 Adding subscription plans to database...');

    // Check existing plans
    const existingPlans = await db.select().from(subscriptionPlans);
    console.log(`📊 Found ${existingPlans.length} existing plans in database`);

    // Define the plans to add (matching the hardcoded ones from MemStorage)
    const plansToAdd = [
      {
        id: 'plan-monthly',
        name: 'monthly',
        displayName: 'Monthly Plan',
        description: 'Perfect for small businesses getting started. All essential features with monthly billing.',
        price: '299',
        currency: 'INR',
        billingInterval: 'month',
        maxServices: 10,
        maxProducts: 20,
        maxEmployees: 3,
        maxCustomers: 100,
        maxOrders: 50,
        maxBookings: 50,
        maxAppointments: 50,
        maxStorageGB: 1,
        hasAdvancedAnalytics: false,
        hasPrioritySupport: false,
        hasCustomDomain: false,
        hasMiniWebsite: true,
        hasWhiteLabel: false,
        hasAPI: false,
        hasMultiLocation: false,
        isActive: true,
        isPopular: false,
        displayOrder: 1,
        trialDays: 7,
      },
      {
        id: 'plan-halfyearly',
        name: 'halfyearly',
        displayName: '6 Months Plan',
        description: 'Best value! Save 11% with our most popular 6-month plan. Includes advanced analytics and priority support.',
        price: '1599',
        currency: 'INR',
        billingInterval: 'month',
        maxServices: 50,
        maxProducts: 100,
        maxEmployees: 10,
        maxCustomers: 500,
        maxOrders: 200,
        maxBookings: 200,
        maxAppointments: 200,
        maxStorageGB: 5,
        hasAdvancedAnalytics: true,
        hasPrioritySupport: true,
        hasCustomDomain: true,
        hasMiniWebsite: true,
        hasWhiteLabel: false,
        hasAPI: true,
        hasMultiLocation: false,
        isActive: true,
        isPopular: true,
        displayOrder: 2,
        trialDays: 14,
      },
      {
        id: 'plan-yearly',
        name: 'yearly',
        displayName: 'Annual Plan',
        description: 'Maximum savings! Save 15% annually. Unlock all features including white-label and multi-location support.',
        price: '3049',
        currency: 'INR',
        billingInterval: 'year',
        maxServices: -1,
        maxProducts: -1,
        maxEmployees: -1,
        maxCustomers: -1,
        maxOrders: -1,
        maxBookings: -1,
        maxAppointments: -1,
        maxStorageGB: 20,
        hasAdvancedAnalytics: true,
        hasPrioritySupport: true,
        hasCustomDomain: true,
        hasMiniWebsite: true,
        hasWhiteLabel: true,
        hasAPI: true,
        hasMultiLocation: true,
        isActive: true,
        isPopular: false,
        displayOrder: 3,
        trialDays: 30,
      }
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const plan of plansToAdd) {
      // Check if plan already exists
      const existingPlan = existingPlans.find(p => p.id === plan.id);

      if (existingPlan) {
        console.log(`⏭️  Skipping existing plan: ${plan.displayName} (${plan.id})`);
        skippedCount++;
        continue;
      }

      // Add the plan
      await db.insert(subscriptionPlans).values({
        ...plan,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ Added plan: ${plan.displayName} (${plan.id}) - ₹${plan.price}/${plan.billingInterval}`);
      addedCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Added: ${addedCount} plans`);
    console.log(`   ⏭️  Skipped: ${skippedCount} existing plans`);
    console.log(`   📈 Total plans in database: ${existingPlans.length + addedCount}`);

    // Verify final count
    const finalPlans = await db.select().from(subscriptionPlans);
    console.log(`\n🔍 Verification: Found ${finalPlans.length} plans in database`);

  } catch (error: any) {
    console.error('❌ Error adding subscription plans:', error);
    console.error('Error details:', {
      message: error?.message,
      detail: error?.detail,
      code: error?.code,
      stack: error?.stack,
    });
  } finally {
    await pool.end();
    console.log('🏁 Script completed');
  }
}

addSubscriptionPlans();
