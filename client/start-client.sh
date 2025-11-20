#!/bin/bash

# VYORA Client Development Server
# This script starts only the client (Vite) development server

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

echo "🌐 Starting VYORA Client Development Server"
echo ""

echo "📍 Client will be available at: http://localhost:5173"
echo ""
echo "ℹ️  Using development Supabase configuration (fallback values)"
echo ""

# Check if node_modules exists, if not, install dependencies
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Start the client development server
npm run dev:client
