import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getApiUrl } from '@/lib/config';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  vendorId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, role?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function JWTAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // Set localStorage items for backward compatibility
        localStorage.setItem('userId', parsedUser.id);
        localStorage.setItem('userRole', parsedUser.role);
        if (parsedUser.vendorId) {
          localStorage.setItem('vendorId', parsedUser.vendorId);
        }
        
        console.log('✅ [JWT Auth] Loaded from localStorage:', parsedUser);
      } catch (error) {
        console.error('❌ [JWT Auth] Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

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

      // Store token and user
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Set backward compatibility items
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userRole', data.user.role);
      if (data.user.vendorId) {
        localStorage.setItem('vendorId', data.user.vendorId);
      }

      console.log('✅ [JWT Auth] Signed up successfully:', data.user);

      return { error: null };
    } catch (error) {
      console.error('❌ [JWT Auth] Signup error:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(getApiUrl('/api/auth/login'), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password }),
  credentials: "include",
});


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      // Store token and user
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Set backward compatibility items
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userRole', data.user.role);
      if (data.user.vendorId) {
        localStorage.setItem('vendorId', data.user.vendorId);
      }

      console.log('✅ [JWT Auth] Logged in successfully:', data.user);

      return { error: null };
    } catch (error) {
      console.error('❌ [JWT Auth] Login error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      // Call logout endpoint
      await fetch(getApiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('❌ [JWT Auth] Logout error:', error);
    }

    // Clear state and localStorage
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('vendorId');
    localStorage.removeItem('userRole');

    console.log('✅ [JWT Auth] Signed out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useJWTAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useJWTAuth must be used within a JWTAuthProvider');
  }
  return context;
}

