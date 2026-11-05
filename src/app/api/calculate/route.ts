import { NextRequest, NextResponse } from 'next/server';
import { calculateVerifiedTreatment, TreatmentCalculationError } from '@/modules/treatment/calculator';
import { TreatmentCalculationRequest } from '@/types/api';

export async function POST(req: NextRequest) {
  try {
    const body: TreatmentCalculationRequest = await req.json();

    const calculation = calculateVerifiedTreatment(body);
    return NextResponse.json(calculation);
  } catch (error: any) {
    if (error instanceof TreatmentCalculationError) {
      return NextResponse.json({ isVerified: false, error: error.message }, { status: 422 });
    }
    console.error('Calculation API error:', error);
    return NextResponse.json({ isVerified: false, error: 'Internal calculation error' }, { status: 500 });
  }
}
