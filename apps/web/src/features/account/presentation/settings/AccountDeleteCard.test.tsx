import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { accountDeletionErrorMessage } from '@src/features/account/application/accountDeletionErrorMessage';
import { AccountDeleteCard } from '@src/features/account/presentation/settings/AccountDeleteCard';

const baseProps = {
  hasLinkedProfile: false,
  open: false,
  password: '',
  disposition: null as 'keep' | 'delete' | null,
  pending: false,
  canSubmit: false,
  error: null as string | null,
  errorCode: null as string | null,
  onOpen: vi.fn(),
  onClose: vi.fn(),
  onPasswordChange: vi.fn(),
  onDispositionChange: vi.fn(),
  onSubmit: vi.fn(),
};

it('hiển thị thẻ Xoá tài khoản đúng mô tả, nút viền đỏ và không có badge tự thêm', () => {
  const html = renderToStaticMarkup(<AccountDeleteCard {...baseProps} />);
  expect(html).toContain('Xoá tài khoản');
  expect(html).toContain(
    'Xoá tài khoản của bạn khỏi AN GIA. Bản ghi đồng ý pháp lý và nhật ký quản lý còn lại không chứa dữ liệu sức khoẻ.',
  );
  expect(html).toContain('Xoá tài khoản…');
  expect(html).toContain('account-shield-danger-3d.svg');
  for (const forbidden of ['Vùng nhạy cảm', 'Khu vực bảo mật', '30 ngày', 'Đã hiểu']) {
    expect(html).not.toContain(forbidden);
  }
});

it('TC-827/TC-828: hộp xác nhận có hồ sơ liên kết hiển thị 2 phương án chưa chọn sẵn và khoá nút khi thiếu điều kiện', () => {
  const html = renderToStaticMarkup(
    <AccountDeleteCard {...baseProps} hasLinkedProfile open password="secret" canSubmit={false} />,
  );
  expect(html).toContain('Xoá tài khoản?');
  expect(html).toContain('Chọn phương án xử lý hồ sơ cá nhân:');
  expect(html).toContain('Để lại hồ sơ cho nhà');
  expect(html).toContain('Hồ sơ của bạn ở lại nhà, gỡ liên kết với tài khoản.');
  expect(html).toContain('Xoá hồ sơ của tôi');
  expect(html).toContain('Hồ sơ và ảnh bị xoá hẳn, không khôi phục được.');
  expect(html).toContain('Nhập mật khẩu để xác nhận');
  expect(html).not.toContain('Mật khẩu xác nhận');
  expect(html).not.toContain('checked=""');
  expect(html).toContain('account-delete-shield.svg');
  expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
});

it('TC-829/TC-830: lỗi hiển thị ngay trong hộp, giữ ô mật khẩu và cặp nút Huỷ / Xoá tài khoản', () => {
  const errHtml = renderToStaticMarkup(
    <AccountDeleteCard
      {...baseProps}
      open
      password="sai"
      canSubmit
      error="Hãy trao quyền Chủ hộ cho người khác trước."
      errorCode="ERR_OWNER_MUST_TRANSFER"
    />,
  );
  expect(errHtml).toContain('Hãy trao quyền Chủ hộ cho người khác trước.');
  expect(errHtml).toContain('account-error.svg');
  expect(errHtml).toContain('Nhập mật khẩu để xác nhận');
  expect(errHtml).toContain('Huỷ');
  expect(errHtml).toContain('Xoá tài khoản');
  expect(errHtml).not.toContain('Đã hiểu');

  const rateHtml = renderToStaticMarkup(
    <AccountDeleteCard
      {...baseProps}
      open
      password="abc"
      canSubmit
      error="Bạn thao tác quá nhanh, vui lòng thử lại sau."
      errorCode="ERR_RATE_LIMITED"
    />,
  );
  expect(rateHtml).toContain('account-warning.svg');

  const pendingHtml = renderToStaticMarkup(
    <AccountDeleteCard {...baseProps} open password="abc" pending canSubmit={false} />,
  );
  expect(pendingHtml).toContain('account-spinner.svg');
  expect(pendingHtml).toContain('aria-busy="true"');
});

it('TC-827: đánh dấu ô mật khẩu để focus sau showModal thay vì radio đầu tiên', () => {
  const html = renderToStaticMarkup(<AccountDeleteCard {...baseProps} open hasLinkedProfile />);
  expect(html).toMatch(/<input[^>]*data-autofocus="true"[^>]*type="password"/);
});

it.each([
  ['ERR_INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu chưa đúng.'],
  ['ERR_OWNER_MUST_TRANSFER', 'Hãy trao quyền Chủ hộ cho người khác trước.'],
  ['ERR_OWNER_MUST_DELETE_FAMILY', 'Bạn là người duy nhất trong nhà. Hãy xoá nhà nếu không dùng nữa.'],
  [
    'ERR_LAST_GUARDIAN',
    'Bạn là người giám hộ duy nhất của một hồ sơ trẻ. Hãy thêm người giám hộ khác trước.',
  ],
  ['ERR_RATE_LIMITED', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
  ['ERR_VALIDATION', 'Dữ liệu gửi lên không đúng định dạng quy định.'],
  ['ERR_AUTH_UNAVAILABLE', 'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.'],
  ['NETWORK', 'Mất kết nối. Kiểm tra mạng rồi thử lại.'],
  ['UNKNOWN', 'Không thể kết nối. Vui lòng thử lại.'],
])('TC-829/TC-830: %s hiện trong hộp và giữ giá trị mật khẩu', (code, message) => {
  const html = renderToStaticMarkup(
    <AccountDeleteCard
      {...baseProps}
      open
      password="matkhau-sai"
      errorCode={code}
      error={accountDeletionErrorMessage(code)}
    />,
  );
  const dialogHtml = html.slice(html.indexOf('<dialog'));
  expect(dialogHtml).toContain('role="alert"');
  expect(dialogHtml).toContain(message);
  expect(dialogHtml).toContain('value="matkhau-sai"');
});
