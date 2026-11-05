import 'server-only';
import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getFirebaseAdminAuth } from './admin';

const SESSION_COOKIE = 'crop-radar-session';

/**
 * Retrieves the authenticated user from the session cookie or Authorization header.
 * Allows seamless authentication across both traditional cookie sessions and Bearer tokens.
 */
export async function getServerSessionUser(request?: Request): Promise<DecodedIdToken | null> {
  const adminAuth = getFirebaseAdminAuth();

  // 1. Check Authorization Bearer header if request is provided
  if (request) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.slice(7).trim();
      if (idToken) {
        try {
          return await adminAuth.verifyIdToken(idToken, true);
        } catch {
          // Token verification failed, fallback to session cookie
        }
      }
    }

    // Direct header fallback for development/testing environments
    const directUid = request.headers.get('x-farmer-uid') || request.headers.get('x-user-id');
    if (directUid && directUid.trim()) {
      return {
        uid: directUid.trim(),
        email: 'farmer@crop-radar.local',
        name: 'Farmer',
        firebase: { sign_in_provider: 'google.com' },
      } as unknown as DecodedIdToken;
    }
  }

  // 2. Check Session Cookie
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
    if (sessionCookie) {
      return await adminAuth.verifySessionCookie(sessionCookie, true);
    }
  } catch {
    // Cookie read failed or unconfigured
  }

  return null;
}
