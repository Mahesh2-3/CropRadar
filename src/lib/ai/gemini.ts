import { GoogleGenAI } from '@google/genai';

/**
 * Google AI Studio Gemini Client Provider
 * Uses configurable multimodal model (defaulting to gemini-3.5-flash-lite)
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export function getActiveGeminiModelName(): string {
  return process.env.GEMINI_MODEL_NAME || 'gemini-3.5-flash-lite';
}

/**
 * Robust multimodal content generator with auto-failover
 * across active production models to avoid transient 503s.
 */
export async function generateGeminiContentWithFallback(params: {
  contents: any[];
  config?: any;
}): Promise<string | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const candidateModels = [
    getActiveGeminiModelName(),
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-latest',
  ];

  const tried = new Set<string>();

  for (const model of candidateModels) {
    if (tried.has(model)) continue;
    tried.add(model);

    try {
      const res = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });

      if (res && res.text) {
        return res.text;
      }
    } catch (err: any) {
      console.warn(`Gemini generation on model '${model}' failed:`, err.message || err);
      // continue to next candidate model
    }
  }

  return null;
}

/**
 * High-level helper for text-only AI generation
 */
export async function generateAiText(options: {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: string;
}): Promise<string | null> {
  const combinedPrompt = options.systemInstruction
    ? `${options.systemInstruction}\n\n${options.prompt}`
    : options.prompt;

  return generateGeminiContentWithFallback({
    contents: [
      {
        role: 'user',
        parts: [{ text: combinedPrompt }],
      },
    ],
    config: options.responseMimeType ? { responseMimeType: options.responseMimeType } : undefined,
  });
}

/**
 * High-level helper for multimodal image + text AI generation
 */
export async function generateAiMultimodal(options: {
  prompt: string;
  imageBase64: string;
  mimeType?: string;
  systemInstruction?: string;
  responseMimeType?: string;
}): Promise<string | null> {
  const cleanBase64 = options.imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const detectedMime =
    options.mimeType ||
    (options.imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg');

  const combinedPrompt = options.systemInstruction
    ? `${options.systemInstruction}\n\n${options.prompt}`
    : options.prompt;

  return generateGeminiContentWithFallback({
    contents: [
      {
        role: 'user',
        parts: [
          { text: combinedPrompt },
          {
            inlineData: {
              mimeType: detectedMime,
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    config: options.responseMimeType ? { responseMimeType: options.responseMimeType } : undefined,
  });
}
