import type { paths } from '@src/shared/api/schema.gen';
import type { Invitation, InvitationResult } from './invitationPorts';
type ManagedInvitations =
  paths['/api/family/invitations']['get']['responses'][200]['content']['application/json'];
export type ListInvitations = (offset: number) => Promise<InvitationResult<ManagedInvitations>>;
export type ReplaceInvitation = (id: string, csrf: string) => Promise<InvitationResult<Invitation>>;
