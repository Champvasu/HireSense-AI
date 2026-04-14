import { z } from 'zod';

const emailSchema = z.string().email('Invalid email');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date (YYYY-MM-DD)');

export const internshipSchema = z.object({
  title: z.string().min(3, 'Min 3 chars').max(100, 'Max 100 chars').regex(/^[a-zA-Z0-9\s\-.,!?&()\/]+$/, 'Invalid chars'),
  company: z.string().min(2, 'Min 2 chars').max(100, 'Max 100 chars').regex(/^[a-zA-Z0-9\s\-.,&]+$/, 'Invalid chars'),
  companyEmail: emailSchema,
  companyWebsite: z.string().url('Invalid URL').optional().or(z.literal('')),
  companyLinkedIn: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  companyRegistrationId: z.string().max(100).optional(),
  foundedYear: z.union([z.coerce.number().min(1800).max(new Date().getFullYear() + 1), z.literal('')]).optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional().or(z.literal('')),
  headquarters: z.string().max(200).optional(),
  recruiterTitle: z.string().max(100).optional(),
  recruiterLinkedIn: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  hiringProcess: z.string().max(1000).optional(),
  interviewRounds: z.union([z.coerce.number().min(1).max(10), z.literal('')]).optional(),
  reportingManager: z.string().max(100).optional(),
  conversionOpportunity: z.coerce.boolean().optional(),
  numberOfOpenings: z.union([z.coerce.number().min(1), z.literal('')]).optional(),
  testimonials: z.array(z.string().max(500)).max(5).optional(),
  location: z.string().min(2, 'Min 2 chars').max(100, 'Max 100 chars'),
  type: z.enum(['remote', 'onsite', 'hybrid'], { errorMap: () => ({ message: 'Must be remote, onsite, or hybrid' }) }),
  description: z.string().min(50, 'Min 50 chars').max(5000, 'Max 5000 chars'),
  requirements: z.array(z.string().max(500)).max(20).optional(),
  skills: z.array(z.string().max(100)).max(20).optional(),
  duration: z.string().min(2, 'Min 2 chars').max(50, 'Max 50 chars'),
  stipend: z.string().max(50).optional(),
  applicationDeadline: dateSchema,
});

export const applicationSchema = z.object({
  internshipId: z.string().min(1, 'Required'),
  resumeUrl: z.string().url('Invalid URL'),
  resumeText: z.string().max(10000, 'Max 10000 chars').optional(),
  coverLetter: z.string().max(2000, 'Max 2000 chars').optional(),
});

export const aiVerificationSchema = z.object({
  internshipData: internshipSchema,
});

export const aiMatchingSchema = z.object({
  resumeText: z.string().min(50, 'Min 50 chars').max(10000, 'Max 10000 chars'),
  jobDescription: z.string().min(50, 'Min 50 chars').max(5000, 'Max 5000 chars'),
  requiredSkills: z.array(z.string().max(100)).max(20).optional(),
});

export const adminApprovalSchema = z.object({
  adminApproval: z.object({
    status: z.enum(['approved', 'rejected'], { errorMap: () => ({ message: 'Must be approved or rejected' }) }),
    notes: z.string().max(500).optional(),
    reviewedAt: z.string().optional(),
  }),
});

export const internshipQuerySchema = z.object({
  status: z.enum(['verified', 'suspicious', 'scam', 'all']).optional(),
  type: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  location: z.string().max(100).optional(),
});

export function validateSchema(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    // Zod v4 uses .issues instead of .errors
    const errors = result.error.issues?.map(err => ({ field: err.path.join('.'), message: err.message })) || 
                  result.error.errors?.map(err => ({ field: err.path.join('.'), message: err.message })) ||
                  [{ field: 'unknown', message: 'Validation failed' }];
    
    return {
      success: false,
      errors,
    };
  }
  return { success: true, data: result.data };
}

export function validateBody(schema) {
  return async (req) => {
    try {
      const body = await req.json();
      const result = validateSchema(schema, body);
      return !result.success ? { valid: false, errors: result.errors } : { valid: true, data: result.data };
    } catch {
      return { valid: false, errors: [{ field: 'body', message: 'Invalid JSON' }] };
    }
  };
}
