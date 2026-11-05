import { describe, expect, it } from 'vitest';
import { checkTemperature } from './checkTemperature.js';

describe('Kiểm nhiệt độ cơ thể (SPEC-048, BR-055)', () => {
  it('TC-500: làm tròn tới 0,1 theo số thập phân', () => {
    expect(checkTemperature(38.46, false)).toEqual({ ok: true, celsius: 38.5 });
    expect(checkTemperature(38.45, false)).toEqual({ ok: true, celsius: 38.5 });
    expect(checkTemperature(38.44, false)).toEqual({ ok: true, celsius: 38.4 });
  });

  it('TC-501: ngoài 34,0–43,0 chưa xác nhận bị chặn; biên và có xác nhận thì qua', () => {
    const blocked = { ok: false, code: 'ERR_OUT_OF_RANGE_UNCONFIRMED', fields: ['celsius'] };
    expect(checkTemperature(48, false)).toEqual(blocked);
    expect(checkTemperature(33.9, false)).toEqual(blocked);
    expect(checkTemperature(48, true)).toEqual({ ok: true, celsius: 48 });
    expect(checkTemperature(34, false)).toEqual({ ok: true, celsius: 34 });
    expect(checkTemperature(43, false)).toEqual({ ok: true, celsius: 43 });
    // Kiểm sau khi làm tròn: 33,95 lưu thành 34,0 nên nằm trong khoảng.
    expect(checkTemperature(33.95, false)).toEqual({ ok: true, celsius: 34 });
    expect(checkTemperature(43.05, false)).toEqual(blocked);
  });
});
