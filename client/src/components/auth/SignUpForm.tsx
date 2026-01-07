import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Eye, EyeOff, Mail, Lock, User, Briefcase } from 'lucide-react';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('vendor');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password, username, role);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Account created successfully! Please check your email to verify your account.',
      });
    }

    setLoading(false);
  };

  return (
    <div className="w-full" data-testid="card-signup">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }} data-testid="text-signup-title">
          Create Account
        </h2>
        <p className="text-gray-600" data-testid="text-signup-description">
          Sign up to get started with Vyora
        </p>
      </div>
      
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
          <Label htmlFor="username" className="text-gray-700 font-medium" data-testid="label-username">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="username"
              type="text"
              placeholder="John Doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="pl-11 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-colors"
              data-testid="input-username"
            />
          </div>
        </div>
        
          <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 font-medium" data-testid="label-email">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-11 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-colors"
              data-testid="input-email"
            />
          </div>
        </div>
        
          <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 font-medium" data-testid="label-password">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="pl-11 pr-11 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-colors"
              data-testid="input-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500">Minimum 6 characters</p>
        </div>
        
          <div className="space-y-2">
          <Label htmlFor="role" className="text-gray-700 font-medium" data-testid="label-role">
            Account Type
          </Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-12 pl-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500" data-testid="select-role">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendor" data-testid="option-vendor">
                  <span className="font-medium">Business Owner</span>
                  <span className="text-gray-500 text-xs ml-2">— Manage your business</span>
                </SelectItem>
                <SelectItem value="admin" data-testid="option-admin">
                  <span className="font-medium">Admin</span>
                  <span className="text-gray-500 text-xs ml-2">— Full platform access</span>
                </SelectItem>
                <SelectItem value="employee" data-testid="option-employee">
                  <span className="font-medium">Employee</span>
                  <span className="text-gray-500 text-xs ml-2">— Staff member</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
          <Button
            type="submit"
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all mt-2"
            disabled={loading}
            data-testid="button-signup"
          >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            'Create Account'
          )}
          </Button>
        
        <p className="text-sm text-center text-gray-600 pt-2" data-testid="text-login-link">
            Already have an account?{' '}
          <Link href="/login" data-testid="link-login">
            <span className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer">
              Sign In
            </span>
            </Link>
          </p>
        </form>
    </div>
  );
}
