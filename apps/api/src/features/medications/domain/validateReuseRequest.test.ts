import { describe, expect, it } from 'vitest';
import { reusablePrescription } from '@src/shared/test/reusablePrescription.js';
import { validateReuseRequest } from './validateReuseRequest.js';

const today = '2026-10-13';
const prescription = reusablePrescription('2026-10-01');
const amlodipin = { prescriptionItemId: 'item-1', durationDays: 30, longTerm: false };

describe('validateReuseRequest — kiểm lệnh Dùng lại đơn (SPEC-029)', () => {
  it('TC-277: ngày bắt đầu phải sau ngày kê và không quá hôm nay + 30 ngày', () => {
    const check = (startDate: string) => validateReuseRequest(prescription, startDate, [amlodipin], today);
    expect(check('2026-10-01')).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(check('2026-09-30')).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(check('2026-11-13')).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(check('2026-10-02')).toEqual({ ok: true });
    expect(check('2026-11-12')).toEqual({ ok: true });
  });

  it('TC-277: dòng rỗng, trùng hoặc không thuộc đơn → ERR_VALIDATION', () => {
    for (const items of [[], [amlodipin, amlodipin], [{ ...amlodipin, prescriptionItemId: 'item-x' }]])
      expect(validateReuseRequest(prescription, today, items, today)).toEqual({
        ok: false,
        code: 'ERR_VALIDATION',
      });
  });

  it('TC-277: dòng tắt Dài hạn không có số ngày → ERR_DOSE_INFO_MISSING chỉ rõ dòng (BR-025)', () => {
    expect(
      validateReuseRequest(
        prescription,
        today,
        [amlodipin, { prescriptionItemId: 'item-2', durationDays: null, longTerm: false }],
        today,
      ),
    ).toEqual({ ok: false, code: 'ERR_DOSE_INFO_MISSING', invalidItemIndexes: [1] });
    expect(
      validateReuseRequest(
        prescription,
        today,
        [{ prescriptionItemId: 'item-2', durationDays: null, longTerm: true }],
        today,
      ),
    ).toEqual({ ok: true });
  });
});
