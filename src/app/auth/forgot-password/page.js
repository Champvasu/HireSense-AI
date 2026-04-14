'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Mail, 
  Loader2, 
  CheckCircle, 
  Shield,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Implement actual password reset API
      // For now, simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if user exists (in real implementation)
      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link 
          href="/auth/signin" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        <div className="glass-card rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-6 glow-accent">
              <Shield className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Reset Password
            </h1>
            <p className="text-gray-400">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-danger/20 border border-danger/30 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-danger text-sm">{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-400 mb-6">
                We&apos;ve sent a password reset link to <strong className="text-white">{email}</strong>.<br />
                Please check your inbox and follow the instructions.
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/signin"
                  className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all duration-300 inline-flex items-center justify-center gap-3 glow-accent"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Sign In
                </Link>
                <p className="text-sm text-gray-500 pt-4">
                  Didn&apos;t receive the email?{' '}
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="text-accent hover:text-accent-hover font-medium transition-colors"
                  >
                    {loading ? 'Sending...' : 'Resend'}
                  </button>
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full py-3 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 glow-accent"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  Remember your password?{' '}
                  <Link
                    href="/auth/signin"
                    className="text-accent hover:text-accent-hover font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
