import path from 'node:path';

import { expect, test } from '../fixtures/base';

test.describe('/mistake capture shell', () => {
  test('high confidence extraction skips confirm and jumps to live session', async ({
    page,
    mockApi,
  }) => {
    await mockApi.mockMistakeExtract({
      success: true,
      extraction: {
        problemText: '36 + 27 = ?',
        studentAnswer: '53',
        correctAnswerCandidate: '63',
        confidence: 0.95,
        needsUserConfirmation: false,
      },
    });

    await mockApi.mockCreateMistakeSession({
      success: true,
      session: { id: 'session-1', status: 'ready_to_generate' },
      liveUrl: 'http://localhost:3000/mistake/session/session-1',
    });

    await mockApi.mockMistakeGenerateClassroom({
      success: true,
      jobId: 'job-1',
      status: 'queued',
      step: 'queued',
      message: 'Classroom generation job queued',
      pollUrl: 'http://localhost:3000/api/generate-classroom/job-1',
      pollIntervalMs: 5000,
      requirementPreview: 'mock requirement',
    });

    await page.goto('/mistake');
    await page.setInputFiles('input[type="file"]', path.resolve('public/logos/kimi.png'));
    await page.getByRole('button', { name: '拍照识题' }).click();

    await page.waitForURL('**/mistake/session/session-1');
  });

  test('low confidence extraction stays on page for light confirmation', async ({ page, mockApi }) => {
    await mockApi.mockMistakeExtract({
      success: true,
      extraction: {
        problemText: '24 ÷ 6 = ?',
        studentAnswer: '',
        correctAnswerCandidate: '4',
        confidence: 0.62,
        needsUserConfirmation: true,
      },
    });

    await page.goto('/mistake');
    await page.setInputFiles('input[type="file"]', path.resolve('public/logos/kimi.png'));
    await page.getByRole('button', { name: '拍照识题' }).click();

    await expect(page.getByLabel('题干')).toHaveValue('24 ÷ 6 = ?');
    await expect(page.getByRole('button', { name: '开始讲解' })).toBeVisible();
  });
});
