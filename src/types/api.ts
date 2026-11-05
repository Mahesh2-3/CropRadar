import {
  LanguageCode,
  PathogenCategory,
  OutbreakSeverity,
  RecoveryTrend,
  SprayWindowStatus,
  ReportVerificationStatus,
  AlertRadiusKm,
  LocationCoordinate,
} from './models';

// ==========================================
// RESISTANCE AUDIT & VOICE TYPES
// ==========================================
export interface ResistanceAuditRequest {
  cycleId: string;
  plannedProductId: string;
}

export interface ResistanceAuditResponse {
  approved: boolean;
  riskLevel: 'SAFE' | 'WARNING_REPEAT_MOA' | 'CRITICAL_CONSECUTIVE_RISK';
  targetProduct: {
    tradeName: string;
    moaGroup: string;
  };
  historicalApplications: Array<{
    applicationDate: string;
    tradeName: string;
    moaGroup: string;
  }>;
  consecutiveUsesOfSameMoA: number;
  warningNoticeEn: string;
  warningNoticeTe: string;
  recommendedAlternatives: Array<{
    productId: string;
    tradeName: string;
    alternativeMoaGroup: string;
  }>;
}

export interface TeluguAssistantRequest {
  audioBase64?: string;
  textTranscript?: string;
  language?: LanguageCode;
  activeContext?: {
    cropName?: string;
    currentDiagnosisId?: string;
    farmLocation?: { latitude: number; longitude: number };
  };
}

export interface TeluguAssistantResponse {
  transcription: string;
  detectedLanguage: LanguageCode;
  intent:
    | 'diagnose'
    | 'treatment_query'
    | 'weather_query'
    | 'outbreak_query'
    | 'general_advice';
  responseTitleTe: string;
  responseTitleEn: string;
  responseBodyTe: string;
  responseBodyEn: string;
  actionableModuleRoute?: string;
  suggestedFollowUpPrompts: Array<{
    textEn: string;
    textTe: string;
  }>;
}

export interface CropHealthComparisonResponse {
  cycleId: string;
  timeElapsedDays: number;
  recoveryTrend: RecoveryTrend;
  uncertaintyScore: 'low' | 'moderate' | 'high';
  symptomDifferential: {
    lesionMarginSpread: 'reduced' | 'unchanged' | 'expanded';
    newGrowthHealth: 'clear' | 'partially_infected' | 'heavily_infected';
    chlorosisChange: 'regreening' | 'stable' | 'worsened';
  };
  evidencePoints: string[];
  uncertaintyExplanation: string;
  summaryEn: string;
  summaryTe: string;
}

// ==========================================
// UNIFIED ASSISTANT API CONTRACTS
// ==========================================
export interface UnifiedAssistantRequest {
  userMessage?: string;
  imageBase64?: string;
  cropName?: string;
  audioBase64?: string;
  language: LanguageCode;
  farmLocation: {
    latitude: number;
    longitude: number;
    displayNameEn?: string;
    displayNameTe?: string;
    district?: string;
    mandal?: string;
    village?: string;
  };
  activeCycleId?: string;
  historyContext?: Array<{
    sender: 'farmer' | 'assistant';
    text: string;
  }>;
}

export type ContextualCardType =
  | 'crop_diagnosis'
  | 'pesticide_treatment'
  | 'weather_spray'
  | 'disease_outbreak_alert'
  | 'crop_history';

export interface UnifiedAssistantResponse {
  textResponse: string;
  textResponseTe?: string;
  textResponseEn?: string;
  spokenText: string;
  spokenTextTe?: string;
  spokenTextEn?: string;
  detectedIntent: ContextualCardType | 'general_agronomy';
  language: LanguageCode;
  requiresCropSelection?: boolean;
  outbreakTriggered?: boolean;
  notificationsCreated?: number;
  card?: {
    type: ContextualCardType;
    data: any;
  };
  suggestedQuickActions?: Array<{
    titleEn: string;
    titleTe: string;
    queryEn: string;
    queryTe: string;
  }>;
}

// ==========================================
// MODULE 1: Crop Diagnosis API Contracts
// ==========================================
export interface CropDiagnosisRequest {
  imageBase64?: string;
  imageUrl?: string;
  cropType?: string;
  growthStage?: string;
  observedSymptoms?: string[];
  language?: LanguageCode;
}

export interface DifferentialDiagnosisItem {
  diseaseNameEn: string;
  diseaseNameTe: string;
  symptomMatchConfidence: number;
  differentiatingFactors: string;
}

export interface CropDiagnosisResponse {
  success: boolean;
  diagnosisId: string;
  timestamp: string;
  crop: string;
  cropTe: string;
  suspectedPathogenCategory: PathogenCategory;
  primaryCandidate: {
    diseaseNameEn: string;
    diseaseNameTe: string;
    scientificName: string;
    symptomMatchConfidence: number;
    visualEvidence: string[];
    visualEvidenceTe?: string[];
    uncertaintyNotice: string;
    uncertaintyNoticeTe?: string;
  };
  differentialDiagnoses: DifferentialDiagnosisItem[];
  visualSeverity: {
    percentageLeafAreaAffected: number;
    classification: 'early' | 'moderate' | 'advanced';
    classificationTe?: string;
  };
  needsAdditionalAngles: boolean;
  requestedAngles?: string[];
  requestedAnglesTe?: string[];
  recommendedActionOverview: {
    culturalAdvice: string;
    culturalAdviceTe?: string;
    biologicalOption?: string;
    biologicalOptionTe?: string;
    chemicalGuidanceRef?: string;
  };
  disclaimer: string;
}

// ==========================================
// MODULE 3: Weather Risk Engine Contracts
// ==========================================
export interface WeatherAssessmentRequest {
  latitude: number;
  longitude: number;
  plannedSprayHourOffset?: number;
}

export interface HourlyForecastItem {
  timeIso: string;
  tempC: number;
  humidityPct: number;
  windSpeedKmh: number;
  rainProbabilityPct: number;
  precipitationMm: number;
  sprayStatus: SprayWindowStatus;
}

export interface WeatherAssessmentResponse {
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
    elevation: number;
  };
  currentConditions: {
    temperatureC: number;
    relativeHumidityPct: number;
    windSpeedKmh: number;
    windDirectionDeg: number;
    precipitationMm: number;
    weatherCode: number;
    recordedAtIso: string;
  };
  spraySuitability: {
    status: SprayWindowStatus;
    summaryEn: string;
    summaryTe: string;
    rulesEvaluated: {
      windCheck: { passed: boolean; message: string; messageTe?: string; value: number; limit: number };
      rainCheck: { passed: boolean; message: string; messageTe?: string; rainProbNext4h: number; threshold: number };
      temperatureCheck: { passed: boolean; message: string; messageTe?: string; value: number; min: number; max: number };
      humidityCheck: { passed: boolean; message: string; messageTe?: string; value: number; min: number; max: number };
      inversionCheck: { passed: boolean; message: string; messageTe?: string };
    };
  };
  nextSafeSprayWindow?: {
    startIso: string;
    endIso: string;
    durationHours: number;
    conditionsSummary: string;
    conditionsSummaryTe?: string;
  };
  hourlyForecast: HourlyForecastItem[];
}

// ==========================================
// MODULE 4: Verified Treatment Engine Contracts
// ==========================================
export interface TreatmentCalculationRequest {
  productId: string;
  cropName: string;
  fieldAcreage: number;
  knapsackTankVolumeLiters: number;
  targetPestOrDisease?: string;
}

export interface TreatmentCalculationResponse {
  isVerified: boolean;
  productId: string;
  tradeName: string;
  tradeNameTe?: string;
  cibrcRegistrationNumber: string;
  activeIngredients: string[];
  registeredCropMatched: boolean;
  dosageParameters: {
    labelDosePerAcre: string;
    fieldAcreage: number;
    totalFormulationRequired: {
      amount: number;
      unit: 'ml' | 'g';
    };
    totalWaterVolumeRequiredLiters: number;
    knapsackTankCapacityLiters: number;
    totalTanksRequired: number;
    dosePerKnapsackTank: {
      amount: number;
      unit: 'ml' | 'g';
    };
    stepByStepArithmetic: string[];
    stepByStepArithmeticTe?: string[];
  };
  resistanceProfile: {
    iracOrFracCode: string;
    modeOfAction: string;
    rotationAdviceEn: string;
    rotationAdviceTe: string;
    consecutiveSprayLimit: number;
  };
  safetyCompliance: {
    preHarvestIntervalDays: number;
    reEntryIntervalHours: number;
    toxicityColorCode: 'green' | 'blue' | 'yellow' | 'red';
    mandatoryPpe: string[];
    mandatoryPpeTe?: string[];
    disposalGuidelines: string;
    disposalGuidelinesTe?: string;
  };
  weatherRestrictions: {
    maxWindSpeedKmh: number;
    rainFreePeriodHours: number;
    maxTemperatureC: number;
  };
}

// ==========================================
// MODULE 5: Geospatial Outbreak Contracts
// ==========================================
export interface OutbreakQueryRequest {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  cropFilter?: string;
}

export interface NearbyOutbreakItem {
  reportId: string;
  crop: string;
  cropTe: string;
  diseaseNameEn: string;
  diseaseNameTe: string;
  distanceKm: number;
  severity: OutbreakSeverity;
  verificationStatus: ReportVerificationStatus;
  reportedDaysAgo: number;
  reportedAtIso: string;
  approximateLocation: {
    latitude: number;
    longitude: number;
    geohash: string;
    areaName?: string;
    district?: string;
  };
  recommendedPrecautionEn: string;
  recommendedPrecautionTe: string;
}

export interface OutbreakQueryResponse {
  queryCenter: { latitude: number; longitude: number };
  radiusKm: number;
  totalNearbyOutbreaks: number;
  threatLevel: 'low' | 'moderate' | 'critical';
  nearbyReports: NearbyOutbreakItem[];
}

export interface VerifyReportRequest {
  reportId: string;
  approved: boolean;
  verifierName: string;
  verifierNotes?: string;
}
