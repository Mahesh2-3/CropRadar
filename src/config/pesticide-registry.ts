import { PesticideProduct } from '../types/models';

/**
 * CIBRC Verified Pesticide Registry
 * Reference dataset mirroring Indian Central Insecticides Board & Registration Committee (CIBRC) approved labels.
 * SAFETY RULE: Dosage calculations are derived ONLY from these verified registered rates.
 */
export const VERIFIED_PESTICIDES: PesticideProduct[] = [
  {
    productId: 'cibrc-azoxy-difen-001',
    tradeName: 'Amistar Top',
    activeIngredients: [
      { name: 'Azoxystrobin', concentrationPct: 18.2, unit: 'SC' },
      { name: 'Difenoconazole', concentrationPct: 11.4, unit: 'SC' },
    ],
    fracCode: '11 + 3', // QoI (Quinone Outside Inhibitor) + DMI (Demethylation Inhibitor)
    cibrcRegistrationNumber: 'CIR-42194/2014(348)-Azoxystrobin+Difenoconazole(SC)-392',
    targetPathogenCategory: 'fungal',
    registeredLabels: [
      {
        crop: 'Chilli',
        targetPests: ['Anthracnose / Die back (Colletotrichum capsici)', 'Powdery Mildew (Leveillula taurica)'],
        dosagePerAcre: { minAmount: 200, maxAmount: 200, unit: 'ml' },
        recommendedWaterVolumeLitersPerAcre: 200,
        preHarvestIntervalDays: 5,
        reEntryPeriodHours: 24,
      },
      {
        crop: 'Paddy',
        targetPests: ['Sheath Blight (Rhizoctonia solani)', 'Blast (Pyricularia oryzae)'],
        dosagePerAcre: { minAmount: 200, maxAmount: 200, unit: 'ml' },
        recommendedWaterVolumeLitersPerAcre: 200,
        preHarvestIntervalDays: 14,
        reEntryPeriodHours: 24,
      },
      {
        crop: 'Tomato',
        targetPests: ['Early Blight (Alternaria solani)'],
        dosagePerAcre: { minAmount: 200, maxAmount: 200, unit: 'ml' },
        recommendedWaterVolumeLitersPerAcre: 200,
        preHarvestIntervalDays: 3,
        reEntryPeriodHours: 24,
      },
    ],
    weatherRestrictions: {
      maxWindSpeedKmh: 14,
      rainFreePeriodHours: 4,
      maxTemperatureC: 35,
    },
    toxicityColorCode: 'blue',
    protectiveEquipment: ['Rubber gloves', 'Nose mask', 'Eye goggles', 'Full sleeve apron'],
  },
  {
    productId: 'cibrc-copper-oxy-002',
    tradeName: 'Blitox 50 WP',
    activeIngredients: [
      { name: 'Copper Oxychloride', concentrationPct: 50.0, unit: 'WP' },
    ],
    fracCode: 'M01', // Multi-site contact activity (low resistance risk)
    cibrcRegistrationNumber: 'CIR-1205/1973(22)-Copper Oxychloride(WP)-18',
    targetPathogenCategory: 'bacterial',
    registeredLabels: [
      {
        crop: 'Chilli',
        targetPests: ['Bacterial Leaf Spot (Xanthomonas campestris)', 'Fruit Rot'],
        dosagePerAcre: { minAmount: 1000, maxAmount: 1200, unit: 'g' },
        recommendedWaterVolumeLitersPerAcre: 300,
        preHarvestIntervalDays: 10,
        reEntryPeriodHours: 48,
      },
      {
        crop: 'Tomato',
        targetPests: ['Bacterial Canker', 'Late Blight'],
        dosagePerAcre: { minAmount: 1000, maxAmount: 1200, unit: 'g' },
        recommendedWaterVolumeLitersPerAcre: 300,
        preHarvestIntervalDays: 7,
        reEntryPeriodHours: 48,
      },
      {
        crop: 'Paddy',
        targetPests: ['Bacterial Leaf Blight (Xanthomonas oryzae)'],
        dosagePerAcre: { minAmount: 1000, maxAmount: 1250, unit: 'g' },
        recommendedWaterVolumeLitersPerAcre: 300,
        preHarvestIntervalDays: 15,
        reEntryPeriodHours: 48,
      },
    ],
    weatherRestrictions: {
      maxWindSpeedKmh: 12,
      rainFreePeriodHours: 6,
      maxTemperatureC: 34,
    },
    toxicityColorCode: 'blue',
    protectiveEquipment: ['Face mask with dust filter', 'Protective gloves', 'Boots'],
  },
  {
    productId: 'cibrc-strepto-tetra-003',
    tradeName: 'Plantomycin',
    activeIngredients: [
      { name: 'Streptomycin Sulphate', concentrationPct: 9.0, unit: 'SP' },
      { name: 'Tetracycline Hydrochloride', concentrationPct: 1.0, unit: 'SP' },
    ],
    fracCode: '25 + 41', // Microbial antibiotics
    cibrcRegistrationNumber: 'CIR-3142/1982(12)-Streptomycin+Tetracycline-44',
    targetPathogenCategory: 'bacterial',
    registeredLabels: [
      {
        crop: 'Chilli',
        targetPests: ['Bacterial Leaf Spot (Xanthomonas)', 'Bacterial Canker'],
        dosagePerAcre: { minAmount: 60, maxAmount: 100, unit: 'g' },
        recommendedWaterVolumeLitersPerAcre: 200,
        preHarvestIntervalDays: 14,
        reEntryPeriodHours: 24,
      },
      {
        crop: 'Tomato',
        targetPests: ['Bacterial Wilt (Ralstonia solanacearum)'],
        dosagePerAcre: { minAmount: 60, maxAmount: 80, unit: 'g' },
        recommendedWaterVolumeLitersPerAcre: 200,
        preHarvestIntervalDays: 10,
        reEntryPeriodHours: 24,
      },
    ],
    weatherRestrictions: {
      maxWindSpeedKmh: 15,
      rainFreePeriodHours: 4,
      maxTemperatureC: 36,
    },
    toxicityColorCode: 'green',
    protectiveEquipment: ['Dust mask', 'Rubber gloves'],
  },
  {
    productId: 'cibrc-chlorant-004',
    tradeName: 'Coragen',
    activeIngredients: [
      { name: 'Chlorantraniliprole', concentrationPct: 18.5, unit: 'SC' },
    ],
    iracCode: '28', // Ryanodine Receptor Modulators (Diamides)
    cibrcRegistrationNumber: 'CIR-59321/2009(302)-Chlorantraniliprole(SC)-128',
    targetPathogenCategory: 'pest',
    registeredLabels: [
      {
        crop: 'Chilli',
        targetPests: ['Fruit Borer (Helicoverpa armigera)', 'Tobacco Caterpillar (Spodoptera litura)'],
        dosagePerAcre: { minAmount: 60, maxAmount: 60, unit: 'ml' },
        recommendedWaterVolumeLitersPerAcre: 200,
        preHarvestIntervalDays: 3,
        reEntryPeriodHours: 12,
      },
      {
        crop: 'Paddy',
        targetPests: ['Stem Borer (Scirpophaga incertulas)', 'Leaf Folder (Cnaphalocrocis medinalis)'],
        dosagePerAcre: { minAmount: 60, maxAmount: 60, unit: 'ml' },
        recommendedWaterVolumeLitersPerAcre: 200,
        preHarvestIntervalDays: 14,
        reEntryPeriodHours: 12,
      },
      {
        crop: 'Cotton',
        targetPests: ['American Bollworm', 'Spotted Bollworm'],
        dosagePerAcre: { minAmount: 60, maxAmount: 60, unit: 'ml' },
        recommendedWaterVolumeLitersPerAcre: 200,
        preHarvestIntervalDays: 20,
        reEntryPeriodHours: 12,
      },
    ],
    weatherRestrictions: {
      maxWindSpeedKmh: 15,
      rainFreePeriodHours: 2,
      maxTemperatureC: 38,
    },
    toxicityColorCode: 'green',
    protectiveEquipment: ['Gloves', 'Safety glasses'],
  },
  {
    productId: 'cibrc-thiamethoxam-005',
    tradeName: 'Actara',
    activeIngredients: [
      { name: 'Thiamethoxam', concentrationPct: 25.0, unit: 'WG' },
    ],
    iracCode: '4A', // Neonicotinoid (Nicotinic acetylcholine receptor competitive modulators)
    cibrcRegistrationNumber: 'CIR-38102/2003(241)-Thiamethoxam(WG)-71',
    targetPathogenCategory: 'pest',
    registeredLabels: [
      {
        crop: 'Chilli',
        targetPests: ['Thrips (Scirtothrips dorsalis)', 'Aphids (Aphis gossypii)', 'Whiteflies (Bemisia tabaci)'],
        dosagePerAcre: { minAmount: 80, maxAmount: 100, unit: 'g' },
        recommendedWaterVolumeLitersPerAcre: 200,
        preHarvestIntervalDays: 5,
        reEntryPeriodHours: 24,
      },
      {
        crop: 'Cotton',
        targetPests: ['Jassids', 'Aphids', 'Thrips'],
        dosagePerAcre: { minAmount: 40, maxAmount: 40, unit: 'g' },
        recommendedWaterVolumeLitersPerAcre: 200,
        preHarvestIntervalDays: 21,
        reEntryPeriodHours: 24,
      },
      {
        crop: 'Paddy',
        targetPests: ['Brown Plant Hopper (Nilaparvata lugens)', 'Green Leaf Hopper'],
        dosagePerAcre: { minAmount: 40, maxAmount: 40, unit: 'g' },
        recommendedWaterVolumeLitersPerAcre: 200,
        preHarvestIntervalDays: 14,
        reEntryPeriodHours: 24,
      },
    ],
    weatherRestrictions: {
      maxWindSpeedKmh: 12,
      rainFreePeriodHours: 4,
      maxTemperatureC: 35,
    },
    toxicityColorCode: 'blue',
    protectiveEquipment: ['Gloves', 'Eye shield', 'Mask'],
  },
  {
    productId: 'cibrc-fipronil-006',
    tradeName: 'Regent 5% SC',
    activeIngredients: [
      { name: 'Fipronil', concentrationPct: 5.0, unit: 'SC' },
    ],
    iracCode: '2B', // GABA-gated chloride channel blockers (Phenylpyrazoles)
    cibrcRegistrationNumber: 'CIR-29841/2001(218)-Fipronil(SC)-114',
    targetPathogenCategory: 'pest',
    registeredLabels: [
      {
        crop: 'Chilli',
        targetPests: ['Thrips (Scirtothrips dorsalis)', 'Fruit Borer'],
        dosagePerAcre: { minAmount: 320, maxAmount: 400, unit: 'ml' },
        recommendedWaterVolumeLitersPerAcre: 200,
        preHarvestIntervalDays: 7,
        reEntryPeriodHours: 24,
      },
      {
        crop: 'Paddy',
        targetPests: ['Stem Borer', 'Brown Plant Hopper'],
        dosagePerAcre: { minAmount: 400, maxAmount: 600, unit: 'ml' },
        recommendedWaterVolumeLitersPerAcre: 200,
        preHarvestIntervalDays: 32,
        reEntryPeriodHours: 24,
      },
    ],
    weatherRestrictions: {
      maxWindSpeedKmh: 14,
      rainFreePeriodHours: 3,
      maxTemperatureC: 36,
    },
    toxicityColorCode: 'blue',
    protectiveEquipment: ['Mask', 'Nitrile gloves', 'Protective eye wear'],
  },
  {
    productId: 'cibrc-mancozeb-007',
    tradeName: 'Dithane M-45',
    activeIngredients: [
      { name: 'Mancozeb', concentrationPct: 75.0, unit: 'WP' },
    ],
    fracCode: 'M03', // Multi-site dithiocarbamates (Very low resistance risk)
    cibrcRegistrationNumber: 'CIR-894/1971(14)-Mancozeb(WP)-11',
    targetPathogenCategory: 'fungal',
    registeredLabels: [
      {
        crop: 'Chilli',
        targetPests: ['Anthracnose / Ripe Fruit Rot', 'Leaf Spot (Cercospora capsici)'],
        dosagePerAcre: { minAmount: 600, maxAmount: 800, unit: 'g' },
        recommendedWaterVolumeLitersPerAcre: 250,
        preHarvestIntervalDays: 7,
        reEntryPeriodHours: 24,
      },
      {
        crop: 'Tomato',
        targetPests: ['Early Blight', 'Late Blight'],
        dosagePerAcre: { minAmount: 600, maxAmount: 800, unit: 'g' },
        recommendedWaterVolumeLitersPerAcre: 250,
        preHarvestIntervalDays: 5,
        reEntryPeriodHours: 24,
      },
      {
        crop: 'Groundnut',
        targetPests: ['Tikka Disease (Cercospora arachidicola)'],
        dosagePerAcre: { minAmount: 600, maxAmount: 800, unit: 'g' },
        recommendedWaterVolumeLitersPerAcre: 250,
        preHarvestIntervalDays: 14,
        reEntryPeriodHours: 24,
      },
    ],
    weatherRestrictions: {
      maxWindSpeedKmh: 12,
      rainFreePeriodHours: 6,
      maxTemperatureC: 35,
    },
    toxicityColorCode: 'green',
    protectiveEquipment: ['Dust mask', 'Rubber gloves', 'Long sleeve shirt'],
  },
];

export function findPesticideById(productId: string): PesticideProduct | undefined {
  return VERIFIED_PESTICIDES.find((p) => p.productId === productId);
}

export function searchPesticidesByQuery(query: string, crop?: string): PesticideProduct[] {
  const q = query.toLowerCase().trim();
  return VERIFIED_PESTICIDES.filter((p) => {
    const matchesCrop = !crop || p.registeredLabels.some((l) => l.crop.toLowerCase() === crop.toLowerCase());
    const matchesTrade = p.tradeName.toLowerCase().includes(q);
    const matchesActive = p.activeIngredients.some((a) => a.name.toLowerCase().includes(q));
    const matchesPest = p.registeredLabels.some((l) =>
      l.targetPests.some((pest) => pest.toLowerCase().includes(q))
    );
    return matchesCrop && (matchesTrade || matchesActive || matchesPest);
  });
}
