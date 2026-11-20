import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import type { HomeResult } from './householdHomePorts';
import { useOwnershipOffer } from './useOwnershipOffer';
import { useDeletionRequest } from './useDeletionRequest';

it('SPEC-068/069: query theo scope, trả null cho trạng thái trống và giữ lỗi đọc', async () => {
  const client = new QueryClient();
  const getCurrentOffer = async (): Promise<HomeResult<null>> => ({ ok: true, value: null });
  const getCurrentDeletionRequest = async (): Promise<HomeResult<null>> => ({
    ok: false,
    error: { code: 'NETWORK' },
  });
  function Probe() {
    useOwnershipOffer({ getCurrentOffer }, 'family-a');
    useDeletionRequest({ getCurrentDeletionRequest }, 'family-a', true);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  const offer = client.getQueryCache().find({ queryKey: ['household-ownership-offer', 'family-a'] })!;
  const deletion = client.getQueryCache().find({ queryKey: ['household-deletion-request', 'family-a'] })!;
  expect(await offer.fetch()).toBeNull();
  await expect(deletion.fetch()).rejects.toThrow('Mất kết nối. Kiểm tra mạng rồi thử lại.');
  expect(client.getQueryData(['household-ownership-offer', 'family-b'])).toBeUndefined();
  client.clear();
});
