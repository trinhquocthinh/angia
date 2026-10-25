import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SessionBoundary } from './SessionBoundary';
const mocked = vi.hoisted(() => ({ path: '/consent-invite', auth: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({ useLocation: () => ({ pathname: mocked.path }) }));
vi.mock('./AuthBoundary', () => ({
  AuthBoundary: ({ children }: { children: ReactNode }) => {
    mocked.auth();
    return <div>AUTH{children}</div>;
  },
}));
describe('TC-106 — Ngoại lệ xác thực chỉ dành cho tuyến lời mời chính xác', () => {
  it('không mount AuthBoundary hoặc gọi phiên trên /consent-invite', () => {
    mocked.auth.mockClear();
    mocked.path = '/consent-invite';
    expect(renderToStaticMarkup(<SessionBoundary>Lời mời</SessionBoundary>)).toBe('Lời mời');
    expect(mocked.auth).not.toHaveBeenCalled();
  });
  it.each(['/', '/login', '/consent-invite/', '/consent-invite/other'])('%s giữ AuthBoundary', (path) => {
    mocked.path = path;
    expect(renderToStaticMarkup(<SessionBoundary>Nội dung</SessionBoundary>)).toContain('AUTH');
  });
});
