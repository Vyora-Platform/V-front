#!/bin/bash

# Script to fix all hardcoded vendor-1 IDs in the codebase

echo "🔧 Fixing hardcoded vendor-1 IDs..."

FILES=(
  "client/src/pages/vendor-orders.tsx"
  "client/src/pages/vendor-dashboard-simple.tsx"
  "client/src/pages/vendor-tasks-create.tsx"
  "client/src/pages/vendor-greeting-browse.tsx"
  "client/src/components/BookingFormDialog.tsx"
  "client/src/pages/vendor-ledger-customer-selection.tsx"
  "client/src/pages/vendor-leaves.tsx"
  "client/src/pages/vendor-stock-batches.tsx"
  "client/src/pages/vendor-products-browse.tsx"
  "client/src/pages/vendor-ledger-transaction.tsx"
  "client/src/pages/vendor-stock-turnover.tsx"
  "client/src/pages/vendor-catalogue-create.tsx"
  "client/src/pages/vendor-account-business-details.tsx"
  "client/src/pages/vendor-ledger-customer-dashboard.tsx"
  "client/src/pages/vendor-account-payment-settings.tsx"
  "client/src/pages/vendor-catalogue-edit.tsx"
  "client/src/pages/vendor-stock-overview.tsx"
  "client/src/pages/vendor-tasks.tsx"
  "client/src/pages/vendor-subscription.tsx"
  "client/src/pages/vendor-stock-analytics.tsx"
  "client/src/pages/vendor-greeting-customize.tsx"
  "client/src/pages/vendor-my-catalogue.tsx"
  "client/src/pages/vendor-account.tsx"
  "client/src/pages/vendor-my-products.tsx"
  "client/src/pages/vendor-tasks-edit.tsx"
  "client/src/pages/vendor-catalogue-browse.tsx"
  "client/src/components/mobile-bottom-nav.tsx"
  "client/src/components/app-sidebar.tsx"
)

COUNT=0

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    # Check if file contains vendor-1
    if grep -q "vendor-1" "$FILE"; then
      echo "📝 Fixing: $FILE"
      
      # Add import if not present
      if ! grep -q "import.*getVendorId.*from.*@/hooks/useVendor" "$FILE"; then
        # Find the last import line and add after it
        sed -i '' '/^import/a\
import { getVendorId } from "@/hooks/useVendor";
' "$FILE" 2>/dev/null || sed -i '/^import/a import { getVendorId } from "@/hooks/useVendor";' "$FILE"
      fi
      
      # Replace const VENDOR_ID = "vendor-1" with getVendorId()
      sed -i '' 's/const VENDOR_ID = "vendor-1"/const VENDOR_ID = getVendorId()/g' "$FILE" 2>/dev/null || \
        sed -i 's/const VENDOR_ID = "vendor-1"/const VENDOR_ID = getVendorId()/g' "$FILE"
      
      # Replace any inline "vendor-1" string literals in URLs
      sed -i '' 's|/vendor-1/|/${VENDOR_ID}/|g' "$FILE" 2>/dev/null || \
        sed -i 's|/vendor-1/|/${VENDOR_ID}/|g' "$FILE"
      
      # Replace any API calls with hardcoded vendor-1
      sed -i '' 's|/api/vendors/vendor-1/|/api/vendors/${VENDOR_ID}/|g' "$FILE" 2>/dev/null || \
        sed -i 's|/api/vendors/vendor-1/|/api/vendors/${VENDOR_ID}/|g' "$FILE"
      
      COUNT=$((COUNT + 1))
    fi
  fi
done

echo ""
echo "✅ Fixed $COUNT files!"
echo "🔄 Now restart your server: npm run dev"
echo "🌐 Then open Incognito window: http://localhost:3000/login"

