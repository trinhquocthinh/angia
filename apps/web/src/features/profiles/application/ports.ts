import type { InvitationCreated } from './invitationPorts';
import type { components } from '@src/shared/api/schema.gen';
export type ProfileListItem = components['schemas']['ProfileListItem'];
export type ConsentConfirmation = components['schemas']['ConsentConfirmation'];
export type HealthProfile = components['schemas']['HealthProfile'];
export type ProfileRequest = components['schemas']['CreateHealthProfileRequest'];
export type LinkableAccount = components['schemas']['LinkableAccount'];
export type ProfileSession = components['schemas']['MeContextResponse'];
export interface ProfilesRepository {
  list(signal?: AbortSignal): Promise<ProfileListItem[]>;
  linkableAccounts(signal?: AbortSignal): Promise<LinkableAccount[]>;
  create(body: ProfileRequest, csrfToken: string): Promise<HealthProfile>;
  confirmConsent(id: string, body: ConsentConfirmation, csrfToken: string): Promise<HealthProfile>;
  createInvitation(id: string, csrfToken: string): Promise<InvitationCreated>;
  revokeInvitation(id: string, csrfToken: string): Promise<void>;
  remove(id: string, confirmName: string, csrfToken: string): Promise<void>;
  logout(csrfToken: string): Promise<void>;
}
