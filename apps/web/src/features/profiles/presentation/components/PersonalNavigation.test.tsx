import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MobileBottomNav } from './MobileBottomNav';
import { TopbarNav } from './TopbarNav';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe('Design §9.1 — điều hướng theo quyền', () => {
  it.each([
    ['desktop', TopbarNav],
    ['di động', MobileBottomNav],
  ])('%s: khung cá nhân chỉ có Trang chủ và Hồ sơ của tôi', (_, Nav) => {
    const html = renderToStaticMarkup(<Nav personal />);
    expect(html).toContain('/my-profile');
    expect(html).not.toContain('/upload');
    expect(html).not.toContain('/review');
  });
  it.each([
    ['desktop', TopbarNav],
    ['di động', MobileBottomNav],
  ])('%s: khung gia đình giữ nguyên các mục', (_, Nav) => {
    const html = renderToStaticMarkup(<Nav />);
    expect(html).toContain('/upload');
    expect(html).toContain('/review');
    expect(html).not.toContain('/my-profile');
  });
});
