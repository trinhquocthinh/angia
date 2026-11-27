import { apiClient } from '@src/shared/api/apiClient';
import type { AdminAuditRepository } from '../application/ports';
import { readAdminResponse } from './readAdminResponse';
export function createAdminAuditRepository(client = apiClient): AdminAuditRepository {
  return {
    list: async (query, signal) =>
      readAdminResponse(
        await client.GET('/api/admin/audit-events', {
          params: { query },
          signal: signal ?? null,
        }),
      ),
  };
}
