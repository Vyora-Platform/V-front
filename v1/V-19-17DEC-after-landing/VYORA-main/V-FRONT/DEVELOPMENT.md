# VYORA Development Setup

This document explains how to run the VYORA application in different development modes.

## 🚀 Quick Start

### Option 1: Integrated Development (Recommended for beginners)
Run both client and server together on a single port.

```bash
./start-dev.sh
# or
./start-local.sh
```

- **URL**: http://localhost:3000
- **Mode**: Client + Server integrated via Vite

### Option 2: Separated Development (Recommended for advanced development)
Run client and server as separate processes for better development experience.

```bash
# Terminal 1: Start the server
./start-server.sh

# Terminal 2: Start the client
./start-client.sh
```

- **Client URL**: http://localhost:5173
- **Server URL**: http://localhost:3000
- **API endpoints**: http://localhost:3000/api/*

### Option 3: Manual Separate Development

```bash
# Terminal 1: Server only
npm run dev:server

# Terminal 2: Client only (with environment variables)
VITE_SUPABASE_URL=https://your-project.supabase.co \
VITE_SUPABASE_ANON_KEY=your-anon-key \
npm run dev:client
```

## 📋 Available Scripts

### Package.json Scripts
- `npm run dev` - Integrated development (client + server)
- `npm run dev:client` - Client only (Vite dev server on port 5173)
- `npm run dev:server` - Server only (Express API on port 3000)
- `npm run build` - Build both client and server
- `npm run build:client` - Build client only
- `npm run build:server` - Build server only
- `npm run start` - Production mode

### Shell Scripts
- `./start-dev.sh` - Integrated development with environment checks
- `./start-local.sh` - Separated development (both client and server)
- `./start-client.sh` - Client only development
- `./start-server.sh` - Server only development

## 🔧 Environment Variables

### Server Environment Variables
The server requires these environment variables:

```bash
# Database
NEW_DATABASE_URL=postgresql://...

# Supabase
NEW_SUPABASE_ANON_KEY=...
NEW_SUPABASE_SERVICE_ROLE_KEY=...

# Razorpay (optional)
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# Upload directories
PUBLIC_OBJECT_SEARCH_PATHS=/path/to/uploads/public
PRIVATE_OBJECT_DIR=/path/to/uploads/private

# Ports
PORT=3000  # Server port
```

### Client Environment Variables (Separated Mode Only)
When running the client separately, these environment variables are needed:

```bash
# Supabase (for client-side authentication)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note**: In integrated mode, these are automatically provided by the Vite configuration. In separated mode, they are set by the startup scripts, or fallback to development defaults if not available.

## 🏗️ Architecture

### Integrated Mode (`npm run dev`)
- Single Express server serves both API and client
- Vite handles client-side development with HMR
- All requests go through port 3000

### Separated Mode (`npm run dev:server` + `npm run dev:client`)
- **Server**: Express API server on port 3000
- **Client**: Vite dev server on port 5173
- **API Routing**: Uses `getApiUrl()` from `@/lib/config` to automatically route API calls to correct server
- **CORS**: Server handles CORS for localhost ports (3000, 5173)
- Better for debugging and separate deployments

## 🔍 Debugging

### Client Issues
- Check browser console at http://localhost:5173 (separated mode)
- Check http://localhost:3000 (integrated mode)

### Server Issues
- Check terminal output for server logs
- API endpoints: http://localhost:3000/api/*

### CORS Issues (Separated Mode)
If you encounter CORS errors in separated mode:
- Ensure both client (5173) and server (3000) are running
- The client automatically detects separated mode and routes API calls to `http://localhost:3000`
- CORS is handled automatically for localhost development

## 🚀 Production Deployment

```bash
# Build both client and server
npm run build

# Start production server
npm start
```

The production build serves the client as static files from the same Express server.
