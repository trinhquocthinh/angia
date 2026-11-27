import { apiClient } from '@src/shared/api/apiClient';
import type { InspectHouseholdInvitation } from '../application/inspectInvitationPorts';

export const inspectHouseholdInvitation: InspectHouseholdInvitation = async (body) => {
  try {
    const { response, data, error } = await apiClient.POST('/api/invitations/inspect', { body });
    return response.status === 200 && data
      ? { ok: true, data }
      : { ok: false, code: error?.error.code ?? 'UNKNOWN' };
  } catch {
    return { ok: false, code: 'NETWORK' };
  }
};
