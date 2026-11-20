import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { MobileBottomNav } from './MobileBottomNav';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    activeOptions: _options,
    activeProps: _active,
    ...props
  }: ComponentProps<'a'> & {
    to: string;
    activeOptions?: unknown;
    activeProps?: unknown;
  }) => <a {...props} href={to} />,
}));

it('Stitch: chỉ giữ icon 3D, bỏ bộ chuyển kiểu và Thêm mới vẫn mở tải giấy tờ', () => {
  const html = renderToStaticMarkup(<MobileBottomNav />);
  expect(html).toContain('/icons/mobile-nav-home-3d.svg');
  expect(html).toContain('/icons/mobile-nav-pending-3d.svg');
  expect(html).not.toContain('mobile-nav-icon-2d');
  expect(html).not.toContain('Kiểu icon điều hướng');
  expect(html).not.toContain('<button');
  expect(html).toContain('href="/upload"');
  expect(html).not.toContain('Tạo mới mục chăm sóc');
});

it('Stitch: badge hiển thị số giấy tờ thật, không có badge khi hàng chờ trống', () => {
  const html = renderToStaticMarkup(<MobileBottomNav pendingCount={7} />);
  expect(html).toContain('7 giấy tờ chờ duyệt');
  expect(html).toMatch(/aria-hidden="true">7<\/span>/);
  expect(renderToStaticMarkup(<MobileBottomNav pendingCount={0} />)).not.toContain('giấy tờ chờ duyệt');
});

it('Stitch: thành viên giữ Hồ sơ của tôi và không có mục quản lý', () => {
  const html = renderToStaticMarkup(<MobileBottomNav personal pendingCount={7} />);
  expect(html).toContain('href="/my-profile"');
  expect(html).not.toContain('href="/upload"');
  expect(html).not.toContain('href="/review"');
  expect(html).not.toContain('giấy tờ chờ duyệt');
});
