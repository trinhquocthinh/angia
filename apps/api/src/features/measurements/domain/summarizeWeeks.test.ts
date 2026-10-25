import { describe, expect, it } from 'vitest';
import { summarizeWeeks } from './summarizeWeeks.js';

describe('summarizeWeeks — SPEC-020, BR-023', () => {
  it('TC-058 — chuỗi 8 tuần có số đo tại 6 tuần → đúng 2 tuần không có số đo', () => {
    const measuredOn = ['2026-08-17', '2026-08-31', '2026-09-08', '2026-09-21', '2026-09-28', '2026-10-11'];
    const weeks = summarizeWeeks('2026-08-17', '2026-10-11', measuredOn);
    expect(weeks).toHaveLength(8);
    expect(weeks.filter((week) => !week.hasMeasurement).map((week) => week.weekStart)).toEqual([
      '2026-08-24',
      '2026-09-14',
    ]);
  });

  it('TC-250 — khoảng bắt đầu/kết thúc giữa tuần vẫn liệt kê trọn tuần chứa from và to, tăng dần', () => {
    expect(summarizeWeeks('2026-10-07', '2026-10-13', ['2026-10-13', '2026-10-13'])).toEqual([
      { weekStart: '2026-10-05', hasMeasurement: false },
      { weekStart: '2026-10-12', hasMeasurement: true },
    ]);
  });

  it('TC-250 — from = to cho đúng một tuần', () => {
    expect(summarizeWeeks('2026-10-11', '2026-10-11', [])).toEqual([
      { weekStart: '2026-10-05', hasMeasurement: false },
    ]);
  });
});
