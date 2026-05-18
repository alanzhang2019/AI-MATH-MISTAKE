import { type NextRequest } from 'next/server';

import { readMistakeSession } from '@/lib/mistake/session/store';
import { apiError, apiSuccess } from '@/lib/server/api-response';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await readMistakeSession(id);

  if (!session) {
    return apiError('INVALID_REQUEST', 404, '错题会话不存在');
  }

  return apiSuccess({ session });
}
