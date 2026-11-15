import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { PasswordField } from './PasswordField';
it('ẩn mặc định, liên kết nhãn, hướng dẫn và lỗi từ Field', () => {
  const html = renderToStaticMarkup(
    <PasswordField
      id="password"
      label="Mật khẩu"
      hint="Ít nhất 8 ký tự"
      error="Mật khẩu chưa đúng"
      aria-describedby="extra"
      autoComplete="current-password"
    />,
  );
  expect(html).toContain('type="password"');
  expect(html).toContain('aria-label="Hiện mật khẩu"');
  expect(html).toContain('aria-pressed="false"');
  expect(html).toContain('aria-describedby="extra password-hint password-error"');
  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('autoComplete="current-password"');
});
