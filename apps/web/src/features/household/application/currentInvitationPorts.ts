import type { paths } from '@src/shared/api/schema.gen';
import type { CreateInvitation, InvitationResult } from './invitationPorts';
export type CurrentInvitations =
  paths['/api/family/invitations/current']['get']['responses'][200]['content']['application/json'];
export type CurrentInvitationRepository = {
  current: () => Promise<InvitationResult<CurrentInvitations>>;
  create: CreateInvitation;
};
