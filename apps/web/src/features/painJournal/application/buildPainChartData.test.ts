import { expect, it } from 'vitest';
import { buildPainChartData } from './buildPainChartData';
import { issue } from '../test/painIssues.test-helper';
const entry = (day: string, level = 6) => ({
  id: day,
  level,
  recordedAt: `${day}T03:00:00Z`,
  note: null,
  createdBy: null,
  updatedBy: null,
  updatedAt: issue.updatedAt,
});
const range = { from: '2026-11-01', to: '2026-11-30' };
it('TC-724 — giữ mọi điểm, chỉ ngắt nét qua hơn 7 ngày lịch Việt Nam', () => {
  const entries = ['01', '03', '04', '14', '15'].map((day) => entry(`2026-11-${day}`));
  const result = buildPainChartData(entries.toReversed(), range);
  expect(result.entries).toEqual(entries);
  expect(result.points.map((point) => point.value[1])).toEqual([6, 6, 6, null, 6, 6]);
  expect(result.points.filter((point) => point.value[1] !== null)).toHaveLength(5);
});
it('TC-724 — đúng 7 ngày lịch vẫn nối, hơn 7 ngày lịch ngắt tại biên nửa đêm', () => {
  const entries = [
    { ...entry('2026-11-01'), recordedAt: '2026-11-01T16:59:00Z' },
    { ...entry('2026-11-08'), recordedAt: '2026-11-08T16:59:00Z' },
    { ...entry('2026-11-16'), recordedAt: '2026-11-16T17:00:00Z' },
  ];
  expect(buildPainChartData(entries, range).points.map((p) => p.value[1])).toEqual([6, 6, null, 6]);
  entries[1] = { ...entry('2026-11-08'), recordedAt: '2026-11-08T16:58:00Z' };
  expect(buildPainChartData(entries.slice(0, 2), range).points).toHaveLength(2);
  // 01/11 23:59 → 09/11 00:00: hơn 7 ngày lịch nhưng chỉ 168 giờ 1 phút.
  entries[1] = { ...entry('2026-11-09'), recordedAt: '2026-11-08T17:00:00Z' };
  expect(buildPainChartData(entries.slice(0, 2), range).points).toHaveLength(3);
  const sameCalendarWeek = [
    { ...entry('2026-11-02'), recordedAt: '2026-11-01T17:00:00Z' },
    { ...entry('2026-11-09'), recordedAt: '2026-11-09T16:59:00Z' },
  ];
  expect(buildPainChartData(sameCalendarWeek, range).points).toHaveLength(2);
});
it('lọc hai biên theo ngày Việt Nam, không sửa mảng đầu vào', () => {
  const entries = [
    { ...entry('2026-10-31'), recordedAt: '2026-10-31T16:59:59Z' },
    { ...entry('2026-11-01'), recordedAt: '2026-10-31T17:00:00Z' },
    { ...entry('2026-11-30'), recordedAt: '2026-11-30T16:59:59Z' },
    { ...entry('2026-12-01'), recordedAt: '2026-11-30T17:00:00Z' },
  ];
  expect(buildPainChartData(entries, range).entries).toEqual(entries.slice(1, 3));
  expect(entries).toHaveLength(4);
  expect(buildPainChartData([], range)).toEqual({ entries: [], points: [] });
});
