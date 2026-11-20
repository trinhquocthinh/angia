import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { HouseholdHomeCard } from './HouseholdHomeCard';

const nonOwnerMembers = [
  { accountId: 'owner-1', displayName: 'Ba Minh', role: 'main' as const, isOwner: true, isSelf: false },
  { accountId: 'member-1', displayName: 'Mẹ Hoa', role: 'member' as const, isOwner: false, isSelf: true },
];

it('SPEC-069: thành viên không phải Chủ hộ không thấy khối Xoá nhà và không thấy Trao quyền khi không có đề nghị', () => {
  const html = renderToStaticMarkup(
    <HouseholdHomeCard
      familyName="Nhà Ngọc Lan"
      members={nonOwnerMembers}
      pendingOffer={null}
      pendingDeletion={null}
      isPending={false}
      errorMessage={null}
      ownershipPending={false}
      ownershipError={null}
      leavePending={false}
      leaveError={null}
      leaveErrorCode={null}
      deletionPending={false}
      deletionError={null}
      onRetry={vi.fn()}
      onSendOffer={vi.fn()}
      onRevokeOffer={vi.fn()}
      onDecideOffer={vi.fn()}
      onLeave={vi.fn()}
      onClearLeaveError={vi.fn()}
      onRequestDeletion={vi.fn()}
      onRevokeDeletion={vi.fn()}
      onClearDeletionError={vi.fn()}
    />,
  );

  expect(html).toContain('Nhà của tôi');
  expect(html).toContain('Nhà Ngọc Lan · 2 thành viên');
  expect(html).toContain('Rời nhà');
  expect(html).not.toContain('Trao quyền Chủ hộ');
  expect(html).not.toContain('Xoá nhà');
});
