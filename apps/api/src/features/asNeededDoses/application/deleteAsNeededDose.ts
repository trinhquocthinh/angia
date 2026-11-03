import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { AsNeededDoseOutcome, AsNeededDoseRepository, ProfileTarget } from './ports.js';

// SPEC-047: xóa bản ghi nhầm; liều không thuộc hồ sơ trả ERR_NOT_FOUND như hồ sơ không tồn tại.
export function deleteAsNeededDose(
  repository: AsNeededDoseRepository,
  target: ProfileTarget & { doseId: string },
): Promise<AsNeededDoseOutcome<null>> {
  return repository.withFamily(target.familyId, async (store) => {
    const blocked = consentGate((await store.findProfile(target.profileId))?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    if (!(await store.deleteDose(target.profileId, target.doseId)))
      return { ok: false, code: 'ERR_NOT_FOUND' };
    return { ok: true, value: null };
  });
}
