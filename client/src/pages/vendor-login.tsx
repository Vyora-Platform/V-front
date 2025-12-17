import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Building2, Mail, Lock, AlertCircle } from "lucide-react";
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
      // Sign in with JWT (no Supabase)
      const response = await fetch(getApiUrl("/api/auth/login"), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password }),
  credentials: "include",
});


      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }

      // Store JWT token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userRole", data.user.role);
      
      if (data.user.vendorId) {
        localStorage.setItem("vendorId", data.user.vendorId);
      }

      console.log("✅ [Login] JWT login successful:", data.user);

      // Check if user has vendor role
      if (data.user.role === "vendor") {
        if (data.user.vendorId) {
          toast({
            title: "Welcome back!",
            description: `Logged in successfully`,
          });
          
          setLocation("/vendor/dashboard");
        } else {
          // Vendor user but no profile yet, go to onboarding
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
        // Employee should access admin dashboard with module permissions
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Welcome to Vyora</CardTitle>
            <CardDescription className="text-base">
              Join our universal business marketplace platform
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              data-testid="button-login"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => setLocation("/vendor/signup")}
                className="text-primary hover:underline font-medium"
              >
                Sign up here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
