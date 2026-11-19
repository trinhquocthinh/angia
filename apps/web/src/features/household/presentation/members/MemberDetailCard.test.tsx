import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { MemberDetailCard } from './MemberDetailCard';

const errors = vi.hoisted(() => ({ role: null as string | null, removal: null as string | null }));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: ReactNode }) => <a href="/family/members">{children}</a>,
}));
vi.mock('../../application/useMemberRoleChange', () => ({
  useMemberRoleChange: () => ({ pending: false, error: errors.role, clearError: vi.fn() }),
}));
vi.mock('../../application/useMemberRemoval', () => ({
  useMemberRemoval: () => ({ pending: false, error: errors.removal, clearError: vi.fn() }),
}));
beforeEach(() => {
  errors.role = null;
  errors.removal = null;
});

function renderCard() {
  return renderToStaticMarkup(
    <MemberDetailCard
      member={{ accountId: 'hoa', displayName: 'Mẹ Hoa', role: 'member', isOwner: false, isSelf: false }}
      csrfToken="csrf"
      onReload={async () => undefined}
    />,
  );
}

it.each(['role', 'removal'] as const)(
  'SPEC-066: lỗi bảo vệ Chủ hộ khi %s hiện thông báo và ẩn thao tác',
  (action) => {
    errors[action] = 'Không thể thao tác với Chủ hộ.';
    const html = renderCard();
    expect(html).toContain('Không thể thao tác với Chủ hộ.');
    expect(html).toContain('Quay lại danh sách thành viên');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('<input');
  },
);

it('SPEC-066: lỗi có thể thử lại vẫn giữ thao tác thành viên', () => {
  errors.role = 'Mất kết nối. Kiểm tra mạng rồi thử lại.';
  const html = renderCard();
  expect(html).toContain('Lưu thay đổi');
  expect(html).toContain('Gỡ khỏi nhà');
});
