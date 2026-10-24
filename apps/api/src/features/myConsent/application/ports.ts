import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';

export interface MyConsentProfile {
  id: string;
  displayName: string;
  consentStatus: ConsentStatus;
}

export interface MyConsentStore {
  /** Đọc hồ sơ dưới RLS (không khóa); null khi không thấy. */
  readProfile(id: string): Promise<(MyConsentProfile & { withdrawnAt: Date | null }) | null>;
  /** SELECT … FOR UPDATE dưới RLS; null khi không thấy. */
  lockProfile(id: string): Promise<MyConsentProfile | null>;
  markWithdrawn(id: string, accountId: string, at: Date): Promise<void>;
}

export interface MyConsentRepository {
  withFamily<T>(familyId: string, work: (store: MyConsentStore) => Promise<T>): Promise<T>;
}

export type WithdrawMyConsentOutcome =
  | { ok: true; value: { consentStatus: 'withdrawn'; withdrawnAt: Date } }
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_NOT_CONFIRMED' };
