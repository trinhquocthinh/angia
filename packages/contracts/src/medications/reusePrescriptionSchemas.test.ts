import { describe, expect, it } from 'vitest';
import { reusePrescriptionRequestSchema } from './reusePrescriptionSchemas.js';

const itemId = '0192f000-0000-7000-8000-000000000001';
const otherId = '0192f000-0000-7000-8000-000000000002';
const item = { prescriptionItemId: itemId, durationDays: 30, longTerm: false };

describe('Hợp đồng Dùng lại đơn thuốc (SPEC-029)', () => {
  it('TC-277: nhận ngày lịch, ≥ 1 dòng không trùng, số ngày nguyên 1–3650 hoặc null', () => {
    expect(
      reusePrescriptionRequestSchema.parse({
        startDate: '2026-10-13',
        items: [item, { prescriptionItemId: otherId, durationDays: null, longTerm: true }],
      }).items,
    ).toHaveLength(2);
    for (const body of [
      { startDate: '2026-10-13', items: [] },
      { startDate: '2026-02-30', items: [item] },
      { startDate: '2026-10-13', items: [item, item] },
      { startDate: '2026-10-13', items: [{ ...item, durationDays: 0 }] },
      { startDate: '2026-10-13', items: [{ ...item, durationDays: 3651 }] },
      { startDate: '2026-10-13', items: [{ ...item, durationDays: 1.5 }] },
      { startDate: '2026-10-13', items: [{ ...item, quantityPerDose: 2 }] },
      { startDate: '2026-10-13', items: [{ ...item, expectedConflictCourseIds: [itemId, itemId] }] },
      { startDate: '2026-10-13', items: [item], healthProfileId: itemId },
    ])
      expect(reusePrescriptionRequestSchema.safeParse(body).success).toBe(false);
  });
});
