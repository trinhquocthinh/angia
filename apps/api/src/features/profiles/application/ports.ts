import type { HealthProfile, LinkableAccount, LinkCandidate, NewProfile } from '../domain/HealthProfile.js';

export interface ProfileStore {
  listProfiles(): Promise<HealthProfile[]>;
  listLinkableAccounts(): Promise<LinkableAccount[]>;
  lockAccount(id: string): Promise<LinkCandidate | null>;
  insertProfile(input: NewProfile): Promise<HealthProfile>;
  linkAccount(accountId: string, profileId: string): Promise<void>;
}
export interface ProfileRepository {
  withFamily<T>(familyId: string, work: (store: ProfileStore) => Promise<T>): Promise<T>;
}
export type Clock = () => Date;
