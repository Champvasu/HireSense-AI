import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { computeSemanticSimilarity, quickSemanticMatch } from '@/lib/ai/aiService';
import { checkRateLimit } from '@/lib/middleware/rateLimiter';
import { checkPayloadSize } from '@/lib/middleware/payloadLimits';
import { sanitizeResumeText, hasInjectionPatterns } from '@/lib/security/inputSanitizer';
import { logApiRequest, logApiResponse, logSecurityEvent } from '@/lib/logging/logger';
import { applySecurityHeaders } from '@/lib/middleware/securityHeaders';
import { parseResumeFile } from '@/lib/parsers/resumeParser';

/**
 * POST /api/ai/semantic
 * Compute pure semantic similarity between resume and job (no LLM)
 * Faster and cheaper than full match - uses embeddings only
 */
export async function POST(req) {
  const start = Date.now();

  try {
    logApiRequest('POST', '/api/ai/semantic');

    // Rate limiting
    const rateLimit = await checkRateLimit(req, 'ai');
    if (!rateLimit.success) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: '/api/ai/semantic' });
      return applySecurityHeaders(NextResponse.json({ success: false, error: rateLimit.error }, { status: 429 }));
    }

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      logSecurityEvent('UNAUTHORIZED_ACCESS', { endpoint: '/api/ai/semantic' });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }));
    }

    let resumeText = '';
    let jobDescription = '';
    let requiredSkills = [];

    const contentType = req.headers.get('content-type');

    // Handle multipart form data (file upload)
    if (contentType && contentType.includes('multipart/form-data')) {
      const payload = await checkPayloadSize(req, 'upload');
      if (!payload.success) {
        logSecurityEvent('PAYLOAD_SIZE_EXCEEDED', { endpoint: '/api/ai/semantic', error: payload.error });
        return applySecurityHeaders(NextResponse.json({ success: false, error: payload.error }, { status: 413 }));
      }

      let resumeFile;
      try {
        const formData = await req.formData();
        resumeFile = formData.get('resume');
        jobDescription = formData.get('jobDescription') || '';
        const skillsStr = formData.get('requiredSkills') || '';
        requiredSkills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);

        if (!resumeFile) {
          logSecurityEvent('MISSING_FILE', { endpoint: '/api/ai/semantic', userId: session.user.id });
          return applySecurityHeaders(NextResponse.json({ success: false, error: 'Resume file is required' }, { status: 400 }));
        }
      } catch (formDataError) {
        console.error('FormData parsing error:', formDataError);
        logSecurityEvent('FORM_PARSE_ERROR', { endpoint: '/api/ai/semantic', error: formDataError.message });
        return applySecurityHeaders(NextResponse.json({ success: false, error: 'Failed to parse form data' }, { status: 400 }));
      }

      // Check file size (max 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (resumeFile.size > MAX_FILE_SIZE) {
        logSecurityEvent('FILE_SIZE_EXCEEDED', { endpoint: '/api/ai/semantic', userId: session.user.id, fileSize: resumeFile.size });
        return applySecurityHeaders(NextResponse.json({ success: false, error: 'File size exceeds 10MB limit' }, { status: 413 }));
      }

      // Validate file type
      const fileName = resumeFile.name || '';
      const fileExtension = fileName.split('.').pop().toLowerCase();
      const mimeType = resumeFile.type || 'application/octet-stream';
      const supportedTypes = ['pdf', 'docx', 'txt'];

      if (!supportedTypes.includes(fileExtension)) {
        logSecurityEvent('INVALID_FILE_EXTENSION', { endpoint: '/api/ai/semantic', userId: session.user.id, extension: fileExtension });
        return applySecurityHeaders(NextResponse.json({
          success: false,
          error: `Unsupported file type: .${fileExtension}. Supported formats: PDF, DOCX, TXT`
        }, { status: 400 }));
      }

      // Parse resume file
      const arrayBuffer = await resumeFile.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        logSecurityEvent('EMPTY_FILE_BUFFER', { endpoint: '/api/ai/semantic', userId: session.user.id });
        return applySecurityHeaders(NextResponse.json({ success: false, error: 'File is empty or could not be read' }, { status: 400 }));
      }

      // PDF header validation
      const uint8Array = new Uint8Array(arrayBuffer);
      if (fileExtension === 'pdf' || mimeType === 'application/pdf') {
        const header = new TextDecoder().decode(uint8Array.slice(0, 4));
        if (header !== '%PDF') {
          logSecurityEvent('INVALID_PDF_HEADER', { endpoint: '/api/ai/semantic', userId: session.user.id, header });
          return applySecurityHeaders(NextResponse.json({ success: false, error: 'The uploaded file is not a valid PDF document' }, { status: 400 }));
        }
      }

      const parseResult = await parseResumeFile(uint8Array, mimeType);
      if (!parseResult.success) {
        logSecurityEvent('RESUME_PARSE_FAILED', { endpoint: '/api/ai/semantic', userId: session.user.id, error: parseResult.error });
        return applySecurityHeaders(NextResponse.json({ success: false, error: `Failed to parse resume: ${parseResult.error}` }, { status: 400 }));
      }

      resumeText = parseResult.text;
    } else {
      // Handle JSON payload
      const payload = await checkPayloadSize(req, 'ai');
      if (!payload.success) {
        logSecurityEvent('PAYLOAD_SIZE_EXCEEDED', { endpoint: '/api/ai/semantic', error: payload.error });
        return applySecurityHeaders(NextResponse.json({ success: false, error: payload.error }, { status: 413 }));
      }

      const body = await req.json();
      resumeText = body.resumeText;
      jobDescription = body.jobDescription;
      requiredSkills = body.requiredSkills || [];
    }

    // Validate required fields
    if (!resumeText || resumeText.trim().length === 0) {
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Resume text is required' }, { status: 400 }));
    }

    if (!jobDescription || jobDescription.trim().length === 0) {
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Job description is required' }, { status: 400 }));
    }

    // Security check
    if (hasInjectionPatterns(resumeText) || hasInjectionPatterns(jobDescription)) {
      logSecurityEvent('PROMPT_INJECTION_ATTEMPT', { endpoint: '/api/ai/semantic', userId: session.user.id });
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Invalid input detected' }, { status: 400 }));
    }

    // Compute semantic similarity (embedding-based, no LLM)
    const aiStart = Date.now();
    const result = await computeSemanticSimilarity(
      sanitizeResumeText(resumeText),
      sanitizeResumeText(jobDescription),
      requiredSkills
    );

    logApiResponse('POST', '/api/ai/semantic', 200, Date.now() - start, {
      userId: session.user.id,
      semanticScore: result.semanticSimilarityScore,
      hasError: !!result.error
    });

    if (result.error) {
      console.error('Semantic similarity error:', result.error);
      return applySecurityHeaders(NextResponse.json({ success: false, error: result.error }, { status: 500 }));
    }

    return applySecurityHeaders(NextResponse.json({
      success: true,
      data: result,
      meta: {
        processingTime: Date.now() - aiStart,
        method: 'embedding_based',
        model: 'sentence-transformers/all-MiniLM-L6-v2'
      }
    }));

  } catch (err) {
    logApiResponse('POST', '/api/ai/semantic', 500, Date.now() - start, { error: err.message });
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'Semantic similarity computation failed',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }, { status: 500 }));
  }
}

/**
 * GET /api/ai/semantic?text1=...&text2=...
 * Quick semantic similarity between two text snippets
 */
export async function GET(req) {
  const start = Date.now();

  try {
    logApiRequest('GET', '/api/ai/semantic');

    // Rate limiting
    const rateLimit = await checkRateLimit(req, 'ai');
    if (!rateLimit.success) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: '/api/ai/semantic' });
      return applySecurityHeaders(NextResponse.json({ success: false, error: rateLimit.error }, { status: 429 }));
    }

    // Authentication (optional for quick checks)
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(req.url);
    const text1 = searchParams.get('text1');
    const text2 = searchParams.get('text2');

    if (!text1 || !text2) {
      return applySecurityHeaders(NextResponse.json({
        success: false,
        error: 'Missing parameters: text1 and text2 required'
      }, { status: 400 }));
    }

    // Length validation
    if (text1.length > 5000 || text2.length > 5000) {
      return applySecurityHeaders(NextResponse.json({
        success: false,
        error: 'Text too long (max 5000 chars)'
      }, { status: 400 }));
    }

    // Compute quick match
    const result = await quickSemanticMatch(text1, text2);

    logApiResponse('GET', '/api/ai/semantic', 200, Date.now() - start, {
      userId: session?.user?.id,
      score: result.score
    });

    return applySecurityHeaders(NextResponse.json({
      success: true,
      data: result
    }));

  } catch (err) {
    logApiResponse('GET', '/api/ai/semantic', 500, Date.now() - start, { error: err.message });
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'Quick semantic match failed',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }, { status: 500 }));
  }
}
