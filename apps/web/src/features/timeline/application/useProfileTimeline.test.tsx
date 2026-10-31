import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { TimelinePage } from '@angia/contracts';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { events, page, profile, session } from '../test/fixtures.test-helper';
import type { TimelineRepository } from './ports';
import { useProfileTimeline } from './useProfileTimeline';

function mount(
  client: QueryClient,
  repository: TimelineRepository,
  context: ProfileSession = session,
  item: HealthProfile = profile,
) {
  let result!: ReturnType<typeof useProfileTimeline>;
  function Probe() {
    result = useProfileTimeline(repository, context, item);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return result;
}
const makeClient = () =>
  // Render tĩnh nhiều lần để đọc kết quả; không giả lập một lần mount mới sau mỗi lần đọc.
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, retryOnMount: false, refetchOnMount: false, gcTime: Infinity },
    },
  });

describe('TC-503/504/505 — truy vấn web dòng thời gian', () => {
  it('nối trang theo cursor, giữ thứ tự API và dừng khi hết trang', async () => {
    const client = makeClient();
    const older = { ...events[5]!, date: '2026-10-29', id: '2026-10-29' };
    const list = vi
      .fn()
      .mockResolvedValueOnce(page)
      .mockResolvedValueOnce({ items: [older], nextCursor: null });
    const repository = { list };
    await mount(client, repository).refetch();
    let query = mount(client, repository);
    expect(query.data?.pages).toEqual([page]);
    expect(query.hasNextPage).toBe(true);
    await query.fetchNextPage();
    query = mount(client, repository);
    expect(query.data?.pages.flatMap((item) => item.items)).toEqual([...events, older]);
    expect(query.hasNextPage).toBe(false);
    expect(list.mock.calls.map((call) => call.slice(0, 2))).toEqual([
      [profile.id, null],
      [profile.id, page.nextCursor],
    ]);
    expect(list.mock.calls[0]![2]).toBeInstanceOf(AbortSignal);
    client.clear();
  });
  it('member, khác gia đình và hồ sơ chưa đồng thuận không đọc hoặc lộ cache', () => {
    for (const [context, item] of [
      [{ ...session, role: 'member' }, profile],
      [{ ...session, family: null }, profile],
      [{ ...session, family: { id: 'other', name: 'Khác' } }, profile],
      [session, { ...profile, consentStatus: 'pending' }],
      [session, { ...profile, consentStatus: 'withdrawn' }],
    ] as [ProfileSession, HealthProfile][]) {
      const client = makeClient();
      const list = vi.fn();
      mount(client, { list }, context, item);
      const cached = client.getQueryCache().getAll()[0]!;
      client.setQueryData(cached.queryKey, { pages: [page], pageParams: [null] });
      expect(mount(client, { list }, context, item).data).toBeUndefined();
      expect((cached.options as { enabled: boolean }).enabled).toBe(false);
      expect(list).not.toHaveBeenCalled();
      client.clear();
    }
  });
  it('giữ trang đầu lúc xem thêm và hủy request bằng signal', async () => {
    const client = makeClient();
    let finish!: (value: TimelinePage) => void;
    const pending = new Promise<TimelinePage>((resolve) => {
      finish = resolve;
    });
    const list = vi.fn().mockResolvedValueOnce(page).mockReturnValueOnce(pending);
    await mount(client, { list }).refetch();
    const request = mount(client, { list }).fetchNextPage();
    expect(mount(client, { list }).isFetchingNextPage).toBe(true);
    expect(mount(client, { list }).data?.pages).toEqual([page]);
    await client.cancelQueries({ queryKey: ['timeline'] });
    expect(list.mock.calls[1]![2].aborted).toBe(true);
    finish({ items: [], nextCursor: null });
    await request;
    client.clear();
  });
  it('khóa cache tách tài khoản, gia đình, hồ sơ và quyền xem số đo', async () => {
    const client = makeClient();
    const repository = { list: vi.fn().mockResolvedValue(page) };
    await mount(client, repository).refetch();
    for (const [context, item] of [
      [{ ...session, account: { ...session.account, id: 'new' } }, profile],
      [
        { ...session, family: { id: 'new', name: 'Nhà mới' } },
        { ...profile, familyId: 'new' },
      ],
      [session, { ...profile, id: 'other' }],
      [session, { ...profile, birthYear: 2021, vitalsEnabled: false }],
    ] as [ProfileSession, HealthProfile][])
      expect(mount(client, repository, context, item).data).toBeUndefined();
    client.clear();
  });
  it.each([401, 403, 404, 409, 500])(
    'ẩn trang cũ khi tải trang tiếp theo thất bại %s và thử lại từ đầu',
    async (status) => {
      const client = makeClient();
      const list = vi
        .fn()
        .mockResolvedValueOnce(page)
        .mockRejectedValueOnce(new MedicationRequestError('lỗi', status))
        .mockResolvedValue({ items: [], nextCursor: null });
      const repository = { list };
      await mount(client, repository).refetch();
      await mount(client, repository).fetchNextPage();
      expect(mount(client, repository).data).toBeUndefined();
      expect(mount(client, repository).isError).toBe(true);
      await mount(client, repository).refetch();
      expect(mount(client, repository).data?.pages).toEqual([{ items: [], nextCursor: null }]);
      expect(list.mock.calls.at(-1)?.[1]).toBe(null);
      client.clear();
    },
  );
  it('ẩn cache trong lúc làm mới và bỏ số đo khi chưa bật', async () => {
    const client = makeClient();
    const repository = { list: vi.fn().mockResolvedValue(page) };
    const item = { ...profile, birthYear: 2021, vitalsEnabled: false };
    await mount(client, repository, session, item).refetch();
    expect(
      mount(client, repository, session, item).data?.pages[0]?.items.map((event) => event.kind),
    ).not.toContain('measurement');
    client.getQueryCache().getAll()[0]!.setState({ fetchStatus: 'fetching' });
    expect(mount(client, repository, session, item).data).toBeUndefined();
    client.clear();
  });
});
