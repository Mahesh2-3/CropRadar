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
    const snapshot = await getFirebaseAdminFirestore().collection('users').doc(sessionUser.uid).get();
    return NextResponse.json({ profile: snapshot.exists ? snapshot.data() : null });
  } catch (error) {
    const code = getErrorCode(error);
    console.error('Farmer profile read failed:', { code });
    return NextResponse.json({ error: 'Farmer profile read failed.', code }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser || sessionUser.firebase?.sign_in_provider === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let defaultFarmLocation: unknown;
  try {
    ({ defaultFarmLocation } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid profile request.' }, { status: 400 });
  }

  try {
    const profileRef = getFirebaseAdminFirestore().collection('users').doc(sessionUser.uid);
    const profileSnapshot = await profileRef.get();
    const existing = profileSnapshot.data() || {};
    const now = new Date().toISOString();
    const profile = {
      uid: sessionUser.uid,
      displayName: sessionUser.name || sessionUser.email || existing.displayName || 'Farmer',
      email: sessionUser.email || existing.email || null,
      photoURL: sessionUser.picture || existing.photoURL || null,
      authProvider: 'google.com',
      createdAt: existing.createdAt || now,
      updatedAt: now,
      ...(!existing.farmLocation && isFarmLocation(defaultFarmLocation)
        ? { farmLocation: defaultFarmLocation }
        : {}),
      locationSetupComplete:
        existing.locationSetupComplete === true || isFarmLocation(defaultFarmLocation),
      preferredLanguage: existing.preferredLanguage || 'te',
      alertRadiusKm: existing.alertRadiusKm || 5,
      activeCrops: existing.activeCrops || ['Chilli', 'Paddy'],
    };

    await profileRef.set(profile, { merge: true });
    return NextResponse.json({ profile });
  } catch (error) {
    const code = getErrorCode(error);
    console.error('Farmer profile sync failed:', { code });
    return NextResponse.json({ error: 'Farmer profile sync failed.', code }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser || sessionUser.firebase?.sign_in_provider === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let farmLocation: unknown;
  try {
    ({ farmLocation } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid location request.' }, { status: 400 });
  }

  if (!isFarmLocation(farmLocation)) {
    return NextResponse.json({ error: 'A valid farm location is required.' }, { status: 400 });
  }

  try {
    await getFirebaseAdminFirestore().collection('users').doc(sessionUser.uid).set(
      {
        farmLocation,
        locationSetupComplete: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = getErrorCode(error);
    console.error('Farm location save failed:', { code });
    return NextResponse.json({ error: 'Farm location save failed.', code }, { status: 500 });
  }
}

function isFarmLocation(value: unknown): value is Record<string, unknown> & {
  latitude: number;
  longitude: number;
} {
  if (!value || typeof value !== 'object') return false;
  const location = value as Record<string, unknown>;
  return typeof location.latitude === 'number' &&
    Number.isFinite(location.latitude) &&
    typeof location.longitude === 'number' &&
    Number.isFinite(location.longitude);
}

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : 'unknown';
}