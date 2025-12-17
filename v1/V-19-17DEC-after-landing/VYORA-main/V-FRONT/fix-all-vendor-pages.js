#!/usr/bin/env node

// Script to automatically fix all vendor pages with hardcoded "vendor-1"
// This adds: import { getVendorId } from "@/hooks/useVendor";
// And replaces: const VENDOR_ID = "vendor-1"; with proper usage

const fs = require('fs');
const path = require('path');

const files = [
  'client/src/pages/vendor-account-business-details.tsx',
  'client/src/pages/vendor-account-payment-settings.tsx',
  'client/src/pages/vendor-account.tsx',
  'client/src/pages/vendor-catalogue-browse.tsx',
  'client/src/pages/vendor-catalogue-create.tsx',
  'client/src/pages/vendor-catalogue-edit.tsx',
  'client/src/pages/vendor-customer-detail.tsx',
  'client/src/pages/vendor-dashboard-simple.tsx',
  'client/src/pages/vendor-greeting-browse.tsx',
  'client/src/pages/vendor-greeting-customize.tsx',
  'client/src/pages/vendor-leaves.tsx',
  'client/src/pages/vendor-ledger-customer-dashboard.tsx',
  'client/src/pages/vendor-ledger-customer-selection.tsx',
  'client/src/pages/vendor-ledger-transaction.tsx',
  'client/src/pages/vendor-mini-website-dashboard.tsx',
  'client/src/pages/vendor-my-catalogue.tsx',
  'client/src/pages/vendor-my-products.tsx',
  'client/src/pages/vendor-pos.tsx',
  'client/src/pages/vendor-products-browse.tsx',
  'client/src/pages/vendor-stock-analytics.tsx',
  'client/src/pages/vendor-stock-batches.tsx',
  'client/src/pages/vendor-stock-overview.tsx',
  'client/src/pages/vendor-stock-turnover.tsx',
  'client/src/pages/vendor-subscription.tsx',
  'client/src/pages/vendor-tasks-create.tsx',
  'client/src/pages/vendor-tasks-edit.tsx',
  'client/src/pages/vendor-tasks.tsx',
];

console.log('🔧 Fixing vendor pages...\n');

let fixed = 0;
let skipped = 0;
let errors = 0;

files.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  SKIP: ${filePath} (not found)`);
      skipped++;
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if already has the import
    const hasImport = content.includes('import { getVendorId } from "@/hooks/useVendor"');
    
    // Check if has hardcoded vendor-1
    const hasHardcoded = content.includes('"vendor-1"') || content.includes("'vendor-1'");

    if (!hasHardcoded) {
      console.log(`✅ OK: ${filePath} (no hardcoded ID found)`);
      skipped++;
      return;
    }

    // Add import if not present
    if (!hasImport) {
      // Find last import statement
      const importRegex = /^import .* from .*;$/gm;
      const imports = content.match(importRegex);
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        content = content.slice(0, lastImportIndex + lastImport.length) + 
                  '\nimport { getVendorId } from "@/hooks/useVendor";' +
                  content.slice(lastImportIndex + lastImport.length);
        modified = true;
      }
    }

    // Replace hardcoded VENDOR_ID declarations
    const patterns = [
      /const VENDOR_ID = ["']vendor-1["'];?\s*(\/\/.*)?/g,
      /const VENDOR_ID: string = ["']vendor-1["'];?\s*(\/\/.*)?/g,
    ];

    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    });

    // Find the component function and add VENDOR_ID at the start
    const componentMatch = content.match(/export default function \w+\([^)]*\)\s*{/);
    if (componentMatch) {
      const componentStart = content.indexOf(componentMatch[0]) + componentMatch[0].length;
      
      // Check if already has getVendorId() call inside component
      const afterComponent = content.slice(componentStart, componentStart + 500);
      if (!afterComponent.includes('getVendorId()')) {
        // Add it right after the opening brace
        content = content.slice(0, componentStart) +
                  '\n  const VENDOR_ID = getVendorId(); // Get real vendor ID from localStorage' +
                  content.slice(componentStart);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ FIXED: ${filePath}`);
      fixed++;
    } else {
      console.log(`⚠️  SKIP: ${filePath} (no changes needed)`);
      skipped++;
    }

  } catch (error) {
    console.log(`❌ ERROR: ${filePath} - ${error.message}`);
    errors++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Summary:`);
console.log(`  ✅ Fixed: ${fixed}`);
console.log(`  ⚠️  Skipped: ${skipped}`);
console.log(`  ❌ Errors: ${errors}`);
console.log(`  📝 Total: ${files.length}`);
console.log('\n✅ Done!');

