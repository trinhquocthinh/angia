import { apiClient } from '@src/shared/api/apiClient';
import type { CurrentInvitationRepository } from '../application/currentInvitationPorts';
import { householdInvitationRepository } from './householdInvitationRepository';
export const currentInvitationRepository: CurrentInvitationRepository = {
  create: householdInvitationRepository.create,
  async current() {
    try {
      const { response, data, error } = await apiClient.GET('/api/family/invitations/current');
      return response.status === 200 && data
        ? { ok: true, value: data }
        : { ok: false, code: error?.error.code ?? 'UNKNOWN' };
    } catch {
      return { ok: false, code: 'NETWORK' };
    }
  },
};
