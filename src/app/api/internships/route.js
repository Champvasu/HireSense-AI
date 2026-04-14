import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Internship from '@/models/Internship';
import { verifyInternship } from '@/lib/ai/aiService';
import { checkRateLimit } from '@/lib/middleware/rateLimiter';
import { checkPayloadSize } from '@/lib/middleware/payloadLimits';
import { validateSchema, internshipSchema } from '@/lib/validation/schemas';
import { sanitizeInternshipData, hasInjectionPatterns } from '@/lib/security/inputSanitizer';
import { logApiRequest, logApiResponse, logAICall, logSecurityEvent, logDatabaseOperation } from '@/lib/logging/logger';
import { applySecurityHeaders } from '@/lib/middleware/securityHeaders';

export async function GET(req) {
  const start = Date.now();
  
  try {
    logApiRequest('GET', '/api/internships');
    
    const rateLimit = await checkRateLimit(req, 'read');
    if (!rateLimit.success) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: '/api/internships' });
      return applySecurityHeaders(NextResponse.json({ success: false, error: rateLimit.error }, { status: 429 }));
    }
    
    await connectDB();
    
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const query = {};
    
    let requireApproved = true;
    if (session?.user?.role === 'admin' && searchParams.get('status') === 'all') {
      requireApproved = false;
    } else if (session?.user?.role === 'company' && searchParams.get('my') === 'true') {
      requireApproved = false;
      query.postedBy = session.user.id;
    }
    
    if (requireApproved) {
      query['adminApproval.status'] = 'approved';
    }
    
    const statusParam = searchParams.get('status');
    if (statusParam && statusParam !== 'all') query['aiVerification.status'] = statusParam;
    if (searchParams.get('type')) query.type = searchParams.get('type');
    if (searchParams.get('location')) query.location = { $regex: searchParams.get('location'), $options: 'i' };
    
    logDatabaseOperation('find', 'Internship', { query });
    const internships = await Internship.find(query).populate('postedBy', 'name email').sort({ createdAt: -1 });
    
    logApiResponse('GET', '/api/internships', 200, Date.now() - start, { count: internships.length });
    return applySecurityHeaders(NextResponse.json({ success: true, data: internships }));
  } catch (err) {
    logApiResponse('GET', '/api/internships', 500, Date.now() - start, { error: err.message });
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'Failed to fetch internships',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }, { status: 500 }));
  }
}

export async function POST(req) {
  const start = Date.now();
  
  try {
    logApiRequest('POST', '/api/internships');
    
    const rateLimit = await checkRateLimit(req, 'write');
    if (!rateLimit.success) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: '/api/internships' });
      return applySecurityHeaders(NextResponse.json({ success: false, error: rateLimit.error }, { status: 429 }));
    }
    
    const payload = await checkPayloadSize(req, 'write');
    if (!payload.success) {
      logSecurityEvent('PAYLOAD_SIZE_EXCEEDED', { endpoint: '/api/internships', error: payload.error });
      return applySecurityHeaders(NextResponse.json({ success: false, error: payload.error }, { status: 413 }));
    }
    
    const session = await getServerSession(authOptions);
    if (!session) {
      logSecurityEvent('UNAUTHORIZED_ACCESS', { endpoint: '/api/internships' });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }));
    }
    
    if (session.user.role !== 'company' && session.user.role !== 'admin') {
      logSecurityEvent('FORBIDDEN_ACCESS', { endpoint: '/api/internships', userId: session.user.id, role: session.user.role });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Only companies can post internships' }, { status: 403 }));
    }
    
    await connectDB();
    
    const body = await req.json();
    const validation = validateSchema(internshipSchema, body);
    
    if (!validation.success) {
      logSecurityEvent('VALIDATION_FAILED', { endpoint: '/api/internships', errors: validation.errors });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Validation failed', details: validation.errors }, { status: 400 }));
    }
    
    const data = validation.data;
    
    if (hasInjectionPatterns(JSON.stringify(data))) {
      logSecurityEvent('PROMPT_INJECTION_ATTEMPT', { endpoint: '/api/internships', userId: session.user.id });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 }));
    }
    
    const sanitized = sanitizeInternshipData(data);
    
    // Convert date string to Date object
    if (sanitized.applicationDeadline) {
      sanitized.applicationDeadline = new Date(sanitized.applicationDeadline);
    }
    const aiStart = Date.now();
    const aiResult = await verifyInternship(sanitized);
    
    logAICall('verifyInternship', !aiResult.error, Date.now() - aiStart, { userId: session.user.id, hasError: !!aiResult.error });
    
    // Backend enforcement: Block low-trust submissions
    // Recalibrated thresholds: 70+ verified, 40-69 suspicious, <40 scam
    const MIN_TRUST_SCORE = 40;
    const BLOCKED_STATUSES = ['scam'];
    
    if (BLOCKED_STATUSES.includes(aiResult.status) || (aiResult.score !== undefined && aiResult.score < MIN_TRUST_SCORE)) {
      logSecurityEvent('BLOCKED_SUBMISSION', { 
        userId: session.user.id, 
        aiStatus: aiResult.status, 
        aiScore: aiResult.score,
        scoringBreakdown: aiResult.scoringBreakdown,
        reason: 'AI verification score below threshold or status is scam'
      });
      
      return applySecurityHeaders(NextResponse.json({ 
        success: false, 
        error: 'This listing failed verification and cannot be posted until corrected.',
        details: {
          aiStatus: aiResult.status,
          aiScore: aiResult.score,
          minimumScore: MIN_TRUST_SCORE,
          blockedStatus: BLOCKED_STATUSES.includes(aiResult.status),
          scoringBreakdown: aiResult.scoringBreakdown
        }
      }, { status: 403 }));
    }
    
    // For borderline scores (40-69), mark as pending admin review
    // Verified scores (70+) go to pending (awaiting admin approval)
    let adminApprovalStatus = 'pending';
    if (aiResult.score !== undefined && aiResult.score >= 40 && aiResult.score < 70) {
      adminApprovalStatus = 'pending_admin_review';
    }
    
    logDatabaseOperation('create', 'Internship', { userId: session.user.id, adminApprovalStatus });
    
    const internship = await Internship.create({
      ...sanitized,
      postedBy: session.user.id,
      aiVerification: { ...aiResult, checkedAt: new Date() },
      adminApproval: {
        status: adminApprovalStatus,
      },
    });
    
    logApiResponse('POST', '/api/internships', 201, Date.now() - start);
    return applySecurityHeaders(NextResponse.json({ success: true, data: internship }, { status: 201 }));
  } catch (err) {
    logApiResponse('POST', '/api/internships', 500, Date.now() - start, { error: err.message });
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'Failed to create internship',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }, { status: 500 }));
  }
}
