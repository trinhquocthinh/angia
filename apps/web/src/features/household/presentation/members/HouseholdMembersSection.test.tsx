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

it('E28-S3-T2b: trên desktop Chủ hộ thấy bố cục 2 cột và panel trống hướng dẫn chọn thành viên', () => {
  const html = renderToStaticMarkup(
    <HouseholdMembersSection
      members={members}
      viewerRole="main"
      csrfToken="csrf"
      isDesktop={true}
      onReload={async () => undefined}
    />,
  );

  expect(html).toContain('household-members-directory-split');
  expect(html).toContain('Chạm để xem &amp; sửa quyền');
  expect(html).toContain('Chọn một người trong danh sách để đổi vai trò hoặc gỡ khỏi nhà.');
});

it('E28-S3-T2b: dưới 1024px không render panel cột phải khi chưa chọn thành viên', () => {
  const html = renderToStaticMarkup(
    <HouseholdMembersSection
      members={members}
      viewerRole="main"
      csrfToken="csrf"
      isDesktop={false}
      onReload={async () => undefined}
    />,
  );

  expect(html).not.toContain('Chọn một người trong danh sách để đổi vai trò hoặc gỡ khỏi nhà.');
});

it('SPEC-066: thành viên thường không thấy panel chỉnh sửa, không thấy gợi ý sửa quyền hay nút chọn hàng', () => {
  const html = renderToStaticMarkup(
    <HouseholdMembersSection
      members={members}
      viewerRole="member"
      csrfToken="csrf"
      isDesktop={true}
      onReload={async () => undefined}
    />,
  );

  expect(html).not.toContain('household-members-directory-split');
  expect(html).not.toContain('Chạm để xem &amp; sửa quyền');
  expect(html).not.toContain('Chọn một người trong danh sách để đổi vai trò hoặc gỡ khỏi nhà.');
  expect(html).not.toContain('<button');
});
