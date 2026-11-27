import { apiClient } from '@src/shared/api/apiClient';
import type { AdminStatsRepository } from '../application/ports';
import { readAdminResponse } from './readAdminResponse';
export function createAdminStatsRepository(client = apiClient): AdminStatsRepository {
  return {
    get: async (signal) =>
      readAdminResponse(
        await client.GET('/api/admin/stats', {
          params: { query: { weeks: 12 } },
          signal: signal ?? null,
        }),
      ),
  };
}
