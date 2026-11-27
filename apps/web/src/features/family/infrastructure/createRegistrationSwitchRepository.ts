import { apiClient } from '@src/shared/api/apiClient';
import type { RegistrationSwitchRepository } from '../application/ports';
import { readAdminResponse } from './readAdminResponse';

export function createRegistrationSwitchRepository(client = apiClient): RegistrationSwitchRepository {
  return {
    get: async (signal) =>
      readAdminResponse(await client.GET('/api/registration-switch', { signal: signal ?? null })),
    set: async (open, csrfToken) =>
      readAdminResponse(
        await client.PUT('/api/admin/registration-switch', {
          body: { open },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
  };
}
