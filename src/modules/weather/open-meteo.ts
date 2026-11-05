import { WeatherAssessmentResponse, HourlyForecastItem } from '@/types/api';
import { evaluateSpraySuitability } from './spray-rules';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Open-Meteo Gateway
 * Retrieves real-time agricultural weather and provides deterministic spray assessments.
 * Completely free, high accuracy, no private key exposure.
 */
export async function getWeatherData(coords: Coordinates): Promise<WeatherAssessmentResponse> {
  const { latitude, longitude } = coords;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m&forecast_days=2&timezone=auto`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 } }); // Cache for 10 minutes
    if (!res.ok) {
      throw new Error(`Open-Meteo API responded with status ${res.status}`);
    }

    const data = await res.json();

    const current = data.current;
    const hourly = data.hourly;

    const currentObs = {
      tempC: current.temperature_2m,
      humidityPct: current.relative_humidity_2m,
      windSpeedKmh: current.wind_speed_10m,
      precipitationMm: current.precipitation,
      rainProbabilityPct: hourly?.precipitation_probability?.[0] ?? 0,
    };

    const spraySuitability = evaluateSpraySuitability(currentObs);

    // Map 24 hours of forecast
    const hourlyForecast: HourlyForecastItem[] = [];
    const maxHours = Math.min(24, hourly.time.length);

    let nextSafeWindow: { startIso: string; endIso: string; durationHours: number; conditionsSummary: string } | undefined;
    let safeWindowCount = 0;
    let safeWindowStart: string | null = null;

    for (let i = 0; i < maxHours; i++) {
      const hObs = {
        tempC: hourly.temperature_2m[i],
        humidityPct: hourly.relative_humidity_2m[i],
        windSpeedKmh: hourly.wind_speed_10m[i],
        precipitationMm: hourly.precipitation[i],
        rainProbabilityPct: hourly.precipitation_probability[i],
      };

      const evalResult = evaluateSpraySuitability(hObs);
      const timeIso = hourly.time[i];

      hourlyForecast.push({
        timeIso,
        tempC: hObs.tempC,
        humidityPct: hObs.humidityPct,
        windSpeedKmh: hObs.windSpeedKmh,
        precipitationMm: hObs.precipitationMm,
        rainProbabilityPct: hObs.rainProbabilityPct,
        sprayStatus: evalResult.status,
      });

      if (evalResult.status === 'OPTIMAL') {
        if (!safeWindowStart) safeWindowStart = timeIso;
        safeWindowCount++;
      } else if (safeWindowStart && !nextSafeWindow) {
        nextSafeWindow = {
          startIso: safeWindowStart,
          endIso: timeIso,
          durationHours: safeWindowCount,
          conditionsSummary: 'Favorable winds < 12 km/h, 0% rain probability, safe temperature range.',
        };
        safeWindowStart = null;
      }
    }

    if (safeWindowStart && !nextSafeWindow) {
      nextSafeWindow = {
        startIso: safeWindowStart,
        endIso: hourlyForecast[hourlyForecast.length - 1].timeIso,
        durationHours: safeWindowCount,
        conditionsSummary: 'Extended favorable spraying conditions detected.',
      };
    }

    return {
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        elevation: data.elevation,
      },
      currentConditions: {
        temperatureC: current.temperature_2m,
        relativeHumidityPct: current.relative_humidity_2m,
        windSpeedKmh: current.wind_speed_10m,
        windDirectionDeg: current.wind_direction_10m,
        precipitationMm: current.precipitation,
        weatherCode: current.weather_code,
        recordedAtIso: current.time,
      },
      spraySuitability,
      nextSafeSprayWindow: nextSafeWindow,
      hourlyForecast,
    };
  } catch (error) {
    console.error('Open-Meteo weather fetch failed. No fabricated fallback is used.', error);
    throw new Error('Weather data could not be verified from the configured provider.');
  }
}
