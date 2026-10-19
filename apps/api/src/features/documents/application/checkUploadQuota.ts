import { checkFamilyQuota } from '../../familyQuota/application/checkFamilyQuota.js';
import { PREFLIGHT_REQUEST, type QuotaResult } from '../../familyQuota/domain/FamilyQuota.js';
import type { DocumentDependencies } from './ports.js';

// SPEC-030: kiểm sơ bộ (đọc, không khóa) trước khi xin slot/đọc body — gia đình đã chạm trần nào thì từ chối ngay.
// uploadDocument vẫn khóa và kiểm lại theo lô thực tế trong transaction ghi.
export function checkUploadQuota(deps: DocumentDependencies, familyId: string): Promise<QuotaResult> {
  return deps.repository.withFamily(familyId, (store) =>
    checkFamilyQuota(store.readQuotaUsage, deps.quota, PREFLIGHT_REQUEST, false),
  );
}
