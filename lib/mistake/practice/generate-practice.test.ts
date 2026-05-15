import { describe, expect, it } from 'vitest';

import { generatePractice } from './generate-practice';

describe('generatePractice', () => {
  it('returns 2 practice suggestions for every mistake code', () => {
    expect(generatePractice('carry_mistake')).toEqual([
      { prompt: '试一试：48 + 27 = ?', answer: '75' },
      { prompt: '再做一道：56 + 18 = ?', answer: '74' },
    ]);
    expect(generatePractice('borrow_mistake')).toEqual([
      { prompt: '试一试：72 - 38 = ?', answer: '34' },
      { prompt: '再做一道：61 - 26 = ?', answer: '35' },
    ]);
    expect(generatePractice('operator_confusion')).toEqual([
      { prompt: '判断：12 - 5 和 12 + 5 的结果一样吗？', answer: '不一样' },
      { prompt: '计算：9 x 3 = ?', answer: '27' },
    ]);
    expect(generatePractice('bracket_order_error')).toEqual([
      { prompt: '先算括号：(8 + 4) x 2 = ?', answer: '24' },
      { prompt: '再试：18 - (6 + 3) = ?', answer: '9' },
    ]);
    expect(generatePractice('unit_conversion_error')).toEqual([
      { prompt: '1 米 = ? 厘米', answer: '100' },
      { prompt: '2 小时 = ? 分钟', answer: '120' },
    ]);
    expect(generatePractice('concept_gap')).toEqual([
      { prompt: '把题目中的已知条件和问题各说一遍。', answer: '按题意复述即可' },
      { prompt: '再做一道同知识点基础题。', answer: '根据老师或系统推荐题目完成' },
    ]);
  });
});
