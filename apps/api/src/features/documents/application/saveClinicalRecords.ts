import type { ApprovalDraft } from './approvalDrafts.js';
import type { RecordTarget, SaveOutcome } from './approvalOutcome.js';
import type { ReviewStore } from './reviewPorts.js';
import { saveDeviceReading } from './saveDeviceReading.js';
import { saveLabResult } from './saveLabResult.js';
import { savePrescription } from './savePrescription.js';

// Kiểm tra nghiệp vụ SPEC-010 theo loại rồi lưu; dùng chung cho duyệt, nhập tay theo ảnh và nhập trực tiếp (SPEC-011).
export function saveClinicalRecords(
  store: ReviewStore,
  target: RecordTarget,
  draft: ApprovalDraft,
): Promise<SaveOutcome> {
  const duplicate = draft.confirmDuplicate ?? false;
  switch (draft.type) {
    case 'device_reading':
      return saveDeviceReading(store, target, draft.data, {
        outOfRange: draft.confirmOutOfRange ?? false,
        duplicate,
      });
    case 'prescription':
      return savePrescription(store, target, draft.data, duplicate);
    case 'lab_result':
      return saveLabResult(store, target, draft.data, duplicate);
  }
}
