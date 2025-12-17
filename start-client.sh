#!/bin/bash

# VYORA Client Development Server
# This script starts only the client (Vite) development server

echo "🌐 Starting VYORA Client Development Server"
echo ""

echo "📍 Client will be available at: http://localhost:5173"
echo ""
echo "ℹ️  Using development Supabase configuration (fallback values)"
echo ""

# Start the client development server
npm run dev:client

