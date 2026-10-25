import type { ApprovalDraft } from './approvalDrafts.js';
import type { ApproveError, ClinicalRecords } from './approvalOutcome.js';
import type { ReviewRepository } from './reviewPorts.js';
import { saveClinicalRecords } from './saveClinicalRecords.js';

export type ManualRecordsRequest = ApprovalDraft & { familyId: string; profileId: string };
type ManualRecordsOutcome =
  { ok: true; value: ClinicalRecords } | ApproveError | { ok: false; code: 'ERR_CONSENT_REQUIRED' };

// SPEC-011 không kèm chứng từ: hồ sơ cùng gia đình + đã đồng thuận (BR-009) → kiểm như SPEC-010 →
// lưu với cờ manual_without_source (BR-014).
export function createManualRecords(
  repository: ReviewRepository,
  request: ManualRecordsRequest,
): Promise<ManualRecordsOutcome> {
  return repository.withFamily(request.familyId, async (store) => {
    const profile = await store.findProfile(request.profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus !== 'confirmed') return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    const target = { healthProfileId: request.profileId, sourceDocumentId: null };
    const result = await saveClinicalRecords(store, target, request);
    return result.ok ? { ok: true, value: result.value.records } : result;
  });
}
