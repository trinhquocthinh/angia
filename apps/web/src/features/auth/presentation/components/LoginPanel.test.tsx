import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LoginPanel } from './LoginPanel';

describe('Các trạng thái màn đăng nhập Authentik', () => {
  it('mặc định: một hành động đăng nhập Authentik, không thu mật khẩu tại web', () => {
    const html = renderToStaticMarkup(
      <LoginPanel hasAuthError={false} isSubmitting={false} onLogin={() => undefined} />,
    );
    expect(html).toContain('Đăng nhập Authentik');
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).not.toContain('<input');
  });
  it('callback lỗi: thông báo xác thực và hành động thử lại', () => {
    const html = renderToStaticMarkup(
      <LoginPanel hasAuthError isSubmitting={false} onLogin={() => undefined} />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('Không thể xác thực tài khoản. Vui lòng thử lại.');
    expect(html).toContain('Thử lại');
  });
  it('đang chuyển hướng: spinner, trạng thái bận và nút vô hiệu hóa', () => {
    const html = renderToStaticMarkup(
      <LoginPanel hasAuthError={false} isSubmitting onLogin={() => undefined} />,
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('Đang chuyển hướng');
  });
});
