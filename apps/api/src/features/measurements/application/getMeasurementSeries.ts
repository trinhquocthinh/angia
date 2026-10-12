import type { Measurement, MeasurementKind } from '../domain/Measurement.js';
import { summarizeWeeks, type MeasurementWeek } from '../domain/summarizeWeeks.js';
import type { MeasurementRepository } from './ports.js';

interface MeasurementSeries {
  points: Measurement[];
  weeks: MeasurementWeek[];
}
type SeriesOutcome = { ok: true; value: MeasurementSeries } | { ok: false; code: 'ERR_NOT_FOUND' };

// SPEC-020: điểm đo trong [from, to] (≤ 366 ngày, kiểm ở hợp đồng) cùng cờ tuần BR-023.
// Đơn vị hiển thị đường huyết quy đổi ở presenter; điểm giữ nguyên giá trị gốc (BR-020).
export function getMeasurementSeries(
  repository: MeasurementRepository,
  request: { familyId: string; profileId: string; kind: MeasurementKind; from: string; to: string },
): Promise<SeriesOutcome> {
  return repository.withFamily(request.familyId, async (store) => {
    if (!(await store.profileExists(request.profileId))) return { ok: false, code: 'ERR_NOT_FOUND' };
    const { profileId, kind, from, to } = request;
    const points = await store.listMeasurementsBetween(profileId, kind, from, to);
    const weeks = summarizeWeeks(
      from,
      to,
      points.map((point) => point.measuredOn),
    );
    return { ok: true, value: { points, weeks } };
  });
}
