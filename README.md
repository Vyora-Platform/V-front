# Vyora Frontend

Modern React frontend for the Vyora business management platform.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: TailwindCSS 3 + shadcn/ui components
- **Routing**: Wouter
- **State**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Root component + routing
│   ├── index.css             # Global styles + Tailwind
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (47+)
│   │   ├── auth/             # Auth guard components
│   │   └── ...               # Feature components
│   ├── pages/                # Page components (96+)
│   ├── hooks/                # Custom React hooks
│   ├── contexts/             # React context providers
│   ├── services/             # Business logic services
│   ├── lib/
│   │   ├── config.ts         # API configuration
│   │   ├── queryClient.ts    # React Query setup
│   │   ├── auth.ts           # Auth utilities
│   │   └── ...               # Static data files
│   └── types/
│       └── schema.ts         # TypeScript types (no Drizzle)
├── public/                   # Static assets
├── index.html                # HTML template
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API base URL |
| `VITE_SUPABASE_URL` | ❌ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ❌ | Supabase anonymous key |

## API Communication

All API calls go through the centralized config:

```typescript
import { getApiUrl } from '@/lib/config';

// Development: proxied through Vite → http://localhost:5000/api/...
// Production: https://api.vyora.club/api/...
const response = await fetch(getApiUrl('/api/vendors'));
```

## Deployment

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set these environment variables in Vercel dashboard:
- `VITE_API_URL` = `https://api.vyora.club`
- `VITE_SUPABASE_URL` = your Supabase URL
- `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
