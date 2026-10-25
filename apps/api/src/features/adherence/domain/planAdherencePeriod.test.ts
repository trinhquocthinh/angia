import { describe, expect, it } from 'vitest';
import type { AdherencePeriod } from './AdherencePeriod.js';
import { planAdherencePeriod } from './planAdherencePeriod.js';

const today = '2026-10-13';
const open: AdherencePeriod = {
  id: 'p1',
  healthProfileId: 'me',
  medicationName: 'Amlodipin',
  medicationNameNormalized: 'amlodipin',
  status: 'taking',
  fromDate: '2026-09-01',
  toDate: null,
};

describe('Lập kế hoạch ghi nhận giai đoạn dùng thực tế (SPEC-022, BR-032)', () => {
  it('TC-062: giai đoạn mở được đóng vào ngày liền trước mốc mới', () => {
    expect(planAdherencePeriod(open, 'stopped', '2026-10-10', today)).toEqual({
      ok: true,
      closeToDate: '2026-10-09',
    });
  });
  it('TC-062: đóng đúng qua ranh giới tháng/năm nhuận', () => {
    expect(planAdherencePeriod(open, 'stopped', '2026-10-01', today)).toMatchObject({
      closeToDate: '2026-09-30',
    });
    const leap = { ...open, fromDate: '2024-01-01' };
    expect(planAdherencePeriod(leap, 'stopped', '2024-03-01', today)).toMatchObject({
      closeToDate: '2024-02-29',
    });
  });
  it('TC-062: thuốc chưa có giai đoạn thì mở mới với trạng thái bất kỳ, không đóng gì', () => {
    for (const status of ['taking', 'stopped'] as const)
      expect(planAdherencePeriod(null, status, '2020-01-01', today)).toEqual({ ok: true, closeToDate: null });
  });
  it('TC-063: mốc mới trước hoặc trùng mốc giai đoạn đang mở bị từ chối', () => {
    const current = { ...open, fromDate: '2026-10-10' };
    for (const fromDate of ['2026-10-05', '2026-10-10'])
      expect(planAdherencePeriod(current, 'stopped', fromDate, today)).toEqual({
        ok: false,
        code: 'ERR_VALIDATION',
      });
  });
  it('TC-260: ghi trùng trạng thái của giai đoạn đang mở bị từ chối', () => {
    expect(planAdherencePeriod(open, 'taking', '2026-10-10', today)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });
  it('TC-261: mốc ở tương lai theo ngày Việt Nam hoặc ngày lịch sai bị từ chối; hôm nay hợp lệ', () => {
    for (const fromDate of ['2026-10-14', '2026-02-30', '2026-1-01'])
      expect(planAdherencePeriod(null, 'taking', fromDate, today)).toEqual({
        ok: false,
        code: 'ERR_VALIDATION',
      });
    expect(planAdherencePeriod(open, 'stopped', today, today)).toEqual({
      ok: true,
      closeToDate: '2026-10-12',
    });
  });
  it('TC-063: giai đoạn mới nhất đã đóng thì mốc mới phải sau ngày kết thúc', () => {
    const closed = { ...open, toDate: '2026-10-09' };
    expect(planAdherencePeriod(closed, 'stopped', '2026-10-09', today)).toMatchObject({
      code: 'ERR_VALIDATION',
    });
    expect(planAdherencePeriod(closed, 'stopped', '2026-10-10', today)).toEqual({
      ok: true,
      closeToDate: null,
    });
  });
});
