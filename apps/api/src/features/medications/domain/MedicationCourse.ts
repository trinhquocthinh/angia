import type { DoseSlot } from '@src/features/prescriptions/domain/Prescription.js';
import type { MedicationCoursePeriod } from './MedicationCoursePeriod.js';

export type NewMedicationCourse = MedicationCoursePeriod & {
  readonly healthProfileId: string;
  readonly prescriptionItemId: string | null;
  readonly source: 'prescription' | 'self_reported';
  readonly name: string;
  readonly nameNormalized: string;
  readonly quantityPerDose: number;
  readonly doseUnit: string | null;
  readonly slots: readonly DoseSlot[];
};

export type MedicationCourse = NewMedicationCourse & { readonly id: string };
