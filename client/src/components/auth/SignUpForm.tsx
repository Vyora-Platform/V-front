import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('vendor');
  const [loading, setLoading] = useState(false);
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
    <Card className="w-full max-w-md mx-auto" data-testid="card-signup">
      <CardHeader>
        <CardTitle data-testid="text-signup-title">Create Account</CardTitle>
        <CardDescription data-testid="text-signup-description">
          Sign up to get started with Vyora
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" data-testid="label-username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              data-testid="input-username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" data-testid="label-email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" data-testid="label-password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              data-testid="input-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" data-testid="label-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-testid="select-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendor" data-testid="option-vendor">Vendor</SelectItem>
                <SelectItem value="admin" data-testid="option-admin">Admin</SelectItem>
                <SelectItem value="employee" data-testid="option-employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            data-testid="button-signup"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
          <p className="text-sm text-center text-muted-foreground" data-testid="text-login-link">
            Already have an account?{' '}
            <Link href="/auth/login" data-testid="link-login">
              <span className="text-primary hover:underline cursor-pointer">Login</span>
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
