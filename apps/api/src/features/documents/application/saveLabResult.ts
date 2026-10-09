import type { LabResultDraft } from './approvalDrafts.js';
import { DATE_REQUIRED, provenance, saved, type RecordTarget, type SaveOutcome } from './approvalOutcome.js';
import { findLabResultDuplicate } from './findDuplicateRecord.js';
import type { ReviewStore } from './reviewPorts.js';

// SPEC-010 + BR-022: ngày trả kết quả bắt buộc → kiểm trùng (SPEC-012) → mỗi chỉ số một dòng, giữ nguyên văn phiếu.
export async function saveLabResult(
  store: ReviewStore,
  target: RecordTarget,
  data: LabResultDraft,
  confirmDuplicate: boolean,
): Promise<SaveOutcome> {
  const { resultDate, facility } = data;
  if (!resultDate) return DATE_REQUIRED;
  const duplicate = confirmDuplicate
    ? null
    : await findLabResultDuplicate(store, target.healthProfileId, { ...data, resultDate });
  if (duplicate) return duplicate;
  const labResults = await store.insertLabResults(
    data.items.map((item) => ({ ...item, ...provenance(target), resultDate, facility })),
  );
  return saved(resultDate, { labResults });
}
