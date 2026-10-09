import type { SourceDocument } from '../domain/SourceDocument.js';
import type { ApprovalDraft } from './approvalDrafts.js';
import type { ApproveOutcome } from './approvalOutcome.js';
import { approveDeviceReading } from './approveDeviceReading.js';
import { approveLabResult } from './approveLabResult.js';
import { approvePrescription } from './approvePrescription.js';
import type { ReviewStore, ReviewRepository } from './reviewPorts.js';

export type { ApproveOutcome } from './approvalOutcome.js';
export type ApproveRequest = ApprovalDraft & { familyId: string; documentId: string };

// SPEC-010: khóa chứng từ → FSM (chỉ từ pending_review) → đúng loại → kiểm theo loại → ghi + approved.
// Kiểm trùng (SPEC-012) thuộc E3-S5-T1, đợt thuốc (SPEC-014/015) thuộc E4. Ảnh gốc S3 không bị đụng tới.
export async function approveDocument(
  repository: ReviewRepository,
  request: ApproveRequest,
): Promise<ApproveOutcome> {
  return repository.withFamily(request.familyId, (store) => approveInStore(store, request));
}

async function approveInStore(store: ReviewStore, request: ApproveRequest): Promise<ApproveOutcome> {
  const document = await store.findDocument(request.documentId, { lock: true });
  if (!document) return { ok: false, code: 'ERR_NOT_FOUND' };
  if (document.status !== 'pending_review') return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
  if (document.type !== request.type) return { ok: false, code: 'ERR_VALIDATION' };
  return approveByType(store, document, request);
}

function approveByType(store: ReviewStore, document: SourceDocument, request: ApprovalDraft) {
  switch (request.type) {
    case 'device_reading':
      return approveDeviceReading(store, document, request.data, request.confirmOutOfRange ?? false);
    case 'prescription':
      return approvePrescription(store, document, request.data);
    case 'lab_result':
      return approveLabResult(store, document, request.data);
  }
}
