'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { BrowserWebSpeechProvider } from '@/lib/speech/provider';
import {
  Paperclip,
  Camera,
  Mic,
  MicOff,
  Send,
  X,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';

interface MessageComposerProps {
  onSendMessage: (text: string, imageBase64?: string) => void;
  onOpenCamera: () => void;
  isLoading: boolean;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  attachedImage: string | null;
  imageUploadFailed?: boolean;
  onRemoveAttachedImage: () => void;
  onAttachImage: (base64: string) => void;
}

export default function MessageComposer({
  onSendMessage,
  onOpenCamera,
  isLoading,
  isSpeaking,
  onStopSpeaking,
  attachedImage,
  imageUploadFailed = false,
  onRemoveAttachedImage,
  onAttachImage,
}: MessageComposerProps) {
  const { language, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const speechProviderRef = useRef<BrowserWebSpeechProvider | null>(null);

  useEffect(() => {
    speechProviderRef.current = new BrowserWebSpeechProvider();
    return () => {
      speechProviderRef.current?.stopListening();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onAttachImage(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // Reset file input so the same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleListening = () => {
    if (!speechProviderRef.current) return;

    if (isListening) {
      speechProviderRef.current.stopListening();
      setIsListening(false);
    } else {
      setSpeechError(null);
      if (isSpeaking) {
        onStopSpeaking(); // Interrupt assistant
      }

      setIsListening(true);
      speechProviderRef.current.startListening(
        language,
        (res) => {
          setInputText(res.transcript);
          if (res.isFinal) {
            setIsListening(false);
            // Submit spoken query automatically
            onSendMessage(res.transcript, attachedImage || undefined);
            setInputText('');
          }
        },
        (err) => {
          setIsListening(false);
          setSpeechError(err);
        }
      );
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text && !attachedImage) return;

    onSendMessage(text, attachedImage || undefined);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 p-3 sm:p-4 shadow-2xl">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Speaking Status Bar (Farmer can interrupt anytime) */}
        {isSpeaking && (
          <div className="flex items-center justify-between bg-emerald-950 text-white px-4 py-2 rounded-2xl text-xs shadow-md border border-emerald-700 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-ping" />
              <Volume2 className="w-4 h-4 text-lime-400" />
              <span>
                {language === 'te'
                  ? 'సహాయకుడు సమాధానం చెబుతున్నాడు... (మాట్లాడి ఆపవచ్చు)'
                  : 'Assistant is speaking... (tap to interrupt)'}
              </span>
            </div>
            <button
              onClick={onStopSpeaking}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5 text-lime-300" />
              <span>{t('composer.stopSpeaking')}</span>
            </button>
          </div>
        )}

        {/* Listening Indicator */}
        {isListening && (
          <div className="flex items-center justify-between bg-red-950 text-white px-4 py-2 rounded-2xl text-xs shadow-md border border-red-700 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <Mic className="w-4 h-4 text-red-400" />
              <span className="font-semibold">{t('composer.voiceListening')}</span>
            </div>
            <button
              onClick={toggleListening}
              className="px-2.5 py-1 rounded-lg bg-red-800 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer"
            >
              {language === 'te' ? 'ఆపండి' : 'Stop'}
            </button>
          </div>
        )}

        {/* Attached Image Preview */}
        {imageUploadFailed && (
          <p role="status" className="text-[11px] text-amber-700 dark:text-amber-300">
            {language === 'te'
              ? 'చిత్రాన్ని క్లౌడ్‌లో భద్రపరచలేకపోయాం. విశ్లేషణ కొనసాగింది; Cloudinary వివరాలను తనిఖీ చేయండి.'
              : 'Image analysis continued, but Cloudinary could not store the image. Check its server credentials.'}
          </p>
        )}
        {attachedImage && (
          <div className="relative inline-block rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md">
            <img src={attachedImage} alt="Attached thumbnail" className="w-20 h-20 object-cover" />
            <button
              onClick={onRemoveAttachedImage}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/75 text-white hover:bg-black cursor-pointer"
              title={t('composer.removeImage')}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Unified Bottom Controls Bar */}
        <div className="flex items-center gap-2">
          {/* 1. Attachment Button (Crop Photo or Label Photo) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer shrink-0"
            title={t('composer.attachPhoto')}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* 2. Live Camera Button */}
          <button
            onClick={onOpenCamera}
            className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer shrink-0"
            title={t('composer.takePhoto')}
          >
            <Camera className="w-5 h-5 text-emerald-600 dark:text-lime-400" />
          </button>

          {/* 3. Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={t('composer.placeholder')}
              className="w-full bg-stone-100 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          {/* 4. Microphone Button (Voice-to-Voice) */}
          <button
            onClick={toggleListening}
            className={`p-3 rounded-2xl transition-all cursor-pointer shrink-0 shadow-md ${
              isListening
                ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200 dark:ring-red-950'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
            title={isListening ? t('composer.stopSpeaking') : t('composer.voiceSpeak')}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* 5. Send Button */}
          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !attachedImage) || isLoading}
            className="p-3 rounded-2xl bg-gradient-to-r from-lime-400 to-emerald-500 hover:brightness-105 disabled:opacity-40 text-emerald-950 font-bold transition-all shadow-md cursor-pointer shrink-0"
            title={t('composer.sendMessage')}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
