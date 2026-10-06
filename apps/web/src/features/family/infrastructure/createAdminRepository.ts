import { apiClient } from '@src/shared/api/apiClient';
import type { AdminRepository } from '../application/ports';
import { readAdminResponse } from './readAdminResponse';

export function createAdminRepository(client = apiClient): AdminRepository {
  return {
    listFamilies: async (signal) =>
      readAdminResponse(await client.GET('/api/admin/families', { signal: signal ?? null })),
    listAccounts: async (signal) =>
      readAdminResponse(await client.GET('/api/admin/accounts', { signal: signal ?? null })),
    createFamily: async (name, csrfToken) =>
      readAdminResponse(
        await client.POST('/api/admin/families', {
          body: { name },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
    assign: async (accountId, familyId, role, csrfToken) =>
      readAdminResponse(
        await client.POST('/api/admin/accounts/{id}/membership', {
          params: { path: { id: accountId } },
          body: { familyId, role },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
    change: async (accountId, body, csrfToken) =>
      readAdminResponse(
        await client.PATCH('/api/admin/accounts/{id}/membership', {
          params: { path: { id: accountId } },
          body,
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      ),
  };
}
