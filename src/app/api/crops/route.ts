import { NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase/admin';
import { getServerSessionUser } from '@/lib/firebase/server-session';

export const runtime = 'nodejs';

export async function GET() {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser || sessionUser.firebase?.sign_in_provider === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const cropSnapshot = await getFirebaseAdminFirestore()
      .collection('users')
      .doc(sessionUser.uid)
      .collection('crops')
      .orderBy('updatedAt', 'desc')
      .limit(30)
      .get();

    const crops = await Promise.all(cropSnapshot.docs.map(async (cropDoc) => {
      const crop = cropDoc.data();
      const conversationSnapshot = await cropDoc.ref
        .collection('conversations')
        .orderBy('updatedAt', 'desc')
        .limit(50)
        .get();
      return {
        id: cropDoc.id,
        name: crop.cropName || cropDoc.id,
        conversations: conversationSnapshot.docs.map((conversationDoc) => ({
          id: conversationDoc.id,
          cropId: cropDoc.id,
          cropName: crop.cropName || cropDoc.id,
          ...conversationDoc.data(),
        })),
      };
    }));

    return NextResponse.json({ crops });
  } catch (error) {
    console.error('Crop conversation list read failed:', getErrorCode(error));
    return NextResponse.json({ error: 'Unable to load crop conversations.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser || sessionUser.firebase?.sign_in_provider === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let cropName = '';
  let title = '';
  try {
    const body = await request.json();
    if (typeof body.cropName === 'string') cropName = body.cropName.trim().slice(0, 60);
    if (typeof body.title === 'string') title = body.title.trim().slice(0, 100);
  } catch {
    return NextResponse.json({ error: 'Invalid crop conversation request.' }, { status: 400 });
  }

  const cropId = normalizeCropId(cropName);
  if (!cropName || !cropId) {
    return NextResponse.json({ error: 'A valid crop name is required.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const db = getFirebaseAdminFirestore();
  const cropRef = db.collection('users').doc(sessionUser.uid).collection('crops').doc(cropId);
  const conversationRef = cropRef.collection('conversations').doc();
  const conversation = {
    cropId,
    cropName,
    title: title || `${cropName} conversation`,
    lastMessage: '',
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
  };

  try {
    const batch = db.batch();
    batch.set(cropRef, { cropName, updatedAt: now }, { merge: true });
    batch.set(conversationRef, conversation);
    await batch.commit();
    return NextResponse.json({ conversation: { id: conversationRef.id, ...conversation } }, { status: 201 });
  } catch (error) {
    console.error('Crop conversation create failed:', getErrorCode(error));
    return NextResponse.json({ error: 'Unable to create crop conversation.' }, { status: 500 });
  }
}

function normalizeCropId(cropName: string): string {
  return cropName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : 'unknown';
}