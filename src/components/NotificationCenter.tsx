'use client';

import { AlertTriangle, Bell, Check, MapPin, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { FarmerNotification } from '@/types/chat';

interface NotificationCenterProps {
  isOpen: boolean;
  isLoading: boolean;
  notifications: FarmerNotification[];
  error: string | null;
  onClose: () => void;
  onSelect: (notification: FarmerNotification) => void;
}

export default function NotificationCenter({
  isOpen,
  isLoading,
  notifications,
  error,
  onClose,
  onSelect,
}: NotificationCenterProps) {
  const { language } = useLanguage();
  const isTelugu = language === 'te';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose}>
      <aside
        aria-label={isTelugu ? 'హెచ్చరికలు' : 'Notifications'}
        className="ml-auto flex h-full w-[min(420px,94vw)] flex-col border-l border-stone-200 bg-stone-50 shadow-2xl dark:border-stone-800 dark:bg-stone-950"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-4 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-900 text-lime-300">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                {isTelugu ? 'సమీప పంట హెచ్చరికలు' : 'Nearby crop alerts'}
              </h2>
              <p className="text-[11px] text-stone-500">
                {isTelugu ? 'సమీప పంట నివేదికలు; AI నివేదికలు క్షేత్రస్థాయిలో ధృవీకరించబడవు' : 'Nearby crop reports; AI-assisted reports are not field-verified'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800"
            aria-label={isTelugu ? 'మూసివేయండి' : 'Close'}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p role="alert" className="mx-3 mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            {error}
          </p>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {isLoading ? (
            <p className="py-10 text-center text-xs text-stone-500">
              {isTelugu ? 'హెచ్చరికలను లోడ్ చేస్తోంది...' : 'Loading alerts...'}
            </p>
          ) : notifications.length ? (
            notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => onSelect(notification)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  notification.read
                    ? 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                    : 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${notification.severity === 'severe' ? 'text-red-600' : 'text-amber-600'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-stone-900 dark:text-white">
                        {isTelugu ? notification.titleTe : notification.titleEn}
                      </span>
                      {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />}
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-stone-600 dark:text-stone-300">
                      {isTelugu ? notification.messageTe : notification.messageEn}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-stone-500">
                      <MapPin className="h-3 w-3" />
                      <span>{(Number.isFinite(Number(notification.distanceKm)) ? Number(notification.distanceKm) : 0).toFixed(1)} km</span>
                      <span>·</span>
                      <span>{isTelugu ? notification.cropTe : notification.crop}</span>
                      <span>·</span>
                      <span>{new Date(notification.createdAt).toLocaleDateString(isTelugu ? 'te-IN' : 'en-IN')}</span>
                    </div>
                    <div className="mt-2 rounded-lg border border-emerald-200 bg-white/80 p-2 text-[11px] leading-5 text-stone-700 dark:border-emerald-900 dark:bg-stone-900 dark:text-stone-200">
                      <strong>{isTelugu ? 'సూచించిన చర్య: ' : 'Suggested action: '}</strong>
                      {isTelugu ? notification.recommendedActionTe : notification.recommendedActionEn}
                    </div>
                    <span className={`mt-2 inline-flex items-center gap-1 text-[10px] font-semibold ${
                      notification.type === 'verified-outbreak'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-amber-700 dark:text-amber-300'
                    }`}>
                      {notification.type === 'verified-outbreak' ? (
                        <>
                          <Check className="h-3 w-3" />
                          {isTelugu ? 'వ్యవసాయ అధికారిచే ధృవీకరించబడింది' : 'Verified by an agronomist'}
                        </>
                      ) : (
                        isTelugu ? 'క్షేత్రస్థాయిలో ధృవీకరించబడలేదు' : 'Not field-verified'
                      )}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-5 py-12 text-center">
              <Bell className="mx-auto h-6 w-6 text-stone-300" />
              <p className="mt-3 text-xs leading-5 text-stone-500">
                {isTelugu ? 'మీ 5 కి.మీ పరిధిలో కొత్త పంట నివేదికలు లేవు.' : 'No new crop reports within 5 km of your farm.'}
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}