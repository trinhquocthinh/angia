import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { DoseSlotTime, DoseSlotTimes } from '../domain/DoseSlotConfig.js';

interface DoseSlotStore {
  findProfile(profileId: string): Promise<{ consentStatus: ConsentStatus } | null>;
  /** Thay toàn bộ khung giờ của hồ sơ trong giao dịch hiện tại (xóa buổi không còn trong danh sách). */
  replaceSlots(profileId: string, slots: DoseSlotTime[]): Promise<void>;
  /** Khung giờ đã lưu theo thứ tự buổi Sáng → Tối. */
  listSlots(profileId: string): Promise<DoseSlotTime[]>;
}
export interface DoseSlotRepository {
  withFamily<T>(familyId: string, work: (store: DoseSlotStore) => Promise<T>): Promise<T>;
}

export interface SetDoseSlotsRequest {
  familyId: string;
  profileId: string;
  slots: DoseSlotTimes;
}
type DoseSlotFailure = { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };
export type ReadDoseSlotOutcome =
  { ok: true; value: DoseSlotTime[] } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };
export type DoseSlotOutcome =
  { ok: true; value: DoseSlotTime[] } | DoseSlotFailure | { ok: false; code: 'ERR_VALIDATION' };
