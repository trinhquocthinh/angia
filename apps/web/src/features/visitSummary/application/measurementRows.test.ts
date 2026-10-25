import { describe, expect, it } from 'vitest';
import type { Measurement } from '@angia/contracts';
import { measurementRows } from './measurementRows';

const bp: Measurement = {
  id: 'bp1',
  healthProfileId: 'p',
  sourceDocumentId: 'doc',
  kind: 'blood_pressure',
  measuredOn: '2026-09-01',
  measuredTime: '07:30',
  systolic: 128,
  diastolic: 82,
  pulse: 76,
  glucoseValue: null,
  glucoseUnit: null,
  manualWithoutSource: false,
  createdAt: '2026-09-01T01:00:00.000Z',
};
const glucose: Measurement = {
  ...bp,
  id: 'g1',
  kind: 'glucose',
  systolic: null,
  diastolic: null,
  pulse: null,
  glucoseValue: 7.4,
  glucoseUnit: 'mmol/L',
};

describe('measurementRows — gộp số đo cùng ngày + giờ thành một dòng (owner chốt E6-S1-T2)', () => {
  it('TC-093 — HA, mạch, đường huyết cùng lúc nằm một dòng; giữ đơn vị gốc đường huyết (BR-020)', () => {
    expect(measurementRows([bp, glucose])).toEqual([
      {
        key: 'bp1',
        date: '01/09/2026',
        time: '07:30',
        bloodPressure: '128/82',
        pulse: '76',
        glucose: '7,4 mmol/L',
      },
    ]);
  });

  it('khác giờ hoặc khác ngày tách dòng; giữ thứ tự cũ nhất trước như API', () => {
    const rows = measurementRows([
      bp,
      { ...glucose, measuredTime: '20:00' },
      { ...bp, id: 'bp2', measuredOn: '2026-09-02', measuredTime: null, pulse: null },
    ]);
    expect(rows.map((row) => [row.key, row.time, row.pulse])).toEqual([
      ['bp1', '07:30', '76'],
      ['g1', '20:00', null],
      ['bp2', null, null],
    ]);
  });

  it('hai số đo cùng loại cùng ngày giờ không ghi đè nhau', () => {
    const rows = measurementRows([bp, { ...bp, id: 'bp2', systolic: 131 }, glucose]);
    expect(rows.map((row) => row.bloodPressure)).toEqual(['128/82', '131/82']);
    expect(rows[0]!.glucose).toBe('7,4 mmol/L');
    expect(rows[1]!.glucose).toBeNull();
  });
});
