import { NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase/admin';
import { getServerSessionUser } from '@/lib/firebase/server-session';
import { COMMUNITY_NOTIFICATIONS } from '@/modules/geospatial/network';

export const runtime = 'nodejs';

interface NotificationRecord extends Record<string, unknown> {
  id: string;
  read?: boolean;
  createdAt?: string;
}

export async function GET(request: Request) {
  const sessionUser = await getServerSessionUser(request);
  const url = new URL(request.url);
  const queryUid = url.searchParams.get('uid') || url.searchParams.get('userId');
  const headerUid = request.headers.get('x-farmer-uid') || request.headers.get('x-user-id');
  const uid = sessionUser?.uid || headerUid || queryUid;

  if (!uid && (!sessionUser || sessionUser.firebase?.sign_in_provider === 'anonymous')) {
    // If unauthenticated, return community broadcast notifications so unauthenticated demo works
    const communityItems = COMMUNITY_NOTIFICATIONS.slice(0, 50);
    return NextResponse.json({
      notifications: communityItems,
      unreadCount: communityItems.filter((n) => !n.read).length,
    });
  }

  const effectiveUid = uid || 'current-farmer';

  try {
    const db = getFirebaseAdminFirestore();
    const notificationsMap = new Map<string, NotificationRecord>();

    // 1. Query user subcollection: users/{uid}/notifications
    try {
      const userNotifRef = db.collection('users').doc(effectiveUid).collection('notifications');
      let subSnapshot;
      try {
        subSnapshot = await userNotifRef.orderBy('createdAt', 'desc').limit(50).get();
      } catch {
        subSnapshot = await userNotifRef.limit(50).get();
      }

      for (const doc of subSnapshot.docs) {
        notificationsMap.set(doc.id, { id: doc.id, ...doc.data() });
      }
    } catch (subErr) {
      console.warn('Reading user subcollection notifications failed:', subErr);
    }

    // 2. Query root notifications collection: notifications where userId == effectiveUid
    try {
      const rootNotifRef = db.collection('notifications').where('userId', '==', effectiveUid).limit(50);
      const rootSnapshot = await rootNotifRef.get();
      for (const doc of rootSnapshot.docs) {
        const data = doc.data();
        const cleanId = (data.reportId as string) || (data.id as string) || doc.id;
        if (!notificationsMap.has(cleanId)) {
          notificationsMap.set(cleanId, { id: cleanId, ...data });
        }
      }
    } catch (rootErr) {
      console.warn('Reading root notifications collection failed:', rootErr);
    }

    // 3. Fallback: If still empty, check COMMUNITY_NOTIFICATIONS in memory
    if (notificationsMap.size === 0 && COMMUNITY_NOTIFICATIONS.length > 0) {
      for (const notif of COMMUNITY_NOTIFICATIONS.slice(0, 30)) {
        notificationsMap.set(notif.id, { ...notif } as NotificationRecord);
      }
    }

    const notifications: NotificationRecord[] = Array.from(notificationsMap.values());

    // In-memory sort by createdAt descending
    notifications.sort((a, b) => {
      const timeA = typeof a.createdAt === 'string' ? Date.parse(a.createdAt) : 0;
      const timeB = typeof b.createdAt === 'string' ? Date.parse(b.createdAt) : 0;
      return timeB - timeA;
    });

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
