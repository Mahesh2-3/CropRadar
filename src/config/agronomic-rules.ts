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

export const DISEASE_TRANSLATIONS: Record<
  string,
  {
    te: string;
    en: string;
    descriptionTe: string;
    pathogenType?: 'fungal' | 'bacterial' | 'viral' | 'pest';
    measuresEn?: string;
    measuresTe?: string;
  }
> = {
  'Chilli Leaf Curl Virus': {
    te: 'మిరప ఆకు ముడత వైరస్',
    en: 'Chilli Leaf Curl Virus (Begomovirus)',
    descriptionTe: 'తెల్లదోమల ద్వారా వ్యాపించే వైరస్. ఆకులు పైకి లేదా క్రిందికి ముడుచుకుపోతాయి.',
    pathogenType: 'viral',
    measuresEn:
      '1. Inspect leaf undersides for whiteflies. 2. Install 15-20 yellow sticky traps/acre immediately. 3. Uproot severely stunted plants and burn away from field. 4. Spray neem oil (10,000 ppm) @ 2ml/L to suppress vectors.',
    measuresTe:
      '1. ఆకుల అడుగుభాగంలో తెల్లదోమల ఉధృతిని గమనించండి. 2. ఎకరానికి 15-20 పసుపు రంగు జిగురు అట్టలను వెంటనే ఏర్పాటు చేయండి. 3. తీవ్రంగా ముడుచుకుపోయిన మొక్కలను పీకి నాశనం చేయండి. 4. వేపనూనె (10,000 పీపీఎం) లీటరు నీటికి 2 మి.లీ చొప్పున పిచికారీ చేయండి.',
  },
  'Rice Blast': {
    te: 'వరి అగ్గి తెగులు',
    en: 'Rice Blast (Magnaporthe oryzae)',
    descriptionTe: 'ఆకులపై కంటి ఆకారపు (కండె ఆకారపు) బూడిద కేంద్రం గల మచ్చలు ఏర్పడతాయి.',
    pathogenType: 'fungal',
    measuresEn:
      '1. Scout field borders for diamond/spindle eye-spots. 2. Avoid excess urea/nitrogen fertilizer. 3. Stop flow of stagnant water between fields. 4. Apply Trichoderma or biocontrol barrier.',
    measuresTe:
      '1. గట్ల వెంబడి ఆకులపై కంటి ఆకారపు మచ్చలు ఉన్నాయేమో పరిశీలించండి. 2. నత్రజని (యూరియా) ఎరువులను అధికంగా వేయవద్దు. 3. ఒక పొలం నుండి మరొక పొలానికి మురుగు నీరు పారకుండా ఆపండి. 4. జీవ నియంత్రణగా ట్రైకోడెర్మా వాడండి.',
  },
  'Paddy Blast': {
    te: 'వరి అగ్గితెగులు',
    en: 'Paddy Blast (Pyricularia oryzae)',
    descriptionTe: 'ఆకులపై కంటి ఆకారపు మచ్చలు ఏర్పడతాయి.',
    pathogenType: 'fungal',
    measuresEn:
      '1. Scout field borders for diamond/spindle eye-spots. 2. Avoid excess urea/nitrogen fertilizer. 3. Stop flow of stagnant water between fields. 4. Apply Trichoderma or biocontrol barrier.',
    measuresTe:
      '1. గట్ల వెంబడి ఆకులపై కంటి ఆకారపు మచ్చలు ఉన్నాయేమో పరిశీలించండి. 2. నత్రజని (యూరియా) ఎరువులను అధికంగా వేయవద్దు. 3. ఒక పొలం నుండి మరొక పొలానికి మురుగు నీరు పారకుండా ఆపండి. 4. జీవ నియంత్రణగా ట్రైకోడెర్మా వాడండి.',
  },
  'Bacterial Leaf Blight': {
    te: 'బాక్టీరియా ఆకు ఎండు తెగులు',
    en: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
    descriptionTe: 'ఆకుల అంచుల నుండి అలల మాదిరిగా పసుపు-తెలుపు రంగులో ఎండుతూ క్రిందికి వ్యాపిస్తుంది.',
    pathogenType: 'bacterial',
    measuresEn:
      '1. Avoid working in wet crops to prevent bacteria spread. 2. Drain excess stagnant field water. 3. Disinfect weeding and trimming tools. 4. Do not spray during windy or rainy weather.',
    measuresTe:
      '1. ఆకులు తడిగా ఉన్నప్పుడు పొలంలో పనులు చేయవద్దు. 2. పొలంలో నిలిచిన అదనపు నీటిని బయటకు తీయండి. 3. పనిముట్లను క్రిమిసంహారకం చేయండి. 4. గాలి, వర్షం ఉన్నప్పుడు ఎటువంటి పిచికారీ చేయవద్దు.',
  },
  'Brown Spot': {
    te: 'గోధుమ రంగు మచ్చ తెగులు',
    en: 'Brown Spot (Bipolaris oryzae)',
    descriptionTe: 'ఆకులపై చిన్న గుండ్రని ముదురు గోధుమ రంగు మచ్చలు ఏర్పడతాయి.',
    pathogenType: 'fungal',
    measuresEn:
      '1. Scout for circular brown lesions. 2. Ensure balanced potassium (potash) nutrition. 3. Maintain clean field borders and proper drainage.',
    measuresTe:
      '1. ఆకులపై గుండ్రని గోధుమ మచ్చలను గమనించండి. 2. పొటాష్ ఎరువులను సమతుల్యంగా వేసి మొక్కలకు వ్యాధి నిరోధక శక్తిని పెంచండి. 3. గట్లను శుభ్రంగా ఉంచి నీటి పారుదల క్రమబద్ధం చేయండి.',
  },
  'False Smut': {
    te: 'కాటుక తెగులు / బూజు తెగులు',
    en: 'False Smut (Ustilaginoidea virens)',
    descriptionTe: 'వరి వెన్నులోని గింజల స్థానంలో వెల్వెట్ లాంటి ఆకుపచ్చ-నలుపు రంగు ముద్దలు ఏర్పడతాయి.',
    pathogenType: 'fungal',
    measuresEn:
      '1. Carefully remove and bag infected panicles to stop spores blowing. 2. Regulate water levels during flowering. 3. Use certified disease-free seeds for next cycle.',
    measuresTe:
      '1. బూజు పట్టిన వెన్నులను జాగ్రత్తగా కవరులో సేకరించి నాశనం చేయండి. 2. ఈనె దశలో పొలంలో తగినంత తేమ మాత్రమే ఉంచండి. 3. తదుపరి పంటకు ధృవీకరించిన విత్తనాలను వాడండి.',
  },
  'Anthracnose / Die back': {
    te: 'కొమ్మ ఎండు తెగులు / పండు కుళ్లు',
    en: 'Anthracnose / Fruit Rot (Colletotrichum capsici)',
    descriptionTe: 'కాయలపై నల్లటి మచ్చలు ఏర్పడి కాయలు ఎండిపోతాయి.',
    pathogenType: 'fungal',
    measuresEn:
      '1. Collect and burn shriveled fruits and dry branches. 2. Avoid overhead sprinkler irrigation. 3. Keep adequate spacing between crop rows.',
    measuresTe:
      '1. ఎండిపోయిన కొమ్మలు, కుళ్ళిన కాయలను ఏరి నాశనం చేయండి. 2. పైనుండి నీరు చిమ్మే పద్ధతులను నివారించండి. 3. మొక్కల మధ్య తగినంత గాలి వెలుతురు ఉండేలా చూడండి.',
  },
  'Bacterial Leaf Spot': {
    te: 'బాక్టీరియా ఆకుమచ్చ తెగులు',
    en: 'Bacterial Leaf Spot (Xanthomonas campestris)',
    descriptionTe: 'ఆకులపై నీరుకారిన చిన్న మచ్చలు ఏర్పడి చుట్టూ పసుపు రంగు వలయాలు ఏర్పడతాయి.',
    pathogenType: 'bacterial',
    measuresEn:
      '1. Avoid field operations when leaves are wet. 2. Disinfect pruning tools. 3. Practice crop rotation with non-host crops.',
    measuresTe:
      '1. ఆకులు తడిగా ఉన్నప్పుడు చేనులోకి వెళ్ళవద్దు. 2. కత్తిరింపు పనిముట్లను శుభ్రం చేయండి. 3. పంట మార్పిడి పద్ధతులను పాటించండి.',
  },
  'Powdery Mildew': {
    te: 'బూడిద తెగులు',
    en: 'Powdery Mildew (Leveillula taurica)',
    descriptionTe: 'ఆకుల అడుగుభాగంలో తెల్లటి బూడిద వంటి పొడి కనిపిస్తుంది.',
    pathogenType: 'fungal',
    measuresEn:
      '1. Scout lower leaves for white powdery coatings. 2. Improve field aeration. 3. Spray wettable sulphur or neem formulation as preventive measure.',
    measuresTe:
      '1. ఆకుల అడుగున తెల్లటి బూడిద పొడి ఉందేమో చూడండి. 2. గాలి ప్రసరణ బాగుండేలా చూడండి. 3. ముందస్తుగా గంధకం లేదా వేప కషాయం పిచికారీ చేయండి.',
  },
  'Sheath Blight': {
    te: 'వరి కాండం కుళ్లు తెగులు',
    en: 'Sheath Blight (Rhizoctonia solani)',
    descriptionTe: 'వరి దుబ్బులపై నీటి మట్టం వద్ద పాము పొలుసుల వంటి మచ్చలు ఏర్పడతాయి.',
    pathogenType: 'fungal',
    measuresEn:
      '1. Check lower stems at water level for greenish-grey lesions. 2. Drain standing water for 2-3 days to dry soil surface. 3. Remove alternate weed hosts on bunds.',
    measuresTe:
      '1. నీటి మట్టం వద్ద కాండంపై పాము పొలుసుల మచ్చలు గమనించండి. 2. 2-3 రోజులు నీటిని తీసివేసి కాండానికి గాలి తగిలేలా చేయండి. 3. గట్లపై ఉన్న కలుపు మొక్కలను తొలగించండి.',
  },
  'Thrips Infestation': {
    te: 'తామర పురుగుల ఉధృతి',
    en: 'Thrips Damage (Scirtothrips dorsalis)',
    descriptionTe: 'ఆకుల రసం పీల్చడం వల్ల ఆకుల అంచులు పైకి దోనె ఆకారంలో ముడుచుకుంటాయి.',
    pathogenType: 'pest',
    measuresEn:
      '1. Install blue and yellow sticky traps (15-20/acre). 2. Spray neem oil (10,000 ppm) @ 2ml/L. 3. Avoid excessive chemical sprays that kill natural predator bugs.',
    measuresTe:
      '1. ఎకరానికి 15-20 నీలం మరియు పసుపు జిగురు అట్టలను అమర్చండి. 2. వేపనూనె పిచికారీ చేయండి. 3. మిత్రపురుగులను చంపే విచక్షణారహిత రసాయన మందులను వాడవద్దు.',
  },
};
