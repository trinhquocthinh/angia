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
    // 204 không có body: chỉ đọc lỗi khi response không ok.
    unlink: async (csrfToken) => {
      const result = await client.POST('/api/me/profile-link/unlink', {
        body: { confirm: true },
        headers: { 'X-CSRF-Token': csrfToken },
      });
      if (!result.response.ok) await readProfileResponse(result);
    },
  };
}
