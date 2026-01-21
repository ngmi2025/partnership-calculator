import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { AdminUser, AdminSession } from '@/types/database';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION_DAYS = 7;

export interface SessionWithUser extends AdminSession {
  admin_users: AdminUser;
}

export async function createSession(adminId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin as any).from('admin_sessions').insert({
    id: sessionId,
    admin_id: adminId,
    expires_at: expiresAt.toISOString(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * SESSION_DURATION_DAYS,
    path: '/',
  });

  return sessionId;
}

export async function getSession(): Promise<SessionWithUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionId) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error } = await (supabaseAdmin as any)
    .from('admin_sessions')
    .select('*, admin_users(*)')
    .eq('id', sessionId)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !session) return null;

  return session as SessionWithUser;
}

export async function requireAdmin(): Promise<SessionWithUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (sessionId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin as any).from('admin_sessions').delete().eq('id', sessionId);
  }
  
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Clean up expired sessions (can be called from a cron job)
export async function cleanupExpiredSessions(): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabaseAdmin as any)
    .from('admin_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('*', { count: 'exact', head: true });

  return count || 0;
}
