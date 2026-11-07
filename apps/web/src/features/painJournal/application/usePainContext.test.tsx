import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { issue, profile, session } from '../test/painIssues.test-helper';
import { usePainContext } from './usePainContext';
import type { PainContextReader } from './ports';
const range = { from: '2026-11-01', to: '2026-11-07' };
const data = { ...range, asNeededDoses: [], courses: [] };
const key = ['profiles', 'a', 'f', 'pain', 'main', 'p', 'context', issue.id, range.from, range.to];
function probe(
  client: QueryClient,
  api: PainContextReader,
  current = session,
  target = profile,
  scope: 'main' | 'self' = 'main',
  selected = range,
  id = issue.id,
) {
  let state!: ReturnType<typeof usePainContext>;
  function Probe() {
    state = usePainContext(api, current, target, scope, id, selected);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return state;
}
it('đọc main/self với signal và cô lập cache theo khoảng, vấn đề, tài khoản, gia đình', async () => {
  const client = new QueryClient();
  const context = vi.fn(async () => data);
  probe(client, { context });
  await client.getQueryCache().find({ queryKey: key })!.fetch();
  expect(context).toHaveBeenLastCalledWith('p', issue.id, range, expect.any(AbortSignal));
  const self = probe(client, { context }, { ...session, role: 'member' }, profile, 'self');
  await self.refetch();
  expect(context).toHaveBeenLastCalledWith(null, issue.id, range, expect.any(AbortSignal));
  expect(probe(client, { context }).data).toEqual(data);
  expect(
    probe(client, { context }, session, profile, 'main', { ...range, from: '2026-10-01' }).data,
  ).toBeUndefined();
  expect(probe(client, { context }, session, profile, 'main', range, 'other').data).toBeUndefined();
  expect(
    probe(client, { context }, { ...session, account: { ...session.account, id: 'b' } }).data,
  ).toBeUndefined();
  expect(
    probe(
      client,
      { context },
      { ...session, family: { id: 'g', name: 'Khác' } },
      { ...profile, familyId: 'g' },
    ).data,
  ).toBeUndefined();
  client.clear();
});
it('mất quyền hoặc đồng thuận che cache và chặn refetch thủ công', async () => {
  const client = new QueryClient();
  client.setQueryData(key, data);
  const context = vi.fn(async () => data);
  for (const [current, target, scope] of [
    [{ ...session, role: 'member' as const }, profile, 'main' as const],
    [session, { ...profile, consentStatus: 'withdrawn' as const }, 'main' as const],
    [session, { ...profile, familyId: 'other' }, 'main' as const],
    [session, { ...profile, id: 'other' }, 'self' as const],
  ] as const) {
    const state = probe(client, { context }, current, target, scope);
    expect(state.data).toBeUndefined();
    await state.refetch();
  }
  expect(context).not.toHaveBeenCalled();
  client.clear();
});
