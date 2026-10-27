import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { view, quota } from '../test/scanQuotaFixtures';
import type { ScanQuotaRepository } from './ports';
import { useAdminScanQuota } from './useAdminScanQuota';
import { useScanQuotaMutation } from './useScanQuotaMutation';
vi.mock('./useScanQuotaMutation', () => ({ useScanQuotaMutation: vi.fn() }));
afterEach(() => vi.clearAllMocks());
describe('Trạng thái ghi theo tài khoản', () => {
  it.each(['success', 'error', 'pending'])(
    'TC-590: trạng thái %s của tài khoản cũ không hiện ở tài khoản mới',
    (status) => {
      const mutation = {
        variables: { accountId: 'a' },
        isSuccess: status === 'success',
        isPending: status === 'pending',
        error: status === 'error' ? new AdminRequestError('ERR_SCAN_QUOTA_CONFLICT', 409) : null,
      };
      vi.mocked(useScanQuotaMutation).mockReturnValue(mutation as ReturnType<typeof useScanQuotaMutation>);
      const repository: ScanQuotaRepository = {
        getAdmin: async () => view,
        getFamily: async () => quota,
        savePolicy: vi.fn(),
        grant: vi.fn(),
      };
      const client = new QueryClient();
      let state!: ReturnType<typeof useAdminScanQuota>;
      function Probe() {
        state = useAdminScanQuota(repository, 'csrf-b', 'b');
        return null;
      }
      renderToStaticMarkup(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      );
      expect(state.mutation.isSuccess).toBe(false);
      expect(state.mutation.isPending).toBe(false);
      expect(state.mutation.error).toBeNull();
      client.clear();
    },
  );
});
