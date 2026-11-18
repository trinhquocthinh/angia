import type { paths } from '@src/shared/api/schema.gen';

type Endpoint = paths['/api/family/invitations']['post'];
export type InvitationRole = 'main' | 'member';
export type Invitation = Endpoint['responses'][201]['content']['application/json'];
export type IssuedInvitation = Invitation & { role: InvitationRole };
export type InvitationResult<T = undefined> = { ok: true; value: T } | { ok: false; code: string };
export type CreateInvitation = (
  body: Endpoint['requestBody']['content']['application/json'],
  csrfToken: string,
) => Promise<InvitationResult<Invitation>>;
export type RevokeInvitation = (id: string, csrfToken: string) => Promise<InvitationResult>;
export type InvitationRepository = { create: CreateInvitation; revoke: RevokeInvitation };
export type InvitationSharing = {
  copy: (text: string) => Promise<boolean>;
  share?: (value: Pick<Invitation, 'code' | 'link'>) => Promise<'shared' | 'cancelled' | 'failed'>;
};
