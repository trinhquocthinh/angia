import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AccountsTable } from './AccountsTable';
const accounts = [
  { id: 'a', displayName: 'An', isSystemAdmin: false, familyId: null, role: null },
  { id: 'b', displayName: 'Bình', isSystemAdmin: true, familyId: 'f', role: 'main' as const },
];
describe('Thao tác tài khoản theo trạng thái nhóm', () => {
  it('chờ nhóm được gán; đã có nhóm được đổi vai trò và gỡ', () => {
    const html = renderToStaticMarkup(
      <AccountsTable
        accounts={accounts}
        families={[{ id: 'f', name: 'Nhà An', createdAt: '2026-10-05T00:00:00Z' }]}
        pending={false}
        onTask={() => undefined}
      />,
    );
    expect(html.match(/Gán nhóm/g)).toHaveLength(1);
    expect(html.match(/Đổi vai trò/g)).toHaveLength(1);
    expect(html.match(/Gỡ khỏi nhóm/g)).toHaveLength(1);
    expect(html).toContain('Quản trị hệ thống');
  });
  it('khóa toàn bộ thao tác khi đang gửi yêu cầu', () => {
    const html = renderToStaticMarkup(
      <AccountsTable
        accounts={accounts}
        families={[{ id: 'f', name: 'Nhà An', createdAt: '2026-10-05T00:00:00Z' }]}
        pending
        onTask={() => undefined}
      />,
    );
    expect(html.match(/disabled=""/g)).toHaveLength(3);
  });
});
