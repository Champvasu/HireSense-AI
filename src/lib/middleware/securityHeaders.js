const HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  ...(process.env.NODE_ENV === 'production' ? {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  } : {}),
};

export function applySecurityHeaders(res) {
  Object.entries(HEADERS).forEach(([key, value]) => res.headers.set(key, value));
  return res;
}

export function withSecurityHeaders() {
  return (handler) => async (req, ctx) => applySecurityHeaders(await handler(req, ctx));
}

export function createSecureResponse(data, status = 200) {
  const res = new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
  return applySecurityHeaders(res);
}

export function createErrorResponse(error, status = 500, context = {}) {
  const res = new Response(JSON.stringify({
    success: false,
    error,
    ...(process.env.NODE_ENV === 'development' ? { context } : {}),
  }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
  return applySecurityHeaders(res);
}
