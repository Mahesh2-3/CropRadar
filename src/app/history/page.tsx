'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import VoiceAssistantModal from '@/components/VoiceAssistantModal';
import { useLanguage } from '@/context/LanguageContext';
import { SAMPLE_CROP_TIMELINE } from '@/modules/history/recovery-tracker';
import { CropHealthComparisonResponse } from '@/types/api';
import {
  History,
  TrendingUp,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';

export default function HistoryPage() {
  const { language, t } = useLanguage();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const [selectedRecordId, setSelectedRecordId] = useState(SAMPLE_CROP_TIMELINE[2].recordId);
  const [comparisonResult, setComparisonResult] = useState<CropHealthComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComparison = async (currentId: string, prevId?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentRecordId: currentId,
          previousRecordId: prevId,
        }),
      });
      const data: CropHealthComparisonResponse = await res.json();
      setComparisonResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Find index of selected record
    const currentIndex = SAMPLE_CROP_TIMELINE.findIndex((r) => r.recordId === selectedRecordId);
    const prevRecord = currentIndex > 0 ? SAMPLE_CROP_TIMELINE[currentIndex - 1] : undefined;
    fetchComparison(selectedRecordId, prevRecord?.recordId);
  }, [selectedRecordId]);

  const activeRecord = SAMPLE_CROP_TIMELINE.find((r) => r.recordId === selectedRecordId)!;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950">
      <Navbar onOpenVoiceAssistant={() => setIsVoiceOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <History className="w-4 h-4" />
            <span>Module 7: Crop Health History & Recovery Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 dark:text-white">
            {language === 'te' ? 'పంట ఆరోగ్య కాలక్రమం & శాస్త్రీయ రికవరీ' : 'Crop Health History & Recovery Analytics'}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-3xl">
            {language === 'te'
              ? 'ముఖ్యమైన సూచన: కేవలం ఒక ఫోటోను చూసి పూర్తిగా నయమైందని ప్రకటించము. కాలక్రమేణా ఆకుల లక్షణాలు, కొత్త చిగుళ్ల పెరుగుదల మరియు వాతావరణాన్ని పరిశీలించి అనిశ్చితి రేటింగ్‌తో రికవరీని లెక్కిస్తాము.'
              : 'Chronological timeline tracking diagnoses, chemical applications, and visual symptom differentials. Never claims unconditional recovery without observational evidence and explicit uncertainty quantification.'}
          </p>
        </div>

        {/* Timeline Horizontal Stepper */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">
              Chilli Kharif 2026 Cycle Timeline
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold">
              3 Chronological Snapshots
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SAMPLE_CROP_TIMELINE.map((record, idx) => {
              const isSelected = selectedRecordId === record.recordId;
              const date = new Date(record.recordedAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });
              const dayLabel = idx === 0 ? 'Day 0 (Baseline)' : idx === 1 ? 'Day 7 (Mid)' : 'Day 14 (Current)';
              return (
                <div
                  key={record.recordId}
                  onClick={() => setSelectedRecordId(record.recordId)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-600 ring-2 ring-teal-600/20 shadow-md'
                      : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-stone-500">{dayLabel}</span>
                    <span className="text-stone-400">{date}</span>
                  </div>

                  <div className="text-xl font-black text-stone-900 dark:text-white">
                    {record.severityPercentage}% <span className="text-xs font-normal text-stone-500">Severity</span>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 line-clamp-2">
                    {record.farmerObservation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Inspection Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Active Record Detail (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Snapshot Details
              </span>
              <span className="text-xs text-stone-400 font-mono">{activeRecord.recordId}</span>
            </div>

            <div>
              <span className="text-xs font-bold text-stone-500 uppercase block mb-1">
                Visual Symptoms Logged:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeRecord.visualSymptoms.map((sym, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                  >
                    {sym}
                  </span>
                ))}
              </div>
            </div>

            {/* Weather context at observation */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-2">
              <span className="text-xs font-bold text-stone-600 dark:text-stone-300 block">
                Weather Snapshot at Observation:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] text-stone-400 block">Temp</span>
                  <span className="font-bold">{activeRecord.weatherSnapshot.tempC}°C</span>
                </div>
                <div className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] text-stone-400 block">Humidity</span>
                  <span className="font-bold">{activeRecord.weatherSnapshot.humidityPct}%</span>
                </div>
                <div className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] text-stone-400 block">Rain 24h</span>
                  <span className="font-bold">{activeRecord.weatherSnapshot.rainPast24hMm} mm</span>
                </div>
              </div>
            </div>

            {/* Farmer Notes */}
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase block mb-1">
                Farmer Field Observation:
              </span>
              <p className="text-xs text-stone-700 dark:text-stone-300 italic bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
                "{activeRecord.farmerObservation}"
              </p>
            </div>
          </div>

          {/* Differential Comparison & Recovery Analytics (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {comparisonResult && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      Delta Analysis (Over {comparisonResult.timeElapsedDays} Days)
                    </span>
                    <h3 className="text-2xl font-black text-stone-900 dark:text-white capitalize">
                      {comparisonResult.recoveryTrend} Trajectory
                    </h3>
                  </div>

                  {/* Uncertainty Rating Badge */}
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        comparisonResult.uncertaintyScore === 'low'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : comparisonResult.uncertaintyScore === 'moderate'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {comparisonResult.uncertaintyScore} Uncertainty
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-1">Calibrated Metric</span>
                  </div>
                </div>

                {/* Summary Statement */}
                <p className="text-sm font-semibold text-teal-900 dark:text-teal-100 bg-teal-50 dark:bg-teal-950/40 p-4 rounded-2xl border border-teal-200 dark:border-teal-800">
                  {language === 'te' ? comparisonResult.summaryTe : comparisonResult.summaryEn}
                </p>

                {/* 3 Micro-Feature Differential Vectors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase text-stone-500 block">Lesion Margin</span>
                    <span className="text-sm font-extrabold capitalize text-stone-900 dark:text-white">
                      {comparisonResult.symptomDifferential.lesionMarginSpread}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase text-stone-500 block">New Flush Growth</span>
                    <span className="text-sm font-extrabold capitalize text-stone-900 dark:text-white">
                      {comparisonResult.symptomDifferential.newGrowthHealth.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase text-stone-500 block">Chlorosis Vector</span>
                    <span className="text-sm font-extrabold capitalize text-stone-900 dark:text-white">
                      {comparisonResult.symptomDifferential.chlorosisChange}
                    </span>
                  </div>
                </div>

                {/* Observational Evidence List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block">
                    Supporting Observational Points:
                  </span>
                  <ul className="space-y-1.5">
                    {comparisonResult.evidencePoints.map((ev: string, i: number) => (
                      <li key={i} className="text-xs text-stone-600 dark:text-stone-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Uncertainty Explanation */}
                <div className="p-4 bg-stone-100 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-800 dark:text-stone-200 block mb-0.5">Scientific Uncertainty Bounds:</strong>
                    {comparisonResult.uncertaintyExplanation}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
}
