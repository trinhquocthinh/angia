import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { issue, profile, session } from '../test/painIssues.test-helper';
import { usePainIssueDetail } from './usePainIssueDetail';
import type { PainIssueReader } from './ports';
const data = { ...issue, entries: [], exercises: [], statusEvents: [] };
const key = ['profiles', 'a', 'f', 'pain', 'main', 'p', 'detail', issue.id];
function probe(
  client: QueryClient,
  api: PainIssueReader,
  current = session,
  target = profile,
  scope: 'main' | 'self' = 'main',
  id = issue.id,
) {
  let state!: ReturnType<typeof usePainIssueDetail>;
  function Probe() {
    state = usePainIssueDetail(api, current, target, scope, id);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return state;
}
it('đọc main/self với signal và khóa cache tách từng vấn đề', async () => {
  const client = new QueryClient();
  const detail = vi.fn(async () => data);
  probe(client, { detail });
  await client.getQueryCache().find({ queryKey: key })!.fetch();
  expect(detail).toHaveBeenLastCalledWith('p', issue.id, expect.any(AbortSignal));
  probe(client, { detail }, { ...session, role: 'member' }, profile, 'self');
  await client
    .getQueryCache()
    .find({ queryKey: [...key.slice(0, 4), 'self', ...key.slice(5)] })!
    .fetch();
  expect(detail).toHaveBeenLastCalledWith(null, issue.id, expect.any(AbortSignal));
  client.setQueryData(key, data, { updatedAt: Date.now() + 60_000 });
  expect(probe(client, { detail }).data).toEqual(data);
  expect(probe(client, { detail }, session, profile, 'main', 'other').data).toBeUndefined();
  expect(
    probe(client, { detail }, { ...session, account: { ...session.account, id: 'other' } }).data,
  ).toBeUndefined();
  client.clear();
});
it('mất quyền che cache và chặn cả refetch thủ công', async () => {
  const client = new QueryClient();
  client.setQueryData(key, data);
  const detail = vi.fn(async () => data);
  for (const [current, target, scope] of [
    [{ ...session, role: 'member' as const }, profile, 'main' as const],
    [session, { ...profile, consentStatus: 'withdrawn' as const }, 'main' as const],
    [session, { ...profile, familyId: 'other' }, 'main' as const],
    [session, { ...profile, id: 'other' }, 'self' as const],
  ] as const) {
    const state = probe(client, { detail }, current, target, scope);
    expect(state.data).toBeUndefined();
    await state.refetch();
  }
  expect(detail).not.toHaveBeenCalled();
  client.clear();
});
