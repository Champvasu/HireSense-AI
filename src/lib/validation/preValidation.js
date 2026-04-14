/**
 * Pre-validation service for internship listings
 * Performs deterministic checks before AI verification
 * Returns structured recruiter-friendly feedback
 */

export function validateInternshipListing(data) {
  const issues = [];
  const warnings = [];
  const suggestions = [];

  // Required fields check
  const requiredFields = [
    { field: 'title', name: 'Job Title' },
    { field: 'company', name: 'Company Name' },
    { field: 'companyEmail', name: 'Company Email' },
    { field: 'location', name: 'Location' },
    { field: 'type', name: 'Work Type' },
    { field: 'description', name: 'Description' },
    { field: 'duration', name: 'Duration' },
    { field: 'applicationDeadline', name: 'Application Deadline' }
  ];

  requiredFields.forEach(({ field, name }) => {
    if (!data[field] || data[field].toString().trim() === '') {
      issues.push({
        field,
        severity: 'error',
        message: `${name} is required`,
        suggestion: `Please provide a valid ${name.toLowerCase()}`
      });
    }
  });

  // Description quality checks
  if (data.description) {
    const desc = data.description.trim();
    if (desc.length < 50) {
      issues.push({
        field: 'description',
        severity: 'error',
        message: 'Description is too short (minimum 50 characters)',
        suggestion: 'Provide more details about the role, responsibilities, and what the intern will learn'
      });
    } else if (desc.length < 100) {
      warnings.push({
        field: 'description',
        severity: 'warning',
        message: 'Description could be more detailed',
        suggestion: 'Add more specific information about the role, team, and learning opportunities'
      });
    }

    // Check for scam keywords in description
    const scamKeywords = ['payment', 'fee', 'register', 'urgently', 'immediately', 'hurry', 'act now', 'limited spots'];
    const foundScamKeywords = scamKeywords.filter(keyword => 
      desc.toLowerCase().includes(keyword)
    );
    
    if (foundScamKeywords.length > 0) {
      issues.push({
        field: 'description',
        severity: 'error',
        message: `Suspicious keywords detected: ${foundScamKeywords.join(', ')}`,
        suggestion: 'Remove urgency tactics and payment requests from the description'
      });
    }
  }

  // Email validation
  if (data.companyEmail) {
    const email = data.companyEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      issues.push({
        field: 'companyEmail',
        severity: 'error',
        message: 'Invalid email format',
        suggestion: 'Use a valid email address (e.g., careers@company.com)'
      });
    } else {
      // Check for free email domains
      const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
      const domain = email.split('@')[1].toLowerCase();
      
      if (freeDomains.includes(domain)) {
        warnings.push({
          field: 'companyEmail',
          severity: 'warning',
          message: 'Using a free email domain',
          suggestion: 'Use a company email domain for better credibility'
        });
      }
    }
  }

  // Email domain vs website consistency
  if (data.companyEmail && data.companyWebsite) {
    const emailDomain = data.companyEmail.split('@')[1].toLowerCase();
    const websiteDomain = data.companyWebsite.replace('https://', '').replace('http://', '').split('/')[0].toLowerCase();
    
    if (emailDomain !== websiteDomain && !emailDomain.includes(websiteDomain)) {
      warnings.push({
        field: 'companyEmail',
        severity: 'warning',
        message: 'Email domain does not match company website',
        suggestion: 'Ensure the email domain matches your company website for better verification'
      });
    }
  }

  // URL validation
  if (data.companyWebsite) {
    const url = data.companyWebsite.trim();
    try {
      new URL(url);
    } catch {
      issues.push({
        field: 'companyWebsite',
        severity: 'error',
        message: 'Invalid website URL format',
        suggestion: 'Use a valid URL (e.g., https://company.com)'
      });
    }
  }

  if (data.companyLinkedIn) {
    const url = data.companyLinkedIn.trim();
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('linkedin.com')) {
        issues.push({
          field: 'companyLinkedIn',
          severity: 'error',
          message: 'Invalid LinkedIn URL',
          suggestion: 'Use a valid LinkedIn company page URL (e.g., https://linkedin.com/company/company-name)'
        });
      }
    } catch {
      issues.push({
        field: 'companyLinkedIn',
        severity: 'error',
        message: 'Invalid LinkedIn URL format',
        suggestion: 'Use a valid LinkedIn company page URL'
      });
    }
  }

  if (data.recruiterLinkedIn) {
    const url = data.recruiterLinkedIn.trim();
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('linkedin.com')) {
        issues.push({
          field: 'recruiterLinkedIn',
          severity: 'error',
          message: 'Invalid LinkedIn URL',
          suggestion: 'Use a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)'
        });
      }
    } catch {
      issues.push({
        field: 'recruiterLinkedIn',
        severity: 'error',
        message: 'Invalid LinkedIn URL format',
        suggestion: 'Use a valid LinkedIn profile URL'
      });
    }
  }

  // Stipend realism check
  if (data.stipend) {
    const stipend = data.stipend.toLowerCase();
    
    // Check for unrealistic amounts
    if (stipend.includes('5000') || stipend.includes('10000')) {
      warnings.push({
        field: 'stipend',
        severity: 'warning',
        message: 'Stipend amount seems unusually high',
        suggestion: 'Verify the stipend amount is realistic for an internship position'
      });
    }

    // Check for payment/fee language
    if (stipend.includes('fee') || stipend.includes('payment')) {
      issues.push({
        field: 'stipend',
        severity: 'error',
        message: 'Payment/fee language detected in stipend',
        suggestion: 'Internships should not require payment from applicants'
      });
    }
  }

  // Date validation
  if (data.applicationDeadline) {
    try {
      const deadline = new Date(data.applicationDeadline);
      const now = new Date();
      
      if (isNaN(deadline.getTime())) {
        issues.push({
          field: 'applicationDeadline',
          severity: 'error',
          message: 'Invalid date format',
          suggestion: 'Use YYYY-MM-DD format (e.g., 2026-06-30)'
        });
      } else if (deadline < now) {
        issues.push({
          field: 'applicationDeadline',
          severity: 'error',
          message: 'Application deadline is in the past',
          suggestion: 'Choose a future date for the application deadline'
        });
      } else if (deadline < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        warnings.push({
          field: 'applicationDeadline',
          severity: 'warning',
          message: 'Application deadline is very soon',
          suggestion: 'Consider giving applicants more time to apply'
        });
      }
    } catch {
      issues.push({
        field: 'applicationDeadline',
        severity: 'error',
        message: 'Invalid date format',
        suggestion: 'Use YYYY-MM-DD format (e.g., 2026-06-30)'
      });
    }
  }

  // Founded year validation
  if (data.foundedYear) {
    const currentYear = new Date().getFullYear();
    const year = parseInt(data.foundedYear);
    
    if (isNaN(year) || year < 1800 || year > currentYear + 1) {
      issues.push({
        field: 'foundedYear',
        severity: 'error',
        message: 'Invalid founded year',
        suggestion: `Enter a valid year between 1800 and ${currentYear + 1}`
      });
    }
  }

  // Company size validation
  if (data.companySize) {
    const validSizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
    if (!validSizes.includes(data.companySize)) {
      issues.push({
        field: 'companySize',
        severity: 'error',
        message: 'Invalid company size',
        suggestion: 'Select a valid company size from the dropdown'
      });
    }
  }

  // Interview rounds validation
  if (data.interviewRounds) {
    const rounds = parseInt(data.interviewRounds);
    if (isNaN(rounds) || rounds < 1 || rounds > 10) {
      issues.push({
        field: 'interviewRounds',
        severity: 'error',
        message: 'Invalid number of interview rounds',
        suggestion: 'Enter a number between 1 and 10'
      });
    }
  }

  // Number of openings validation
  if (data.numberOfOpenings) {
    const openings = parseInt(data.numberOfOpenings);
    if (isNaN(openings) || openings < 1) {
      issues.push({
        field: 'numberOfOpenings',
        severity: 'error',
        message: 'Invalid number of openings',
        suggestion: 'Enter a positive number'
      });
    }
  }

  // Trust signals presence check (optional but recommended)
  const trustSignals = [
    { field: 'companyWebsite', name: 'Company Website' },
    { field: 'companyLinkedIn', name: 'LinkedIn Company Page' },
    { field: 'companyRegistrationId', name: 'Company Registration ID' },
    { field: 'recruiterLinkedIn', name: 'Recruiter LinkedIn Profile' },
    { field: 'hiringProcess', name: 'Hiring Process Description' }
  ];

  const missingTrustSignals = trustSignals.filter(
    ({ field }) => !data[field] || data[field].toString().trim() === ''
  );

  if (missingTrustSignals.length > 0) {
    suggestions.push({
      type: 'trust_signals',
      message: 'Add verification details to improve trust score',
      missing: missingTrustSignals.map(({ name }) => name),
      suggestion: 'Providing website, LinkedIn, and registration ID can improve your listing\'s trust score'
    });
  }

  // Location consistency check
  if (data.headquarters && data.location) {
    const headquarters = data.headquarters.toLowerCase();
    const location = data.location.toLowerCase();
    
    // If both are specific cities, check for consistency
    if (headquarters.includes(',') && location.includes(',')) {
      const hqCity = headquarters.split(',')[0].trim();
      const locCity = location.split(',')[0].trim();
      
      if (hqCity !== locCity && !location.includes('remote')) {
        warnings.push({
          field: 'location',
          severity: 'warning',
          message: 'Job location differs from headquarters',
          suggestion: 'Ensure the job location is correct or specify if remote work is available'
        });
      }
    }
  }

  // Determine overall validation status
  const hasErrors = issues.length > 0;
  const hasWarnings = warnings.length > 0;
  
  let status;
  if (hasErrors) {
    status = 'failed';
  } else if (hasWarnings) {
    status = 'warning';
  } else {
    status = 'passed';
  }

  return {
    status,
    issues,
    warnings,
    suggestions,
    canProceedToAI: !hasErrors
  };
}
