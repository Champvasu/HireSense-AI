import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Internship from '@/models/Internship';
import { checkRateLimit } from '@/lib/middleware/rateLimiter';
import { validateSchema, adminApprovalSchema } from '@/lib/validation/schemas';
import { logApiRequest, logApiResponse, logSecurityEvent, logDatabaseOperation } from '@/lib/logging/logger';
import { applySecurityHeaders } from '@/lib/middleware/securityHeaders';

export async function GET(req, { params }) {
  const start = Date.now();
  
  try {
    logApiRequest('GET', `/api/internships/${params.id}`);
    
    const rateLimit = await checkRateLimit(req, 'read');
    if (!rateLimit.success) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: `/api/internships/${params.id}` });
      return applySecurityHeaders(NextResponse.json({ success: false, error: rateLimit.error }, { status: 429 }));
    }
    
    await connectDB();
    logDatabaseOperation('findById', 'Internship', { id: params.id });
    
    const session = await getServerSession(authOptions);
    const internship = await Internship.findById(params.id).populate('postedBy', 'name email');
    
    if (!internship) {
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Internship not found' }, { status: 404 }));
    }
    
    if (internship.adminApproval?.status !== 'approved') {
      const isOwner = session?.user?.id === internship.postedBy?._id?.toString();
      const isAdmin = session?.user?.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        logSecurityEvent('UNAUTHORIZED_ACCESS_UNAPPROVED', { endpoint: `/api/internships/${params.id}`, userId: session?.user?.id });
        return applySecurityHeaders(NextResponse.json({ success: false, error: 'Internship not found or unavailable' }, { status: 404 }));
      }
    }
    
    logApiResponse('GET', `/api/internships/${params.id}`, 200, Date.now() - start);
    return applySecurityHeaders(NextResponse.json({ success: true, data: internship }));
  } catch (err) {
    logApiResponse('GET', `/api/internships/${params.id}`, 500, Date.now() - start, { error: err.message });
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'Failed to fetch internship',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }, { status: 500 }));
  }
}

export async function PATCH(req, { params }) {
  const start = Date.now();
  
  try {
    logApiRequest('PATCH', `/api/internships/${params.id}`);
    
    const rateLimit = await checkRateLimit(req, 'write');
    if (!rateLimit.success) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: `/api/internships/${params.id}` });
      return applySecurityHeaders(NextResponse.json({ success: false, error: rateLimit.error }, { status: 429 }));
    }
    
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      logSecurityEvent('FORBIDDEN_ACCESS', { endpoint: `/api/internships/${params.id}`, userId: session?.user?.id, role: session?.user?.role });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 }));
    }
    
    await connectDB();
    
    const body = await req.json();
    const validation = validateSchema(adminApprovalSchema, body);
    
    if (!validation.success) {
      logSecurityEvent('VALIDATION_FAILED', { endpoint: `/api/internships/${params.id}`, errors: validation.errors });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Validation failed', details: validation.errors }, { status: 400 }));
    }
    
    logDatabaseOperation('findByIdAndUpdate', 'Internship', { id: params.id, userId: session.user.id });
    const internship = await Internship.findByIdAndUpdate(params.id, { ...validation.data, updatedAt: new Date() }, { new: true });
    
    if (!internship) {
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Internship not found' }, { status: 404 }));
    }
    
    logApiResponse('PATCH', `/api/internships/${params.id}`, 200, Date.now() - start);
    return applySecurityHeaders(NextResponse.json({ success: true, data: internship }));
  } catch (err) {
    logApiResponse('PATCH', `/api/internships/${params.id}`, 500, Date.now() - start, { error: err.message });
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'Failed to update internship',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }, { status: 500 }));
  }
}

export async function DELETE(req, { params }) {
  const start = Date.now();
  
  try {
    logApiRequest('DELETE', `/api/internships/${params.id}`);
    
    const rateLimit = await checkRateLimit(req, 'write');
    if (!rateLimit.success) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: `/api/internships/${params.id}` });
      return applySecurityHeaders(NextResponse.json({ success: false, error: rateLimit.error }, { status: 429 }));
    }
    
    const session = await getServerSession(authOptions);
    if (!session) {
      logSecurityEvent('UNAUTHORIZED_ACCESS', { endpoint: `/api/internships/${params.id}` });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }));
    }
    
    await connectDB();
    
    const internship = await Internship.findById(params.id);
    if (!internship) {
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Internship not found' }, { status: 404 }));
    }
    
    if (session.user.role !== 'admin' && internship.postedBy.toString() !== session.user.id) {
      logSecurityEvent('FORBIDDEN_ACCESS', { endpoint: `/api/internships/${params.id}`, userId: session.user.id, role: session.user.role });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 }));
    }
    
    logDatabaseOperation('findByIdAndDelete', 'Internship', { id: params.id, userId: session.user.id });
    await Internship.findByIdAndDelete(params.id);
    
    logApiResponse('DELETE', `/api/internships/${params.id}`, 200, Date.now() - start);
    return applySecurityHeaders(NextResponse.json({ success: true, message: 'Internship deleted' }));
  } catch (err) {
    logApiResponse('DELETE', `/api/internships/${params.id}`, 500, Date.now() - start, { error: err.message });
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'Failed to delete internship',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }, { status: 500 }));
  }
}
