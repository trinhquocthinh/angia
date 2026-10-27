import type { PrivacyOutcome, PrivacyDocument } from '../domain/PrivacyDocument.js';
import { isPrivacyImageKey } from '../domain/isPrivacyImageKey.js';
import { budgetMonth } from '@angia/contracts';
import { evaluateAiBudget } from '../../familyQuota/domain/evaluateAiBudget.js';
import { checkFamilyQuota } from '../../familyQuota/application/checkFamilyQuota.js';
import { ONE_JOB, type QuotaFailure } from '../../familyQuota/domain/FamilyQuota.js';
import type { PrivacyDependencies } from './ports.js';
export interface ApprovalInput {
  familyId: string;
  documentId: string;
  accountId: string;
  draftId: string;
  sha256: string;
  confirmed: true;
}
export async function approvePrivacy(
  deps: PrivacyDependencies,
  input: ApprovalInput,
): Promise<PrivacyOutcome<PrivacyDocument> | QuotaFailure> {
  const candidate = await deps.repository.withFamily(input.familyId, (store) =>
    store.findDocument(input.documentId),
  );
  if (!candidate) return { ok: false, code: 'ERR_NOT_FOUND' };
  if (
    !input.confirmed ||
    candidate.privacyDraftId !== input.draftId ||
    candidate.ocrImageSha256 !== input.sha256
  )
    return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
  if (candidate.privacyApprovedAt) return { ok: true, value: candidate };
  if (
    candidate.status !== 'awaiting_privacy' ||
    candidate.privacyDraftStatus !== 'ready' ||
    !isPrivacyImageKey(candidate)
  )
    return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
  const object = await deps.reader.get(candidate.ocrImageKey!);
  if (!object || (await deps.hashPng(object.body)) !== input.sha256)
    return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
  return deps.repository.withFamily(input.familyId, async (store) => {
    const doc = await store.findDocument(input.documentId, true);
    if (!doc) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (
      doc.privacyDraftId !== input.draftId ||
      doc.ocrImageSha256 !== input.sha256 ||
      doc.ocrImageKey !== candidate.ocrImageKey
    )
      return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
    if (doc.privacyApprovedAt) return { ok: true, value: doc };
    if (doc.status !== 'awaiting_privacy' || doc.privacyDraftStatus !== 'ready')
      return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
    if (!(await store.consentConfirmed(doc.healthProfileId)))
      return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    const approval = { privacyApprovedBy: input.accountId, privacyApprovedAt: deps.now() };
    // SPEC-031: gia đình (hoặc hệ thống) hết trần AI tháng → ghi nhận duyệt nhưng xếp chờ ngân sách, không tạo job;
    // requeue đầu tháng/khi nâng trần đọc tiếp bản ảnh đã duyệt này.
    const budget = await store.readAiBudget(budgetMonth(deps.ai.now()), deps.ai);
    if (evaluateAiBudget(budget).exhausted)
      return {
        ok: true,
        value: await store.updateDocument(doc.id, { status: 'awaiting_budget', ...approval }),
      };
    // SPEC-030: xác nhận thêm một job OCR; chứng từ đã duyệt (idempotent) đã trả về ở trên, không bị chặn.
    const quota = await checkFamilyQuota(store.readQuotaUsage, deps.quota, ONE_JOB, true);
    if (!quota.ok) return quota;
    const approved = await store.updateDocument(doc.id, { status: 'extracting', ...approval });
    await store.enqueueExtraction(doc.id);
    return { ok: true, value: approved };
  });
}
