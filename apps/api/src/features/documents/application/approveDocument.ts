import type { DocumentStatus } from '../domain/SourceDocument.js';
import type { ApprovalDraft } from './approvalDrafts.js';
import type { ApproveOutcome } from './approvalOutcome.js';
import type { ReviewStore, ReviewRepository } from './reviewPorts.js';
import { saveClinicalRecords } from './saveClinicalRecords.js';

export type { ApproveOutcome } from './approvalOutcome.js';
export type ApproveRequest = ApprovalDraft & { familyId: string; documentId: string };

// SPEC-011: chứng từ chờ nhập tay (kể cả hết ngân sách OCR) được nhập theo ảnh và duyệt thẳng.
const MANUAL: readonly DocumentStatus[] = ['manual_entry', 'awaiting_budget'];

// SPEC-010/011: khóa chứng từ → FSM → đúng loại (nhập tay thì người nhập chọn loại) → kiểm theo loại → kiểm trùng
// (SPEC-012) → ghi + approved. Đợt thuốc (SPEC-014/015) thuộc E4. Ảnh gốc S3 không bị đụng tới.
export async function approveDocument(
  repository: ReviewRepository,
  request: ApproveRequest,
): Promise<ApproveOutcome> {
  return repository.withFamily(request.familyId, (store) => approveInStore(store, request));
}

async function approveInStore(store: ReviewStore, request: ApproveRequest): Promise<ApproveOutcome> {
  const document = await store.findDocument(request.documentId, { lock: true });
  if (!document) return { ok: false, code: 'ERR_NOT_FOUND' };
  const manual = MANUAL.includes(document.status);
  if (!manual && document.status !== 'pending_review')
    return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
  if (!manual && document.type !== request.type) return { ok: false, code: 'ERR_VALIDATION' };
  const target = { healthProfileId: document.healthProfileId, sourceDocumentId: document.id };
  const result = await saveClinicalRecords(store, target, request);
  if (!result.ok) return result;
  const approved = await store.markApproved(
    document.id,
    { documentDate: result.value.recordDate, type: request.type },
    [document.status],
  );
  return { ok: true, value: { document: approved, ...result.value.records } };
}
