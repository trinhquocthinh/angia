import { apiClient } from '@src/shared/api/apiClient';
import type { AcceptHouseholdInvitation } from '../application/acceptInvitationPorts';

export const acceptHouseholdInvitation: AcceptHouseholdInvitation = async (body, csrfToken) => {
  try {
    const { response, error } = await apiClient.POST('/api/invitations/accept', {
      body,
      headers: { 'X-CSRF-Token': csrfToken },
    });
    return response.status === 204 ? { ok: true } : { ok: false, code: error?.error.code ?? 'UNKNOWN' };
  } catch (error) {
    return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
  }
};
