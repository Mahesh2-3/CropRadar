'use client';

import React, { useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ContextualCardType } from '@/types/api';
import {
  Volume2,
  Sparkles,
  ShieldAlert,
  FlaskConical,
  CloudSun,
  Radio,
  History,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Droplet,
  Wind,
  Thermometer,
  ShieldCheck,
  Zap,
  MapPin,
  Bell,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'farmer' | 'assistant';
  text: string;
  textTe?: string;
  textEn?: string;
  spokenTextTe?: string;
  spokenTextEn?: string;
  imageBase64?: string;
  card?: {
    type: ContextualCardType;
    data: any;
  };
  cropSelectionPrompt?: boolean;
  timestamp: string;
}

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSpeakMessage: (msg: ChatMessage) => void;
  onSelectQuickQuery: (query: string, queryTe?: string, queryEn?: string) => void;
  onSelectCrop: (cropName: string) => void;
}

export default function ChatContainer({
  messages,
  isLoading,
  onSpeakMessage,
  onSelectQuickQuery,
  onSelectCrop,
}: ChatContainerProps) {
  const { language, t } = useLanguage();
  const bottomRef = useRef<HTMLDivElement>(null);
  const cropOptions = [
    { name: 'Chilli', labelTe: 'మిరప' },
    { name: 'Paddy', labelTe: 'వరి' },
    { name: 'Cotton', labelTe: 'పత్తి' },
    { name: 'Tomato', labelTe: 'టమాటా' },
    { name: 'Groundnut', labelTe: 'వేరుశనగ' },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickChips = [
    {
      title: t('quickChips.diagnose'),
      queryTe: 'నా పంటకు ఏదో తెగులు వచ్చింది, ఏ మందు వాడాలి?',
      queryEn: 'Can you help diagnose a disease on my crop?',
    },
    {
      title: t('quickChips.weather'),
      queryTe: 'ఈ రోజు మా పొలంలో మందు పిచికారీ చేయడానికి వాతావరణం అనుకూలమేనా?',
      queryEn: 'Is the weather suitable for spraying pesticide right now?',
    },
    {
      title: t('quickChips.treatment'),
      queryTe: 'రెండు ఎకరాల పంటకు పంపు ట్యాంకుకు ఎంత మందు కలపాలి?',
      queryEn: 'How much pesticide should I mix per tank for 2 acres?',
    },
    {
      title: t('quickChips.outbreaks'),
      queryTe: 'మా ప్రాంతంలో ఇతర పొలాల్లో ఏవైనా తెగుళ్లు వ్యాపిస్తున్నాయా?',
      queryEn: 'Are there any verified disease outbreaks near my farm?',
    },
    {
      title: t('quickChips.history'),
      queryTe: 'గతంలో నా పొలంలో నమోదైన వివరాలు మరియు వాడిన మందులు చూపించు.',
      queryEn: 'Show my previous crop observations and recorded treatments.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-28 max-w-4xl mx-auto w-full">
      {/* Initial Welcome Banner if no messages yet */}
      {messages.length === 0 && (
        <div className="py-8 text-center space-y-4 max-w-2xl mx-auto animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-lime-400 text-emerald-950 flex items-center justify-center mx-auto shadow-xl">
            <Radio className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white leading-snug">
            {t('welcomeHeading')}
          </h2>

          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed max-w-lg mx-auto">
            {t('welcomeSubtitle')}
          </p>

          {/* Quick Suggestion Chips */}
          <div className="pt-4 flex flex-wrap justify-center gap-2">
            {quickChips.map((chip, idx) => {
              const activeQuery = language === 'te' ? chip.queryTe : chip.queryEn;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectQuickQuery(activeQuery, chip.queryTe, chip.queryEn)}
                  className="text-xs px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-lime-400 shadow-sm transition-all cursor-pointer font-medium"
                >
                  {chip.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages Feed */}
      {messages.map((msg) => {
        const displayText = language === 'te' ? (msg.textTe || msg.text) : (msg.textEn || msg.text);

        return (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'farmer' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 ${
                msg.sender === 'farmer'
                  ? 'bg-emerald-800 text-white rounded-br-xs'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 rounded-bl-xs'
              }`}
            >
              {/* Uploaded Image preview inside farmer bubble */}
              {msg.imageBase64 && (
                <div className="rounded-2xl overflow-hidden border border-white/20 max-w-sm max-h-60 bg-black/10">
                  <img
                    src={msg.imageBase64}
                    alt="Uploaded crop or label"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Message Body Text */}
              <p className="text-sm leading-relaxed whitespace-pre-line font-medium">
                {displayText}
              </p>

              {/* Contextual Card (if present) */}
              {msg.card && (
                <div className="pt-2">
                  {msg.card.type === 'crop_diagnosis' && (
                    <DiagnosisCard data={msg.card.data} language={language} />
                  )}
                  {msg.card.type === 'pesticide_treatment' && (
                    <TreatmentCard data={msg.card.data} language={language} />
                  )}
                  {msg.card.type === 'weather_spray' && (
                    <WeatherCard data={msg.card.data} language={language} />
                  )}
                  {msg.card.type === 'disease_outbreak_alert' && (
                    <OutbreakAlertCard data={msg.card.data} language={language} />
                  )}
                  {msg.card.type === 'crop_history' && (
                    <HistorySummaryCard data={msg.card.data} language={language} />
                  )}
                </div>
              )}

              {msg.cropSelectionPrompt && (
                <div className="flex flex-wrap gap-2">
                  {cropOptions.map((crop) => (
                    <button
                      key={crop.name}
                      type="button"
                      onClick={() => onSelectCrop(crop.name)}
                      className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100 dark:hover:bg-emerald-900"
                    >
                      {language === 'te' ? crop.labelTe : crop.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Assistant Actions Bar: Listen / Replay */}
              {msg.sender === 'assistant' && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onSpeakMessage(msg)}
                    className="flex items-center gap-1.5 text-emerald-700 dark:text-lime-400 font-bold hover:underline cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{language === 'te' ? 'వినండి' : 'Listen'}</span>
                  </button>
                  <span className="text-[10px] text-stone-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 shadow-sm flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {language === 'te' ? 'విశ్లేషిస్తున్నాను...' : 'Analyzing crop intelligence...'}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

// ==========================================
// CONTEXTUAL CARDS RENDERED IN CONVERSATION
// ==========================================

function DiagnosisCard({ data, language }: { data: any; language: 'te' | 'en' }) {
  const isTe = language === 'te';
  const biologicalAdvice = isTe
    ? data.recommendedActionOverview?.biologicalOptionTe || data.recommendedActionOverview?.biologicalOption
    : data.recommendedActionOverview?.biologicalOption;
  return (
    <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-3 text-xs">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-lime-400 block">
            {isTe ? 'అనుమానిత తెగులు' : 'Suspected Diagnosis'}
          </span>
          <h4 className="text-base font-black text-stone-900 dark:text-white mt-0.5">
            {isTe ? data.primaryCandidate?.diseaseNameTe : data.primaryCandidate?.diseaseNameEn}
          </h4>
          <span className="text-[10px] text-stone-500 italic block">
            {data.primaryCandidate?.scientificName}
          </span>
        </div>
        <div className="text-right">
          <span className="text-lg font-black text-emerald-700 dark:text-lime-400">
            {Math.round((data.primaryCandidate?.symptomMatchConfidence || 0.85) * 100)}%
          </span>
          <span className="text-[9px] text-stone-400 block">{isTe ? 'విజువల్ పోలిక' : 'Match Metric'}</span>
        </div>
      </div>

      {/* Visual Evidence */}
      <div>
        <span className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
          {isTe ? 'గుర్తించిన లక్షణాలు:' : 'Observed Symptoms:'}
        </span>
        <ul className="space-y-1">
          {(isTe ? data.primaryCandidate?.visualEvidenceTe : data.primaryCandidate?.visualEvidence)?.map((ev: string, i: number) => (
            <li key={i} className="flex items-start gap-1.5 text-stone-600 dark:text-stone-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{ev}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cultural & Biological Advice */}
      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1 text-emerald-900 dark:text-emerald-100">
        <strong className="block text-[11px] font-bold">
          {isTe ? 'తక్షణ నివారణ చర్యలు:' : 'Recommended Action:'}
        </strong>
        <p>
          {isTe
            ? data.recommendedActionOverview?.culturalAdviceTe || 'స్థానిక వ్యవసాయ అధికారుల సూచనలు పాటించండి.'
            : data.recommendedActionOverview?.culturalAdvice}
        </p>
      </div>

      {biologicalAdvice && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
          <strong className="mb-1 block text-[11px]">
            {isTe ? 'జీవ నియంత్రణ సూచన:' : 'Biological control option:'}
          </strong>
          <p>{biologicalAdvice}</p>
        </div>
      )}

      {data.recommendedActionOverview?.chemicalGuidanceRef && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-purple-950 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-100">
          <strong className="mb-1 block text-[11px]">
            {isTe ? 'రసాయన మందుల భద్రత:' : 'Chemical treatment safety:'}
          </strong>
          <p>{data.recommendedActionOverview.chemicalGuidanceRef}</p>
        </div>
      )}

      {/* Uncertainty Notice */}
      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-200">
        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
        <span>
          {isTe
            ? data.primaryCandidate?.uncertaintyNoticeTe || 'ఈ అంచనా ఫోటోలో కనిపించిన లక్షణాల ఆధారంగా మాత్రమే ఇచ్చాం.'
            : data.primaryCandidate?.uncertaintyNotice || data.disclaimer}
        </span>
      </div>
    </div>
  );
}


function TreatmentCard({ data, language }: { data: any; language: 'te' | 'en' }) {
  const isTe = language === 'te';
  const dp = data.dosageParameters;
  return (
    <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-3 text-xs">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
        <div>
          <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">
            {isTe ? 'CIBRC ధృవీకరించిన రసాయనం' : 'CIBRC Registered Formulation'}
          </span>
          <h4 className="text-base font-black text-stone-900 dark:text-white">
            {data.tradeName}
          </h4>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {isTe ? 'ఆమోదించబడింది' : 'Approved'}
        </span>
      </div>

      {/* Dose Cards */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800">
          <span className="text-[10px] font-semibold text-purple-800 dark:text-purple-300 uppercase block">
            {isTe ? '16L ట్యాంకుకు మోతాదు' : 'Dose per 16L Tank'}
          </span>
          <span className="text-lg font-black text-purple-950 dark:text-white">
            {dp?.dosePerKnapsackTank?.amount} {dp?.dosePerKnapsackTank?.unit}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <span className="text-[10px] font-semibold text-stone-500 uppercase block">
            {isTe ? 'మొత్తం అవసరం' : 'Total Field Amount'}
          </span>
          <span className="text-lg font-black text-stone-900 dark:text-white">
            {dp?.totalFormulationRequired?.amount} {dp?.totalFormulationRequired?.unit}
          </span>
        </div>
      </div>

      {/* Rotation Warning */}
      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] flex items-start gap-2">
        <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
        <span>{isTe ? data.resistanceProfile?.rotationAdviceTe : data.resistanceProfile?.rotationAdviceEn}</span>
      </div>
    </div>
  );
}


function WeatherCard({ data, language }: { data: any; language: 'te' | 'en' }) {
  const isTe = language === 'te';
  const cur = data.currentConditions;
  const isOpt = data.spraySuitability?.status === 'OPTIMAL';
  const isMarg = data.spraySuitability?.status === 'MARGINAL';

  return (
    <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            isOpt
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : isMarg
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
          }`}
        >
          {data.spraySuitability?.status}
        </span>
        <span className="text-stone-400 text-[11px]">Open-Meteo Live</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <Wind className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
          <span className="font-bold block">{cur?.windSpeedKmh} km/h</span>
          <span className="text-[10px] text-stone-400">{isTe ? 'గాలి వేగం' : 'Wind'}</span>
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <Thermometer className="w-4 h-4 mx-auto text-amber-600 mb-1" />
          <span className="font-bold block">{cur?.temperatureC}°C</span>
          <span className="text-[10px] text-stone-400">{isTe ? 'ఉష్ణోగ్రత' : 'Temp'}</span>
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <Droplet className="w-4 h-4 mx-auto text-blue-600 mb-1" />
          <span className="font-bold block">{cur?.relativeHumidityPct}%</span>
          <span className="text-[10px] text-stone-400">{isTe ? 'తేమ' : 'Humidity'}</span>
        </div>
      </div>

      <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
        {isTe ? data.spraySuitability?.summaryTe : data.spraySuitability?.summaryEn}
      </p>
    </div>
  );
}


function OutbreakAlertCard({ data, language }: { data: any; language: 'te' | 'en' }) {
  const isTe = language === 'te';
  const first = data.nearbyReports?.[0];

  return (
    <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase text-red-600 flex items-center gap-1">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>{isTe ? 'సమీప వ్యాప్తి హెచ్చరిక' : '5km Verified Outbreak'}</span>
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
          {data.totalNearbyOutbreaks} {isTe ? 'నివేదికలు' : 'Reports'}
        </span>
      </div>

      {first && (
        <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-stone-900 dark:text-white">
              {isTe ? first.diseaseNameTe : first.diseaseNameEn}
            </h5>
            <span className="font-black text-emerald-600 dark:text-lime-400">
              {first.distanceKm} km {isTe ? 'దూరం' : 'away'}
            </span>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-stone-300">
            <strong>{isTe ? 'ముందస్తు రక్షణ:' : 'Precaution:'}</strong>{' '}
            {isTe ? first.recommendedPrecautionTe : first.recommendedPrecautionEn}
          </p>
        </div>
      )}
    </div>
  );
}


function HistorySummaryCard({ data, language }: { data: any; language: 'te' | 'en' }) {
  const isTe = language === 'te';
  return (
    <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-3.5 space-y-2 text-xs">
      <span className="text-[10px] font-bold uppercase text-teal-600 flex items-center gap-1">
        <History className="w-3.5 h-3.5" />
        <span>{isTe ? 'నమోదైన పంట కాలక్రమం' : 'Recorded Timeline Records'}</span>
      </span>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {data.records?.map((r: any, idx: number) => (
          <div key={idx} className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <span className="text-[9px] text-stone-400 block">Day {idx * 7}</span>
            <span className="font-bold text-xs">{r.severityPercentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
