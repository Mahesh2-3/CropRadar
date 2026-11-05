import { NextRequest, NextResponse } from 'next/server';
import { processBilingualVoiceQuery } from '@/modules/voice/assistant';
import { TeluguAssistantRequest } from '@/types/api';

export async function POST(req: NextRequest) {
  try {
    const body: TeluguAssistantRequest = await req.json();

    const response = await processBilingualVoiceQuery(body);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Voice API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process voice query' }, { status: 500 });
  }
}
