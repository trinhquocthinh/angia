import type {
  ConsentBasis,
  HealthProfile,
  LinkableAccount,
  LinkCandidate,
  NewProfile,
} from '../domain/HealthProfile.js';

export interface ProfileStore {
  listProfiles(): Promise<HealthProfile[]>;
  listLinkableAccounts(): Promise<LinkableAccount[]>;
  lockAccount(id: string): Promise<LinkCandidate | null>;
  insertProfile(input: NewProfile): Promise<HealthProfile>;
  linkAccount(accountId: string, profileId: string): Promise<void>;
  lockProfile(id: string): Promise<HealthProfile | null>;
  recordConsent(id: string, accountId: string, basis: ConsentBasis, at: Date): Promise<HealthProfile>;
  confirmerName(accountId: string | null): Promise<string | null>;
}
export interface ProfileRepository {
  withFamily<T>(familyId: string, work: (store: ProfileStore) => Promise<T>): Promise<T>;
}
export type Clock = () => Date;
