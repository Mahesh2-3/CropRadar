'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import VoiceAssistantModal from '@/components/VoiceAssistantModal';
import { useLanguage } from '@/context/LanguageContext';
import { VERIFIED_PESTICIDES } from '@/config/pesticide-registry';
import { TreatmentCalculationResponse } from '@/types/api';
import {
  FlaskConical,
  ShieldCheck,
  AlertOctagon,
  Scale,
  Droplet,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  FileText,
  AlertTriangle,
  RotateCcw,
  Zap,
} from 'lucide-react';

function TreatmentCalculatorContent() {
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();

  // Form states
  const initialCrop = searchParams.get('crop') || 'Chilli';
  const initialDisease = searchParams.get('disease') || 'Anthracnose';

  const [selectedCrop, setSelectedCrop] = useState(initialCrop);
  const [selectedProductId, setSelectedProductId] = useState(VERIFIED_PESTICIDES[0].productId);
  const [fieldAcreage, setFieldAcreage] = useState<number>(2.0);
  const [knapsackCapacity, setKnapsackCapacity] = useState<number>(16); // 16 Liters standard

  const [calculationResult, setCalculationResult] = useState<TreatmentCalculationResponse | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const availableCrops = ['Chilli', 'Paddy', 'Cotton', 'Tomato', 'Groundnut'];

  const runCalculation = async () => {
    setIsCalculating(true);
    setCalculationError(null);
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          cropName: selectedCrop,
          fieldAcreage: Number(fieldAcreage),
          knapsackTankVolumeLiters: Number(knapsackCapacity),
          targetPestOrDisease: initialDisease,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.isVerified) {
        setCalculationError(data.error || 'Calculation refused by safety engine.');
        setCalculationResult(null);
      } else {
        setCalculationResult(data);
      }
    } catch (err: any) {
      setCalculationError(err.message || 'Connection error to calculation engine');
      setCalculationResult(null);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    runCalculation();
  }, [selectedCrop, selectedProductId, fieldAcreage, knapsackCapacity]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Form & Controls (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-5">
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-2">
              {language === 'te' ? '1. పంటను నిర్ధారించండి' : '1. Confirm Target Crop'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableCrops.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCrop(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                    selectedCrop.toLowerCase() === c.toLowerCase()
                      ? 'bg-purple-800 text-white border-purple-800 shadow-sm'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-purple-500'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Pesticide Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-2">
              {language === 'te' ? '2. రిజిస్టర్డ్ మందును ఎంచుకోండి' : '2. Select CIBRC Registered Product'}
            </label>
            <div className="space-y-2">
              {VERIFIED_PESTICIDES.map((p) => {
                const isSelected = selectedProductId === p.productId;
                return (
                  <div
                    key={p.productId}
                    onClick={() => setSelectedProductId(p.productId)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-600 ring-2 ring-purple-600/20'
                        : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-stone-900 dark:text-white">
                        {p.tradeName}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                        {p.iracCode ? `IRAC ${p.iracCode}` : `FRAC ${p.fracCode}`}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      {p.activeIngredients.map((a) => `${a.name} ${a.concentrationPct}% ${a.unit}`).join(' + ')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Acreage Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                {language === 'te' ? '3. పొలం విస్తీర్ణం (ఎకరాలు)' : '3. Field Acreage'}
              </label>
              <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
                {fieldAcreage} {language === 'te' ? 'ఎకరాలు' : 'Acres'}
              </span>
            </div>
            <input
              type="range"
              min="0.25"
              max="10"
              step="0.25"
              value={fieldAcreage}
              onChange={(e) => setFieldAcreage(parseFloat(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 mt-1">
              <span>0.25 Ac</span>
              <span>2.5 Ac</span>
              <span>5.0 Ac</span>
              <span>10.0 Ac</span>
            </div>
          </div>

          {/* Knapsack Tank Size */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-2">
              {language === 'te' ? '4. స్ప్రేయర్ పంపు ట్యాంక్ పరిమాణం' : '4. Knapsack Sprayer Tank Capacity'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 16, 20].map((liters) => (
                <button
                  key={liters}
                  onClick={() => setKnapsackCapacity(liters)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    knapsackCapacity === liters
                      ? 'bg-purple-800 text-white border-purple-800 shadow-sm'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {liters} Liters
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Transparent Calculation Breakdown & Safety (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {calculationResult ? (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            {/* Product Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Verified CIBRC Formulation
                </span>
                <h2 className="text-2xl font-black text-stone-900 dark:text-white">
                  {calculationResult.tradeName}
                </h2>
                <span className="text-xs text-stone-500 font-mono">
                  Reg: {calculationResult.cibrcRegistrationNumber}
                </span>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Crop Approved</span>
              </span>
            </div>

            {/* Primary Dosage Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dose Per Tank Card */}
              <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md space-y-1">
                <span className="text-xs text-purple-200 uppercase font-semibold">
                  {language === 'te' ? 'ఒక్కో పంపు ట్యాంకుకు మోతాదు' : 'Exact Dose per Knapsack Tank'}
                </span>
                <div className="text-3xl font-black text-white">
                  {calculationResult.dosageParameters.dosePerKnapsackTank.amount}{' '}
                  <span className="text-base font-bold text-lime-400">
                    {calculationResult.dosageParameters.dosePerKnapsackTank.unit}
                  </span>
                </div>
                <span className="text-xs text-purple-200 block">
                  In {calculationResult.dosageParameters.knapsackTankCapacityLiters} Liters water
                </span>
              </div>

              {/* Total Required Card */}
              <div className="bg-stone-100 dark:bg-stone-800/60 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-1">
                <span className="text-xs text-stone-500 uppercase font-semibold">
                  {language === 'te' ? 'మొత్తం పొలానికి అవసరమైన మందు' : 'Total Field Requirement'}
                </span>
                <div className="text-3xl font-black text-stone-900 dark:text-white">
                  {calculationResult.dosageParameters.totalFormulationRequired.amount}{' '}
                  <span className="text-base font-bold text-purple-600">
                    {calculationResult.dosageParameters.totalFormulationRequired.unit}
                  </span>
                </div>
                <span className="text-xs text-stone-500 block">
                  Requires {calculationResult.dosageParameters.totalTanksRequired} spray tanks ({calculationResult.dosageParameters.totalWaterVolumeRequiredLiters} L water)
                </span>
              </div>
            </div>

            {/* Transparent Arithmetic Breakdown */}
            <div className="bg-stone-50 dark:bg-stone-800/40 rounded-2xl p-5 border border-stone-200 dark:border-stone-700 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                {language === 'te' ? 'పారదర్శక గణిత లెక్కింపు సూత్రం' : 'Transparent Mathematical Audit Trail'}
              </h3>
              <div className="space-y-1.5">
                {calculationResult.dosageParameters.stepByStepArithmetic.map((step, idx) => (
                  <div key={idx} className="text-xs font-mono text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Resistance Management Warning (IRAC/FRAC) */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Resistance Management (MoA {calculationResult.resistanceProfile.iracOrFracCode})</span>
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                  Max {calculationResult.resistanceProfile.consecutiveSprayLimit} sprays
                </span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-100">
                {language === 'te'
                  ? calculationResult.resistanceProfile.rotationAdviceTe
                  : calculationResult.resistanceProfile.rotationAdviceEn}
              </p>
            </div>

            {/* Safety Compliance & PHI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 text-center">
                <span className="text-[10px] text-stone-500 uppercase block">Pre-Harvest Interval (PHI)</span>
                <span className="text-lg font-bold text-stone-900 dark:text-white">
                  {calculationResult.safetyCompliance.preHarvestIntervalDays} Days
                </span>
              </div>

              <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 text-center">
                <span className="text-[10px] text-stone-500 uppercase block">Field Re-Entry</span>
                <span className="text-lg font-bold text-stone-900 dark:text-white">
                  {calculationResult.safetyCompliance.reEntryIntervalHours} Hours
                </span>
              </div>

              <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 text-center">
                <span className="text-[10px] text-stone-500 uppercase block">Toxicity Triangle</span>
                <span className="text-lg font-bold uppercase text-stone-900 dark:text-white">
                  {calculationResult.safetyCompliance.toxicityColorCode}
                </span>
              </div>
            </div>

            {/* PPE Checklist */}
            <div>
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                {language === 'te' ? 'రక్షణ పరికరాలు (Mandatory PPE):' : 'Mandatory Protective Equipment (PPE):'}
              </span>
              <div className="flex flex-wrap gap-2">
                {calculationResult.safetyCompliance.mandatoryPpe.map((ppe, i) => (
                  <span
                    key={i}
                    className="text-xs bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-3 py-1 rounded-full border border-stone-200 dark:border-stone-700"
                  >
                    ✓ {ppe}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : calculationError ? (
          /* Safety Refusal Card */
          <div className="rounded-3xl p-8 bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/60 text-red-600 mx-auto flex items-center justify-center">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-red-900 dark:text-red-200">
              {language === 'te' ? 'లెక్కింపు తిరస్కరించబడింది (భద్రతా నియమం)' : 'Calculation Refused by Safety Engine'}
            </h3>
            <p className="text-xs text-red-700 dark:text-red-300 max-w-lg mx-auto leading-relaxed">
              {calculationError}
            </p>
            <div className="text-xs text-stone-500">
              Safety Invariant: Only chemicals with official CIBRC registered label approvals for the target crop are permitted.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function TreatmentPage() {
  const { language } = useLanguage();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950">
      <Navbar onOpenVoiceAssistant={() => setIsVoiceOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <FlaskConical className="w-4 h-4" />
            <span>Module 4: Verified Treatment & Tank Mixing Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 dark:text-white">
            {language === 'te' ? 'ధృవీకరించబడిన మందుల మోతాదు లెక్కింపు' : 'CIBRC-Verified Chemical Dosage & Tank Mixer'}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-3xl">
            {language === 'te'
              ? 'ముఖ్యమైన భద్రతా నిబంధన: AI ఊహించిన మోతాదులను అనుమతించము. అధికారిక CIBRC లేబుల్ ఆధారంగా మాత్రమే మీ ఎకరాలకు మరియు పంపు ట్యాంకుకు సరిపడా మందు లెక్కింపబడుతుంది.'
              : 'Deterministic calculation engine strictly enforcing CIBRC-registered label rates. Zero AI dosage hallucination. Transparent arithmetic and IRAC/FRAC resistance audits.'}
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-stone-500">Loading Treatment Calculator...</div>}>
          <TreatmentCalculatorContent />
        </Suspense>
      </main>

      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
}
