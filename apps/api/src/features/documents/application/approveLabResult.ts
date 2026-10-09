import type { SourceDocument } from '../domain/SourceDocument.js';
import type { LabResultDraft } from './approvalDrafts.js';
import { approved, DATE_REQUIRED, type ApproveOutcome } from './approvalOutcome.js';
import type { ReviewStore } from './reviewPorts.js';

// SPEC-010 + BR-022: ngày trả kết quả bắt buộc; mỗi chỉ số một dòng, giữ nguyên văn phiếu.
export async function approveLabResult(
  store: ReviewStore,
  document: SourceDocument,
  data: LabResultDraft,
): Promise<ApproveOutcome> {
  const { resultDate, facility } = data;
  if (!resultDate) return DATE_REQUIRED;
  const labResults = await store.insertLabResults(
    data.items.map((item) => ({
      ...item,
      healthProfileId: document.healthProfileId,
      sourceDocumentId: document.id,
      resultDate,
      facility,
      manualWithoutSource: false,
    })),
  );
  return approved(await store.markApproved(document.id, resultDate), { labResults });
}
