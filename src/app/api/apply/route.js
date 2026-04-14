import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Application from '@/models/Application';
import Internship from '@/models/Internship';
import { matchResume } from '@/lib/ai/aiService';
import { checkRateLimit } from '@/lib/middleware/rateLimiter';
import { checkPayloadSize } from '@/lib/middleware/payloadLimits';
import { validateSchema, applicationSchema } from '@/lib/validation/schemas';
import { sanitizeResumeText, hasInjectionPatterns } from '@/lib/security/inputSanitizer';
import { logApiRequest, logApiResponse, logAICall, logSecurityEvent, logDatabaseOperation } from '@/lib/logging/logger';
import { applySecurityHeaders } from '@/lib/middleware/securityHeaders';

export async function GET(req) {
  const start = Date.now();
  
  try {
    logApiRequest('GET', '/api/apply');
    
    const rateLimit = await checkRateLimit(req, 'read');
    if (!rateLimit.success) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: '/api/apply' });
      return applySecurityHeaders(NextResponse.json({ success: false, error: rateLimit.error }, { status: 429 }));
    }
    
    const session = await getServerSession(authOptions);
    if (!session) {
      logSecurityEvent('UNAUTHORIZED_ACCESS', { endpoint: '/api/apply' });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }));
    }
    
    await connectDB();
    
    let query = {};
    if (session.user.role === 'student') {
      query.student = session.user.id;
    } else if (session.user.role === 'company') {
      const internships = await Internship.find({ postedBy: session.user.id });
      query.internship = { $in: internships.map(i => i._id) };
    }
    
    logDatabaseOperation('find', 'Application', { query, userId: session.user.id });
    const applications = await Application.find(query)
      .populate('internship', 'title company location')
      .populate('student', 'name email')
      .sort({ appliedAt: -1 });
    
    logApiResponse('GET', '/api/apply', 200, Date.now() - start, { count: applications.length });
    return applySecurityHeaders(NextResponse.json({ success: true, data: applications }));
  } catch (err) {
    logApiResponse('GET', '/api/apply', 500, Date.now() - start, { error: err.message });
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'Failed to fetch applications',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }, { status: 500 }));
  }
}

export async function POST(req) {
  const start = Date.now();
  
  try {
    logApiRequest('POST', '/api/apply');
    
    const rateLimit = await checkRateLimit(req, 'write');
    if (!rateLimit.success) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: '/api/apply' });
      return applySecurityHeaders(NextResponse.json({ success: false, error: rateLimit.error }, { status: 429 }));
    }
    
    const payload = await checkPayloadSize(req, 'write');
    if (!payload.success) {
      logSecurityEvent('PAYLOAD_SIZE_EXCEEDED', { endpoint: '/api/apply', error: payload.error });
      return applySecurityHeaders(NextResponse.json({ success: false, error: payload.error }, { status: 413 }));
    }
    
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'student') {
      logSecurityEvent('FORBIDDEN_ACCESS', { endpoint: '/api/apply', userId: session?.user?.id, role: session?.user?.role });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Only students can apply' }, { status: 403 }));
    }
    
    await connectDB();
    
    const body = await req.json();
    const validation = validateSchema(applicationSchema, body);
    
    if (!validation.success) {
      logSecurityEvent('VALIDATION_FAILED', { endpoint: '/api/apply', errors: validation.errors });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Validation failed', details: validation.errors }, { status: 400 }));
    }
    
    const { internshipId, resumeUrl, resumeText, coverLetter } = validation.data;
    
    const existing = await Application.findOne({ internship: internshipId, student: session.user.id });
    if (existing) {
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Already applied' }, { status: 400 }));
    }
    
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Internship not found' }, { status: 404 }));
    }
    
    let aiMatch = { score: 0, feedback: 'No AI analysis', matchingSkills: [], missingSkills: [] };
    
    if (resumeText) {
      if (hasInjectionPatterns(resumeText)) {
        logSecurityEvent('PROMPT_INJECTION_ATTEMPT', { endpoint: '/api/apply', userId: session.user.id });
      }
      
      const aiStart = Date.now();
      aiMatch = await matchResume(sanitizeResumeText(resumeText), sanitizeResumeText(internship.description), internship.skills);
      logAICall('matchResume', !aiMatch.error, Date.now() - aiStart, { userId: session.user.id, hasError: !!aiMatch.error });
    }
    
    logDatabaseOperation('create', 'Application', { userId: session.user.id, internshipId });
    
    const application = await Application.create({
      internship: internshipId,
      student: session.user.id,
      resumeUrl,
      resumeText: resumeText ? sanitizeResumeText(resumeText) : '',
      coverLetter,
      aiMatch: { ...aiMatch, checkedAt: new Date() },
    });
    
    logApiResponse('POST', '/api/apply', 201, Date.now() - start);
    return applySecurityHeaders(NextResponse.json({ success: true, data: application }, { status: 201 }));
  } catch (err) {
    logApiResponse('POST', '/api/apply', 500, Date.now() - start, { error: err.message });
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'Failed to submit application',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }, { status: 500 }));
  }
}
