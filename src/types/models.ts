export type LanguageCode = 'te' | 'en';

export type PathogenCategory =
  | 'fungal'
  | 'bacterial'
  | 'viral'
  | 'pest'
  | 'nutritional'
  | 'abiotic';

export type SprayWindowStatus = 'OPTIMAL' | 'MARGINAL' | 'PROHIBITED';

export type OutbreakSeverity = 'low' | 'moderate' | 'severe';

export type ReportVerificationStatus = 'pending' | 'verified' | 'rejected';

export type AlertRadiusKm = 1 | 3 | 5 | 10 | 15;

export type RecoveryTrend =
  | 'improving'
  | 'stable'
  | 'deteriorating'
  | 'indeterminate';

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  geohash?: string;
  village?: string;
  mandal?: string;
  district?: string;
  state?: string;
  displayNameEn: string;
  displayNameTe: string;
}

export interface UserProfile {
  uid: string;
  phoneNumber?: string;
  displayName: string;
  preferredLanguage: LanguageCode;
  farmLocation: LocationCoordinate;
  alertRadiusKm: AlertRadiusKm;
  activeCrops: string[];
  fcmToken?: string;
  createdAt: string;
}

export interface Farm {
  farmId: string;
  userId: string;
  name: string;
  location: LocationCoordinate;
  totalAreaAcres: number;
  soilType: 'black' | 'red' | 'alluvial' | 'sandy' | 'clay';
  activeCrops: string[];
  createdAt: string;
}

export interface CropCycle {
  cycleId: string;
  farmId: string;
  userId: string;
  cropName: string;
  variety: string;
  sowingDate: string;
  stage: 'germination' | 'vegetative' | 'flowering' | 'fruiting' | 'maturity';
  status: 'active' | 'harvested' | 'abandoned';
  currentHealthStatus: 'healthy' | 'at_risk' | 'diseased' | 'recovering';
  createdAt: string;
}

export interface PesticideProduct {
  productId: string;
  tradeName: string;
  tradeNameTe?: string;
  activeIngredients: Array<{
    name: string;
    nameTe?: string;
    concentrationPct: number;
    unit: 'SC' | 'EC' | 'WP' | 'WG' | 'SL' | 'FS' | 'SP';
  }>;
  iracCode?: string;
  fracCode?: string;
  cibrcRegistrationNumber: string;
  targetPathogenCategory: PathogenCategory;
  registeredLabels: Array<{
    crop: string;
    cropTe?: string;
    targetPests: string[];
    targetPestsTe?: string[];
    dosagePerAcre: {
      minAmount: number;
      maxAmount: number;
      unit: 'ml' | 'g';
    };
    recommendedWaterVolumeLitersPerAcre: number;
    preHarvestIntervalDays: number;
    reEntryPeriodHours: number;
  }>;
  weatherRestrictions: {
    maxWindSpeedKmh: number;
    rainFreePeriodHours: number;
    maxTemperatureC: number;
  };
  toxicityColorCode: 'green' | 'blue' | 'yellow' | 'red';
  protectiveEquipment: string[];
  protectiveEquipmentTe?: string[];
}

export interface CropHealthRecord {
  recordId: string;
  cycleId: string;
  farmId: string;
  userId: string;
  recordedAt: string;
  imageUrls: string[];
  cropName: string;
  cropNameTe: string;
  visualSymptoms: string[];
  visualSymptomsTe: string[];
  affectedPlantPart: 'leaf' | 'stem' | 'fruit' | 'flower' | 'root' | 'whole';
  severityPercentage: number;
  suspectedDiagnosisEn: string;
  suspectedDiagnosisTe: string;
  weatherSnapshot: {
    tempC: number;
    humidityPct: number;
    windSpeedKmh: number;
    rainPast24hMm: number;
  };
  diagnosisId?: string;
  treatmentGuidanceId?: string;
  treatmentRecorded?: string;
  farmerObservation?: string;
  recoveryAssessment?: {
    comparisonToPreviousRecordId?: string;
    trend: RecoveryTrend;
    observedChanges: string[];
    uncertaintyRating: 'low' | 'moderate' | 'high';
    scientificRationale: string;
  };
}

export interface DiseaseReport {
  reportId: string;
  sourceDiagnosisId?: string;
  anonymousReporterId: string;
  crop: string;
  cropTe: string;
  diseaseName: string;
  diseaseNameTe: string;
  pathogenType: PathogenCategory;
  severity: OutbreakSeverity;
  verificationStatus: ReportVerificationStatus;
  verifiedAt?: string;
  verifierName?: string;
  verifierNotes?: string;
  approximateLocation: {
    latitude: number;
    longitude: number;
    geohash: string;
    areaName?: string;
    district?: string;
    mandal?: string;
  };
  reportedAt: string;
  verifiedByAgronomist: boolean;
}

export interface DiseaseAlert {
  alertId: string;
  reportId: string;
  targetGeohashes: string[];
  crop: string;
  cropTe: string;
  diseaseNameEn: string;
  diseaseNameTe: string;
  distanceKm: number;
  severity: OutbreakSeverity;
  triggeredAt: string;
  notifiedFarmersCount: number;
  precautionsEn: string;
  precautionsTe: string;
}
