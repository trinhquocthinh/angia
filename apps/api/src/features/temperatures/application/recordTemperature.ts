import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import { checkTemperature } from '../domain/checkTemperature.js';
import type { TemperatureReading } from '../domain/TemperatureReading.js';
import type {
  RecordTemperatureRequest,
  TemperatureClock,
  TemperatureOutcome,
  TemperatureRepository,
} from './ports.js';

type RecordFailure =
  | { ok: false; code: 'ERR_VALIDATION' }
  | { ok: false; code: 'ERR_OUT_OF_RANGE_UNCONFIRMED'; fields: ['celsius'] };

// SPEC-048: thứ tự hồ sơ/đồng thuận → thời điểm đo → khoảng khả dĩ; không phân loại, không nhận định (BR-055).
export function recordTemperature(
  repository: TemperatureRepository,
  request: RecordTemperatureRequest,
  now: TemperatureClock,
): Promise<TemperatureOutcome<TemperatureReading> | RecordFailure> {
  return repository.withFamily(request.familyId, async (store) => {
    const blocked = consentGate((await store.findProfile(request.profileId))?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    if (request.measuredAt.getTime() > now().getTime()) return { ok: false, code: 'ERR_VALIDATION' };
    const checked = checkTemperature(request.celsius, request.confirmOutOfRange);
    if (!checked.ok) return checked;
    const reading = await store.insertReading({
      healthProfileId: request.profileId,
      celsius: checked.celsius,
      measuredAt: request.measuredAt,
      recordedBy: request.accountId,
    });
    return { ok: true, value: reading };
  });
}
