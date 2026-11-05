import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminAuth } from '@/lib/firebase/admin';

const SESSION_COOKIE = 'crop-radar-session';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRequest = pathname.startsWith('/api/');
  if (pathname === '/api/auth/session') return NextResponse.next();

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const loginUrl = new URL('/login', request.url);

  if (!sessionCookie && isApiRequest) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  if (pathname !== '/login' && !sessionCookie) {
    loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (!sessionCookie) return NextResponse.next();

  try {
    await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  } catch {
    if (pathname === '/login') return NextResponse.next();

    loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    const response = isApiRequest
      ? NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
      : NextResponse.redirect(loginUrl);
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  }
}

export const config = {
  matcher: [
    '/',
    '/diagnosis/:path*',
    '/history/:path*',
    '/radar/:path*',
    '/treatment/:path*',
    '/weather/:path*',
    '/login',
    '/api/:path*',
  ],
};