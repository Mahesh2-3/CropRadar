import 'server-only';
import { getFirebaseAdminFirestore } from '@/lib/firebase/admin';
import { calculateHaversineDistanceKm, fuzzCoordinatesToGrid } from '@/lib/geo/haversine';
import { encodeGeohash } from '@/lib/geo/geohash';
import { DISEASE_TRANSLATIONS } from '@/config/agronomic-rules';
import { DiseaseReport, OutbreakSeverity, PathogenCategory } from '@/types/models';

const MAX_ALERT_RADIUS_KM = 5;
const REPORT_RETENTION_DAYS = 30;

export async function createPendingDiseaseReport(input: {
  reporterUid: string;
  crop: string;
  diseaseName: string;
  pathogenType: PathogenCategory;
  severity: OutbreakSeverity;
}) {
  const db = getFirebaseAdminFirestore();
  const reporterProfile = await db.collection('users').doc(input.reporterUid).get();
  const farmLocation = reporterProfile.data()?.farmLocation;
  if (
    !reporterProfile.exists ||
    reporterProfile.data()?.locationSetupComplete !== true ||
    !isCoordinate(farmLocation?.latitude) ||
    !isCoordinate(farmLocation?.longitude)
  ) {
    throw new Error('FARM_LOCATION_REQUIRED');
  }

  const fuzzed = fuzzCoordinatesToGrid(farmLocation.latitude, farmLocation.longitude);
  const reportRef = db.collection('diseaseReports').doc();
  const translation = DISEASE_TRANSLATIONS[input.diseaseName];
  const cropTe = getTeluguCropName(input.crop);
  const report: DiseaseReport = {
    reportId: reportRef.id,
    anonymousReporterId: `farmer-${reportRef.id.slice(-8)}`,
    crop: input.crop,
    cropTe,
    diseaseName: input.diseaseName,
    diseaseNameTe: translation?.te || input.diseaseName,
    pathogenType: input.pathogenType,
    severity: input.severity,
    verificationStatus: 'pending',
    approximateLocation: {
      latitude: fuzzed.latitude,
      longitude: fuzzed.longitude,
      geohash: encodeGeohash(fuzzed.latitude, fuzzed.longitude, 6),
      areaName: `${farmLocation.village || farmLocation.district || 'Nearby area'} (approximate)`,
      district: farmLocation.district,
      mandal: farmLocation.mandal,
    },
    reportedAt: new Date().toISOString(),
    verifiedByAgronomist: false,
  };

  await reportRef.set(report);
  await reportRef.collection('private').doc('reporter').set({ uid: input.reporterUid });
  return report;
}

export async function getStoredDiseaseReports(status?: 'pending' | 'verified' | 'rejected') {
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
    return { success: true, reportId: input.reportId, notifiedFarmers: 0, message: 'Report rejected. No alerts sent.' };
  }

  const reporter = await reportRef.collection('private').doc('reporter').get();
  const reporterUid = reporter.data()?.uid;
  const reporterProfile = typeof reporterUid === 'string'
    ? await db.collection('users').doc(reporterUid).get()
    : null;
  const reporterFarmLocation = reporterProfile?.data()?.farmLocation;
  // Use exact coordinates only for private matching; notifications keep the fuzzed location.
  const alertOrigin = isCoordinate(reporterFarmLocation?.latitude) && isCoordinate(reporterFarmLocation?.longitude)
    ? { latitude: reporterFarmLocation.latitude, longitude: reporterFarmLocation.longitude }
    : report.approximateLocation;
  const usersSnapshot = await db.collection('users').get();
  const advice = getPrecaution(report);
  const batches: Array<ReturnType<typeof db.batch>> = [];
  let batch = db.batch();
  let batchWrites = 0;
  let notifiedFarmers = 0;

  for (const userDoc of usersSnapshot.docs) {
    if (userDoc.id === reporterUid) continue;
    const profile = userDoc.data();
    const location = profile.farmLocation;
    if (!isCoordinate(location?.latitude) || !isCoordinate(location?.longitude)) continue;

    const distanceKm = calculateHaversineDistanceKm(
      location.latitude,
      location.longitude,
      alertOrigin.latitude,
      alertOrigin.longitude
    );
    if (distanceKm > MAX_ALERT_RADIUS_KM) continue;

    const notificationRef = userDoc.ref.collection('notifications').doc(input.reportId);
    batch.set(notificationRef, {
      userId: userDoc.id,
      type: 'verified-outbreak',
      reportId: input.reportId,
      titleEn: `Verified ${report.crop} disease report nearby`,
      titleTe: `సమీపంలో ధృవీకరించిన ${report.cropTe} తెగులు నివేదిక`,
      messageEn: `${report.diseaseName} was verified about ${distanceKm.toFixed(1)} km from your farm.`,
      messageTe: `మీ పొలానికి సుమారు ${distanceKm.toFixed(1)} కి.మీ దూరంలో ${report.diseaseNameTe} ధృవీకరించబడింది.`,
      crop: report.crop,
      cropTe: report.cropTe,
      diseaseName: report.diseaseName,
      diseaseNameTe: report.diseaseNameTe,
      severity: report.severity,
      distanceKm: Math.round(distanceKm * 10) / 10,
      approximateLocation: report.approximateLocation,
      recommendedActionEn: advice.en,
      recommendedActionTe: advice.te,
      createdAt: now,
      read: false,
    });
    notifiedFarmers += 1;
    batchWrites += 1;

    if (batchWrites === 450) {
      batches.push(batch);
      batch = db.batch();
      batchWrites = 0;
    }
  }

  if (batchWrites) batches.push(batch);
  for (const pendingBatch of batches) await pendingBatch.commit();

  await reportRef.update({ notificationsSentAt: now, notifiedFarmers });
  return {
    success: true,
    reportId: input.reportId,
    notifiedFarmers,
    message: notifiedFarmers > 0
      ? `Report verified. Nearby farmers within ${MAX_ALERT_RADIUS_KM} km were notified.`
      : `Report verified, but no eligible farmer locations were found within ${MAX_ALERT_RADIUS_KM} km.`,
  };
}

function getPrecaution(report: DiseaseReport) {
  if (report.pathogenType === 'fungal') {
    return {
      en: 'Scout nearby plants for matching symptoms, remove heavily infected debris safely, and avoid moving plant material between fields. Ask a local agriculture officer before spraying.',
      te: 'సమీప మొక్కల్లో ఇలాంటి లక్షణాలు ఉన్నాయో పరిశీలించండి. తీవ్రంగా సోకిన అవశేషాలను సురక్షితంగా తొలగించి పొలాల మధ్యకు మొక్కల భాగాలను తరలించవద్దు. పిచికారీకి ముందు స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి.',
    };
  }
  if (report.pathogenType === 'bacterial') {
    return {
      en: 'Inspect nearby plants, avoid working in wet foliage, and clean tools between plots. Confirm the cause with a local agriculture officer before applying any treatment.',
      te: 'సమీప మొక్కలను పరిశీలించండి. తడిగా ఉన్న ఆకుల మధ్య పని చేయకుండా, పొలాల మధ్య పనిముట్లను శుభ్రం చేయండి. ఏ చికిత్సకైనా ముందు స్థానిక వ్యవసాయ అధికారితో కారణాన్ని నిర్ధారించండి.',
    };
  }
  if (report.pathogenType === 'viral' || report.pathogenType === 'pest') {
    return {
      en: 'Scout the crop and leaf undersides for symptoms or insect vectors. Avoid moving affected plants and ask a local agriculture officer about safe, crop-registered control options.',
      te: 'పంటను, ఆకుల అడుగుభాగాన్ని లక్షణాలు లేదా పురుగుల కోసం పరిశీలించండి. సోకిన మొక్కలను తరలించకుండా, పంటకు నమోదు చేసిన సురక్షిత నియంత్రణ పద్ధతుల కోసం స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి.',
    };
  }
  return {
    en: 'Inspect nearby plants for matching symptoms and confirm the cause with a local agriculture officer before changing irrigation or applying any treatment.',
    te: 'సమీప మొక్కల్లో ఇలాంటి లక్షణాలు ఉన్నాయో పరిశీలించండి. నీటి పారుదల మార్చే ముందు లేదా చికిత్స చేసే ముందు స్థానిక వ్యవసాయ అధికారితో కారణాన్ని నిర్ధారించండి.',
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

function isCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}