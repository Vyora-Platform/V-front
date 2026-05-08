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

export default function VendorLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-white relative">
      {/* Back Button (App Style) */}
      <button
        onClick={() => setLocation("/")}
        className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="w-full max-w-[400px] px-6 py-8 flex flex-col">

        {/* App Header */}
        <div className="text-left mb-10 mt-4">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Welcome back
          </h1>
          <p className="text-gray-500 text-[16px] mt-2 font-medium">
            Enter your details to proceed
          </p>
        </div>

        {/* Native Style Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50 py-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
                required
                disabled={loading}
                className="w-full h-14 pl-12 bg-gray-50 border-gray-200 rounded-2xl text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-sm"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
                required
                disabled={loading}
                className="w-full h-14 pl-12 bg-gray-50 border-gray-200 rounded-2xl text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setLocation("/forgot-password")}
              className="text-[14px] font-bold text-blue-600 hover:text-blue-700 active:scale-95 transition-transform"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
            data-testid="button-login"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-[15px] font-medium">
            Don't have an account?{" "}
            <button
              onClick={() => setLocation("/signup")}
              className="text-blue-600 hover:text-blue-800 font-bold ml-1 active:scale-95 transition-transform"
            >
              Sign Up
            </button>
          </p>
        </div>

        {/* Safe Area Spacer for Mobile */}
        <div className="h-8" />
      </div>
    </div>
  );
}
