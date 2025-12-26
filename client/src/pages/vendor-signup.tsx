import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Mail, Lock, AlertCircle, User, Phone, ArrowRight, Eye, EyeOff, CheckCircle2, Sparkles, Rocket, Gift, Shield } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

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
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.businessName.trim()) {
      setError("Please enter your business name");
      return;
    }

    if (!formData.ownerName.trim()) {
      setError("Please enter your name");
      return;
    }

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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-glow { animation: glow 4s ease-in-out infinite; }
        .animate-fade-in { animation: fadeInUp 0.6s ease-out forwards; }
        .font-jakarta { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      `}</style>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-blue-600/10 rounded-full blur-3xl animate-glow" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-gradient-to-br from-blue-300/15 to-cyan-400/10 rounded-full blur-3xl animate-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-32 right-1/3 w-72 h-72 bg-gradient-to-br from-blue-200/15 to-blue-400/10 rounded-full blur-3xl animate-glow" style={{ animationDelay: '2s' }} />
        
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
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12">
          <div className="w-full max-w-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <img src={VYORA_LOGO} alt="Vyora" className="w-12 h-12 rounded-xl shadow-lg shadow-blue-500/25 object-contain" />
              <span className="text-2xl font-bold text-blue-600 font-jakarta">Vyora</span>
            </div>

            {/* Form Header */}
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 font-jakarta">
                Start Your Journey 🚀
              </h2>
              <p className="text-gray-600 text-lg">
                Join 12,000+ businesses growing with Vyora
              </p>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-600 rounded-xl animate-fade-in">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Business & Owner Name Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-gray-700 font-medium text-sm">
                    Business Name *
                  </Label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="Your business name"
                      value={formData.businessName}
                      onChange={(e) => handleChange("businessName", e.target.value)}
                      required
                      disabled={loading}
                      className="h-13 pl-12 rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="text-gray-700 font-medium text-sm">
                    Your Name *
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="ownerName"
                      type="text"
                      placeholder="Full name"
                      value={formData.ownerName}
                      onChange={(e) => handleChange("ownerName", e.target.value)}
                      required
                      disabled={loading}
                      className="h-13 pl-12 rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Phone Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium text-sm">
                    Email Address *
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      required
                      disabled={loading}
                      className="h-13 pl-12 rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium text-sm">
                    Phone Number *
                  </Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      required
                      disabled={loading}
                      className="h-13 pl-12 rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Password Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                    Password *
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      className="h-13 pl-12 pr-12 rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${passwordStrength > 2 ? 'text-green-600' : 'text-gray-500'}`}>
                        {strengthLabels[passwordStrength - 1] || 'Enter password'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium text-sm">
                    Confirm Password *
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      required
                      disabled={loading}
                      className="h-13 pl-12 pr-12 rounded-xl border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <p className={`text-xs flex items-center gap-1 ${
                      formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Passwords match
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Passwords don't match
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-base shadow-xl shadow-blue-500/25 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] border-0 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-3">
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

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>

            {/* Features */}
            <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm text-gray-500">
              {[
                { icon: CheckCircle2, text: 'Free forever' },
                { icon: CheckCircle2, text: 'No credit card' },
                { icon: CheckCircle2, text: 'Setup in 5 mins' },
              ].map((feature) => (
                <div key={feature.text} className="flex items-center gap-1.5">
                  <feature.icon className="w-4 h-4 text-blue-500" />
                  <span>{feature.text}</span>
                </div>
              ))}
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

        {/* Right Side - Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-5/12 flex-col justify-center items-center p-12 xl:p-16 bg-gradient-to-br from-blue-600 to-blue-800">
          <div className="max-w-md animate-fade-in">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-12">
              <img src={VYORA_LOGO} alt="Vyora" className="w-14 h-14 rounded-2xl shadow-xl shadow-blue-900/25 animate-float object-contain bg-white p-1" />
              <div>
                <h1 className="text-3xl font-bold text-white font-jakarta tracking-tight">Vyora</h1>
                <p className="text-blue-200 text-sm font-medium">Business Platform</p>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6 font-jakarta">
              Everything You Need to 
              <span className="text-blue-200">
                {" "}Grow Online
              </span>
            </h2>
            
            <p className="text-blue-100 text-lg mb-10 leading-relaxed">
              Launch your business online in minutes with our comprehensive suite of tools.
            </p>

            {/* Benefits */}
            <div className="space-y-4">
              {[
                { icon: Sparkles, title: 'Free Forever Plan', desc: 'Start with essential tools at no cost', color: 'text-yellow-300', bg: 'bg-yellow-500/20' },
                { icon: Rocket, title: 'Launch in 24 Hours', desc: 'Get your business online quickly', color: 'text-blue-200', bg: 'bg-blue-400/20' },
                { icon: Gift, title: '190+ Categories', desc: 'Built for any type of business', color: 'text-pink-300', bg: 'bg-pink-500/20' },
              ].map((benefit, index) => (
                <div 
                  key={benefit.title}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm animate-fade-in"
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  <div className={`w-10 h-10 rounded-xl ${benefit.bg} flex items-center justify-center flex-shrink-0`}>
                    <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold font-jakarta">{benefit.title}</h4>
                    <p className="text-blue-100 text-sm">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-2 mt-10 text-sm text-blue-200">
              <Shield className="w-4 h-4" />
              <span>Secured with bank-grade encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
