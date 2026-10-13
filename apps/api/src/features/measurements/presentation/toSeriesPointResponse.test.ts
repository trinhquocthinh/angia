import { describe, expect, it } from 'vitest';
import type { Measurement } from '../domain/Measurement.js';
import { toSeriesPointResponse } from './toSeriesPointResponse.js';

const base: Measurement = {
  id: '0199d0a0-0000-7000-8000-000000000001',
  healthProfileId: '0199d0a0-0000-7000-8000-000000000002',
  sourceDocumentId: null,
  kind: 'glucose',
  measuredOn: '2026-10-05',
  measuredTime: '07:00',
  systolic: null,
  diastolic: null,
  pulse: null,
  glucoseValue: 126,
  glucoseUnit: 'mg/dL',
  manualWithoutSource: true,
  createdAt: new Date('2026-10-05T00:10:00.000Z'),
};

describe('toSeriesPointResponse — SPEC-020 presenter', () => {
  it('TC-059 — 126 mg/dL hiển thị 7.0 mmol/L, giá trị gốc giữ nguyên trong điểm', () => {
    const point = toSeriesPointResponse(base, 'mmol/L');
    expect(point).toMatchObject({
      glucoseValue: 126,
      glucoseUnit: 'mg/dL',
      displayGlucoseValue: 7,
      displayGlucoseUnit: 'mmol/L',
      createdAt: '2026-10-05T00:10:00.000Z',
    });
    expect(base.glucoseValue).toBe(126);
  });

  it('TC-251 — số đo huyết áp không có giá trị hiển thị đường huyết', () => {
    const bloodPressure = { ...base, kind: 'blood_pressure', systolic: 130, diastolic: 85 } as const;
    expect(
      toSeriesPointResponse({ ...bloodPressure, glucoseValue: null, glucoseUnit: null }, 'mg/dL'),
    ).toMatchObject({ systolic: 130, displayGlucoseValue: null, displayGlucoseUnit: null });
  });
});
