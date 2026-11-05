import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { AsNeededDose } from '../domain/AsNeededDose.js';
import type { AsNeededDoseOutcome, AsNeededDoseRepository, ProfileTarget } from './ports.js';

const DAY_MS = 86_400_000;
// Đầu ngày theo giờ Việt Nam (UTC+7, không có giờ mùa hè).
const vietnamDayStart = (date: string) => new Date(`${date}T00:00:00+07:00`);

// SPEC-047: [from, to] theo ngày Việt Nam, giới hạn 366 ngày kiểm ở hợp đồng.
export function listAsNeededDoses(
  repository: AsNeededDoseRepository,
  target: ProfileTarget & { courseId?: string | undefined; from: string; to: string },
): Promise<AsNeededDoseOutcome<AsNeededDose[]>> {
  return repository.withFamily(target.familyId, async (store) => {
    const blocked = consentGate((await store.findProfile(target.profileId))?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    const doses = await store.listDoses(target.profileId, {
      courseId: target.courseId,
      from: vietnamDayStart(target.from),
      to: new Date(vietnamDayStart(target.to).getTime() + DAY_MS),
    });
    return { ok: true, value: doses };
  });
}
