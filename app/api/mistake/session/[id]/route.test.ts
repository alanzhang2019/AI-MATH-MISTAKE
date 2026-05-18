import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/mistake/session/store', () => ({
  readMistakeSession: vi.fn(async (id: string) =>
    id === 'session-1'
      ? {
          id: 'session-1',
          source: 'photo',
          ocr: { problemText: '36 + 27 = ?', confidence: 0.92 },
          confirmed: { problemText: '36 + 27 = ?', studentAnswer: '53', correctAnswer: '63' },
          status: 'live',
          classroomId: 'classroom-1',
          createdAt: '2026-05-18T00:00:00.000Z',
          updatedAt: '2026-05-18T00:00:00.000Z',
        }
      : null,
  ),
}));

import { GET } from './route';

describe('GET /api/mistake/session/[id]', () => {
  it('returns the stored session', async () => {
    const request = new Request('http://localhost/api/mistake/session/session-1');
    const response = await GET(request as never, {
      params: Promise.resolve({ id: 'session-1' }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.session.classroomId).toBe('classroom-1');
  });
});
