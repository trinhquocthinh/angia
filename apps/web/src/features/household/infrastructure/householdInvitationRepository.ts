import { apiClient } from '@src/shared/api/apiClient';
import type { InvitationRepository } from '../application/invitationPorts';

export const householdInvitationRepository: InvitationRepository = {
  async create(body, csrfToken) {
    try {
      const { response, data, error } = await apiClient.POST('/api/family/invitations', {
        body,
        headers: { 'X-CSRF-Token': csrfToken },
      });
      if (response.status === 201 && data) return { ok: true, value: data };
      return { ok: false, code: error?.error.code ?? 'UNKNOWN' };
    } catch (error) {
      return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
    }
  },
  async revoke(id, csrfToken) {
    try {
      const { response, error } = await apiClient.DELETE('/api/family/invitations/{id}', {
        params: { path: { id } },
        headers: { 'X-CSRF-Token': csrfToken },
      });
      if (response.status === 204) return { ok: true, value: undefined };
      return { ok: false, code: error?.error.code ?? 'UNKNOWN' };
    } catch {
      return { ok: false, code: 'NETWORK' };
    }
  },
};
