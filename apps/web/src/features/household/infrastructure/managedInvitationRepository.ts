import { apiClient } from '@src/shared/api/apiClient';
import type { ListInvitations, ReplaceInvitation } from '../application/managedInvitationPorts';
export const managedInvitationRepository: { list: ListInvitations; replace: ReplaceInvitation } = {
  async list(offset) {
    try {
      const { response, data, error } = await apiClient.GET('/api/family/invitations', {
        params: { query: { offset } },
      });
      return response.status === 200 && data
        ? { ok: true, value: data }
        : { ok: false, code: error?.error.code ?? 'UNKNOWN' };
    } catch {
      return { ok: false, code: 'NETWORK' };
    }
  },
  async replace(id, csrf) {
    try {
      const { response, data, error } = await apiClient.POST('/api/family/invitations/{id}/replace', {
        params: { path: { id } },
        body: {},
        headers: { 'X-CSRF-Token': csrf },
      });
      return response.status === 201 && data
        ? { ok: true, value: data }
        : { ok: false, code: error?.error.code ?? 'UNKNOWN' };
    } catch {
      return { ok: false, code: 'NETWORK' };
    }
  },
};
