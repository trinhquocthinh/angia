import { checkFamilyQuota } from '../../familyQuota/application/checkFamilyQuota.js';
import { PREFLIGHT_REQUEST, type QuotaResult } from '../../familyQuota/domain/FamilyQuota.js';
import type { DocumentDependencies } from './ports.js';

// SPEC-030: kiểm sơ bộ (đọc, không khóa) trước khi xin slot/đọc body — kiểm dung lượng/ngày; chưa biết cờ AI trước khi đọc body.
// uploadDocument vẫn khóa và kiểm lại theo lô thực tế trong transaction ghi.
export function checkUploadQuota(deps: DocumentDependencies, familyId: string): Promise<QuotaResult> {
  return deps.repository.withFamily(familyId, (store) =>
    checkFamilyQuota(store.readQuotaUsage, deps.quota, { ...PREFLIGHT_REQUEST, jobs: 0 }, false),
  );
}
