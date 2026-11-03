import { apiClient } from '@src/shared/api/apiClient';
import type { ProfileLinkAdminRepository } from '../application/ports';
import { readAdminResponse } from './readAdminResponse';

export function createProfileLinkAdminRepository(client = apiClient): ProfileLinkAdminRepository {
  return {
    list: async (familyId, signal) =>
      readAdminResponse(
        await client.GET('/api/admin/families/{familyId}/profiles', {
          params: { path: { familyId } },
          signal: signal ?? null,
        }),
      ),
    setLinkedAccount: async (familyId, profileId, accountId, csrfToken) =>
      readAdminResponse(
        await client.PUT('/api/admin/families/{familyId}/profiles/{profileId}/linked-account', {
          params: { path: { familyId, profileId } },
          body: { accountId },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
  };
}
