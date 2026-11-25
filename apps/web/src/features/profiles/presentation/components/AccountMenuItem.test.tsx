import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { AccountMenuItem } from './AccountMenuItem';
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, ...props }: ComponentProps<'a'> & { to: string }) => <a {...props} href={to} />,
}));
it('Menu: tên mục và mô tả phụ tách thành hai dòng, có nhãn liên kết rõ ràng', () => {
  const html = renderToStaticMarkup(
    <AccountMenuItem
      to="/my-profile"
      icon="profile"
      label="Hồ sơ của tôi"
      description="Thông tin & thẻ y tế"
    />,
  );
  expect(html).toContain('href="/my-profile"');
  expect(html).toContain('aria-label="Hồ sơ của tôi"');
  expect(html).toContain('<strong>Hồ sơ của tôi</strong>');
  expect(html).toContain('Thông tin &amp; thẻ y tế');
  expect(html).toContain('/profile-card-3d.png');
});
