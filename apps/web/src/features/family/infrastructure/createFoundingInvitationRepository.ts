import { apiClient } from '@src/shared/api/apiClient';
import type { FoundingInvitationRepository } from '../application/ports';
import { readAdminResponse } from './readAdminResponse';

export function createFoundingInvitationRepository(client = apiClient): FoundingInvitationRepository {
  return {
    create: async (csrfToken) =>
      readAdminResponse(
        await client.POST('/api/admin/founding-invitations', {
          body: { kind: 'found_family' },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
    revoke: async (id, csrfToken) => {
      const result = await client.DELETE('/api/admin/founding-invitations/{id}', {
        params: { path: { id } },
        headers: { 'X-CSRF-Token': csrfToken },
      });
      if (result.response.status !== 204) readAdminResponse(result);
    },
  };
}
