import { expect, it } from 'vitest';
import { summarizeMemberCounts } from './summarizeMemberCounts';

it('E28-S3-T2b: tính đúng tổng số thành viên và phân bổ vai trò từ danh sách thật', () => {
  const summary = summarizeMemberCounts([
    { isOwner: true, role: 'main' },
    { isOwner: false, role: 'main' },
    { isOwner: false, role: 'main' },
    { isOwner: false, role: 'member' },
  ]);

  expect(summary).toEqual({
    total: 4,
    owners: 1,
    coManagers: 2,
    regularMembers: 1,
    summaryText: '4 thành viên · 1 Chủ hộ / 2 Đồng quản lý / 1 Thành viên',
  });
});

it('E28-S3-T2b: danh sách trống không bịa số người hay Chủ hộ', () => {
  expect(summarizeMemberCounts([]).summaryText).toBe(
    '0 thành viên · 0 Chủ hộ / 0 Đồng quản lý / 0 Thành viên',
  );
});
