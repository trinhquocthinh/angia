import createClient from 'openapi-fetch';
import type { paths } from '@src/shared/api/schema.gen';
import type { InvitationRepository } from '../application/invitationPorts';
import { readInvitationResponse } from './readInvitationResponse';
const anonymousClient = createClient<paths>({ baseUrl: '/', credentials: 'omit' });
export function createInvitationRepository(client = anonymousClient): InvitationRepository {
  return {
    view: async (token, signal) =>
      readInvitationResponse(
        await client.GET('/api/consent-invitations/view', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'omit',
          cache: 'no-store',
          referrerPolicy: 'no-referrer',
          signal: signal ?? null,
        }),
      ),
    respond: async (token, body, signal) =>
      readInvitationResponse(
        await client.POST('/api/consent-invitations/respond', {
          body,
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'omit',
          cache: 'no-store',
          referrerPolicy: 'no-referrer',
          signal: signal ?? null,
        }),
      ),
  };
}
