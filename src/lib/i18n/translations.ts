import { LanguageCode } from '@/types/models';

export const ANDHRA_PRADESH_DISTRICTS = [
  { id: 'guntur', nameEn: 'Guntur', nameTe: 'గుంటూరు', lat: 16.3067, lng: 80.4365 },
  { id: 'krishna', nameEn: 'Krishna', nameTe: 'కృష్ణా (విజయవాడ)', lat: 16.5062, lng: 80.648 },
  { id: 'prakasam', nameEn: 'Prakasam', nameTe: 'ప్రకాశం (ఒంగోలు)', lat: 15.5057, lng: 80.0499 },
  { id: 'kurnool', nameEn: 'Kurnool', nameTe: 'కర్నూలు', lat: 15.8281, lng: 78.0373 },
  { id: 'east_godavari', nameEn: 'East Godavari', nameTe: 'తూర్పు గోదావరి (రాజమండ్రి)', lat: 17.0005, lng: 81.804 },
  { id: 'west_godavari', nameEn: 'West Godavari', nameTe: 'పశ్చిమ గోదావరి (ఏలూరు)', lat: 16.7107, lng: 81.0952 },
  { id: 'anantapur', nameEn: 'Anantapur', nameTe: 'అనంతపురం', lat: 14.6819, lng: 77.6006 },
  { id: 'chittoor', nameEn: 'Chittoor', nameTe: 'చిత్తూరు', lat: 13.2172, lng: 79.1003 },
  { id: 'nellore', nameEn: 'Nellore', nameTe: 'శ్రీ పొట్టి శ్రీరాములు నెల్లూరు', lat: 14.4426, lng: 79.9865 },
  { id: 'kadapa', nameEn: 'YSR Kadapa', nameTe: 'వైఎస్సార్ కడప', lat: 14.4673, lng: 78.8242 },
  { id: 'visakhapatnam', nameEn: 'Visakhapatnam', nameTe: 'విశాఖపట్నం', lat: 17.6868, lng: 83.2185 },
  { id: 'vizianagaram', nameEn: 'Vizianagaram', nameTe: 'విజయనగరం', lat: 18.1067, lng: 83.3956 },
  { id: 'srikakulam', nameEn: 'Srikakulam', nameTe: 'శ్రీకాకుళం', lat: 18.2949, lng: 83.8938 },
];

export const TRANSLATIONS = {
  appName: {
    en: 'CROP RADAR',
    te: 'క్రాప్ రాడార్',
  },
  appTagline: {
    en: 'Your AI Farming Companion for Andhra Pradesh',
    te: 'ఆంధ్రప్రదేశ్ రైతులకు వ్యక్తిగత వ్యవసాయ సహాయకుడు',
  },
  welcomeHeading: {
    en: "Hello! I'm your Crop Radar farming assistant. How can I help with your crops today?",
    te: 'నమస్కారం! నేను మీ క్రాప్ రాడార్ వ్యవసాయ సహాయకుడిని. ఈరోజు మీ పంటలకు సంబంధించి నేను మీకు ఎలా సహాయం చేయగలను?',
  },
  welcomeSubtitle: {
    en: 'You can upload crop photographs, ask questions, check spray weather, or speak naturally in Telugu.',
    te: 'మీరు పంట లేదా మందుల లేబుల్ ఫోటో తీయవచ్చు, ప్రశ్నలు అడగవచ్చు లేదా నేరుగా తెలుగులో మాట్లాడవచ్చు.',
  },

  // Header
  header: {
    locationLabel: {
      en: 'Farm Location',
      te: 'పొలం స్థానం',
    },
    changeLocation: {
      en: 'Change Location',
      te: 'స్థలాన్ని మార్చండి',
    },
    settingsTooltip: {
      en: 'Settings & Alerts',
      te: 'సెట్టింగ్‌లు & హెచ్చరికలు',
    },
    historyTooltip: {
      en: 'Crop History',
      te: 'పంట చరిత్ర',
    },
  },

  // Composer
  composer: {
    placeholder: {
      en: 'Type your farming question, or use the camera / mic...',
      te: 'వ్యవసాయ ప్రశ్నను ఇక్కడ టైప్ చేయండి, లేదా మాట్లాడండి...',
    },
    attachPhoto: {
      en: 'Upload Crop / Label Photo',
      te: 'ఫోటో అప్‌లోడ్ చేయండి',
    },
    takePhoto: {
      en: 'Open Camera',
      te: 'కెమెరాతో ఫోటో తీయండి',
    },
    voiceSpeak: {
      en: 'Speak in Telugu / English',
      te: 'తెలుగులో మాట్లాడండి',
    },
    voiceListening: {
      en: 'Listening... Speak now',
      te: 'వింటున్నాను... ఇప్పుడు మాట్లాడండి',
    },
    voiceProcessing: {
      en: 'Processing your voice...',
      te: 'మీ మాటలను విశ్లేషిస్తున్నాను...',
    },
    stopSpeaking: {
      en: 'Stop Speaking',
      te: 'ఆపండి',
    },
    sendMessage: {
      en: 'Send Message',
      te: 'పంపండి',
    },
    removeImage: {
      en: 'Remove image',
      te: 'ఫోటోను తొలగించండి',
    },
  },

  // Quick Chips
  quickChips: {
    diagnose: {
      en: 'What disease is on my crop? 📸',
      te: 'నా పంటకు వచ్చిన తెగులు ఏమిటి? 📸',
      queryEn: 'Can you help diagnose a disease on my crop?',
      queryTe: 'నా పంటకు ఏదో తెగులు వచ్చింది, ఏ మందు వాడాలి?',
    },
    weather: {
      en: 'Can I spray pesticide today? 🌦️',
      te: 'ఈ రోజు పిచికారీ చేయవచ్చా? 🌦️',
      queryEn: 'Is the weather suitable for spraying pesticide right now?',
      queryTe: 'ఈ రోజు మా పొలంలో మందు పిచికారీ చేయడానికి వాతావరణం అనుకూలమేనా?',
    },
    treatment: {
      en: 'Calculate dosage for 2 acres 🧪',
      te: '2 ఎకరాలకు మందు మోతాదు ఎంత? 🧪',
      queryEn: 'How much pesticide should I mix per tank for 2 acres?',
      queryTe: 'రెండు ఎకరాల పంటకు పంపు ట్యాంకుకు ఎంత మందు కలపాలి?',
    },
    outbreaks: {
      en: 'Any nearby disease alerts? 📡',
      te: 'చుట్టుపక్కల తెగుళ్ల హెచ్చరికలు ఉన్నాయా? 📡',
      queryEn: 'Are there any nearby disease reports?',
      queryTe: 'మా ప్రాంతంలో ఇతర పొలాల్లో ఏవైనా తెగుళ్లు వ్యాపిస్తున్నాయా?',
    },
    history: {
      en: 'Show my crop health history 📋',
      te: 'నా పంట గత ఆరోగ్య వివరాలు 📋',
      queryEn: 'Show my previous crop observations and recorded treatments.',
      queryTe: 'గతంలో నా పొలంలో నమోదైన వివరాలు మరియు వాడిన మందులు చూపించు.',
    },
  },

  // Camera Modal
  cameraModal: {
    title: {
      en: 'Capture Farm Photo',
      te: 'పంట లేదా మందుల ఫోటో తీయండి',
    },
    instruction: {
      en: 'Hold steady and focus on the affected leaf, stem, or label.',
      te: 'కెమెరాను కదల్చకుండా తెగులు సోకిన ఆకు లేదా మందు లేబుల్ స్పష్టంగా కనిపించేలా ఉంచండి.',
    },
    snapPhoto: {
      en: 'Snap Photo',
      te: 'ఫోటో తీయండి',
    },
    retake: {
      en: 'Retake',
      te: 'మళ్లీ తీయండి',
    },
    usePhoto: {
      en: 'Use This Photo',
      te: 'ఈ ఫోటోను ఉపయోగించండి',
    },
    close: {
      en: 'Cancel',
      te: 'రద్దు చేయండి',
    },
  },

  // Location Modal
  locationModal: {
    title: {
      en: 'Confirm Your Farm Location',
      te: 'మీ పొలం స్థానాన్ని నిర్ధారించండి',
    },
    description: {
      en: 'Crop Radar needs your farm location to provide accurate local weather spray windows and nearby disease report notices.',
      te: 'మీ ప్రాంతానికి సరైన పిచికారీ వాతావరణం మరియు చుట్టుపక్కల తెగుళ్ల హెచ్చరికలను అందించడానికి మీ పొలం ఉన్న జిల్లా లేదా మండలం అవసరం.',
    },
    detectGPS: {
      en: 'Detect GPS Location Automatically',
      te: 'నా జీపీఎస్ లొకేషన్‌ను గుర్తించు',
    },
    detecting: {
      en: 'Detecting coordinates...',
      te: 'గుర్తిస్తున్నాను...',
    },
    orSelectDistrict: {
      en: 'Or Select Andhra Pradesh District / Hub',
      te: 'లేదా ఆంధ్రప్రదేశ్ జిల్లాను ఎంచుకోండి',
    },
    villagePlaceholder: {
      en: 'Village or Mandal Name (Optional)',
      te: 'గ్రామం లేదా మండలం పేరు (ఐచ్ఛికం)',
    },
    saveLocation: {
      en: 'Save Farm Location',
      te: 'స్థానాన్ని భద్రపరచండి',
    },
    privacyGuarantee: {
      en: 'Privacy Guarantee: Exact farm GPS is never shared publicly. Community alerts are fuzzed to 1km grid centroids.',
      te: 'గోప్యతా భరోసా: మీ అసలు జీపీఎస్ ఎవరికీ కనిపించదు. ఇతర రైతులకు 1 కి.మీ అంచనా మాత్రమే కనిపిస్తుంది.',
    },
  },

  // Settings & Alerts Modal
  settingsModal: {
    title: {
      en: 'Farmer Settings & Alert Radius',
      te: 'రైతు సెట్టింగ్‌లు & హెచ్చరిక దూరం',
    },
    alertRadiusTitle: {
      en: 'Outbreak Warning Radius',
      te: 'తెగుళ్ల ముందస్తు హెచ్చరిక దూరం',
    },
    alertRadiusDesc: {
      en: 'Receive nearby disease report notices within this distance; AI-assisted reports are not field-verified.',
      te: 'ఈ పరిధిలోని పంట వ్యాధి నివేదికల హెచ్చరికలు అందుతాయి; AI నివేదికలు క్షేత్రస్థాయిలో ధృవీకరించబడవు.',
    },
    activeCropsTitle: {
      en: 'Your Primary Crops',
      te: 'మీరు పండించే ప్రధాన పంటలు',
    },
    adminConsoleTitle: {
      en: 'Expert Verification Console (Agronomist Review)',
      te: 'వ్యవసాయ నిపుణుల ధృవీకరణ విభాగం',
    },
    adminConsoleDesc: {
      en: 'Pending disease reports from farmers are reviewed here before triggering community-wide alerts.',
      te: 'రైతులు పంపిన నివేదికలను వ్యవసాయ అధికారి ధృవీకరించిన తర్వాతే అందరికీ హెచ్చరికలు వెళ్తాయి.',
    },
    pendingReports: {
      en: 'Pending Reports for Review',
      te: 'పరిశీలనలో ఉన్న నివేదికలు',
    },
    noPendingReports: {
      en: 'No pending reports awaiting review.',
      te: 'ప్రస్తుతం పరిశీలించాల్సిన నివేదికలు ఏవీ లేవు.',
    },
    verifyBtn: {
      en: 'Verify & Alert Neighbors',
      te: 'ధృవీకరించండి (హెచ్చరిక పంపండి)',
    },
    rejectBtn: {
      en: 'Reject',
      te: 'తిరస్కరించండి',
    },
    saveSettings: {
      en: 'Save Preferences',
      te: 'మార్పులను భద్రపరచండి',
    },
  },

  // History Drawer
  historyDrawer: {
    title: {
      en: 'Crop Health History',
      te: 'పంట ఆరోగ్య చరిత్ర',
    },
    subtitle: {
      en: 'Chronological timeline of observed symptoms and applied treatments.',
      te: 'మీ పంటలో గమనించిన లక్షణాలు మరియు పిచికారీ చేసిన మందుల కాలక్రమం.',
    },
    noRecords: {
      en: 'No crop records saved yet. Ask the assistant to diagnose a plant or record a treatment.',
      te: 'ఇంకా ఎటువంటి రికార్డులు లేవు. తెగుళ్ల ఫోటో పంపి సహాయకుడిని అడగండి.',
    },
    viewComparison: {
      en: 'Compare with previous observation',
      te: 'గత పరిశీలనతో పోల్చండి',
    },
  },

  // Card Badges & Headings
  cards: {
    diagnosisTitle: {
      en: 'Suspected Crop Diagnosis',
      te: 'అనుమానిత పంట తెగులు నిర్ధారణ',
    },
    treatmentTitle: {
      en: 'Verified Label Dosage & Tank Mix',
      te: 'ధృవీకరించబడిన మందు మోతాదు & ట్యాంక్ మిక్సింగ్',
    },
    weatherTitle: {
      en: 'Live Spray Weather Assessment',
      te: 'ప్రస్తుత పిచికారీ వాతావరణ సమాచారం',
    },
    alertTitle: {
      en: 'Nearby Disease Outbreak Alert',
      te: 'సమీప తెగుళ్ల ముందస్తు హెచ్చరిక',
    },
    uncertaintyNotice: {
      en: 'Decision Support: Visual symptom pattern match only. Not a laboratory certification.',
      te: 'ముఖ్య గమనిక: ఇది కేవలం దృశ్య లక్షణాల ఆధారంగా చేసిన అంచనా మాత్రమే, ప్రయోగశాల ధృవీకరణ కాదు.',
    },
    safeToSpray: {
      en: 'OPTIMAL TO SPRAY',
      te: 'పిచికారీకి అనుకూలం',
    },
    cautionSpray: {
      en: 'MARGINAL (USE CAUTION)',
      te: 'జాగ్రత్తతో పిచికారీ చేయండి',
    },
    prohibitedSpray: {
      en: 'PROHIBITED (DO NOT SPRAY)',
      te: 'ప్రమాదకరం: పిచికారీ చేయవద్దు',
    },
    dosePerTank: {
      en: 'Dose per 16L Tank',
      te: '16 లీటర్ల ట్యాంకుకు మోతాదు',
    },
    totalProduct: {
      en: 'Total Field Requirement',
      te: 'మొత్తం పొలానికి అవసరమైన మందు',
    },
    activeIngredient: {
      en: 'Active Ingredient',
      te: 'క్రియాశీల రసాయనం',
    },
    preHarvestInterval: {
      en: 'Pre-Harvest Interval (PHI)',
      te: 'కోతకు ముందు వ్యవధి (PHI)',
    },
    rotationWarning: {
      en: 'Resistance Rotation Warning',
      te: 'రెసిస్టెన్స్ మేనేజ్మెంట్ హెచ్చరిక',
    },
  },
};

export function getTranslation(keyPath: string, lang: LanguageCode): string {
  const parts = keyPath.split('.');
  let current: any = TRANSLATIONS;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return keyPath;
    }
  }
  if (current && typeof current === 'object') {
    return current[lang] || current['en'] || keyPath;
  }
  return String(current || keyPath);
}
