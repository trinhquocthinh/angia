import type { ConsentReceipt } from '../domain/ConsentReceipt.js';
import type { PurgeProfileObjectsJob } from '@angia/contracts';
import type { HealthProfile, LinkableAccount, LinkCandidate, NewProfile } from '../domain/HealthProfile.js';

export interface ProfileStore {
  listProfiles(): Promise<HealthProfile[]>;
  listConsentAccounts(): Promise<{ id: string; displayName: string; healthProfileId: string | null }[]>;
  listLinkableAccounts(): Promise<LinkableAccount[]>;
  lockAccount(id: string): Promise<LinkCandidate | null>;
  insertProfile(input: NewProfile, receipt: ConsentReceipt | null): Promise<HealthProfile>;
  linkAccount(accountId: string, profileId: string): Promise<void>;
  lockProfile(id: string): Promise<HealthProfile | null>;
  findLinkedAccount(profileId: string): Promise<LinkableAccount | null>;
  saveConsentReceipt(profileId: string, receipt: ConsentReceipt): Promise<HealthProfile>;
  revokePendingInvitations(profileId: string, at: Date): Promise<void>;
  deleteProfile(id: string): Promise<void>;
  enqueuePurge(job: PurgeProfileObjectsJob): Promise<void>;
}
export interface ProfileRepository {
  withFamily<T>(familyId: string, work: (store: ProfileStore) => Promise<T>): Promise<T>;
}
export type Clock = () => Date;

// Xóa object S3 theo tiền tố, trả số object đã xóa (BR-010).
export interface ProfileObjectStorage {
  deletePrefix(prefix: string): Promise<number>;
}
export interface ProfileDependencies {
  repository: ProfileRepository;
  storage: ProfileObjectStorage;
}
export interface ProfileDeletionDeps extends ProfileDependencies {
  logger: { warn(obj: object, msg: string): void };
}
