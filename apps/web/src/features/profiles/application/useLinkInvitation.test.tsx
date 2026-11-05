import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InvitationRepository } from './invitationPorts';
import { useLinkInvitation } from './useLinkInvitation';
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof React>()),
  useEffect: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());
describe('TC-559 — Hook trang link chỉ đọc token từ fragment và không tự xác nhận', () => {
  it.each([null, 'v1.payload'])('token=%s: không POST; thiếu token không GET', async (token) => {
    const effects: Array<() => void | (() => void)> = [];
    vi.mocked(useEffect).mockImplementation((effect) => {
      effects.push(effect);
    });
    const repo: InvitationRepository = {
      view: vi.fn(async () => ({
        profileName: 'Mẹ',
        inviterName: null,
        expiresAt: '2026-10-13T00:00:00Z',
        canAccept: true,
        reason: null,
        consentNote: null,
      })),
      respond: vi.fn(),
    };
    let workspace: ReturnType<typeof useLinkInvitation> | undefined;
    function Probe() {
      workspace = useLinkInvitation(repo, token, 'csrf');
      return null;
    }
    const client = new QueryClient();
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    expect(workspace!.loaded.state).toBe(token ? 'loading' : 'missing');
    const cleanups = effects.map((effect) => effect());
    await Promise.resolve();
    expect(repo.view).toHaveBeenCalledTimes(token ? 1 : 0);
    expect(repo.respond).not.toHaveBeenCalled();
    for (const cleanup of cleanups) cleanup?.();
    client.clear();
  });
});
