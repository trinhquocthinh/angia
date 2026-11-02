import { apiClient } from '@src/shared/api/apiClient';
import type { InvitationRepository } from '../application/invitationPorts';
import { readInvitationResponse } from './readInvitationResponse';
// SPEC-040: cần phiên AN GIA; token chỉ đi qua header, không vào path/query và không để lại referrer.
export function createInvitationRepository(client = apiClient): InvitationRepository {
  return {
    view: async (token, signal) =>
      readInvitationResponse(
        await client.GET('/api/me/link-invitations/view', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          referrerPolicy: 'no-referrer',
          signal: signal ?? null,
        }),
      ),
    respond: async (token, decision, csrfToken, signal) =>
      readInvitationResponse(
        await client.POST('/api/me/link-invitations/accept', {
          body: { decision },
          headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
          cache: 'no-store',
          referrerPolicy: 'no-referrer',
          signal: signal ?? null,
        }),
      ),
  };
}
