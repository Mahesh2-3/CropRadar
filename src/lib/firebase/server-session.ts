import 'server-only';
import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getFirebaseAdminAuth } from './admin';

const SESSION_COOKIE = 'crop-radar-session';

export async function getServerSessionUser(): Promise<DecodedIdToken | null> {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  try {
    return await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}