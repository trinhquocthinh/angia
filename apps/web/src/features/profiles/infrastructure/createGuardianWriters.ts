import type { apiClient } from '@src/shared/api/apiClient';
import type { ProfileGuardiansRepository } from '../application/guardianPorts';

export function createGuardianWriters(
  client: typeof apiClient,
): Pick<ProfileGuardiansRepository, 'add' | 'removeSelf'> {
  return {
    async add(profileId, guardianAccountId, csrfToken) {
      if (!csrfToken.trim()) return { ok: false, code: 'ERR_CSRF' };
      try {
        const { response, error } = await client.POST('/api/health-profiles/{id}/guardians', {
          params: { path: { id: profileId } },
          body: { guardianAccountId },
          headers: { 'X-CSRF-Token': csrfToken },
        });
        if (response.status === 204) return { ok: true, value: undefined };
        return { ok: false, code: error?.error.code ?? 'UNKNOWN' };
      } catch {
        return { ok: false, code: 'NETWORK' };
      }
    },
    async removeSelf(profileId, csrfToken) {
      if (!csrfToken.trim()) return { ok: false, code: 'ERR_CSRF' };
      try {
        const { response, error } = await client.DELETE('/api/health-profiles/{id}/guardians/me', {
          params: { path: { id: profileId } },
          headers: { 'X-CSRF-Token': csrfToken },
        });
        if (response.status === 204) return { ok: true, value: undefined };
        return { ok: false, code: error?.error.code ?? 'UNKNOWN' };
      } catch {
        return { ok: false, code: 'NETWORK' };
      }
    },
  };
}
