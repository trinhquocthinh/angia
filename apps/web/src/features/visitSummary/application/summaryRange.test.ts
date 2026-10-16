import { describe, expect, it } from 'vitest';
import { summaryRange } from './summaryRange';
import { vietnamDate } from './vietnamDate';

describe('summaryRange — khoảng 1/3/6 tháng (SPEC-024, Design Web §6)', () => {
  it('lùi đúng số tháng lịch, đầu cuối là hôm nay', () => {
    expect(summaryRange(3, '2026-10-05')).toEqual({ from: '2026-07-05', to: '2026-10-05' });
    expect(summaryRange(1, '2026-10-05')).toEqual({ from: '2026-09-05', to: '2026-10-05' });
    expect(summaryRange(6, '2026-03-15')).toEqual({ from: '2025-09-15', to: '2026-03-15' });
  });

  it('ngày không tồn tại ở tháng đích → ngày cuối tháng (như API)', () => {
    expect(summaryRange(3, '2026-05-31')).toEqual({ from: '2026-02-28', to: '2026-05-31' });
    expect(summaryRange(1, '2028-03-30')).toEqual({ from: '2028-02-29', to: '2028-03-30' });
  });
});

describe('vietnamDate — ngày lịch Việt Nam của một thời điểm', () => {
  it('quy về múi giờ Asia/Ho_Chi_Minh', () => {
    expect(vietnamDate(new Date('2026-10-15T17:30:00Z'))).toBe('2026-10-16');
    expect(vietnamDate(new Date('2026-10-15T16:59:00Z'))).toBe('2026-10-15');
  });
});
