import { createClient } from '@supabase/supabase-js';

// Development fallback values
const DEV_SUPABASE_URL = 'https://abizuwqnqkbicrhorcig.supabase.co';
const DEV_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiaXp1d3FucWtiaWNyaG9yY2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzQxMzksImV4cCI6MjA3ODAxMDEzOX0.2p6dzPcKRJtW2-U0MnCPKfWK7TCyl41A4VFqyV80pwc';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEV_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEV_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using development defaults.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'vyora-auth',
  },
});
