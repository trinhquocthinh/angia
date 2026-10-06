import type { InvitationCreated } from './invitationPorts';
import type { components } from '@src/shared/api/schema.gen';
export type HealthProfile = components['schemas']['HealthProfile'];
export type ProfileRequest = components['schemas']['CreateHealthProfileRequest'];
export type LinkableAccount = components['schemas']['LinkableAccount'];
export type ProfileSession = components['schemas']['MeContextResponse'];
export interface ProfilesRepository {
  list(signal?: AbortSignal): Promise<HealthProfile[]>;
  linkableAccounts(signal?: AbortSignal): Promise<LinkableAccount[]>;
  create(body: ProfileRequest, csrfToken: string): Promise<HealthProfile>;
  createInvitation(id: string, csrfToken: string): Promise<InvitationCreated>;
  revokeInvitation(id: string, csrfToken: string): Promise<void>;
  logout(csrfToken: string): Promise<void>;
}
