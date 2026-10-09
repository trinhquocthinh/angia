import { findIncompleteDoseItems } from '@src/features/prescriptions/domain/findIncompleteDoseItems.js';
import type { PrescriptionDraft } from './approvalDrafts.js';
import { DATE_REQUIRED, provenance, saved, type RecordTarget, type SaveOutcome } from './approvalOutcome.js';
import { findPrescriptionDuplicate } from './findDuplicateRecord.js';
import type { ReviewStore } from './reviewPorts.js';

// SPEC-010 + BR-025: ngày kê bắt buộc → mọi dòng đủ liều/buổi/số ngày (hoặc dài hạn) → kiểm trùng
// (SPEC-012) → lưu đơn.
// Không tự suy số ngày từ tổng số lượng: gợi ý chỉ ở form và cần người duyệt bấm "Áp dụng".
export async function savePrescription(
  store: ReviewStore,
  target: RecordTarget,
  data: PrescriptionDraft,
  confirmDuplicate: boolean,
): Promise<SaveOutcome> {
  if (!data.issuedDate) return DATE_REQUIRED;
  const invalidItemIndexes = findIncompleteDoseItems(data.items);
  if (invalidItemIndexes.length > 0) return { ok: false, code: 'ERR_DOSE_INFO_MISSING', invalidItemIndexes };
  const { issuedDate } = data;
  const duplicate = confirmDuplicate
    ? null
    : await findPrescriptionDuplicate(store, target.healthProfileId, { ...data, issuedDate });
  if (duplicate) return duplicate;
  const prescription = await store.insertPrescription({
    ...provenance(target),
    issuedDate: data.issuedDate,
    facility: data.facility,
    diagnosis: data.diagnosis,
    items: data.items.map((item) => ({
      ...item,
      // Đã kiểm ở findIncompleteDoseItems.
      quantityPerDose: item.quantityPerDose!,
      durationDays: item.longTerm ? null : item.durationDays,
    })),
  });
  return saved(data.issuedDate, { prescription });
}
