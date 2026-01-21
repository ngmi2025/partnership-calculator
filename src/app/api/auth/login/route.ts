import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyPassword, createSession } from '@/lib/auth';

interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin user
    console.log('Attempting login for:', email.toLowerCase());
    
    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    console.log('Supabase query result:', { user: user ? 'found' : 'not found', error: error?.message });

    if (error || !user) {
      console.error('Login failed - user lookup error:', error);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const typedUser = user as unknown as AdminUser;
    console.log('User found:', typedUser.email, 'Has hash:', !!typedUser.password_hash);

    // Verify password
    const isValid = await verifyPassword(password, typedUser.password_hash);
    console.log('Password verification result:', isValid);
    
    if (!isValid) {
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
