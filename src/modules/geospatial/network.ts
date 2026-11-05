import { DiseaseReport, OutbreakSeverity, ReportVerificationStatus, AlertRadiusKm } from '@/types/models';
import { NearbyOutbreakItem, OutbreakQueryResponse } from '@/types/api';
import { calculateHaversineDistanceKm, fuzzCoordinatesToGrid } from '@/lib/geo/haversine';
import { encodeGeohash, getGeohashNeighbors } from '@/lib/geo/geohash';
import { DISEASE_TRANSLATIONS } from '@/config/agronomic-rules';

/**
 * In-memory / Firestore seed database for prototype demonstrating
 * 5km geospatial outbreak alerts and agronomist verification workflow.
 */
let SEED_DISEASE_REPORTS: DiseaseReport[] = [
  {
    reportId: 'rep-chilli-curl-001',
    anonymousReporterId: 'anon-farm-482',
    crop: 'Chilli',
    cropTe: 'మిరప',
    diseaseName: 'Chilli Leaf Curl Virus',
    diseaseNameTe: 'మిరప ఆకు ముడత వైరస్',
    pathogenType: 'viral',
    severity: 'severe',
    verificationStatus: 'verified',
    verifiedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    verifierName: 'Dr. K. Srinivas (Agricultural Officer, Guntur)',
    verifierNotes: 'Whitefly transmission confirmed in multiple adjacent chilli plots.',
    approximateLocation: {
      latitude: 16.512,
      longitude: 80.645,
      geohash: encodeGeohash(16.512, 80.645, 6),
      areaName: 'Guntur Rural (5.0 km radius)',
      district: 'Guntur',
    },
    reportedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    verifiedByAgronomist: true,
  },
  {
    reportId: 'rep-paddy-blast-003',
    anonymousReporterId: 'anon-farm-881',
    crop: 'Paddy',
    cropTe: 'వరి',
    diseaseName: 'Paddy Blast',
    diseaseNameTe: 'వరి అగ్గితెగులు',
    pathogenType: 'fungal',
    severity: 'severe',
    verificationStatus: 'verified',
    verifiedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    verifierName: 'Agricultural Extension Officer (Mangalagiri)',
    verifierNotes: 'High humidity accelerated blast conidial dispersal.',
    approximateLocation: {
      latitude: 16.495,
      longitude: 80.655,
      geohash: encodeGeohash(16.495, 80.655, 6),
      areaName: 'Mangalagiri Lowlands',
      district: 'Guntur',
    },
    reportedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    verifiedByAgronomist: true,
  },
  {
    reportId: 'rep-pending-bacterial-005',
    anonymousReporterId: 'anon-farm-102',
    crop: 'Tomato',
    cropTe: 'టమోటా',
    diseaseName: 'Bacterial Leaf Spot',
    diseaseNameTe: 'బాక్టీరియా ఆకుమచ్చ తెగులు',
    pathogenType: 'bacterial',
    severity: 'moderate',
    verificationStatus: 'pending',
    approximateLocation: {
      latitude: 16.52,
      longitude: 80.63,
      geohash: encodeGeohash(16.52, 80.63, 6),
      areaName: 'Prathipadu Belt',
      district: 'Guntur',
    },
    reportedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    verifiedByAgronomist: false,
  },
];

// Deduplication log tracking sent alerts: key = `farmerId_disease_crop_week`
const DISPATCHED_ALERTS_SET = new Set<string>();

/**
 * Query ONLY verified outbreaks strictly within farmer's configured radiusKm
 */
export function queryVerifiedOutbreaks(
  userLat: number,
  userLng: number,
  radiusKm: number = 5.0,
  cropFilter?: string,
  reports: DiseaseReport[] = SEED_DISEASE_REPORTS
): OutbreakQueryResponse {
  const matchingReports: NearbyOutbreakItem[] = [];

  for (const report of reports) {
    // STRICT RULE: Only verified reports trigger public outbreak notifications
    if (report.verificationStatus !== 'verified') {
      continue;
    }

    if (cropFilter && cropFilter !== 'All' && report.crop.toLowerCase() !== cropFilter.toLowerCase()) {
      continue;
    }

    const distKm = calculateHaversineDistanceKm(
      userLat,
      userLng,
      report.approximateLocation.latitude,
      report.approximateLocation.longitude
    );

    // Filter strictly within farmer's chosen radius
    if (distKm <= radiusKm) {
      const daysAgo = Math.max(
        0,
        Math.round((Date.now() - new Date(report.reportedAt).getTime()) / (24 * 3600 * 1000))
      );

      const trans = DISEASE_TRANSLATIONS[report.diseaseName];
      const { precautionEn, precautionTe } = getReportPrecautions(report);

      matchingReports.push({
        reportId: report.reportId,
        crop: report.crop,
        cropTe: report.cropTe || report.crop,
        diseaseNameEn: report.diseaseName,
        diseaseNameTe: report.diseaseNameTe || trans?.te || report.diseaseName,
        distanceKm: distKm,
        severity: report.severity,
        verificationStatus: report.verificationStatus,
        reportedDaysAgo: daysAgo,
        reportedAtIso: report.reportedAt,
        approximateLocation: report.approximateLocation,
        recommendedPrecautionEn: precautionEn,
        recommendedPrecautionTe: precautionTe,
      });
    }
  }

  // Sort by distance (closest first)
  matchingReports.sort((a, b) => a.distanceKm - b.distanceKm);

  let threatLevel: 'low' | 'moderate' | 'critical' = 'low';
  if (matchingReports.some((r) => r.severity === 'severe' && r.distanceKm < 3.0)) {
    threatLevel = 'critical';
  } else if (matchingReports.length > 0) {
    threatLevel = 'moderate';
  }

  return {
    queryCenter: { latitude: userLat, longitude: userLng },
    radiusKm,
    totalNearbyOutbreaks: matchingReports.length,
    threatLevel,
    nearbyReports: matchingReports,
  };
}

export const queryNearbyOutbreaks = queryVerifiedOutbreaks;

function getReportPrecautions(report: DiseaseReport) {
  if (report.pathogenType === 'fungal') {
    return {
      precautionEn: 'Scout nearby plants for matching symptoms, remove heavily infected debris safely, and avoid moving plant material between fields. Ask an agriculture officer before spraying.',
      precautionTe: 'సమీప మొక్కల్లో ఇలాంటి లక్షణాలు ఉన్నాయో పరిశీలించండి. తీవ్రంగా సోకిన అవశేషాలను సురక్షితంగా తొలగించి పొలాల మధ్యకు మొక్కల భాగాలను తరలించవద్దు. పిచికారీకి ముందు వ్యవసాయ అధికారిని సంప్రదించండి.',
    };
  }
  if (report.pathogenType === 'bacterial') {
    return {
      precautionEn: 'Inspect nearby plants, avoid working in wet foliage, and clean tools between plots. Confirm the cause before applying any treatment.',
      precautionTe: 'సమీప మొక్కలను పరిశీలించండి. తడిగా ఉన్న ఆకుల మధ్య పని చేయకుండా పొలాల మధ్య పనిముట్లను శుభ్రం చేయండి. చికిత్సకు ముందు కారణాన్ని నిర్ధారించండి.',
    };
  }
  if (report.pathogenType === 'viral' || report.pathogenType === 'pest') {
    return {
      precautionEn: 'Scout the crop and leaf undersides for symptoms or insect vectors. Avoid moving affected plants and ask an agriculture officer about crop-registered control options.',
      precautionTe: 'పంటను, ఆకుల అడుగుభాగాన్ని లక్షణాలు లేదా పురుగుల కోసం పరిశీలించండి. సోకిన మొక్కలను తరలించకుండా, పంటకు నమోదు చేసిన నియంత్రణ పద్ధతుల కోసం వ్యవసాయ అధికారిని సంప్రదించండి.',
    };
  }
  return {
    precautionEn: 'Inspect nearby plants for matching symptoms and confirm the cause before changing irrigation or applying treatment.',
    precautionTe: 'సమీప మొక్కల్లో ఇలాంటి లక్షణాలు ఉన్నాయో పరిశీలించండి. నీటి పారుదల మార్చే ముందు లేదా చికిత్స చేసే ముందు కారణాన్ని నిర్ధారించండి.',
  };
}

/**
 * Retrieve all pending reports awaiting agronomist review
 */
export function getPendingDiseaseReports(): DiseaseReport[] {
  return SEED_DISEASE_REPORTS.filter((r) => r.verificationStatus === 'pending');
}

/**
 * Retrieve all reports (verified and pending)
 */
export function getAllDiseaseReports(): DiseaseReport[] {
  return [...SEED_DISEASE_REPORTS];
}

/**
 * Verify or Reject a disease report (Agronomist Action)
 */
export function verifyDiseaseReport(
  reportId: string,
  approved: boolean,
  verifierName: string,
  verifierNotes?: string
): { success: boolean; report?: DiseaseReport; message: string } {
  const report = SEED_DISEASE_REPORTS.find((r) => r.reportId === reportId);
  if (!report) {
    return { success: false, message: 'Report ID not found' };
  }

  report.verificationStatus = approved ? 'verified' : 'rejected';
  report.verifiedByAgronomist = approved;
  report.verifiedAt = new Date().toISOString();
  report.verifierName = verifierName || 'Authorized Agronomist';
  report.verifierNotes = verifierNotes || (approved ? 'Visual & field symptoms confirmed.' : 'Insufficient evidence of outbreak.');

  return {
    success: true,
    report,
    message: approved
      ? `Report verified. Disease alert is now active for eligible farmers within proximity.`
      : `Report rejected. No community alerts dispatched.`,
  };
}

/**
 * Submit a new disease report with automatic location fuzzing and geohashing
 * STRICT RULE: Starts as 'pending' verification!
 */
export function submitDiseaseReport(
  reporterId: string,
  crop: string,
  diseaseName: string,
  pathogenType: any,
  severity: OutbreakSeverity,
  latitude: number,
  longitude: number,
  areaName?: string
): { report: DiseaseReport; isAlertDispatched: boolean; deduplicated: boolean } {
  // Obfuscate coordinates for farmer privacy
  const fuzzed = fuzzCoordinatesToGrid(latitude, longitude);
  const geohash = encodeGeohash(fuzzed.latitude, fuzzed.longitude, 6);

  const trans = DISEASE_TRANSLATIONS[diseaseName];
  const reportId = `rep-${Date.now()}`;

  const newReport: DiseaseReport = {
    reportId,
    anonymousReporterId: `anon-${reporterId.slice(0, 6)}`,
    crop,
    cropTe: trans?.te?.split(' ')[0] || crop,
    diseaseName,
    diseaseNameTe: trans?.te || diseaseName,
    pathogenType,
    severity,
    verificationStatus: 'pending', // Pending by default
    approximateLocation: {
      latitude: fuzzed.latitude,
      longitude: fuzzed.longitude,
      geohash,
      areaName: areaName || 'Nearby Village Plot',
    },
    reportedAt: new Date().toISOString(),
    verifiedByAgronomist: false,
  };

  SEED_DISEASE_REPORTS.unshift(newReport);

  // Return that it is pending verification
  return { report: newReport, isAlertDispatched: false, deduplicated: false };
}
