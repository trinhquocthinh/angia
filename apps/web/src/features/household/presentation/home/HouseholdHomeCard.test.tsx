import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { HouseholdHomeCard } from './HouseholdHomeCard';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: { children: ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

const ownerMembers = [
  { accountId: 'owner-1', displayName: 'Ba Minh', role: 'main' as const, isOwner: true, isSelf: true },
  { accountId: 'main-tuan', displayName: 'Anh Tuấn', role: 'main' as const, isOwner: false, isSelf: false },
  { accountId: 'member-hoa', displayName: 'Mẹ Hoa', role: 'member' as const, isOwner: false, isSelf: false },
];

const nonOwnerMembers = [
  { accountId: 'owner-1', displayName: 'Ba Minh', role: 'main' as const, isOwner: true, isSelf: false },
  { accountId: 'member-1', displayName: 'Mẹ Hoa', role: 'member' as const, isOwner: false, isSelf: true },
];

function baseProps() {
  return {
    familyName: 'Nhà Ngọc Lan',
    csrfToken: 'csrf',
    pendingOffer: null,
    pendingDeletion: null,
    isPending: false,
    errorMessage: null,
    ownershipPending: false,
    ownershipError: null,
    leavePending: false,
    leaveError: null,
    leaveErrorCode: null,
    deletionPending: false,
    deletionError: null,
    onRetry: vi.fn(),
    onReloadMembers: vi.fn().mockResolvedValue(undefined),
    onSendOffer: vi.fn(),
    onRevokeOffer: vi.fn(),
    onDecideOffer: vi.fn(),
    onLeave: vi.fn(),
    onClearLeaveError: vi.fn(),
    onRequestDeletion: vi.fn(),
    onRevokeDeletion: vi.fn(),
    onClearDeletionError: vi.fn(),
  };
}

it('E28-S3-T2b: Chủ hộ thấy tên nhà, dòng đếm vai trò thật, nút mời, danh sách thành viên và nhóm Quản trị 3 khối', () => {
  const html = renderToStaticMarkup(
    <HouseholdHomeCard {...baseProps()} viewerRole="main" members={ownerMembers} />,
  );

  expect(html).toContain('Nhà Ngọc Lan');
  expect(html).toContain('Đang hoạt động');
  expect(html).toContain('3 thành viên · 1 Chủ hộ / 1 Đồng quản lý / 1 Thành viên');
  expect(html).toContain('+ Mời người thân');
  expect(html).toContain('Thành viên &amp; Phân quyền');
  expect(html).toContain('Quản trị Quyền Chủ hộ &amp; Pháp lý nhà');
  expect(html).toContain('Trao quyền Chủ hộ');
  expect(html).toContain('Rời nhà');
  expect(html).toContain('Xoá nhà');
  expect(html).not.toContain('#AG-8492');
});

it('SPEC-069: thành viên không phải Chủ hộ không thấy nút mời, không thấy nhóm quản trị Chủ hộ, chỉ thấy danh sách và Rời nhà', () => {
  const html = renderToStaticMarkup(
    <HouseholdHomeCard {...baseProps()} viewerRole="member" members={nonOwnerMembers} />,
  );

  expect(html).toContain('Nhà Ngọc Lan');
  expect(html).toContain('2 thành viên · 1 Chủ hộ / 0 Đồng quản lý / 1 Thành viên');
  expect(html).toContain('Rời nhà');
  expect(html).not.toContain('+ Mời người thân');
  expect(html).not.toContain('Quản trị Quyền Chủ hộ &amp; Pháp lý nhà');
  expect(html).not.toContain('Trao quyền Chủ hộ');
  expect(html).not.toContain('Xoá nhà');
});
