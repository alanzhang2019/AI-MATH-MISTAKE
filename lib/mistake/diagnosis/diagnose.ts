import type { DiagnosisResult, MistakeCode, ProblemInput } from '@/lib/mistake/domain/types';
import { getMistakeLabel } from '@/lib/mistake/taxonomy/mistake-taxonomy';

type DiagnosisSummary = Pick<
  DiagnosisResult,
  'normalizedProblemText' | 'guessedMistake' | 'confidence' | 'knowledgePoint' | 'parentSummary'
>;

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function toNumber(value?: string): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function inferMistakeCode(input: ProblemInput): { code: MistakeCode; confidence: number } {
  const text = normalizeText(input.problemText);
  const lower = text.toLowerCase();
  const studentAnswer = toNumber(input.studentAnswer);
  const correctAnswer = toNumber(input.correctAnswer);

  if (
    lower.includes('进位') ||
    (/(\d+)\s*\+\s*(\d+)/.test(text) &&
      studentAnswer !== null &&
      correctAnswer !== null &&
      correctAnswer - studentAnswer === 10)
  ) {
    return { code: 'carry_mistake', confidence: 0.88 };
  }

  if (/(厘米|米|千米|克|千克|小时|分钟)/.test(text) || lower.includes('单位')) {
    return { code: 'unit_conversion_error', confidence: 0.73 };
  }

  return { code: 'concept_gap', confidence: 0.6 };
}

export function diagnoseMistake(input: ProblemInput): DiagnosisSummary {
  const normalizedProblemText = normalizeText(input.problemText);
  const { code, confidence } = inferMistakeCode({
    ...input,
    problemText: normalizedProblemText,
  });
  const mistakeLabel = getMistakeLabel(code);

  return {
    normalizedProblemText,
    guessedMistake: code,
    confidence,
    knowledgePoint: mistakeLabel.name,
    parentSummary: {
      headline: `本次错题更接近“${mistakeLabel.name}”。`,
      nextStep: `优先复习“${mistakeLabel.name}”，并完成 2 道同类题验证是否真正改正。`,
    },
  };
}
