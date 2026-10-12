import { planMedicationConflicts } from '@src/features/medications/domain/planMedicationConflicts.js';
import { createPrescriptionCourses } from '@src/features/medications/domain/createPrescriptionCourses.js';
import { findIncompleteDoseItems } from '@src/features/prescriptions/domain/findIncompleteDoseItems.js';
import type { PrescriptionDraft } from './approvalDrafts.js';
import { DATE_REQUIRED, provenance, saved, type RecordTarget, type SaveOutcome } from './approvalOutcome.js';
import { findPrescriptionDuplicate } from './findDuplicateRecord.js';
import type { ReviewStore } from './reviewPorts.js';

// SPEC-010 + BR-025: ngày kê bắt buộc → mọi dòng đủ liều/buổi/số ngày (hoặc dài hạn) → kiểm trùng
// (SPEC-012) → kiểm và giải quyết xung đột (SPEC-015) → lưu đơn + đợt trong cùng transaction.
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
  await store.lockMedicationProfile(target.healthProfileId);
  const duplicate = confirmDuplicate
    ? null
    : await findPrescriptionDuplicate(store, target.healthProfileId, { ...data, issuedDate });
  if (duplicate) return duplicate;
  const plan = planMedicationConflicts(
    await store.findMedicationCourses(target.healthProfileId),
    data.items,
    issuedDate,
  );
  if (!plan.ok) return { ok: false, code: 'ERR_COURSE_CONFLICT_UNRESOLVED', conflicts: plan.conflicts };
  await store.replaceMedicationCourses(
    target.healthProfileId,
    plan.replaceCourseIds,
    plan.replacementEndDate,
  );
  const prescription = await store.insertPrescription({
    ...provenance(target),
    issuedDate: data.issuedDate,
    facility: data.facility,
    diagnosis: data.diagnosis,
    items: data.items.map((item) => ({
      name: item.name,
      strength: item.strength,
      doseUnit: item.doseUnit,
      slots: item.slots,
      longTerm: item.longTerm,
      note: item.note,
      totalQuantity: item.totalQuantity,
      // Dữ liệu lựa chọn chỉ thuộc lệnh lưu, không chép vào PrescriptionItem.
      quantityPerDose: item.quantityPerDose,
      externalUse: item.externalUse,
      durationDays: item.longTerm ? null : item.durationDays,
    })),
  });
  await store.insertMedicationCourses(createPrescriptionCourses(prescription));
  return saved(data.issuedDate, { prescription });
}
