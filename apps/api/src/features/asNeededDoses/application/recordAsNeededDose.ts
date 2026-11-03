import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { AsNeededDose } from '../domain/AsNeededDose.js';
import { canRecordAsNeededDose } from '../domain/canRecordAsNeededDose.js';
import type {
  AsNeededDoseClock,
  AsNeededDoseOutcome,
  AsNeededDoseRepository,
  RecordAsNeededDoseRequest,
} from './ports.js';

// SPEC-047: chỉ lưu thời điểm và liều người ghi nhập; không tính giờ liều tiếp, không cảnh báo (BR-054).
export function recordAsNeededDose(
  repository: AsNeededDoseRepository,
  request: RecordAsNeededDoseRequest,
  now: AsNeededDoseClock,
): Promise<AsNeededDoseOutcome<AsNeededDose, 'ERR_VALIDATION'>> {
  return repository.withFamily(request.familyId, async (store) => {
    const blocked = consentGate((await store.findProfile(request.profileId))?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    if (request.givenAt.getTime() > now().getTime()) return { ok: false, code: 'ERR_VALIDATION' };
    const course = await store.findCourse(request.profileId, request.courseId);
    if (
      !canRecordAsNeededDose(
        course,
        medicationToday(() => request.givenAt),
      )
    )
      return { ok: false, code: 'ERR_VALIDATION' };
    const dose = await store.insertDose({
      healthProfileId: request.profileId,
      courseId: request.courseId,
      givenAt: request.givenAt,
      quantity: request.quantity,
      unit: request.unit,
      recordedBy: request.accountId,
    });
    return { ok: true, value: dose };
  });
}
