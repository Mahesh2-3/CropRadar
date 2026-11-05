import { NextRequest, NextResponse } from 'next/server';
import { analyzeCropDisease } from '@/modules/disease/pathology';
import { CropDiagnosisRequest } from '@/types/api';

export async function POST(req: NextRequest) {
  try {
    const body: CropDiagnosisRequest = await req.json();

    if (!body.cropType) {
      return NextResponse.json({ success: false, error: 'Crop type is required.' }, { status: 400 });
    }

    const result = await analyzeCropDisease(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Diagnosis API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error in pathology analysis' },
      { status: 500 }
    );
  }
}
