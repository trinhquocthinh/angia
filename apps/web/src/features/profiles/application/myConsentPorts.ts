import type { components } from '@src/shared/api/schema.gen';
export type MyConsent = components['schemas']['MyConsent'];
export type MyConsentProfile = NonNullable<MyConsent['profile']>;
export type MyConsentWithdrawn = components['schemas']['MyConsentWithdrawn'];
export interface MyConsentRepository {
  get(signal?: AbortSignal): Promise<MyConsent>;
  withdraw(csrfToken: string): Promise<MyConsentWithdrawn>;
}
