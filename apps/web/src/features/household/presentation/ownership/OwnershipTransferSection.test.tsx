import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { OwnershipTransferSection } from './OwnershipTransferSection';

const ownerMembers = [
  { accountId: 'owner-1', displayName: 'Ba Minh', role: 'main' as const, isOwner: true, isSelf: true },
  { accountId: 'main-tuan', displayName: 'Anh Tuấn', role: 'main' as const, isOwner: false, isSelf: false },
  { accountId: 'member-hoa', displayName: 'Mẹ Hoa', role: 'member' as const, isOwner: false, isSelf: false },
];

it('SPEC-068: Chủ hộ chỉ thấy Đồng quản lý để chọn, không có dòng Tham gia bịa và hiện băng đang chờ', () => {
  const html = renderToStaticMarkup(
    <OwnershipTransferSection
      familyName="Nhà Ngọc Lan"
      isOwner={true}
      selfAccountId="owner-1"
      coManagers={ownerMembers.filter((m) => !m.isSelf && m.role === 'main')}
      pendingOffer={{
        id: 'offer-1',
        status: 'pending',
        createdAt: '2026-11-19T08:00:00.000Z',
        offeredBy: { accountId: 'owner-1', displayName: 'Ba Minh' },
        target: { accountId: 'main-tuan', displayName: 'Anh Tuấn' },
      }}
      pending={false}
      error={null}
      onSend={vi.fn()}
      onRevoke={vi.fn()}
      onDecide={vi.fn()}
    />,
  );

  expect(html).toContain('Trao quyền Chủ hộ');
  expect(html).toContain('Anh Tuấn');
  expect(html).not.toContain('Mẹ Hoa');
  expect(html).not.toContain('Tham gia');
  expect(html).toContain('Đã gửi đề nghị cho');
  expect(html).toContain('Thu hồi đề nghị');
});

it('E28-S3-T2b: Chủ hộ khi chưa có Đồng quản lý thấy khối bị vô hiệu hoá và câu hướng dẫn đổi vai trò trước', () => {
  const html = renderToStaticMarkup(
    <OwnershipTransferSection
      familyName="Nhà Ngọc Lan"
      isOwner={true}
      selfAccountId="owner-1"
      coManagers={[]}
      pendingOffer={null}
      pending={false}
      error={null}
      onSend={vi.fn()}
      onRevoke={vi.fn()}
      onDecide={vi.fn()}
    />,
  );

  expect(html).toContain('Chưa có Đồng quản lý. Đổi vai trò một thành viên trước.');
  expect(html).toContain('household-ownership-disabled');
  expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Gửi đề nghị/);
});

it('SPEC-068: người nhận thấy băng đề nghị kèm nút Chấp nhận và Từ chối', () => {
  const html = renderToStaticMarkup(
    <OwnershipTransferSection
      familyName="Nhà Ngọc Lan"
      isOwner={false}
      selfAccountId="main-tuan"
      coManagers={[]}
      pendingOffer={{
        id: 'offer-1',
        status: 'pending',
        createdAt: '2026-11-19T08:00:00.000Z',
        offeredBy: { accountId: 'owner-1', displayName: 'Ba Minh' },
        target: { accountId: 'main-tuan', displayName: 'Anh Tuấn' },
      }}
      pending={false}
      error={null}
      onSend={vi.fn()}
      onRevoke={vi.fn()}
      onDecide={vi.fn()}
    />,
  );

  expect(html).toContain('Ba Minh đề nghị bạn làm Chủ hộ Nhà Ngọc Lan.');
  expect(html).toContain('Chấp nhận');
  expect(html).toContain('Từ chối');
  expect(html).not.toContain('Gửi đề nghị');
});
