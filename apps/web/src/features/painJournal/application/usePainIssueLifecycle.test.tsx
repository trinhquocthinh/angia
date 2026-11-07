import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { issue, profile, session } from '../test/painIssues.test-helper';
import { usePainIssueLifecycle } from './usePainIssueLifecycle';
import { PainJournalRequestError } from './PainJournalRequestError';
import type { PainIssueLifecycleApi, PainEntryWriter } from './ports';

function probe(
  api: PainIssueLifecycleApi & Pick<PainEntryWriter, 'reopen'>,
  current = session,
  scope: 'main' | 'self' = 'main',
) {
  const client = new QueryClient();
  let state!: ReturnType<typeof usePainIssueLifecycle>;
  function Probe() {
    state = usePainIssueLifecycle(api, current, profile, scope, issue.id);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { state, client };
}
function makeApi() {
  return {
    resolve: vi.fn(async () => issue),
    reopen: vi.fn(async () => issue),
    deleteIssue: vi.fn(async () => undefined),
    deletionImpact: vi.fn(async () => ({ entryCount: 5, exerciseCount: 2 })),
  };
}
it('TC-688: self đóng/mở lại tường minh, làm mới đúng phạm vi', async () => {
  const api = makeApi();
  const { state, client } = probe(api, { ...session, role: 'member' }, 'self');
  const key = ['profiles', 'a', 'f', 'pain', 'self', 'p', 'detail', issue.id];
  const other = ['profiles', 'a', 'f', 'pain', 'self', 'q', 'detail', issue.id];
  client.setQueryData(key, issue);
  client.setQueryData(other, issue);
  expect(await state.run({ kind: 'resolve', resolvedOn: '2026-11-07' })).toBe(true);
  expect(api.resolve).toHaveBeenCalledWith(
    null,
    issue.id,
    { resolvedOn: '2026-11-07' },
    'csrf',
    expect.any(AbortSignal),
  );
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  expect(await state.run({ kind: 'reopen' })).toBe(true);
  expect(api.reopen).toHaveBeenCalledWith(null, issue.id, 'csrf', expect.any(AbortSignal));
  client.clear();
});
it('TC-687: xóa loại cache chi tiết/bối cảnh đã xóa, giữ cache vấn đề khác', async () => {
  const { state, client } = probe(makeApi());
  const base = ['profiles', 'a', 'f', 'pain', 'main', 'p'];
  for (const k of [
    [...base, 'detail', issue.id],
    [...base, 'context', issue.id, '12'],
    [...base, 'detail', 'other'],
  ])
    client.setQueryData(k, issue);
  expect(await state.run({ kind: 'delete' })).toBe(true);
  expect(client.getQueryData([...base, 'detail', issue.id])).toBeUndefined();
  expect(client.getQueryData([...base, 'context', issue.id, '12'])).toBeUndefined();
  expect(client.getQueryData([...base, 'detail', 'other'])).toEqual(issue);
  client.clear();
});
it('TC-686: chặn mất quyền, chống gửi lặp và thử lại sau lỗi', async () => {
  const api = makeApi();
  const denied = probe(api, { ...session, csrfToken: '' });
  expect(await denied.state.run({ kind: 'reopen' })).toBe(false);
  expect(api.reopen).not.toHaveBeenCalled();
  denied.client.clear();
  let finish!: (value: typeof issue) => void;
  api.reopen.mockImplementationOnce(
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  const { state, client } = probe(api);
  const first = state.run({ kind: 'reopen' });
  expect(await state.run({ kind: 'delete' })).toBe(false);
  expect(api.deleteIssue).not.toHaveBeenCalled();
  finish(issue);
  expect(await first).toBe(true);
  api.reopen.mockRejectedValueOnce(
    new PainJournalRequestError('Trùng vùng', 409, 'ERR_PAIN_ISSUE_EXISTS', 'other'),
  );
  expect(await state.run({ kind: 'reopen' })).toBe(false);
  expect(await state.run({ kind: 'reopen' })).toBe(true);
  client.clear();
});
