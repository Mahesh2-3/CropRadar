'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { LocationCoordinate } from '@/types/models';
import { ANDHRA_PRADESH_DISTRICTS } from '@/lib/i18n/translations';
import { MapPin, Navigation, X, Shield, Check, CloudSun, Wind, Droplets } from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationCoordinate;
  onSaveLocation: (loc: LocationCoordinate) => void;
}

export default function LocationModal({
  isOpen,
  onClose,
  currentLocation,
  onSaveLocation,
}: LocationModalProps) {
  const { language, t } = useLanguage();

  const [selectedDistrictId, setSelectedDistrictId] = useState(() => {
    const match = ANDHRA_PRADESH_DISTRICTS.find((d) => d.nameEn === currentLocation.district);
    return match ? match.id : 'guntur';
  });
  const [villageName, setVillageName] = useState(currentLocation.village || '');
  const [isDetecting, setIsDetecting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [weatherSummary, setWeatherSummary] = useState<string>(
    language === 'te' ? 'వాతావరణ సమాచారం లోడ్ అవుతోంది...' : 'Loading local weather...'
  );

  useEffect(() => {
    if (!isOpen || !currentLocation.latitude || !currentLocation.longitude) return;

    let isMounted = true;

    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather fetch failed');

        const data = await response.json();
        const current = data.current;
        const code = Number(current?.weather_code ?? 0);
        const temp = Math.round(Number(current?.temperature_2m ?? 0));
        const humidity = Math.round(Number(current?.relative_humidity_2m ?? 0));
        const wind = Math.round(Number(current?.wind_speed_10m ?? 0));

        const label =
          code === 0
            ? language === 'te'
              ? 'సూర్యకాంతి'
              : 'Clear'
            : code <= 3
            ? language === 'te'
              ? 'మేఘావృతం'
              : 'Cloudy'
            : code <= 48
            ? language === 'te'
              ? 'మేఘాలు / పొగమంచు'
              : 'Overcast'
            : code <= 67
            ? language === 'te'
              ? 'వర్షం'
              : 'Rain'
            : language === 'te'
            ? 'వాతావరణం అనిశ్చితం'
            : 'Variable conditions';

        const summary =
          language === 'te'
            ? `${label} • ${temp}°C • ${humidity}% తేమ • ${wind} కి.మీ/గం గాలి`
            : `${label} • ${temp}°C • ${humidity}% humidity • ${wind} km/h wind`;

        if (isMounted) setWeatherSummary(summary);
      } catch (error) {
        console.warn('Location weather fetch failed:', error);
        if (isMounted) {
          setWeatherSummary(
            language === 'te'
              ? 'వాతావరణ సమాచారం అందుబాటులో లేదు'
              : 'Weather info unavailable'
          );
        }
      }
    };

    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentLocation.latitude, currentLocation.longitude, language]);

  if (!isOpen) return null;

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setFeedback(language === 'te' ? 'జీపీఎస్ అందుబాటులో లేదు.' : 'Geolocation not supported.');
      return;
    }

    setIsDetecting(true);
    setFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetecting(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Find closest AP district
        let closest = ANDHRA_PRADESH_DISTRICTS[0];
        let minDist = 999999;
        for (const dist of ANDHRA_PRADESH_DISTRICTS) {
          const d = Math.hypot(lat - dist.lat, lng - dist.lng);
          if (d < minDist) {
            minDist = d;
            closest = dist;
          }
        }

        setSelectedDistrictId(closest.id);
        const detectedLoc: LocationCoordinate = {
          latitude: lat,
          longitude: lng,
          district: closest.nameEn,
          village: villageName || (language === 'te' ? 'నా పొలం' : 'My Farm'),
          displayNameEn: `${villageName || 'My Farm'}, ${closest.nameEn}`,
          displayNameTe: `${villageName || 'నా పొలం'}, ${closest.nameTe}`,
        };

        onSaveLocation(detectedLoc);
        setFeedback(language === 'te' ? 'స్థానం విజయవంతంగా గుర్తించబడింది!' : 'Location detected successfully!');
        setTimeout(() => onClose(), 1200);
      },
      (err) => {
        setIsDetecting(false);
        setFeedback(
          language === 'te'
            ? 'జీపీఎస్ అనుమతి లభించలేదు. దయచేసి క్రింద మీ జిల్లాను ఎంచుకోండి.'
            : 'GPS permission denied. Please pick your Andhra Pradesh district below.'
        );
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSave = () => {
    const dist = ANDHRA_PRADESH_DISTRICTS.find((d) => d.id === selectedDistrictId) || ANDHRA_PRADESH_DISTRICTS[0];
    const newLoc: LocationCoordinate = {
      latitude: dist.lat,
      longitude: dist.lng,
      district: dist.nameEn,
      village: villageName,
      displayNameEn: villageName ? `${villageName}, ${dist.nameEn}` : `${dist.nameEn}, Andhra Pradesh`,
      displayNameTe: villageName ? `${villageName}, ${dist.nameTe}` : `${dist.nameTe}, ఆంధ్రప్రదేశ్`,
    };

    onSaveLocation(newLoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-lime-400" />
            <h3 className="font-bold text-sm">{t('locationModal.title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-emerald-900 text-stone-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-stone-600 dark:text-stone-300">
          <p className="leading-relaxed">{t('locationModal.description')}</p>

          {/* Auto Detect GPS */}
          <button
            onClick={handleDetectGPS}
            disabled={isDetecting}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? t('locationModal.detecting') : t('locationModal.detectGPS')}</span>
          </button>

          {feedback && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-center font-medium">
              {feedback}
            </div>
          )}

          <div className="p-3 rounded-2xl border border-sky-200 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-800">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                <CloudSun className="w-3.5 h-3.5" />
                {language === 'te' ? 'స్థానిక వాతావరణం' : 'Local weather'}
              </div>
              <span className="text-[10px] text-sky-700 dark:text-sky-300">
                {language === 'te' ? 'సిఫార్సుల్లో వినియోగించబడుతోంది' : 'Used in advice'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
              <Wind className="w-3.5 h-3.5 text-sky-600" />
              <span>{weatherSummary}</span>
            </div>
          </div>

          {/* Manual District Selection */}
          <div className="space-y-1.5 pt-2">
            <label className="font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block">
              {t('locationModal.orSelectDistrict')}
            </label>
            <select
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
            >
              {ANDHRA_PRADESH_DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {language === 'te' ? d.nameTe : `${d.nameEn} District`}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Village Name */}
          <div className="space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block">
              {language === 'te' ? 'గ్రామం లేదా ప్రాంతం' : 'Village or Area'}
            </label>
            <input
              type="text"
              value={villageName}
              onChange={(e) => setVillageName(e.target.value)}
              placeholder={t('locationModal.villagePlaceholder')}
              className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white"
            />
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-stone-100 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex items-start gap-2 text-[11px] text-stone-500">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{t('locationModal.privacyGuarantee')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold cursor-pointer"
          >
            {language === 'te' ? 'రద్దు' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{t('locationModal.saveLocation')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
