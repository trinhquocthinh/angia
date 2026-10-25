import { normalizeName } from '@src/features/prescriptions/domain/normalizeName.js';
import { planMedicationConflicts } from '../domain/planMedicationConflicts.js';
import type { NewMedicationCourse } from '../domain/MedicationCourse.js';
import type { MedicationRepository, SelfReportedCourseRequest, SelfReportedCourseOutcome } from './ports.js';

// SPEC-016: nguồn và dài hạn do server quyết định. Khóa giống luồng lưu đơn SPEC-015.
export function createSelfReportedCourse(
  repository: MedicationRepository,
  request: SelfReportedCourseRequest,
): Promise<SelfReportedCourseOutcome> {
  return repository.withFamily(request.familyId, async (store) => {
    const profile = await store.findProfile(request.profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus !== 'confirmed') return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    const { quantityPerDose, slots } = request;
    if (quantityPerDose == null || slots === undefined || slots.length === 0)
      return { ok: false, code: 'ERR_DOSE_INFO_MISSING' };
    await store.lockMedicationProfile(request.profileId);
    const plan = planMedicationConflicts(
      await store.findMedicationCourses(request.profileId),
      [request],
      request.startDate,
    );
    if (!plan.ok) return { ok: false, code: 'ERR_COURSE_CONFLICT_UNRESOLVED', conflicts: plan.conflicts };
    const input: NewMedicationCourse = {
      healthProfileId: request.profileId,
      prescriptionItemId: null,
      source: 'self_reported',
      name: request.name.trim(),
      nameNormalized: normalizeName(request.name),
      strength: request.strength?.trim() || null,
      quantityPerDose,
      doseUnit: request.doseUnit.trim(),
      slots: [...slots],
      startDate: request.startDate,
      endDate: null,
      status: 'active',
    };
    await store.replaceMedicationCourses(request.profileId, plan.replaceCourseIds, plan.replacementEndDate);
    const [course] = await store.insertMedicationCourses([input]);
    if (!course) throw new Error('Không tạo được đợt thuốc bổ');
    return { ok: true, value: course };
  });
}
