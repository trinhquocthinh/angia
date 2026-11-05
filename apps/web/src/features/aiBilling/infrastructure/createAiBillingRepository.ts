import { aiBillingViewSchema } from '@angia/contracts';
import { apiClient } from '@src/shared/api/apiClient';
import { readAdminResponse } from '@src/features/family/infrastructure/readAdminResponse';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import type { AiBillingRepository } from '../application/ports';

export function createAiBillingRepository(client = apiClient): AiBillingRepository {
  return {
    get: async (signal) => {
      const response = await client.GET('/api/admin/ai-billing', {
        signal: signal ?? null,
        cache: 'no-store',
      });
      const parsed = aiBillingViewSchema.safeParse(readAdminResponse(response));
      if (!parsed.success) throw new AdminRequestError('ERR_INTERNAL');
      return parsed.data;
    },
  };
}
