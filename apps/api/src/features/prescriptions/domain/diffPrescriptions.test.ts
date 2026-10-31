import { describe, expect, it } from 'vitest';
import { reusablePrescription } from '@src/shared/test/reusablePrescription.js';
import { diffPrescriptions } from './diffPrescriptions.js';
import type { Prescription } from './Prescription.js';

type Item = Prescription['items'][number];
const item = (patch: Partial<Item> = {}): Item => ({ ...reusablePrescription().items[0]!, ...patch });
const prescription = (items: Item[]): Prescription => ({ ...reusablePrescription(), items });
const diff = (before: Item[], after: Item[]) => diffPrescriptions(prescription(before), prescription(after));

describe('So sánh đơn chỉ liệt kê sự kiện (SPEC-045)', () => {
  it('TC-481: thêm, bỏ, đổi hàm lượng theo tên không phân biệt hoa, dấu và khoảng trắng', () => {
    const removed = item({ id: 'b', name: 'Metformin' });
    const added = item({ id: 'c', name: 'Losartan' });
    expect(
      diff([item({ name: '  Ámlodipin ' }), removed], [item({ name: 'amlodipin', strength: '10mg' }), added]),
    ).toEqual({
      added: [{ name: 'Losartan', items: [added] }],
      removed: [{ name: 'Metformin', items: [removed] }],
      changed: [{ name: 'amlodipin', changes: [{ field: 'strength', before: '5mg', after: '10mg' }] }],
    });
  });

  it('TC-482: slots là tập; ID, tên chuẩn hóa, note và totalQuantity không phải trường so sánh', () => {
    expect(
      diff(
        [item({ slots: ['morning', 'evening'] })],
        [
          item({
            id: 'new',
            name: 'AMLODIPIN',
            slots: ['evening', 'morning'],
            note: 'Ghi chú',
            totalQuantity: 60,
          }),
        ],
      ),
    ).toEqual({ added: [], removed: [], changed: [] });
  });

  it('TC-482: liệt kê riêng từng trường đổi, kể cả null, dài hạn và dùng ngoài', () => {
    expect(
      diff(
        [item()],
        [
          item({
            strength: null,
            quantityPerDose: null,
            doseUnit: null,
            slots: ['as_needed'],
            durationDays: null,
            longTerm: true,
            externalUse: true,
          }),
        ],
      ).changed[0]?.changes,
    ).toEqual([
      { field: 'strength', before: '5mg', after: null },
      { field: 'quantityPerDose', before: 1, after: null },
      { field: 'doseUnit', before: 'viên', after: null },
      { field: 'slots', before: ['morning'], after: ['as_needed'] },
      { field: 'durationDays', before: 30, after: null },
      { field: 'longTerm', before: false, after: true },
      { field: 'externalUse', before: false, after: true },
    ]);
  });

  it('TC-482: khác số dòng cùng tên chỉ trả lines kèm đầy đủ hai danh sách', () => {
    const before = [item()];
    const after = [item({ strength: '10mg' }), item({ id: 'second', strength: '20mg' })];
    expect(diff(before, after)).toEqual({
      added: [],
      removed: [],
      changed: [{ name: 'Amlodipin', changes: [{ field: 'lines', before, after }] }],
    });
    expect(diff(after, before).changed[0]?.changes).toEqual([
      { field: 'lines', before: after, after: before },
    ]);
  });

  it('TC-482: ghép dòng giống trước, không đổi khi đảo thứ tự, phần dư theo thứ tự trên đơn', () => {
    const a = item();
    const b = item({ id: 'b', strength: '10mg' });
    expect(diff([a, b], [b, a]).changed).toEqual([]);
    expect(diff([a, b], [item({ strength: '20mg' }), a]).changed).toEqual([
      { name: 'Amlodipin', changes: [{ field: 'strength', before: '10mg', after: '20mg' }] },
    ]);
    expect(diff([a, a], [a, b]).changed).toHaveLength(1);
    expect(
      diff([a, b], [item({ strength: '20mg' }), item({ strength: '30mg' })]).changed.map((c) => c.changes),
    ).toEqual([
      [{ field: 'strength', before: '5mg', after: '20mg' }],
      [{ field: 'strength', before: '10mg', after: '30mg' }],
    ]);
  });

  it('TC-483: cấu trúc chỉ có added/removed/changed, giữ nguyên đầu vào và xử lý đơn rỗng', () => {
    const previous = prescription([item()]);
    const current = prescription([item({ strength: '10mg' })]);
    const snapshot = structuredClone({ previous, current });
    expect(Object.keys(diffPrescriptions(previous, current))).toEqual(['added', 'removed', 'changed']);
    expect({ previous, current }).toEqual(snapshot);
    expect(diff([], [])).toEqual({ added: [], removed: [], changed: [] });
    expect(diff([], previous.items).added).toHaveLength(1);
    expect(diff(previous.items, []).removed).toHaveLength(1);
  });
});
