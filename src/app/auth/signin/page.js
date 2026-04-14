'use client';

import { useState } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ArrowLeft, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Building2, 
  GraduationCap, 
  Briefcase,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  Zap,
  Check,
  X,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function SignIn() {
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Auth flow states: 'email' | 'login' | 'signup'
  const [authState, setAuthState] = useState('email');
  
  // Email step
  const [email, setEmail] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  
  // Login form
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Signup form
  const [signupData, setSignupData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    // Student fields
    college: '',
    degree: '',
    graduationYear: '',
    // Company fields
    companyName: '',
    recruiterTitle: '',
    companyWebsite: '',
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[a-z]/)) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
    return strength;
  };

  const getPasswordStrengthLabel = (strength) => {
    if (strength === 0) return { label: 'Enter password', color: 'bg-gray-600' };
    if (strength <= 2) return { label: 'Weak', color: 'bg-danger' };
    if (strength <= 3) return { label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-success' };
  };

  const passwordStrength = calculatePasswordStrength(signupData.password);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);
  const passwordsMatch = signupData.password && signupData.confirmPassword && signupData.password === signupData.confirmPassword;
  const hasPasswordError = touched.confirmPassword && signupData.confirmPassword && !passwordsMatch;

  useEffect(() => {
    (async () => {
      const res = await getProviders();
      setProviders(res);
    })();
  }, []);

  // Check if email exists
  const checkEmail = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setCheckingEmail(true);
    setError(null);
    
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      
      const data = await res.json();
      
      if (data.exists) {
        setAuthState('login');
      } else {
        setAuthState('signup');
        setSignupData(prev => ({ ...prev, name: email.split('@')[0] }));
      }
    } catch (err) {
      setError('Failed to check email. Please try again.');
    } finally {
      setCheckingEmail(false);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const result = await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password,
      callbackUrl: '/',
      redirect: false,
    });
    
    if (result?.error) {
      // Provide better error messages
      let errorMessage = result.error;
      if (result.error === 'CredentialsSignin') {
        errorMessage = 'Invalid password. Please try again or use Google sign-in.';
      } else if (result.error.includes('No account found')) {
        errorMessage = 'No account found with this email. Create a new account?';
      } else if (result.error.includes('Google')) {
        errorMessage = 'This email is linked to Google. Please sign in with Google below.';
      }
      setError(errorMessage);
      setLoading(false);
    } else if (result?.ok) {
      window.location.href = '/';
    }
  };

  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!signupData.name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (signupData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupData.name,
          email: email.toLowerCase().trim(),
          password: signupData.password,
          role: signupData.role,
          ...(signupData.role === 'student' && {
            college: signupData.college,
            degree: signupData.degree,
            graduationYear: signupData.graduationYear ? parseInt(signupData.graduationYear) : undefined,
          }),
          ...(signupData.role === 'company' && {
            companyName: signupData.companyName,
            recruiterTitle: signupData.recruiterTitle,
            companyWebsite: signupData.companyWebsite,
          }),
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Auto-login after signup
        const result = await signIn('credentials', {
          email: email.toLowerCase().trim(),
          password: signupData.password,
          callbackUrl: '/',
          redirect: false,
        });
        
        if (result?.ok) {
          window.location.href = '/';
        }
      } else {
        setError(data.error || 'Failed to create account');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  const goBack = () => {
    setAuthState('email');
    setError(null);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#1A1A2E] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl p-8 border border-[#E8EAF0] shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#3DD68C]/20 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-7 h-7 text-[#3DD68C]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">
              {authState === 'email' && 'Welcome to HireSense AI'}
              {authState === 'login' && 'Welcome Back'}
              {authState === 'signup' && 'Create Your Account'}
            </h1>
            <p className="text-[#6B7280]">
              {authState === 'email' && 'Enter your email to get started'}
              {authState === 'login' && `Sign in as ${email}`}
              {authState === 'signup' && (
                <>
                  Complete your profile to get started with HireSense AI.<br />
                  <span className="text-sm">Join thousands of students and recruiters.</span>
                </>
              )}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Email Step */}
            {authState === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={checkEmail} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full py-3 pl-12 pr-4 rounded-xl bg-[#F0F2F5] border border-transparent text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-[#9CA3AF] mt-2">
                      We&apos;ll check if you have an existing account
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={checkingEmail}
                    className="w-full py-3 px-4 rounded-xl bg-[#3DD68C] hover:bg-[#2BC47A] text-white font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {checkingEmail ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {/* New User Option */}
                  <div className="text-center pt-2">
                    <p className="text-sm text-[#6B7280]">
                      New to HireSense AI?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          if (email && email.includes('@')) {
                            setAuthState('signup');
                            setSignupData(prev => ({ ...prev, name: email.split('@')[0] }));
                          } else {
                            setError('Please enter a valid email first');
                          }
                        }}
                        className="text-[#3DD68C] hover:text-[#2BC47A] font-medium transition-colors"
                      >
                        Create account
                      </button>
                    </p>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Login Step */}
            {authState === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email Display */}
                  <div className="p-3 rounded-xl bg-[#F0F2F5] border border-[#E8EAF0] mb-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-[#3DD68C]" />
                      <div className="flex-1">
                        <p className="text-xs text-[#9CA3AF]">Email</p>
                        <p className="text-sm text-[#1A1A2E]">{email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={goBack}
                        className="text-xs text-[#3DD68C] hover:text-[#2BC47A]"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-[#1A1A2E]">
                        Password
                      </label>
                      <Link 
                        href="/auth/forgot-password" 
                        className="text-xs text-[#3DD68C] hover:text-[#2BC47A] transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full py-3 pl-12 pr-12 rounded-xl bg-[#F0F2F5] border border-transparent text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || !password}
                    className="w-full py-3 px-4 rounded-xl bg-[#3DD68C] hover:bg-[#2BC47A] text-white font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {/* Google Sign In Option */}
                  {providers?.google && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E8EAF0]" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-[#9CA3AF]">or</span>
                      </div>
                    </div>
                  )}
                  
                  {providers?.google && (
                    <button
                      type="button"
                      onClick={() => signIn('google', { callbackUrl: '/' })}
                      className="w-full py-3 px-4 rounded-xl bg-[#F0F2F5] hover:bg-[#E8EAF0] text-[#1A1A2E] font-semibold transition-colors flex items-center justify-center gap-3 border border-[#E8EAF0]"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in with Google
                    </button>
                  )}

                  {/* New User Option */}
                  <div className="text-center pt-2">
                    <p className="text-sm text-[#6B7280]">
                      New to HireSense AI?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthState('signup')}
                        className="text-[#3DD68C] hover:text-[#2BC47A] font-medium transition-colors"
                      >
                        Create account
                      </button>
                    </p>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Signup Step */}
            {authState === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleSignup} className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Progress Indicator */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#3DD68C]/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#3DD68C]" />
                      </div>
                      <span className="text-sm text-[#9CA3AF]">Email</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#E8EAF0]" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#3DD68C] text-white flex items-center justify-center font-semibold text-sm">
                        2
                      </div>
                      <span className="text-sm text-[#1A1A2E] font-medium">Profile</span>
                    </div>
                  </div>

                  {/* Email Display (Read Only) */}
                  <div className="p-3 rounded-xl bg-[#F0F2F5] border border-[#E8EAF0]">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-[#3DD68C]" />
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Email</p>
                        <p className="text-sm text-[#1A1A2E]">{email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={signupData.name}
                        onChange={(e) => {
                          setSignupData({ ...signupData, name: e.target.value });
                          setTouched({ ...touched, name: true });
                        }}
                        onBlur={() => setTouched({ ...touched, name: true })}
                        required
                        className={`w-full py-3 pl-12 pr-4 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] focus:outline-none transition-colors ${
                          !signupData.name && touched.name ? 'border-red-500' : 'border-transparent'
                        }`}
                      />
                    </div>
                    {!signupData.name && touched.name && (
                      <p className="text-red-500 text-xs mt-1">Please enter your full name</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        placeholder="Create a secure password"
                        value={signupData.password}
                        onChange={(e) => {
                          setSignupData({ ...signupData, password: e.target.value });
                          setTouched({ ...touched, password: true });
                        }}
                        onBlur={() => setTouched({ ...touched, password: true })}
                        required
                        minLength={8}
                        className="w-full py-3 pl-12 pr-12 rounded-xl bg-[#F0F2F5] border border-transparent text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                      >
                        {showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {signupData.password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#E8EAF0] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                              className={`h-full ${strengthInfo.color} transition-colors duration-300`}
                            />
                          </div>
                          <span className={`text-xs ${
                            passwordStrength <= 2 ? 'text-red-500' : 
                            passwordStrength <= 3 ? 'text-amber-500' : 
                            passwordStrength <= 4 ? 'text-blue-500' : 'text-green-600'
                          }`}>
                            {strengthInfo.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { met: signupData.password.length >= 8, label: '8+ chars' },
                            { met: /[a-z]/.test(signupData.password), label: 'lowercase' },
                            { met: /[A-Z]/.test(signupData.password), label: 'uppercase' },
                            { met: /[0-9]/.test(signupData.password), label: 'number' },
                            { met: /[^a-zA-Z0-9]/.test(signupData.password), label: 'special' },
                          ].map((req, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                                req.met ? 'bg-green-100 text-green-600' : 'bg-[#F0F2F5] text-[#9CA3AF]'
                              }`}
                            >
                              {req.met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {req.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={signupData.confirmPassword}
                        onChange={(e) => {
                          setSignupData({ ...signupData, confirmPassword: e.target.value });
                          setTouched({ ...touched, confirmPassword: true });
                        }}
                        onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                        required
                        className={`w-full py-3 pl-12 pr-12 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] focus:outline-none transition-colors ${
                          hasPasswordError ? 'border-red-500' : passwordsMatch && signupData.confirmPassword ? 'border-green-500' : 'border-transparent'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {passwordsMatch && signupData.confirmPassword && (
                        <Check className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                      )}
                    </div>
                    {hasPasswordError && (
                      <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                    )}
                    {passwordsMatch && signupData.confirmPassword && (
                      <p className="text-green-600 text-xs mt-1">Passwords match</p>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A2E] mb-3">
                      I am a... <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSignupData({ ...signupData, role: 'student' })}
                        className={`py-4 px-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                          signupData.role === 'student'
                            ? 'border-[#3DD68C] bg-[#3DD68C]/10 text-[#3DD68C]'
                            : 'border-[#E8EAF0] hover:border-[#3DD68C]/30 text-[#6B7280] hover:bg-[#F5F6FA]'
                        }`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          signupData.role === 'student' ? 'bg-[#3DD68C]/20' : 'bg-[#F0F2F5]'
                        }`}>
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold">Student</span>
                        <span className="text-xs text-[#9CA3AF]">Looking for internships</span>
                      </motion.button>
                      
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSignupData({ ...signupData, role: 'company' })}
                        className={`py-4 px-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                          signupData.role === 'company'
                            ? 'border-[#3DD68C] bg-[#3DD68C]/10 text-[#3DD68C]'
                            : 'border-[#E8EAF0] hover:border-[#3DD68C]/30 text-[#6B7280] hover:bg-[#F5F6FA]'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          signupData.role === 'company' ? 'bg-[#3DD68C]/20' : 'bg-[#F0F2F5]'
                        }`}>
                          <Briefcase className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold">Recruiter</span>
                        <span className="text-xs text-[#9CA3AF]">Posting internships</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Student-specific fields */}
                  <AnimatePresence>
                    {signupData.role === 'student' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-2"
                      >
                        <div className="flex items-center gap-2 text-[#3DD68C] mb-3">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-sm font-medium text-[#1A1A2E]">Student Information <span className="text-[#9CA3AF] font-normal">(Optional)</span></span>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-[#6B7280] mb-1 block">College/University</label>
                            <input
                              type="text"
                              placeholder="e.g., Stanford University"
                              value={signupData.college}
                              onChange={(e) => setSignupData({ ...signupData, college: e.target.value })}
                              className="w-full py-2.5 px-3 rounded-lg bg-[#F0F2F5] border border-transparent text-[#1A1A2E] text-sm placeholder-[#9CA3AF] focus:border-[#3DD68C] focus:outline-none transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs text-[#6B7280] mb-1 block">Degree Program</label>
                            <input
                              type="text"
                              placeholder="e.g., B.S. Computer Science"
                              value={signupData.degree}
                              onChange={(e) => setSignupData({ ...signupData, degree: e.target.value })}
                              className="w-full py-2.5 px-3 rounded-lg bg-[#F0F2F5] border border-transparent text-[#1A1A2E] text-sm placeholder-[#9CA3AF] focus:border-[#3DD68C] focus:outline-none transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs text-[#6B7280] mb-1 block">Expected Graduation</label>
                            <input
                              type="number"
                              placeholder="2025"
                              min={2020}
                              max={2035}
                              value={signupData.graduationYear}
                              onChange={(e) => setSignupData({ ...signupData, graduationYear: e.target.value })}
                              className="w-full py-2.5 px-3 rounded-lg bg-[#F0F2F5] border border-transparent text-[#1A1A2E] text-sm placeholder-[#9CA3AF] focus:border-[#3DD68C] focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Company-specific fields */}
                  <AnimatePresence>
                    {signupData.role === 'company' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-2"
                      >
                        <div className="flex items-center gap-2 text-[#3DD68C] mb-3">
                          <Zap className="w-4 h-4" />
                          <span className="text-sm font-medium text-[#1A1A2E]">Company Information <span className="text-[#9CA3AF] font-normal">(Optional)</span></span>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-[#6B7280] mb-1 block">Company Name</label>
                            <input
                              type="text"
                              placeholder="e.g., Google"
                              value={signupData.companyName}
                              onChange={(e) => setSignupData({ ...signupData, companyName: e.target.value })}
                              className="w-full py-2.5 px-3 rounded-lg bg-[#F0F2F5] border border-transparent text-[#1A1A2E] text-sm placeholder-[#9CA3AF] focus:border-[#3DD68C] focus:outline-none transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs text-[#6B7280] mb-1 block">Your Title</label>
                            <input
                              type="text"
                              placeholder="e.g., Senior Recruiter"
                              value={signupData.recruiterTitle}
                              onChange={(e) => setSignupData({ ...signupData, recruiterTitle: e.target.value })}
                              className="w-full py-2.5 px-3 rounded-lg bg-[#F0F2F5] border border-transparent text-[#1A1A2E] text-sm placeholder-[#9CA3AF] focus:border-[#3DD68C] focus:outline-none transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs text-[#6B7280] mb-1 block">Company Website</label>
                            <input
                              type="url"
                              placeholder="https://company.com"
                              value={signupData.companyWebsite}
                              onChange={(e) => setSignupData({ ...signupData, companyWebsite: e.target.value })}
                              className="w-full py-2.5 px-3 rounded-lg bg-[#F0F2F5] border border-transparent text-[#1A1A2E] text-sm placeholder-[#9CA3AF] focus:border-[#3DD68C] focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Submit Button */}
                  <div className="pt-4 space-y-3">
                    <motion.button
                      type="submit"
                      disabled={loading || !signupData.name || signupData.password.length < 8 || !passwordsMatch}
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#3DD68C] hover:bg-[#2BC47A] text-white font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Create Account
                        </>
                      )}
                    </motion.button>

                    <button
                      type="button"
                      onClick={goBack}
                      className="w-full py-3 px-4 rounded-xl bg-[#F0F2F5] hover:bg-[#E8EAF0] text-[#6B7280] hover:text-[#1A1A2E] font-medium transition-colors text-sm"
                    >
                      Use a different email
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google OAuth - Only show on email step */}
          {authState === 'email' && providers?.google && (
            <div className="mt-6 pt-6 border-t border-[#E8EAF0]">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E8EAF0]" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-[#9CA3AF]">Or continue with</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  console.log('[SignIn] Google sign-in clicked from email step');
                  signIn('google', { callbackUrl: '/' });
                }}
                className="w-full py-3 px-4 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
