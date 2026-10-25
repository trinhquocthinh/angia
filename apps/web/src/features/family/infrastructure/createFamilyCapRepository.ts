import { apiClient } from '@src/shared/api/apiClient';
import type { FamilyCapRepository } from '../application/ports';
import { readAdminResponse } from './readAdminResponse';

export function createFamilyCapRepository(client = apiClient): FamilyCapRepository {
  return {
    list: async (signal) =>
      readAdminResponse(await client.GET('/api/admin/family-extraction-caps', { signal: signal ?? null })),
    setCap: async (familyId, capUsd, csrfToken) =>
      readAdminResponse(
        await client.PUT('/api/admin/families/{id}/extraction-cap', {
          params: { path: { id: familyId } },
          body: { capUsd },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
  };
}
