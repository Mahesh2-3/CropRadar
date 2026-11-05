'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Sparkles,
  ArrowRight,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { BrowserWebSpeechProvider } from '@/lib/speech/provider';
import { TeluguAssistantResponse } from '@/types/api';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceAssistantModal({ isOpen, onClose }: VoiceAssistantModalProps) {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [conversation, setConversation] = useState<
    Array<{
      sender: 'farmer' | 'assistant';
      textEn: string;
      textTe: string;
      route?: string;
    }>
  >([
    {
      sender: 'assistant',
      textEn:
        'Namaskaram! I am your Crop Radar Bilingual Assistant. Speak or type in Telugu or English to check weather, diagnose crop diseases, or calculate safe verified dosages.',
      textTe:
        'నమస్కారం! నేను మీ పంట రాడార్ సహాయకుడిని. వాతావరణం, తెగుళ్ల గుర్తింపు లేదా మందుల మోతాదు గురించి తెలుగు లేదా ఇంగ్లీష్‌లో మాట్లాడండి.',
    },
  ]);

  const speechProviderRef = useRef<BrowserWebSpeechProvider | null>(null);

  useEffect(() => {
    speechProviderRef.current = new BrowserWebSpeechProvider();
    return () => {
      speechProviderRef.current?.stopListening();
      speechProviderRef.current?.stopSpeaking();
    };
  }, []);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (!speechProviderRef.current) return;

    if (isListening) {
      speechProviderRef.current.stopListening();
      setIsListening(false);
    } else {
      setErrorMsg(null);
      setIsListening(true);
      speechProviderRef.current.startListening(
        language,
        (res) => {
          setTranscriptInput(res.transcript);
          if (res.isFinal) {
            setIsListening(false);
            submitQuery(res.transcript);
          }
        },
        (err) => {
          setIsListening(false);
          setErrorMsg(err);
        }
      );
    }
  };

  const submitQuery = async (queryToSubmit?: string) => {
    const text = (queryToSubmit || transcriptInput).trim();
    if (!text) return;

    // Add farmer message
    setConversation((prev) => [
      ...prev,
      {
        sender: 'farmer',
        textEn: text,
        textTe: text,
      },
    ]);
    setTranscriptInput('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textTranscript: text,
          language,
        }),
      });

      if (!res.ok) throw new Error('Failed to process assistant query');
      const data: TeluguAssistantResponse = await res.json();

      setConversation((prev) => [
        ...prev,
        {
          sender: 'assistant',
          textEn: data.responseBodyEn,
          textTe: data.responseBodyTe,
          route: data.actionableModuleRoute,
        },
      ]);

      // Automatically speak out the response in farmer's preferred language
      speakText(language === 'te' ? data.responseBodyTe : data.responseBodyEn);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    if (!speechProviderRef.current) return;
    setIsSpeaking(true);
    speechProviderRef.current.speak(text, language, () => {
      setIsSpeaking(false);
    });
  };

  const stopSpeaking = () => {
    speechProviderRef.current?.stopSpeaking();
    setIsSpeaking(false);
  };

  const quickPrompts = [
    {
      en: 'Is it safe to spray now?',
      te: 'ఇప్పుడు పిచికారీ చేయడం సురక్షితమేనా?',
    },
    {
      en: 'Calculate dosage for 2 acres',
      te: '2 ఎకరాలకు మందు మోతాదు ఎంత?',
    },
    {
      en: 'Any nearby disease outbreaks?',
      te: 'చుట్టుపక్కల తెగుళ్లు వ్యాపిస్తున్నాయా?',
    },
    {
      en: 'Chilli leaf curl treatment',
      te: 'మిరప ఆకు ముడత నివారణ ఏమిటి?',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[85vh] border border-emerald-600/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-400 text-emerald-950 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                {language === 'te' ? 'తెలుగు వాయిస్ అసిస్టెంట్' : 'Telugu / English Voice Assistant'}
              </h3>
              <p className="text-xs text-emerald-200">
                {language === 'te' ? 'రైతు మిత్ర — మాట్లాడండి లేదా టైప్ చేయండి' : 'Bilingual Agricultural AI Assistant'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                title="Mute Speech"
              >
                <VolumeX className="w-4 h-4 text-lime-300" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-emerald-700 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conversation Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50 dark:bg-stone-950/50">
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'farmer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.sender === 'farmer'
                    ? 'bg-emerald-700 text-white rounded-br-xs'
                    : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-bl-xs'
                }`}
              >
                <p className="leading-relaxed">
                  {language === 'te' ? msg.textTe : msg.textEn}
                </p>

                {msg.sender === 'assistant' && (
                  <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-700 flex items-center justify-between text-xs">
                    <button
                      onClick={() => speakText(language === 'te' ? msg.textTe : msg.textEn)}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{language === 'te' ? 'వినండి' : 'Listen'}</span>
                    </button>

                    {msg.route && (
                      <button
                        onClick={() => {
                          onClose();
                          router.push(msg.route!);
                        }}
                        className="text-emerald-700 dark:text-lime-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>{language === 'te' ? 'వివరాలు చూడండి' : 'Open Module'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-stone-800 rounded-2xl px-4 py-2.5 text-xs text-stone-500 flex items-center gap-2 border border-stone-200 dark:border-stone-700">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>{language === 'te' ? 'విశ్లేషిస్తోంది...' : 'Processing agronomic guidance...'}</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Chips */}
        <div className="px-4 py-2 bg-stone-100 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex gap-2 overflow-x-auto no-scrollbar">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => submitQuery(language === 'te' ? p.te : p.en)}
              className="text-xs whitespace-nowrap bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded-full hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer transition-colors"
            >
              {language === 'te' ? p.te : p.en}
            </button>
          ))}
        </div>

        {/* Voice and Text Input Dock */}
        <div className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2">
          {/* Big Mic Button */}
          <button
            onClick={toggleListening}
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200 dark:ring-red-900'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title={isListening ? 'Stop Listening' : 'Speak in Telugu or English'}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Fallback Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={transcriptInput}
              onChange={(e) => setTranscriptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitQuery();
              }}
              placeholder={
                language === 'te'
                  ? 'ప్రశ్నను ఇక్కడ టైప్ చేయండి...'
                  : 'Type your agricultural query here...'
              }
              className="w-full bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          <button
            onClick={() => submitQuery()}
            disabled={!transcriptInput.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-emerald-600 disabled:opacity-40 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
