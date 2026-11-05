import { SprayWindowStatus } from '@/types/models';
import { WEATHER_THRESHOLDS } from '@/config/agronomic-rules';

export interface WeatherObservationInput {
  tempC: number;
  humidityPct: number;
  windSpeedKmh: number;
  precipitationMm: number;
  rainProbabilityPct?: number;
}

export interface SprayRuleEvaluationResult {
  status: SprayWindowStatus;
  summaryEn: string;
  summaryTe: string;
  rulesEvaluated: {
    windCheck: { passed: boolean; message: string; value: number; limit: number };
    rainCheck: { passed: boolean; message: string; rainProbNext4h: number; threshold: number };
    temperatureCheck: { passed: boolean; message: string; value: number; min: number; max: number };
    humidityCheck: { passed: boolean; message: string; value: number; min: number; max: number };
    inversionCheck: { passed: boolean; message: string };
  };
}

/**
 * Deterministic Weather Risk Evaluation for Chemical Spraying.
 *
 * Rules:
 * 1. Wind Speed:
 *    - > 15 km/h: PROHIBITED (High drift hazard, chemical leaves target canopy)
 *    - 10 - 15 km/h: MARGINAL (Drift warning, requires low-drift nozzles)
 *    - < 3 km/h with clear sky: Risk of temperature inversion
 *    - 3 - 10 km/h: OPTIMAL
 * 2. Rain & Precipitation:
 *    - Rain prob > 35% or rain > 0.8 mm: PROHIBITED (Wash-off, loss of systemic deposit)
 * 3. Temperature:
 *    - > 34°C: PROHIBITED (Volatilization, rapid evaporation, phytotoxicity scorch)
 *    - < 12°C: MARGINAL (Slow systemic intake)
 *    - 15 - 30°C: OPTIMAL
 * 4. Relative Humidity:
 *    - > 85%: MARGINAL / PROHIBITED (Prolonged leaf wetness promotes fungal incubation)
 *    - < 40%: MARGINAL (Droplets evaporate before cuticle penetration)
 */
export function evaluateSpraySuitability(obs: WeatherObservationInput): SprayRuleEvaluationResult {
  const { wind, rain, temp, humidity } = WEATHER_THRESHOLDS;
  const violations: string[] = [];
  const violationsTe: string[] = [];

  // 1. Wind Check
  let windPassed = true;
  let windMsg = `Wind speed is safe at ${obs.windSpeedKmh} km/h (Limit: ${wind.marginalMaxKmh} km/h).`;
  if (obs.windSpeedKmh > wind.marginalMaxKmh) {
    windPassed = false;
    windMsg = `High wind speed (${obs.windSpeedKmh} km/h) exceeds safe threshold (${wind.marginalMaxKmh} km/h). High risk of drift.`;
    violations.push(`Severe spray drift hazard (${obs.windSpeedKmh} km/h)`);
    violationsTe.push(`తీవ్రమైన గాలి వేగం (${obs.windSpeedKmh} km/h). మందు పక్క పొలాల్లోకి ఎగిరిపోయే ప్రమాదం ఉంది.`);
  }

  // Inversion check (dead calm wind under 3 km/h)
  let inversionPassed = true;
  let inversionMsg = 'Normal atmospheric mixing detected.';
  if (obs.windSpeedKmh < wind.calmMinKmh) {
    inversionPassed = false;
    inversionMsg = `Dead calm air (${obs.windSpeedKmh} km/h). Risk of thermal inversion trapping chemical mist near ground.`;
    violations.push('Temperature inversion warning: dead calm air.');
    violationsTe.push('గాలి పూర్తిగా నిలిచిపోయింది. మందు పొగమంచులా నిలిచిపోయే ప్రమాదం.');
  }

  // 2. Rain Check
  const rainProb = obs.rainProbabilityPct ?? (obs.precipitationMm > 0 ? 90 : 10);
  let rainPassed = true;
  let rainMsg = `Rain risk is low (Rain prob: ${rainProb}%, Rain: ${obs.precipitationMm} mm).`;
  if (obs.precipitationMm > rain.maxPrecipitation4hMm || rainProb > rain.maxProbabilityPct4h) {
    rainPassed = false;
    rainMsg = `Imminent rain hazard (${obs.precipitationMm} mm, ${rainProb}% probability). Chemical will wash off.`;
    violations.push(`Imminent rainfall risk (${rainProb}% prob)`);
    violationsTe.push(`వర్షం పడే అవకాశం ఉంది (${rainProb}%). పిచికారీ చేసిన మందు కొట్టుకుపోతుంది.`);
  }

  // 3. Temperature Check
  let tempPassed = true;
  let tempMsg = `Temperature is favorable (${obs.tempC}°C).`;
  if (obs.tempC > temp.maxSafeC) {
    tempPassed = false;
    tempMsg = `High temperature (${obs.tempC}°C > ${temp.maxSafeC}°C) causes rapid droplet evaporation and leaf scorching.`;
    violations.push(`Extreme heat scorch risk (${obs.tempC}°C)`);
    violationsTe.push(`ఎండ తీవ్రత ఎక్కువ (${obs.tempC}°C). మందు ఆవిరైపోయి ఆకులు మాడిపోయే ప్రమాదం ఉంది.`);
  } else if (obs.tempC < temp.minSafeC) {
    tempPassed = false;
    tempMsg = `Low temperature (${obs.tempC}°C < ${temp.minSafeC}°C) retards chemical systemic absorption.`;
    violations.push(`Low temperature (${obs.tempC}°C)`);
    violationsTe.push(`చలి ఎక్కువ (${obs.tempC}°C). మందు పనితనం తగ్గుతుంది.`);
  }

  // 4. Humidity Check
  let humidityPassed = true;
  let humidityMsg = `Relative humidity is suitable (${obs.humidityPct}%).`;
  if (obs.humidityPct > humidity.maxSafePct) {
    humidityPassed = false;
    humidityMsg = `High humidity (${obs.humidityPct}% > ${humidity.maxSafePct}%) slows droplet drying and encourages fungal spread.`;
    violations.push(`Excessive humidity (${obs.humidityPct}%)`);
    violationsTe.push(`గాలిలో తేమ ఎక్కువ (${obs.humidityPct}%). ఆకులు త్వరగా ఆరవు.`);
  } else if (obs.humidityPct < humidity.minSafePct) {
    humidityPassed = false;
    humidityMsg = `Dry air (${obs.humidityPct}% < ${humidity.minSafePct}%) causes premature droplet evaporation.`;
    violations.push(`Dry ambient air (${obs.humidityPct}%)`);
    violationsTe.push(`గాలిలో పొడిదనం ఎక్కువ (${obs.humidityPct}%).`);
  }

  // Determine overall status
  let status: SprayWindowStatus = 'OPTIMAL';
  if (obs.windSpeedKmh > wind.marginalMaxKmh || obs.precipitationMm > rain.maxPrecipitation4hMm || rainProb > 50 || obs.tempC > temp.criticalEvaporationC) {
    status = 'PROHIBITED';
  } else if (violations.length > 0) {
    status = 'MARGINAL';
  }

  const summaryEn =
    status === 'OPTIMAL'
      ? 'Weather conditions are optimal for foliar spray. Favorable wind speed, temperature, and no rain forecast.'
      : status === 'MARGINAL'
      ? `Spray with caution: ${violations.join(', ')}.`
      : `DO NOT SPRAY: ${violations.join(', ')}.`;

  const summaryTe =
    status === 'OPTIMAL'
      ? 'పిచికారీకి వాతావరణం చాలా అనుకూలంగా ఉంది. గాలి వేగం, ఉష్ణోగ్రత సరైన పరిమితిలో ఉన్నాయి.'
      : status === 'MARGINAL'
      ? `జాగ్రత్తతో పిచికారీ చేయండి: ${violationsTe.join(' ')}`
      : `పిచికారీ చేయవద్దు! ప్రమాదకర పరిస్థితులు: ${violationsTe.join(' ')}`;

  return {
    status,
    summaryEn,
    summaryTe,
    rulesEvaluated: {
      windCheck: { passed: windPassed, message: windMsg, value: obs.windSpeedKmh, limit: wind.marginalMaxKmh },
      rainCheck: { passed: rainPassed, message: rainMsg, rainProbNext4h: rainProb, threshold: rain.maxProbabilityPct4h },
      temperatureCheck: { passed: tempPassed, message: tempMsg, value: obs.tempC, min: temp.minSafeC, max: temp.maxSafeC },
      humidityCheck: { passed: humidityPassed, message: humidityMsg, value: obs.humidityPct, min: humidity.minSafePct, max: humidity.maxSafePct },
      inversionCheck: { passed: inversionPassed, message: inversionMsg },
    },
  };
}
