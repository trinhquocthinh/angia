import type { Measurement, MeasurementKind } from '../domain/Measurement.js';
import type { MeasurementRepository } from './ports.js';

type ListOutcome = { ok: true; value: Measurement[] } | { ok: false; code: 'ERR_NOT_FOUND' };

// Chỉ bảng measurements (dữ liệu đã duyệt, BR-013); hồ sơ nhóm khác không phân biệt với hồ sơ không tồn tại.
export function listMeasurements(
  repository: MeasurementRepository,
  request: { familyId: string; profileId: string; kind?: MeasurementKind | undefined },
): Promise<ListOutcome> {
  return repository.withFamily(request.familyId, async (store) => {
    if (!(await store.profileExists(request.profileId))) return { ok: false, code: 'ERR_NOT_FOUND' };
    return { ok: true, value: await store.listMeasurements(request.profileId, request.kind) };
  });
}
