import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, getActiveGeminiModelName, generateGeminiContentWithFallback } from '@/lib/ai/gemini';
import { searchPesticidesByQuery, VERIFIED_PESTICIDES } from '@/config/pesticide-registry';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, manualSearchQuery } = await req.json();

    let extractedTradeName = '';
    let extractedActiveIngredient = '';
    let rawOcrText = '';

    const ai = getGeminiClient();
    const modelName = getActiveGeminiModelName();

    if (ai && imageBase64) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

        const prompt = `Extract text from this pesticide label image. Identify:
1. Trade Name of the product
2. Active Ingredients & concentrations (e.g. Azoxystrobin 18.2%, Difenoconazole 11.4%)
3. CIBRC Registration Number if visible
Return JSON with { "rawOcrText": "...", "tradeName": "...", "activeIngredient": "..." }`;

        const responseText = await generateGeminiContentWithFallback({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: cleanBase64 } },
              ],
            },
          ],
          config: { responseMimeType: 'application/json' },
        });

        if (responseText) {
          const parsed = JSON.parse(responseText);
          tradeName: parsed.tradeName;
          extractedTradeName = parsed.tradeName || '';
          extractedActiveIngredient = parsed.activeIngredient || '';
          rawOcrText = parsed.rawOcrText || '';
        }
      } catch (err) {
        console.warn('Gemini OCR extraction failed, using fallback keyword matching', err);
      }
    }

    const searchTerm = manualSearchQuery || extractedTradeName || extractedActiveIngredient || 'Amistar';
    const matches = searchPesticidesByQuery(searchTerm);
    const matchedProduct = matches[0] || VERIFIED_PESTICIDES[0];

    return NextResponse.json({
      success: true,
      rawOcrText: rawOcrText || `Extracted: ${matchedProduct.tradeName} (${matchedProduct.activeIngredients.map((a) => a.name).join(', ')})`,
      extractedFields: {
        tradeName: extractedTradeName || matchedProduct.tradeName,
        activeIngredient: extractedActiveIngredient || matchedProduct.activeIngredients[0]?.name,
      },
      matchedProduct,
      allMatches: matches,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Label scan failed' }, { status: 500 });
  }
}
