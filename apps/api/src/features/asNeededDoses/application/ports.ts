import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { AsNeededCourse, AsNeededDose, DoseInterval, NewAsNeededDose } from '../domain/AsNeededDose.js';

export interface DoseRange {
  courseId?: string | undefined;
  /** Khoảng thời điểm [from, to) đã đổi từ ngày Việt Nam. */
  from: Date;
  to: Date;
}
interface AsNeededDoseStore {
  findProfile(profileId: string): Promise<{ consentStatus: ConsentStatus } | null>;
  /** Đợt của đúng hồ sơ, khóa chia sẻ để không bị dừng giữa chừng. */
  findCourse(profileId: string, courseId: string): Promise<AsNeededCourse | null>;
  insertDose(input: NewAsNeededDose): Promise<AsNeededDose>;
  /** false khi liều không thuộc hồ sơ. */
  deleteDose(profileId: string, doseId: string): Promise<boolean>;
  /** Liều trong khoảng, cũ nhất trước. */
  listDoses(profileId: string, range: DoseRange): Promise<AsNeededDose[]>;
  setUserInterval(profileId: string, courseId: string, text: string | null): Promise<void>;
}
export interface AsNeededDoseRepository {
  withFamily<T>(familyId: string, work: (store: AsNeededDoseStore) => Promise<T>): Promise<T>;
}
export type AsNeededDoseClock = () => Date;

export interface ProfileTarget {
  familyId: string;
  profileId: string;
}
export interface RecordAsNeededDoseRequest extends ProfileTarget {
  accountId: string;
  courseId: string;
  givenAt: Date;
  quantity: number | null;
  unit: string | null;
}
type ProfileFailure = { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };
export type AsNeededDoseOutcome<T, Extra extends string = never> =
  { ok: true; value: T } | ProfileFailure | { ok: false; code: Extra };
export type CourseIntervalResult = { courseId: string; interval: DoseInterval | null };
