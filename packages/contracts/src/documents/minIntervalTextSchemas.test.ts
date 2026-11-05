import { describe, expect, it } from 'vitest';
import { prescriptionApprovalSchema } from './approvalDataSchemas.js';

const item = {
  name: 'Paracetamol',
  strength: '250mg',
  quantityPerDose: null,
  doseUnit: 'gói',
  slots: ['as_needed'],
  durationDays: 5,
  longTerm: false,
  note: null,
  totalQuantity: null,
};
const prescription = (items: object[]) => ({
  type: 'prescription',
  issuedDate: '2026-11-01',
  facility: null,
  diagnosis: null,
  items,
});

describe('Hợp đồng khoảng cách in trên đơn (SPEC-047, SDD §2.1.1)', () => {
  it('TC-495: dòng "Khi cần" giữ nguyên văn khoảng cách; bản cũ đọc thành null', () => {
    const parsed = prescriptionApprovalSchema.parse(
      prescription([{ ...item, minIntervalText: 'cách 4–6 giờ' }, item]),
    );
    expect(parsed.items.map((i) => i.minIntervalText)).toEqual(['cách 4–6 giờ', null]);
  });
  it('TC-498: dòng không phải "Khi cần" hoặc quá 100 ký tự bị từ chối', () => {
    for (const bad of [
      { ...item, slots: ['morning'], quantityPerDose: 1, minIntervalText: 'cách 6 giờ' },
      { ...item, minIntervalText: 'x'.repeat(101) },
    ]) {
      expect(prescriptionApprovalSchema.safeParse(prescription([bad])).success).toBe(false);
    }
  });
});
