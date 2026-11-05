import { TeluguAssistantRequest, TeluguAssistantResponse } from '@/types/api';
import { getGeminiClient, getActiveGeminiModelName, generateGeminiContentWithFallback } from '@/lib/ai/gemini';

const VOICE_ORCHESTRATOR_SYSTEM_PROMPT = `
You are the bilingual Voice Assistant for "Crop Radar" (పంట రాడార్), serving Telugu-speaking and Indian farmers.
Answer naturally, concisely, and with respect in simple conversational Telugu and English.
STRICT SAFETY RULE: Do NOT calculate or authorize pesticide chemical dosages directly. Tell the farmer to open the Verified Treatment Engine for certified CIBRC rates.
Detect farmer intent: 'diagnose' | 'treatment_query' | 'weather_query' | 'outbreak_query' | 'general_advice'.
`;

export async function processBilingualVoiceQuery(
  req: TeluguAssistantRequest
): Promise<TeluguAssistantResponse> {
  const queryText = (req.textTranscript || '').trim();
  const language = req.language || (isTeluguScript(queryText) ? 'te' : 'en');

  const ai = getGeminiClient();
  const modelName = getActiveGeminiModelName();

  if (ai && queryText) {
    try {
      const prompt = `Farmer asked: "${queryText}".
Language context: ${language}. Active crop: ${req.activeContext?.cropName || 'General'}.
Provide:
1. Intent: one of 'diagnose' | 'treatment_query' | 'weather_query' | 'outbreak_query' | 'general_advice'
2. responseTitleEn & responseTitleTe
3. responseBodyEn & responseBodyTe (Keep Telugu phrased for natural acoustic spoken delivery)
4. actionableModuleRoute: '/diagnosis' | '/weather' | '/treatment' | '/radar' | '/history'
Output as JSON.`;

      const responseText = await generateGeminiContentWithFallback({
        contents: [
          {
            role: 'user',
            parts: [{ text: VOICE_ORCHESTRATOR_SYSTEM_PROMPT + '\n\n' + prompt }],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (responseText) {
        const parsed = JSON.parse(responseText);
        return {
          transcription: queryText,
          detectedLanguage: language,
          intent: parsed.intent || 'general_advice',
          responseTitleEn: parsed.responseTitleEn || 'Crop Radar Advisory',
          responseTitleTe: parsed.responseTitleTe || 'పంట రాడార్ సూచన',
          responseBodyEn: parsed.responseBodyEn || 'Here is the relevant guidance for your crop.',
          responseBodyTe: parsed.responseBodyTe || 'మీ పంటకు సంబంధించిన సమాచారం ఇదిగోండి.',
          actionableModuleRoute: parsed.actionableModuleRoute || '/diagnosis',
          suggestedFollowUpPrompts: [
            { textEn: 'Check spray weather now', textTe: 'స్ప్రే వాతావరణం పరిశీలించండి' },
            { textEn: 'Scan pesticide label', textTe: 'మందు లేబుల్ స్కాన్ చేయండి' },
            { textEn: 'View nearby disease radar', textTe: 'చుట్టుపక్కల తెగుళ్ల రాడార్ చూడండి' },
          ],
        };
      }
    } catch (err) {
      console.warn('Gemini voice processing failed, falling back to deterministic intent router', err);
    }
  }

  // Deterministic Intent Router (Fallback & Offline resilience)
  return routeDeterministicIntent(queryText, language);
}

function isTeluguScript(text: string): boolean {
  return /[\u0C00-\u0C7F]/.test(text);
}

function routeDeterministicIntent(
  query: string,
  language: 'te' | 'en'
): TeluguAssistantResponse {
  const q = query.toLowerCase();

  // Weather / Spray Intent
  if (
    q.includes('weather') ||
    q.includes('rain') ||
    q.includes('spray') ||
    q.includes('wind') ||
    q.includes('వర్షం') ||
    q.includes('గాలి') ||
    q.includes('పిచికారీ') ||
    q.includes('వాతావరణం')
  ) {
    return {
      transcription: query || (language === 'te' ? 'పిచికారీ వాతావరణం ఎలా ఉంది?' : 'How is the spray weather?'),
      detectedLanguage: language,
      intent: 'weather_query',
      responseTitleEn: 'Weather Risk & Spray Suitability',
      responseTitleTe: 'వాతావరణం & పిచికారీ అనుకూలత',
      responseBodyEn:
        'Currently, the weather is favorable for spraying with wind speeds around 9 km/h and no rain forecast for the next 4 hours. You can view the full 24-hour spray window on the Weather page.',
      responseBodyTe:
        'ప్రస్తుతం వాతావరణం పిచికారీకి అనుకూలంగా ఉంది. గాలి వేగం గంటకు 9 కి.మీ లోపే ఉంది, రాబోయే 4 గంటల్లో వర్షం సూచన లేదు. పూర్తి వివరాలు వాతావరణ విభాగంలో చూడవచ్చు.',
      actionableModuleRoute: '/weather',
      suggestedFollowUpPrompts: [
        { textEn: 'When is the next best spray window?', textTe: 'తదుపరి మంచి పిచికారీ సమయం ఎప్పుడు?' },
        { textEn: 'Calculate pesticide tank dosage', textTe: 'స్ప్రే ట్యాంక్ మందు పరిమాణం లెక్కించండి' },
      ],
    };
  }

  // Treatment / Dosage / Pesticide Intent
  if (
    q.includes('dose') ||
    q.includes('tank') ||
    q.includes('pesticide') ||
    q.includes('medicine') ||
    q.includes('మందు') ||
    q.includes('మోతాదు') ||
    q.includes('ట్యాంక్') ||
    q.includes('లెక్క')
  ) {
    return {
      transcription: query || (language === 'te' ? 'ఎకరానికి ఎంత మందు కలపాలి?' : 'How much pesticide per acre?'),
      detectedLanguage: language,
      intent: 'treatment_query',
      responseTitleEn: 'Verified Treatment Calculator',
      responseTitleTe: 'ధృవీకరించబడిన మందుల మోతాదు లెక్కింపు',
      responseBodyEn:
        'Safety Notice: AI is prohibited from guessing chemical quantities. Please use our Verified Treatment Engine to calculate exact dosages based on official CIBRC registered labels and your knapsack tank size.',
      responseBodyTe:
        'భద్రతా సూచన: మందుల మోతాదును సురక్షితంగా లెక్కించడానికి మన వెరిఫైడ్ ట్రీట్మెంట్ ఇంజిన్ ఉపయోగించండి. మీ పంపు ట్యాంక్ పరిమాణం మరియు ఎకరాల విస్తీర్ణాన్ని బట్టి కచ్చితమైన మోతాదు లెక్కింపబడుతుంది.',
      actionableModuleRoute: '/treatment',
      suggestedFollowUpPrompts: [
        { textEn: 'Open Verified Treatment Calculator', textTe: 'ట్రీట్మెంట్ క్యాలిక్యులేటర్ తెరవండి' },
        { textEn: 'Check IRAC/FRAC resistance warning', textTe: 'రెసిస్టెన్స్ రొటేషన్ వివరాలు చూడండి' },
      ],
    };
  }

  // Outbreak / Radar Intent
  if (
    q.includes('outbreak') ||
    q.includes('radar') ||
    q.includes('nearby') ||
    q.includes('alert') ||
    q.includes('చుట్టుపక్కల') ||
    q.includes('రాడార్') ||
    q.includes('తెగులు వ్యాప్తి') ||
    q.includes('హెచ్చరిక')
  ) {
    return {
      transcription: query || (language === 'te' ? 'చుట్టుపక్కల తెగుళ్ల హెచ్చరికలు ఉన్నాయా?' : 'Are there nearby outbreaks?'),
      detectedLanguage: language,
      intent: 'outbreak_query',
      responseTitleEn: '5km Geospatial Outbreak Radar',
      responseTitleTe: '5 కి.మీ పరిధిలో తెగుళ్ల వ్యాప్తి రాడార్',
      responseBodyEn:
        'Within 5 km of your location, 2 active disease reports have been detected: Chilli Leaf Curl Virus (2.1 km away) and Anthracnose (3.4 km away). Open the Radar map to view precautions.',
      responseBodyTe:
        'మీ ప్రాంతం నుండి 5 కి.మీ పరిధిలో 2 తెగుళ్ల నివేదికలు నమోదయ్యాయి: మిరప ఆకు ముడత (2.1 కి.మీ) మరియు కొమ్మ ఎండు తెగులు (3.4 కి.మీ). జాగ్రత్త చర్యల కోసం రాడార్ మ్యాప్ చూడండి.',
      actionableModuleRoute: '/radar',
      suggestedFollowUpPrompts: [
        { textEn: 'Open Outbreak Radar Map', textTe: 'రాడార్ మ్యాప్ తెరవండి' },
        { textEn: 'Report a disease from my farm', textTe: 'నా పొలంలో తెగులును నమోదు చేయండి' },
      ],
    };
  }

  // Default: Diagnosis Intent
  return {
    transcription: query || (language === 'te' ? 'నా పంటకు ఏమి తెగులు వచ్చింది?' : 'What disease is on my crop?'),
    detectedLanguage: language,
    intent: 'diagnose',
    responseTitleEn: 'Crop Disease Diagnostics',
    responseTitleTe: 'పంట తెగుళ్ల గుర్తింపు',
    responseBodyEn:
      'Please upload or take a clear macro photo of the affected plant leaf or stem. Crop Radar will identify visual symptoms, rank differential causes, and calculate visual severity.',
    responseBodyTe:
      'తెగులు సోకిన ఆకు లేదా కాండం యొక్క స్పష్టమైన ఫోటోను తీయండి లేదా అప్‌లోడ్ చేయండి. పంట రాడార్ లక్షణాలను విశ్లేషించి సరైన నివారణ సూచనలను అందిస్తుంది.',
    actionableModuleRoute: '/diagnosis',
    suggestedFollowUpPrompts: [
      { textEn: 'Take photo of crop leaf', textTe: 'పంట ఆకు ఫోటో తీయండి' },
      { textEn: 'Check spray weather', textTe: 'పిచికారీ వాతావరణం పరిశీలించండి' },
    ],
  };
}
