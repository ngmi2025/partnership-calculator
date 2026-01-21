import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyPassword, createSession } from '@/lib/auth';

interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
}

// Simple in-memory rate limiting (consider Upstash Redis for production)
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) return false;
  
  // Reset if window expired
  if (now - attempts.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.delete(ip);
    return false;
  }
  
  return attempts.count >= MAX_ATTEMPTS;
}

function recordAttempt(ip: string): void {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts || now - attempts.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    attempts.count++;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin user
    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      recordAttempt(ip);
      // Don't reveal whether user exists
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const typedUser = user as unknown as AdminUser;

    // Verify password
    const isValid = await verifyPassword(password, typedUser.password_hash);
    
    if (!isValid) {
      recordAttempt(ip);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    await createSession(typedUser.id);

    return NextResponse.json({
      success: true,
      user: {
        id: typedUser.id,
        email: typedUser.email,
        name: typedUser.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
