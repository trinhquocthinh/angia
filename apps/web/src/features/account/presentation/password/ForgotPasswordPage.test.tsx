import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { PasswordResetSent } from './PasswordResetSent';
it('form chỉ nhận email, tái dùng khung đăng nhập và icon Stitch', () => {
  const html = renderToStaticMarkup(<ForgotPasswordPage />);
  expect(html).toContain('login-brand-panel');
  expect(html).toContain('login-form-panel');
  expect(html).toContain('Quên mật khẩu');
  expect(html.match(/<input /g)).toHaveLength(1);
  expect(html).toContain('type="email"');
  expect(html).toContain('autoComplete="email"');
  expect(html).toContain('Gửi liên kết đặt lại mật khẩu');
  expect(html).toContain('href="/login"');
  expect(html).toContain('Chưa xác minh email? Hãy nhờ Chủ hộ hoặc Đồng quản lý đặt lại mật khẩu cho bạn.');
  for (const name of ['mail', 'arrow_back', 'arrow_forward']) expect(html).toContain(`forgot-${name}.svg`);
});
it('TC-762: trạng thái đã gửi có lời nhắn đồng nhất, gửi lại và aria-live', () => {
  const html = renderToStaticMarkup(
    <PasswordResetSent busy={false} error={null} resent={false} onResend={vi.fn()} />,
  );
  expect(html).toContain('Kiểm tra hộp thư của bạn');
  expect(html).toContain(
    'Nếu email này thuộc một tài khoản đã xác minh, liên kết đặt lại sẽ được gửi trong ít phút. Liên kết có hiệu lực 30 phút.',
  );
  expect(html).toContain('Gửi lại');
  expect(html).not.toContain('@');
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain('forgot-mark_email_read.svg');
});
it('gửi lại thành công thông báo trong vùng live và lỗi giới hạn ở dưới nút', () => {
  const message = 'Bạn thao tác quá nhanh, vui lòng thử lại sau.';
  const html = renderToStaticMarkup(
    <PasswordResetSent busy={false} error={message} resent onResend={vi.fn()} />,
  );
  expect(html).toContain('Đã gửi lại.');
  expect(html).toContain(message);
  expect(html.indexOf('role="alert"')).toBeGreaterThan(html.indexOf('Gửi lại</'));
});
