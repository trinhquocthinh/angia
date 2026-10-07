import { apiClient } from '@src/shared/api/apiClient';
import { logoutSession } from '@src/features/auth/infrastructure/logoutSession';
import type { ProfilesRepository } from '../application/ports';
import { readProfileResponse } from './readProfileResponse';
export function createProfilesRepository(client = apiClient): ProfilesRepository {
  return {
    list: async (signal) =>
      readProfileResponse(await client.GET('/api/health-profiles', { signal: signal ?? null })),
    linkableAccounts: async (signal) =>
      readProfileResponse(
        await client.GET('/api/health-profiles/linkable-accounts', { signal: signal ?? null }),
      ),
    create: async (body, csrfToken) =>
      readProfileResponse(
        await client.POST('/api/health-profiles', { body, headers: { 'X-CSRF-Token': csrfToken } }),
      ),
    createInvitation: async (id, csrfToken) =>
      readProfileResponse(
        await client.POST('/api/health-profiles/{id}/consent-invitations', {
          params: { path: { id } },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
    revokeInvitation: async (id, csrfToken) => {
      await readProfileResponse(
        await client.DELETE('/api/health-profiles/{id}/consent-invitations', {
          params: { path: { id } },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      );
    },
    logout: (csrfToken) => logoutSession(csrfToken, client),
  };
}
