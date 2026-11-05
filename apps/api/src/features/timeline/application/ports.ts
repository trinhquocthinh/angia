import type { TimelineCursor, TimelineEvent, TimelinePage } from '@angia/contracts';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { Prescription } from '@src/features/prescriptions/domain/Prescription.js';

export type TimelineSourceQuery = { take: number; after: TimelineCursor | null };
export type TimelinePrescriptionPair = { current: Prescription; previous: Prescription | null };
interface TimelineStore {
  profile(id: string): Promise<{
    consentStatus: ConsentStatus;
    birthYear: number | null;
    vitalsEnabled: boolean | null;
  } | null>;
  sources(id: string, query: TimelineSourceQuery, includeMeasurements: boolean): Promise<TimelineEvent[][]>;
  prescriptionPairs(id: string, prescriptionIds: string[]): Promise<TimelinePrescriptionPair[]>;
}
export interface TimelineRepository {
  withFamily<T>(familyId: string, work: (store: TimelineStore) => Promise<T>): Promise<T>;
}
export type TimelineOutcome =
  | { ok: true; value: TimelinePage }
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' | 'ERR_VALIDATION' };
