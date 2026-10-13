import { describe, expect, it } from 'vitest';
import { mondayOf } from './mondayOf';
import { seriesRange } from './seriesRange';

describe('TC-253 khoảng N tuần gần nhất cho biểu đồ (giờ Việt Nam)', () => {
  it('23:59 Chủ Nhật giờ Việt Nam vẫn thuộc tuần bắt đầu Thứ Hai trước đó', () => {
    expect(seriesRange(4, new Date('2026-10-11T16:59:00Z'))).toEqual({
      from: '2026-09-14',
      to: '2026-10-11',
    });
  });

  it('00:00 Thứ Hai giờ Việt Nam mở tuần mới; 12 tuần lùi đủ 11 tuần trước', () => {
    expect(seriesRange(12, new Date('2026-10-11T17:00:00Z'))).toEqual({
      from: '2026-07-27',
      to: '2026-10-12',
    });
  });

  it('26 tuần qua biên năm, không vượt giới hạn 366 ngày của API', () => {
    expect(seriesRange(26, new Date('2027-01-06T03:00:00Z'))).toEqual({
      from: '2026-07-13',
      to: '2027-01-06',
    });
  });
});

describe('Thứ Hai của tuần chứa ngày', () => {
  it.each([
    ['2026-10-05', '2026-10-05'],
    ['2026-10-11', '2026-10-05'],
    ['2026-03-01', '2026-02-23'],
    ['2027-01-01', '2026-12-28'],
  ])('%s → %s', (day, monday) => {
    expect(mondayOf(day)).toBe(monday);
  });
});
