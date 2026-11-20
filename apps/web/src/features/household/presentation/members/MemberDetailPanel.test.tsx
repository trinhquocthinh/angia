import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { MemberDetailPanel } from './MemberDetailPanel';

const errors = vi.hoisted(() => ({ role: null as string | null, removal: null as string | null }));

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

beforeEach(() => {
  errors.role = null;
  errors.removal = null;
});

const memberHoa = {
  accountId: 'hoa',
  displayName: 'Mẹ Hoa',
  role: 'member' as const,
  isOwner: false,
  isSelf: false,
};

function renderPanel(member: typeof memberHoa | null = memberHoa, notice: string | null = null) {
  return renderToStaticMarkup(
    <MemberDetailPanel
      member={member}
      notice={notice}
      csrfToken="csrf"
      onReload={async () => undefined}
      onClose={vi.fn()}
    />,
  );
}

it('E28-S3-T2b: chưa chọn thành viên hiển thị trạng thái trống hướng dẫn chọn người trong danh sách', () => {
  const html = renderPanel(null);
  expect(html).toContain('Chọn một người trong danh sách để đổi vai trò hoặc gỡ khỏi nhà.');
});

it('E28-S3-T2b: hiển thị đổi vai trò và gỡ thành viên không có nhãn Toàn quyền/Giới hạn hay dữ liệu bịa', () => {
  const html = renderPanel();
  expect(html).toContain('Mẹ Hoa');
  expect(html).toContain('Lưu thay đổi');
  expect(html).toContain('Gỡ khỏi nhà');
  expect(html).not.toContain('Toàn quyền');
  expect(html).not.toContain('Giới hạn');
  expect(html).not.toContain('Tham gia');
  expect(html).not.toContain('Khuyên dùng');
});

it.each(['role', 'removal'] as const)(
  'SPEC-066: lỗi bảo vệ Chủ hộ khi %s hiện thông báo và ẩn thao tác',
  (action) => {
    errors[action] = 'Không thể thao tác với Chủ hộ.';
    const html = renderPanel();
    expect(html).toContain('Không thể thao tác với Chủ hộ.');
    expect(html).toContain('Đóng');
    expect(html).not.toContain('Lưu thay đổi');
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

it('SPEC-066: notice không tìm thấy thành viên hiển thị thông báo và nút Đóng', () => {
  const html = renderPanel(null, 'Người này không còn trong nhà.');
  expect(html).toContain('Người này không còn trong nhà.');
  expect(html).toContain('Đóng');
  expect(html).not.toContain('Lưu thay đổi');
});
