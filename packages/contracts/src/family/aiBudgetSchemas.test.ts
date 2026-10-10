import { describe, expect, it } from 'vitest';
import { updateAiBudgetRequestSchema } from './aiBudgetSchemas.js';

const parse = (monthlyCapUsd: unknown) => updateAiBudgetRequestSchema.safeParse({ monthlyCapUsd }).success;

describe('Trần ngân sách AI (SPEC-013)', () => {
  it('nhận 0.00 – 100.00 với tối đa 2 chữ số thập phân', () => {
    expect([0, 2, 1.1, 0.07, 4.99, 100].map(parse)).toEqual([true, true, true, true, true, true]);
  });

  it('từ chối âm, vượt 100, lẻ hơn 0.01 hoặc không phải số', () => {
    expect([-0.01, 100.01, 1.005, '2', null].map(parse)).toEqual([false, false, false, false, false]);
  });
});
