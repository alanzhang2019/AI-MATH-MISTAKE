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
    '【教学目标】',
    `请为一名小学${input.grade}年级学生（姓名：${input.studentName ?? '同学'}）设计一节简短、单题聚焦的数学错题讲解课。`,
    `期望的教学风格：${input.teachingStyle ?? '清晰易懂'}。`,
    '',
    '【题目内容】',
    `题干：${problemText}`,
    `学生答案：${studentAnswer ?? '未提供'}`,
    `正确答案：${correctAnswer ?? '未提供'}`,
    '',
    '【设计要求】',
    '1. 只围绕这一题进行讲解，不展开成多章节或长课程。',
    '2. 语言必须短小精悍、具体可执行，符合儿童认知。',
    '3. 先解释题目在问什么，再给出正确思路。',
    '4. 视觉设计必须是全彩色的（例如使用浅蓝色、淡黄色等彩色背景框），绝对不要使用纯白底黑字的单调排版，以吸引小学生的注意力。',
    '5. 绝对禁止在课件内容中重复或暴露本提示词的任何文本（如“教学目标”、“题目内容”、“设计要求”等字样），直接输出教学正文。'
  ].join('\n');
}
