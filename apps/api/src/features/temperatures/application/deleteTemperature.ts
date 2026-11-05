import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { ProfileTarget, TemperatureOutcome, TemperatureRepository } from './ports.js';

// SPEC-048: xóa bản ghi nhầm; bản ghi không thuộc hồ sơ trả ERR_NOT_FOUND như hồ sơ không tồn tại.
export function deleteTemperature(
  repository: TemperatureRepository,
  target: ProfileTarget & { readingId: string },
): Promise<TemperatureOutcome<null>> {
  return repository.withFamily(target.familyId, async (store) => {
    const blocked = consentGate((await store.findProfile(target.profileId))?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    if (!(await store.deleteReading(target.profileId, target.readingId)))
      return { ok: false, code: 'ERR_NOT_FOUND' };
    return { ok: true, value: null };
  });
}
