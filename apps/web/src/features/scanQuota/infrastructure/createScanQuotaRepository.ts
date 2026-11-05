import {
  adminScanQuotaViewSchema,
  familyScanQuotaSchema,
  grantScanQuotasRequestSchema,
} from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { readScanQuotaResponse } from './readScanQuotaResponse';
import type { ScanQuotaRepository } from '../application/ports';

export function createScanQuotaRepository(client = apiClient): ScanQuotaRepository {
  const read = (result: Parameters<typeof readScanQuotaResponse>[0]) => {
    const parsed = adminScanQuotaViewSchema.safeParse(readScanQuotaResponse(result));
    if (!parsed.success) throw new AdminRequestError('ERR_INTERNAL');
    return parsed.data;
  };
  return {
    getAdmin: async (signal) =>
      read(await client.GET('/api/admin/scan-quotas', { signal: signal ?? null, cache: 'no-store' })),
    getFamily: async (signal) => {
      const result = await client.GET('/api/family/scan-quota', {
        signal: signal ?? null,
        cache: 'no-store',
      });
      const parsed = familyScanQuotaSchema.safeParse(readScanQuotaResponse(result));
      if (!parsed.success) throw new AdminRequestError('ERR_INTERNAL');
      return parsed.data;
    },
    grant: async (input, csrfToken) => {
      const parsed = grantScanQuotasRequestSchema.safeParse(input);
      if (!parsed.success) throw new AdminRequestError('ERR_VALIDATION', 422);
      return read(
        await client.POST('/api/admin/scan-quota-grants', {
          body: parsed.data,
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      );
    },
  };
}
