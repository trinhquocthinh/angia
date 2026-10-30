import type { RevisitList } from '@angia/contracts';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';

export interface RevisitStore {
  findProfile(profileId: string): Promise<{ consentStatus: ConsentStatus } | null>;
  lockProfile(profileId: string): Promise<void>;
  listRevisits(profileId: string, from: string): Promise<RevisitList>;
  findPrescription(
    profileId: string,
    id: string,
  ): Promise<{ issuedDate: string; revisitDate: string | null } | null>;
  updateDate(id: string, date: string | null): Promise<void>;
  cleanReminders(profileId: string, oldDate: string): Promise<void>;
  ensureReminder(profileId: string, date: string, today: string): Promise<void>;
}
export interface RevisitRepository {
  withFamily<T>(familyId: string, work: (store: RevisitStore) => Promise<T>): Promise<T>;
}
export interface SetRevisitDateRequest {
  familyId: string;
  profileId: string;
  prescriptionId: string;
  revisitDate: string | null;
}
export type RevisitOutcome<T> =
  { ok: true; value: T } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' | 'ERR_VALIDATION' };
