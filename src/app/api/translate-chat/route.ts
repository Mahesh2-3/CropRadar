import { NextRequest, NextResponse } from 'next/server';
import { generateAiText } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { messages = [], targetLanguage = 'te' } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ translations: [] });
    }

    const itemsToTranslate = messages.map((m: any) => ({
      id: m.id,
      text: m.text,
      sender: m.sender,
    }));

    const systemInstruction = `You are a professional agricultural translator for Andhra Pradesh farmers.
Translate agricultural messages between English and Telugu.
Rules:
1. When targetLanguage is 'te', translate into 100% natural, respectful, pure Telugu script. Never output English words or headings.
2. When targetLanguage is 'en', translate into clear, simple English.
3. Preserve all agricultural technical details, units, numbers, and meanings faithfully.
4. Output strictly valid JSON matching:
{
  "translations": [
    { "id": "string", "translatedText": "string", "spokenText": "string" }
  ]
}`;

    const prompt = `Target Language: ${targetLanguage === 'te' ? 'Telugu (తెలుగు)' : 'English'}.
Messages to translate:
${JSON.stringify(itemsToTranslate, null, 2)}

Return ONLY valid JSON.`;

    const aiRes = await generateAiText({
      systemInstruction,
      prompt,
      responseMimeType: 'application/json',
    });

    if (aiRes) {
      try {
        const parsed = JSON.parse(aiRes);
        return NextResponse.json({
          translations: parsed.translations || [],
        });
      } catch (e) {
        console.warn('Failed to parse translate JSON:', e);
      }
    }

    // Fallback if AI fails: echo original
    return NextResponse.json({
      translations: itemsToTranslate.map((m) => ({
        id: m.id,
        translatedText: m.text,
        spokenText: m.text,
      })),
    });
  } catch (err: any) {
    console.error('Translation error:', err);
    return NextResponse.json({ error: err.message || 'Translation failed' }, { status: 500 });
  }
}
