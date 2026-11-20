import type { apiClient } from '@src/shared/api/apiClient';
import type { ProfileGuardiansRepository } from '../application/guardianPorts';

export function createGuardianReaders(
  client: typeof apiClient,
): Pick<ProfileGuardiansRepository, 'list' | 'listCandidates'> {
  return {
    async list(profileId, signal) {
      try {
        const { response, data, error } = await client.GET('/api/health-profiles/{id}/guardians', {
          params: { path: { id: profileId } },
          signal: signal ?? null,
        });
        if (response.status === 200 && data) return { ok: true, value: data.guardians };
        return { ok: false, code: error?.error.code ?? 'UNKNOWN' };
      } catch (err) {
        return { ok: false, code: err instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
      }
    },
    async listCandidates(signal) {
      try {
        const { response, data, error } = await client.GET('/api/family/members', {
          signal: signal ?? null,
        });
        if (response.status === 200 && data) return { ok: true, value: data.members };
        return { ok: false, code: error?.error.code ?? 'UNKNOWN' };
      } catch (err) {
        return { ok: false, code: err instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
      }
    },
  };
}
