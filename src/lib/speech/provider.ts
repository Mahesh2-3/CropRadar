import { LanguageCode } from '@/types/models';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  detectedLanguage: LanguageCode;
}

export interface BrowserSpeechCapabilities {
  hasRecognition: boolean;
  hasSynthesis: boolean;
  hasTeluguVoice: boolean;
  hasEnglishVoice: boolean;
  browserRecognizesTelugu: boolean;
}

export interface VoicePreferenceResult {
  recognitionMode: 'browser' | 'disabled';
  ttsMode: 'browser' | 'gemini';
  speechLanguage: 'te-IN' | 'en-IN';
  preferredVoice: string;
}

export function detectBrowserSpeechCapabilities(): BrowserSpeechCapabilities {
  if (typeof window === 'undefined') {
    return {
      hasRecognition: false,
      hasSynthesis: false,
      hasTeluguVoice: false,
      hasEnglishVoice: false,
      browserRecognizesTelugu: false,
    };
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  const voices = synth?.getVoices?.() || [];

  const hasEnglishVoice = voices.some((voice: SpeechSynthesisVoice) =>
    typeof voice.lang === 'string' && voice.lang.toLowerCase().startsWith('en')
  );
  const hasTeluguVoice = voices.some((voice: SpeechSynthesisVoice) => {
    const lang = typeof voice.lang === 'string' ? voice.lang.toLowerCase() : '';
    const name = typeof voice.name === 'string' ? voice.name.toLowerCase() : '';
    return lang.startsWith('te') || name.includes('telugu');
  });

  return {
    hasRecognition: Boolean(SpeechRecognition),
    hasSynthesis: Boolean(synth),
    hasTeluguVoice,
    hasEnglishVoice,
    browserRecognizesTelugu: Boolean(SpeechRecognition && hasTeluguVoice),
  };
}

export function resolveVoicePreference(
  language: LanguageCode,
  capabilities: BrowserSpeechCapabilities
): VoicePreferenceResult {
  const useTelugu = language === 'te';

  if (useTelugu) {
    return capabilities.hasTeluguVoice
      ? {
          recognitionMode: capabilities.hasRecognition ? 'browser' : 'disabled',
          ttsMode: 'browser',
          speechLanguage: 'te-IN',
          preferredVoice: 'browser-telugu-voice',
        }
      : {
          recognitionMode: capabilities.hasRecognition ? 'browser' : 'disabled',
          ttsMode: 'gemini',
          speechLanguage: 'te-IN',
          preferredVoice: 'kore',
        };
  }

  return {
    recognitionMode: capabilities.hasRecognition ? 'browser' : 'disabled',
    ttsMode: capabilities.hasSynthesis ? 'browser' : 'browser',
    speechLanguage: 'en-IN',
    preferredVoice: 'algenib',
  };
}

export interface ISpeechProvider {
  isSupported(): boolean;
  startListening(
    language: LanguageCode,
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void
  ): void;
  stopListening(): void;
  speak(text: string, language: LanguageCode, onEnd?: () => void): void;
  stopSpeaking(): void;
}

/**
 * Web Speech API Implementation for Client-side Browser Execution, with Gemini TTS fallback
 * when the browser does not expose a Telugu voice or the device lacks speech support.
 */
export class BrowserWebSpeechProvider implements ISpeechProvider {
  private recognition: any = null;
  private synth: SpeechSynthesis | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      }
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      }
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && (this.recognition !== null || this.synth !== null);
  }

  startListening(
    language: LanguageCode,
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void
  ): void {
    if (!this.recognition) {
      onError('Browser does not support SpeechRecognition. Please use text input.');
      return;
    }

    this.recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';

    this.recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      const confidence = event.results[current][0].confidence || 0.9;
      const isFinal = event.results[current].isFinal;

      onResult({
        transcript,
        confidence,
        isFinal,
        detectedLanguage: language,
      });
    };

    this.recognition.onerror = (event: any) => {
      onError(`Speech recognition error: ${event.error}`);
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('SpeechRecognition start failed (might already be running)', e);
    }
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // no-op
      }
    }
  }

  private async speakWithGemini(text: string, language: LanguageCode, onEnd?: () => void): Promise<void> {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
          voiceName: language === 'te' ? 'kore' : 'algenib',
        }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const payload = await response.json();
      const audioBase64 = payload.audioBase64;
      const mimeType = payload.mimeType || 'audio/mpeg';

      if (!audioBase64) {
        throw new Error('Gemini TTS returned no audio payload');
      }

      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }

      const blob = new Blob([bytes], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        onEnd?.();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        onEnd?.();
      };

      await audio.play();
    } catch (error) {
      console.warn('Gemini TTS fallback failed:', error);
      onEnd?.();
    }
  }

  speak(text: string, language: LanguageCode, onEnd?: () => void): void {
    if (!text?.trim()) {
      onEnd?.();
      return;
    }

    const capabilities = detectBrowserSpeechCapabilities();
    const preference = resolveVoicePreference(language, capabilities);

    if (this.synth && preference.ttsMode === 'browser' && !this.currentAudio) {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = preference.speechLanguage;
      utterance.rate = 0.9;

      const voices = this.synth.getVoices();
      const matchingVoice = voices.find((voice) => {
        const lang = voice.lang.toLowerCase();
        const name = voice.name.toLowerCase();
        return language === 'te'
          ? lang.startsWith('te') || name.includes('telugu')
          : lang.startsWith('en') || name.includes('english');
      });

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = () => onEnd();
      }

      this.synth.speak(utterance);
      return;
    }

    if (preference.ttsMode === 'gemini') {
      this.speakWithGemini(text, language, onEnd);
      return;
    }

    if (onEnd) onEnd();
  }

  stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }
}
