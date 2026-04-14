import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { matchResume } from '@/lib/ai/aiService';
import { checkRateLimit } from '@/lib/middleware/rateLimiter';
import { checkPayloadSize } from '@/lib/middleware/payloadLimits';
import { validateSchema, aiMatchingSchema } from '@/lib/validation/schemas';
import { sanitizeResumeText, hasInjectionPatterns } from '@/lib/security/inputSanitizer';
import { logApiRequest, logApiResponse, logAICall, logSecurityEvent } from '@/lib/logging/logger';
import { applySecurityHeaders } from '@/lib/middleware/securityHeaders';
import { parseResumeFile } from '@/lib/parsers/resumeParser';

export async function POST(req) {
  const start = Date.now();
  
  try {
    logApiRequest('POST', '/api/ai/match');
    
    const rateLimit = await checkRateLimit(req, 'ai');
    if (!rateLimit.success) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: '/api/ai/match' });
      return applySecurityHeaders(NextResponse.json({ success: false, error: rateLimit.error }, { status: 429 }));
    }
    
    const session = await getServerSession(authOptions);
    if (!session) {
      logSecurityEvent('UNAUTHORIZED_ACCESS', { endpoint: '/api/ai/match' });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }));
    }
    
    const contentType = req.headers.get('content-type');
    let resumeText = '';
    let jobDescription = '';
    let requiredSkills = [];
    
    // Handle multipart form data (file upload)
    if (contentType && contentType.includes('multipart/form-data')) {
      let resumeFile;
      try {
        const formData = await req.formData();
        resumeFile = formData.get('resume');
        jobDescription = formData.get('jobDescription') || '';
        const skillsStr = formData.get('requiredSkills') || '';
        requiredSkills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
        
        if (!resumeFile) {
          logSecurityEvent('MISSING_FILE', { endpoint: '/api/ai/match', userId: session.user.id });
          return applySecurityHeaders(NextResponse.json({ success: false, error: 'Resume file is required' }, { status: 400 }));
        }
      } catch (formDataError) {
        console.error('FormData parsing error:', formDataError);
        logSecurityEvent('FORM_PARSE_ERROR', { endpoint: '/api/ai/match', error: formDataError.message });
        return applySecurityHeaders(NextResponse.json({ success: false, error: 'Failed to parse form data' }, { status: 400 }));
      }
      
      // Check file size (max 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (resumeFile.size > MAX_FILE_SIZE) {
        logSecurityEvent('FILE_SIZE_EXCEEDED', { endpoint: '/api/ai/match', userId: session.user.id, fileSize: resumeFile.size });
        return applySecurityHeaders(NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' }, { status: 413 }));
      }
      
      // Validate file type (MIME + extension)
      const fileName = resumeFile.name || '';
      const fileExtension = fileName.split('.').pop().toLowerCase();
      const mimeType = resumeFile.type || 'application/octet-stream';
      
      // Supported file types
      const supportedTypes = ['pdf', 'docx', 'txt'];
      const supportedMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      
      // Validate extension
      if (!supportedTypes.includes(fileExtension)) {
        logSecurityEvent('INVALID_FILE_EXTENSION', { endpoint: '/api/ai/match', userId: session.user.id, extension: fileExtension });
        return applySecurityHeaders(NextResponse.json({ 
          success: false, 
          error: `Unsupported file type: .${fileExtension}. Supported formats: PDF, DOCX, TXT` 
        }, { status: 400 }));
      }
      
      // Validate MIME type (allow fallback for some browsers)
      if (mimeType !== 'application/octet-stream' && !supportedMimeTypes.includes(mimeType)) {
        logSecurityEvent('INVALID_MIME_TYPE', { endpoint: '/api/ai/match', userId: session.user.id, mimeType });
        return applySecurityHeaders(NextResponse.json({ 
          success: false, 
          error: `Unsupported file type: ${mimeType}. Supported formats: PDF, DOCX, TXT` 
        }, { status: 400 }));
      }
      
      // Parse resume file
      const arrayBuffer = await resumeFile.arrayBuffer();
      
      // Validate we got actual data
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        logSecurityEvent('EMPTY_FILE_BUFFER', { endpoint: '/api/ai/match', userId: session.user.id });
        return applySecurityHeaders(NextResponse.json({ 
          success: false, 
          error: 'File is empty or could not be read' 
        }, { status: 400 }));
      }
      
      // Convert ArrayBuffer to Uint8Array for pdfjs-dist compatibility
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Additional validation for PDF files (header check)
      if (fileExtension === 'pdf' || mimeType === 'application/pdf') {
        // Validate PDF header (PDF files start with %PDF)
        const header = new TextDecoder().decode(uint8Array.slice(0, 4));
        if (header !== '%PDF') {
          logSecurityEvent('INVALID_PDF_HEADER', { endpoint: '/api/ai/match', userId: session.user.id, header });
          return applySecurityHeaders(NextResponse.json({ 
            success: false, 
            error: 'The uploaded file is not a valid PDF document' 
          }, { status: 400 }));
        }
      }
      
      const parseResult = await parseResumeFile(uint8Array, mimeType);
      
      if (!parseResult.success) {
        logSecurityEvent('RESUME_PARSE_FAILED', { endpoint: '/api/ai/match', userId: session.user.id, error: parseResult.error });
        return applySecurityHeaders(NextResponse.json({ 
          success: false, 
          error: `Failed to parse resume: ${parseResult.error}` 
        }, { status: 400 }));
      }
      
      resumeText = parseResult.text;
    } else {
      // Handle JSON payload (text input)
      const payload = await checkPayloadSize(req, 'ai');
      if (!payload.success) {
        logSecurityEvent('PAYLOAD_SIZE_EXCEEDED', { endpoint: '/api/ai/match', error: payload.error });
        return applySecurityHeaders(NextResponse.json({ success: false, error: payload.error }, { status: 413 }));
      }
      
      const body = await req.json();
      const validation = validateSchema(aiMatchingSchema, body);
      
      if (!validation.success) {
        logSecurityEvent('VALIDATION_FAILED', { endpoint: '/api/ai/match', errors: validation.errors });
        return applySecurityHeaders(NextResponse.json({ success: false, error: 'Validation failed', details: validation.errors }, { status: 400 }));
      }
      
      const data = validation.data;
      resumeText = data.resumeText;
      jobDescription = data.jobDescription;
      requiredSkills = data.requiredSkills || [];
    }
    
    // Validate required fields
    if (!resumeText || resumeText.trim().length === 0) {
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Resume text is required' }, { status: 400 }));
    }
    
    if (!jobDescription || jobDescription.trim().length === 0) {
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Job description is required' }, { status: 400 }));
    }
    
    // Security check for injection patterns
    if (hasInjectionPatterns(resumeText) || hasInjectionPatterns(jobDescription)) {
      logSecurityEvent('PROMPT_INJECTION_ATTEMPT', { endpoint: '/api/ai/match', userId: session.user.id });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Invalid input detected' }, { status: 400 }));
    }
    
    const aiStart = Date.now();
    const result = await matchResume(sanitizeResumeText(resumeText), sanitizeResumeText(jobDescription), requiredSkills);
    
    logAICall('matchResume', !result.error, Date.now() - aiStart, { userId: session.user.id, hasError: !!result.error });
    
    if (result.error) {
      console.error('AI matching error:', result.error);
      // Check if it's an API key issue
      if (result.error.includes('API') || result.error.includes('unauthorized') || result.error.includes('401')) {
        return applySecurityHeaders(NextResponse.json({ 
          success: false, 
          error: 'AI service configuration error. Please contact support.' 
        }, { status: 500 }));
      }
      return applySecurityHeaders(NextResponse.json({ success: false, error: result.error }, { status: 500 }));
    }
    
    logApiResponse('POST', '/api/ai/match', 200, Date.now() - start);
    
    return applySecurityHeaders(NextResponse.json({ success: true, data: result }));
  } catch (err) {
    logApiResponse('POST', '/api/ai/match', 500, Date.now() - start, { error: err.message });
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'AI matching failed',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }, { status: 500 }));
  }
}
