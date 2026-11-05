import 'server-only';
import { getFirebaseAdminFirestore } from '@/lib/firebase/admin';
import { calculateHaversineDistanceKm, fuzzCoordinatesToGrid } from '@/lib/geo/haversine';
import { encodeGeohash } from '@/lib/geo/geohash';
import { DISEASE_TRANSLATIONS } from '@/config/agronomic-rules';
import { DiseaseReport, OutbreakSeverity, PathogenCategory } from '@/types/models';
import { COMMUNITY_NOTIFICATIONS } from '@/modules/geospatial/network';

const MAX_ALERT_RADIUS_KM = 5;
const REPORT_RETENTION_DAYS = 30;

export interface LocationCoordinateInput {
  latitude: number;
  longitude: number;
  district?: string;
  village?: string;
  mandal?: string;
}

export async function createFarmerReportedDiseaseReport(input: {
  reporterUid: string;
  crop: string;
  diseaseName: string;
  pathogenType: PathogenCategory;
  severity: OutbreakSeverity;
  farmLocation?: LocationCoordinateInput;
}) {
  const { report, exactLocation } = await createDiseaseReport(input, 'pending');
  const notificationResult = await dispatchOutbreakNotifications(
    report,
    input.reporterUid,
    'farmer-reported-outbreak',
    exactLocation
  );
  return { report, ...notificationResult };
}

export async function createAutomatedDiseaseReport(input: {
  reporterUid: string;
  crop: string;
  diseaseName: string;
  pathogenType: PathogenCategory;
  severity: OutbreakSeverity;
  sourceDiagnosisId: string;
  farmLocation?: LocationCoordinateInput;
}) {
  const { report, exactLocation } = await createDiseaseReport(input, 'automated');
  const notificationResult = await dispatchOutbreakNotifications(
    report,
    input.reporterUid,
    'ai-diagnosis-outbreak',
    exactLocation
  );
  return { report, ...notificationResult };
}

async function createDiseaseReport(
  input: {
    reporterUid: string;
    crop: string;
    diseaseName: string;
    pathogenType: PathogenCategory;
    severity: OutbreakSeverity;
    sourceDiagnosisId?: string;
    farmLocation?: LocationCoordinateInput;
  },
  verificationStatus: DiseaseReport['verificationStatus']
): Promise<{ report: DiseaseReport; exactLocation: LocationCoordinateInput }> {
  const db = getFirebaseAdminFirestore();
  const reporterProfileDoc = await db.collection('users').doc(input.reporterUid).get();
  const profileData = reporterProfileDoc.data() || {};

  // Extract coordinates from profile first, then fallback to input.farmLocation
  const extracted = extractCoordinates(profileData) || extractCoordinates(input.farmLocation);
  if (!extracted) {
    throw new Error('FARM_LOCATION_REQUIRED');
  }

  // Ensure reporter profile has farmLocation and locationSetupComplete: true in Firestore
  if (!extractCoordinates(profileData)) {
    try {
      await db.collection('users').doc(input.reporterUid).set(
        {
          farmLocation: {
            latitude: extracted.latitude,
            longitude: extracted.longitude,
            district: extracted.district || 'Andhra Pradesh',
            village: extracted.village || '',
            displayNameEn: `${extracted.village || 'Farm'}, ${extracted.district || 'Andhra Pradesh'}`,
            displayNameTe: `${extracted.village || 'పొలం'}, ${extracted.district || 'ఆంధ్రప్రదేశ్'}`,
          },
          locationSetupComplete: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (saveErr) {
      console.warn('Auto-saving reporter farmLocation failed:', saveErr);
    }
  }

  const fuzzed = fuzzCoordinatesToGrid(extracted.latitude, extracted.longitude);
  const reportRef = db.collection('diseaseReports').doc();
  const translation = DISEASE_TRANSLATIONS[input.diseaseName];
  const cropTe = getTeluguCropName(input.crop);

  const safeDistrict = extracted.district || 'Andhra Pradesh';
  const safeAreaName = extracted.village
    ? `${extracted.village} (approximate)`
    : `${safeDistrict} (approximate)`;

  const report: DiseaseReport = {
    reportId: reportRef.id,
    anonymousReporterId: `farmer-${reportRef.id.slice(-8)}`,
    crop: input.crop,
    cropTe,
    diseaseName: input.diseaseName,
    diseaseNameTe: translation?.te || input.diseaseName,
    pathogenType: input.pathogenType || 'fungal',
    severity: input.severity || 'moderate',
    verificationStatus,
    ...(input.sourceDiagnosisId ? { sourceDiagnosisId: input.sourceDiagnosisId } : {}),
    approximateLocation: {
      latitude: fuzzed.latitude,
      longitude: fuzzed.longitude,
      geohash: encodeGeohash(fuzzed.latitude, fuzzed.longitude, 6),
      areaName: safeAreaName,
      district: safeDistrict,
      ...(extracted.mandal ? { mandal: extracted.mandal } : {}),
    },
    reportedAt: new Date().toISOString(),
    verifiedByAgronomist: verificationStatus === 'verified',
  };

  await reportRef.set(report);
  await reportRef.collection('private').doc('reporter').set({ uid: input.reporterUid });
  return { report, exactLocation: extracted };
}

export async function getStoredDiseaseReports(status?: 'pending' | 'automated' | 'verified' | 'rejected') {
  let query = getFirebaseAdminFirestore().collection('diseaseReports');
  if (status) query = query.where('verificationStatus', '==', status) as typeof query;
  const snapshot = await query.limit(1000).get();
  const cutoff = Date.now() - REPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return snapshot.docs
    .map((document) => ({ ...document.data(), reportId: document.id } as DiseaseReport))
    .filter((report) => {
      const reportedAt = Date.parse(report.reportedAt);
      return Number.isFinite(reportedAt) && reportedAt >= cutoff;
    });
}

export async function verifyStoredDiseaseReport(input: {
  reportId: string;
  approved: boolean;
  verifierName: string;
  verifierNotes?: string;
}) {
  const db = getFirebaseAdminFirestore();
  const reportRef = db.collection('diseaseReports').doc(input.reportId);
  const reportSnapshot = await reportRef.get();
  if (!reportSnapshot.exists) return { success: false, message: 'Report ID not found' };

  const now = new Date().toISOString();
  const report = reportSnapshot.data() as DiseaseReport;
  await reportRef.update({
    verificationStatus: input.approved ? 'verified' : 'rejected',
    verifiedByAgronomist: input.approved,
    verifiedAt: now,
    verifierName: input.verifierName || 'Authorized Agronomist',
    verifierNotes: input.verifierNotes || (input.approved ? 'Field symptoms confirmed.' : 'Insufficient evidence.'),
  });

  if (!input.approved) {
    return { success: true, reportId: input.reportId, notifiedFarmers: 0, message: 'Report rejected. No new alerts sent.' };
  }

  const reporter = await reportRef.collection('private').doc('reporter').get();
  const reporterUidValue = reporter.data()?.uid;
  const reporterUid = typeof reporterUidValue === 'string' ? reporterUidValue : undefined;
  const { notifiedFarmers } = await dispatchOutbreakNotifications(report, reporterUid, 'verified-outbreak');
  return {
    success: true,
    reportId: input.reportId,
    notifiedFarmers,
    message: notifiedFarmers > 0
      ? `Report verified. Nearby farmers within ${MAX_ALERT_RADIUS_KM} km were notified.`
      : `Report verified, but no eligible farmer locations were found within ${MAX_ALERT_RADIUS_KM} km.`,
  };
}

/**
 * Dispatches outbreak notifications to all farmers whose saved farm coordinates
 * in Firestore are within 5 km of the alert origin.
 * Excludes the reporter. Accurately handles distances <= 5.0 km (including ~0.0 km).
 */
export async function dispatchOutbreakNotifications(
  report: DiseaseReport,
  reporterUid: string | undefined,
  notificationType: 'ai-diagnosis-outbreak' | 'farmer-reported-outbreak' | 'verified-outbreak',
  reporterExactLocation?: LocationCoordinateInput
) {
  const db = getFirebaseAdminFirestore();
  const reporterProfile = reporterUid
    ? await db.collection('users').doc(reporterUid).get()
    : null;
  const reporterProfileData = reporterProfile?.data();
  const reporterCoords = extractCoordinates(reporterProfileData);

  // Exact coordinates take precedence for accurate Haversine matching
  const alertOrigin = reporterExactLocation
    ? { latitude: reporterExactLocation.latitude, longitude: reporterExactLocation.longitude }
    : reporterCoords
    ? { latitude: reporterCoords.latitude, longitude: reporterCoords.longitude }
    : { latitude: report.approximateLocation.latitude, longitude: report.approximateLocation.longitude };

  const usersSnapshot = await db.collection('users').get();
  const advice = getPrecaution(report);
  const batches: Array<ReturnType<typeof db.batch>> = [];
  let batch = db.batch();
  let batchWrites = 0;
  let notifiedFarmers = 0;
  let usersWithFarmLocations = 0;
  const now = new Date().toISOString();

  for (const userDoc of usersSnapshot.docs) {
    // Strictly exclude the reporting farmer
    if (reporterUid && userDoc.id === reporterUid) continue;

    const profile = userDoc.data();
    const userCoords = extractCoordinates(profile);
    if (!userCoords) continue;
    usersWithFarmLocations += 1;

    const distanceKm = calculateHaversineDistanceKm(
      userCoords.latitude,
      userCoords.longitude,
      alertOrigin.latitude,
      alertOrigin.longitude
    );

    // Farmers qualify if distance is 5 km or less (including 0.0 km when lat/long are nearly identical)
    if (distanceKm > MAX_ALERT_RADIUS_KM) continue;

    const sanitizedDistance = Math.round(distanceKm * 10) / 10;
    const notificationPayload = {
      id: report.reportId,
      userId: userDoc.id,
      type: notificationType,
      reportId: report.reportId,
      titleEn: getNotificationTitle(report, notificationType, 'en'),
      titleTe: getNotificationTitle(report, notificationType, 'te'),
      messageEn: getNotificationMessage(report, notificationType, sanitizedDistance, 'en'),
      messageTe: getNotificationMessage(report, notificationType, sanitizedDistance, 'te'),
      crop: report.crop || 'Crop',
      cropTe: report.cropTe || report.crop || 'పంట',
      diseaseName: report.diseaseName || 'Disease',
      diseaseNameTe: report.diseaseNameTe || report.diseaseName || 'తెగులు',
      severity: report.severity || 'moderate',
      distanceKm: sanitizedDistance,
      approximateLocation: {
        latitude: report.approximateLocation.latitude,
        longitude: report.approximateLocation.longitude,
        geohash: report.approximateLocation.geohash || '',
        areaName: report.approximateLocation.areaName || 'Nearby area',
        district: report.approximateLocation.district || 'Andhra Pradesh',
      },
      recommendedActionEn: advice.en || '',
      recommendedActionTe: advice.te || '',
      createdAt: now,
      read: false,
    };

    // 1. Write to user subcollection: users/{uid}/notifications/{reportId}
    const userNotificationRef = userDoc.ref.collection('notifications').doc(report.reportId);
    batch.set(userNotificationRef, notificationPayload, { merge: true });
    batchWrites += 1;

    // 2. Also write to root notifications collection: notifications/{uid}_{reportId} for query flexibility
    const rootNotificationRef = db.collection('notifications').doc(`${userDoc.id}_${report.reportId}`);
    batch.set(rootNotificationRef, notificationPayload, { merge: true });
    batchWrites += 1;

    notifiedFarmers += 1;

    // 3. Populate in-memory community notifications store for instant real-time UI availability
    try {
      COMMUNITY_NOTIFICATIONS.unshift({
        id: `notif-${userDoc.id}-${report.reportId}`,
        type: notificationType,
        reportId: report.reportId,
        titleEn: notificationPayload.titleEn,
        titleTe: notificationPayload.titleTe,
        messageEn: notificationPayload.messageEn,
        messageTe: notificationPayload.messageTe,
        crop: notificationPayload.crop,
        cropTe: notificationPayload.cropTe,
        diseaseName: notificationPayload.diseaseName,
        diseaseNameTe: notificationPayload.diseaseNameTe,
        severity: (notificationPayload.severity as OutbreakSeverity) || 'moderate',
        distanceKm: notificationPayload.distanceKm,
        recommendedActionEn: notificationPayload.recommendedActionEn,
        recommendedActionTe: notificationPayload.recommendedActionTe,
        createdAt: now,
        read: false,
      });
    } catch {
      // non-critical
    }

    if (batchWrites >= 450) {
      batches.push(batch);
      batch = db.batch();
      batchWrites = 0;
    }
  }

  if (batchWrites > 0) batches.push(batch);
  for (const pendingBatch of batches) {
    await pendingBatch.commit();
  }

  try {
    await db.collection('diseaseReports').doc(report.reportId).update({
      notificationsSentAt: now,
      notifiedFarmers,
    });
  } catch (updateErr) {
    console.warn('Updating diseaseReport with notificationsSentAt failed:', updateErr);
  }

  return { notifiedFarmers, usersWithFarmLocations };
}

function getNotificationTitle(
  report: DiseaseReport,
  type: 'ai-diagnosis-outbreak' | 'farmer-reported-outbreak' | 'verified-outbreak',
  language: 'en' | 'te'
) {
  if (type === 'verified-outbreak') {
    return language === 'en'
      ? `Verified ${report.crop} disease report nearby`
      : `సమీపంలో ధృవీకరించిన ${report.cropTe} తెగులు నివేదిక`;
  }
  if (type === 'ai-diagnosis-outbreak') {
    return language === 'en'
      ? `Possible ${report.crop} disease detected nearby`
      : `సమీపంలో ${report.cropTe} పంట వ్యాధి లక్షణాలు గుర్తించబడ్డాయి`;
  }
  return language === 'en'
    ? `New ${report.crop} disease report nearby`
    : `సమీపంలో కొత్త ${report.cropTe} పంట వ్యాధి నివేదిక`;
}

function getNotificationMessage(
  report: DiseaseReport,
  type: 'ai-diagnosis-outbreak' | 'farmer-reported-outbreak' | 'verified-outbreak',
  distanceKm: number,
  language: 'en' | 'te'
) {
  const distStr = Number.isFinite(distanceKm) ? distanceKm.toFixed(1) : '0.0';
  if (type === 'verified-outbreak') {
    return language === 'en'
      ? `${report.diseaseName} was verified about ${distStr} km from your farm.`
      : `మీ పొలానికి సుమారు ${distStr} కి.మీ దూరంలో ${report.diseaseNameTe} ధృవీకరించబడింది.`;
  }
  if (type === 'ai-diagnosis-outbreak') {
    return language === 'en'
      ? `An AI-assisted image diagnosis suggested ${report.diseaseName} about ${distStr} km from your farm. This report has not been field-verified.`
      : `మీ పొలానికి సుమారు ${distStr} కి.మీ దూరంలో ${report.diseaseNameTe} ఉండవచ్చని AI చిత్రం విశ్లేషణ సూచించింది. ఈ నివేదిక క్షేత్రస్థాయిలో ధృవీకరించబడలేదు.`;
  }
  return language === 'en'
    ? `A nearby farmer reported ${report.diseaseName} about ${distStr} km from your farm. This report has not been field-verified.`
    : `మీ పొలానికి సుమారు ${distStr} కి.మీ దూరంలో ${report.diseaseNameTe} ఉన్నట్లు సమీప రైతు నివేదించారు. ఈ నివేదిక క్షేత్రస్థాయిలో ధృవీకరించబడలేదు.`;
}

export function getPrecaution(report: DiseaseReport) {
  if (report.pathogenType === 'fungal') {
    return {
      en: 'Scout nearby plants for matching symptoms, remove heavily infected debris safely, avoid moving plant material between fields, and reduce excess moisture. Check verified spray guidance before applying treatment.',
      te: 'సమీప మొక్కల్లో ఇలాంటి లక్షణాలు ఉన్నాయో పరిశీలించండి. తీవ్రంగా సోకిన అవశేషాలను సురక్షితంగా తొలగించి పొలాల మధ్యకు మొక్కల భాగాలను తరలించవద్దు. అధిక తేమను నివారించి, ధృవీకరించిన పిచికారీ మార్గదర్శకాలను పాటించండి.',
    };
  }
  if (report.pathogenType === 'bacterial') {
    return {
      en: 'Inspect nearby plants, avoid working in wet foliage, stop excessive nitrogen fertilization, and clean tools between plots. Confirm symptoms with local agriculture officers.',
      te: 'సమీప మొక్కలను పరిశీలించండి. తడిగా ఉన్న ఆకుల మధ్య పని చేయకుండా, అధిక నత్రజని వాడకాన్ని తగ్గించండి. పొలాల మధ్య పనిముట్లను శుభ్రం చేసి, స్థానిక వ్యవసాయ అధికారుల సూచనలు పాటించండి.',
    };
  }
  if (report.pathogenType === 'viral' || report.pathogenType === 'pest') {
    return {
      en: 'Scout the crop and leaf undersides for symptoms or insect vectors (thrips/whiteflies). Avoid moving affected plants and use sticky traps or safe bio-control options.',
      te: 'పంటను, ఆకుల అడుగుభాగాన్ని తెగులు లేదా రసం పీల్చే పురుగుల (తామర పురుగులు, తెల్ల దోమ) కోసం పరిశీలించండి. సోకిన మొక్కలను తొలగించి, జిగురు అట్టలు లేదా జీవ నియంత్రణ పద్ధతులు ఉపయోగించండి.',
    };
  }
  return {
    en: 'Inspect nearby plants for matching symptoms and confirm the cause with local agriculture guidance before changing irrigation or applying chemical treatments.',
    te: 'సమీప మొక్కల్లో ఇలాంటి లక్షణాలు ఉన్నాయో పరిశీలించండి. నీటి పారుదల మార్చే ముందు లేదా రసాయన చికిత్స చేసే ముందు వ్యవసాయ మార్గదర్శకాలను నిర్ధారించుకోండి.',
  };
}

function getTeluguCropName(crop: string): string {
  const labels: Record<string, string> = {
    Chilli: 'మిరప',
    Paddy: 'వరి',
    Cotton: 'పత్తి',
    Tomato: 'టమాటా',
    Groundnut: 'వేరుశనగ',
  };
  return labels[crop] || crop;
}

export function isCoordinate(value: unknown): value is number {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed);
  }
  return false;
}

/**
 * Robustly extracts geographic coordinates from any document or object structure.
 * Examines all standard and alternative keys:
 * - farmLocation, farm_location, location, coordinates, coords, geo, farm, profile.farmLocation
 * - latitude, _latitude, lat, _lat, latitudeDeg
 * - longitude, _longitude, lng, _lng, lon, _lon, long, _long, longitudeDeg
 * - parses numeric strings as well as numbers.
 */
export function extractCoordinates(data: unknown): LocationCoordinateInput | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, any>;

  const candidateContainers = [
    obj.farmLocation,
    obj.farm_location,
    obj.location,
    obj.coordinates,
    obj.coords,
    obj.geo,
    obj.farm,
    obj.profile?.farmLocation,
    obj.farmerProfile?.farmLocation,
    obj,
  ];

  for (const cand of candidateContainers) {
    if (!cand || typeof cand !== 'object') continue;

    const rawLat = cand.latitude ?? cand._latitude ?? cand.lat ?? cand._lat ?? cand.latitudeDeg;
    const rawLng =
      cand.longitude ??
      cand._longitude ??
      cand.lng ??
      cand._lng ??
      cand.lon ??
      cand._lon ??
      cand.long ??
      cand._long ??
      cand.longitudeDeg;

    const lat =
      typeof rawLat === 'number'
        ? rawLat
        : typeof rawLat === 'string' && rawLat.trim() !== ''
        ? parseFloat(rawLat.trim())
        : NaN;

    const lng =
      typeof rawLng === 'number'
        ? rawLng
        : typeof rawLng === 'string' && rawLng.trim() !== ''
        ? parseFloat(rawLng.trim())
        : NaN;

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      const district =
        (typeof cand.district === 'string' && cand.district.trim()) ||
        (typeof obj.district === 'string' && obj.district.trim()) ||
        undefined;
      const village =
        (typeof cand.village === 'string' && cand.village.trim()) ||
        (typeof obj.village === 'string' && obj.village.trim()) ||
        undefined;
      const mandal =
        (typeof cand.mandal === 'string' && cand.mandal.trim()) ||
        (typeof obj.mandal === 'string' && obj.mandal.trim()) ||
        undefined;

      return {
        latitude: lat,
        longitude: lng,
        district,
        village,
        mandal,
      };
    }
  }

  return null;
}
