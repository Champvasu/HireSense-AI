# Google OAuth Setup Guide - HireSense AI

## Overview

This guide walks you through setting up Google OAuth authentication for the HireSense AI platform. Users can now sign in with their Google accounts instead of using email/password.

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth Configuration (already configured)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-min-32-characters-long
```

## Setting Up Google OAuth Credentials

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "HireSense AI" (or your preferred name)
4. Click "Create"

### Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API" or "Google People API"
3. Click "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (for testing) or "Internal" (if using Google Workspace)
3. Click "Create"
4. Fill in app information:
   - **App name**: HireSense AI
   - **User support email**: your-email@example.com
   - **Developer contact email**: your-email@example.com
5. Click "Save and Continue"
6. Add scopes:
   - `openid`
   - `email`
   - `profile`
7. Click "Save and Continue"
8. Add test users (for external apps):
   - Add your Google email and any test accounts
9. Click "Save and Continue"

### Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Configure:
   - **Name**: HireSense AI Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**
7. Add them to your `.env.local` file

## Authentication Flow

### User Journey

1. **Sign In Page** (`/auth/signin`)
   - User clicks "Continue with Google"
   - Redirected to Google OAuth consent screen

2. **Google OAuth**
   - User grants permission to HireSense AI
   - Google redirects back to `/api/auth/callback/google`

3. **Account Creation**
   - New users are created with `role: 'pending'`
   - Profile info (name, email, image) saved from Google

4. **Role Selection** (`/select-role`)
   - First-time OAuth users redirected here
   - User selects "Student" or "Company"
   - Role updated in database

5. **Dashboard Access**
   - Student → `/internships`
   - Company → `/post`

## Files Modified

| File | Changes |
|------|---------|
| `src/app/api/auth/[...nextauth]/route.js` | Added GoogleProvider, updated callbacks for OAuth flow |
| `src/models/User.js` | Added 'pending' role and provider field |
| `src/app/auth/signin/page.js` | Updated styling, Google button with proper branding |
| `src/app/select-role/page.js` | (Existing) Handles role selection for new OAuth users |

## Testing Steps

### 1. Configure Environment

```bash
# Add to .env.local
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=random-string-at-least-32-characters
```

### 2. Restart Development Server

```bash
npm run dev
```

### 3. Test Google Sign-In

1. Navigate to `http://localhost:3000/auth/signin`
2. Click "Continue with Google"
3. Select or enter Google account
4. Grant permissions
5. Verify redirect to `/select-role` (for new users)

### 4. Test Role Selection

1. On `/select-role`, select "Student" or "Company"
2. Verify redirect to appropriate dashboard
3. Check MongoDB - user should have selected role

### 5. Test Session Persistence

1. Refresh page - should stay logged in
2. Check navbar - user profile should show Google avatar
3. Navigate between pages - session should persist

### 6. Test Sign Out

1. Click Sign Out in navbar
2. Verify redirect to home page
3. Verify protected pages require login

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: Redirect URI in Google Cloud doesn't match your app

**Fix**: 
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client ID
3. Add exact redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Save changes (wait 5 minutes for propagation)

### Error: "Access blocked: HireSense AI has not completed the Google verification process"

**Cause**: OAuth app is in testing mode and user isn't a test user

**Fix**:
1. Go to Google Cloud Console → OAuth consent screen
2. Add the user's email to "Test users"
3. Or click "Publish App" to make it public (requires verification)

### Error: "Invalid client"

**Cause**: Client ID or Secret is incorrect

**Fix**:
1. Check `.env.local` values match Google Cloud Console
2. Ensure no extra spaces or quotes
3. Restart Next.js server after changes

### Users Not Redirected to Role Selection

**Cause**: Session doesn't have `requiresRoleSelection` flag

**Fix**:
1. Check browser console for errors
2. Verify database has `role: 'pending'` for new user
3. Check NextAuth session callback is setting flag correctly

## Production Deployment

### Update Environment Variables

```env
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
```

### Update Google Cloud Settings

1. Add production domain to "Authorized JavaScript origins"
2. Add production callback to "Authorized redirect URIs`
3. If going public: Submit for Google verification (takes 3-5 days)

### Database Migration

Existing users won't have OAuth provider info. Run this migration:

```javascript
// migrations/add-provider-to-users.js
import User from './models/User';
import connectDB from './lib/db';

async function migrate() {
  await connectDB();
  await User.updateMany(
    { provider: { $exists: false } },
    { $set: { provider: 'credentials' } }
  );
  console.log('Migration complete');
}

migrate();
```

## Security Considerations

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Use different credentials** for dev vs production
3. **Rotate secrets** periodically in Google Cloud Console
4. **Monitor sign-in logs** for suspicious activity
5. **Enable 2FA** on your Google Cloud account

## API Reference

### Session Object

After Google OAuth sign-in:

```json
{
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://lh3.googleusercontent.com/...",
    "role": "student",
    "requiresRoleSelection": false
  }
}
```

### Database Schema

```javascript
{
  name: "John Doe",
  email: "john@example.com",
  image: "https://lh3.googleusercontent.com/...",
  role: "student", // or 'company', 'admin', 'pending'
  provider: "google", // or 'credentials'
  lastLogin: ISODate("2024-01-15T10:30:00Z")
}
```

## Support

For issues with Google OAuth:
1. Check [NextAuth Google Provider docs](https://next-auth.js.org/providers/google)
2. Review [Google OAuth 2.0 docs](https://developers.google.com/identity/protocols/oauth2)
3. Check application logs for error details
