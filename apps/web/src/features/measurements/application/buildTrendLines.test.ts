import { describe, expect, it } from 'vitest';
import { buildTrendLines } from './buildTrendLines';
import type { SeriesPoint } from './ports';

const point = (measuredOn: string, values: Partial<SeriesPoint> = {}): SeriesPoint => ({
  id: measuredOn,
  healthProfileId: 'p',
  sourceDocumentId: null,
  kind: 'blood_pressure',
  measuredOn,
  measuredTime: null,
  systolic: 130,
  diastolic: 85,
  pulse: 70,
  glucoseValue: null,
  glucoseUnit: null,
  manualWithoutSource: true,
  createdAt: `${measuredOn}T00:00:00Z`,
  displayGlucoseValue: null,
  displayGlucoseUnit: null,
  ...values,
});

describe('TC-254 dựng đường biểu đồ, ngắt nét tại tuần chưa đo', () => {
  it('huyết áp: tâm thu nét liền, tâm trương nét đứt, mỗi đường có nhãn trực tiếp', () => {
    const lines = buildTrendLines('blood_pressure', [
      point('2026-10-05', { measuredTime: '07:15', systolic: 152, diastolic: 94 }),
      point('2026-10-07', { systolic: 148, diastolic: 90 }),
    ]);
    expect(lines.map(({ key, label, dashed }) => ({ key, label, dashed }))).toEqual([
      { key: 'systolic', label: 'Tâm thu', dashed: false },
      { key: 'diastolic', label: 'Tâm trương', dashed: true },
    ]);
    expect(lines[0]!.data).toEqual([
      ['2026-10-05T07:15', 152],
      ['2026-10-07T00:00', 148],
    ]);
    expect(lines[1]!.bridges).toEqual([]);
  });

  it('hai số đo cách nhau ≥ 1 tuần trống: nét chính ngắt (null), cầu nối riêng qua tuần trống', () => {
    const [systolic] = buildTrendLines('blood_pressure', [
      point('2026-09-14', { systolic: 140 }),
      point('2026-09-20', { systolic: 142 }),
      point('2026-10-05', { systolic: 150 }),
    ]);
    expect(systolic!.data).toEqual([
      ['2026-09-14T00:00', 140],
      ['2026-09-20T00:00', 142],
      null,
      ['2026-10-05T00:00', 150],
    ]);
    expect(systolic!.bridges).toEqual([['2026-09-20T00:00', 142], ['2026-10-05T00:00', 150], null]);
  });

  it('tuần liền kề (Chủ Nhật → Thứ Hai kế) không bị coi là tuần trống', () => {
    const [systolic] = buildTrendLines('blood_pressure', [point('2026-10-04'), point('2026-10-05')]);
    expect(systolic!.data).not.toContain(null);
    expect(systolic!.bridges).toEqual([]);
  });

  it('đường huyết: một đường theo giá trị hiển thị mmol/L đã quy đổi (BR-020)', () => {
    const lines = buildTrendLines('glucose', [
      point('2026-10-05', {
        kind: 'glucose',
        glucoseValue: 126,
        glucoseUnit: 'mg/dL',
        displayGlucoseValue: 7,
        displayGlucoseUnit: 'mmol/L',
      }),
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ key: 'glucose', label: 'Đường huyết', dashed: false, unit: 'mmol/L' });
    expect(lines[0]!.data).toEqual([['2026-10-05T00:00', 7]]);
  });
});
