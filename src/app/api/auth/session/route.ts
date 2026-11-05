import { NextResponse } from 'next/server';
import { getFirebaseAdminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

const SESSION_COOKIE = 'crop-radar-session';
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  let idToken: unknown;
  try {
    ({ idToken } = await request.json());
  } catch {
    return NextResponse.json({ error: 'A Firebase ID token is required.' }, { status: 400 });
  }

  if (typeof idToken !== 'string' || idToken.length === 0) {
    return NextResponse.json({ error: 'A Firebase ID token is required.' }, { status: 400 });
  }

  try {
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);
    if (decodedToken.firebase.sign_in_provider === 'anonymous') {
      return NextResponse.json({ error: 'Google sign-in is required.' }, { status: 403 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_MS / 1000,
    });
    return response;
  } catch (error) {
    const isConfigurationError =
      error instanceof Error && error.message === 'Firebase Admin credentials are not configured.';
    return NextResponse.json(
      {
        error: isConfigurationError
          ? 'Server Firebase Admin credentials are not configured.'
          : 'Unable to establish a secure session. Check Firebase authentication configuration.',
      },
      { status: isConfigurationError ? 503 : 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}