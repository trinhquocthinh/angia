import { apiClient } from '@src/shared/api/apiClient';
import type { MyConsentRepository } from '../application/myConsentPorts';
import { readProfileResponse } from './readProfileResponse';
export function createMyConsentRepository(client = apiClient): MyConsentRepository {
  return {
    get: async (signal) =>
      readProfileResponse(await client.GET('/api/me/consent', { signal: signal ?? null })),
    withdraw: async (csrfToken) =>
      readProfileResponse(
        await client.POST('/api/me/consent/withdraw', { body: {}, headers: { 'X-CSRF-Token': csrfToken } }),
      ),
  };
}
