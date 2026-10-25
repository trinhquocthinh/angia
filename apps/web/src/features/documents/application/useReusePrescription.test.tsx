import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { DocumentEntriesRepository } from './documentEntryPorts';
import { ReviewRequestError } from './ReviewRequestError';
import { useReusePrescription } from './useReusePrescription';

const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};
const request = {
  startDate: '2026-10-13',
  items: [{ prescriptionItemId: 'i', durationDays: 30, longTerm: false }],
};

function mount(client: QueryClient, reuse: DocumentEntriesRepository['reuse']) {
  let state: ReturnType<typeof useReusePrescription> | undefined;
  function Probe() {
    state = useReusePrescription(
      { page: async () => ({ items: [], nextCursor: null }), reuse },
      session,
      'p',
      'rx',
    );
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return state!;
}

describe('TC-284 lưu Dùng lại đơn', () => {
  it('gửi CSRF và đúng đơn; làm mới thuốc và danh mục của đúng hồ sơ', async () => {
    const client = new QueryClient();
    const keys = [
      ['medications', 'a', 'f', 'p', 'current'],
      ['documents', 'a', 'f', 'p', 'entries', 'all'],
      ['medications', 'a', 'f', 'khác'],
    ];
    for (const key of keys) client.setQueryData(key, {});
    const sent: unknown[] = [];
    const state = mount(client, async (...args) => {
      sent.push(args);
      return [];
    });
    expect(await state.submit(request)).toBe(true);
    expect(sent).toEqual([['p', 'rx', request, 'csrf']]);
    expect(keys.map((key) => client.getQueryState(key)?.isInvalidated)).toEqual([true, true, false]);
  });

  it('lỗi API (kể cả 409 xung đột) và lỗi mạng → báo thất bại', async () => {
    const conflict = mount(new QueryClient(), async () => {
      throw new ReviewRequestError('Trùng thuốc.', 409, 'ERR_COURSE_CONFLICT_UNRESOLVED');
    });
    expect(await conflict.submit(request)).toBe(false);
    const network = mount(new QueryClient(), async () => {
      throw new TypeError('network');
    });
    expect(await network.submit(request)).toBe(false);
  });
});
