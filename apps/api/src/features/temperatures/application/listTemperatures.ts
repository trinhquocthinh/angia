import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { TemperatureReading } from '../domain/TemperatureReading.js';
import type { ProfileTarget, TemperatureOutcome, TemperatureRepository } from './ports.js';

const DAY_MS = 86_400_000;
// Đầu ngày theo giờ Việt Nam (UTC+7, không có giờ mùa hè).
const vietnamDayStart = (date: string) => new Date(`${date}T00:00:00+07:00`);

// SPEC-048: [from, to] theo ngày Việt Nam, giới hạn 366 ngày kiểm ở hợp đồng; không bị ẩn theo BR-049.
export function listTemperatures(
  repository: TemperatureRepository,
  target: ProfileTarget & { from: string; to: string },
): Promise<TemperatureOutcome<TemperatureReading[]>> {
  return repository.withFamily(target.familyId, async (store) => {
    const blocked = consentGate((await store.findProfile(target.profileId))?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    const readings = await store.listReadings(target.profileId, {
      from: vietnamDayStart(target.from),
      to: new Date(vietnamDayStart(target.to).getTime() + DAY_MS),
    });
    return { ok: true, value: readings };
  });
}
