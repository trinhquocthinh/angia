import { describe, expect, it } from 'vitest';
import { savedPrescription } from './documentEntryFixtures.test-helper';
import { initialReuseForm, toReuseRequest, reuseDateBounds, validateReuseForm } from './reuseForm';

const [amlodipin, metformin, kem] = savedPrescription.items;

describe('TC-283 form Dùng lại đơn', () => {
  it('mặc định hôm nay, chọn mọi dòng, số ngày như đơn gốc, dòng dài hạn bật Dài hạn', () => {
    expect(initialReuseForm(savedPrescription, '2026-10-13')).toEqual({
      startDate: '2026-10-13',
      items: [
        { prescriptionItemId: amlodipin!.id, selected: true, durationDays: '30', longTerm: false },
        { prescriptionItemId: metformin!.id, selected: true, durationDays: '', longTerm: true },
        { prescriptionItemId: kem!.id, selected: true, durationDays: '7', longTerm: false },
      ],
    });
    expect(reuseDateBounds('2026-10-01', '2026-10-13')).toEqual({ min: '2026-10-02', max: '2026-11-12' });
  });

  it('chặn khi không chọn dòng nào, ngày ngoài khoảng, hoặc thiếu số ngày khi tắt Dài hạn', () => {
    const form = initialReuseForm(savedPrescription, '2026-10-13');
    const check = (changes: Partial<typeof form>) =>
      validateReuseForm({ ...form, ...changes }, '2026-10-01', '2026-10-13');
    expect(check({})).toBeNull();
    expect(check({ items: form.items.map((i) => ({ ...i, selected: false })) })).toBe(
      'Chọn ít nhất một dòng thuốc.',
    );
    expect(check({ startDate: '2026-10-01' })).toBe(
      'Ngày bắt đầu phải sau ngày kê đơn và không quá 30 ngày tới.',
    );
    expect(check({ startDate: '2026-11-13' })).toBe(
      'Ngày bắt đầu phải sau ngày kê đơn và không quá 30 ngày tới.',
    );
    expect(check({ startDate: '' })).toBe('Ngày bắt đầu phải sau ngày kê đơn và không quá 30 ngày tới.');
    const missing = form.items.map((i, index) =>
      index === 1 ? { ...i, longTerm: false, durationDays: '' } : i,
    );
    expect(check({ items: missing })).toBe('Dòng 2: nhập số ngày (1–3650) hoặc bật Dài hạn.');
    const fraction = form.items.map((i, index) => (index === 0 ? { ...i, durationDays: '2.5' } : i));
    expect(check({ items: fraction })).toBe('Dòng 1: nhập số ngày (1–3650) hoặc bật Dài hạn.');
    // Dòng bỏ chọn không bị kiểm.
    expect(
      check({ items: missing.map((i, index) => (index === 1 ? { ...i, selected: false } : i)) }),
    ).toBeNull();
  });

  it('payload chỉ gồm dòng được chọn; Dài hạn gửi durationDays null', () => {
    const form = initialReuseForm(savedPrescription, '2026-10-13');
    const items = form.items.map((i, index) => (index === 2 ? { ...i, selected: false } : i));
    expect(toReuseRequest({ ...form, items })).toEqual({
      startDate: '2026-10-13',
      items: [
        { prescriptionItemId: amlodipin!.id, durationDays: 30, longTerm: false },
        { prescriptionItemId: metformin!.id, durationDays: null, longTerm: true },
      ],
    });
  });
});
