import { describe, expect, it } from 'vitest';
import { resolveSummaryRange } from './resolveSummaryRange.js';

const today = '2026-10-16';

describe('Khoảng thời gian bản tóm tắt tái khám (SPEC-024)', () => {
  it('TC-065: mặc định to = hôm nay, from = to lùi 3 tháng lịch', () => {
    expect(resolveSummaryRange(today, {})).toEqual({ ok: true, value: { from: '2026-07-16', to: today } });
  });

  it('thiếu một đầu thì suy từ đầu kia; ngày cuối tháng lùi về ngày cuối của tháng đích', () => {
    expect(resolveSummaryRange(today, { to: '2026-05-31' })).toEqual({
      ok: true,
      value: { from: '2026-02-28', to: '2026-05-31' },
    });
    expect(resolveSummaryRange(today, { from: '2026-01-10' })).toEqual({
      ok: true,
      value: { from: '2026-01-10', to: today },
    });
    expect(resolveSummaryRange(today, { to: '2026-02-15' })).toEqual({
      ok: true,
      value: { from: '2025-11-15', to: '2026-02-15' },
    });
  });

  it('nhận khoảng một ngày và khoảng đúng 366 ngày', () => {
    expect(resolveSummaryRange(today, { from: today, to: today }).ok).toBe(true);
    expect(resolveSummaryRange(today, { from: '2025-10-16', to: '2026-10-16' }).ok).toBe(true);
  });

  it('từ chối from > to, khoảng quá 366 ngày và to sau hôm nay', () => {
    for (const range of [
      { from: '2026-10-10', to: '2026-10-09' },
      { from: '2025-10-15', to: '2026-10-16' },
      { to: '2026-10-17' },
      { from: '2026-10-17' },
    ])
      expect(resolveSummaryRange(today, range)).toEqual({ ok: false, code: 'ERR_VALIDATION' });
  });
});
