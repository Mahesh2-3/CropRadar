import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionUser } from '@/lib/firebase/server-session';
import { getStoredDiseaseReports, verifyStoredDiseaseReport } from '@/modules/geospatial/firestore-alerts';

export const runtime = 'nodejs';

export async function GET() {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser || !isAgronomist(sessionUser)) {
    return NextResponse.json({ success: false, error: 'Agronomist access required.' }, { status: 403 });
  }

  try {
    const [pending, all] = await Promise.all([
      getStoredDiseaseReports('pending'),
      getStoredDiseaseReports(),
    ]);
    return NextResponse.json({ success: true, pending, totalReports: all.length });
  } catch (error) {
    console.error('Pending outbreak reports read failed:', getErrorCode(error));
    return NextResponse.json({ success: false, error: 'Unable to load pending reports.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser || !isAgronomist(sessionUser)) {
    return NextResponse.json({ success: false, error: 'Agronomist access required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { reportId, approved, verifierNotes } = body;
    if (typeof reportId !== 'string' || typeof approved !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'reportId and approved boolean are required.' },
        { status: 400 }
      );
    }

    const result = await verifyStoredDiseaseReport({
      reportId,
      approved,
      verifierName: sessionUser.name || sessionUser.email || 'Authorized Agronomist',
      verifierNotes: typeof verifierNotes === 'string' ? verifierNotes.slice(0, 500) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Outbreak verification failed:', getErrorCode(error));
    return NextResponse.json({ success: false, error: 'Unable to verify outbreak report.' }, { status: 500 });
  }
}

function isAgronomist(sessionUser: Record<string, unknown> & { uid?: string }): boolean {
  if (sessionUser.agronomist === true || sessionUser.role === 'agronomist') return true;
  const allowedUids = (process.env.AGRONOMIST_UIDS || '')
    .split(',')
    .map((uid) => uid.trim())
    .filter(Boolean);
  return Boolean(sessionUser.uid && allowedUids.includes(sessionUser.uid));
}

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : 'unknown';
}