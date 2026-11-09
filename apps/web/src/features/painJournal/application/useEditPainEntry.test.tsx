import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { issue, profile, session } from '../test/painIssues.test-helper';
import { useEditPainEntry } from './useEditPainEntry';
import type { PainEntryEditor } from './ports';
const entry = {
  id: issue.id,
  level: 6,
  recordedAt: issue.updatedAt,
  note: null,
  createdBy: null,
  updatedBy: null,
  updatedAt: issue.updatedAt,
};
function probe(api: PainEntryEditor, current = session, scope: 'main' | 'self' = 'main') {
  const client = new QueryClient();
  let state!: ReturnType<typeof useEditPainEntry>;
  function Probe() {
    state = useEditPainEntry(api, current, profile, scope, issue.id);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { state, client };
}
it('sửa/xóa self làm mới chi tiết và danh sách đúng hồ sơ', async () => {
  const updateEntry = vi.fn(async () => entry);
  const deleteEntry = vi.fn(async () => undefined);
  const { state, client } = probe({ updateEntry, deleteEntry }, { ...session, role: 'member' }, 'self');
  const key = ['profiles', 'a', 'f', 'pain', 'main', 'p', 'detail', issue.id];
  const other = ['profiles', 'a', 'f', 'pain', 'main', 'q', 'all'];
  client.setQueryData(key, {});
  client.setQueryData(other, {});
  expect(await state.save(entry.id, { level: 4 })).toBe(true);
  expect(updateEntry).toHaveBeenCalledWith(
    null,
    issue.id,
    entry.id,
    { level: 4 },
    'csrf',
    expect.any(AbortSignal),
  );
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  expect(await state.remove(entry.id)).toBe(true);
  expect(deleteEntry).toHaveBeenCalledWith(null, issue.id, entry.id, 'csrf', expect.any(AbortSignal));
  client.clear();
});
it('chặn mất quyền và chặn thao tác trùng khi đang gửi', async () => {
  let finish!: () => void;
  const api = {
    updateEntry: vi.fn(async () => entry),
    deleteEntry: vi.fn(
      () =>
        new Promise<void>((r) => {
          finish = r;
        }),
    ),
  };
  const denied = probe(api, { ...session, csrfToken: '' });
  expect(await denied.state.save(entry.id, { level: 4 })).toBe(false);
  expect(await denied.state.remove(entry.id)).toBe(false);
  expect(api.deleteEntry).not.toHaveBeenCalled();
  denied.client.clear();
  const { state, client } = probe(api);
  const first = state.remove(entry.id);
  expect(await state.save(entry.id, { level: 4 })).toBe(false);
  finish();
  expect(await first).toBe(true);
  expect(api.updateEntry).not.toHaveBeenCalled();
  client.clear();
});
