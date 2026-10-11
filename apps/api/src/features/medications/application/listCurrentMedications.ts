import { getActiveMedications } from '../domain/getActiveMedications.js';
import type {
  CurrentMedicationCourse,
  MedicationClock,
  MedicationManagementRepository,
} from './managementPorts.js';
import { medicationToday } from './medicationToday.js';
type Outcome =
  | { ok: true; value: { today: string; courses: CurrentMedicationCourse[] } }
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };
// E4-S4-T1: danh mục thuốc đang dùng tại hôm nay (Việt Nam) theo khoảng hiệu lực (SPEC-018, BR-030).
export function listCurrentMedications(
  repository: MedicationManagementRepository,
  familyId: string,
  profileId: string,
  now: MedicationClock,
): Promise<Outcome> {
  return repository.withFamily(familyId, async (store) => {
    const profile = await store.findProfile(profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus !== 'confirmed') return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    const today = medicationToday(now);
    const courses = getActiveMedications(await store.findMedicationHistory(profileId), today);
    return { ok: true, value: { today, courses } };
  });
}
