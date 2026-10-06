import type { components } from '@src/shared/api/schema.gen';
export type HealthProfile = components['schemas']['HealthProfile'];
export type ProfileRequest = components['schemas']['CreateHealthProfileRequest'];
export type ConsentResponse = components['schemas']['ConsentConfirmationResponse'];
export type LinkableAccount = components['schemas']['LinkableAccount'];
export type ProfileSession = components['schemas']['MeContextResponse'];
export interface ProfilesRepository {
  list(signal?: AbortSignal): Promise<HealthProfile[]>;
  linkableAccounts(signal?: AbortSignal): Promise<LinkableAccount[]>;
  create(body: ProfileRequest, csrfToken: string): Promise<HealthProfile>;
  confirm(id: string, confirmedBy: 'self' | 'guardian', csrfToken: string): Promise<ConsentResponse>;
  logout(csrfToken: string): Promise<void>;
}
