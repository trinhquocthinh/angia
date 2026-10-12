import type { MeasurementKind } from '../domain/Measurement.js';
import type { MeasurementPage, MeasurementPageRequest, MeasurementRepository } from './ports.js';

type ListOutcome = { ok: true; value: MeasurementPage } | { ok: false; code: 'ERR_NOT_FOUND' };

// Chỉ bảng measurements (dữ liệu đã duyệt, BR-013); hồ sơ nhóm khác không phân biệt với hồ sơ không tồn tại.
// F09a: phân trang cursor để danh sách không trả toàn bộ lịch sử.
export function listMeasurements(
  repository: MeasurementRepository,
  request: {
    familyId: string;
    profileId: string;
    kind?: MeasurementKind | undefined;
    page: MeasurementPageRequest;
  },
): Promise<ListOutcome> {
  return repository.withFamily(request.familyId, async (store) => {
    if (!(await store.profileExists(request.profileId))) return { ok: false, code: 'ERR_NOT_FOUND' };
    return {
      ok: true,
      value: await store.listMeasurementPage(request.profileId, request.kind, request.page),
    };
  });
}
