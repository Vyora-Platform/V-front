#!/usr/bin/env node

/**
 * Script to add module_permissions column to users table
 * Run this with: node scripts/add-module-permissions.js
 */

const { db } = require('../server/db');
const { sql } = require('drizzle-orm');

async function addModulePermissionsColumn() {
  try {
    console.log('🔄 Adding module_permissions column to users table...');
    
    // Check if column exists
    const checkColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'module_permissions'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ module_permissions column already exists');
      return;
    }
    
    // Add password_hash column if it doesn't exist
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
        END IF;
      END $$;
    `);
    console.log('✅ Added password_hash column (if needed)');
    
    // Add module_permissions column
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS module_permissions jsonb DEFAULT '[]'::jsonb NOT NULL;
    `);
    
    // Update existing rows
    await db.execute(sql`
      UPDATE users 
      SET module_permissions = '[]'::jsonb 
      WHERE module_permissions IS NULL;
    `);
    
    console.log('✅ Successfully added module_permissions column to users table');
    console.log('✅ Updated existing users with empty permissions array');
    
  } catch (error) {
    console.error('❌ Error adding module_permissions column:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

addModulePermissionsColumn();

