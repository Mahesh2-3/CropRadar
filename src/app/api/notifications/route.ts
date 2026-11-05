import { NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase/admin';
import { getServerSessionUser } from '@/lib/firebase/server-session';

export const runtime = 'nodejs';

interface NotificationRecord extends Record<string, unknown> {
  id: string;
  read?: boolean;
}

export async function GET() {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser || sessionUser.firebase?.sign_in_provider === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const snapshot = await getFirebaseAdminFirestore()
      .collection('users')
      .doc(sessionUser.uid)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const notifications: NotificationRecord[] = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    } as NotificationRecord));
    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter((notification) => notification.read !== true).length,
    });
  } catch (error) {
    console.error('Notification list read failed:', getErrorCode(error));
    return NextResponse.json({ error: 'Unable to load notifications.' }, { status: 500 });
  }
}

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : 'unknown';
}