import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { issue, profile, session } from '../test/painIssues.test-helper';
import type { PainJournalApi } from './ports';
import { usePainIssues } from './usePainIssues';

const key = ['profiles', 'a', 'f', 'pain', 'main', 'p', 'all'];
const data = { issues: [issue] };
function probe(
  client: QueryClient,
  api: PainJournalApi,
  current = session,
  target = profile,
  scope: 'main' | 'self' = 'main',
  status: 'all' | 'tracking' | 'resolved' = 'all',
) {
  let state: ReturnType<typeof usePainIssues> | undefined;
  function Probe() {
    state = usePainIssues(api, current, target, scope, status);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return state!;
}
describe('E21-S2-T1 — cache và quyền đọc sổ đau nhức', () => {
  it('main/self dùng cửa API tương ứng và AbortSignal', async () => {
    const client = new QueryClient();
    const list = vi.fn(async () => data);
    const api = { list };
    probe(client, api);
    await client.getQueryCache().find({ queryKey: key })!.fetch();
    expect(list).toHaveBeenLastCalledWith('p', { status: 'all' }, expect.any(AbortSignal));
    probe(client, api, { ...session, role: 'member' }, profile, 'self');
    await client
      .getQueryCache()
      .find({ queryKey: ['profiles', 'a', 'f', 'pain', 'self', 'p', 'all'] })!
      .fetch();
    expect(list).toHaveBeenLastCalledWith(null, { status: 'all' }, expect.any(AbortSignal));
    client.clear();
  });
  it('không dùng dữ liệu cache qua tài khoản, gia đình, hồ sơ, phạm vi hoặc bộ lọc', () => {
    const client = new QueryClient();
    client.setQueryData(key, data);
    const api = { list: vi.fn() };
    // Giả lập cache còn mới trong SSR; tránh trạng thái đang tải lại khi dựng observer.
    client.setQueryData(key, data, { updatedAt: Date.now() + 60_000 });
    expect(probe(client, api).data).toEqual(data);
    const others: ProfileSession[] = [
      { ...session, account: { ...session.account, id: 'b' } },
      { ...session, family: { id: 'g', name: 'Khác' } },
    ];
    for (const current of others) expect(probe(client, api, current).data).toBeUndefined();
    expect(probe(client, api, session, { ...profile, id: 'q' }).data).toBeUndefined();
    expect(probe(client, api, session, profile, 'self').data).toBeUndefined();
    expect(probe(client, api, session, profile, 'main', 'resolved').data).toBeUndefined();
    client.clear();
  });
  it('chặn member, gia đình sai, thiếu gia đình, chưa đồng thuận và self sai hồ sơ dù có cache', () => {
    const client = new QueryClient();
    client.setQueryData(key, data);
    const api = { list: vi.fn() };
    const cases: [ProfileSession, HealthProfile, 'main' | 'self'][] = [
      [{ ...session, role: 'member' }, profile, 'main'],
      [{ ...session, family: null }, profile, 'main'],
      [session, { ...profile, familyId: 'other' }, 'main'],
      [session, { ...profile, consentStatus: 'pending' } as HealthProfile, 'main'],
      [{ ...session, account: { ...session.account, healthProfileId: null } }, profile, 'self'],
      [session, { ...profile, id: 'q' }, 'self'],
    ];
    for (const [current, target, scope] of cases) {
      const state = probe(client, api, current, target, scope);
      expect(state.isEnabled).toBe(false);
      expect(state.data).toBeUndefined();
    }
    client.clear();
  });
  it('không gọi API khi refetch thủ công sau khi mất quyền', async () => {
    const client = new QueryClient();
    const list = vi.fn(async () => data);
    const state = probe(client, { list }, { ...session, role: 'member' });
    await state.refetch();
    expect(list).not.toHaveBeenCalled();
    client.clear();
  });
  it('ẩn dữ liệu cũ trong lúc làm mới và sau lỗi', async () => {
    const client = new QueryClient();
    client.setQueryData(key, data);
    let reject: (error: Error) => void = () => undefined;
    const api: PainJournalApi = {
      list: () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    };
    probe(client, api);
    const pending = client
      .getQueryCache()
      .find({ queryKey: key })!
      .fetch()
      .catch(() => undefined);
    expect(probe(client, api).data).toBeUndefined();
    reject(new Error('Mất quyền'));
    await pending;
    expect(probe(client, api).data).toBeUndefined();
    client.clear();
  });
});
