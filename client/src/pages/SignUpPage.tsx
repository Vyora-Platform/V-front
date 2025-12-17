import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function SignUpPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation('/');
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-black" data-testid="div-loading">
        <p className="text-muted-foreground" data-testid="text-loading">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-black p-4" data-testid="page-signup">
      <SignUpForm />
    </div>
  );
}
