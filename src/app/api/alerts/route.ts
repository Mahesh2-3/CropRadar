import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminFirestore } from '@/lib/firebase/admin';
import { getServerSessionUser } from '@/lib/firebase/server-session';
import {
  createFarmerReportedDiseaseReport,
  getStoredDiseaseReports,
  extractCoordinates,
} from '@/modules/geospatial/firestore-alerts';
import { queryVerifiedOutbreaks } from '@/modules/geospatial/network';
import { OutbreakSeverity, PathogenCategory } from '@/types/models';

export const runtime = 'nodejs';

const ALLOWED_CROPS = new Set(['Chilli', 'Paddy', 'Cotton', 'Tomato', 'Groundnut']);
const ALLOWED_PATHOGENS = new Set<PathogenCategory>(['fungal', 'bacterial', 'viral', 'pest', 'nutritional', 'abiotic']);
const ALLOWED_SEVERITIES = new Set<OutbreakSeverity>(['low', 'moderate', 'severe']);

export async function GET(request: NextRequest) {
  const sessionUser = await getServerSessionUser(request);
  if (!sessionUser || sessionUser.firebase?.sign_in_provider === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const profileSnapshot = await getFirebaseAdminFirestore()
      .collection('users')
      .doc(sessionUser.uid)
      .get();
    const profile = profileSnapshot.data();
    const coords = extractCoordinates(profile);
    if (!coords) {
      return NextResponse.json(
        { error: 'Farm location setup is required.', code: 'location-required' },
        { status: 409 }
      );
    }

    const radiusInput = Number(request.nextUrl.searchParams.get('radius') || 5);
    const radiusKm = Number.isFinite(radiusInput) ? Math.min(15, Math.max(1, radiusInput)) : 5;
    const crop = request.nextUrl.searchParams.get('crop') || undefined;
    const reports = await getStoredDiseaseReports();
    const result = queryVerifiedOutbreaks(
      coords.latitude,
      coords.longitude,
      radiusKm,
      crop,
      reports
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Alerts GET error:', getErrorCode(error));
    return NextResponse.json({ error: 'Failed to query outbreaks.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionUser = await getServerSessionUser(request);
  if (!sessionUser || sessionUser.firebase?.sign_in_provider === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const crop = typeof body.crop === 'string' ? body.crop.trim() : '';
    const diseaseName = typeof body.diseaseName === 'string' ? body.diseaseName.trim() : '';
    const pathogenType = body.pathogenType as PathogenCategory;
    const severity = body.severity as OutbreakSeverity;

    if (!ALLOWED_CROPS.has(crop) || !diseaseName || diseaseName.length > 120) {
      return NextResponse.json(
        { error: 'Choose a supported crop and enter a valid disease name.' },
        { status: 400 }
      );
    }
    if (!ALLOWED_PATHOGENS.has(pathogenType) || !ALLOWED_SEVERITIES.has(severity)) {
      return NextResponse.json(
        { error: 'Choose a valid disease category and severity.' },
        { status: 400 }
      );
    }

    const { report, notifiedFarmers } = await createFarmerReportedDiseaseReport({
      reporterUid: sessionUser.uid,
      crop,
      diseaseName,
      pathogenType,
      severity,
      farmLocation: body.farmLocation,
    });

    return NextResponse.json({
      success: true,
      report,
      notificationStatus: notifiedFarmers > 0 ? 'sent' : 'no-nearby-farms',
      notifiedFarmers,
      message: notifiedFarmers > 0
        ? `Report submitted. ${notifiedFarmers} nearby farmer(s) were notified.`
        : 'Report submitted. No other farms with saved locations were found within 5 km.',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'FARM_LOCATION_REQUIRED') {
      return NextResponse.json(
        { error: 'Set your farm location before reporting an outbreak.', code: 'location-required' },
        { status: 409 }
      );
    }
    console.error('Alerts POST error:', getErrorCode(error));
    return NextResponse.json({ error: 'Failed to submit outbreak report.' }, { status: 500 });
  }
}

function isCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : 'unknown';
}