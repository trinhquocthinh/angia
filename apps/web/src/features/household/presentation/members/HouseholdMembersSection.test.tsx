import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { HouseholdMembersSection } from './HouseholdMembersSection';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const members = [
  { accountId: 'owner-1', displayName: 'Ba Minh', role: 'main' as const, isOwner: true, isSelf: true },
  { accountId: 'main-tuan', displayName: 'Anh Tuấn', role: 'main' as const, isOwner: false, isSelf: false },
  { accountId: 'member-hoa', displayName: 'Mẹ Hoa', role: 'member' as const, isOwner: false, isSelf: false },
];

it('E28-S3-T3: danh sách thành viên chiếm toàn chiều rộng, không có rail phải hay dialog khi chưa chọn ai', () => {
  const html = renderToStaticMarkup(
    <HouseholdMembersSection
      members={members}
      viewerRole="main"
      csrfToken="csrf"
      onReload={async () => undefined}
    />,
  );

  expect(html).toContain('household-members-directory');
  expect(html).not.toContain('household-members-directory-split');
  expect(html).not.toContain('household-members-detail-rail');
  expect(html).not.toContain('<dialog');
  expect(html).toContain('Chạm để xem &amp; sửa quyền');
});

it('SPEC-066: thành viên thường không thấy gợi ý sửa quyền, không có nút chọn hàng hay dialog chỉnh sửa', () => {
  const html = renderToStaticMarkup(
    <HouseholdMembersSection
      members={members}
      viewerRole="member"
      csrfToken="csrf"
      onReload={async () => undefined}
    />,
  );

  expect(html).not.toContain('household-members-directory-split');
  expect(html).not.toContain('Chạm để xem &amp; sửa quyền');
  expect(html).not.toContain('<dialog');
  expect(html).not.toContain('<button');
});
