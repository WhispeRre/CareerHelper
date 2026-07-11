import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent';

export async function POST(request: NextRequest) {
  try {
    const { image, prompt, requirements, aspectRatio, apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API Key is required' },
        { status: 400 }
      );
    }

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Build final prompt with aspect ratio and requirements
    let finalPrompt = prompt;
    if (aspectRatio && aspectRatio !== '1:1') {
      finalPrompt += `\n\nOutput image aspect ratio: ${aspectRatio} (width:height).`;
    }
    if (requirements) {
      finalPrompt += `\n\nAdditional requirements: ${requirements}`;
    }

    // Extract base64 data and mime type from data URL
    const dataUrlMatch = image.match(/^data:(image\/[\w+]+);base64,([\s\S]+)$/);
    const mimeType = dataUrlMatch ? dataUrlMatch[1] : 'image/jpeg';
    const base64Data = dataUrlMatch ? dataUrlMatch[2] : image;

    // Gemini REST API accepts both camelCase and snake_case in requests,
    // but we use camelCase to match the canonical proto-JSON format.
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: finalPrompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Gemini API error:', res.status, errBody);

      if (res.status === 400 || res.status === 403) {
        return NextResponse.json(
          { error: 'invalid_key', detail: errBody },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'generate_failed', detail: errBody },
        { status: res.status }
      );
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts;

    if (!parts || parts.length === 0) {
      // Check for safety filtering (handle both camelCase and snake_case)
      const candidate = data?.candidates?.[0];
      const finishReason = candidate?.finishReason ?? candidate?.finish_reason;
      if (finishReason === 'SAFETY') {
        return NextResponse.json(
          { error: 'safety_filtered' },
          { status: 400 }
        );
      }
      console.error('Gemini empty response:', JSON.stringify(data).slice(0, 500));
      return NextResponse.json(
        { error: 'generate_failed', detail: 'No content in response' },
        { status: 500 }
      );
    }

    // Extract image and text from parts
    // Handle both camelCase (inlineData/mimeType) and snake_case (inline_data/mime_type)
    let resultImage: string | null = null;
    let resultText: string | null = null;

    for (const part of parts) {
      const inlineData = part.inlineData ?? part.inline_data;
      if (inlineData) {
        const mime = inlineData.mimeType ?? inlineData.mime_type ?? 'image/png';
        resultImage = `data:${mime};base64,${inlineData.data}`;
      }
      if (part.text) {
        resultText = part.text;
      }
    }

    if (!resultImage) {
      console.error('Gemini no image in parts:', JSON.stringify(parts.map((p: Record<string, unknown>) => Object.keys(p))));
      return NextResponse.json(
        { error: 'generate_failed', detail: 'No image in response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ image: resultImage, text: resultText });
  } catch (err) {
    console.error('LinkedIn photo generation error:', err);
    return NextResponse.json(
      { error: 'generate_failed', detail: String(err) },
      { status: 500 }
    );
  }
}
