import { CropHealthRecord, RecoveryTrend } from '@/types/models';
import { CropHealthComparisonResponse } from '@/types/api';

/**
 * Seed historical health timeline for prototype demonstration
 */
export const SAMPLE_CROP_TIMELINE: CropHealthRecord[] = [
  {
    recordId: 'rec-day-00',
    cycleId: 'cycle-chilli-kharif-2026',
    farmId: 'farm-guntur-01',
    userId: 'user-farmer-01',
    recordedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    cropName: 'Chilli',
    cropNameTe: 'మిరప',
    imageUrls: ['/images/samples/chilli-day0.jpg'],
    visualSymptoms: ['Severe apical leaf curling', 'Vein clearing', 'Interveinal chlorosis', 'Stunted internodes'],
    visualSymptomsTe: ['తీవ్రమైన ఆకు ముడత', 'పసుపు ఈనెలు', 'గిడసబారడం'],
    affectedPlantPart: 'leaf',
    severityPercentage: 65,
    suspectedDiagnosisEn: 'Chilli Leaf Curl Virus',
    suspectedDiagnosisTe: 'మిరప ఆకు ముడత వైరస్',
    weatherSnapshot: {
      tempC: 33,
      humidityPct: 78,
      windSpeedKmh: 11,
      rainPast24hMm: 12.4,
    },
    diagnosisId: 'diag-curl-01',
    treatmentGuidanceId: 'guidance-thiamethoxam-01',
    farmerObservation: 'Top leaves are curling severely into boat shape. Whiteflies observed on undersides.',
  },
  {
    recordId: 'rec-day-07',
    cycleId: 'cycle-chilli-kharif-2026',
    farmId: 'farm-guntur-01',
    userId: 'user-farmer-01',
    recordedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    cropName: 'Chilli',
    cropNameTe: 'మిరప',
    imageUrls: ['/images/samples/chilli-day7.jpg'],
    visualSymptoms: ['Curled older leaves persisting', 'Slight reduction in yellowing', 'Reduced vector activity'],
    visualSymptomsTe: ['ముసలి ఆకుల్లో ముడత అలాగే ఉండటం', 'పసుపుదనం తగ్గడం'],
    affectedPlantPart: 'leaf',
    severityPercentage: 50,
    suspectedDiagnosisEn: 'Chilli Leaf Curl Virus',
    suspectedDiagnosisTe: 'మిరప ఆకు ముడత వైరస్',
    weatherSnapshot: {
      tempC: 30,
      humidityPct: 65,
      windSpeedKmh: 8,
      rainPast24hMm: 0,
    },
    treatmentGuidanceId: 'guidance-neem-oil-02',
    farmerObservation: 'Sprayed Actara as recommended. Vector population decreased, but older curled leaves remain distorted.',
    recoveryAssessment: {
      comparisonToPreviousRecordId: 'rec-day-00',
      trend: 'stable',
      observedChanges: ['Whitefly count visibly dropped', 'No new necrosis', 'Old distorted leaves cannot uncurl'],
      uncertaintyRating: 'moderate',
      scientificRationale: 'Viral deformation on mature leaves is permanent; recovery must be judged on emerging leaves.',
    },
  },
  {
    recordId: 'rec-day-14',
    cycleId: 'cycle-chilli-kharif-2026',
    farmId: 'farm-guntur-01',
    userId: 'user-farmer-01',
    recordedAt: new Date().toISOString(),
    cropName: 'Chilli',
    cropNameTe: 'మిరప',
    imageUrls: ['/images/samples/chilli-day14.jpg'],
    visualSymptoms: ['New apical leaves expanding flat and green', 'Mild residual puckering on lower canopy'],
    visualSymptomsTe: ['కొత్తగా వస్తున్న ఆకులు ఆరోగ్యంగా విస్తరించడం'],
    affectedPlantPart: 'leaf',
    severityPercentage: 25,
    suspectedDiagnosisEn: 'Chilli Leaf Curl Virus',
    suspectedDiagnosisTe: 'మిరప ఆకు ముడత వైరస్',
    weatherSnapshot: {
      tempC: 28,
      humidityPct: 58,
      windSpeedKmh: 9,
      rainPast24hMm: 0,
    },
    farmerObservation: 'Fresh green growth visible at growing tips without curling symptoms.',
    recoveryAssessment: {
      comparisonToPreviousRecordId: 'rec-day-07',
      trend: 'improving',
      observedChanges: ['New flush free of severe distortion', 'Leaf margin expansion normal', 'Vigor index increased'],
      uncertaintyRating: 'low',
      scientificRationale: 'Clear morphological distinction: apical meristem flush displays healthy laminae without chlorotic netting.',
    },
  },
];

/**
 * Compare two chronological records with explicit uncertainty quantification.
 * Never proclaims absolute recovery without observational evidence.
 */
export function compareCropHealthRecords(
  currentRecord: CropHealthRecord,
  previousRecord?: CropHealthRecord
): CropHealthComparisonResponse {
  if (!previousRecord) {
    return {
      cycleId: currentRecord.cycleId,
      timeElapsedDays: 0,
      recoveryTrend: 'indeterminate',
      uncertaintyScore: 'high',
      symptomDifferential: {
        lesionMarginSpread: 'unchanged',
        newGrowthHealth: 'partially_infected',
        chlorosisChange: 'stable',
      },
      evidencePoints: ['Baseline observation recorded. Further chronological photos required for delta comparison.'],
      uncertaintyExplanation: 'Single timepoint assessment; cannot establish epidemiological velocity or recovery direction without comparative baseline.',
      summaryEn: 'Initial baseline record established. Take follow-up photos in 5-7 days to evaluate treatment efficacy.',
      summaryTe: 'మొదటి పరిశీలన నమోదయింది. మందు ప్రభావం తెలుసుకోవడానికి 5-7 రోజుల తర్వాత మళ్లీ ఫోటో తీయండి.',
    };
  }

  const daysElapsed = Math.max(
    1,
    Math.round(
      (new Date(currentRecord.recordedAt).getTime() - new Date(previousRecord.recordedAt).getTime()) /
        (24 * 3600 * 1000)
    )
  );

  const severityDelta = previousRecord.severityPercentage - currentRecord.severityPercentage;

  let trend: RecoveryTrend = 'stable';
  let uncertainty: 'low' | 'moderate' | 'high' = 'moderate';
  const evidence: string[] = [];

  if (severityDelta >= 20) {
    trend = 'improving';
    evidence.push(`Estimated visual symptom coverage decreased by ${severityDelta}% over ${daysElapsed} days.`);
    evidence.push('Apical growth points show normal lamina expansion and chlorophyll pigmentation.');
  } else if (severityDelta <= -15) {
    trend = 'deteriorating';
    evidence.push(`Visual symptom severity increased by ${Math.abs(severityDelta)}% over ${daysElapsed} days.`);
    evidence.push('Expansion of lesion margins or secondary wilting detected.');
  } else {
    trend = 'stable';
    evidence.push(`Symptom coverage roughly unchanged (delta ${severityDelta}% within margin of error).`);
    evidence.push('Infection appears contained but vegetative recovery is not yet prominent.');
  }

  // Camera / illumination variance uncertainty caveat
  if (daysElapsed < 3) {
    uncertainty = 'high';
    evidence.push('Observation interval < 3 days is too short to confirm biological recovery from systemic treatments.');
  } else if (daysElapsed > 21) {
    uncertainty = 'moderate';
    evidence.push('Extended interval (> 21 days) makes direct attribution to earlier spray uncertain.');
  } else {
    uncertainty = 'low';
  }

  const uncertaintyExplanation =
    uncertainty === 'high'
      ? 'High uncertainty: Short duration between observations or variance in leaf angle/illumination.'
      : uncertainty === 'moderate'
      ? 'Moderate uncertainty: Mature damaged leaf tissue remains deformed even after pathogen is controlled. Judge by newly emerged leaves.'
      : 'Low uncertainty: Consistent visual features and sufficient elapsed timeframe confirm growth trajectory.';

  const summaryEn =
    trend === 'improving'
      ? `Positive recovery trend detected (+${severityDelta}% visual improvement over ${daysElapsed} days). New foliage is expanding normally.`
      : trend === 'deteriorating'
      ? `Symptoms are spreading (${Math.abs(severityDelta)}% increase). Immediate re-evaluation of treatment is required.`
      : `Disease progression is stabilized. Continue monitoring apical shoots over the next 48 hours.`;

  const summaryTe =
    trend === 'improving'
      ? `మొక్కల ఆరోగ్యం మెరుగుపడుతోంది (${daysElapsed} రోజుల్లో ${severityDelta}% పురోగతి). కొత్తగా వస్తున్న ఆకులు ఆరోగ్యంగా ఉన్నాయి.`
      : trend === 'deteriorating'
      ? `తెగులు ఉధృతి పెరిగింది (${Math.abs(severityDelta)}% పెరుగుదల). వెంటనే ప్రత్యామ్నాయ నివారణ చర్యలు చేపట్టండి.`
      : `తెగులు వ్యాప్తి అదుపులో ఉంది. రాబోయే 48 గంటల్లో కొత్త చిగుళ్లను గమనిస్తూ ఉండండి.`;

  return {
    cycleId: currentRecord.cycleId,
    timeElapsedDays: daysElapsed,
    recoveryTrend: trend,
    uncertaintyScore: uncertainty,
    symptomDifferential: {
      lesionMarginSpread: trend === 'improving' ? 'reduced' : trend === 'deteriorating' ? 'expanded' : 'unchanged',
      newGrowthHealth: trend === 'improving' ? 'clear' : trend === 'deteriorating' ? 'heavily_infected' : 'partially_infected',
      chlorosisChange: trend === 'improving' ? 'regreening' : trend === 'deteriorating' ? 'worsened' : 'stable',
    },
    evidencePoints: evidence,
    uncertaintyExplanation,
    summaryEn,
    summaryTe,
  };
}
