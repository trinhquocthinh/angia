import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { components } from '@src/shared/api/schema.gen';
import { ThemeProvider } from '@src/shared/theme/ThemeProvider';
import { AccountSettingsView } from './AccountSettingsView';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, ...props }: ComponentProps<'a'> & { to: string }) => <a {...props} href={to} />,
}));

type Session = components['schemas']['MeContextResponse'];
const baseSession: Session = {
  account: { id: 'acc-1', displayName: 'Lan', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'fam-1', name: 'Nhà Ngọc Lan', isOwner: false },
  role: 'main',
  csrfToken: 'csrf-1',
  authMethod: 'local',
  hasLocalCredential: true,
  emailStatus: { email: 'lan@example.com', emailVerified: false, pendingEmail: null },
  features: { redactionSuggestions: false, localEnrollmentEnabled: false },
};

function renderView(
  session: Session,
  initialEditing = false,
  profiles: { id: string; displayName: string; hasLinkedAccount: boolean }[] = [],
) {
  return renderToStaticMarkup(
    <ThemeProvider>
      <AccountSettingsView
        session={session}
        profiles={profiles}
        onRefreshSession={vi.fn(async () => {})}
        initialEditing={initialEditing}
      />
    </ThemeProvider>,
  );
}

it('hiển thị thẻ hồ sơ, email chưa xác minh (Đồng quản lý), mật khẩu, nền giao diện, dữ liệu của tôi và xoá tài khoản', () => {
  const html = renderView(baseSession, false, [
    { id: 'prof-child', displayName: 'Bé An', hasLinkedAccount: false },
  ]);
  expect(html).toContain('Tên hiển thị');
  expect(html).toContain('Lan');
  expect(html).toContain('Nhà Ngọc Lan');
  expect(html).toContain('Đồng quản lý');
  expect(html).toContain('lan@example.com');
  expect(html).toContain('Chưa xác minh');
  expect(html).toContain('Xác minh email');
  expect(html).toContain('Đổi email');
  expect(html).toContain(
    'Bạn chưa xác minh email nên chưa dùng được Quên mật khẩu. Nếu quên mật khẩu, hãy nhờ Chủ hộ hoặc Đồng quản lý đặt lại.',
  );
  expect(html).toContain('Đổi mật khẩu');
  expect(html).toContain('href="/account/change-password"');
  expect(html).toContain('Nền giao diện');
  expect(html).toContain('Sáng');
  expect(html).toContain('Tối');
  expect(html).toContain('Theo máy');
  expect(html).toContain('Dữ liệu của tôi');
  expect(html).toContain('Tải dữ liệu của tôi');
  expect(html).not.toContain('Hồ sơ cần tải');
  expect(html).toContain('Xoá tài khoản');
  expect(html).toContain('Xoá tài khoản…');
  expect(html).not.toContain('Sẽ có ở bản sau');
  for (const icon of [
    'account-mail-3d.svg',
    'account-lock-3d.svg',
    'account-palette-3d.svg',
    'account-download-3d.svg',
    'account-shield-danger-3d.svg',
    'account-warning.svg',
    'account-send.svg',
    'account-edit.svg',
    'account-info.svg',
    'account-light_mode.svg',
    'account-dark_mode.svg',
    'account-settings_brightness.svg',
  ]) {
    expect(html).toContain(icon);
  }
});

it('không có chuỗi hoặc tính năng ngoài brief trong trang tài khoản', () => {
  const html = renderView(baseSession);
  for (const forbidden of [
    'Mã thành viên',
    'Đã đổi 45 ngày',
    'An toàn',
    'GDPR',
    '42 đơn thuốc',
    '30 ngày',
    'Rủi ro cao',
    'Bảo vệ 2 lớp',
    'BR-033',
    'Giả lập kích hoạt',
    'Hủy yêu cầu đổi',
    'Thử email khác',
    'Hỗ trợ kỹ thuật',
    'Trạng thái',
    'Biến thể',
    '→',
  ]) {
    expect(html).not.toContain(forbidden);
  }
});

it('chủ hộ thấy ô chọn hồ sơ cần tải và tài khoản chỉ OIDC ẩn thẻ đổi mật khẩu và xoá tài khoản', () => {
  const ownerHtml = renderView(
    {
      ...baseSession,
      family: { id: 'fam-1', name: 'Nhà An', isOwner: true },
      emailStatus: { email: null, emailVerified: false, pendingEmail: null },
    },
    false,
    [
      { id: 'prof-me', displayName: 'An', hasLinkedAccount: true },
      { id: 'prof-child', displayName: 'Bé An', hasLinkedAccount: false },
    ],
  );
  expect(ownerHtml).toContain('Chủ hộ');
  expect(ownerHtml).toContain('Chưa có email');
  expect(ownerHtml).toContain('Thêm email');
  expect(ownerHtml).not.toContain('Xác minh email');
  expect(ownerHtml).toContain(
    'Bạn chưa xác minh email. Nếu quên mật khẩu, bạn sẽ không lấy lại được tài khoản.',
  );
  expect(ownerHtml).toContain('Hồ sơ cần tải');
  expect(ownerHtml).toContain('Bé An');

  const waitingHtml = renderView({
    ...baseSession,
    family: null,
    role: null,
    hasLocalCredential: false,
    emailStatus: { email: null, emailVerified: false, pendingEmail: null },
  });
  expect(waitingHtml).toContain('Chưa có nhà');
  expect(waitingHtml).not.toContain('Đổi mật khẩu');
  expect(waitingHtml).not.toContain('account-lock-3d.svg');
  expect(waitingHtml).not.toContain('Xoá tài khoản');
  expect(waitingHtml).not.toContain('account-shield-danger-3d.svg');
  expect(waitingHtml).toContain(
    'Bạn chưa xác minh email. Nếu quên mật khẩu, bạn sẽ không lấy lại được tài khoản.',
  );
});

it('TC-928: email đã xác minh và pendingEmail hiển thị đúng chip, câu thông báo và nút hành động', () => {
  const verifiedHtml = renderView({
    ...baseSession,
    emailStatus: { email: 'lan@example.com', emailVerified: true, pendingEmail: null },
  });
  expect(verifiedHtml).toContain('Đã xác minh');
  expect(verifiedHtml).toContain('account-check_circle.svg');
  expect(verifiedHtml).toContain('Đổi email');
  expect(verifiedHtml).not.toContain('Xác minh email');
  expect(verifiedHtml).not.toContain('Bạn chưa xác minh email');

  const pendingHtml = renderView({
    ...baseSession,
    emailStatus: {
      email: 'old@example.com',
      emailVerified: true,
      pendingEmail: 'new@example.com',
    },
  });
  expect(pendingHtml).toContain(
    'Email mới đang chờ xác minh: new@example.com. Cho tới khi đó, email cũ vẫn dùng để đặt lại mật khẩu.',
  );
  expect(pendingHtml).toContain('Xác minh email');
  expect(pendingHtml).not.toContain('Bạn chưa xác minh email');
});

it('form thêm/đổi email có đủ hai ô Email mới, Mật khẩu hiện tại và nút Lưu email, Huỷ', () => {
  const html = renderView(baseSession, true);
  expect(html).toContain('Email mới');
  expect(html).toContain('Mật khẩu hiện tại');
  expect(html).toContain('Lưu email');
  expect(html).toContain('Huỷ');
  expect(html).not.toContain('Lưu &amp; Xác minh');
});
