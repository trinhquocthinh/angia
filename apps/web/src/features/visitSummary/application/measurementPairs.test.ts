import { describe, expect, it } from 'vitest';
import type { SummaryMeasurementRow } from './measurementRows';
import { measurementPairs } from './measurementPairs';

const row = (key: string): SummaryMeasurementRow => ({
  key,
  date: '01/09/2026',
  time: null,
  bloodPressure: '120/80',
  pulse: null,
  glucose: null,
});

describe('measurementPairs — chế độ nén: mỗi dòng in 2 thời điểm liên tiếp (owner chốt E6-S1-T2)', () => {
  it('ghép theo thứ tự trái → phải, giữ thứ tự thời gian; số lẻ thì ô phải trống', () => {
    const pairs = measurementPairs(['a', 'b', 'c'].map(row));
    expect(pairs.map(([left, right]) => [left.key, right?.key ?? null])).toEqual([
      ['a', 'b'],
      ['c', null],
    ]);
  });
});
