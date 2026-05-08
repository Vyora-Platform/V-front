import { useState } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LogIn, ArrowLeft } from "lucide-react";

export default function CustomerSignup() {
  const [, params] = useRoute("/site/:subdomain/signup");
  const subdomain = params?.subdomain || "";
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", `/api/mini-website/${subdomain}/customer/signup`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      console.log('📥 [Signup] Response received:', res);
      
      // Parse JSON from response
      const response = await res.json();
      
      console.log('📥 [Signup] Parsed JSON:', response);
      console.log('📥 [Signup] Token:', response.token);
      console.log('📥 [Signup] Customer:', response.customer);

      // Validate response
      if (!response.token || !response.customer) {
        console.error('❌ [Signup] Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      // Store token, customer data, and customerId separately
      localStorage.setItem("customerToken", response.token);
      localStorage.setItem("customerData", JSON.stringify(response.customer));
      localStorage.setItem("customerId", response.customer.id);

      console.log('✅ [Signup] Stored in localStorage');
      console.log('✅ [Signup] Token stored:', localStorage.getItem("customerToken")?.substring(0, 20) + '...');
      console.log('✅ [Signup] Customer stored:', localStorage.getItem("customerData"));
      console.log('✅ [Signup] Customer ID stored:', localStorage.getItem("customerId"));

      toast({
        title: "Account created!",
        description: "Welcome! You can now place orders.",
      });

      // Small delay to ensure localStorage is written before redirect
      setTimeout(() => {
        window.location.href = `/site/${subdomain}`;
      }, 100);
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account. Please try again.",
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
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Sign up to place orders and track your purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account?</span>{" "}
              <a
                href={`/site/${subdomain}/login`}
                className="text-primary hover:underline font-semibold"
              >
                <LogIn className="inline h-4 w-4 mr-1" />
                Sign In
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

