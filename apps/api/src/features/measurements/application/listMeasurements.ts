import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { MeasurementKind } from '../domain/Measurement.js';
import type { MeasurementPage, MeasurementPageRequest, MeasurementRepository } from './ports.js';

type ListOutcome =
  { ok: true; value: MeasurementPage } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };

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
    const blocked = consentGate(await store.profileConsent(request.profileId));
    if (blocked) return { ok: false, code: blocked };
    return {
      ok: true,
      value: await store.listMeasurementPage(request.profileId, request.kind, request.page),
    };
  });
}
