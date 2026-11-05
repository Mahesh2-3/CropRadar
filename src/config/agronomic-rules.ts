/**
 * Agronomic Thresholds & Multilingual Dictionaries
 */

export const WEATHER_THRESHOLDS = {
  wind: {
    optimalMaxKmh: 10,
    marginalMaxKmh: 15, // Drift occurs beyond this
    calmMinKmh: 3,      // Below 3 km/h risk of thermal inversion
  },
  rain: {
    maxProbabilityPct4h: 35,
    maxPrecipitation4hMm: 0.8,
  },
  temp: {
    minSafeC: 12,
    maxSafeC: 34,
    criticalEvaporationC: 36,
  },
  humidity: {
    minSafePct: 40,
    maxSafePct: 85,
  },
};

export const CROP_TRANSLATIONS: Record<string, { te: string; en: string }> = {
  Chilli: { te: 'మిరప', en: 'Chilli' },
  Cotton: { te: 'పత్తి', en: 'Cotton' },
  Paddy: { te: 'వరి', en: 'Paddy / Rice' },
  Tomato: { te: 'టమోటా', en: 'Tomato' },
  Groundnut: { te: 'వేరుశనగ', en: 'Groundnut' },
};

export const DISEASE_TRANSLATIONS: Record<string, { te: string; en: string; descriptionTe: string }> = {
  'Chilli Leaf Curl Virus': {
    te: 'మిరప ఆకు ముడత వైరస్',
    en: 'Chilli Leaf Curl Virus (Begomovirus)',
    descriptionTe: 'తెల్లదోమల ద్వారా వ్యాపించే వైరస్. ఆకులు పైకి లేదా క్రిందికి ముడుచుకుపోతాయి.',
  },
  'Anthracnose / Die back': {
    te: 'కొమ్మ ఎండు తెగులు / పండు కుళ్లు',
    en: 'Anthracnose / Fruit Rot (Colletotrichum capsici)',
    descriptionTe: 'కాయలపై నల్లటి మచ్చలు ఏర్పడి కాయలు ఎండిపోతాయి.',
  },
  'Bacterial Leaf Spot': {
    te: 'బాక్టీరియా ఆకుమచ్చ తెగులు',
    en: 'Bacterial Leaf Spot (Xanthomonas campestris)',
    descriptionTe: 'ఆకులపై నీరుకారిన చిన్న మచ్చలు ఏర్పడి చుట్టూ పసుపు రంగు వలయాలు ఏర్పడతాయి.',
  },
  'Powdery Mildew': {
    te: 'బూడిద తెగులు',
    en: 'Powdery Mildew (Leveillula taurica)',
    descriptionTe: 'ఆకుల అడుగుభాగంలో తెల్లటి బూడిద వంటి పొడి కనిపిస్తుంది.',
  },
  'Sheath Blight': {
    te: 'వరి కాండం కుళ్లు తెగులు',
    en: 'Sheath Blight (Rhizoctonia solani)',
    descriptionTe: 'వరి దుబ్బులపై నీటి మట్టం వద్ద పాము పొలుసుల వంటి మచ్చలు ఏర్పడతాయి.',
  },
  'Paddy Blast': {
    te: 'వరి అగ్గితెగులు',
    en: 'Paddy Blast (Pyricularia oryzae)',
    descriptionTe: 'ఆకులపై కంటి ఆకారపు మచ్చలు ఏర్పడతాయి.',
  },
  'Thrips Infestation': {
    te: 'తామర పురుగుల ఉధృతి',
    en: 'Thrips Damage (Scirtothrips dorsalis)',
    descriptionTe: 'ఆకుల రసం పీల్చడం వల్ల ఆకుల అంచులు పైకి దోనె ఆకారంలో ముడుచుకుంటాయి.',
  },
};
