import { RateLimiterMemory } from 'rate-limiter-flexible';

const limiters = {
  ai: new RateLimiterMemory({ points: 5, duration: 60 }),
  write: new RateLimiterMemory({ points: 10, duration: 60 }),
  read: new RateLimiterMemory({ points: 100, duration: 60 }),
  auth: new RateLimiterMemory({ points: 5, duration: 300 }),
};

function getClientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]
    || req.headers.get('x-real-ip')
    || 'unknown';
}

export async function checkRateLimit(req, type = 'read') {
  const limiter = limiters[type] || limiters.read;
  const ip = getClientIp(req);
  
  try {
    await limiter.consume(ip);
    return { success: true };
  } catch (res) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${Math.round(res.msBeforeNext / 1000)}s`,
      retryAfter: Math.round(res.msBeforeNext / 1000),
    };
  }
}

export function withRateLimit(type = 'read') {
  return async (req) => {
    const result = await checkRateLimit(req, type);
    if (!result.success) {
      return { rateLimited: true, error: result.error, retryAfter: result.retryAfter };
    }
    return { rateLimited: false };
  };
}

export async function getRateLimitInfo(type, ip) {
  const limiter = limiters[type] || limiters.read;
  try {
    const res = await limiter.get(ip);
    return {
      limit: limiter.points,
      remaining: res?.remainingPoints ?? limiter.points,
      reset: res ? new Date(Date.now() + res.msBeforeNext).toISOString() : null,
    };
  } catch {
    return { limit: limiter.points, remaining: limiter.points, reset: null };
  }
}
