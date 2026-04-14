import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@/lib/db';
import User from '@/models/User';

// Performance timing helper
const perfTimer = (label) => {
  const start = performance.now();
  return {
    end: (extraInfo = {}) => {
      const duration = performance.now() - start;
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`, extraInfo);
      return duration;
    }
  };
};

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    // Email/Password credentials provider
    {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const authTimer = perfTimer('credentials-authorize');
        const dbTimer = perfTimer('credentials-db-connect');
        
        try {
          await connectDB();
          dbTimer.end({ provider: 'credentials' });
          
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password are required');
          }
          
          const lookupTimer = perfTimer('credentials-db-lookup');
          const user = await User.findOne({ email: credentials.email.toLowerCase() }).lean();
          lookupTimer.end({ provider: 'credentials', found: !!user });
          
          if (!user) {
            throw new Error('No account found with this email');
          }
          
          // Check if user has a password (OAuth users might not)
          if (!user.password) {
            throw new Error('Please sign in with Google or reset your password');
          }
          
          // Verify password
          const pwdTimer = perfTimer('credentials-password-verify');
          // Note: lean() removes methods, so we need to compare manually
          const bcrypt = await import('bcryptjs');
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          pwdTimer.end({ provider: 'credentials' });
          
          if (!isValidPassword) {
            throw new Error('Invalid password');
          }
          
          // Update last login - throttle like OAuth flow
          const shouldUpdateLogin = !user.lastLogin || 
            (new Date() - new Date(user.lastLogin)) > 24 * 60 * 60 * 1000;
          
          if (shouldUpdateLogin) {
            const updateTimer = perfTimer('credentials-db-update');
            await User.updateOne({ email: user.email }, { lastLogin: new Date() });
            updateTimer.end({ provider: 'credentials' });
          } else {
            console.log('[PERF] credentials-db-update: SKIPPED (throttled)', { provider: 'credentials' });
          }
          
          authTimer.end({ provider: 'credentials', email: user.email });
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            provider: 'credentials',
          };
        } catch (error) {
          authTimer.end({ provider: 'credentials', error: true });
          console.error('Credentials auth error:', error);
          throw new Error(error.message || 'Authentication failed');
        }
      },
    },
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const totalTimer = perfTimer('signIn-total');
      const dbTimer = perfTimer('signIn-db-connect');
      
      try {
        console.log('[NextAuth] SignIn callback started', { 
          email: user?.email, 
          provider: account?.provider,
          hasProfile: !!profile 
        });
        
        await connectDB();
        dbTimer.end({ provider: account?.provider });
        
        const lookupTimer = perfTimer('signIn-db-lookup');
        const existingUser = await User.findOne({ email: user.email }).lean(); // PERFORMANCE: Use lean() for faster reads
        lookupTimer.end({ 
          provider: account?.provider, 
          exists: !!existingUser,
          isNewUser: !existingUser 
        });
        
        if (!existingUser) {
          // New user from Google OAuth - create with pending role selection
          const createTimer = perfTimer('signIn-db-create');
          const newUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            role: 'pending', // Requires role selection
            provider: account?.provider || 'credentials',
            lastLogin: new Date(),
          });
          createTimer.end({ provider: account?.provider });
          
          // Set role and flag on user object for JWT callback
          user.id = newUser._id.toString();
          user.role = 'pending';
          user.requiresRoleSelection = true;
        } else {
          // Update login timestamp and provider info only if needed (throttle to once per day)
          const shouldUpdateLogin = !existingUser.lastLogin || 
            (new Date() - new Date(existingUser.lastLogin)) > 24 * 60 * 60 * 1000;
          
          if (shouldUpdateLogin || existingUser.provider !== account?.provider) {
            const updateTimer = perfTimer('signIn-db-update');
            await User.updateOne(
              { email: user.email },
              { 
                lastLogin: new Date(),
                $set: { provider: account?.provider || existingUser.provider || 'credentials' }
              }
            );
            updateTimer.end({ provider: account?.provider, throttled: !shouldUpdateLogin });
          } else {
            console.log('[PERF] signIn-db-update: SKIPPED (throttled)', { provider: account?.provider });
          }
          
          // Set properties on user object for JWT callback
          user.id = existingUser._id.toString();
          user.role = existingUser.role;
          user.requiresRoleSelection = existingUser.role === 'pending';
        }
        
        totalTimer.end({ provider: account?.provider, email: user?.email });
        return true;
      } catch (error) {
        console.error('[NextAuth] SignIn error:', error);
        console.error('[NextAuth] Error stack:', error.stack);
        return false;
      }
    },
    async session({ session, token }) {
      const sessionTimer = perfTimer('session-total');
      
      console.log('[NextAuth] Session callback START', {
        hasToken: !!token,
        tokenId: token?.id,
        tokenRole: token?.role,
        tokenRequiresRoleSelection: token?.requiresRoleSelection,
        sessionUserEmail: session?.user?.email
      });
      
      try {
        // OPTIMIZATION: Use JWT token data instead of DB lookup
        // Token contains all necessary data from signIn/jwt callbacks
        if (token?.id && token?.role) {
          session.user.id = token.id;
          session.user.role = token.role;
          session.user.requiresRoleSelection = token.requiresRoleSelection || false;
          session.user.isNewUser = !token.lastLogin;
          
          console.log('[NextAuth] Session: Using JWT token data', {
            id: session.user.id,
            role: session.user.role,
            requiresRoleSelection: session.user.requiresRoleSelection
          });
          
          sessionTimer.end({ 
            source: 'jwt_token', 
            role: token.role,
            requiresRoleSelection: token.requiresRoleSelection 
          });
          return session;
        }
        
        // Fallback: Only hit DB if token data is incomplete (rare edge case)
        console.log('[NextAuth] Session: FALLBACK to DB lookup - token incomplete', {
          tokenKeys: Object.keys(token || {})
        });
        const fallbackTimer = perfTimer('session-db-fallback');
        await connectDB();
        const dbUser = await User.findOne({ email: session.user.email }).lean();
        
        if (dbUser) {
          session.user.id = dbUser._id.toString();
          session.user.role = dbUser.role;
          session.user.isNewUser = !dbUser.lastLogin;
          session.user.requiresRoleSelection = dbUser.role === 'pending';
          console.log('[NextAuth] Session: Fallback DB lookup successful', {
            role: dbUser.role,
            id: session.user.id
          });
        } else {
          console.error('[NextAuth] Session: User not found in DB!');
        }
        
        fallbackTimer.end({ email: session.user.email });
        sessionTimer.end({ source: 'db_fallback' });
        return session;
      } catch (error) {
        console.error('[NextAuth] Session error:', error);
        sessionTimer.end({ error: true });
        return session;
      }
    },
    async jwt({ token, user, trigger, session, account }) {
      const jwtTimer = perfTimer('jwt-callback');
      
      console.log('[NextAuth] JWT callback START', { 
        hasUser: !!user, 
        hasAccount: !!account,
        userId: user?.id,
        userRole: user?.role,
        userRequiresRoleSelection: user?.requiresRoleSelection,
        trigger,
        existingTokenKeys: Object.keys(token)
      });
      
      if (user) {
        console.log('[NextAuth] JWT: Updating token with user data', {
          id: user.id,
          role: user.role,
          requiresRoleSelection: user.requiresRoleSelection,
          provider: account?.provider
        });
        
        token.id = user.id;
        token.role = user.role;
        token.requiresRoleSelection = user.requiresRoleSelection || false;
        token.lastLogin = new Date().toISOString();
        token.provider = account?.provider || 'unknown';
        
        console.log('[NextAuth] JWT token updated:', { 
          id: token.id, 
          role: token.role,
          requiresRoleSelection: token.requiresRoleSelection,
          provider: token.provider
        });
      }
      
      if (trigger === 'update' && session?.role) {
        console.log('[NextAuth] JWT: Updating via session trigger', { newRole: session.role });
        token.role = session.role;
        token.requiresRoleSelection = false;
      }
      
      console.log('[NextAuth] JWT callback END', { 
        finalRole: token.role,
        finalRequiresRoleSelection: token.requiresRoleSelection,
        hasId: !!token.id
      });
      
      jwtTimer.end({ hasUser: !!user, trigger });
      return token;
    },
    async redirect({ url, baseUrl, token }) {
      console.log('[NextAuth] Redirect callback', { 
        url, 
        baseUrl, 
        requiresRoleSelection: token?.requiresRoleSelection,
        tokenRole: token?.role,
        hasToken: !!token,
        tokenKeys: token ? Object.keys(token) : null
      });
      
      // Handle role selection requirement
      if (token?.requiresRoleSelection && !url.includes('/select-role')) {
        const redirectUrl = `${baseUrl}/select-role`;
        console.log('[NextAuth] Redirecting to role selection:', redirectUrl);
        return redirectUrl;
      }
      
      // If user has pending role but is trying to access select-role, allow it
      if (token?.requiresRoleSelection && url.includes('/select-role')) {
        console.log('[NextAuth] Allowing access to select-role page');
        return url.startsWith('/') ? `${baseUrl}${url}` : url;
      }
      
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
