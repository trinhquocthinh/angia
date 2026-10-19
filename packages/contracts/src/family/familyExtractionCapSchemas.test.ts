import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { requeueAwaitingBudgetJobSchema } from '../jobs/requeueAwaitingBudgetJob.js';
import { updateFamilyExtractionCapRequestSchema } from './familyExtractionCapSchemas.js';

const parse = (capUsd: unknown) => updateFamilyExtractionCapRequestSchema.safeParse({ capUsd }).success;

describe('Trần chi phí OCR theo gia đình (SPEC-031)', () => {
  it('nhận 0.00 – 100.00 đúng cent, và null = về mặc định', () => {
    expect([0, 0.5, 100, null].map(parse)).toEqual([true, true, true, true]);
  });

  it('từ chối âm, vượt 100, lẻ hơn cent hoặc thiếu trường', () => {
    expect([-1, 100.01, 0.505, '0.5', undefined].map(parse)).toEqual([false, false, false, false, false]);
  });

  it('job requeue nhận payload rỗng (cron) hoặc một familyId UUID', () => {
    expect(requeueAwaitingBudgetJobSchema.safeParse({}).success).toBe(true);
    expect(requeueAwaitingBudgetJobSchema.safeParse({ familyId: randomUUID() }).success).toBe(true);
    expect(requeueAwaitingBudgetJobSchema.safeParse({ familyId: 'x' }).success).toBe(false);
  });
});
