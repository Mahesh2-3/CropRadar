import { NextRequest, NextResponse } from 'next/server';
import { auditResistanceRisk } from '@/modules/resistance/manager';
import { ResistanceAuditRequest } from '@/types/api';

export async function POST(req: NextRequest) {
  try {
    const body: ResistanceAuditRequest = await req.json();

    if (!body.plannedProductId) {
      return NextResponse.json({ error: 'plannedProductId is required' }, { status: 400 });
    }

    const audit = auditResistanceRisk(body);
    return NextResponse.json(audit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Resistance audit failed' }, { status: 500 });
  }
}
