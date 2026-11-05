'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { AlertRadiusKm, DiseaseReport } from '@/types/models';
import {
  Settings,
  Radio,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertRadiusKm: AlertRadiusKm;
  onChangeRadius: (radius: AlertRadiusKm) => void;
  activeCrops: string[];
  onChangeCrops: (crops: string[]) => void;
  onRefreshAlerts?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  alertRadiusKm,
  onChangeRadius,
  activeCrops,
  onChangeCrops,
  onRefreshAlerts,
}: SettingsModalProps) {
  const { language, t } = useLanguage();

  const [pendingReports, setPendingReports] = useState<DiseaseReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const availableRadiusOptions: AlertRadiusKm[] = [1, 3, 5, 10, 15];
  const allCrops = [
    { id: 'Chilli', nameEn: 'Chilli', nameTe: 'మిరప' },
    { id: 'Paddy', nameEn: 'Paddy / Rice', nameTe: 'వరి' },
    { id: 'Cotton', nameEn: 'Cotton', nameTe: 'పత్తి' },
    { id: 'Tomato', nameEn: 'Tomato', nameTe: 'టమోటా' },
    { id: 'Groundnut', nameEn: 'Groundnut', nameTe: 'వేరుశనగ' },
  ];

  const fetchPendingReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await fetch('/api/alerts/verify');
      const data = await res.json();
      if (res.status === 403) {
        setActionMessage(
          language === 'te'
            ? 'నివేదికలను ధృవీకరించడానికి వ్యవసాయ అధికారి అనుమతి అవసరం.'
            : 'Agronomist authorization is required to review outbreak reports.'
        );
        return;
      }
      if (data.success && data.pending) {
        setPendingReports(data.pending);
      }
    } catch (e) {
      console.warn('Failed to fetch pending reports', e);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPendingReports();
      setActionMessage(null);
    }
  }, [isOpen]);

  const handleVerify = async (reportId: string, approved: boolean) => {
    try {
      const res = await fetch('/api/alerts/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          approved,
          verifierName: 'Agricultural Officer (AP Agri Dept)',
          verifierNotes: approved ? 'Field symptoms verified by extension agronomist.' : 'Report rejected: lack of evidence.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(
          language === 'te'
            ? approved
              ? `నివేదిక ధృవీకరించబడింది. ${data.notifiedFarmers || 0} మంది సమీప రైతులకు హెచ్చరిక పంపబడింది.`
              : 'నివేదిక తిరస్కరించబడింది.'
            : data.message || 'Report review completed.'
        );
        fetchPendingReports();
        if (onRefreshAlerts) onRefreshAlerts();
      } else {
        setActionMessage(data.error || (language === 'te' ? 'నివేదికను పరిశీలించలేకపోయాం.' : 'Could not review this report.'));
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Verification failed');
    }
  };

  const toggleCrop = (cropId: string) => {
    if (activeCrops.includes(cropId)) {
      onChangeCrops(activeCrops.filter((c) => c !== cropId));
    } else {
      onChangeCrops([...activeCrops, cropId]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-lime-400" />
            <h3 className="font-bold text-sm">{t('settingsModal.title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-emerald-900 text-stone-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto text-xs text-stone-600 dark:text-stone-300">
          {/* Alert Radius */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-stone-900 dark:text-white text-xs">
                {t('settingsModal.alertRadiusTitle')}
              </label>
              <span className="text-xs font-black text-emerald-600 dark:text-lime-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                {alertRadiusKm} {language === 'te' ? 'కి.మీ' : 'km'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-snug">
              {t('settingsModal.alertRadiusDesc')}
            </p>
            <div className="grid grid-cols-5 gap-2 pt-1">
              {availableRadiusOptions.map((rad) => (
                <button
                  key={rad}
                  onClick={() => onChangeRadius(rad)}
                  className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    alertRadiusKm === rad
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-emerald-500'
                  }`}
                >
                  {rad} {language === 'te' ? 'కి.మీ' : 'km'}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Crops */}
          <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <label className="font-bold uppercase tracking-wider text-stone-900 dark:text-white text-xs block">
              {t('settingsModal.activeCropsTitle')}
            </label>
            <div className="flex flex-wrap gap-2">
              {allCrops.map((c) => {
                const isSelected = activeCrops.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCrop(c.id)}
                    className={`px-3 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {language === 'te' ? c.nameTe : c.nameEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agronomist Verification Console (Expert Review) */}
          <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {t('settingsModal.adminConsoleTitle')}
              </span>
              <button
                onClick={fetchPendingReports}
                className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingReports ? 'animate-spin' : ''}`} />
                <span>{language === 'te' ? 'తాజాకరించు' : 'Refresh'}</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-500 leading-snug">
              {t('settingsModal.adminConsoleDesc')}
            </p>

            {actionMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-center font-semibold">
                {actionMessage}
              </div>
            )}

            {pendingReports.length > 0 ? (
              <div className="space-y-2 mt-2">
                {pendingReports.map((report) => (
                  <div
                    key={report.reportId}
                    className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Pending Review
                        </span>
                        <h4 className="font-bold text-sm text-stone-900 dark:text-white mt-1">
                          {language === 'te' ? report.diseaseNameTe : report.diseaseName}
                        </h4>
                        <span className="text-[11px] text-stone-500">
                          {report.crop} • {report.approximateLocation?.areaName || 'Local plot'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleVerify(report.reportId, true)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('settingsModal.verifyBtn')}</span>
                      </button>
                      <button
                        onClick={() => handleVerify(report.reportId, false)}
                        className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-stone-400 text-xs">
                {t('settingsModal.noPendingReports')}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer"
          >
            {t('settingsModal.saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
}
