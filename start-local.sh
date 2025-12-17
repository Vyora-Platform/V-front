#!/bin/bash

# VYORA Local Development Server
# This script starts the server with all required environment variables

echo "🚀 Starting VYORA Development Server"
echo ""

# Set upload directories
export PUBLIC_OBJECT_SEARCH_PATHS=/Users/aman/Downloads/VYORA-main/uploads/public
export PRIVATE_OBJECT_DIR=/Users/aman/Downloads/VYORA-main/uploads/private
export PORT=3000

export NEW_DATABASE_URL='postgresql://postgres.abizuwqnqkbicrhorcig:8819%401464%23piyaA@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
export NEW_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiaXp1d3FucWtiaWNyaG9yY2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzQxMzksImV4cCI6MjA3ODAxMDEzOX0.2p6dzPcKRJtW2-U0MnCPKfWK7TCyl41A4VFqyV80pwc'
export NEW_SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiaXp1d3FucWtiaWNyaG9yY2lnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzNDEzOSwiZXhwIjoyMDc4MDEwMTM5fQ.crZAsJs2BboDOGgsL_BMPCqa3jvWkFC-IY0_avkxZHI'
export PUBLIC_OBJECT_SEARCH_PATHS=/Users/aman/Downloads/VYORA-main/uploads/public
export PRIVATE_OBJECT_DIR=/Users/aman/Downloads/VYORA-main/uploads/private
export PORT=3000

# export RAZORPAY_KEY_ID=rzp_test_Rg43DnQG1mP1qj
# export RAZORPAY_KEY_SECRET=zNB7D2wUuAAH6zg3YhGri8e6
export RAZORPAY_KEY_ID=rzp_test_RhHdGgNx7Uu3Rf
export RAZORPAY_KEY_SECRET=vCCsk3Ik5YYplYYWWLTqSHKv


echo "📁 Upload directories configured:"
echo "   Public: $PUBLIC_OBJECT_SEARCH_PATHS"
echo "   Private: $PRIVATE_OBJECT_DIR"
echo ""

# Check if Supabase credentials are set
if [ -z "$NEW_DATABASE_URL" ] && [ -z "$DATABASE_URL" ]; then
    echo "⚠️  Database credentials not found!"
    echo ""
    echo "Please set your Supabase credentials:"
    echo ""
    echo "export NEW_DATABASE_URL='postgresql://postgres.abizuwqnqkbicrhorcig:8819%401464%23piyaA@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'"
    echo "export NEW_SUPABASE_ANON_KEY='your-anon-key'"
    echo "export NEW_SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
    echo ""
    echo "Or run:"
    echo ""
    echo "NEW_DATABASE_URL='postgresql://postgres.abizuwqnqkbicrhorcig:8819%401464%23piyaA@aws-1-ap-south-1.pooler.supabase.com:6543/postgres' \\"
    echo "NEW_SUPABASE_ANON_KEY='your-anon-key' \\"
    echo "NEW_SUPABASE_SERVICE_ROLE_KEY='your-service-role-key' \\"
    echo "./start-local.sh"
    echo ""
    exit 1
fi

echo "✅ Database configured"

if [ -n "$NEW_SUPABASE_ANON_KEY" ] || [ -n "$SUPABASE_ANON_KEY" ]; then
    echo "✅ Supabase credentials configured"
fi

echo ""
echo "🌐 Server will be available at: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start both client and server separately
echo "🚀 Starting VYORA Client and Server Separately"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping all processes..."
    kill $CLIENT_PID $SERVER_PID 2>/dev/null
    exit 0
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

echo "🌐 Starting Client on port 5173..."
npm run dev:client &
CLIENT_PID=$!

echo "⚙️  Starting Server on port 3000..."
npm run dev:server &
SERVER_PID=$!

echo ""
echo "📋 Services:"
echo "   Client: http://localhost:5173"
echo "   Server: http://localhost:3000"
echo "   API: http://localhost:3000/api/*"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait $CLIENT_PID $SERVER_PID

