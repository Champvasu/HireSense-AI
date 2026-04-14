import mammoth from 'mammoth';

/**
 * Parse resume file and extract text content
 * Supports PDF and DOCX formats
 */
export async function parseResumeFile(data, mimeType) {
  try {
    // Validate data (can be Uint8Array or Buffer)
    if (!data || (data.length === 0 && data.byteLength === 0)) {
      throw new Error('Empty file provided');
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const size = data.length || data.byteLength;
    if (size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit');
    }

    let text = '';

    // Parse based on MIME type
    if (mimeType === 'application/pdf') {
      text = await parsePDF(data);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               mimeType === 'application/docx') {
      text = await parseDOCX(data);
    } else if (mimeType === 'text/plain') {
      // Handle both Uint8Array and Buffer
      text = typeof data === 'string' ? data : new TextDecoder().decode(data);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}. Supported formats: PDF, DOCX, TXT`);
    }

    // Validate extracted text
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the file');
    }

    if (text.trim().length < 50) {
      throw new Error('Extracted text is too short to be a valid resume');
    }

    // Clean and normalize text
    text = cleanText(text);

    return {
      success: true,
      text,
      wordCount: text.split(/\s+/).length,
      charCount: text.length
    };
  } catch (error) {
    console.error('Resume parsing error:', error);
    return {
      success: false,
      error: error.message,
      text: null
    };
  }
}

/**
 * Parse PDF file using pdf2json for Node.js compatibility (no worker issues)
 */
async function parsePDF(data) {
  try {
    // Convert Uint8Array to Buffer for pdf2json
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    
    // Use pdf2json which is designed for Node.js without worker dependencies
    const PDFParser = require('pdf2json');
    const pdfParser = new PDFParser();
    
    return new Promise((resolve, reject) => {
      pdfParser.on('pdfParser_dataError', (errData) => {
        reject(new Error(`PDF parsing error: ${errData.parserError}`));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        try {
          const pages = pdfData.Pages || [];
          let text = '';
          let totalTextItems = 0;
          
          pages.forEach((page) => {
            if (page.Texts) {
              totalTextItems += page.Texts.length;
              page.Texts.forEach((textItem) => {
                if (textItem.R) {
                  textItem.R.forEach((r) => {
                    if (r.T) {
                      text += decodeURIComponent(r.T) + ' ';
                    }
                  });
                }
              });
            }
            text += '\n';
          });
          
          text = text.trim();
          
          // Detect scanned/image-only PDFs (very few or no text items)
          if (totalTextItems < 10) {
            reject(new Error('Scanned/image PDF detected – OCR not supported yet. Please upload a text-based PDF or convert your resume to PDF with selectable text.'));
            return;
          }
          
          // Detect empty PDF (no meaningful text)
          if (text.length < 20) {
            reject(new Error('Could not extract meaningful text from this PDF. It may be empty or contain only images.'));
            return;
          }
          
          resolve(text);
        } catch (err) {
          reject(new Error(`Failed to extract text: ${err.message}`));
        }
      });
      
      // Parse the PDF buffer
      pdfParser.parseBuffer(buffer);
    });
  } catch (error) {
    // Provide specific error message for common issues
    if (error.message.includes('password') || error.message.includes('encrypted')) {
      throw new Error('The PDF is password-protected and cannot be parsed. Please remove password protection and try again.');
    }
    if (error.message.includes('invalid') || error.message.includes('corrupt')) {
      throw new Error('The PDF file appears to be corrupted or invalid. Please try a different file.');
    }
    if (error.message.includes('Scanned/image PDF')) {
      throw new Error(error.message); // Re-throw the scanned PDF message
    }
    if (error.message.includes('Could not extract meaningful text')) {
      throw new Error(error.message);
    }
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

/**
 * Parse DOCX file (convert Uint8Array to Buffer for mammoth compatibility)
 */
async function parseDOCX(data) {
  try {
    // mammoth expects a Buffer, so convert Uint8Array to Buffer if needed
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    // Provide specific error message for common issues
    if (error.message.includes('not a valid docx') || error.message.includes('corrupt')) {
      throw new Error('The uploaded file is not a valid DOCX document or may be corrupted');
    }
    if (error.message.includes('zip')) {
      throw new Error('The DOCX file appears to be corrupted (invalid ZIP format)');
    }
    throw new Error(`DOCX parsing failed: ${error.message}`);
  }
}

/**
 * Clean and normalize extracted text for ATS analysis
 */
function cleanText(text) {
  // Remove excessive whitespace and normalize spaces
  text = text.replace(/\s+/g, ' ');
  
  // Remove control characters that might interfere with AI processing
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normalize line breaks
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove multiple consecutive newlines (more than 2)
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // Remove bullet points and special formatting characters that might clutter ATS analysis
  text = text.replace(/[•●○■□▪▫]/g, '');
  text = text.replace(/[│┃└├─]/g, '');
  
  // Normalize common unicode characters to ASCII equivalents
  text = text.replace(/[“”]/g, '"');
  text = text.replace(/[‘’]/g, "'");
  text = text.replace(/[–—]/g, '-');
  text = text.replace(/[…]/g, '...');
  
  // Remove excessive punctuation
  text = text.replace(/([.!?])\1+/g, '$1');
  
  // Remove page numbers and headers (common in PDF resumes)
  text = text.replace(/\bPage\s+\d+\s+of\s+\d+\b/gi, '');
  text = text.replace(/^\s*\d+\s*$/gm, '');
  
  // Trim and ensure proper spacing
  text = text.trim();
  
  return text;
}

/**
 * Extract sections from resume text (basic extraction)
 * This can be enhanced with more sophisticated parsing
 */
export function extractResumeSections(text) {
  const sections = {
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: []
  };

  const lowerText = text.toLowerCase();

  // Try to find sections based on common headings
  const lines = text.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    const lowerLine = trimmedLine.toLowerCase();

    // Detect section headers
    if (lowerLine.includes('skill') || lowerLine.includes('technologie')) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n');
      }
      currentSection = 'skills';
      currentContent = [];
    } else if (lowerLine.includes('experience') || lowerLine.includes('work') || lowerLine.includes('employment')) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n');
      }
      currentSection = 'experience';
      currentContent = [];
    } else if (lowerLine.includes('education') || lowerLine.includes('academic')) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n');
      }
      currentSection = 'education';
      currentContent = [];
    } else if (lowerLine.includes('project')) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n');
      }
      currentSection = 'projects';
      currentContent = [];
    } else if (lowerLine.includes('certification') || lowerLine.includes('certificate')) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n');
      }
      currentSection = 'certifications';
      currentContent = [];
    } else if (trimmedLine) {
      currentContent.push(trimmedLine);
    }
  }

  // Don't forget the last section
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n');
  }

  return sections;
}
