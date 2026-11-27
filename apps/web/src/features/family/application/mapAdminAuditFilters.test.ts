import { expect, it } from 'vitest';
import { mapAdminAuditFilters } from './mapAdminAuditFilters';
const empty = { from: '', to: '', familyId: '', accountId: '', action: '' as const };
it('TC-841: bỏ lọc trống và giữ giới hạn 50', () =>
  expect(mapAdminAuditFilters(empty)).toEqual({ query: { limit: 50 }, errors: {} }));
it('TC-841: ngày kết thúc bao gồm cả ngày theo UTC+7, qua tháng và năm', () => {
  expect(
    mapAdminAuditFilters({
      ...empty,
      from: '2026-12-31',
      to: '2026-12-31',
      action: 'account_locked',
      familyId: ' 12345678-1234-4234-8234-123456789abc ',
    }).query,
  ).toEqual({
    limit: 50,
    from: '2026-12-30T17:00:00.000Z',
    to: '2026-12-31T17:00:00.000Z',
    action: 'account_locked',
    familyId: '12345678-1234-4234-8234-123456789abc',
  });
  expect(mapAdminAuditFilters({ ...empty, to: '2028-02-29' }).query?.to).toBe('2028-02-29T17:00:00.000Z');
});
it('TC-841: mã sai chặn truy vấn, lỗi gắn đúng trường', () => {
  expect(mapAdminAuditFilters({ ...empty, familyId: 'abc', accountId: 'xyz' })).toEqual({
    query: null,
    errors: { familyId: 'Mã không hợp lệ.', accountId: 'Mã không hợp lệ.' },
  });
});
it('TC-841: khoảng ngược hoặc ngày không có thật chặn truy vấn', () => {
  for (const dates of [
    { from: '2026-11-28', to: '2026-11-27' },
    { from: '2026-02-30', to: '' },
    { from: 'invalid', to: '' },
  ]) {
    expect(mapAdminAuditFilters({ ...empty, ...dates })).toEqual({
      query: null,
      errors: { dates: 'Khoảng ngày không hợp lệ.' },
    });
  }
});
