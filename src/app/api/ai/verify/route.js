import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyInternship } from '@/lib/ai/aiService';
import { checkRateLimit } from '@/lib/middleware/rateLimiter';
import { checkPayloadSize } from '@/lib/middleware/payloadLimits';
import { validateSchema, aiVerificationSchema } from '@/lib/validation/schemas';
import { sanitizeInternshipData, hasInjectionPatterns } from '@/lib/security/inputSanitizer';
import { logApiRequest, logApiResponse, logAICall, logSecurityEvent } from '@/lib/logging/logger';
import { applySecurityHeaders } from '@/lib/middleware/securityHeaders';
import { validateInternshipListing } from '@/lib/validation/preValidation';

export async function POST(req) {
  const start = Date.now();
  
  try {
    logApiRequest('POST', '/api/ai/verify');
    
    const rateLimit = await checkRateLimit(req, 'ai');
    if (!rateLimit.success) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: '/api/ai/verify' });
      return applySecurityHeaders(NextResponse.json({ success: false, error: rateLimit.error }, { status: 429 }));
    }
    
    const payload = await checkPayloadSize(req, 'ai');
    if (!payload.success) {
      logSecurityEvent('PAYLOAD_SIZE_EXCEEDED', { endpoint: '/api/ai/verify', error: payload.error });
      return applySecurityHeaders(NextResponse.json({ success: false, error: payload.error }, { status: 413 }));
    }
    
    const session = await getServerSession(authOptions);
    if (!session) {
      logSecurityEvent('UNAUTHORIZED_ACCESS', { endpoint: '/api/ai/verify' });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }));
    }
    
    const body = await req.json();
    const validation = validateSchema(aiVerificationSchema, body);
    
    if (!validation.success) {
      logSecurityEvent('VALIDATION_FAILED', { endpoint: '/api/ai/verify', errors: validation.errors });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Validation failed', details: validation.errors }, { status: 400 }));
    }
    
    const internshipData = validation.data.internshipData;
    if (hasInjectionPatterns(internshipData.description)) {
      logSecurityEvent('PROMPT_INJECTION_ATTEMPT', { endpoint: '/api/ai/verify', userId: session.user.id });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 }));
    }
    
    // Pre-validation check before calling AI
    const preValidation = validateInternshipListing(internshipData);
    
    if (!preValidation.canProceedToAI) {
      logSecurityEvent('PRE_VALIDATION_FAILED', { 
        endpoint: '/api/ai/verify', 
        userId: session.user.id,
        issues: preValidation.issues.length,
        warnings: preValidation.warnings.length
      });
      return applySecurityHeaders(NextResponse.json({ 
        success: false, 
        type: 'validation_failed',
        validation: preValidation
      }, { status: 400 }));
    }
    
    const sanitized = sanitizeInternshipData(internshipData);
    
    // Convert date string to Date object for AI service
    if (sanitized.applicationDeadline) {
      sanitized.applicationDeadline = new Date(sanitized.applicationDeadline);
    }
    
    const result = await verifyInternship(sanitized);
    
    logAICall('verify', !result.error, Date.now() - start, { userId: session.user.id, hasError: !!result.error });
    logApiResponse('POST', '/api/ai/verify', 200, Date.now() - start);
    
    return applySecurityHeaders(NextResponse.json({ success: true, data: result }));
  } catch (err) {
    logApiResponse('POST', '/api/ai/verify', 500, Date.now() - start, { error: err.message });
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'AI verification failed',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }, { status: 500 }));
  }
}
