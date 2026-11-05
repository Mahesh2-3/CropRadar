'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import VoiceAssistantModal from '@/components/VoiceAssistantModal';
import { useLanguage } from '@/context/LanguageContext';
import { WeatherAssessmentResponse } from '@/types/api';
import {
  CloudSun,
  Wind,
  Droplets,
  Thermometer,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export default function WeatherPage() {
  const { language, t } = useLanguage();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const [coords, setCoords] = useState({ lat: 16.3067, lng: 80.4365, name: 'Guntur, Andhra Pradesh' });
  const [weatherData, setWeatherData] = useState<WeatherAssessmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const presetLocations = [
    { name: 'Guntur (Chilli Hub)', lat: 16.3067, lng: 80.4365 },
    { name: 'Warangal (Cotton Belt)', lat: 17.9784, lng: 79.5941 },
    { name: 'Vijayawada (Krishna Delta)', lat: 16.5062, lng: 80.648 },
    { name: 'Kurnool (Groundnut Belt)', lat: 15.8281, lng: 78.0373 },
  ];

  const fetchWeather = async (latitude: number, longitude: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/weather?lat=${latitude}&lng=${longitude}`);
      if (!res.ok) throw new Error('Failed to retrieve weather assessment.');
      const data: WeatherAssessmentResponse = await res.json();
      setWeatherData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Weather engine connection error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(coords.lat, coords.lng);
  }, [coords.lat, coords.lng]);

  const handleSelectLocation = (loc: typeof presetLocations[0]) => {
    setCoords({ lat: loc.lat, lng: loc.lng, name: loc.name });
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950">
      <Navbar onOpenVoiceAssistant={() => setIsVoiceOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <CloudSun className="w-4 h-4" />
              <span>Module 3: Weather Risk Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 dark:text-white">
              {language === 'te' ? 'పిచికారీ వాతావరణం & రిస్క్ అంచనా' : 'Agricultural Spray Risk & Weather Engine'}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl">
              {language === 'te'
                ? 'గాలి వేగం, ఉష్ణోగ్రత, తేమ మరియు వర్ష సూచనలను విశ్లేషించి రసాయన పిచికారీకి అనుకూలమైన సమయాలను లెక్కిస్తుంది.'
                : 'Deterministic evaluation of drift risk, rainfastness wash-off, temperature volatilization scorch, and humidity spore incubation.'}
            </p>
          </div>

          {/* Location Dropdown selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-2 rounded-2xl shadow-sm">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
            <select
              value={`${coords.lat},${coords.lng}`}
              onChange={(e) => {
                const [lat, lng] = e.target.value.split(',').map(Number);
                const loc = presetLocations.find((p) => p.lat === lat && p.lng === lng);
                if (loc) handleSelectLocation(loc);
              }}
              className="bg-transparent text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer pr-2"
            >
              {presetLocations.map((loc, idx) => (
                <option key={idx} value={`${loc.lat},${loc.lng}`}>
                  {loc.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => fetchWeather(coords.lat, coords.lng)}
              className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
              title="Refresh Weather"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {weatherData && (
          <>
            {/* Primary Status Banner */}
            <div
              className={`rounded-3xl p-6 sm:p-8 border shadow-lg transition-all ${
                weatherData.spraySuitability.status === 'OPTIMAL'
                  ? 'bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-950 border-emerald-800 text-white'
                  : weatherData.spraySuitability.status === 'MARGINAL'
                  ? 'bg-gradient-to-r from-amber-950 via-stone-950 to-stone-950 border-amber-800 text-white'
                  : 'bg-gradient-to-r from-red-950 via-stone-950 to-stone-950 border-red-800 text-white'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        weatherData.spraySuitability.status === 'OPTIMAL'
                          ? 'bg-emerald-400'
                          : weatherData.spraySuitability.status === 'MARGINAL'
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                      }`}
                    />
                    <span>{weatherData.spraySuitability.status} SPRAY SUITABILITY</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black">
                    {weatherData.spraySuitability.status === 'OPTIMAL'
                      ? language === 'te'
                        ? 'పిచికారీకి అనుకూలమైన వాతావరణం'
                        : 'Optimal Weather Window for Spraying'
                      : weatherData.spraySuitability.status === 'MARGINAL'
                      ? language === 'te'
                        ? 'హెచ్చరిక: జాగ్రత్తతో పిచికారీ చేయండి'
                        : 'Marginal Spraying Conditions (Caution Required)'
                      : language === 'te'
                      ? 'ప్రమాదం: ప్రస్తుతం పిచికారీ చేయవద్దు!'
                      : 'PROHIBITED: Unsafe to Apply Chemical Spray'}
                  </h2>

                  <p className="text-sm text-stone-200 leading-relaxed">
                    {language === 'te'
                      ? weatherData.spraySuitability.summaryTe
                      : weatherData.spraySuitability.summaryEn}
                  </p>
                </div>

                {/* Quick metrics column */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
                    <Wind className="w-5 h-5 mx-auto text-emerald-300 mb-1" />
                    <span className="text-xl font-bold block">
                      {weatherData.currentConditions.windSpeedKmh} <span className="text-xs">km/h</span>
                    </span>
                    <span className="text-[10px] text-stone-300">Wind Speed</span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
                    <Thermometer className="w-5 h-5 mx-auto text-amber-300 mb-1" />
                    <span className="text-xl font-bold block">
                      {weatherData.currentConditions.temperatureC}°<span className="text-xs">C</span>
                    </span>
                    <span className="text-[10px] text-stone-300">Temperature</span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
                    <Droplets className="w-5 h-5 mx-auto text-blue-300 mb-1" />
                    <span className="text-xl font-bold block">
                      {weatherData.currentConditions.relativeHumidityPct}%
                    </span>
                    <span className="text-[10px] text-stone-300">Humidity</span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
                    <CloudRain className="w-5 h-5 mx-auto text-teal-300 mb-1" />
                    <span className="text-xl font-bold block">
                      {weatherData.currentConditions.precipitationMm} <span className="text-xs">mm</span>
                    </span>
                    <span className="text-[10px] text-stone-300">Rainfall</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Deterministic Rule Evaluation Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                {language === 'te' ? 'శాస్త్రీయ భద్రతా నియమాల తనిఖీ' : 'Deterministic Agronomic Rule Audits'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Wind Check */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase">1. Wind Drift</span>
                    {weatherData.spraySuitability.rulesEvaluated.windCheck.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="text-xl font-bold text-stone-900 dark:text-white">
                    {weatherData.currentConditions.windSpeedKmh} km/h
                  </div>
                  <p className="text-xs text-stone-500 leading-snug">
                    {weatherData.spraySuitability.rulesEvaluated.windCheck.message}
                  </p>
                </div>

                {/* Rain Check */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase">2. Rainfastness</span>
                    {weatherData.spraySuitability.rulesEvaluated.rainCheck.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="text-xl font-bold text-stone-900 dark:text-white">
                    {weatherData.spraySuitability.rulesEvaluated.rainCheck.rainProbNext4h}% rain prob
                  </div>
                  <p className="text-xs text-stone-500 leading-snug">
                    {weatherData.spraySuitability.rulesEvaluated.rainCheck.message}
                  </p>
                </div>

                {/* Temperature Check */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase">3. Scorch Risk</span>
                    {weatherData.spraySuitability.rulesEvaluated.temperatureCheck.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="text-xl font-bold text-stone-900 dark:text-white">
                    {weatherData.currentConditions.temperatureC}°C
                  </div>
                  <p className="text-xs text-stone-500 leading-snug">
                    {weatherData.spraySuitability.rulesEvaluated.temperatureCheck.message}
                  </p>
                </div>

                {/* Humidity Check */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase">4. Leaf Wetness</span>
                    {weatherData.spraySuitability.rulesEvaluated.humidityCheck.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="text-xl font-bold text-stone-900 dark:text-white">
                    {weatherData.currentConditions.relativeHumidityPct}% RH
                  </div>
                  <p className="text-xs text-stone-500 leading-snug">
                    {weatherData.spraySuitability.rulesEvaluated.humidityCheck.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Next Safe Spray Window Recommendation */}
            {weatherData.nextSafeSprayWindow && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {language === 'te' ? 'సిఫార్సు చేయబడిన సురక్షిత సమయం' : 'Recommended Spray Window'}
                  </span>
                  <div className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                    {new Date(weatherData.nextSafeSprayWindow.startIso).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    to{' '}
                    {new Date(weatherData.nextSafeSprayWindow.endIso).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    ({weatherData.nextSafeSprayWindow.durationHours} hours)
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {weatherData.nextSafeSprayWindow.conditionsSummary}
                  </p>
                </div>
              </div>
            )}

            {/* 24-Hour Spray Timeline Bar */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {language === 'te' ? 'రాబోయే 24 గంటల పిచికారీ పట్టిక' : 'Next 24-Hour Spray Suitability Forecast'}
              </h3>

              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                {weatherData.hourlyForecast.slice(0, 12).map((item, idx) => {
                  const date = new Date(item.timeIso);
                  const isOptimal = item.sprayStatus === 'OPTIMAL';
                  const isMarginal = item.sprayStatus === 'MARGINAL';
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl p-2.5 text-center border text-xs flex flex-col justify-between ${
                        isOptimal
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : isMarginal
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                          : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                      }`}
                    >
                      <span className="font-semibold text-[11px] block text-stone-500">
                        {date.toLocaleTimeString([], { hour: 'numeric' })}
                      </span>
                      <span className="font-bold my-1 text-sm block">{Math.round(item.tempC)}°C</span>
                      <span className="text-[10px] block opacity-80">{Math.round(item.windSpeedKmh)} km/h</span>
                      <span
                        className={`mt-1.5 text-[9px] font-bold uppercase py-0.5 rounded ${
                          isOptimal ? 'bg-emerald-600 text-white' : isMarginal ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                        }`}
                      >
                        {item.sprayStatus[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
}
