import type { AdherencePeriod, AdherenceStatus, NewAdherencePeriod } from '../domain/AdherencePeriod.js';

interface AdherenceStore {
  findProfile(profileId: string): Promise<{ consentStatus: string } | null>;
  /** Tuần tự hóa mọi lệnh ghi giai đoạn của một hồ sơ trong giao dịch hiện tại. */
  lockAdherenceProfile(profileId: string): Promise<void>;
  /** Giai đoạn có fromDate lớn nhất của thuốc (theo tên chuẩn hóa) trên hồ sơ. */
  findLatestPeriod(profileId: string, medicationNameNormalized: string): Promise<AdherencePeriod | null>;
  closePeriod(profileId: string, periodId: string, toDate: string): Promise<void>;
  insertPeriod(input: NewAdherencePeriod): Promise<AdherencePeriod>;
  /** Mọi giai đoạn của hồ sơ, theo tên chuẩn hóa rồi fromDate tăng dần. */
  listPeriods(profileId: string): Promise<AdherencePeriod[]>;
}
export interface AdherenceRepository {
  withFamily<T>(familyId: string, work: (store: AdherenceStore) => Promise<T>): Promise<T>;
}
export type AdherenceClock = () => Date;

export interface RecordAdherenceRequest {
  familyId: string;
  accountId: string;
  profileId: string;
  medicationName: string;
  status: AdherenceStatus;
  fromDate: string;
}
type AdherenceFailure = { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };
export type RecordAdherenceOutcome =
  { ok: true; value: AdherencePeriod } | AdherenceFailure | { ok: false; code: 'ERR_VALIDATION' };
export type ListAdherenceOutcome =
  { ok: true; value: { today: string; periods: AdherencePeriod[] } } | AdherenceFailure;
