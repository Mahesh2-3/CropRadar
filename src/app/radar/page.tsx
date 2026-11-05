'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import VoiceAssistantModal from '@/components/VoiceAssistantModal';
import { useLanguage } from '@/context/LanguageContext';
import { OutbreakQueryResponse, NearbyOutbreakItem } from '@/types/api';
import {
  Radio,
  MapPin,
  AlertTriangle,
  Shield,
  Plus,
  Filter,
  CheckCircle2,
  Lock,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';

// Dynamic import of Leaflet map to ensure 100% client-side execution
const RadarMap = dynamic(() => import('@/components/RadarMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
      Loading Leaflet 5km Outbreak Radar...
    </div>
  ),
});

export default function RadarPage() {
  const { language, t } = useLanguage();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Farmer's location (Guntur coordinates default)
  const [farmerCoords, setFarmerCoords] = useState({ lat: 16.512, lng: 80.645 });
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [locationRequired, setLocationRequired] = useState(false);
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('All');
  const [radarData, setRadarData] = useState<OutbreakQueryResponse | null>(null);
  const [selectedReport, setSelectedReport] = useState<NearbyOutbreakItem | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // New report form
  const [newCrop, setNewCrop] = useState('Chilli');
  const [newDisease, setNewDisease] = useState('Chilli Leaf Curl Virus');
  const [newPathogenType, setNewPathogenType] = useState<'fungal' | 'bacterial' | 'viral' | 'pest'>('viral');
  const [newSeverity, setNewSeverity] = useState<'low' | 'moderate' | 'severe'>('moderate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  const fetchNearbyOutbreaks = async () => {
    if (!isLocationReady) return;
    try {
      const cropParam = selectedCropFilter === 'All' ? '' : `&crop=${selectedCropFilter}`;
      const res = await fetch(`/api/alerts?radius=5.0${cropParam}`);
      if (res.status === 409) {
        setLocationRequired(true);
        return;
      }
      if (!res.ok) throw new Error('Failed to query outbreaks');
      const data: OutbreakQueryResponse = await res.json();
      setLocationRequired(false);
      setRadarData(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/farmer/profile')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load farm profile.');
        return data.profile;
      })
      .then((profile) => {
        if (!active) return;
        const location = profile?.farmLocation;
        if (
          profile?.locationSetupComplete === true &&
          typeof location?.latitude === 'number' &&
          typeof location?.longitude === 'number'
        ) {
          setFarmerCoords({ lat: location.latitude, lng: location.longitude });
          setIsLocationReady(true);
          setLocationRequired(false);
        } else {
          setIsLocationReady(false);
          setLocationRequired(true);
        }
      })
      .catch((error) => console.error('Radar farm location load failed:', error));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    fetchNearbyOutbreaks();
  }, [farmerCoords, selectedCropFilter, isLocationReady]);

  const handlePostReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionFeedback(null);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: newCrop,
          diseaseName: newDisease,
          pathogenType: newPathogenType,
          severity: newSeverity,
        }),
      });
      const data = await res.json();
      if (res.status === 409 && data.code === 'location-required') {
        setLocationRequired(true);
        setSubmissionFeedback('Set your farm location before reporting an outbreak.');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Submission failed.');
      if (data.success) {
        setSubmissionFeedback(data.message || 'Report submitted for verification.');
        setTimeout(() => {
          setIsReportModalOpen(false);
          setSubmissionFeedback(null);
        }, 2200);
      }
    } catch (err: any) {
      setSubmissionFeedback(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950">
      <Navbar onOpenVoiceAssistant={() => setIsVoiceOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Module 5: Geospatial Disease Network</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 dark:text-white">
              {language === 'te' ? '5 కి.మీ తెగుళ్ల రాడార్ & హెచ్చరికలు' : '5km Geospatial Outbreak Early Warning'}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl">
              {language === 'te'
                ? 'రైతుల ప్రైవేట్ లొకేషన్‌ను గోప్యంగా ఉంచుతూ, 5 కి.మీ పరిధిలో వ్యాపిస్తున్న తెగుళ్ల సమాచారం మరియు ముందస్తు జాగ్రత్తలు.'
                : 'Fuzzed ~1km coordinate protection, Geohash spatial queries, and exact 5km Haversine distance filtering.'}
            </p>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            disabled={!isLocationReady}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md cursor-pointer transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'te' ? 'తెగులును నమోదు చేయండి' : 'Report Disease Outbreak'}</span>
          </button>
        </div>

        {locationRequired && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <span>
              {language === 'te'
                ? 'సమీప వ్యాప్తి హెచ్చరికల కోసం ముందుగా మీ పొలం స్థానాన్ని నమోదు చేయండి.'
                : 'Set your farm location to load nearby outbreak alerts.'}
            </span>
            <Link href="/" className="font-bold underline">
              {language === 'te' ? 'స్థానం నమోదు చేయండి' : 'Set farm location'}
            </Link>
          </div>
        )}

        {/* Threat Level & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-stone-500">Threat Level:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                radarData?.threatLevel === 'critical'
                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  : radarData?.threatLevel === 'moderate'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {radarData?.threatLevel || 'MODERATE'} THREAT
            </span>
            <span className="text-xs text-stone-500">
              ({radarData?.totalNearbyOutbreaks ?? 0} active reports within 5.0 km)
            </span>
          </div>

          {/* Crop Filter Tabs */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-400 mr-1" />
            {['All', 'Chilli', 'Paddy', 'Cotton', 'Tomato', 'Groundnut'].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCropFilter(c)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  selectedCropFilter === c
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Interactive Map (7 cols) + Report List (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Map Column */}
          <div className="lg:col-span-7 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 shadow-sm h-[520px] flex flex-col">
            {isLocationReady ? (
              <RadarMap
                centerLat={farmerCoords.lat}
                centerLng={farmerCoords.lng}
                radiusKm={5.0}
                reports={radarData?.nearbyReports || []}
                onSelectReport={(rep) => setSelectedReport(rep)}
              />
            ) : (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-2xl bg-stone-100 p-6 text-center dark:bg-stone-800">
                <MapPin className="h-8 w-8 text-emerald-700 dark:text-emerald-300" />
                <p className="max-w-sm text-sm font-semibold text-stone-700 dark:text-stone-200">
                  {language === 'te' ? 'మీ పొలం స్థానాన్ని నమోదు చేసిన తర్వాత రాడార్ చూపబడుతుంది.' : 'The radar will appear after you save your farm location.'}
                </p>
                <Link href="/" className="text-xs font-bold text-emerald-700 underline dark:text-emerald-300">
                  {language === 'te' ? 'స్థానం నమోదు చేయండి' : 'Set farm location'}
                </Link>
              </div>
            )}
          </div>

          {/* Outbreak Feed Column */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center justify-between">
              <span>{language === 'te' ? 'సమీప నివేదికలు (దూరం ప్రకారం)' : 'Nearby Outbreaks (Sorted by Distance)'}</span>
              <span className="text-xs text-stone-500 font-normal">Max 5.0 km</span>
            </h3>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {radarData?.nearbyReports.map((report) => {
                const isSevere = report.severity === 'severe';
                const isSelected = selectedReport?.reportId === report.reportId;
                return (
                  <div
                    key={report.reportId}
                    onClick={() => setSelectedReport(report)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                              isSevere
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {report.severity}
                          </span>
                          <span className="text-xs font-semibold text-stone-500">
                            {report.crop}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-stone-900 dark:text-white mt-1">
                          {language === 'te' ? report.diseaseNameTe : report.diseaseNameEn}
                        </h4>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-700 dark:text-lime-400">
                          {report.distanceKm} km
                        </span>
                        <span className="text-[10px] text-stone-400 block">away</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 bg-stone-50 dark:bg-stone-800/50 p-2 rounded-xl">
                      <strong>Precaution:</strong>{' '}
                      {language === 'te' ? report.recommendedPrecautionTe : report.recommendedPrecautionEn}
                    </p>

                    <div className="mt-2 text-[10px] text-stone-400 flex items-center justify-between">
                      <span>Reported {report.reportedDaysAgo} days ago</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Shield className="w-3 h-3" />
                        <span>Fuzzed ~1km centroid</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Privacy Invariant Banner */}
        <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-3 text-xs text-stone-600 dark:text-stone-400">
          <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>Farmer Privacy Safeguard:</strong> Exact GPS coordinates are never disclosed to the community. All public pins on the radar map are fuzzed to 1.0 km centroid grids with farmer PII permanently stripped.
          </span>
        </div>
      </main>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-stone-200 dark:border-stone-800 space-y-4">
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              {language === 'te' ? 'పొలంలో తెగులును నమోదు చేయండి' : 'Report Disease Outbreak'}
            </h3>
            <p className="text-xs text-stone-500">
              Help neighboring farmers prepare. Your identity and exact farm coordinates are anonymized.
            </p>

            <form onSubmit={handlePostReport} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Crop Name
                </label>
                <select
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-white"
                >
                  <option value="Chilli">Chilli (మిరప)</option>
                  <option value="Paddy">Paddy / Rice (వరి)</option>
                  <option value="Cotton">Cotton (పత్తి)</option>
                  <option value="Tomato">Tomato (టమోటా)</option>
                  <option value="Groundnut">Groundnut (వేరుశనగ)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Suspected Disease
                </label>
                <input
                  type="text"
                  value={newDisease}
                  onChange={(e) => setNewDisease(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-white"
                  placeholder="e.g. Chilli Leaf Curl, Anthracnose, Blast"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Disease Category
                </label>
                <select
                  value={newPathogenType}
                  onChange={(event) => setNewPathogenType(event.target.value as typeof newPathogenType)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 dark:text-white"
                >
                  <option value="fungal">Fungal</option>
                  <option value="bacterial">Bacterial</option>
                  <option value="viral">Viral</option>
                  <option value="pest">Insect / Pest</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Visual Severity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'moderate', 'severe'] as const).map((sev) => (
                    <button
                      type="button"
                      key={sev}
                      onClick={() => setNewSeverity(sev)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase border cursor-pointer ${
                        newSeverity === sev
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {submissionFeedback && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                  {submissionFeedback}
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold cursor-pointer hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  {isSubmitting ? 'Dispatching...' : 'Submit Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
}
