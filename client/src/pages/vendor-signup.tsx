import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Building2, Mail, Lock, AlertCircle, User, Phone, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Rocket, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiUrl } from "@/lib/config";

export default function VendorSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    ownerName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      console.log('✅ [Signup] User already authenticated, redirecting to dashboard...');
      setLocation('/vendor/dashboard');
    }
  }, [setLocation]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/auth/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.email.split('@')[0],
          role: "vendor",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account. Please try again.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userRole", "vendor");
      
      localStorage.setItem("tempBusinessName", formData.businessName);
      localStorage.setItem("tempOwnerName", formData.ownerName);
      localStorage.setItem("tempPhone", formData.phone);
      localStorage.setItem("tempEmail", formData.email);

      console.log("✅ [Signup] JWT signup successful:", data.user);

      toast({
        title: "Account created!",
        description: "Let's set up your business.",
      });

      setLocation("/onboarding");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
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
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-float-delayed { animation: float 4s ease-in-out infinite; animation-delay: 1s; }
        .animate-float-delayed-2 { animation: float 4s ease-in-out infinite; animation-delay: 2s; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
      `}</style>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-6 lg:p-8">
        {/* Back Button - Always on the right */}
        <button 
          onClick={() => setLocation("/")}
          className="absolute top-6 right-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors z-10 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium text-sm">Back</span>
        </button>

        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="text-center mb-6 lg:hidden">
            <img 
              src="https://abizuwqnqkbicrhorcig.supabase.co/storage/v1/object/public/vyora-bucket/partners-vyora/p/IMAGE/logo-vyora.png" 
              alt="Vyora Logo" 
              className="h-14 w-auto object-contain mx-auto mb-3"
            />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Start Your Free Journey 🚀
            </h1>
            <p className="text-gray-500 text-base md:text-lg">
              Join 12,000+ businesses growing with Vyora
            </p>
          </div>

          {/* Form Card */}
          <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="businessName" className="text-gray-700 font-semibold text-sm">
                      Business Name
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                      <Input
                        id="businessName"
                        type="text"
                        placeholder="Your business name"
                        value={formData.businessName}
                        onChange={(e) => handleChange("businessName", e.target.value)}
                        required
                        disabled={loading}
                        className="h-12 pl-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ownerName" className="text-gray-700 font-semibold text-sm">
                      Your Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                      <Input
                        id="ownerName"
                        type="text"
                        placeholder="Full name"
                        value={formData.ownerName}
                        onChange={(e) => handleChange("ownerName", e.target.value)}
                        required
                        disabled={loading}
                        className="h-12 pl-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        required
                        disabled={loading}
                        className="h-12 pl-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-gray-700 font-semibold text-sm">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        required
                        disabled={loading}
                        className="h-12 pl-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
                        className="h-12 pl-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold text-sm">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        required
                        disabled={loading}
                        className="h-12 pl-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl font-semibold text-lg shadow-xl shadow-blue-500/30 transition-all hover:shadow-blue-500/40 hover:scale-[1.02] mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Free Account
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-500">
                  Already have an account?{" "}
                  <button
                    onClick={() => setLocation("/login")}
                    className="text-blue-600 hover:text-blue-700 font-bold"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Setup in 5 mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Decorative Panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 relative flex-col justify-center items-center p-12">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-green-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="mx-auto mb-8 animate-float">
            <img 
              src="https://abizuwqnqkbicrhorcig.supabase.co/storage/v1/object/public/vyora-bucket/partners-vyora/p/IMAGE/logo-vyora.png" 
              alt="Vyora Logo" 
              className="h-20 w-auto object-contain bg-white rounded-2xl p-2 mx-auto"
            />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Grow Your Business
          </h2>
          <p className="text-green-100 text-lg mb-10">
            Everything you need to manage and grow your business
          </p>
          
          {/* Benefits */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 animate-float">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h4 className="text-white font-semibold">Free Forever Plan</h4>
                <p className="text-green-200 text-sm">Start with essential tools at no cost</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 animate-float-delayed">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h4 className="text-white font-semibold">Launch in 24 Hours</h4>
                <p className="text-green-200 text-sm">Get your business online quickly</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 animate-float-delayed-2">
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-pink-300" />
              </div>
              <div>
                <h4 className="text-white font-semibold">190+ Business Categories</h4>
                <p className="text-green-200 text-sm">Built for any type of business</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
