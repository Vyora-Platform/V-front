import { useState } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, ArrowLeft } from "lucide-react";

export default function CustomerLogin() {
  const [, params] = useRoute("/site/:subdomain/login");
  const subdomain = params?.subdomain || "";
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing information",
        description: "Please enter your email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", `/api/mini-website/${subdomain}/customer/login`, {
        email: formData.email,
        password: formData.password,
      });

      console.log('📥 [Login] Response received:', res);
      
      // Parse JSON from response
      const response = await res.json();
      
      console.log('📥 [Login] Parsed JSON:', response);
      console.log('📥 [Login] Token:', response.token);
      console.log('📥 [Login] Customer:', response.customer);

      // Validate response
      if (!response.token || !response.customer) {
        console.error('❌ [Login] Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      // Store token, customer data, and customerId separately
      localStorage.setItem("customerToken", response.token);
      localStorage.setItem("customerData", JSON.stringify(response.customer));
      localStorage.setItem("customerId", response.customer.id);

      console.log('✅ [Login] Stored in localStorage');
      console.log('✅ [Login] Token stored:', localStorage.getItem("customerToken")?.substring(0, 20) + '...');
      console.log('✅ [Login] Customer stored:', localStorage.getItem("customerData"));
      console.log('✅ [Login] Customer ID stored:', localStorage.getItem("customerId"));

      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });

      // Small delay to ensure localStorage is written before redirect
      setTimeout(() => {
        window.location.href = `/site/${subdomain}`;
      }, 100);
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Back to website link */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => window.location.href = `/site/${subdomain}`}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to website
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Customer Login</CardTitle>
            <CardDescription>
              Sign in to your account to place orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account?</span>{" "}
              <a
                href={`/site/${subdomain}/signup`}
                className="text-primary hover:underline font-semibold"
              >
                <UserPlus className="inline h-4 w-4 mr-1" />
                Create Account
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

