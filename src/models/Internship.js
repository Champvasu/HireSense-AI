import mongoose from 'mongoose';

const InternshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  companyEmail: {
    type: String,
    required: true,
  },
  companyWebsite: {
    type: String,
  },
  companyLinkedIn: {
    type: String,
  },
  companyRegistrationId: {
    type: String,
  },
  foundedYear: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear() + 1,
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
  },
  headquarters: {
    type: String,
  },
  recruiterTitle: {
    type: String,
  },
  recruiterLinkedIn: {
    type: String,
  },
  hiringProcess: {
    type: String,
  },
  interviewRounds: {
    type: Number,
    min: 1,
    max: 10,
  },
  reportingManager: {
    type: String,
  },
  conversionOpportunity: {
    type: Boolean,
    default: false,
  },
  numberOfOpenings: {
    type: Number,
    min: 1,
    default: 1,
  },
  testimonials: [{
    type: String,
  }],
  location: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['remote', 'onsite', 'hybrid'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: [{
    type: String,
  }],
  skills: [{
    type: String,
  }],
  duration: {
    type: String,
    required: true,
  },
  stipend: {
    type: String,
    default: 'Unpaid',
  },
  applicationDeadline: {
    type: Date,
    required: true,
  },
  aiVerification: {
    score: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'suspicious', 'scam'],
      default: 'pending',
    },
    reasons: [{
      type: String,
    }],
    checkedAt: {
      type: Date,
    },
  },
  adminApproval: {
    status: {
      type: String,
      enum: ['pending', 'pending_admin_review', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to normalize stipend storage
InternshipSchema.pre('save', function(next) {
  if (this.stipend && this.stipend !== 'Unpaid') {
    // Remove any currency symbols and normalize to numeric value only
    let cleanValue = String(this.stipend)
      .replace(/[₹$€£¥]/g, '') // Remove currency symbols
      .replace(/\/month|\/week|\/day/gi, '') // Remove period suffixes
      .replace(/,/g, '') // Remove commas
      .trim();
    
    // If it's a numeric value, store it as a plain number string
    const numericValue = parseFloat(cleanValue);
    if (!isNaN(numericValue)) {
      this.stipend = numericValue.toString();
    }
  }
  next();
});

InternshipSchema.index({ createdAt: -1 });
InternshipSchema.index({ 'adminApproval.status': 1 });
InternshipSchema.index({ 'aiVerification.status': 1 });
InternshipSchema.index({ postedBy: 1 });
InternshipSchema.index({ type: 1 });
InternshipSchema.index({ location: 1 });
InternshipSchema.index({ company: 1 });

export default mongoose.models.Internship || mongoose.model('Internship', InternshipSchema);
