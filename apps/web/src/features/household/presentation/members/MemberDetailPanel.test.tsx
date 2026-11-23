import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { MemberDetailPanel } from './MemberDetailPanel';

const errors = vi.hoisted(() => ({
  role: null as string | null,
  removal: null as string | null,
  passwordReset: null as string | null,
}));

vi.mock('../../application/useMemberRoleChange', () => ({
  useMemberRoleChange: () => ({
    pending: false,
    error: errors.role,
    changeRole: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('../../application/useMemberRemoval', () => ({
  useMemberRemoval: () => ({
    pending: false,
    error: errors.removal,
    remove: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('../../application/useMemberPasswordReset', () => ({
  useMemberPasswordReset: () => ({
    pending: false,
    error: errors.passwordReset,
    result: null,
    resetPassword: vi.fn(),
    clearError: vi.fn(),
    clearResult: vi.fn(),
  }),
}));

beforeEach(() => {
  errors.role = null;
  errors.removal = null;
  errors.passwordReset = null;
});

const memberHoa = {
  accountId: 'hoa',
  displayName: 'Mẹ Hoa',
  role: 'member' as const,
  isOwner: false,
  isSelf: false,
};

function renderPanel(
  member: typeof memberHoa | null = memberHoa,
  notice: string | null = null,
  viewerRole: 'main' | 'member' = 'main',
) {
  return renderToStaticMarkup(
    <MemberDetailPanel
      member={member}
      notice={notice}
      viewerRole={viewerRole}
      csrfToken="csrf"
      onReload={async () => undefined}
      onClose={vi.fn()}
    />,
  );
}

it('E28-S3-T3: chưa chọn thành viên và không có notice thì không render popup hay rail trống', () => {
  expect(renderPanel(null)).toBe('');
});

it('E28-S3-T3: chọn thành viên mở popup modal chứa đổi vai trò, đặt lại mật khẩu và gỡ thành viên, không có dữ liệu bịa', () => {
  const html = renderPanel();
  expect(html).toContain('<dialog');
  expect(html).toContain('aria-label="Chi tiết thành viên"');
  expect(html).toContain('Mẹ Hoa');
  expect(html).toContain('Lưu thay đổi');
  expect(html).toContain('Đặt lại mật khẩu');
  expect(html).toContain('member-reset-key.svg');
  expect(html).toContain('Gỡ khỏi nhà');
  expect(html.indexOf('Lưu thay đổi')).toBeLessThan(html.indexOf('Đặt lại mật khẩu'));
  expect(html.indexOf('Đặt lại mật khẩu')).toBeLessThan(html.indexOf('Gỡ khỏi nhà'));
  expect(html).not.toContain('household-members-detail-rail');
  expect(html).not.toContain('Toàn quyền');
  expect(html).not.toContain('Giới hạn');
  expect(html).not.toContain('Tham gia');
  expect(html).not.toContain('Khuyên dùng');
  expect(html).not.toContain('Đổi vai trò');
  expect(html).not.toContain('Dành cho Chủ hộ hoặc Đồng quản lý');
});

it.each([
  ['Chủ hộ', { ...memberHoa, isOwner: true }, 'main' as const],
  ['chính mình', { ...memberHoa, isSelf: true }, 'main' as const],
  ['người xem là thành viên thường', memberHoa, 'member' as const],
])('TC-757: nút Đặt lại mật khẩu ẩn với %s và không báo lỗi', (_label, target, role) => {
  const html = renderPanel(target, null, role);
  expect(html).not.toContain('Đặt lại mật khẩu');
  expect(html).not.toContain('member-reset-key.svg');
  expect(html).not.toContain('role="alert"');
});

it.each(['role', 'removal', 'passwordReset'] as const)(
  'SPEC-066: lỗi bảo vệ Chủ hộ khi %s hiện thông báo trong popup và ẩn thao tác',
  (action) => {
    errors[action] = 'Không thể thao tác với Chủ hộ.';
    const html = renderPanel();
    expect(html).toContain('<dialog');
    expect(html).toContain('Không thể thao tác với Chủ hộ.');
    expect(html).toContain('Đóng');
    expect(html).not.toContain('Lưu thay đổi');
    expect(html).not.toContain('Đặt lại mật khẩu');
    expect(html).not.toContain('Gỡ khỏi nhà');
    expect(html).not.toContain('<input');
  },
);

it('SPEC-066: lỗi có thể thử lại vẫn giữ thao tác thành viên', () => {
  errors.role = 'Mất kết nối. Kiểm tra mạng rồi thử lại.';
  const html = renderPanel();
  expect(html).toContain('Lưu thay đổi');
  expect(html).toContain('Gỡ khỏi nhà');
});

it('SPEC-066: notice không tìm thấy thành viên hiển thị trong popup kèm nút Đóng', () => {
  const html = renderPanel(null, 'Người này không còn trong nhà.');
  expect(html).toContain('<dialog');
  expect(html).toContain('Người này không còn trong nhà.');
  expect(html).toContain('Đóng');
  expect(html).not.toContain('Lưu thay đổi');
});
