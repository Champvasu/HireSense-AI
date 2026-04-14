import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { applySecurityHeaders } from '@/lib/middleware/securityHeaders';

export async function POST(req) {
  const start = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }));
    }
    
    const body = await req.json();
    const { role } = body;
    
    if (!['student', 'company'].includes(role)) {
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 }));
    }
    
    await connectDB();
    
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { role },
      { new: true }
    );
    
    if (!user) {
      return applySecurityHeaders(NextResponse.json({ success: false, error: 'User not found' }, { status: 404 }));
    }
    
    return applySecurityHeaders(NextResponse.json({ success: true, data: { role: user.role } }));
  } catch (err) {
    return applySecurityHeaders(NextResponse.json({
      success: false,
      error: 'Failed to update role',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }, { status: 500 }));
  }
}
