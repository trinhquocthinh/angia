import {
  getMeasurementSeries,
  type SeriesOutcome,
} from '@src/features/measurements/application/getMeasurementSeries.js';
import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import { selfShowsVitals } from './getSelfProfile.js';
import type { SelfProfileScope } from './ports.js';

type SeriesRequest = Omit<Parameters<typeof getMeasurementSeries>[1], 'familyId'>;

// SPEC-042, BR-049: hồ sơ chưa được hiện số đo trả ERR_NOT_FOUND, không lộ số đo cũ.
export async function getSelfMeasurementSeries(
  scope: SelfProfileScope,
  familyId: string,
  request: SeriesRequest,
  now: () => Date,
): Promise<SeriesOutcome> {
  const row = await scope.withFamily(familyId, (store) => store.profile());
  const blocked = consentGate(row?.consentStatus ?? null);
  if (blocked) return { ok: false, code: blocked };
  if (!selfShowsVitals(row!, now)) return { ok: false, code: 'ERR_NOT_FOUND' };
  return getMeasurementSeries(scope.measurements, { ...request, familyId });
}
