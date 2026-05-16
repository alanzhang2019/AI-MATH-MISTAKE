import { describe, expect, it, vi } from 'vitest';

import { extractFromImage } from './extract-from-image';

describe('extractFromImage', () => {
  it('normalizes structured JSON returned by the model', async () => {
    const image = new File(['fake-image'], 'math.png', { type: 'image/png' });
    const callModel = vi.fn().mockResolvedValue(
      JSON.stringify({
        problemText: ' 36 + 27 = ? ',
        studentAnswer: ' 53 ',
        correctAnswerCandidate: ' 63 ',
        confidence: 0.88,
      }),
    );

    const result = await extractFromImage(
      image,
      { subject: 'math', grade: 4 },
      {
        callModel,
      },
    );

    expect(result).toEqual({
      problemText: '36 + 27 = ?',
      studentAnswer: '53',
      correctAnswerCandidate: '63',
      confidence: 0.88,
      needsUserConfirmation: true,
      rawModelText: JSON.stringify({
        problemText: ' 36 + 27 = ? ',
        studentAnswer: ' 53 ',
        correctAnswerCandidate: ' 63 ',
        confidence: 0.88,
      }),
    });
  });

  it('throws when the model does not return problemText', async () => {
    const image = new File(['fake-image'], 'math.png', { type: 'image/png' });

    await expect(
      extractFromImage(
        image,
        { subject: 'math' },
        {
          callModel: vi.fn().mockResolvedValue(JSON.stringify({ confidence: 0.2 })),
        },
      ),
    ).rejects.toThrow('problemText is required');
  });
});
