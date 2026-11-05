import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';
import { getGeminiClient } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body.text || '').trim();
    const language = body.language === 'en' ? 'en' : 'te';
    const preferredVoice = body.voiceName || (language === 'te' ? 'kore' : 'algenib');

    if (!text) {
      return NextResponse.json({ error: 'No text provided for synthesis' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ error: 'Gemini API key missing' }, { status: 500 });
    }

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: preferredVoice,
            },
          },
        },
      },
    });

    const audioPart = res.candidates
      ?.flatMap((candidate) => candidate.content?.parts || [])
      .find((part) => part.inlineData?.mimeType?.startsWith('audio'));

    const audioData = audioPart?.inlineData?.data;
    const mimeType = audioPart?.inlineData?.mimeType || 'audio/mpeg';

    if (!audioData) {
      throw new Error('Gemini TTS returned no audio payload');
    }

    return NextResponse.json({
      audioBase64: audioData,
      mimeType,
      voiceName: preferredVoice,
      language,
    });
  } catch (error: any) {
    console.error('Gemini TTS generation failed:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Text-to-speech generation failed',
      },
      { status: 500 }
    );
  }
}
