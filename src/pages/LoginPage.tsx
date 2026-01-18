import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Circle - Top Right */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full"></div>

        {/* Geometric Shapes - Left Side */}
        <div className="absolute top-20 left-12 space-y-4">
          {/* Semi Circle */}
          <div className="w-24 h-12 bg-white/20 rounded-t-full"></div>
          {/* Dotted Grid */}
          <div className="grid grid-cols-5 gap-2">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
            ))}
          </div>
          {/* Vertical Pills */}
          <div className="flex gap-3">
            <div className="w-6 h-32 bg-white/20 rounded-full"></div>
            <div className="w-6 h-24 bg-white/15 rounded-full mt-4"></div>
          </div>
        </div>

        {/* Floating Elements - Top */}
        <div className="absolute top-16 right-1/4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
            <div className="w-6 h-6 bg-white/15 rounded-full"></div>
          </div>
        </div>

        {/* Bottom Left Decorations */}
        <div className="absolute bottom-20 left-16 flex items-end gap-3">
          <div className="w-3 h-3 bg-cyan-300/40 rounded-full"></div>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-white/25 rounded-full"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Right - Large Decorative Circle */}
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3">
          <div className="relative w-80 h-80">
            {/* Outer ring */}
            <div className="absolute inset-0 border-8 border-white/20 rounded-full"></div>
            {/* Inner gradient circle */}
            <div className="absolute inset-12 bg-gradient-to-br from-cyan-300/30 to-blue-400/30 rounded-full"></div>
            {/* Small circles on ring */}
            <div className="absolute top-8 right-1/2 w-6 h-6 bg-cyan-300/50 rounded-full"></div>
            <div className="absolute bottom-16 left-8 w-5 h-5 bg-white/30 rounded-full"></div>
          </div>
        </div>

        {/* Cross/X shape */}
        <div className="absolute bottom-32 left-1/3">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 flex items-center justify-center text-white/20 text-3xl font-light">×</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side - Text Content */}
        <div className="text-white space-y-6 hidden lg:block animate-in fade-in slide-in-from-left duration-700">
          <div className="inline-block">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">DHIC eGov</h2>
                <p className="text-white/70 text-sm">Staff Portal</p>
              </div>
            </div>
          </div>

          <h1 className="text-6xl font-bold leading-tight">
            Adventure<br />
            start here
          </h1>
          <p className="text-xl text-white/80 max-w-md">
            Manage your duties, track reports, and collaborate with your team efficiently
          </p>
        </div>

        {/* Right Side - Login Card */}
        <div className="flex justify-center lg:justify-end animate-in fade-in slide-in-from-right duration-700">
          <Card className="w-full max-w-md bg-white shadow-2xl border-0 relative">
            {/* Back Button - Mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="absolute -top-12 left-0 text-white hover:bg-white/10 lg:hidden"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <CardContent className="p-8 lg:p-10">
              {/* Logo - Mobile */}
              <div className="lg:hidden text-center mb-8">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">DHIC eGov</h2>
                <p className="text-muted-foreground">Staff Portal</p>
              </div>

              {/* Welcome Text */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Hello! Welcome back</h3>
                <p className="text-muted-foreground">Sign in to continue</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-muted-foreground">Remember me</span>
                  </label>
                  <button type="button" className="text-primary hover:underline font-medium">
                    Reset Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-muted-foreground">or</span>
                </div>
              </div>

              {/* Student Portal Link */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Are you a student?{' '}
                  <button
                    onClick={() => navigate('/student/login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Student Portal
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Back Button - Desktop */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-white hover:bg-white/10 hidden lg:flex"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>
    </div>
  );
}
