import { findIncompleteDoseItems } from '@src/features/prescriptions/domain/findIncompleteDoseItems.js';
import type { SourceDocument } from '../domain/SourceDocument.js';
import type { PrescriptionDraft } from './approvalDrafts.js';
import { approved, DATE_REQUIRED, type ApproveOutcome } from './approvalOutcome.js';
import type { ReviewStore } from './reviewPorts.js';

// SPEC-010 + BR-025: ngày kê bắt buộc → mọi dòng đủ liều/buổi/số ngày (hoặc dài hạn) → lưu đơn.
// Không tự suy số ngày từ tổng số lượng: gợi ý chỉ ở form và cần người duyệt bấm "Áp dụng".
export async function approvePrescription(
  store: ReviewStore,
  document: SourceDocument,
  data: PrescriptionDraft,
): Promise<ApproveOutcome> {
  if (!data.issuedDate) return DATE_REQUIRED;
  const invalidItemIndexes = findIncompleteDoseItems(data.items);
  if (invalidItemIndexes.length > 0) return { ok: false, code: 'ERR_DOSE_INFO_MISSING', invalidItemIndexes };
  const prescription = await store.insertPrescription({
    healthProfileId: document.healthProfileId,
    sourceDocumentId: document.id,
    issuedDate: data.issuedDate,
    facility: data.facility,
    diagnosis: data.diagnosis,
    manualWithoutSource: false,
    items: data.items.map((item) => ({
      ...item,
      // Đã kiểm ở findIncompleteDoseItems.
      quantityPerDose: item.quantityPerDose!,
      durationDays: item.longTerm ? null : item.durationDays,
    })),
  });
  return approved(await store.markApproved(document.id, data.issuedDate), { prescription });
}
