import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';
import type { AsNeededDoseRepository } from './ports';
import { useAsNeededDoses } from './useAsNeededDoses';

const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: 'p' },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
  features: { redactionSuggestions: false },
};
const filter = { courseId: 'c', from: '2026-11-01', to: '2026-11-04' };
const mainKey = ['as-needed-doses', 'a', 'f', 'p', 'c', filter.from, filter.to];
const data = {
  doses: [
    {
      id: 'd',
      courseId: 'c',
      givenAt: '2026-11-04T07:00:00Z',
      quantity: null,
      unit: null,
      recordedBy: null,
      recordedAt: '2026-11-04T07:00:00Z',
    },
  ],
};
function render(
  client: QueryClient,
  repository: AsNeededDoseRepository,
  current = session,
  readOnly = false,
) {
  let state: ReturnType<typeof useAsNeededDoses> | undefined;
  function Probe() {
    state = useAsNeededDoses(repository, current, 'p', filter, readOnly);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return state!;
}
describe('Đọc nhật ký liều theo phạm vi tài khoản/gia đình/hồ sơ', () => {
  it('TC-495: main đọc đúng hồ sơ và bộ lọc; cache không dùng qua tài khoản', async () => {
    const client = new QueryClient();
    const list = vi.fn(async () => data);
    const repository = { list } as unknown as AsNeededDoseRepository;
    render(client, repository);
    await client.getQueryCache().find({ queryKey: mainKey })!.fetch();
    expect(list).toHaveBeenCalledWith('p', filter, expect.any(AbortSignal));
    expect(client.getQueryData(mainKey)).toEqual(data);
    expect(
      render(client, repository, { ...session, account: { ...session.account, id: 'other' } }).data,
    ).toBeUndefined();
  });
  it('SPEC-042: tự xem gọi route me và không mở đọc hồ sơ khác', async () => {
    const client = new QueryClient();
    const list = vi.fn(async () => data);
    const repository = { list } as unknown as AsNeededDoseRepository;
    const member = { ...session, role: 'member' as const };
    render(client, repository, member, true);
    const key = [...selfProfileKey(member), 'as-needed-doses', 'c', filter.from, filter.to];
    await client.getQueryCache().find({ queryKey: key })!.fetch();
    expect(list).toHaveBeenCalledWith(null, filter, expect.any(AbortSignal));
    expect(
      render(
        client,
        repository,
        { ...member, account: { ...member.account, healthProfileId: 'other' } },
        true,
      ).data,
    ).toBeUndefined();
    expect(render(client, repository, member, false).isEnabled).toBe(false);
  });
  it('TC-495: ẩn cache cũ trong khi làm mới hoặc lỗi', async () => {
    const client = new QueryClient();
    client.setQueryData(mainKey, data);
    let fail: (reason: unknown) => void = () => undefined;
    const repository = {
      list: () =>
        new Promise((_, reject) => {
          fail = reject;
        }),
    } as unknown as AsNeededDoseRepository;
    render(client, repository);
    const reading = client
      .getQueryCache()
      .find({ queryKey: mainKey })!
      .fetch()
      .catch(() => undefined);
    expect(render(client, repository).data).toBeUndefined();
    fail(new Error('Mất quyền'));
    await reading;
    expect(render(client, repository).data).toBeUndefined();
  });
});
