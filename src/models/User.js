import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true, // PERFORMANCE: Index for fast auth lookups
  },
  password: {
    type: String,
    required: function() {
      return this.provider === 'credentials';
    },
  },
  image: {
    type: String,
  },
  role: {
    type: String,
    enum: ['pending', 'student', 'company', 'admin'],
    default: 'pending',
  },
  provider: {
    type: String,
    enum: ['credentials', 'google'],
    default: 'credentials',
  },
  // Student-specific fields
  college: {
    type: String,
  },
  degree: {
    type: String,
  },
  graduationYear: {
    type: Number,
  },
  // Company-specific fields
  companyName: {
    type: String,
  },
  recruiterTitle: {
    type: String,
  },
  companyWebsite: {
    type: String,
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
