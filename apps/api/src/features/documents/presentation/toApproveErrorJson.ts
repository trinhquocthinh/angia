import { errorJson } from '@src/shared/http/errorResponse.js';
import type { ApproveError } from '../application/approvalOutcome.js';

type SaveError = ApproveError | { ok: false; code: 'ERR_CONSENT_REQUIRED' };

// Lỗi duyệt/nhập tay kèm chi tiết để UI đánh dấu đúng ô (SPEC-019), đúng dòng thuốc (BR-025)
// hoặc nêu bản đã lưu bị trùng (SPEC-012).
export function toApproveErrorJson(error: SaveError) {
  if (error.code === 'ERR_OUT_OF_RANGE_UNCONFIRMED') return errorJson(error.code, { fields: error.fields });
  if (error.code === 'ERR_DOSE_INFO_MISSING')
    return errorJson(error.code, { invalidItemIndexes: error.invalidItemIndexes });
  if (error.code === 'ERR_DUPLICATE_UNCONFIRMED') {
    const { savedAt, ...duplicate } = error.duplicate;
    return errorJson(error.code, { ...duplicate, savedAt: savedAt.toISOString() });
  }
  return errorJson(error.code);
}
