import { NextRequest, NextResponse } from 'next/server';
import { getWeatherData } from '@/modules/weather/open-meteo';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat') || '16.3067'; // Default: Guntur, Andhra Pradesh (Chilli capital)
    const lngStr = searchParams.get('lng') || '80.4365';

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: 'Valid latitude and longitude numbers are required.' }, { status: 400 });
    }

    const data = await getWeatherData({ latitude, longitude });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
