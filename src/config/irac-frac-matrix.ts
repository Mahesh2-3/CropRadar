/**
 * IRAC (Insecticide Resistance Action Committee) & FRAC (Fungicide Resistance Action Committee)
 * Mode of Action (MoA) Matrix and Rotation Guidelines.
 *
 * AGRONOMIC PRINCIPLE: Repeated application of pesticides within the same MoA group creates
 * intense directional selection pressure, allowing pre-existing resistant biotypes in the pest/fungal
 * population to multiply. Rotating between different MoA groups interrupts this selection.
 */

export interface MoaGroupDefinition {
  code: string;
  category: 'insecticide' | 'fungicide';
  groupName: string;
  chemicalSubfamily: string;
  mechanismSummary: string;
  resistanceRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  maxConsecutiveApplications: number;
}

export const MOA_REGISTRY: Record<string, MoaGroupDefinition> = {
  // FRAC Groups
  '11 + 3': {
    code: '11 + 3',
    category: 'fungicide',
    groupName: 'QoI + DMI Dual Premix',
    chemicalSubfamily: 'Strobilurins + Triazoles',
    mechanismSummary: 'Inhibits complex III mitochondrial respiration and fungal sterol demethylation (ergosterol biosynthesis).',
    resistanceRisk: 'HIGH',
    maxConsecutiveApplications: 2,
  },
  'M01': {
    code: 'M01',
    category: 'fungicide',
    groupName: 'Inorganic Copper',
    chemicalSubfamily: 'Copper compounds',
    mechanismSummary: 'Multi-site contact activity causing non-specific protein denaturation in fungal & bacterial cells.',
    resistanceRisk: 'LOW',
    maxConsecutiveApplications: 4,
  },
  'M03': {
    code: 'M03',
    category: 'fungicide',
    groupName: 'Dithiocarbamates',
    chemicalSubfamily: 'Ethylenebis(dithiocarbamate)',
    mechanismSummary: 'Multi-site inhibition of sulfhydryl enzymes in the fungal respiratory cycle.',
    resistanceRisk: 'LOW',
    maxConsecutiveApplications: 4,
  },
  '25 + 41': {
    code: '25 + 41',
    category: 'fungicide',
    groupName: 'Glucopyranosyl & Tetracycline Antibiotics',
    chemicalSubfamily: 'Streptomycin + Tetracycline',
    mechanismSummary: 'Binds bacterial 30S ribosomal subunits, inhibiting protein synthesis.',
    resistanceRisk: 'MEDIUM',
    maxConsecutiveApplications: 2,
  },

  // IRAC Groups
  '28': {
    code: '28',
    category: 'insecticide',
    groupName: 'Diamides (Ryanodine Receptor Modulators)',
    chemicalSubfamily: 'Anthranilic diamides',
    mechanismSummary: 'Activates insect muscle ryanodine receptors, triggering uncontrolled release of internal calcium stores and feeding cessation.',
    resistanceRisk: 'HIGH',
    maxConsecutiveApplications: 2,
  },
  '4A': {
    code: '4A',
    category: 'insecticide',
    groupName: 'Neonicotinoids (nAChR Competitive Modulators)',
    chemicalSubfamily: 'Neonicotinoids',
    mechanismSummary: 'Agonist at nicotinic acetylcholine receptors in insect central nervous system.',
    resistanceRisk: 'HIGH',
    maxConsecutiveApplications: 2,
  },
  '2B': {
    code: '2B',
    category: 'insecticide',
    groupName: 'Phenylpyrazoles (GABA-gated chloride channel blockers)',
    chemicalSubfamily: 'Fiproles',
    mechanismSummary: 'Blocks GABA-regulated chloride channels, disrupting CNS inhibitory transmission.',
    resistanceRisk: 'MEDIUM',
    maxConsecutiveApplications: 2,
  },
};

/**
 * Get rotational partner MoA groups that do NOT share target site resistance.
 */
export function getRecommendedRotationPartners(currentMoaCode: string, category: 'insecticide' | 'fungicide'): string[] {
  return Object.values(MOA_REGISTRY)
    .filter((g) => g.category === category && g.code !== currentMoaCode)
    .map((g) => g.code);
}
