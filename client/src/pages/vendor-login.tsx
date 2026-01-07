import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, AlertCircle, ArrowRight, ArrowLeft, Sparkles, Shield, Zap } from "lucide-react";
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      console.log('✅ [Login] User already authenticated, redirecting to dashboard...');
      setLocation('/vendor/dashboard');
    }
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

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userRole", data.user.role);
      
      if (data.user.vendorId) {
        localStorage.setItem("vendorId", data.user.vendorId);
      }

      console.log("✅ [Login] JWT login successful:", data.user);

      if (data.user.role === "vendor") {
        if (data.user.vendorId) {
          toast({
            title: "Welcome back!",
            description: `Logged in successfully`,
          });
          setLocation("/vendor/dashboard");
        } else {
          toast({
            title: "Complete your profile",
            description: "Please complete your vendor onboarding",
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
      } else {
        toast({
          title: "Welcome!",
          description: "Logged in successfully",
        });
        setLocation("/vendor/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-float-delayed { animation: float 4s ease-in-out infinite; animation-delay: 1s; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
      `}</style>

      {/* Left Side - Decorative Panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative flex-col justify-center items-center p-12">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="mx-auto mb-8 animate-float">
            <img 
              src="https://abizuwqnqkbicrhorcig.supabase.co/storage/v1/object/public/vyora-bucket/partners-vyora/p/IMAGE/logo-vyora.png" 
              alt="Vyora Logo" 
              className="h-20 w-auto object-contain bg-white rounded-2xl p-2 mx-auto"
            />
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Welcome to Vyora
          </h2>
          <p className="text-blue-100 text-lg mb-10">
            The all-in-one platform trusted by 12,000+ businesses across India
          </p>
          
          {/* Features */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-300" />
              </div>
              <div>
                <h4 className="text-white font-semibold">20+ Business Tools</h4>
                <p className="text-blue-200 text-sm">Everything you need in one place</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 animate-float-delayed">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h4 className="text-white font-semibold">Save 35+ Hours/Week</h4>
                <p className="text-blue-200 text-sm">Automate your business operations</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h4 className="text-white font-semibold">Bank-Grade Security</h4>
                <p className="text-blue-200 text-sm">Your data is always protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-8">
        {/* Back Button - Always on the right */}
        <button 
          onClick={() => setLocation("/")}
          className="absolute top-6 right-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors z-10 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium text-sm">Back</span>
        </button>

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <img 
              src="https://abizuwqnqkbicrhorcig.supabase.co/storage/v1/object/public/vyora-bucket/partners-vyora/p/IMAGE/logo-vyora.png" 
              alt="Vyora Logo" 
              className="h-16 w-auto object-contain mx-auto mb-4"
            />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Welcome back! 👋
            </h1>
            <p className="text-gray-500 text-lg">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Form Card */}
          <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="input-email"
                      required
                      disabled={loading}
                      className="h-14 pl-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 font-semibold">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      data-testid="input-password"
                      required
                      disabled={loading}
                      className="h-14 pl-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-base"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-lg shadow-xl shadow-blue-500/30 transition-all hover:shadow-blue-500/40 hover:scale-[1.02]"
                  data-testid="button-login"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
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

              <div className="mt-8 text-center">
                <p className="text-gray-500">
                  New to Vyora?{" "}
                  <button
                    onClick={() => setLocation("/signup")}
                    className="text-blue-600 hover:text-blue-700 font-bold"
                  >
                    Create free account
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 mt-8 text-sm text-gray-400">
            <Shield className="w-4 h-4" />
            <span>Secure login powered by Vyora</span>
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
