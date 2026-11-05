'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import VoiceAssistantModal from '@/components/VoiceAssistantModal';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { useLanguage } from '@/context/LanguageContext';
import { CropDiagnosisResponse } from '@/types/api';
import {
  Upload,
  Camera,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Info,
  RefreshCw,
  Sparkles,
  Leaf,
  Layers,
  Radio,
} from 'lucide-react';

export default function DiagnosisPage() {
  const { language, t } = useLanguage();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const [selectedCrop, setSelectedCrop] = useState('Chilli');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<CropDiagnosisResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cloudinaryUploadFailed, setCloudinaryUploadFailed] = useState(false);
  const [cloudinaryImageUrl, setCloudinaryImageUrl] = useState<string | null>(null);

  const availableCrops = [
    { id: 'Chilli', nameEn: 'Chilli', nameTe: 'మిరప' },
    { id: 'Paddy', nameEn: 'Paddy / Rice', nameTe: 'వరి' },
    { id: 'Cotton', nameEn: 'Cotton', nameTe: 'పత్తి' },
    { id: 'Tomato', nameEn: 'Tomato', nameTe: 'టమోటా' },
    { id: 'Groundnut', nameEn: 'Groundnut', nameTe: 'వేరుశనగ' },
  ];

  const commonSymptoms = [
    { en: 'Leaf curling upward', te: 'ఆకులు పైకి ముడుచుకోవడం' },
    { en: 'Yellow vein clearing', te: 'ఈనెలు పసుపుగా మారడం' },
    { en: 'Necrotic circular spots', te: 'నల్లటి లేదా గోధుమ మచ్చలు' },
    { en: 'Stunted plant growth', te: 'మొక్క గిడసబారడం' },
    { en: 'Powdery white coating', te: 'తెల్లటి బూడిద పొర' },
    { en: 'Water-soaked lesions', te: 'నీటితో తడిసినట్లు మచ్చలు' },
  ];

  // Preset demo samples to facilitate fast hackathon review
  const demoSamples = [
    {
      titleEn: 'Dataset: Paddy Blast',
      titleTe: 'వరి అగ్గితెగులు (బ్లాస్ట్)',
      crop: 'Paddy',
      symptoms: ['Necrotic circular spots', 'Water-soaked lesions'],
      imgUrl: '/samples/paddy_blast.jpg',
    },
    {
      titleEn: 'Dataset: Bacterial Blight',
      titleTe: 'వరి బాక్టీరియల్ ఆకు ఎండు',
      crop: 'Paddy',
      symptoms: ['Water-soaked lesions', 'Yellow vein clearing'],
      imgUrl: '/samples/bacterial_blight.jpg',
    },
    {
      titleEn: 'Dataset: Brown Spot',
      titleTe: 'వరి గోధుమ మచ్చ తెగులు',
      crop: 'Paddy',
      symptoms: ['Necrotic circular spots'],
      imgUrl: '/samples/brown_spot.jpg',
    },
    {
      titleEn: 'Sample: Chilli Leaf Curl',
      titleTe: 'మిరప ఆకు ముడత వైరస్',
      crop: 'Chilli',
      symptoms: ['Leaf curling upward', 'Yellow vein clearing'],
      imgUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
      setErrorMsg(null);
      setCloudinaryUploadFailed(false);
      setCloudinaryImageUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof demoSamples[0]) => {
    setSelectedCrop(sample.crop);
    setSelectedSymptoms(sample.symptoms);
    setPreviewImage(sample.imgUrl);
    setErrorMsg(null);
    setCloudinaryUploadFailed(false);
    setCloudinaryImageUrl(null);
  };

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const runDiagnosis = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setDiagnosisResult(null);
    setCloudinaryUploadFailed(false);
    setCloudinaryImageUrl(null);

    try {
      if (previewImage?.startsWith('data:')) {
        try {
          const secureUrl = await uploadImageToCloudinary(previewImage);
          setCloudinaryImageUrl(secureUrl);
        } catch (uploadError) {
          console.warn('Cloudinary upload unavailable; continuing diagnosis:', uploadError);
          setCloudinaryUploadFailed(true);
        }
      }

      const res = await fetch('/api/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropType: selectedCrop,
          observedSymptoms: selectedSymptoms,
          imageBase64: previewImage?.startsWith('data:') ? previewImage : undefined,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error('Diagnosis service failed to analyze image.');
      }

      const data: CropDiagnosisResponse = await res.json();
      setDiagnosisResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Pathology analysis error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950">
      <Navbar onOpenVoiceAssistant={() => setIsVoiceOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <ShieldAlert className="w-4 h-4" />
            <span>Module 1: Crop Disease Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 dark:text-white">
            {language === 'te' ? 'పంట తెగుళ్ల గుర్తింపు & నిర్ధారణ' : 'Multimodal Crop Pathology Diagnostics'}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-3xl">
            {language === 'te'
              ? 'ఆకు లేదా కాండం ఫోటో తీయండి. AI నమూనాల ఆధారంగా ప్రధాన తెగులు, ప్రత్యామ్నాయ కారణాలు మరియు విజువల్ తీవ్రతను విశ్లేషిస్తుంది.'
              : 'Upload a macro photograph of affected foliage. Multimodal vision extracts visible symptoms, ranks differential causes, and calculates visual severity.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Upload & Crop Metadata (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-5">
              {/* Crop Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-2">
                  {language === 'te' ? '1. పంటను ఎంచుకోండి' : '1. Select Crop'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {availableCrops.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCrop(c.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        selectedCrop === c.id
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-emerald-500'
                      }`}
                    >
                      {language === 'te' ? c.nameTe : c.nameEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Viewfinder / Uploader */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-2">
                  {language === 'te' ? '2. ఫోటో అప్‌లోడ్ చేయండి లేదా తీయండి' : '2. Capture or Upload Plant Photo'}
                </label>

                {previewImage ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-600 aspect-video bg-black/5 flex items-center justify-center">
                    <img
                      src={previewImage}
                      alt="Crop Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setPreviewImage(null);
                        setCloudinaryImageUrl(null);
                      }}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-medium hover:bg-black cursor-pointer"
                    >
                      {language === 'te' ? 'మార్చండి' : 'Change'}
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors aspect-video bg-stone-50 dark:bg-stone-800/40">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                      {language === 'te' ? 'కెమెరా తెరవండి లేదా ఫోటో ఎంచుకోండి' : 'Take photo or drag image'}
                    </span>
                    <span className="text-xs text-stone-500 mt-1">JPEG, PNG, WebP up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
                {cloudinaryUploadFailed && (
                  <p role="status" className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">
                    {language === 'te'
                      ? 'చిత్ర విశ్లేషణ కొనసాగుతుంది, కానీ Cloudinaryలో భద్రపరచలేకపోయాం. సర్వర్ వివరాలను తనిఖీ చేయండి.'
                      : 'Diagnosis will continue, but Cloudinary could not store this image. Check its server credentials.'}
                  </p>
                )}
                {cloudinaryImageUrl && (
                  <a
                    href={cloudinaryImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-[11px] font-semibold text-emerald-700 underline dark:text-emerald-300"
                  >
                    {language === 'te' ? 'Cloudinaryలో భద్రపరచబడింది' : 'Image saved to Cloudinary'}
                  </a>
                )}
              </div>

              {/* Preset Samples */}
              <div>
                <span className="text-xs font-medium text-stone-500 block mb-2">
                  {language === 'te' ? 'లేదా పరీక్ష నమూనాను ఎంచుకోండి:' : 'Or test with a sample photo:'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {demoSamples.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSample(s)}
                      className="text-left p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-emerald-500 text-xs text-stone-700 dark:text-stone-300 bg-stone-50/50 dark:bg-stone-800/50 cursor-pointer"
                    >
                      <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {language === 'te' ? s.titleTe : s.titleEn}
                      </div>
                      <div className="text-[10px] text-stone-500 truncate">{s.crop}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Observed Symptoms Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-2">
                  {language === 'te' ? '3. మీరు గమనించిన లక్షణాలు (ఐచ్ఛికం)' : '3. Observed Symptoms (Optional)'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {commonSymptoms.map((sym, idx) => {
                    const isSelected = selectedSymptoms.includes(sym.en);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleSymptom(sym.en)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-emerald-500'
                        }`}
                      >
                        {language === 'te' ? sym.te : sym.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Run Diagnosis Button */}
              <button
                onClick={runDiagnosis}
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'te' ? 'విశ్లేషిస్తోంది...' : 'Running Pathology Intelligence...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{language === 'te' ? 'రోగ నిర్ధారణ చేయండి' : 'Run Multimodal Diagnosis'}</span>
                  </>
                )}
              </button>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Diagnosis Results (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {diagnosisResult ? (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {diagnosisResult.suspectedPathogenCategory} Pathogen
                    </span>
                    <span className="text-xs text-stone-500 font-mono">
                      ID: {diagnosisResult.diagnosisId.slice(0, 12)}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500">
                    Crop: <strong className="text-stone-800 dark:text-stone-200">{diagnosisResult.crop}</strong>
                  </div>
                </div>

                {/* Primary Candidate Box */}
                <div className="rounded-2xl p-5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-lime-400">
                        {language === 'te' ? 'ప్రధాన అనుమానిత తెగులు' : 'Primary Candidate'}
                      </span>
                      <h2 className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">
                        {language === 'te'
                          ? diagnosisResult.primaryCandidate.diseaseNameTe
                          : diagnosisResult.primaryCandidate.diseaseNameEn}
                      </h2>
                      <p className="text-xs text-stone-500 italic">
                        {diagnosisResult.primaryCandidate.scientificName}
                      </p>
                    </div>

                    {/* Calibrated Confidence Badge */}
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-700 dark:text-lime-400">
                        {Math.round(diagnosisResult.primaryCandidate.symptomMatchConfidence * 100)}%
                      </div>
                      <span className="text-[10px] text-stone-500 block">Visual Match Score</span>
                    </div>
                  </div>

                  {/* Visual Evidence Points */}
                  <div>
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                      {language === 'te' ? 'దృశ్య సాక్ష్యాలు (Visual Evidence):' : 'Identified Visual Evidence:'}
                    </span>
                    <ul className="space-y-1">
                      {diagnosisResult.primaryCandidate.visualEvidence.map((ev, i) => (
                        <li key={i} className="text-xs text-stone-600 dark:text-stone-300 flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Uncertainty Notice */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{diagnosisResult.primaryCandidate.uncertaintyNotice}</span>
                  </div>
                </div>

                {/* Differential Diagnoses */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    {language === 'te' ? 'ప్రత్యామ్నాయ అనుమానాలు (Differential Diagnoses)' : 'Differential Diagnoses'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {diagnosisResult.differentialDiagnoses.map((diff, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-stone-900 dark:text-white">
                            {language === 'te' ? diff.diseaseNameTe : diff.diseaseNameEn}
                          </span>
                          <span className="text-xs font-semibold text-stone-500">
                            {Math.round(diff.symptomMatchConfidence * 100)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-snug">
                          {diff.differentiatingFactors}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Severity & Follow-up angles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40">
                    <span className="text-xs text-stone-500 block mb-1">
                      {language === 'te' ? 'ఆకుల పై తెగులు తీవ్రత' : 'Canopy Affected Area'}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-stone-900 dark:text-white">
                        {diagnosisResult.visualSeverity.percentageLeafAreaAffected}%
                      </span>
                      <span className="text-xs font-semibold text-amber-600 uppercase">
                        {diagnosisResult.visualSeverity.classification}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40">
                    <span className="text-xs text-stone-500 block mb-1">
                      {language === 'te' ? 'అదనపు ఫోటోలు అవసరమా?' : 'Additional Angles Needed?'}
                    </span>
                    <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                      {diagnosisResult.needsAdditionalAngles ? 'Yes — Under-leaf view' : 'Standard angles sufficient'}
                    </span>
                  </div>
                </div>

                {/* Management Guidance */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Leaf className="w-4 h-4" />
                    {language === 'te' ? 'రైతు ప్రాథమిక నివారణ చర్యలు' : 'Integrated Management Advice'}
                  </span>
                  <p className="text-xs text-emerald-900 dark:text-emerald-100">
                    {diagnosisResult.recommendedActionOverview.culturalAdvice}
                  </p>
                  {diagnosisResult.recommendedActionOverview.biologicalOption && (
                    <p className="text-xs text-emerald-800 dark:text-emerald-200">
                      <strong>Bio Option:</strong> {diagnosisResult.recommendedActionOverview.biologicalOption}
                    </p>
                  )}
                </div>

                {/* Action Buttons: Jump to Treatment or Radar */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/treatment?crop=${encodeURIComponent(diagnosisResult.crop)}&disease=${encodeURIComponent(diagnosisResult.primaryCandidate.diseaseNameEn)}`}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:brightness-110 cursor-pointer"
                  >
                    <span>{language === 'te' ? 'ధృవీకరించబడిన మందు మోతాదు లెక్కించండి' : 'Calculate Verified Dosage'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/radar"
                    className="py-3 px-4 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Radio className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'te' ? '5 కి.మీ రాడార్‌లో తెగులును నమోదు చేయండి' : 'Publish Anonymously to Radar'}</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Empty Placeholder State */
              <div className="h-full min-h-[420px] rounded-3xl border-2 border-dashed border-stone-200 dark:border-stone-800 p-8 flex flex-col items-center justify-center text-center space-y-4 text-stone-400">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-bold text-stone-700 dark:text-stone-300">
                    {language === 'te' ? 'రోగ నిర్ధారణ ఫలితాలు ఇక్కడ కనిపిస్తాయి' : 'Diagnosis Insights Ready to Run'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {language === 'te'
                      ? 'ఎడమవైపు పంటను ఎంచుకుని ఫోటో అప్‌లోడ్ చేయండి. మల్టీమోడల్ AI తక్షణమే శాస్త్రీయ నివేదికను అందిస్తుంది.'
                      : 'Select a crop and photo on the left. The engine will extract visual symptoms, calculate visual severity, and rank differential diagnoses.'}
                  </p>
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
