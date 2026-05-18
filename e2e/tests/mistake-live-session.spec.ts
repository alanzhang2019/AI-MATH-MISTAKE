import { expect, test } from '../fixtures/base';

test.describe('mistake live session page', () => {
  test('shows waiting state until classroomId is available, then enters classroom', async ({
    page,
    mockApi,
  }) => {
    await mockApi.mockGetMistakeSession([
      {
        success: true,
        session: {
          id: 'session-1',
          status: 'waiting_first_scene',
          confirmed: { problemText: '36 + 27 = ?', studentAnswer: '53', correctAnswer: '63' },
        },
      },
      {
        success: true,
        session: {
          id: 'session-1',
          status: 'live',
          classroomId: 'classroom-1',
          confirmed: { problemText: '36 + 27 = ?', studentAnswer: '53', correctAnswer: '63' },
        },
      },
    ]);

    await page.goto('/mistake/session/session-1');
    await expect(page.getByText('正在准备第一段讲解')).toBeVisible();
    await page.waitForURL('**/classroom/classroom-1');
  });
});
