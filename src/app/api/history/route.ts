import { NextRequest, NextResponse } from 'next/server';
import { SAMPLE_CROP_TIMELINE, compareCropHealthRecords } from '@/modules/history/recovery-tracker';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get('cycleId') || 'cycle-chilli-kharif-2026';

    const records = SAMPLE_CROP_TIMELINE.filter((r) => r.cycleId === cycleId);
    return NextResponse.json({ cycleId, records });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to retrieve timeline' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentRecordId, previousRecordId } = body;

    const current = SAMPLE_CROP_TIMELINE.find((r) => r.recordId === currentRecordId);
    const previous = previousRecordId ? SAMPLE_CROP_TIMELINE.find((r) => r.recordId === previousRecordId) : undefined;

    if (!current) {
      return NextResponse.json({ error: 'Current health record not found' }, { status: 404 });
    }

    const comparison = compareCropHealthRecords(current, previous);
    return NextResponse.json(comparison);
  } catch (error: any) {
    return NextResponse.json({ error: 'Comparison analysis failed' }, { status: 500 });
  }
}
