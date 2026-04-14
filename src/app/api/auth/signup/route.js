import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { applySecurityHeaders } from '@/lib/middleware/securityHeaders';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['student', 'company'], 'Invalid role'),
  // Optional fields based on role
  college: z.string().optional(),
  degree: z.string().optional(),
  graduationYear: z.number().min(2020).max(2035).optional(),
  companyName: z.string().optional(),
  recruiterTitle: z.string().optional(),
  companyWebsite: z.string().url().optional().or(z.literal('')),
});

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return applySecurityHeaders(NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
      }, { status: 400 }));
    }

    const { name, email, password, role, college, degree, graduationYear, companyName, recruiterTitle, companyWebsite } = validation.data;

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return applySecurityHeaders(NextResponse.json({
        success: false,
        error: 'An account with this email already exists. Please sign in instead.',
      }, { status: 409 }));
    }

    // Create new user
    const username = email.split('@')[0] + Math.random().toString(36).substring(2, 6);
    const userData = {
      name: name.trim(),
      username: username,
      email: email.toLowerCase().trim(),
      password,
      role,
      provider: 'credentials',
    };

    // Add role-specific fields
    if (role === 'student') {
      if (college) userData.college = college.trim();
      if (degree) userData.degree = degree.trim();
      if (graduationYear) userData.graduationYear = graduationYear;
    } else if (role === 'company') {
      if (companyName) userData.companyName = companyName.trim();
      if (recruiterTitle) userData.recruiterTitle = recruiterTitle.trim();
      if (companyWebsite) userData.companyWebsite = companyWebsite.trim();
    }

    const user = await User.create(userData);

    return applySecurityHeaders(NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 201 }));

  } catch (error) {
    console.error('Signup error:', error.message);
    console.error('Signup error stack:', error.stack);
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'Failed to create account',
      details: error.message,
    }, { status: 500 }));
  }
}
