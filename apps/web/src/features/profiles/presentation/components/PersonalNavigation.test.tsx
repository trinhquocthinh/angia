import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MobileBottomNav } from './MobileBottomNav';
import { TopbarNav } from './TopbarNav';

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: '/', search: {} }),
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe('Design §11.5 — điều hướng theo quyền', () => {
  it.each([
    ['desktop', TopbarNav],
    ['di động', MobileBottomNav],
  ])('%s: khung cá nhân có Hôm nay, Hồ sơ của tôi và Nhà', (_, Nav) => {
    const html = renderToStaticMarkup(<Nav personal />);
    expect(html).toContain('/my-profile');
    expect(html).toContain('/family/home');
    expect(html.match(/<a /g)).toHaveLength(3);
    expect(html).not.toContain('/upload');
    expect(html).not.toContain('/review');
  });
  it.each([
    ['desktop', TopbarNav],
    ['di động', MobileBottomNav],
  ])('%s: khung gia đình có bốn mục theo vai trò', (_, Nav) => {
    const html = renderToStaticMarkup(<Nav />);
    expect(html).toContain('/family/home');
    expect(html).toContain('Hồ sơ');
    expect(html).toContain('/review');
    expect(html).not.toContain('/my-profile');
    expect(html.match(/<a /g)).toHaveLength(4);
  });
});
