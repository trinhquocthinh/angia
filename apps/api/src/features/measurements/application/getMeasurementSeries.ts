import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { AdherencePeriod } from '@src/features/adherence/domain/AdherencePeriod.js';
import type { Measurement, MeasurementKind } from '../domain/Measurement.js';
import { summarizeWeeks, type MeasurementWeek } from '../domain/summarizeWeeks.js';
import type { MeasurementRepository } from './ports.js';

interface MeasurementSeries {
  points: Measurement[];
  weeks: MeasurementWeek[];
  periods: AdherencePeriod[];
}
type SeriesOutcome =
  { ok: true; value: MeasurementSeries } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };

// SPEC-020: điểm đo trong [from, to] (≤ 366 ngày, kiểm ở hợp đồng) cùng cờ tuần BR-023.
// SPEC-023: kèm giai đoạn dùng thuốc giao với [from, to] để tô nền; không kèm nhận xét (BR-033).
// Đơn vị hiển thị đường huyết quy đổi ở presenter; điểm giữ nguyên giá trị gốc (BR-020).
export function getMeasurementSeries(
  repository: MeasurementRepository,
  request: { familyId: string; profileId: string; kind: MeasurementKind; from: string; to: string },
): Promise<SeriesOutcome> {
  return repository.withFamily(request.familyId, async (store) => {
    const blocked = consentGate(await store.profileConsent(request.profileId));
    if (blocked) return { ok: false, code: blocked };
    const { profileId, kind, from, to } = request;
    const points = await store.listMeasurementsBetween(profileId, kind, from, to);
    const weeks = summarizeWeeks(
      from,
      to,
      points.map((point) => point.measuredOn),
    );
    const periods = await store.listAdherencePeriodsBetween(profileId, from, to);
    return { ok: true, value: { points, weeks, periods } };
  });
}
