'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SAMPLE_CROP_TIMELINE } from '@/modules/history/recovery-tracker';
import { History, X, Calendar, Activity, CheckCircle2, ChevronRight } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecordQuestion?: (query: string) => void;
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  onSelectRecordQuestion,
}: HistoryDrawerProps) {
  const { language, t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-lime-400" />
            <div>
              <h3 className="font-bold text-sm">{t('historyDrawer.title')}</h3>
              <span className="text-[10px] text-emerald-300 block">Chilli Kharif Cycle</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-emerald-900 text-stone-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
          <p className="text-stone-500 dark:text-stone-400 text-xs leading-relaxed">
            {t('historyDrawer.subtitle')}
          </p>

          <div className="space-y-3">
            {SAMPLE_CROP_TIMELINE.map((rec, idx) => {
              const dayLabel = idx === 0 ? 'Day 0 (Baseline)' : idx === 1 ? 'Day 7 (Mid)' : 'Day 14 (Current)';
              const date = new Date(rec.recordedAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={rec.recordId}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 space-y-2 hover:border-emerald-500 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700 dark:text-lime-400">{dayLabel}</span>
                    <span className="text-stone-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {date}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-black text-stone-900 dark:text-white">
                      {rec.severityPercentage}% {language === 'te' ? 'లక్షణ తీవ్రత' : 'Severity'}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {rec.weatherSnapshot.tempC}°C • {rec.weatherSnapshot.windSpeedKmh} km/h
                    </span>
                  </div>

                  <p className="text-stone-600 dark:text-stone-300 text-xs italic">
                    "{rec.farmerObservation}"
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {rec.visualSymptoms.map((sym, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] bg-white dark:bg-stone-900 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                      >
                        {sym}
                      </span>
                    ))}
                  </div>

                  {onSelectRecordQuestion && (
                    <button
                      onClick={() => {
                        onClose();
                        onSelectRecordQuestion(
                          language === 'te'
                            ? `నా ${dayLabel} పంట పరిశీలనను వివరించు మరియు ప్రస్తుత రికవరీని పోల్చు.`
                            : `Explain my ${dayLabel} observation and compare recovery.`
                        );
                      }}
                      className="w-full mt-2 pt-2 border-t border-stone-200 dark:border-stone-700 text-[11px] font-bold text-emerald-600 dark:text-lime-400 flex items-center justify-between hover:underline cursor-pointer"
                    >
                      <span>{language === 'te' ? 'ఈ రికార్డు గురించి అడగండి' : 'Ask Assistant about this record'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
