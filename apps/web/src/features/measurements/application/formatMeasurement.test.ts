import { describe, expect, it } from 'vitest';
import { formatDay, readingText } from './formatMeasurement';
import type { Measurement } from './ports';

const base: Measurement = {
  id: 'm',
  healthProfileId: 'p',
  sourceDocumentId: 'd',
  kind: 'blood_pressure',
  measuredOn: '2026-10-04',
  measuredTime: '07:15',
  systolic: 152,
  diastolic: 94,
  pulse: 78,
  glucoseValue: null,
  glucoseUnit: null,
  manualWithoutSource: false,
  createdAt: '2026-10-04T00:15:00Z',
};

describe('Hiển thị số đo đã duyệt', () => {
  it('ngày đo theo dạng dd/MM/yyyy, không đổi múi giờ', () => {
    expect(formatDay('2026-10-04')).toBe('04/10/2026');
  });

  it('huyết áp "152/94 mmHg"; đường huyết giữ đơn vị gốc, dấu phẩy thập phân (BR-020)', () => {
    expect(readingText(base)).toBe('152/94 mmHg');
    expect(
      readingText({
        ...base,
        kind: 'glucose',
        systolic: null,
        diastolic: null,
        glucoseValue: 7.2,
        glucoseUnit: 'mmol/L',
      }),
    ).toBe('7,2 mmol/L');
    expect(
      readingText({
        ...base,
        kind: 'glucose',
        systolic: null,
        diastolic: null,
        glucoseValue: 126,
        glucoseUnit: 'mg/dL',
      }),
    ).toBe('126 mg/dL');
  });
});
