import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { profile, session, detail, chain, secondId } from '../test/fixtures.test-helper';
import { usePrescriptionChain } from './usePrescriptionChain';
import { usePrescriptionDetail } from './usePrescriptionDetail';

function mount(client: QueryClient, context: ProfileSession = session, item = profile) {
  let visible: unknown[] = [];
  function Probe() {
    visible = [
      usePrescriptionChain({ list: vi.fn() }, context, item).data,
      usePrescriptionDetail({ detail: vi.fn() }, context, item, secondId).data,
    ];
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return visible;
}
describe('TC-484 — quyền và cache chuỗi đơn', () => {
  it.each(['confirmed', 'pending', 'withdrawn'] as const)(
    'chỉ đọc khi đồng thuận confirmed: %s',
    (consentStatus) => {
      const client = new QueryClient();
      mount(client, session, { ...profile, consentStatus });
      for (const query of client.getQueryCache().getAll()) {
        expect(query.queryKey.slice(0, 4)).toEqual(['prescriptions', 'a', 'f', profile.id]);
        expect((query.options as { enabled: boolean }).enabled).toBe(consentStatus === 'confirmed');
      }
      client.clear();
    },
  );
  it('member hoặc khác gia đình không đọc và không lộ cache', () => {
    for (const context of [
      { ...session, role: 'member' as const },
      { ...session, family: { id: 'other', name: 'Khác' } },
    ]) {
      const client = new QueryClient();
      client.setQueryData(['prescriptions', 'a', context.family.id, profile.id, 'list'], chain);
      client.setQueryData(['prescriptions', 'a', context.family.id, profile.id, 'detail', secondId], detail);
      expect(mount(client, context)).toEqual([undefined, undefined]);
      expect(
        client
          .getQueryCache()
          .getAll()
          .every((q) => !(q.options as { enabled: boolean }).enabled),
      ).toBe(true);
      client.clear();
    }
  });
  it('không hiện dữ liệu cũ khi tải lại thất bại hoặc đang tải', () => {
    for (const fetching of [true, false]) {
      const client = new QueryClient({ defaultOptions: { queries: { retryOnMount: false } } });
      for (const [key, data] of [
        [['list'], chain],
        [['detail', secondId], detail],
      ] as const) {
        const queryKey = ['prescriptions', 'a', 'f', profile.id, ...key];
        client.setQueryData(queryKey, data);
        client
          .getQueryCache()
          .find({ queryKey })!
          .setState(fetching ? { fetchStatus: 'fetching' } : { status: 'error', error: new Error('denied') });
      }
      expect(mount(client)).toEqual([undefined, undefined]);
      client.clear();
    }
  });
  it('tài khoản mới không đọc cache của tài khoản trước', () => {
    const client = new QueryClient();
    client.setQueryData(['prescriptions', 'a', 'f', profile.id, 'list'], chain);
    expect(mount(client, { ...session, account: { ...session.account, id: 'new' } })).toEqual([
      undefined,
      undefined,
    ]);
    client.clear();
  });
});
