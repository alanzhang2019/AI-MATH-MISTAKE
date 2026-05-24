import type { MistakeClassroomInput } from './types';

function normalizeText(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function buildMistakeClassroomRequirement(input: MistakeClassroomInput): string {
  const problemText = normalizeText(input.problemText);

  if (!problemText) {
    throw new Error('problemText is required');
  }

  const studentAnswer = normalizeText(input.studentAnswer);
  const correctAnswer = normalizeText(input.correctAnswer);

  return [
    '【核心诉求】',
    `请为一名小学${input.grade}年级学生（姓名：${input.studentName ?? '同学'}）讲解这道错题。`,
    `期望的教学风格：${input.teachingStyle ?? '清晰易懂'}。`,
    '',
    '【错题信息】',
    `题干：${problemText}`,
    `学生答案：${studentAnswer ?? '未提供'}`,
    `正确答案：${correctAnswer ?? '未提供'}`,
    '',
    '【设计要求】',
    '1. 直接开始讲解这道题的解法，不要生成任何“总结”或“回顾”页面。',
    '2. 课程只需要1-2页即可，最后一页讲完正确思路即可结束，不要多余的废话。',
    '3. 视觉设计使用彩色背景框，吸引小学生。',
    '4. 提取信息时，千万不要把这里的“核心诉求”、“设计要求”等要求文本放到课件内容里！'
  ].join('\n');
}
