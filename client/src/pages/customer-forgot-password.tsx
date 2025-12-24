import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Mail, Key, Lock, CheckCircle2, Loader2 } from "lucide-react";

type Step = 'email' | 'otp' | 'password' | 'success';

export default function CustomerForgotPassword() {
  const [, params] = useRoute("/:subdomain/forgot-password");
  const subdomain = params?.subdomain || "";
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [vendorId, setVendorId] = useState<string>("");
  
  // Load vendorId from localStorage on mount
  useEffect(() => {
    const storedVendorId = localStorage.getItem('vendorId');
    if (storedVendorId) {
      setVendorId(storedVendorId);
    }
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", `/api/mini-website/${subdomain}/customer/forgot-password`, {
        email: email.trim().toLowerCase(),
        vendorId: vendorId || localStorage.getItem('vendorId') || undefined,
      });

      const response = await res.json();
      
      if (response.success) {
        // Store vendorId in localStorage for future use
        if (response.vendorId) {
          localStorage.setItem('vendorId', response.vendorId);
          setVendorId(response.vendorId);
        }
        if (response.email) {
          localStorage.setItem('customerEmail', response.email);
        }
        
        toast({
          title: "OTP Sent!",
          description: "Check your email for the verification code",
        });
        setStep('otp');
      } else {
        throw new Error(response.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length < 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code sent to your email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", `/api/mini-website/${subdomain}/customer/verify-otp`, {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        vendorId: vendorId || localStorage.getItem('vendorId') || undefined,
      });

      const response = await res.json();
      
      if (response.success) {
        // Update vendorId if returned
        if (response.vendorId) {
          localStorage.setItem('vendorId', response.vendorId);
          setVendorId(response.vendorId);
        }
        
        toast({
          title: "OTP Verified!",
          description: "You can now set a new password",
        });
        setStep('password');
      } else {
        throw new Error(response.error || 'Invalid OTP');
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", `/api/mini-website/${subdomain}/customer/reset-password`, {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
        vendorId: vendorId || localStorage.getItem('vendorId') || undefined,
      });

      const response = await res.json();
      
      if (response.success) {
        toast({
          title: "Password Reset!",
          description: "Your password has been updated successfully",
        });
        setStep('success');
      } else {
        throw new Error(response.error || 'Failed to reset password');
      }
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'otp') setStep('email');
    else if (step === 'password') setStep('otp');
    else window.location.href = `/${subdomain}/login`;
  };

  // Mobile Full-Screen Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-white border-b px-4 h-14 flex items-center">
          <button onClick={goBack} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-lg ml-2">
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'password' && 'New Password'}
            {step === 'success' && 'Success'}
          </h1>
        </header>

        {/* Mobile Content */}
        <div className="flex-1 flex flex-col p-6">
          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleRequestOTP} className="flex-1 flex flex-col">
              <div className="flex-1 flex flex-col justify-center space-y-6">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-10 w-10 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold">Enter Your Email</h2>
                  <p className="text-gray-500 text-sm mt-1">We'll send a verification code to reset your password</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 text-lg"
                    autoFocus
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-semibold mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="flex-1 flex flex-col">
              <div className="flex-1 flex flex-col justify-center space-y-6">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
                    <Key className="h-10 w-10 text-amber-600" />
                  </div>
                  <h2 className="text-xl font-bold">Enter Verification Code</h2>
                  <p className="text-gray-500 text-sm mt-1">Enter the 6-digit code sent to {email}</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="h-14 text-2xl text-center tracking-[0.5em] font-mono"
                    autoFocus
                    required
                  />
                </div>
                
                <button 
                  type="button"
                  onClick={() => handleRequestOTP({ preventDefault: () => {} } as any)}
                  className="text-blue-600 text-sm text-center"
                  disabled={isLoading}
                >
                  Didn't receive code? Resend
                </button>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-semibold mt-6"
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="flex-1 flex flex-col">
              <div className="flex-1 flex flex-col justify-center space-y-6">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Lock className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold">Create New Password</h2>
                  <p className="text-gray-500 text-sm mt-1">Choose a strong password for your account</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-14 text-lg"
                      minLength={6}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-14 text-lg"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  Password must be at least 6 characters
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-semibold mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
              <p className="text-gray-500 mb-8">Your password has been updated successfully. You can now login with your new password.</p>
              
              <Button 
                className="w-full h-14 text-lg font-semibold"
                onClick={() => window.location.href = `/${subdomain}/login`}
              >
                Go to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Back to login link */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 'email' ? 'Back to Login' : 'Go Back'}
        </Button>

        <Card className="shadow-xl">
          {/* Step 1: Email */}
          {step === 'email' && (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                <CardDescription>
                  Enter your email to receive a verification code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRequestOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-2">
                  <Key className="h-8 w-8 text-amber-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Verify OTP</CardTitle>
                <CardDescription>
                  Enter the 6-digit code sent to {email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-xl tracking-widest font-mono"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || otp.length < 6}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </Button>
                  
                  <button 
                    type="button"
                    onClick={() => handleRequestOTP({ preventDefault: () => {} } as any)}
                    className="text-blue-600 text-sm w-full text-center hover:underline"
                    disabled={isLoading}
                  >
                    Didn't receive code? Resend
                  </button>
                </form>
              </CardContent>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Lock className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold">New Password</CardTitle>
                <CardDescription>
                  Create a strong password for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Password Reset!</CardTitle>
                <CardDescription>
                  Your password has been updated successfully
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = `/${subdomain}/login`}
                >
                  Go to Login
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

