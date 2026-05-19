import { promises as fs } from 'fs';
import path from 'path';

import { nanoid } from 'nanoid';

import {
  ensureMistakeSessionsDir,
  MISTAKE_SESSIONS_DIR,
  writeJsonFileAtomic,
} from '@/lib/server/classroom-storage';

import type { CreateMistakeSessionInput, MistakeSession } from './types';

export { MISTAKE_SESSIONS_DIR } from '@/lib/server/classroom-storage';

function sessionFilePath(sessionId: string) {
  return path.join(MISTAKE_SESSIONS_DIR, `${sessionId}.json`);
}

export async function createMistakeSession(
  input: CreateMistakeSessionInput,
): Promise<MistakeSession> {
  const now = new Date().toISOString();
  const session: MistakeSession = {
    id: nanoid(10),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  await ensureMistakeSessionsDir();
  await writeJsonFileAtomic(sessionFilePath(session.id), session);
  return session;
}

export async function readMistakeSession(sessionId: string): Promise<MistakeSession | null> {
  try {
    const raw = await fs.readFile(sessionFilePath(sessionId), 'utf-8');
    return JSON.parse(raw) as MistakeSession;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

export async function updateMistakeSession(
  sessionId: string,
  patch: Partial<MistakeSession>,
): Promise<MistakeSession> {
  const existing = await readMistakeSession(sessionId);
  if (!existing) {
    throw new Error(`Mistake session not found: ${sessionId}`);
  }

  const updated: MistakeSession = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFileAtomic(sessionFilePath(sessionId), updated);
  return updated;
}
