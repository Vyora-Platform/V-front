import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/config';
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type Step = 'email' | 'otp' | 'reset' | 'success';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOTP = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      toast({
        title: 'OTP Sent!',
        description: 'Check your email for the verification code',
      });
      setStep('otp');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter the complete 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      toast({
        title: 'OTP Verified!',
        description: 'You can now set your new password',
      });
      setStep('reset');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setStep('success');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    onOpenChange(false);
  };

  const handleResendOTP = async () => {
    setOtp('');
    await handleSendOTP();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              {step === 'email' && (
                <>
                  <KeyRound className="w-5 h-5" />
                  Forgot Password
                </>
              )}
              {step === 'otp' && (
                <>
                  <Mail className="w-5 h-5" />
                  Verify OTP
                </>
              )}
              {step === 'reset' && (
                <>
                  <Lock className="w-5 h-5" />
                  Reset Password
                </>
              )}
              {step === 'success' && (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Success!
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-sm mt-1">
              {step === 'email' && 'Enter your email to receive a verification code'}
              {step === 'otp' && `We've sent a 6-digit code to ${email}`}
              {step === 'reset' && 'Create a new secure password'}
              {step === 'success' && 'Your password has been reset successfully'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          {/* Email Step */}
          {step === 'email' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  />
                </div>
              </div>
              <Button
                onClick={handleSendOTP}
                disabled={loading || !email}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </div>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 bg-blue-50 rounded-full">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="w-12 h-14 text-xl border-gray-200 rounded-xl" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-xl border-gray-200 rounded-xl" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-xl border-gray-200 rounded-xl" />
                    <InputOTPSlot index={3} className="w-12 h-14 text-xl border-gray-200 rounded-xl" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-xl border-gray-200 rounded-xl" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-xl border-gray-200 rounded-xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Verify OTP'
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => setStep('email')}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          {/* Reset Password Step */}
          {step === 'reset' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-700 font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-700 font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-500">Passwords do not match</p>
              )}

              <Button
                onClick={handleResetPassword}
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-green-50 rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Password Reset Complete!</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    You can now sign in with your new password
                  </p>
                </div>
              </div>

              <Button
                onClick={handleClose}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold"
              >
                Back to Login
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

