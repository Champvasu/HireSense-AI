const LIMITS = {
  ai: 50 * 1024,
  write: 100 * 1024,
  read: 10 * 1024,
  upload: 5 * 1024 * 1024,
};

export async function checkPayloadSize(req, type = 'write') {
  const limit = LIMITS[type] || LIMITS.write;
  
  try {
    const contentLength = req.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > limit) {
        const fmt = (bytes) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)}MB` : `${(bytes / 1024).toFixed(2)}KB`;
        return { success: false, error: `Payload (${fmt(size)}) exceeds limit (${fmt(limit)})` };
      }
    }
    
    const clone = req.clone();
    const body = await clone.text();
    if (body.length > limit) {
      const fmt = (bytes) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)}MB` : `${(bytes / 1024).toFixed(2)}KB`;
      return { success: false, error: `Payload (${fmt(body.length)}) exceeds limit (${fmt(limit)})` };
    }
    
    return { success: true };
  } catch {
    return { success: true };
  }
}

export function withPayloadLimit(type = 'write') {
  return async (req) => {
    const result = await checkPayloadSize(req, type);
    return !result.success ? { sizeExceeded: true, error: result.error } : { sizeExceeded: false };
  };
}

export function getPayloadLimit(type = 'write') {
  const limit = LIMITS[type] || LIMITS.write;
  return limit >= 1024 * 1024 ? `${(limit / 1024 / 1024).toFixed(2)}MB` : `${(limit / 1024).toFixed(2)}KB`;
}
