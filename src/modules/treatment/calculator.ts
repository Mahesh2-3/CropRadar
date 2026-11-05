import { TreatmentCalculationRequest, TreatmentCalculationResponse } from '@/types/api';
import { findPesticideById } from '@/config/pesticide-registry';
import { MOA_REGISTRY } from '@/config/irac-frac-matrix';

export class TreatmentCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TreatmentCalculationError';
  }
}

/**
 * Deterministic Verified Treatment Calculator
 *
 * CRITICAL SAFETY ARCHITECTURE:
 * Generative AI is NEVER permitted to invent or compute chemical dosages.
 * Dosages are derived strictly from CIBRC registered label rates.
 */
export function calculateVerifiedTreatment(req: TreatmentCalculationRequest): TreatmentCalculationResponse {
  const { productId, cropName, fieldAcreage, knapsackTankVolumeLiters, targetPestOrDisease } = req;

  // 1. Mandatory Input Validation
  if (!productId || typeof productId !== 'string') {
    throw new TreatmentCalculationError('Calculation refused: Valid CIBRC Product ID is required.');
  }

  if (!cropName || typeof cropName !== 'string') {
    throw new TreatmentCalculationError('Calculation refused: Target crop must be specified.');
  }

  if (!fieldAcreage || fieldAcreage <= 0 || isNaN(fieldAcreage)) {
    throw new TreatmentCalculationError('Calculation refused: Field acreage must be a positive number greater than 0.');
  }

  if (!knapsackTankVolumeLiters || knapsackTankVolumeLiters <= 0 || isNaN(knapsackTankVolumeLiters)) {
    throw new TreatmentCalculationError('Calculation refused: Knapsack tank capacity must be a positive volume (typically 15-20L).');
  }

  // 2. Verified Product Lookup
  const product = findPesticideById(productId);
  if (!product) {
    throw new TreatmentCalculationError(`Calculation refused: Product ID '${productId}' is not verified in the CIBRC registry.`);
  }

  // 3. Registered Crop Applicability Verification
  const label = product.registeredLabels.find(
    (l) => l.crop.toLowerCase().trim() === cropName.toLowerCase().trim()
  );

  if (!label) {
    throw new TreatmentCalculationError(
      `SAFETY VIOLATION REFUSAL: '${product.tradeName}' is NOT registered for use on '${cropName}'. Applying unregistered chemicals risks crop phytotoxicity, illegal residues, and export rejection.`
    );
  }

  // 4. Arithmetic Calculation (Deterministic Formulas)
  // Use mean of min/max approved rate per acre
  const dosePerAcreVal = (label.dosagePerAcre.minAmount + label.dosagePerAcre.maxAmount) / 2;
  const unit = label.dosagePerAcre.unit;

  // Total formulation required for the entire field
  const totalFormulation = Math.round(dosePerAcreVal * fieldAcreage * 10) / 10;

  // Total spray water volume required
  const waterPerAcre = label.recommendedWaterVolumeLitersPerAcre;
  const totalWaterRequiredLiters = Math.round(waterPerAcre * fieldAcreage);

  // Number of knapsack spray tanks needed
  const totalTanks = Math.ceil((totalWaterRequiredLiters / knapsackTankVolumeLiters) * 10) / 10;

  // Formulation dosage per individual knapsack tank
  // Formula: (Dose per acre / Water volume per acre) * Tank capacity
  const dosePerTank = Math.round(((dosePerAcreVal / waterPerAcre) * knapsackTankVolumeLiters) * 100) / 100;

  // 5. Transparent Step-by-Step Calculation Breakdown
  const stepByStepArithmetic = [
    `1. Verified Label Rate: ${label.dosagePerAcre.minAmount === label.dosagePerAcre.maxAmount ? label.dosagePerAcre.minAmount : `${label.dosagePerAcre.minAmount}-${label.dosagePerAcre.maxAmount}`} ${unit}/acre in ${waterPerAcre} Liters water.`,
    `2. Total Field Formulation: ${dosePerAcreVal} ${unit}/acre × ${fieldAcreage} acres = ${totalFormulation} ${unit}.`,
    `3. Total Spray Water Required: ${waterPerAcre} L/acre × ${fieldAcreage} acres = ${totalWaterRequiredLiters} Liters.`,
    `4. Number of ${knapsackTankVolumeLiters}L Knapsack Tanks: ${totalWaterRequiredLiters} L ÷ ${knapsackTankVolumeLiters} L/tank = ${totalTanks} tanks.`,
    `5. Exact Product per ${knapsackTankVolumeLiters}L Tank: (${dosePerAcreVal} ${unit} ÷ ${waterPerAcre} L) × ${knapsackTankVolumeLiters} L = ${dosePerTank} ${unit} per tank.`,
  ];

  // 6. Resistance Management Profile
  const moaCode = product.iracCode || product.fracCode || 'Unknown';
  const moaDetails = MOA_REGISTRY[moaCode];

  const rotationAdviceEn = moaDetails
    ? `MoA Group ${moaCode} (${moaDetails.groupName}). Maximum consecutive sprays: ${moaDetails.maxConsecutiveApplications}. Rotate with an alternate group to prevent target-site resistance selection.`
    : `Follow standard IPM rotation practices. Never spray consecutive applications of identical modes of action.`;

  const rotationAdviceTe = moaDetails
    ? `రెసిస్టెన్స్ మేనేజ్మెంట్ గ్రూప్ ${moaCode}. వరుసగా ${moaDetails.maxConsecutiveApplications} సార్ల కంటే ఎక్కువ పిచికారీ చేయవద్దు. తెగుళ్లు/పురుగులు తట్టుకునే శక్తిని పెంచుకోకుండా ఇతర గ్రూపు మందులను మార్చి వాడండి.`
    : `తెగుళ్లు మందులకు అలవాటు పడకుండా గ్రూపులు మార్చి పిచికారీ చేయండి.`;

  return {
    isVerified: true,
    productId: product.productId,
    tradeName: product.tradeName,
    cibrcRegistrationNumber: product.cibrcRegistrationNumber,
    activeIngredients: product.activeIngredients.map((a) => `${a.name} ${a.concentrationPct}% ${a.unit}`),
    registeredCropMatched: true,
    dosageParameters: {
      labelDosePerAcre: `${dosePerAcreVal} ${unit}/acre`,
      fieldAcreage,
      totalFormulationRequired: {
        amount: totalFormulation,
        unit,
      },
      totalWaterVolumeRequiredLiters: totalWaterRequiredLiters,
      knapsackTankCapacityLiters: knapsackTankVolumeLiters,
      totalTanksRequired: totalTanks,
      dosePerKnapsackTank: {
        amount: dosePerTank,
        unit,
      },
      stepByStepArithmetic,
    },
    resistanceProfile: {
      iracOrFracCode: moaCode,
      modeOfAction: moaDetails?.mechanismSummary || 'Chemical crop protection agent',
      rotationAdviceEn,
      rotationAdviceTe,
      consecutiveSprayLimit: moaDetails?.maxConsecutiveApplications || 2,
    },
    safetyCompliance: {
      preHarvestIntervalDays: label.preHarvestIntervalDays,
      reEntryIntervalHours: label.reEntryPeriodHours,
      toxicityColorCode: product.toxicityColorCode,
      mandatoryPpe: product.protectiveEquipment,
      disposalGuidelines: 'Triple rinse empty containers, puncture container, and dispose safely. Never wash spray tanks in village ponds or irrigation canals.',
    },
    weatherRestrictions: product.weatherRestrictions,
  };
}
