import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { useManagedHouseholdInvitations } from './useManagedHouseholdInvitations';
vi.mock('@tanstack/react-query', () => ({ useQuery: vi.fn(() => ({})) }));
it('TC-773: truy vấn theo phiên/nhà, không giữ cache khi rời trang, không POST khi đọc', async () => {
  const list = vi.fn().mockResolvedValue({ ok: true, value: { items: [], hasMore: false } });
  function Probe() {
    useManagedHouseholdInvitations(list, 'account:family');
    return null;
  }
  renderToStaticMarkup(<Probe />);
  const options = vi.mocked(useQuery).mock.calls[0]![0];
  expect(options).toMatchObject({
    queryKey: ['household-invitations', 'account:family', 0],
    gcTime: 0,
    retry: false,
  });
  await (options.queryFn as () => Promise<unknown>)();
  expect(list).toHaveBeenCalledExactlyOnceWith(0);
});
