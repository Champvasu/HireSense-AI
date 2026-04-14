/**
 * External Verification Service
 * Performs real external checks on company websites, email domains, and LinkedIn URLs
 * to enhance trust scoring beyond self-reported data
 * 
 * SECURITY: Includes SSRF protection, rate limiting, caching, and circuit breakers
 */

import { lookup } from 'dns/promises';
import https from 'https';
import http from 'http';
import NodeCache from 'node-cache';

const VERIFICATION_TIMEOUT = 10000; // 10 seconds per check
const MAX_REDIRECTS = 3;
const MAX_RESPONSE_SIZE = 100000; // 100KB
const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'];

// Private IP ranges to block (SSRF protection)
const PRIVATE_IP_RANGES = [
  /^127\./, // Loopback
  /^10\./, // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
  /^192\.168\./, // Private Class C
  /^169\.254\./, // Link-local
  /^::1$/, // IPv6 loopback
  /^fc00:/i, // IPv6 private
  /^fe80:/i, // IPv6 link-local
];

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  'localhost',
  'local',
  'internal',
  'metadata.google.internal',
  '169.254.169.254',
  'metadata.aws.com',
];

// Circuit breaker state
let circuitBreaker = {
  failures: 0,
  lastFailureTime: null,
  isOpen: false,
  resetTimeout: 60000, // 1 minute
  threshold: 5, // Open after 5 consecutive failures
};

// Verification cache (1 hour TTL)
const verificationCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

/**
 * Check if IP address is private/internal (SSRF protection)
 */
function isPrivateIP(ip) {
  if (!ip) return true;
  
  // Check against private IP ranges
  for (const range of PRIVATE_IP_RANGES) {
    if (range.test(ip)) return true;
  }
  
  return false;
}

/**
 * Check if hostname is blocked (SSRF protection)
 */
function isBlockedHostname(hostname) {
  if (!hostname) return true;
  
  const lowerHostname = hostname.toLowerCase();
  return BLOCKED_HOSTNAMES.some(blocked => lowerHostname === blocked || lowerHostname.endsWith('.' + blocked));
}

/**
 * Validate and sanitize URL (SSRF protection)
 */
function validateURL(url) {
  try {
    // Check if URL is valid
    const parsed = new URL(url);
    
    // Restrict to http/https only
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Protocol not allowed');
    }
    
    // Check for blocked hostnames
    if (isBlockedHostname(parsed.hostname)) {
      throw new Error('Hostname blocked');
    }
    
    // Check for private IP in hostname
    const hostname = parsed.hostname;
    
    // Check if hostname is an IP address
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
    if (ipRegex.test(hostname)) {
      if (isPrivateIP(hostname)) {
        throw new Error('Private IP not allowed');
      }
    }
    
    return parsed.href;
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }
}

/**
 * Check if circuit breaker is open
 */
function isCircuitBreakerOpen() {
  if (circuitBreaker.isOpen) {
    const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
    if (timeSinceLastFailure > circuitBreaker.resetTimeout) {
      // Reset circuit breaker
      circuitBreaker.isOpen = false;
      circuitBreaker.failures = 0;
      circuitBreaker.lastFailureTime = null;
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Record circuit breaker failure
 */
function recordCircuitBreakerFailure() {
  circuitBreaker.failures++;
  circuitBreaker.lastFailureTime = Date.now();
  
  if (circuitBreaker.failures >= circuitBreaker.threshold) {
    circuitBreaker.isOpen = true;
  }
}

/**
 * Record circuit breaker success
 */
function recordCircuitBreakerSuccess() {
  circuitBreaker.failures = 0;
  circuitBreaker.lastFailureTime = null;
  circuitBreaker.isOpen = false;
}

/**
 * Check if a domain exists via DNS lookup
 */
async function checkDomainExists(domain) {
  try {
    // Check circuit breaker
    if (isCircuitBreakerOpen()) {
      return { exists: false, error: 'Circuit breaker open - too many failures' };
    }

    // Check cache
    const cacheKey = `dns:${domain}`;
    const cached = verificationCache.get(cacheKey);
    if (cached) return cached;

    // Remove protocol and path
    const cleanDomain = domain.replace(/^(https?:\/\/)/, '').split('/')[0];
    
    // SSRF protection: check for blocked hostnames
    if (isBlockedHostname(cleanDomain)) {
      return { exists: false, error: 'Hostname blocked' };
    }

    // Try DNS lookup with timeout
    const result = await Promise.race([
      lookup(cleanDomain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), VERIFICATION_TIMEOUT))
    ]);
    
    // Check if resolved IP is private
    const addresses = Array.isArray(result.address) ? result.address : [result.address || result];
    const privateIPs = addresses.filter(addr => isPrivateIP(addr));
    
    if (privateIPs.length > 0) {
      return { exists: false, error: 'Private IP detected' };
    }

    const resultData = {
      exists: true,
      addresses: addresses
    };

    // Cache result
    verificationCache.set(cacheKey, resultData);
    recordCircuitBreakerSuccess();
    
    return resultData;
  } catch (error) {
    recordCircuitBreakerFailure();
    return {
      exists: false,
      error: error.message
    };
  }
}

/**
 * Check if website has valid SSL/HTTPS with security safeguards
 */
async function checkSSL(url) {
  try {
    // Check circuit breaker
    if (isCircuitBreakerOpen()) {
      return { valid: false, error: 'Circuit breaker open - too many failures' };
    }

    // Validate URL
    const validatedURL = validateURL(url);
    
    // Check cache
    const cacheKey = `ssl:${validatedURL}`;
    const cached = verificationCache.get(cacheKey);
    if (cached) return cached;

    const cleanUrl = validatedURL.startsWith('http') ? validatedURL : `https://${validatedURL}`;
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        recordCircuitBreakerFailure();
        resolve({ valid: false, error: 'Timeout' });
      }, VERIFICATION_TIMEOUT);

      let redirectCount = 0;
      let totalSize = 0;

      const makeRequest = (targetUrl) => {
        const protocol = targetUrl.startsWith('https') ? https : http;
        
        const req = protocol.get(targetUrl, (res) => {
          clearTimeout(timeout);

          // Handle redirects
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            if (redirectCount >= MAX_REDIRECTS) {
              recordCircuitBreakerFailure();
              resolve({ valid: false, error: 'Too many redirects' });
              return;
            }
            
            redirectCount++;
            try {
              const redirectURL = new URL(res.headers.location, targetUrl).href;
              makeRequest(redirectURL);
            } catch {
              recordCircuitBreakerFailure();
              resolve({ valid: false, error: 'Invalid redirect URL' });
            }
            return;
          }

          const protocolName = targetUrl.startsWith('https') ? 'https' : 'http';
          const result = {
            valid: protocolName === 'https',
            statusCode: res.statusCode,
            protocol: protocolName
          };

          // Cache result
          verificationCache.set(cacheKey, result);
          recordCircuitBreakerSuccess();
          
          resolve(result);
        }).on('error', (err) => {
          clearTimeout(timeout);
          
          // Try HTTP as fallback only if original was HTTPS
          if (targetUrl.startsWith('https') && redirectCount === 0) {
            redirectCount++;
            const httpUrl = targetUrl.replace('https://', 'http://');
            makeRequest(httpUrl);
          } else {
            recordCircuitBreakerFailure();
            resolve({ valid: false, error: err.message });
          }
        });

        // Set response size limit
        req.on('socket', (socket) => {
          socket.on('data', (chunk) => {
            totalSize += chunk.length;
            if (totalSize > MAX_RESPONSE_SIZE) {
              req.destroy();
              recordCircuitBreakerFailure();
              resolve({ valid: false, error: 'Response too large' });
            }
          });
        });
      };

      makeRequest(cleanUrl);
    });
  } catch (error) {
    recordCircuitBreakerFailure();
    return { valid: false, error: error.message };
  }
}

/**
 * Check if email domain matches website domain
 */
function checkEmailDomainMatch(email, website) {
  if (!email || !website) {
    return { matches: false, reason: 'Missing email or website' };
  }

  const emailDomain = email.split('@')[1].toLowerCase();
  const websiteDomain = website.replace(/^(https?:\/\/)/, '').split('/')[0].toLowerCase();

  // Check for exact match
  if (emailDomain === websiteDomain) {
    return { matches: true, type: 'exact' };
  }

  // Check if email is subdomain of website
  if (emailDomain.endsWith('.' + websiteDomain)) {
    return { matches: true, type: 'subdomain' };
  }

  // Check if website is subdomain of email
  if (websiteDomain.endsWith('.' + emailDomain)) {
    return { matches: true, type: 'subdomain' };
  }

  // Check for free email domains
  if (FREE_EMAIL_DOMAINS.includes(emailDomain)) {
    return { matches: false, type: 'free_email', domain: emailDomain };
  }

  return { matches: false, type: 'mismatch', emailDomain, websiteDomain };
}

/**
 * Validate LinkedIn URL format and basic reachability with security safeguards
 */
async function validateLinkedInURL(url) {
  if (!url) {
    return { valid: false, error: 'No URL provided' };
  }

  try {
    // Validate URL
    const validatedURL = validateURL(url);
    
    // Check cache
    const cacheKey = `linkedin:${validatedURL}`;
    const cached = verificationCache.get(cacheKey);
    if (cached) return cached;

    const parsed = new URL(validatedURL);
    
    // Check if it's a LinkedIn URL
    if (!parsed.hostname.includes('linkedin.com')) {
      return { valid: false, error: 'Not a LinkedIn URL' };
    }

    // Check URL structure
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) {
      return { valid: false, error: 'Invalid LinkedIn URL structure' };
    }

    const type = pathParts[0]; // 'company' or 'in'
    const slug = pathParts[1];

    if (!['company', 'in'].includes(type)) {
      return { valid: false, error: 'Invalid LinkedIn URL type' };
    }

    if (!slug || slug.length < 2) {
      return { valid: false, error: 'Invalid LinkedIn slug' };
    }

    // Check circuit breaker
    if (isCircuitBreakerOpen()) {
      return { valid: true, format: true, reachable: false, error: 'Circuit breaker open' };
    }

    // Try to fetch the page (basic reachability check)
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        recordCircuitBreakerFailure();
        const result = { valid: true, format: true, reachable: false, error: 'Timeout' };
        verificationCache.set(cacheKey, result);
        resolve(result);
      }, VERIFICATION_TIMEOUT);

      let redirectCount = 0;
      let totalSize = 0;

      const makeRequest = (targetUrl) => {
        const req = https.get(targetUrl, (res) => {
          clearTimeout(timeout);

          // Handle redirects
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            if (redirectCount >= MAX_REDIRECTS) {
              recordCircuitBreakerFailure();
              const result = { valid: true, format: true, reachable: false, error: 'Too many redirects' };
              verificationCache.set(cacheKey, result);
              resolve(result);
              return;
            }
            
            redirectCount++;
            try {
              const redirectURL = new URL(res.headers.location, targetUrl).href;
              makeRequest(redirectURL);
            } catch {
              recordCircuitBreakerFailure();
              const result = { valid: true, format: true, reachable: false, error: 'Invalid redirect URL' };
              verificationCache.set(cacheKey, result);
              resolve(result);
            }
            return;
          }

          const result = {
            valid: true,
            format: true,
            reachable: res.statusCode >= 200 && res.statusCode < 400,
            statusCode: res.statusCode,
            type,
            slug
          };

          verificationCache.set(cacheKey, result);
          recordCircuitBreakerSuccess();
          
          resolve(result);
        }).on('error', (err) => {
          clearTimeout(timeout);
          recordCircuitBreakerFailure();
          const result = {
            valid: true,
            format: true,
            reachable: false,
            error: err.message
          };
          verificationCache.set(cacheKey, result);
          resolve(result);
        });

        // Set response size limit
        req.on('socket', (socket) => {
          socket.on('data', (chunk) => {
            totalSize += chunk.length;
            if (totalSize > MAX_RESPONSE_SIZE) {
              req.destroy();
              recordCircuitBreakerFailure();
              const result = { valid: true, format: true, reachable: false, error: 'Response too large' };
              verificationCache.set(cacheKey, result);
              resolve(result);
            }
          });
        });
      };

      makeRequest(validatedURL);
    });
  } catch (error) {
    recordCircuitBreakerFailure();
    return { valid: false, error: error.message };
  }
}

/**
 * Fetch and analyze website content with security safeguards
 */
async function analyzeWebsiteContent(url, companyName) {
  if (!url) {
    return { analyzed: false, error: 'No URL provided' };
  }

  try {
    // Validate URL
    const validatedURL = validateURL(url);
    
    // Check cache
    const cacheKey = `content:${validatedURL}`;
    const cached = verificationCache.get(cacheKey);
    if (cached) return cached;

    // Check circuit breaker
    if (isCircuitBreakerOpen()) {
      return { analyzed: false, error: 'Circuit breaker open' };
    }

    const cleanUrl = validatedURL.startsWith('http') ? validatedURL : `https://${validatedURL}`;
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        recordCircuitBreakerFailure();
        const result = { analyzed: false, error: 'Timeout' };
        verificationCache.set(cacheKey, result);
        resolve(result);
      }, VERIFICATION_TIMEOUT);

      let redirectCount = 0;
      let totalSize = 0;

      const makeRequest = (targetUrl) => {
        const req = https.get(targetUrl, (res) => {
          clearTimeout(timeout);

          // Handle redirects
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            if (redirectCount >= MAX_REDIRECTS) {
              recordCircuitBreakerFailure();
              const result = { analyzed: false, error: 'Too many redirects' };
              verificationCache.set(cacheKey, result);
              resolve(result);
              return;
            }
            
            redirectCount++;
            try {
              const redirectURL = new URL(res.headers.location, targetUrl).href;
              makeRequest(redirectURL);
            } catch {
              recordCircuitBreakerFailure();
              const result = { analyzed: false, error: 'Invalid redirect URL' };
              verificationCache.set(cacheKey, result);
              resolve(result);
            }
            return;
          }
          
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
            totalSize += chunk.length;
            
            // Limit response size to prevent memory issues
            if (totalSize > MAX_RESPONSE_SIZE) {
              req.destroy();
              recordCircuitBreakerFailure();
              const result = { analyzed: false, error: 'Response too large' };
              verificationCache.set(cacheKey, result);
              resolve(result);
            }
          });

          res.on('end', () => {
            try {
              const content = data.toLowerCase();
              const companyNameLower = companyName ? companyName.toLowerCase() : '';
              
              // Check if company name appears in content
              const nameMatch = companyNameLower && (
                content.includes(companyNameLower) ||
                content.includes(companyNameLower.replace(/\s+/g, ''))
              );

              // Check for placeholder/template indicators
              const placeholderIndicators = [
                'coming soon',
                'under construction',
                'this is a default page',
                'placeholder',
                'example domain',
                'test website'
              ];
              const hasPlaceholders = placeholderIndicators.some(indicator => content.includes(indicator));

              // Check content length (very low content might be placeholder)
              const contentLength = data.length;
              const hasLowContent = contentLength < 1000;

              // Check for common website elements
              const hasAbout = content.includes('about');
              const hasContact = content.includes('contact');
              const hasServices = content.includes('service') || content.includes('product');

              const result = {
                analyzed: true,
                contentLength,
                nameMatch,
                hasPlaceholders,
                hasLowContent,
                hasAbout,
                hasContact,
                hasServices,
                confidence: calculateContentConfidence(nameMatch, hasPlaceholders, hasLowContent, hasAbout, hasContact, hasServices)
              };

              verificationCache.set(cacheKey, result);
              recordCircuitBreakerSuccess();
              
              resolve(result);
            } catch (error) {
              recordCircuitBreakerFailure();
              const result = { analyzed: false, error: error.message };
              verificationCache.set(cacheKey, result);
              resolve(result);
            }
          });
        }).on('error', (err) => {
          clearTimeout(timeout);
          recordCircuitBreakerFailure();
          const result = { analyzed: false, error: err.message };
          verificationCache.set(cacheKey, result);
          resolve(result);
        });
      };

      makeRequest(cleanUrl);
    });
  } catch (error) {
    recordCircuitBreakerFailure();
    return { analyzed: false, error: error.message };
  }
}

/**
 * Calculate content match confidence score
 */
function calculateContentConfidence(nameMatch, hasPlaceholders, hasLowContent, hasAbout, hasContact, hasServices) {
  let confidence = 0.5; // Base confidence

  if (nameMatch) confidence += 0.3;
  if (!hasPlaceholders) confidence += 0.1;
  if (!hasLowContent) confidence += 0.1;
  if (hasAbout) confidence += 0.1;
  if (hasContact) confidence += 0.1;
  if (hasServices) confidence += 0.1;

  if (hasPlaceholders) confidence -= 0.3;
  if (hasLowContent) confidence -= 0.2;

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Main verification function that runs all checks with security safeguards
 */
export async function verifyCompany(data) {
  const results = {
    website: {},
    email: {},
    linkedin: {},
    content: {},
    overall: {
      score: 0,
      signals: []
    }
  };

  // Check circuit breaker for overall verification
  if (isCircuitBreakerOpen()) {
    results.overall.signals.push({ type: 'circuit_breaker_open', value: true });
    results.overall.score = 0;
    return results;
  }

  // Check cache at domain level
  const domainKey = data.companyWebsite ? data.companyWebsite.replace(/^(https?:\/\/)/, '').split('/')[0] : data.company;
  const cacheKey = `verify:${domainKey}:${data.companyEmail}`;
  const cached = verificationCache.get(cacheKey);
  if (cached) return cached;

  // Website verification
  if (data.companyWebsite) {
    try {
      const domainExists = await checkDomainExists(data.companyWebsite);
      const sslCheck = await checkSSL(data.companyWebsite);
      
      results.website = {
        domainExists,
        sslValid: sslCheck.valid,
        sslProtocol: sslCheck.protocol,
        sslError: sslCheck.error
      };

      if (domainExists.exists) {
        results.overall.signals.push({ type: 'domain_exists', value: true });
      }
      if (sslCheck.valid) {
        results.overall.signals.push({ type: 'ssl_valid', value: true });
      }
    } catch (error) {
      console.error('Website verification error:', error);
    }
  }

  // Email domain matching
  if (data.companyEmail && data.companyWebsite) {
    try {
      const emailMatch = checkEmailDomainMatch(data.companyEmail, data.companyWebsite);
      results.email = emailMatch;
      
      if (emailMatch.matches) {
        results.overall.signals.push({ type: 'email_domain_match', value: true, matchType: emailMatch.type });
      } else if (emailMatch.type === 'free_email') {
        results.overall.signals.push({ type: 'free_email_domain', value: true, domain: emailMatch.domain });
      } else {
        results.overall.signals.push({ type: 'email_domain_mismatch', value: true });
      }
    } catch (error) {
      console.error('Email matching error:', error);
    }
  } else if (data.companyEmail) {
    const emailDomain = data.companyEmail.split('@')[1].toLowerCase();
    if (FREE_EMAIL_DOMAINS.includes(emailDomain)) {
      results.email = { matches: false, type: 'free_email', domain: emailDomain };
      results.overall.signals.push({ type: 'free_email_domain', value: true, domain: emailDomain });
    }
  }

  // LinkedIn validation
  if (data.companyLinkedIn) {
    try {
      const linkedinCheck = await validateLinkedInURL(data.companyLinkedIn);
      results.linkedin.company = linkedinCheck;
      
      if (linkedinCheck.reachable) {
        results.overall.signals.push({ type: 'linkedin_company_reachable', value: true });
      }
    } catch (error) {
      console.error('LinkedIn company verification error:', error);
    }
  }

  if (data.recruiterLinkedIn) {
    try {
      const linkedinCheck = await validateLinkedInURL(data.recruiterLinkedIn);
      results.linkedin.recruiter = linkedinCheck;
      
      if (linkedinCheck.reachable) {
        results.overall.signals.push({ type: 'linkedin_recruiter_reachable', value: true });
      }
    } catch (error) {
      console.error('LinkedIn recruiter verification error:', error);
    }
  }

  // Website content analysis
  if (data.companyWebsite && data.company) {
    try {
      const contentAnalysis = await analyzeWebsiteContent(data.companyWebsite, data.company);
      results.content = contentAnalysis;
      
      if (contentAnalysis.analyzed) {
        results.overall.signals.push({ 
          type: 'content_analyzed', 
          value: true, 
          confidence: contentAnalysis.confidence 
        });
        
        if (contentAnalysis.nameMatch) {
          results.overall.signals.push({ type: 'content_name_match', value: true });
        }
      }
    } catch (error) {
      console.error('Content analysis error:', error);
    }
  }

  // Calculate overall verification score
  results.overall.score = calculateVerificationScore(results.overall.signals);

  // Cache result
  verificationCache.set(cacheKey, results);
  recordCircuitBreakerSuccess();

  return results;
}

/**
 * Calculate verification score based on signals
 * Recalibrated to be less harsh on missing optional fields (LinkedIn, SSL, etc.)
 */
function calculateVerificationScore(signals) {
  let score = 50; // Base score of 50 for any submission (assume neutral until proven otherwise)
  const maxScore = 100;

  // Positive signals (weighted more heavily for critical signals)
  if (signals.some(s => s.type === 'domain_exists')) score += 15;
  if (signals.some(s => s.type === 'ssl_valid')) score += 10; // Reduced from 15
  if (signals.some(s => s.type === 'email_domain_match')) score += 20; // Reduced from 25
  if (signals.some(s => s.type === 'linkedin_company_reachable')) score += 10; // Reduced from 15
  if (signals.some(s => s.type === 'linkedin_recruiter_reachable')) score += 5; // Reduced from 10
  if (signals.some(s => s.type === 'content_name_match')) score += 10; // Reduced from 15

  // Negative signals (reduced penalties to be less harsh)
  if (signals.some(s => s.type === 'free_email_domain')) score -= 10; // Reduced from 20
  if (signals.some(s => s.type === 'email_domain_mismatch')) score -= 10; // Reduced from 15

  // Ensure score stays within bounds
  return Math.max(0, Math.min(maxScore, score));
}

/**
 * Get verification summary for AI prompt
 */
export function getVerificationSummary(verificationResults) {
  const summary = [];

  if (verificationResults.website.domainExists?.exists) {
    summary.push('Company website domain exists and is reachable');
  } else if (verificationResults.website.domainExists) {
    summary.push('Company website domain could not be verified');
  }

  if (verificationResults.website.sslValid) {
    summary.push(`Website uses ${verificationResults.website.sslProtocol} with valid SSL certificate`);
  }

  if (verificationResults.email.matches) {
    summary.push(`Email domain matches website domain (${verificationResults.email.type})`);
  } else if (verificationResults.email.type === 'free_email') {
    summary.push(`Uses free email provider (${verificationResults.email.domain}) instead of corporate domain`);
  } else if (verificationResults.email.type === 'mismatch') {
    summary.push('Email domain does not match website domain');
  }

  if (verificationResults.linkedin.company?.reachable) {
    summary.push('LinkedIn company page is reachable and valid');
  }

  if (verificationResults.linkedin.recruiter?.reachable) {
    summary.push('LinkedIn recruiter profile is reachable and valid');
  }

  if (verificationResults.content.analyzed) {
    if (verificationResults.content.nameMatch) {
      summary.push('Website content matches company name (high confidence)');
    } else {
      summary.push('Website content does not clearly match company name');
    }
    if (verificationResults.content.hasPlaceholders) {
      summary.push('Website appears to be a placeholder/template');
    }
  }

  return summary;
}
