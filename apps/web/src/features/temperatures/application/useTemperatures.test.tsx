import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';
import type { TemperatureRepository } from './ports';
import { useTemperatures } from './useTemperatures';

const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: 'p' },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};
const filter = { from: '2026-11-01', to: '2026-11-04' };
const key = ['temperatures', 'a', 'f', 'p', filter.from, filter.to];
const data = { readings: [] };
function probe(
  client: QueryClient,
  repository: TemperatureRepository,
  current = session,
  readOnly = false,
  enabled = true,
) {
  let state: ReturnType<typeof useTemperatures> | undefined;
  function Probe() {
    state = useTemperatures(repository, current, 'p', filter, readOnly, enabled);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return state!;
}
describe('Đọc nhiệt độ theo phạm vi phiên', () => {
  it('TC-502: main đọc theo ngày; tự xem dùng route me', async () => {
    const client = new QueryClient();
    const list = vi.fn(async () => data);
    const repo = { list } as unknown as TemperatureRepository;
    probe(client, repo);
    await client.getQueryCache().find({ queryKey: key })!.fetch();
    expect(list).toHaveBeenLastCalledWith('p', filter, expect.any(AbortSignal));
    const member = { ...session, role: 'member' as const };
    probe(client, repo, member, true);
    await client
      .getQueryCache()
      .find({ queryKey: [...selfProfileKey(member), 'temperatures', filter.from, filter.to] })!
      .fetch();
    expect(list).toHaveBeenLastCalledWith(null, filter, expect.any(AbortSignal));
  });
  it('TC-502: không dùng cache qua tài khoản; chặn member, chưa đồng thuận và tự xem sai hồ sơ', () => {
    const client = new QueryClient();
    client.setQueryData(key, data);
    const repo = { list: vi.fn() } as unknown as TemperatureRepository;
    expect(probe(client, repo).isEnabled).toBe(true);
    expect(
      probe(client, repo, { ...session, account: { ...session.account, id: 'other' } }).data,
    ).toBeUndefined();
    expect(probe(client, repo, { ...session, role: 'member' }).isEnabled).toBe(false);
    expect(probe(client, repo, session, false, false).data).toBeUndefined();
    expect(
      probe(client, repo, { ...session, account: { ...session.account, healthProfileId: 'other' } }, true)
        .isEnabled,
    ).toBe(false);
  });
  it('TC-502: ẩn dữ liệu cũ khi làm mới hoặc lỗi quyền truy cập', async () => {
    const client = new QueryClient();
    client.setQueryData(key, data);
    let fail: (reason: Error) => void = () => undefined;
    const repo = {
      list: () =>
        new Promise((_, reject) => {
          fail = reject;
        }),
    } as unknown as TemperatureRepository;
    probe(client, repo);
    const reading = client
      .getQueryCache()
      .find({ queryKey: key })!
      .fetch()
      .catch(() => undefined);
    expect(probe(client, repo).data).toBeUndefined();
    fail(new Error('Mất quyền'));
    await reading;
    expect(probe(client, repo).data).toBeUndefined();
  });
});
