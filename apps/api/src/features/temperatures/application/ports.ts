import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { NewTemperatureReading, TemperatureReading } from '../domain/TemperatureReading.js';

interface ReadingRange {
  /** Khoảng thời điểm [from, to) đã đổi từ ngày Việt Nam. */
  from: Date;
  to: Date;
}
interface TemperatureStore {
  findProfile(profileId: string): Promise<{ consentStatus: ConsentStatus } | null>;
  insertReading(input: NewTemperatureReading): Promise<TemperatureReading>;
  /** false khi bản ghi không thuộc hồ sơ. */
  deleteReading(profileId: string, readingId: string): Promise<boolean>;
  /** Bản ghi trong khoảng, cũ nhất trước. */
  listReadings(profileId: string, range: ReadingRange): Promise<TemperatureReading[]>;
}
export interface TemperatureRepository {
  withFamily<T>(familyId: string, work: (store: TemperatureStore) => Promise<T>): Promise<T>;
}
export type TemperatureClock = () => Date;

export interface ProfileTarget {
  familyId: string;
  profileId: string;
}
export interface RecordTemperatureRequest extends ProfileTarget {
  accountId: string;
  celsius: number;
  measuredAt: Date;
  confirmOutOfRange: boolean;
}
type ProfileFailure = { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };
export type TemperatureOutcome<T> = { ok: true; value: T } | ProfileFailure;
