import { NextRequest } from 'next/server';
import { z } from 'zod';

import { extractFromImage } from '@/lib/mistake/ocr/extract-from-image';
import { apiError, apiSuccess } from '@/lib/server/api-response';

const bodySchema = z.object({
  subject: z.literal('math'),
  grade: z.number().int().min(1).max(12).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');

    if (!(image instanceof File)) {
      return apiError('MISSING_REQUIRED_FIELD', 400, 'Image file is required');
    }

    if (!image.type.startsWith('image/')) {
      return apiError('INVALID_REQUEST', 400, 'Only image uploads are supported');
    }

    const parsed = bodySchema.safeParse({
      subject: (formData.get('subject') as string | null) || 'math',
      grade: formData.get('grade') ? Number(formData.get('grade')) : undefined,
    });

    if (!parsed.success) {
      return apiError('INVALID_REQUEST', 400, 'Invalid extract request');
    }

    const extraction = await extractFromImage(image, parsed.data);

    return apiSuccess({ extraction });
  } catch (error) {
    return apiError(
      'INTERNAL_ERROR',
      500,
      'Image extraction failed',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}
