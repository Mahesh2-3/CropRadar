import { ResistanceAuditRequest, ResistanceAuditResponse } from '@/types/api';
import { findPesticideById, VERIFIED_PESTICIDES } from '@/config/pesticide-registry';
import { MOA_REGISTRY, getRecommendedRotationPartners } from '@/config/irac-frac-matrix';

// In-memory application log per cropCycleId
interface LoggedApplication {
  cycleId: string;
  productId: string;
  tradeName: string;
  moaCode: string;
  appliedDateIso: string;
}

const HISTORICAL_APPLICATIONS: LoggedApplication[] = [
  {
    cycleId: 'cycle-chilli-kharif-2026',
    productId: 'cibrc-azoxy-difen-001',
    tradeName: 'Amistar Top',
    moaCode: '11 + 3',
    appliedDateIso: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
  },
  {
    cycleId: 'cycle-chilli-kharif-2026',
    productId: 'cibrc-azoxy-difen-001',
    tradeName: 'Amistar Top',
    moaCode: '11 + 3',
    appliedDateIso: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
];

/**
 * Audits a planned pesticide application against the field's chemical history.
 * Flags repeated usage of the same Mode of Action (MoA) to prevent population resistance selection.
 */
export function auditResistanceRisk(req: ResistanceAuditRequest): ResistanceAuditResponse {
  const { cycleId, plannedProductId } = req;

  const targetProduct = findPesticideById(plannedProductId);
  if (!targetProduct) {
    throw new Error(`Target pesticide '${plannedProductId}' not found in registry.`);
  }

  const targetMoa = targetProduct.iracCode || targetProduct.fracCode || 'Unknown';
  const moaDef = MOA_REGISTRY[targetMoa];
  const maxAllowedConsecutive = moaDef?.maxConsecutiveApplications ?? 2;

  // Retrieve past history for this cycle
  const cycleHistory = HISTORICAL_APPLICATIONS.filter((h) => h.cycleId === cycleId).sort(
    (a, b) => new Date(b.appliedDateIso).getTime() - new Date(a.appliedDateIso).getTime()
  );

  // Count consecutive uses of this MoA from most recent backwards
  let consecutiveCount = 0;
  for (const record of cycleHistory) {
    if (record.moaCode === targetMoa) {
      consecutiveCount++;
    } else {
      break;
    }
  }

  let riskLevel: 'SAFE' | 'WARNING_REPEAT_MOA' | 'CRITICAL_CONSECUTIVE_RISK' = 'SAFE';
  let warningNoticeEn = `Safe rotation. MoA group ${targetMoa} complies with IPM resistance guidelines.`;
  let warningNoticeTe = `సురక్షితమైన రొటేషన్. గ్రూప్ ${targetMoa} నిబంధనలకు అనుగుణంగా ఉంది.`;
  let approved = true;

  if (consecutiveCount >= maxAllowedConsecutive) {
    riskLevel = 'CRITICAL_CONSECUTIVE_RISK';
    approved = false;
    warningNoticeEn = `CRITICAL RESISTANCE RISK: MoA Group ${targetMoa} has been applied ${consecutiveCount} consecutive times in this cycle. Applying it again applies extreme selection pressure, rapidly multiplying pre-existing resistant biotypes in the pathogen population. Rotate immediately to an alternative group!`;
    warningNoticeTe = `తీవ్రమైన రెసిస్టెన్స్ ప్రమాదం: గ్రూప్ ${targetMoa} మందు వరుసగా ${consecutiveCount} సార్లు వాడబడింది. మళ్లీ వాడితే తెగుళ్లు ఈ మందుకు లొంగవు. వెంటనే వేరే గ్రూప్ మందును ఎంపిక చేసుకోండి!`;
  } else if (consecutiveCount > 0) {
    riskLevel = 'WARNING_REPEAT_MOA';
    warningNoticeEn = `WARNING: MoA Group ${targetMoa} was applied in the previous spray. Maximum recommended consecutive sprays is ${maxAllowedConsecutive}. Plan an alternate MoA for the subsequent spray.`;
    warningNoticeTe = `హెచ్చరిక: ఈ గ్రూప్ ${targetMoa} మందు ఇంతకుముందు కూడా వాడబడింది. గరిష్టంగా ${maxAllowedConsecutive} సార్లే వాడవచ్చు. తదుపరి స్ప్రేకి వేరే గ్రూప్ మందు వాడాలి.`;
  }

  // Find recommended alternative products that have a DIFFERENT MoA
  const category = targetProduct.targetPathogenCategory === 'pest' ? 'insecticide' : 'fungicide';
  const alternativeMoAs = getRecommendedRotationPartners(targetMoa, category);

  const recommendedAlternatives = VERIFIED_PESTICIDES.filter((p) => {
    const pMoa = p.iracCode || p.fracCode || '';
    return alternativeMoAs.includes(pMoa);
  }).map((p) => ({
    productId: p.productId,
    tradeName: p.tradeName,
    alternativeMoaGroup: p.iracCode || p.fracCode || 'Multi-site',
  }));

  return {
    approved,
    riskLevel,
    targetProduct: {
      tradeName: targetProduct.tradeName,
      moaGroup: targetMoa,
    },
    historicalApplications: cycleHistory.map((h) => ({
      applicationDate: h.appliedDateIso,
      tradeName: h.tradeName,
      moaGroup: h.moaCode,
    })),
    consecutiveUsesOfSameMoA: consecutiveCount,
    warningNoticeEn,
    warningNoticeTe,
    recommendedAlternatives,
  };
}
