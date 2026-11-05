import { NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase/admin';
import { getServerSessionUser } from '@/lib/firebase/server-session';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ notificationId: string }>;
}

export async function PATCH(_request: Request, context: RouteContext) {
  const { notificationId } = await context.params;
  if (!/^[\w-]{1,140}$/.test(notificationId)) {
    return NextResponse.json({ error: 'Invalid notification ID.' }, { status: 400 });
  }

  const sessionUser = await getServerSessionUser();
  if (!sessionUser || sessionUser.firebase?.sign_in_provider === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const notificationRef = getFirebaseAdminFirestore()
      .collection('users')
      .doc(sessionUser.uid)
      .collection('notifications')
      .doc(notificationId);
    const notification = await notificationRef.get();
    if (!notification.exists) {
      return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
    }
    await notificationRef.update({ read: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification read update failed:', getErrorCode(error));
    return NextResponse.json({ error: 'Unable to update notification.' }, { status: 500 });
  }
}

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : 'unknown';
}