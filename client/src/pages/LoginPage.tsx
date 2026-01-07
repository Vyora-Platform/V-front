import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export function LoginPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation('/');
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600" data-testid="div-loading">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col md:flex-row" data-testid="page-login">
      {/* Left side - Blue background with welcome text */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        {/* Back button - desktop */}
        <Link href="/" className="absolute top-6 left-6 z-20">
          <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Home</span>
          </button>
        </Link>
        
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-300/10 rounded-full blur-2xl" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-8 shadow-2xl">
            <span className="text-white font-bold text-4xl" style={{ fontFamily: 'Poppins, sans-serif' }}>V</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Welcome Back!
          </h1>
          
          <p className="text-xl text-blue-100 max-w-md leading-relaxed mb-8">
            Sign in to access your dashboard and manage your business seamlessly
          </p>
          
          <div className="flex flex-col gap-4 text-left max-w-sm">
            {[
              "Access your complete business dashboard",
              "Manage appointments, orders & bookings",
              "Track leads, customers & revenue",
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-blue-100 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile header with back button */}
      <div className="md:hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 px-4 py-6 relative">
        <Link href="/" className="absolute top-4 left-4 z-20">
          <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Back</span>
          </button>
        </Link>
        
        <div className="text-center pt-6">
          <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>V</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Welcome Back!
          </h1>
          <p className="text-blue-100 text-sm">
            Sign in to continue to your dashboard
          </p>
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="flex-1 md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-white">
        <div className="w-full max-w-md">
      <LoginForm />
        </div>
      </div>
    </div>
  );
}
