#!/bin/bash

# VYORA Development Server Startup Script
# This script helps you start the application with required environment variables

echo "🚀 Starting VYORA Development Server"
echo ""

# Check if environment variables are set
if [ -z "$NEW_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  NEW_SUPABASE_ANON_KEY is not set"
    echo ""
    echo "Please set your Supabase credentials:"
    echo ""
    echo "Get them from: https://supabase.com/dashboard/project/abizuwqnqkbicrhorcig/settings/api"
    echo ""
    echo "Then run:"
    echo "  export NEW_SUPABASE_ANON_KEY='your-anon-key'"
    echo "  export NEW_SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
    echo "  export NEW_DATABASE_URL='your-database-url'"
    echo ""
    echo "Or run the server directly with:"
    echo "  NEW_SUPABASE_ANON_KEY='...' NEW_SUPABASE_SERVICE_ROLE_KEY='...' NEW_DATABASE_URL='...' PORT=3000 npm run dev"
    echo ""
    exit 1
fi

if [ -z "$NEW_SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️  NEW_SUPABASE_SERVICE_ROLE_KEY is not set"
    exit 1
fi

if [ -z "$NEW_DATABASE_URL" ]; then
    echo "⚠️  NEW_DATABASE_URL is not set"
    echo ""
    echo "Get it from: https://supabase.com/dashboard/project/abizuwqnqkbicrhorcig/settings/database"
    echo "Select: Connection string → URI → Transaction pooler (port 6543)"
    echo ""
    exit 1
fi

# Set default port if not specified
export PORT=${PORT:-3000}

echo "✅ All environment variables are set"
echo ""
echo "📡 Starting server on port $PORT..."
echo "🌐 Open: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server (integrated mode)
npm run dev

