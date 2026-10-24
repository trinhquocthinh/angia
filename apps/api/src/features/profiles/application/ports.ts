import type { PurgeProfileObjectsJob } from '@angia/contracts';
import type { HealthProfile, LinkableAccount, LinkCandidate, NewProfile } from '../domain/HealthProfile.js';

export interface ProfileStore {
  listProfiles(): Promise<HealthProfile[]>;
  listLinkableAccounts(): Promise<LinkableAccount[]>;
  lockAccount(id: string): Promise<LinkCandidate | null>;
  insertProfile(input: NewProfile): Promise<HealthProfile>;
  linkAccount(accountId: string, profileId: string): Promise<void>;
  lockProfile(id: string): Promise<{ id: string; displayName: string } | null>;
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
