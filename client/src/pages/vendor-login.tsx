import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, Sparkles, Shield, Zap, TrendingUp, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiUrl } from "@/lib/config";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";

export default function VendorLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Redirect if already authenticated - check onboarding status properly
  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const vendorId = localStorage.getItem('vendorId');
      const userRole = localStorage.getItem('userRole');
      
      if (token && userId) {
        console.log('✅ [Login] User already authenticated, checking onboarding status...');
        
        // For vendors, check if onboarding is complete
        if (userRole === 'vendor' && vendorId) {
          try {
            const response = await fetch(getApiUrl(`/api/vendors/${vendorId}`), {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
              const vendor = await response.json();
              if (vendor.onboardingComplete) {
                setLocation('/vendor/dashboard');
              } else {
                setLocation('/onboarding');
              }
            } else {
              setLocation('/vendor/dashboard');
            }
          } catch {
            setLocation('/vendor/dashboard');
          }
        } else if (userRole === 'admin' || userRole === 'employee') {
          setLocation('/admin/dashboard');
        } else {
          setLocation('/vendor/dashboard');
        }
      }
    };
    
    checkExistingAuth();
  }, [setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }

      // IMPORTANT: Only allow Admin, Employee, and Vendor roles to login
      // Customers must use mini-website customer login
      const allowedRoles = ["admin", "employee", "vendor"];
      if (!allowedRoles.includes(data.user.role)) {
        setError("Access denied. Only business accounts can login here. Customers should use the store login.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userRole", data.user.role);
      
      if (data.user.vendorId) {
        localStorage.setItem("vendorId", data.user.vendorId);
      }
      
      // Store selected categories for product form filtering
      if (data.user.selectedCategories && Array.isArray(data.user.selectedCategories)) {
        localStorage.setItem("vendorSelectedCategories", JSON.stringify(data.user.selectedCategories));
      }
      if (data.user.selectedSubcategories && Array.isArray(data.user.selectedSubcategories)) {
        localStorage.setItem("vendorSelectedSubcategories", JSON.stringify(data.user.selectedSubcategories));
      }

      console.log("✅ [Login] JWT login successful:", data.user);

      if (data.user.role === "vendor") {
        // CRITICAL: Check if vendor has completed onboarding
        // Use the onboardingComplete flag from the login response
        if (data.user.vendorId && data.user.onboardingComplete === true) {
          toast({
            title: "Welcome back!",
            description: `Logged in successfully`,
          });
          setLocation("/vendor/dashboard");
        } else {
          // Either no vendorId or onboarding is not complete
          toast({
            title: "Complete your profile",
            description: "Please complete your vendor onboarding to continue",
          });
          setLocation("/onboarding");
        }
      } else if (data.user.role === "admin") {
        toast({
          title: "Welcome Admin!",
          description: "Redirecting to admin dashboard",
        });
        setLocation("/admin/dashboard");
      } else if (data.user.role === "employee") {
        toast({
          title: "Welcome!",
          description: "Redirecting to admin dashboard",
        });
        setLocation("/admin/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const VYORA_LOGO = "https://abizuwqnqkbicrhorcig.storage.supabase.co/storage/v1/object/public/vyora-bucket/partners-vyora/p/IMAGE/logo-vyora.png";

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.3; filter: blur(40px); }
          50% { opacity: 0.5; filter: blur(60px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 6s ease-in-out infinite; animation-delay: 2s; }
        .animate-glow { animation: glow 4s ease-in-out infinite; }
        .animate-shimmer { 
          background: linear-gradient(90deg, transparent, rgba(59,130,246,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
        .animate-fade-in { animation: fadeInUp 0.6s ease-out forwards; }
        .font-jakarta { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      `}</style>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large gradient orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-blue-600/10 rounded-full blur-3xl animate-glow" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-gradient-to-br from-blue-300/15 to-cyan-400/10 rounded-full blur-3xl animate-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-gradient-to-br from-blue-200/15 to-blue-400/10 rounded-full blur-3xl animate-glow" style={{ animationDelay: '2s' }} />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.2) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 xl:p-16 bg-gradient-to-br from-blue-600 to-blue-800">
          <div className="max-w-lg animate-fade-in">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-12">
              <img src={VYORA_LOGO} alt="Vyora" className="w-14 h-14 rounded-2xl shadow-xl shadow-blue-900/25 animate-float object-contain bg-white p-1" />
              <div>
                <h1 className="text-3xl font-bold text-white font-jakarta tracking-tight">Vyora</h1>
                <p className="text-blue-200 text-sm font-medium">Business Platform</p>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-6 font-jakarta">
              Grow Your <br/>
              <span className="text-blue-200">
                Business Online
              </span>
            </h2>
            
            <p className="text-blue-100 text-lg mb-12 leading-relaxed">
              The complete platform trusted by 12,000+ businesses across India. 
              Manage orders, customers, inventory, and grow your brand.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              {[
                { icon: Users, value: '12K+', label: 'Businesses' },
                { icon: TrendingUp, value: '35%', label: 'Avg. Growth' },
                { icon: Sparkles, value: '20+', label: 'Tools' },
              ].map((stat, index) => (
                <div 
                  key={stat.label}
                  className="text-center p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm animate-fade-in"
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                  <stat.icon className="h-5 w-5 text-blue-200 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white font-jakarta">{stat.value}</div>
                  <div className="text-xs text-blue-200">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              {['POS System', 'Inventory', 'Analytics', 'Website Builder'].map((feature, index) => (
                <span 
                  key={feature}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white border border-white/20 animate-fade-in"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12">
          <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
              <img src={VYORA_LOGO} alt="Vyora" className="w-12 h-12 rounded-xl shadow-lg shadow-blue-500/25 object-contain" />
              <span className="text-2xl font-bold text-blue-600 font-jakarta">Vyora</span>
            </div>

            {/* Form Header */}
            <div className="text-center lg:text-left mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 font-jakarta">
                Welcome back
              </h2>
              <p className="text-gray-600 text-lg">
                Sign in to continue to your dashboard
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-600 rounded-xl animate-fade-in">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium text-sm">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-email"
                    required
                    disabled={loading}
                    className="h-14 pl-12 pr-4 rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-base transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-password"
                    required
                    disabled={loading}
                    className="h-14 pl-12 pr-12 rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-base transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-base shadow-xl shadow-blue-500/25 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] border-0"
                data-testid="button-login"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                New to Vyora?{" "}
                <button
                  onClick={() => setLocation("/signup")}
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Create free account
                </button>
              </p>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mt-10 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Secured with bank-grade encryption</span>
            </div>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setLocation("/")}
                className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
}
