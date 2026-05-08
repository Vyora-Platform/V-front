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
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-white relative">
      {/* Back Button (App Style) */}
      <button
        onClick={() => setLocation("/")}
        className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
        title="Go back"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="w-full max-w-[440px] px-6 py-10 flex flex-col mt-12 md:mt-0">

        {/* App Header */}
        <div className="text-left mb-8 mt-4">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Create Account
          </h1>
          <p className="text-gray-500 text-[16px] mt-2 font-medium">
            Join 12,000+ businesses growing with Vyora
          </p>
        </div>

        {/* Native Style Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50 py-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="businessName"
                  type="text"
                  placeholder="Business Name"
                  value={formData.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-14 pl-12 bg-gray-50 border-gray-200 rounded-2xl text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-sm"
                />
              </div>

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="ownerName"
                  type="text"
                  placeholder="Your Name"
                  value={formData.ownerName}
                  onChange={(e) => handleChange("ownerName", e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-14 pl-12 bg-gray-50 border-gray-200 rounded-2xl text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-14 pl-12 bg-gray-50 border-gray-200 rounded-2xl text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-sm"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-14 pl-12 bg-gray-50 border-gray-200 rounded-2xl text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="w-full h-14 pl-12 bg-gray-50 border-gray-200 rounded-2xl text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-sm"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-14 pl-12 bg-gray-50 border-gray-200 rounded-2xl text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Account...
              </span>
            ) : (
              "Create Free Account"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center flex flex-col gap-2">
          <p className="text-gray-500 text-[15px] font-medium">
            Already have an account?{" "}
            <button
              onClick={() => setLocation("/login")}
              className="text-blue-600 hover:text-blue-800 font-bold ml-1 active:scale-95 transition-transform"
            >
              Sign In
            </button>
          </p>
        </div>

        {/* Benefits text below */}
        <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm font-medium text-gray-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Free forever</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>No credit card</span>
          </div>
        </div>

        {/* Safe Area Spacer for Mobile */}
        <div className="h-8 md:h-0" />
      </div>
    </div>
  );
}
