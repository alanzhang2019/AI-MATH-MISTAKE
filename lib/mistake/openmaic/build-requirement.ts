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
    '请围绕以下一题小学数学错题生成一个简短、单题聚焦的讲解课堂/讲解视频内容。',
    '',
    '基础信息：',
    `- 学生姓名：${input.studentName ?? '同学'}`,
    `- 年级：${input.grade}`,
    `- 学科：${input.subject}`,
    `- 来源：${input.source}`,
    `- 期望的教学风格：${input.teachingStyle ?? '清晰易懂'}`,
    '',
    '题目信息：',
    `- 题干：${problemText}`,
    `- 学生答案：${studentAnswer ?? '未提供'}`,
    `- 正确答案候选：${correctAnswer ?? '未提供'}`,
    '',
    '生成要求：',
    '- 只围绕这一题讲解',
    '- 面向 4-6 年级儿童',
    '- 语言短、具体、可执行',
    '- 先解释题目在问什么，再给出正确思路',
    '- 最后补 1-2 个同类变式题用于巩固',
    '- 不展开成多章节、长课程或泛学科内容',
  ].join('\n');
}
