import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { applySecurityHeaders } from '@/lib/middleware/securityHeaders';

export async function POST(req) {
  try {
    const { email } = await req.json();
    
    if (!email || !email.includes('@')) {
      return applySecurityHeaders(NextResponse.json({
        success: false,
        error: 'Invalid email address',
      }, { status: 400 }));
    }

    await connectDB();
    
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    return applySecurityHeaders(NextResponse.json({
      success: true,
      exists: !!user,
      hasPassword: user ? !!user.password : false,
    }));
    
  } catch (error) {
    console.error('Check email error:', error);
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'Failed to check email',
    }, { status: 500 }));
  }
}
