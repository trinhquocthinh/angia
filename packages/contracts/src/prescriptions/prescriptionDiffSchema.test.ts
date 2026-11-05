import { describe, expect, it } from 'vitest';
import { prescriptionDiffSchema } from './prescriptionDiffSchema.js';

const diff = {
  added: [],
  removed: [],
  changed: [{ name: 'A', changes: [{ field: 'strength', before: '5mg', after: '10mg' }] }],
};

describe('Hợp đồng so sánh đơn (SPEC-045)', () => {
  it('TC-483: không nhận trường văn bản nhận định ở gốc, nhóm và thay đổi', () => {
    expect(prescriptionDiffSchema.safeParse(diff).success).toBe(true);
    for (const candidate of [
      { ...diff, assessment: 'Nhận định' },
      { ...diff, changed: [{ ...diff.changed[0], assessment: 'Nhận định' }] },
      {
        ...diff,
        changed: [{ name: 'A', changes: [{ ...diff.changed[0]!.changes[0], assessment: 'Nhận định' }] }],
      },
    ])
      expect(prescriptionDiffSchema.safeParse(candidate).success).toBe(false);
  });

  it('TC-482/483: field xác định kiểu before/after, không nhận field lạ hoặc danh sách đổi rỗng', () => {
    for (const changes of [
      [{ field: 'quantityPerDose', before: '1', after: 2 }],
      [{ field: 'slots', before: ['morning'], after: ['unknown'] }],
      [{ field: 'assessment', before: null, after: 'Nhận định' }],
      [],
    ])
      expect(prescriptionDiffSchema.safeParse({ ...diff, changed: [{ name: 'A', changes }] }).success).toBe(
        false,
      );
  });
});
