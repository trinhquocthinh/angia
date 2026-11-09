import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { issue, session, profile } from '../test/painIssues.test-helper';
import { usePainIssueDeletionImpact } from './usePainIssueDeletionImpact';
import type { PainIssueLifecycleApi } from './ports';
function probe(
  client: QueryClient,
  api: Pick<PainIssueLifecycleApi, 'deletionImpact'>,
  current = session,
  scope: 'main' | 'self' = 'main',
) {
  let result!: ReturnType<typeof usePainIssueDeletionImpact>;
  function Probe() {
    result = usePainIssueDeletionImpact(api, current, profile, scope, issue.id);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return result;
}
it('TC-727: tác động self truyền null và signal, mất quyền không lộ số đã cache', async () => {
  const client = new QueryClient();
  const api = { deletionImpact: vi.fn(async () => ({ entryCount: 5, exerciseCount: 2 })) };
  const key = ['profiles', 'a', 'f', 'pain', 'self', 'p', 'deletion-impact', issue.id];
  probe(client, api, { ...session, role: 'member' }, 'self');
  await client.getQueryCache().find({ queryKey: key })!.fetch();
  expect(api.deletionImpact).toHaveBeenCalledWith(null, issue.id, expect.any(AbortSignal));
  api.deletionImpact.mockClear();
  const denied = probe(client, api, { ...session, csrfToken: '' }, 'self');
  expect(denied.data).toBeUndefined();
  await denied.refetch();
  expect(api.deletionImpact).not.toHaveBeenCalled();
  client.clear();
});
