import { NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase/admin';
import { getServerSessionUser } from '@/lib/firebase/server-session';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const sessionUser = await getServerSessionUser(request);
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
  const sessionUser = await getServerSessionUser(request);
  if (!sessionUser || sessionUser.firebase?.sign_in_provider === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let defaultFarmLocation: unknown;
  try {
    ({ defaultFarmLocation } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid profile request.' }, { status: 400 });
  }

  const normalizedLocation = normalizeFarmLocation(defaultFarmLocation);

  try {
    const profileRef = getFirebaseAdminFirestore().collection('users').doc(sessionUser.uid);
    const profileSnapshot = await profileRef.get();
    const existing = profileSnapshot.data() || {};
    const now = new Date().toISOString();
    const existingNormalized = normalizeFarmLocation(existing.farmLocation);

    const farmLocation = existingNormalized || normalizedLocation || {
      latitude: 16.3067,
      longitude: 80.4365,
      district: 'Guntur',
      village: 'Rural Farm',
      displayNameEn: 'Guntur, Andhra Pradesh',
      displayNameTe: 'గుంటూరు, ఆంధ్రప్రదేశ్',
    };

    const profile = {
      uid: sessionUser.uid,
      displayName: sessionUser.name || sessionUser.email || existing.displayName || 'Farmer',
      email: sessionUser.email || existing.email || null,
      photoURL: sessionUser.picture || existing.photoURL || null,
      authProvider: 'google.com',
      createdAt: existing.createdAt || now,
      updatedAt: now,
      farmLocation,
      locationSetupComplete: true,
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
  const sessionUser = await getServerSessionUser(request);
  if (!sessionUser || sessionUser.firebase?.sign_in_provider === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let farmLocation: unknown;
  try {
    ({ farmLocation } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid location request.' }, { status: 400 });
  }

  const normalized = normalizeFarmLocation(farmLocation);
  if (!normalized) {
    return NextResponse.json({ error: 'A valid farm location with numeric coordinates is required.' }, { status: 400 });
  }

  try {
    await getFirebaseAdminFirestore().collection('users').doc(sessionUser.uid).set(
      {
        farmLocation: normalized,
        locationSetupComplete: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return NextResponse.json({ success: true, farmLocation: normalized });
  } catch (error) {
    const code = getErrorCode(error);
    console.error('Farm location save failed:', { code });
    return NextResponse.json({ error: 'Farm location save failed.', code }, { status: 500 });
  }
}

export function normalizeFarmLocation(value: unknown): {
  latitude: number;
  longitude: number;
  district?: string;
  village?: string;
  mandal?: string;
  displayNameEn?: string;
  displayNameTe?: string;
} | null {
  if (!value || typeof value !== 'object') return null;
  const loc = value as Record<string, any>;

  const rawLat = loc.latitude ?? loc._latitude ?? loc.lat ?? loc._lat;
  const rawLng = loc.longitude ?? loc._longitude ?? loc.lng ?? loc._lng ?? loc.lon ?? loc._lon ?? loc.long ?? loc._long;

  const lat =
    typeof rawLat === 'number'
      ? rawLat
      : typeof rawLat === 'string' && rawLat.trim() !== ''
      ? parseFloat(rawLat.trim())
      : NaN;

  const lng =
    typeof rawLng === 'number'
      ? rawLng
      : typeof rawLng === 'string' && rawLng.trim() !== ''
      ? parseFloat(rawLng.trim())
      : NaN;

  if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    const district = typeof loc.district === 'string' && loc.district.trim() ? loc.district.trim() : 'Andhra Pradesh';
    const village = typeof loc.village === 'string' && loc.village.trim() ? loc.village.trim() : '';
    const mandal = typeof loc.mandal === 'string' && loc.mandal.trim() ? loc.mandal.trim() : undefined;
    const displayNameEn =
      typeof loc.displayNameEn === 'string' && loc.displayNameEn.trim()
        ? loc.displayNameEn.trim()
        : village
        ? `${village}, ${district}`
        : `${district}, Andhra Pradesh`;
    const displayNameTe =
      typeof loc.displayNameTe === 'string' && loc.displayNameTe.trim()
        ? loc.displayNameTe.trim()
        : village
        ? `${village}, ${district}`
        : `${district}, ఆంధ్రప్రదేశ్`;

    return {
      latitude: lat,
      longitude: lng,
      district,
      village,
      ...(mandal ? { mandal } : {}),
      displayNameEn,
      displayNameTe,
    };
  }

  return null;
}

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : 'unknown';
}
