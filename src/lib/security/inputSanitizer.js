const MAX_STR = 5000;
const MAX_RESUME = 10000;
const MAX_TITLE = 100;

const INJECTION_PATTERNS = [
  /\[SYSTEM:/gi, /\[IGNORE:/gi, /\[INSTRUCTION:/gi, /\[PROMPT:/gi,
  /ignore.*previous.*instructions/gi, /disregard.*all/gi, /forget.*everything/gi,
  /new.*role:/gi, /act.*as:/gi, /pretend.*to.*be/gi, /you.*are.*now/gi,
  /override.*system/gi, /bypass.*security/gi, /admin.*mode/gi, /developer.*mode/gi,
];

export function sanitizeString(input, max = MAX_STR) {
  if (typeof input !== 'string') return '';
  
  let clean = input.trim();
  INJECTION_PATTERNS.forEach(p => clean = clean.replace(p, ''));
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return clean.substring(0, max);
}

export function sanitizeInternshipData(data) {
  return {
    title: sanitizeString(data.title || '', MAX_TITLE),
    company: sanitizeString(data.company || '', MAX_TITLE),
    companyEmail: sanitizeString(data.companyEmail || '', 255),
    companyWebsite: sanitizeString(data.companyWebsite || '', 255),
    companyLinkedIn: sanitizeString(data.companyLinkedIn || '', 255),
    companyRegistrationId: sanitizeString(data.companyRegistrationId || '', 100),
    foundedYear: data.foundedYear !== undefined && data.foundedYear !== null ? Number(data.foundedYear) : null,
    companySize: sanitizeString(data.companySize || '', 50),
    headquarters: sanitizeString(data.headquarters || '', 200),
    recruiterTitle: sanitizeString(data.recruiterTitle || '', 100),
    recruiterLinkedIn: sanitizeString(data.recruiterLinkedIn || '', 255),
    hiringProcess: sanitizeString(data.hiringProcess || '', 1000),
    interviewRounds: data.interviewRounds !== undefined && data.interviewRounds !== null ? Number(data.interviewRounds) : null,
    reportingManager: sanitizeString(data.reportingManager || '', 100),
    conversionOpportunity: Boolean(data.conversionOpportunity),
    numberOfOpenings: data.numberOfOpenings !== undefined && data.numberOfOpenings !== null ? Number(data.numberOfOpenings) : 1,
    testimonials: Array.isArray(data.testimonials) ? data.testimonials.map(t => sanitizeString(t, 500)).filter(Boolean) : [],
    location: sanitizeString(data.location || '', MAX_TITLE),
    type: sanitizeString(data.type || '', 50),
    description: sanitizeString(data.description || '', MAX_STR),
    requirements: Array.isArray(data.requirements) ? data.requirements.map(r => sanitizeString(r, 500)).filter(Boolean) : [],
    skills: Array.isArray(data.skills) ? data.skills.map(s => sanitizeString(s, 100)).filter(Boolean) : [],
    duration: sanitizeString(data.duration || '', 50),
    stipend: sanitizeString(data.stipend || '', 50),
    applicationDeadline: data.applicationDeadline || '',
  };
}

export function sanitizeResumeText(text) {
  return sanitizeString(text || '', MAX_RESUME);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitizeArray(arr, max = 500) {
  return Array.isArray(arr) ? arr.map(item => sanitizeString(item, max)).filter(Boolean) : [];
}

export function hasInjectionPatterns(input) {
  return typeof input === 'string' && INJECTION_PATTERNS.some(p => p.test(input));
}

export function escapeForPrompt(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
