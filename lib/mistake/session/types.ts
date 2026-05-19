export type MistakeSessionStatus =
  | 'draft'
  | 'ready_to_generate'
  | 'waiting_first_scene'
  | 'live'
  | 'failed'
  | 'completed';

export interface MistakeSession {
  id: string;
  source: 'photo' | 'upload';
  imageUrl?: string;
  ocr: {
    problemText: string;
    studentAnswer?: string;
    correctAnswerCandidate?: string;
    confidence?: number;
  };
  confirmed: {
    problemText: string;
    studentAnswer?: string;
    correctAnswer?: string;
  };
  classroomJobId?: string;
  classroomId?: string;
  error?: string;
  status: MistakeSessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMistakeSessionInput {
  source: 'photo' | 'upload';
  imageUrl?: string;
  ocr: MistakeSession['ocr'];
  confirmed: MistakeSession['confirmed'];
  status: MistakeSessionStatus;
}
