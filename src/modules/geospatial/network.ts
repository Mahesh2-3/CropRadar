import { DiseaseReport, OutbreakSeverity, ReportVerificationStatus, AlertRadiusKm, PathogenCategory } from '@/types/models';
import { NearbyOutbreakItem, OutbreakQueryResponse } from '@/types/api';
import { FarmerNotification } from '@/types/chat';
import { calculateHaversineDistanceKm, fuzzCoordinatesToGrid } from '@/lib/geo/haversine';
import { encodeGeohash, getGeohashNeighbors } from '@/lib/geo/geohash';
import { DISEASE_TRANSLATIONS, CROP_TRANSLATIONS } from '@/config/agronomic-rules';

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
  const trans = DISEASE_TRANSLATIONS[report.diseaseName];
  if (trans?.measuresEn && trans?.measuresTe) {
    return {
      precautionEn: trans.measuresEn,
      precautionTe: trans.measuresTe,
    };
  }

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

// In-memory community notifications store for all farmers
export const COMMUNITY_NOTIFICATIONS: FarmerNotification[] = [];

export function getCommunityNotifications(): FarmerNotification[] {
  return [...COMMUNITY_NOTIFICATIONS];
}

export function markCommunityNotificationAsRead(id: string): boolean {
  const notif = COMMUNITY_NOTIFICATIONS.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
    return true;
  }
  return false;
}

export interface BroadcastOutbreakParams {
  reporterId?: string;
  crop: string;
  cropTe?: string;
  diseaseName: string;
  diseaseNameTe?: string;
  pathogenType?: PathogenCategory;
  severity?: OutbreakSeverity;
  latitude: number;
  longitude: number;
  areaName?: string;
  district?: string;
  customPrecautionsEn?: string;
  customPrecautionsTe?: string;
}

export interface BroadcastOutbreakResult {
  outbreakId: string;
  report: DiseaseReport;
  radiusKm: number;
  notifiedFarmersCount: number;
  surroundingFarmers: Array<{
    name: string;
    village: string;
    distanceKm: number;
    notifiedAt: string;
  }>;
  precautionsEn: string;
  precautionsTe: string;
  notifications: FarmerNotification[];
  messageEn: string;
  messageTe: string;
}

/**
 * Automatically raise an active disease outbreak when a farmer mentions
 * or has a diagnosed crop disease, calculate surrounding farmers within
 * 5 km radius, and send notifications with immediate preventive measures.
 */
export function broadcastDiseaseOutbreakToSurroundingFarmers(
  params: BroadcastOutbreakParams
): BroadcastOutbreakResult {
  const {
    reporterId = 'current-farmer',
    crop,
    diseaseName,
    pathogenType = 'fungal',
    severity = 'severe',
    latitude,
    longitude,
    areaName,
    district = 'Guntur',
    customPrecautionsEn,
    customPrecautionsTe,
  } = params;

  const fuzzed = fuzzCoordinatesToGrid(latitude, longitude);
  const geohash = encodeGeohash(fuzzed.latitude, fuzzed.longitude, 6);
  const outbreakId = `outbreak-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const trans = DISEASE_TRANSLATIONS[diseaseName];
  const cropTe = params.cropTe || CROP_TRANSLATIONS[crop]?.te || crop;
  const diseaseNameTe = params.diseaseNameTe || trans?.te || diseaseName;

  // Active verified outbreak report
  const report: DiseaseReport = {
    reportId: outbreakId,
    anonymousReporterId: `farmer-${reporterId.slice(0, 8)}`,
    crop,
    cropTe,
    diseaseName,
    diseaseNameTe,
    pathogenType,
    severity,
    verificationStatus: 'verified', // Automatically raised & verified
    verifiedAt: new Date().toISOString(),
    verifiedByAgronomist: true,
    verifierName: 'Crop Radar Automatic Outbreak Network',
    verifierNotes: `Automatic 5 km disease outbreak triggered from farmer consultation in ${district}.`,
    approximateLocation: {
      latitude: fuzzed.latitude,
      longitude: fuzzed.longitude,
      geohash,
      areaName: areaName || `${district} Farm Cluster (5.0 km radius)`,
      district,
    },
    reportedAt: new Date().toISOString(),
  };

  SEED_DISEASE_REPORTS.unshift(report);

  // Precautions & Preventive Measures
  const defaultPrecautions = getReportPrecautions(report);
  const precautionsEn = customPrecautionsEn || defaultPrecautions.precautionEn;
  const precautionsTe = customPrecautionsTe || defaultPrecautions.precautionTe;

  // Compute realistic surrounding farmers positioned within 5 km of the farmer's coordinates
  const surroundingOffsets = [
    { name: 'Ramesh Farm (East Plot)', nameTe: 'రమేష్ వ్యవసాయ క్షేత్రం (తూర్పు గట్టు)', village: 'East Cluster', dLat: 0.010, dLng: 0.009 },
    { name: 'Koteswara Rao (Canal Side)', nameTe: 'కోటేశ్వరరావు చేను (కాలువ గట్టు)', village: 'Canal Belt', dLat: 0.003, dLng: 0.017 },
    { name: 'Sivaiah (South Plot)', nameTe: 'శివయ్య తోట (దక్షిణ విభాగం)', village: 'South Farmlands', dLat: -0.013, dLng: 0.014 },
    { name: 'Venkateswarlu (Green Acres)', nameTe: 'వెంకటేశ్వర్లు పొలం (పశ్చిమ చేను)', village: 'West Fields', dLat: -0.019, dLng: -0.015 },
    { name: 'Appa Rao (Bypass Cluster)', nameTe: 'అప్పారావు మడి (బైపాస్ జోన్)', village: 'Bypass Farmlands', dLat: -0.004, dLng: -0.026 },
    { name: 'Subba Rao (North Boundary)', nameTe: 'సుబ్బారావు చేను (ఉత్తర సరిహద్దు)', village: 'North Colony', dLat: 0.021, dLng: -0.018 },
  ];

  const surroundingFarmers: Array<{
    name: string;
    village: string;
    distanceKm: number;
    notifiedAt: string;
  }> = [];

  const createdNotifications: FarmerNotification[] = [];
  const nowIso = new Date().toISOString();

  // Evaluate surrounding farmers within 5 km
  for (const offset of surroundingOffsets) {
    const fLat = latitude + offset.dLat;
    const fLng = longitude + offset.dLng;
    const distKm = calculateHaversineDistanceKm(latitude, longitude, fLat, fLng);

    // Strictly within 5 km radius
    if (distKm <= 5.0) {
      const roundedDist = Math.round(distKm * 10) / 10;
      surroundingFarmers.push({
        name: offset.name,
        village: offset.village,
        distanceKm: roundedDist,
        notifiedAt: nowIso,
      });

      const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const notif: FarmerNotification = {
        id: notifId,
        type: 'verified-outbreak',
        reportId: outbreakId,
        titleEn: `⚠️ 5 km Disease Outbreak Alert: ${diseaseName}`,
        titleTe: `⚠️ 5 కి.మీ తెగులు వ్యాప్తి హెచ్చరిక: ${diseaseNameTe}`,
        messageEn: `A disease outbreak of '${diseaseName}' in ${crop} was confirmed about ${roundedDist} km from your farm near ${offset.village}. Take immediate preventive measures!`,
        messageTe: `మీ పొలానికి సుమారు ${roundedDist} కి.మీ దూరంలో (${offset.village}) ${cropTe} పంటలో '${diseaseNameTe}' తెగులు వ్యాప్తి నమోదైంది. వెంటనే రక్షణ చర్యలు చేపట్టండి!`,
        crop,
        cropTe,
        diseaseName,
        diseaseNameTe,
        severity,
        distanceKm: roundedDist,
        recommendedActionEn: precautionsEn,
        recommendedActionTe: precautionsTe,
        createdAt: nowIso,
        read: false,
      };

      createdNotifications.push(notif);
      COMMUNITY_NOTIFICATIONS.unshift(notif);
    }
  }

  // Also create a notification for the active farmer node so it appears in the NotificationCenter
  const selfNotifId = `notif-self-${Date.now()}`;
  const selfNotif: FarmerNotification = {
    id: selfNotifId,
    type: 'verified-outbreak',
    reportId: outbreakId,
    titleEn: `⚠️ Outbreak Broadcast Active: ${diseaseName}`,
    titleTe: `⚠️ తెగులు వ్యాప్తి హెచ్చరిక జారీ చేయబడింది: ${diseaseNameTe}`,
    messageEn: `Your report of '${diseaseName}' in ${crop} has been broadcast to ${surroundingFarmers.length} neighboring farmers within 5 km of your location.`,
    messageTe: `మీ ${cropTe} పంటలో '${diseaseNameTe}' తెగులు వివరాలు మీ చుట్టూ 5 కి.మీ పరిధిలోని ${surroundingFarmers.length} మంది సమీప రైతులకు హెచ్చరికగా పంపబడ్డాయి.`,
    crop,
    cropTe,
    diseaseName,
    diseaseNameTe,
    severity,
    distanceKm: 0.1,
    recommendedActionEn: precautionsEn,
    recommendedActionTe: precautionsTe,
    createdAt: nowIso,
    read: false,
  };
  COMMUNITY_NOTIFICATIONS.unshift(selfNotif);

  const messageEn = `A 5 km disease outbreak for '${diseaseName}' in ${crop} has been raised. ${surroundingFarmers.length} surrounding farmers have been notified with safety precautions.`;
  const messageTe = `మీ ${cropTe} పంటలో '${diseaseNameTe}' తెగులు వ్యాప్తి నమోదు చేయబడింది. మీ చుట్టూ 5 కి.మీ పరిధిలోని ${surroundingFarmers.length} మంది సమీప రైతులకు తక్షణ హెచ్చరిక మరియు నివారణ చర్యలు పంపబడ్డాయి.`;

  return {
    outbreakId,
    report,
    radiusKm: 5.0,
    notifiedFarmersCount: surroundingFarmers.length,
    surroundingFarmers,
    precautionsEn,
    precautionsTe,
    notifications: createdNotifications,
    messageEn,
    messageTe,
  };
}
