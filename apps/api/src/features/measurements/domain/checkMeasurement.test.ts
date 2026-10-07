import { describe, expect, it } from 'vitest';
import { checkMeasurement } from './checkMeasurement.js';
import type { MeasurementValues } from './Measurement.js';

const bp = (
  systolic: number | null,
  diastolic: number | null,
  pulse: number | null = null,
): MeasurementValues => ({
  kind: 'blood_pressure',
  systolic,
  diastolic,
  pulse,
  glucoseValue: null,
  glucoseUnit: null,
});
const glucose = (glucoseValue: number | null, glucoseUnit: 'mmol/L' | 'mg/dL' | null): MeasurementValues => ({
  kind: 'glucose',
  systolic: null,
  diastolic: null,
  pulse: null,
  glucoseValue,
  glucoseUnit,
});

describe('Thẩm tra số đo sinh tồn (SPEC-019)', () => {
  it('TC-055: huyết áp 85/130 bị từ chối vì tâm thu không lớn hơn tâm trương', () => {
    expect(checkMeasurement(bp(85, 130), false)).toEqual({ ok: false, code: 'ERR_BP_INVALID' });
  });

  it.each([
    [null, 80],
    [120, null],
    [120, 120],
  ])('BR-019: huyết áp %s/%s thiếu số hoặc tâm thu ≤ tâm trương → ERR_BP_INVALID', (systolic, diastolic) => {
    expect(checkMeasurement(bp(systolic, diastolic), false)).toEqual({ ok: false, code: 'ERR_BP_INVALID' });
  });

  it('BR-019: mạch là trường tùy chọn', () => {
    expect(checkMeasurement(bp(130, 85), false)).toEqual({ ok: true });
  });

  it('TC-056: đường huyết 7.2 không kèm đơn vị → ERR_GLUCOSE_UNIT_REQUIRED', () => {
    expect(checkMeasurement(glucose(7.2, null), false)).toEqual({
      ok: false,
      code: 'ERR_GLUCOSE_UNIT_REQUIRED',
    });
  });

  it('BR-020: đường huyết thiếu giá trị → ERR_VALIDATION', () => {
    expect(checkMeasurement(glucose(null, 'mmol/L'), false)).toEqual({ ok: false, code: 'ERR_VALIDATION' });
  });

  it('TC-057: đường huyết 40 mmol/L ngoài khoảng nhưng đã xác nhận → hợp lệ', () => {
    expect(checkMeasurement(glucose(40, 'mmol/L'), true)).toEqual({ ok: true });
  });

  it('BR-021: đường huyết 40 mmol/L chưa xác nhận → ERR_OUT_OF_RANGE_UNCONFIRMED kèm trường', () => {
    expect(checkMeasurement(glucose(40, 'mmol/L'), false)).toEqual({
      ok: false,
      code: 'ERR_OUT_OF_RANGE_UNCONFIRMED',
      fields: ['glucoseValue'],
    });
  });

  it('TC-082: tâm thu 260 hợp lệ, 261 bị chặn khi chưa xác nhận', () => {
    expect(checkMeasurement(bp(260, 90), false)).toEqual({ ok: true });
    expect(checkMeasurement(bp(261, 90), false)).toEqual({
      ok: false,
      code: 'ERR_OUT_OF_RANGE_UNCONFIRMED',
      fields: ['systolic'],
    });
  });

  it('SDD §2.2: báo đủ các trường ngoài khoảng (tâm trương 29, mạch 221)', () => {
    expect(checkMeasurement(bp(120, 29, 221), false)).toEqual({
      ok: false,
      code: 'ERR_OUT_OF_RANGE_UNCONFIRMED',
      fields: ['diastolic', 'pulse'],
    });
  });

  it.each([
    [18, 'mg/dL', true],
    [630, 'mg/dL', true],
    [17, 'mg/dL', false],
    [1, 'mmol/L', true],
    [35, 'mmol/L', true],
    [0.9, 'mmol/L', false],
  ] as const)('SDD §2.2: đường huyết %s %s nằm trong khoảng = %s theo đơn vị gốc', (value, unit, within) => {
    expect(checkMeasurement(glucose(value, unit), false).ok).toBe(within);
  });
});
