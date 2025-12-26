import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getApiUrl } from '@/lib/config';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, role?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // If user is logged in, fetch vendor data and set localStorage
      if (session?.user) {
        await fetchAndSetVendorData(session.user.id);
      }
      
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // If user is logged in, fetch vendor data and set localStorage
      if (session?.user) {
        await fetchAndSetVendorData(session.user.id);
      }
      // ✅ IMPORTANT: Don't clear localStorage when no Supabase session
      // We're using JWT auth, not Supabase auth, so no session is normal
      // Only clear localStorage on EXPLICIT logout action
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to fetch vendor data and set localStorage
  const fetchAndSetVendorData = async (supabaseUserId: string) => {
    try {
      console.log('🔐 [Auth] Fetching vendor data for user:', supabaseUserId);
      
      // Fetch vendor by Supabase user ID
      const response = await fetch(getApiUrl(`/api/vendors/user/${supabaseUserId}`));
      
      if (response.ok) {
        const vendor = await response.json();
        console.log('✅ [Auth] Vendor data found:', vendor);
        
        // Set localStorage
        localStorage.setItem('userId', vendor.userId || supabaseUserId);
        localStorage.setItem('vendorId', vendor.id);
        localStorage.setItem('userRole', 'vendor');
        
        // Store selected categories for product form filtering
        if (vendor.selectedCategories && Array.isArray(vendor.selectedCategories)) {
          localStorage.setItem('vendorSelectedCategories', JSON.stringify(vendor.selectedCategories));
        }
        if (vendor.selectedSubcategories && Array.isArray(vendor.selectedSubcategories)) {
          localStorage.setItem('vendorSelectedSubcategories', JSON.stringify(vendor.selectedSubcategories));
        }
        
        console.log('✅ [Auth] localStorage set:', {
          userId: vendor.userId || supabaseUserId,
          vendorId: vendor.id,
          userRole: 'vendor',
          selectedCategories: vendor.selectedCategories,
        });
      } else {
        console.warn('⚠️ [Auth] No vendor found for user, setting userId only');
        localStorage.setItem('userId', supabaseUserId);
        localStorage.setItem('userRole', 'vendor');
      }
    } catch (error) {
      console.error('❌ [Auth] Error fetching vendor data:', error);
      // Fallback: set userId at least
      localStorage.setItem('userId', supabaseUserId);
      localStorage.setItem('userRole', 'vendor');
    }
  };

  const signUp = async (email: string, password: string, username: string, role: string = 'vendor') => {
    try {
      const response = await fetch(getApiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide helpful error messages for common issues
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address before logging in. Check your inbox for the confirmation link. Or disable email confirmation in Supabase dashboard for development.');
        }
        throw error;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
