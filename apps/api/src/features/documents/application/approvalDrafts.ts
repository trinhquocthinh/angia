import type { MeasurementValues } from '@src/features/measurements/domain/Measurement.js';
import type { DoseSlot } from '@src/features/prescriptions/domain/Prescription.js';

// Bản đối soát người duyệt gửi lên (SPEC-010); hợp đồng HTTP đã kiểm hình dạng, use case kiểm nghiệp vụ.
export interface DeviceReadingDraft extends MeasurementValues {
  type: 'device_reading';
  measuredAt: string | null;
  measuredTime: string | null;
}

interface PrescriptionItemDraft {
  name: string;
  strength: string | null;
  quantityPerDose: number | null;
  doseUnit: string | null;
  slots: DoseSlot[];
  durationDays: number | null;
  longTerm: boolean;
  note: string | null;
  totalQuantity: number | null;
}

export interface PrescriptionDraft {
  type: 'prescription';
  issuedDate: string | null;
  facility: string | null;
  diagnosis: string | null;
  items: PrescriptionItemDraft[];
}

export interface LabResultDraft {
  type: 'lab_result';
  resultDate: string | null;
  facility: string | null;
  items: { testName: string; value: string; unit: string | null; referenceRange: string | null }[];
}

// `confirmDuplicate`: người duyệt chủ ý lưu thêm dù trùng chứng từ đã lưu (SPEC-012, BR-017).
type Confirmable = { confirmDuplicate?: boolean | undefined };
export type ApprovalDraft = Confirmable &
  (
    | { type: 'device_reading'; data: DeviceReadingDraft; confirmOutOfRange?: boolean | undefined }
    | { type: 'prescription'; data: PrescriptionDraft }
    | { type: 'lab_result'; data: LabResultDraft }
  );
