import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { MyConsentRepository } from './myConsentPorts';
import type { ProfileSession } from './ports';
import { profileScopeKey } from './profileScopeKey';
import { myConsentKey, useMyConsent } from './useMyConsent';
const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: 'p' },
  family: { id: 'f', name: 'Nhà An' },
  role: 'member',
  csrfToken: 'csrf',
};
describe('TC-386 — useMyConsent', () => {
  it('rút thành công thì làm mới truy vấn đồng thuận và danh sách hồ sơ', async () => {
    const client = new QueryClient();
    const listKey = [...profileScopeKey(session), 'list'];
    client.setQueryData(listKey, []);
    client.setQueryData(myConsentKey(session), { profile: null });
    const repo = {
      get: vi.fn(),
      withdraw: vi.fn(async () => ({
        consentStatus: 'withdrawn' as const,
        withdrawnAt: '2026-10-24T03:00:00Z',
      })),
    } as unknown as MyConsentRepository;
    let hook: ReturnType<typeof useMyConsent> | undefined;
    function Probe() {
      hook = useMyConsent(repo, session);
      return null;
    }
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    await hook!.withdraw.mutateAsync();
    expect(repo.withdraw).toHaveBeenCalledWith('csrf');
    expect(client.getQueryState(listKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(myConsentKey(session))?.isInvalidated).toBe(true);
    client.clear();
  });
});
