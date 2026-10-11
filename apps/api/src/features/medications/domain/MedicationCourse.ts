import type { DoseSlot } from '@src/features/prescriptions/domain/Prescription.js';
import type { MedicationCoursePeriod } from './MedicationCoursePeriod.js';

export type NewMedicationCourse = MedicationCoursePeriod & {
  readonly healthProfileId: string;
  readonly prescriptionItemId: string | null;
  readonly source: 'prescription' | 'self_reported';
  readonly name: string;
  /** Hàm lượng thuốc bổ; thuốc từ đơn tiếp tục đọc qua PrescriptionItem. */
  readonly strength?: string | null;
  readonly nameNormalized: string;
  readonly quantityPerDose: number;
  readonly doseUnit: string | null;
  readonly slots: readonly DoseSlot[];
};

export type MedicationCourse = NewMedicationCourse & { readonly id: string };
