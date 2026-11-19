import { apiClient } from '@src/shared/api/apiClient';
import type {
  HouseholdMemberRole,
  HouseholdMembersRepository,
  MemberMutationResult,
} from '../application/memberPorts';

export const householdMembersRepository: HouseholdMembersRepository = {
  async list() {
    try {
      const { response, data, error } = await apiClient.GET('/api/family/members');
      if (response.status === 200 && data) return { ok: true, value: data.members };
      return { ok: false, code: error?.error.code ?? 'UNKNOWN' };
    } catch (error) {
      return { ok: false, code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' };
    }
  },
  changeRole(targetAccountId, role, csrfToken) {
    return patchMember(targetAccountId, { action: 'change_role', role }, csrfToken);
  },
  remove(targetAccountId, csrfToken) {
    return patchMember(targetAccountId, { action: 'remove' }, csrfToken);
  },
};

async function patchMember(
  targetAccountId: string,
  body: { action: 'change_role'; role: HouseholdMemberRole } | { action: 'remove' },
  csrfToken: string,
): Promise<MemberMutationResult> {
  try {
    const { response, error } = await apiClient.PATCH('/api/family/members/{targetAccountId}', {
      params: { path: { targetAccountId } },
      body,
      headers: { 'X-CSRF-Token': csrfToken },
    });
    if (response.status === 204) return { ok: true, value: undefined };
    return { ok: false, code: error?.error.code ?? 'UNKNOWN' };
  } catch {
    return { ok: false, code: 'NETWORK' };
  }
}
