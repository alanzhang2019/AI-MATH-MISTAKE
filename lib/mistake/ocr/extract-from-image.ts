import { Buffer } from 'node:buffer';
import { z } from 'zod';

import { callLLM } from '@/lib/ai/llm';
import { resolveModel } from '@/lib/server/resolve-model';

import { normalizeExtraction } from './normalize-extraction';
import type { ExtractImageOptions, MistakeImageExtraction } from './types';

const extractionSchema = z.object({
  problemText: z.string().optional(),
  studentAnswer: z.string().optional(),
  correctAnswerCandidate: z.string().optional(),
  confidence: z.number().optional(),
});

function parseExtractionJson(rawModelText: string) {
  const trimmed = rawModelText.trim();
  const withoutCodeFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const jsonText = withoutCodeFence.match(/\{[\s\S]*\}/)?.[0] ?? withoutCodeFence;

  return extractionSchema.parse(JSON.parse(jsonText));
}

export interface ExtractDependencies {
  callModel?: (input: { image: File; options: ExtractImageOptions }) => Promise<string>;
}

async function callVisionModel(input: {
  image: File;
  options: ExtractImageOptions;
}): Promise<string> {
  const resolved = await resolveModel({
    modelString: process.env.MISTAKE_OCR_MODEL || 'openai/gpt-4o-mini',
  });

  const result = await callLLM(
    {
      model: resolved.model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                '你是数学错题图片提取器。只处理单题单图。请提取 problemText、studentAnswer、correctAnswerCandidate、confidence，并只返回 JSON。看不清可以留空，不要编造。',
            },
            {
              type: 'text',
              text: `subject=${input.options.subject}; grade=${input.options.grade ?? 'unknown'}`,
            },
            {
              type: 'image',
              image: Buffer.from(await input.image.arrayBuffer()),
              mimeType: input.image.type,
            },
          ],
        },
      ],
    },
    'mistake-ocr-extract',
  );

  return result.text;
}

export async function extractFromImage(
  image: File,
  options: ExtractImageOptions,
  dependencies: ExtractDependencies = {},
): Promise<MistakeImageExtraction> {
  const rawModelText = await (dependencies.callModel ?? callVisionModel)({
    image,
    options,
  });
  const parsed = parseExtractionJson(rawModelText);

  return normalizeExtraction({
    ...parsed,
    rawModelText,
  });
}
