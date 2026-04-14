import { logError, logInfo, logWarn } from '../logging/logger';

const REQUIRED = {
  MONGODB_URI: 'MongoDB connection string',
  NEXTAUTH_URL: 'Application URL',
  NEXTAUTH_SECRET: 'NextAuth secret key',
  GOOGLE_CLIENT_ID: 'Google OAuth client ID',
  GOOGLE_CLIENT_SECRET: 'Google OAuth client secret',
  OPENROUTER_API_KEY: 'OpenRouter API key',
};

const PLACEHOLDERS = [
  'your-secret-key-change-this-in-production',
  'your-google-client-id.apps.googleusercontent.com',
  'your-google-client-secret',
  'sk-or-v1-your-openrouter-api-key',
];

export function validateEnvironment() {
  const errors = [];
  const warnings = [];
  
  logInfo('Validating environment variables...');
  
  for (const [key, desc] of Object.entries(REQUIRED)) {
    const value = process.env[key];
    if (!value) {
      errors.push(`${key} (${desc}) is required`);
    } else if (PLACEHOLDERS.includes(value)) {
      warnings.push(`${key} is using placeholder value`);
    }
  }
  
  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV not set');
  }
  
  if (process.env.NEXTAUTH_URL && !isValidUrl(process.env.NEXTAUTH_URL)) {
    errors.push('NEXTAUTH_URL must be a valid URL');
  }
  
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb') && !process.env.MONGODB_URI.startsWith('mongodb+srv')) {
    errors.push('MONGODB_URI must be a valid MongoDB connection string');
  }
  
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    warnings.push('NEXTAUTH_SECRET should be at least 32 characters');
  }
  
  errors.forEach(e => logError(`Environment validation error: ${e}`));
  warnings.forEach(w => logWarn(`Environment validation warning: ${w}`));
  
  if (!errors.length && !warnings.length) {
    logInfo('Environment validation passed');
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateEnvironmentOrThrow() {
  const result = validateEnvironment();
  if (!result.valid) {
    throw new Error(`Environment validation failed:\n${result.errors.join('\n')}`);
  }
  return result;
}

export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    hasMongoDB: !!process.env.MONGODB_URI,
    hasNextAuth: !!(process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL),
    hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
  };
}
