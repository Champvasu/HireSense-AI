'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error') || 'Default';

  const errorMessages = {
    AccessDenied: 'Access was denied. You may need to grant permission to access your Google account.',
    Callback: 'There was a problem with the authentication callback. Please try again.',
    OAuthSignin: 'Error starting the sign in process. Please try again.',
    OAuthCallback: 'Error handling the sign in callback. Please try again.',
    OAuthCreateAccount: 'Could not create an account. Please try again.',
    EmailCreateAccount: 'Could not create an account with this email. Please try again.',
    Callback: 'Error in callback handler. Please try again.',
    OAuthAccountNotLinked: 'This account is already associated with another sign in method.',
    EmailSignin: 'Error sending the sign in email. Please try again.',
    CredentialsSignin: 'Invalid credentials. Please check your email and try again.',
    SessionRequired: 'You must be signed in to access this page.',
    Default: 'An authentication error occurred. Please try again.',
  };

  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-danger/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-danger" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
          <p className="text-gray-400 mb-8">{message}</p>

          {error === 'AccessDenied' && (
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl mb-6 text-left">
              <p className="text-sm text-warning">
                <strong>Common causes:</strong>
              </p>
              <ul className="text-sm text-gray-400 mt-2 space-y-1 list-disc list-inside">
                <li>Google OAuth app is in test mode</li>
                <li>Your email is not added as a test user</li>
                <li>Redirect URI mismatch in Google Cloud Console</li>
                <li>Consent screen not properly configured</li>
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all duration-300 flex items-center justify-center gap-3"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </Link>

            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl glass hover:bg-white/10 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-3"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Home
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500">
              Error: {error || 'Unknown'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
