import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { MobileBottomNav } from './MobileBottomNav';

const location = vi.hoisted(() => ({ pathname: '/', search: {} as { view?: string } }));
vi.mock('@tanstack/react-router', () => ({
  useLocation: () => location,
  Link: ({
    to,
    search,
    activeOptions: _options,
    ...props
  }: ComponentProps<'a'> & {
    to: string;
    search?: { view?: string };
    activeOptions?: unknown;
  }) => <a {...props} href={to + (search?.view ? '?view=' + search.view : '')} />,
}));

it('E30-S1-T1: main có đúng bốn mục và giấy tờ mở hàng chờ', () => {
  const html = renderToStaticMarkup(<MobileBottomNav pendingCount={7} />);
  expect(html.match(/<a /g)).toHaveLength(4);
  for (const label of ['Hôm nay', 'Hồ sơ', 'Giấy tờ', 'Nhà']) expect(html).toContain(label);
  expect(html).toContain('href="/?view=profiles"');
  expect(html).toContain('href="/review"');
  expect(html).toContain('href="/family/home"');
  expect(html).toContain('7 giấy tờ chờ duyệt');
  expect(renderToStaticMarkup(<MobileBottomNav pendingCount={0} />)).not.toContain('giấy tờ chờ duyệt');
});

it('E30-S1-T1: thành viên có đúng ba mục và không lộ hàng chờ', () => {
  const html = renderToStaticMarkup(<MobileBottomNav personal pendingCount={7} />);
  expect(html.match(/<a /g)).toHaveLength(3);
  expect(html).toContain('href="/my-profile"');
  expect(html).toContain('href="/family/home"');
  expect(html).not.toContain('href="/review"');
  expect(html).not.toContain('giấy tờ chờ duyệt');
});

it.each([
  ['/', undefined, 'Hôm nay'],
  ['/', 'profiles', 'Hồ sơ'],
  ['/profiles/person/medications', undefined, 'Hồ sơ'],
  ['/upload', undefined, 'Giấy tờ'],
  ['/review/document', undefined, 'Giấy tờ'],
  ['/family/home', undefined, 'Nhà'],
  ['/account/change-password', undefined, 'Nhà'],
])('E30-S1-T1: %s chọn duy nhất mục %s %s', (pathname, view, label) => {
  location.pathname = pathname;
  location.search = view ? { view } : {};
  const html = renderToStaticMarkup(<MobileBottomNav />);
  expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  expect(html.match(/<a[^>]*aria-current="page"[^>]*>[\s\S]*?<\/a>/)?.[0]).toContain(label);
});
