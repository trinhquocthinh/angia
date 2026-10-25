import { apiClient } from '@src/shared/api/apiClient';
import type { AiBudgetRepository } from '../application/ports';
import { readAdminResponse } from './readAdminResponse';

export function createAiBudgetRepository(client = apiClient): AiBudgetRepository {
  return {
    get: async (signal) =>
      readAdminResponse(await client.GET('/api/admin/extraction-cap', { signal: signal ?? null })),
    setCap: async (monthlyCapUsd, csrfToken) =>
      readAdminResponse(
        await client.PUT('/api/admin/extraction-cap', {
          body: { monthlyCapUsd },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
  };
}
