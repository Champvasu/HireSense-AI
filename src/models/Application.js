import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resumeUrl: {
    type: String,
    required: true,
  },
  resumeText: {
    type: String,
  },
  coverLetter: {
    type: String,
  },
  aiMatch: {
    score: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
    },
    matchingSkills: [{
      type: String,
    }],
    missingSkills: [{
      type: String,
    }],
    checkedAt: {
      type: Date,
    },
  },
  status: {
    type: String,
    enum: ['applied', 'under_review', 'shortlisted', 'rejected', 'accepted'],
    default: 'applied',
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ApplicationSchema.index({ student: 1 });
ApplicationSchema.index({ internship: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ appliedAt: -1 });
ApplicationSchema.index({ student: 1, internship: 1 }, { unique: true });

export default mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
