import { useEffect } from 'react';
import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InvitationRepository } from './invitationPorts';
import { useConsentInvitation } from './useConsentInvitation';
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof React>()),
  useEffect: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());
describe('TC-106 — Hook người nhận chỉ xem và không tự phản hồi', () => {
  it.each([null, 'v1.payload'])('khởi tạo token=%s không gửi POST, thiếu token không GET', async (token) => {
    const effects: Array<() => void | (() => void)> = [];
    vi.mocked(useEffect).mockImplementation((effect) => {
      effects.push(effect);
    });
    const repo: InvitationRepository = {
      view: vi.fn(async () => ({
        profileDisplayName: 'Mẹ',
        inviterDisplayName: null,
        expiresAt: '2026-10-13T00:00:00Z',
        status: 'pending' as const,
      })),
      respond: vi.fn(),
    };
    let workspace: ReturnType<typeof useConsentInvitation> | undefined;
    function Probe() {
      workspace = useConsentInvitation(repo, token);
      return null;
    }
    renderToStaticMarkup(<Probe />);
    expect(workspace!.loaded.state).toBe(token ? 'loading' : 'unavailable');
    const cleanups = effects.map((effect) => effect());
    await Promise.resolve();
    expect(repo.view).toHaveBeenCalledTimes(token ? 1 : 0);
    expect(repo.respond).not.toHaveBeenCalled();
    for (const cleanup of cleanups) cleanup?.();
  });
});
